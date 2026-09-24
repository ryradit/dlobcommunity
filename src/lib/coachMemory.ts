/**
 * DLOB AI Coach — Knowledge Graph & Persistent Memory Engine
 * 
 * Provides long-term memory, entity relationships (skills, weaknesses, opponents, partners),
 * and progressive metric tracking across coaching sessions.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Entity Types supported by the badminton knowledge graph
export type MemoryEntityType =
  | 'player'
  | 'opponent'
  | 'partner'
  | 'skill'
  | 'weakness'
  | 'drill'
  | 'match_event'
  | 'insight'
  | 'goal'
  | 'video_analysis';

// Relationship Types (Graph Edges)
export type MemoryRelationType =
  | 'weak_at'
  | 'strong_at'
  | 'lost_to'
  | 'beat'
  | 'partners_with'
  | 'trained_with_drill'
  | 'improved_by'
  | 'caused_by'
  | 'related_to'
  | 'measured_at'
  | 'video_showed';

export interface CoachMemoryEntity {
  id: string;
  user_id: string;
  entity_type: MemoryEntityType;
  name: string;
  properties: Record<string, any>;
  confidence: number;
  first_seen_at: string;
  last_seen_at: string;
  mention_count: number;
  source_session_id?: string | null;
  created_at?: string;
}

export interface CoachMemoryEdge {
  id: string;
  user_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: MemoryRelationType;
  weight: number;
  properties: Record<string, any>;
  evidence_session_id?: string | null;
  created_at?: string;
  updated_at?: string;
  source_entity?: CoachMemoryEntity;
  target_entity?: CoachMemoryEntity;
}

export interface CoachMemorySnapshot {
  id: string;
  user_id: string;
  entity_id?: string | null;
  metric_name: string;
  metric_value: number;
  measured_at: string;
  source?: string;
  created_at?: string;
  entity_name?: string;
}

export interface RetrievedMemoryContext {
  entities: CoachMemoryEntity[];
  edges: CoachMemoryEdge[];
  snapshots: CoachMemorySnapshot[];
  contextText: string;
  summary: {
    totalEntities: number;
    topWeaknesses: string[];
    knownPartners: string[];
    knownOpponents: string[];
  };
}

/**
 * Calculates temporal decay for entity confidence.
 * Half-life of ~90 days if not re-mentioned, with floor at 0.25.
 */
export function calculateDecayedConfidence(confidence: number, lastSeenAt: string): number {
  const lastSeen = new Date(lastSeenAt).getTime();
  const now = Date.now();
  const daysElapsed = Math.max(0, (now - lastSeen) / (1000 * 60 * 60 * 24));
  // Half-life of 90 days: decay factor = 0.5 ^ (daysElapsed / 90)
  const decayFactor = Math.pow(0.5, daysElapsed / 90);
  const decayed = confidence * decayFactor;
  return Math.max(0.25, Math.min(1.0, Math.round(decayed * 100) / 100));
}

/**
 * Normalizes entity name for matching (e.g., "Backhand Clear" -> "backhand clear")
 */
function normalizeName(name: string): string {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Extracts potential entity search terms from a user query
 */
function extractSearchTerms(query: string): string[] {
  const clean = query.toLowerCase().replace(/[?!.,;:()_"[\]]/g, ' ');
  const tokens = clean.split(/\s+/).filter(t => t.length > 2);
  const stopWords = new Set([
    'saya', 'kamu', 'coach', 'bagaimana', 'cara', 'tolong', 'analisis', 'untuk',
    'yang', 'bisa', 'dengan', 'dari', 'pada', 'dan', 'ini', 'itu', 'adalah', 'apa',
    'apakah', 'sudah', 'akan', 'lebih', 'agar', 'mau', 'dong', 'hari', 'kemarin'
  ]);
  return tokens.filter(t => !stopWords.has(t));
}

/**
 * Retrieves relevant knowledge graph entities, connected edges, and metric snapshots
 * for a user's current coaching prompt.
 */
export async function retrieveRelevantMemory(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  options: { limit?: number } = {}
): Promise<RetrievedMemoryContext> {
  const limit = options.limit || 8;

  try {
    // 1. Fetch user entities (ordered by mention count and recency)
    const { data: allEntities, error: entErr } = await supabase
      .from('coach_memory_entities')
      .select('*')
      .eq('user_id', userId)
      .order('mention_count', { ascending: false })
      .limit(30);

    if (entErr || !allEntities || allEntities.length === 0) {
      return {
        entities: [],
        edges: [],
        snapshots: [],
        contextText: '',
        summary: {
          totalEntities: 0,
          topWeaknesses: [],
          knownPartners: [],
          knownOpponents: [],
        },
      };
    }

    const searchTerms = extractSearchTerms(query);
    const queryLower = query.toLowerCase();

    // Score entities by keyword match, mention count, and decayed confidence
    const scoredEntities = allEntities.map(entity => {
      const entName = entity.name.toLowerCase();
      let matchScore = 0;

      // Exact substring match in query
      if (queryLower.includes(entName) || entName.includes(queryLower)) {
        matchScore += 10;
      }

      // Token overlap
      for (const term of searchTerms) {
        if (entName.includes(term)) {
          matchScore += 3;
        }
      }

      // Base weight from mention count and confidence decay
      const decayedConf = calculateDecayedConfidence(entity.confidence ?? 1.0, entity.last_seen_at);
      const score = matchScore * 5 + (entity.mention_count || 1) * 2 + decayedConf * 3;

      return {
        ...entity,
        confidence: decayedConf,
        score,
      };
    });

    // Select top relevant entities
    scoredEntities.sort((a, b) => b.score - a.score);
    const relevantEntities = scoredEntities.slice(0, limit);
    const relevantEntityIds = relevantEntities.map(e => e.id);

    // 2. Fetch connected edges (1-hop traversal)
    let relevantEdges: CoachMemoryEdge[] = [];
    if (relevantEntityIds.length > 0) {
      const { data: edgesData, error: edgeErr } = await supabase
        .from('coach_memory_edges')
        .select('*')
        .eq('user_id', userId)
        .or(`source_entity_id.in.(${relevantEntityIds.join(',')}),target_entity_id.in.(${relevantEntityIds.join(',')})`)
        .limit(20);

      if (!edgeErr && edgesData) {
        relevantEdges = edgesData as CoachMemoryEdge[];
      }
    }

    // 3. Fetch snapshots for relevant entities to track progression over time
    let relevantSnapshots: CoachMemorySnapshot[] = [];
    if (relevantEntityIds.length > 0) {
      const { data: snapData, error: snapErr } = await supabase
        .from('coach_memory_snapshots')
        .select('*')
        .eq('user_id', userId)
        .in('entity_id', relevantEntityIds)
        .order('measured_at', { ascending: true })
        .limit(15);

      if (!snapErr && snapData) {
        relevantSnapshots = snapData as CoachMemorySnapshot[];
      }
    }

    // Map entity map for quick edge resolution
    const entityMap = new Map<string, CoachMemoryEntity>();
    for (const ent of allEntities) {
      entityMap.set(ent.id, ent);
    }

    // Build human and LLM readable Context String
    const formattedEntityBlocks = relevantEntities.map(ent => {
      const firstSeen = new Date(ent.first_seen_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const lastSeen = new Date(ent.last_seen_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      // Find connected relationships
      const connectedEdges = relevantEdges.filter(
        edge => edge.source_entity_id === ent.id || edge.target_entity_id === ent.id
      );

      const relationshipsStr = connectedEdges.map(edge => {
        const isSource = edge.source_entity_id === ent.id;
        const otherId = isSource ? edge.target_entity_id : edge.source_entity_id;
        const otherName = entityMap.get(otherId)?.name || 'Entitas Terkait';
        const relType = edge.relation_type;
        const propStr = edge.properties && Object.keys(edge.properties).length > 0
          ? ` (${JSON.stringify(edge.properties)})`
          : '';
        return isSource
          ? `  ├── Relasi: [${relType}] → "${otherName}"${propStr}`
          : `  ├── Relasi: "${otherName}" → [${relType}]${propStr}`;
      });

      // Find metric snapshots (progression)
      const snapshots = relevantSnapshots.filter(s => s.entity_id === ent.id);
      const progressionStr = snapshots.length > 0
        ? `  └── Riwayat Metrik: ${snapshots.map(s => `${s.metric_name}: ${s.metric_value} (${new Date(s.measured_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`).join(' → ')}`
        : null;

      const lines = [
        `• ENTITAS: "${ent.name}" [Tipe: ${ent.entity_type}, Keyakinan: ${Math.round(ent.confidence * 100)}%]`,
        `  ├── Pertama kali dianalisis: ${firstSeen} | Frekuensi disebut: ${ent.mention_count}x | Terakhir: ${lastSeen}`,
      ];

      if (relationshipsStr.length > 0) {
        lines.push(...relationshipsStr);
      }
      if (progressionStr) {
        lines.push(progressionStr);
      }
      if (ent.properties && Object.keys(ent.properties).length > 0) {
        lines.push(`  └── Catatan Teknis: ${JSON.stringify(ent.properties)}`);
      }

      return lines.join('\n');
    });

    const contextText = formattedEntityBlocks.length > 0
      ? `
🧠 KNOWLEDGE GRAPH & PERSISTENT MEMORY (Ingatan Jangka Panjang Pelatih):
Pelatih mengingat riwayat mendalam tentang pemain ini dari sesi-sesi sebelumnya:
${formattedEntityBlocks.join('\n\n')}

ATURAN MEMORI:
- Manfaatkan entitas dan relasi di atas untuk menunjukkan bahwa Anda mengingat riwayat detail pemain (misal: perubahan metrik, partner langganan, atau drill terdahulu).
- Jika ada riwayat metrik (misal efisiensi atau akurasi berkembang), bandingkan secara eksplisit untuk menunjukkan progres.
`
      : '';

    // Summary metadata for UI
    const topWeaknesses = allEntities
      .filter(e => e.entity_type === 'weakness')
      .slice(0, 3)
      .map(e => e.name);

    const knownPartners = allEntities
      .filter(e => e.entity_type === 'partner')
      .slice(0, 3)
      .map(e => e.name);

    const knownOpponents = allEntities
      .filter(e => e.entity_type === 'opponent')
      .slice(0, 3)
      .map(e => e.name);

    return {
      entities: relevantEntities,
      edges: relevantEdges,
      snapshots: relevantSnapshots,
      contextText,
      summary: {
        totalEntities: allEntities.length,
        topWeaknesses,
        knownPartners,
        knownOpponents,
      },
    };
  } catch (err) {
    console.error('[CoachMemory] Error retrieving memory graph:', err);
    return {
      entities: [],
      edges: [],
      snapshots: [],
      contextText: '',
      summary: {
        totalEntities: 0,
        topWeaknesses: [],
        knownPartners: [],
        knownOpponents: [],
      },
    };
  }
}

/**
 * Extracts entities, graph edges, and metric snapshots from a completed coaching exchange.
 * Executes both deterministic extraction from structured insights + AI entity linking.
 */
export async function extractAndSaveMemories(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  response: string,
  insights?: any,
  memberName?: string,
  sessionId?: string
): Promise<{ savedEntities: number; savedEdges: number }> {
  if (!userId) return { savedEntities: 0, savedEdges: 0 };

  try {
    const extractedEntities: Array<{
      type: MemoryEntityType;
      name: string;
      properties?: Record<string, any>;
      confidence?: number;
    }> = [];

    const extractedEdges: Array<{
      source: string;
      target: string;
      relation: MemoryRelationType;
      weight?: number;
      properties?: Record<string, any>;
    }> = [];

    const extractedSnapshots: Array<{
      entityName: string;
      metricName: string;
      metricValue: number;
    }> = [];

    const playerNodeName = memberName || 'Pemain';

    // 1. DETERMINISTIC EXTRACTION from Structured Insights
    if (insights?.keyFinding?.title) {
      extractedEntities.push({
        type: 'insight',
        name: insights.keyFinding.title,
        properties: {
          severity: insights.keyFinding.severity,
          stats: insights.keyFinding.stats,
        },
        confidence: 0.95,
      });

      extractedEdges.push({
        source: playerNodeName,
        target: insights.keyFinding.title,
        relation: 'related_to',
        weight: 0.9,
      });
    }

    if (Array.isArray(insights?.actionItems)) {
      for (const item of insights.actionItems) {
        if (item.title) {
          extractedEntities.push({
            type: 'drill',
            name: item.title,
            properties: {
              description: item.description,
              timeframe: item.timeframe,
              expectedOutcome: item.expectedOutcome,
              priority: item.priority,
            },
            confidence: 0.9,
          });

          extractedEdges.push({
            source: playerNodeName,
            target: item.title,
            relation: 'trained_with_drill',
            weight: 0.85,
          });
        }
      }
    }

    if (insights?.expectedResults?.metric && insights?.expectedResults?.target) {
      extractedEntities.push({
        type: 'goal',
        name: `${insights.expectedResults.metric}: ${insights.expectedResults.target}`,
        properties: {
          timeframe: insights.expectedResults.timeframe,
          target: insights.expectedResults.target,
        },
        confidence: 0.9,
      });
    }

    // 2. GEMINI AI STRUCTURED EXTRACTION (Extract fine-grained badminton entities & relationships)
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const extractionPrompt = `
Anda adalah Knowledge Graph Extractor spesialis bulutangkis (badminton).
Ekstraksi entitas penting, hubungan (edges), dan metrik dari percakapan coaching berikut.

PERCAKAPAN:
Pemain: "${query}"
Coach: "${response.substring(0, 1500)}"

KETENTUAN OUTPUT JSON:
Kembalikan JSON dengan format persis:
{
  "entities": [
    {
      "type": "weakness" | "skill" | "opponent" | "partner" | "drill" | "goal",
      "name": "Nama entitas spesifik (misal: 'Backhand Clear', 'Wiwin', 'Footwork 6 Sudut')",
      "confidence": 0.8 to 1.0,
      "properties": {}
    }
  ],
  "relationships": [
    {
      "source": "Nama entitas sumber",
      "target": "Nama entitas target",
      "relation": "weak_at" | "strong_at" | "lost_to" | "beat" | "partners_with" | "trained_with_drill" | "improved_by" | "caused_by" | "related_to",
      "weight": 0.7 to 1.0,
      "properties": {}
    }
  ],
  "snapshots": [
    {
      "entityName": "Nama entitas terkait (misal 'Backhand Clear' atau 'Rotasi Sirkular')",
      "metricName": "Nama metrik (misal: 'efficiency', 'win_rate', 'accuracy')",
      "metricValue": 79
    }
  ]
}

Aturan:
- Jangan sertakan entitas generik seperti "Badminton" atau "Bola".
- Hanya ekstrak nama orang nyata, teknik/kelemahan nyata, nama drill spesifik, atau skor angka nyata.
- Jika tidak ada entitas relevan, kembalikan array kosong.
`;

      const result = await model.generateContent(extractionPrompt);
      const text = result.response.text();
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.entities)) {
          extractedEntities.push(...parsed.entities);
        }
        if (Array.isArray(parsed.relationships)) {
          extractedEdges.push(...parsed.relationships);
        }
        if (Array.isArray(parsed.snapshots)) {
          extractedSnapshots.push(...parsed.snapshots);
        }
      }
    } catch (aiErr) {
      console.warn('[CoachMemory] AI extraction skipped or failed, using deterministic insights:', aiErr);
    }

    // 3. PERSIST ENTITIES (Upsert with mention count increment)
    let savedEntitiesCount = 0;
    const entityNameToId = new Map<string, string>();

    // Also ensure the player node exists
    extractedEntities.unshift({
      type: 'player',
      name: playerNodeName,
      properties: { role: 'user' },
      confidence: 1.0,
    });

    for (const ent of extractedEntities) {
      if (!ent.name || ent.name.trim().length === 0) continue;
      const cleanName = ent.name.trim();
      const normKey = normalizeName(cleanName);

      try {
        // Check existing entity
        const { data: existing } = await supabase
          .from('coach_memory_entities')
          .select('id, mention_count, confidence, properties')
          .eq('user_id', userId)
          .eq('entity_type', ent.type)
          .ilike('name', cleanName)
          .maybeSingle();

        if (existing) {
          entityNameToId.set(normKey, existing.id);
          const updatedCount = (existing.mention_count || 1) + 1;
          const mergedProps = { ...(existing.properties || {}), ...(ent.properties || {}) };

          await supabase
            .from('coach_memory_entities')
            .update({
              mention_count: updatedCount,
              last_seen_at: new Date().toISOString(),
              confidence: Math.min(1.0, (existing.confidence || 0.8) + 0.05),
              properties: mergedProps,
            })
            .eq('id', existing.id);

          savedEntitiesCount++;
        } else {
          // Insert new entity
          const { data: inserted, error: insErr } = await supabase
            .from('coach_memory_entities')
            .insert({
              user_id: userId,
              entity_type: ent.type,
              name: cleanName,
              properties: ent.properties || {},
              confidence: ent.confidence || 0.85,
              first_seen_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
              mention_count: 1,
              source_session_id: sessionId || null,
            })
            .select('id')
            .single();

          if (!insErr && inserted) {
            entityNameToId.set(normKey, inserted.id);
            savedEntitiesCount++;
          }
        }
      } catch (upsertErr) {
        console.warn(`[CoachMemory] Error upserting entity ${cleanName}:`, upsertErr);
      }
    }

    // 4. PERSIST EDGES
    let savedEdgesCount = 0;
    for (const edge of extractedEdges) {
      const srcId = entityNameToId.get(normalizeName(edge.source));
      const tgtId = entityNameToId.get(normalizeName(edge.target));

      if (srcId && tgtId && srcId !== tgtId) {
        try {
          const { data: existingEdge } = await supabase
            .from('coach_memory_edges')
            .select('id, weight')
            .eq('user_id', userId)
            .eq('source_entity_id', srcId)
            .eq('target_entity_id', tgtId)
            .eq('relation_type', edge.relation)
            .maybeSingle();

          if (existingEdge) {
            await supabase
              .from('coach_memory_edges')
              .update({
                weight: Math.min(1.0, (existingEdge.weight || 0.8) + 0.1),
                updated_at: new Date().toISOString(),
                properties: edge.properties || {},
              })
              .eq('id', existingEdge.id);
            savedEdgesCount++;
          } else {
            await supabase
              .from('coach_memory_edges')
              .insert({
                user_id: userId,
                source_entity_id: srcId,
                target_entity_id: tgtId,
                relation_type: edge.relation,
                weight: edge.weight || 0.85,
                properties: edge.properties || {},
                evidence_session_id: sessionId || null,
              });
            savedEdgesCount++;
          }
        } catch (edgeErr) {
          console.warn('[CoachMemory] Error saving edge:', edgeErr);
        }
      }
    }

    // 5. PERSIST SNAPSHOTS
    for (const snap of extractedSnapshots) {
      const entId = entityNameToId.get(normalizeName(snap.entityName));
      if (snap.metricName && typeof snap.metricValue === 'number' && !isNaN(snap.metricValue)) {
        try {
          await supabase
            .from('coach_memory_snapshots')
            .insert({
              user_id: userId,
              entity_id: entId || null,
              metric_name: snap.metricName,
              metric_value: snap.metricValue,
              source: 'coach_session',
              measured_at: new Date().toISOString(),
            });
        } catch (snapErr) {
          console.warn('[CoachMemory] Error saving snapshot:', snapErr);
        }
      }
    }

    console.log(`[CoachMemory] Saved ${savedEntitiesCount} entities and ${savedEdgesCount} relationships for user ${userId}`);
    return { savedEntities: savedEntitiesCount, savedEdges: savedEdgesCount };
  } catch (error) {
    console.error('[CoachMemory] Error during extractAndSaveMemories:', error);
    return { savedEntities: 0, savedEdges: 0 };
  }
}

/**
 * Privacy Control: Fetch the entire graph of memories for user transparency
 */
export async function getUserMemoryGraph(supabase: SupabaseClient, userId: string) {
  const [entitiesRes, edgesRes, snapshotsRes] = await Promise.all([
    supabase
      .from('coach_memory_entities')
      .select('*')
      .eq('user_id', userId)
      .order('mention_count', { ascending: false }),
    supabase
      .from('coach_memory_edges')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('coach_memory_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .limit(30),
  ]);

  return {
    entities: entitiesRes.data || [],
    edges: edgesRes.data || [],
    snapshots: snapshotsRes.data || [],
  };
}

/**
 * Privacy Control: Clear all memory graph data for a user
 */
export async function clearUserMemories(supabase: SupabaseClient, userId: string): Promise<boolean> {
  try {
    await Promise.all([
      supabase.from('coach_memory_edges').delete().eq('user_id', userId),
      supabase.from('coach_memory_snapshots').delete().eq('user_id', userId),
    ]);
    await supabase.from('coach_memory_entities').delete().eq('user_id', userId);
    return true;
  } catch (err) {
    console.error('[CoachMemory] Error clearing user memories:', err);
    return false;
  }
}
