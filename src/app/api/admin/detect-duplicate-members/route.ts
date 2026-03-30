import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface Member {
  id: string;
  full_name: string;
  email: string;
}

interface DuplicatePair {
  member1: Member;
  member2: Member;
  similarityScore: number; // 0-100
  reason: string; // Why they might be duplicates
}

// Helper: Calculate string similarity using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = track[str2.length][str1.length];
  const maxLen = Math.max(str1.length, str2.length);
  return Math.round((1 - distance / maxLen) * 100);
}

// Helper: Check if names might be the same person
function checkNameSimilarity(name1: string, name2: string): { score: number; reason: string } {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  // Exact match
  if (n1 === n2) {
    return { score: 100, reason: 'Nama identik' };
  }

  // Levenshtein similarity
  const similarity = levenshteinDistance(n1, n2);

  // Extract first and last names
  const name1Parts = n1.split(/\s+/);
  const name2Parts = n2.split(/\s+/);

  const firstname1 = name1Parts[0];
  const firstname2 = name2Parts[0];
  const lastname1 = name1Parts[name1Parts.length - 1];
  const lastname2 = name2Parts[name2Parts.length - 1];

  // Check if first/last names match
  if (firstname1 === firstname2 && lastname1 === lastname2) {
    return { score: 95, reason: 'Nama depan dan belakang sama (mungkin penulisan berbeda)' };
  }

  // Check if first name match but middle name different (common variation)
  if (firstname1 === firstname2 && similarity >= 75) {
    return { score: Math.max(similarity, 80), reason: 'Nama depan sama, kemungkinan variasi nama tengah' };
  }

  // Check if similar enough
  if (similarity >= 85) {
    return { score: similarity, reason: 'Nama sangat mirip (kemungkinan typo atau alias)' };
  }

  if (similarity >= 75) {
    return { score: similarity, reason: 'Ada kesamaan signifikan dalam nama' };
  }

  return { score: similarity, reason: '' };
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all members
    const { data: members, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name');

    if (fetchError || !members) {
      throw fetchError || new Error('Failed to fetch members');
    }

    // Find potential duplicates using name similarity
    const duplicates: DuplicatePair[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const m1 = members[i];
        const m2 = members[j];

        // Skip if already processed
        const pairKey = `${m1.id}|${m2.id}`;
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const { score, reason } = checkNameSimilarity(m1.full_name, m2.full_name);

        // Only flag if similarity is high enough
        if (score >= 75 && reason) {
          duplicates.push({
            member1: m1,
            member2: m2,
            similarityScore: score,
            reason,
          });
        }
      }
    }

    // If we found duplicates, use AI to refine the analysis
    let aiRefinedDuplicates = duplicates;
    if (duplicates.length > 0) {
      const duplicatesList = duplicates
        .map((d) => `- "${d.member1.full_name}" (${d.member1.email}) vs "${d.member2.full_name}" (${d.member2.email})`)
        .join('\n');

      const prompt = `Kamu adalah asisten admin untuk sistem manajemen member. Analisis pasangan member berikut yang mungkin duplikat:

${duplicatesList}

Untuk SETIAP pasangan, keputusan:
1. LIKELY DUPLICATE - Kemungkinan besar akun sama orang
2. POSSIBLE DUPLICATE - Mungkin alias atau variasi nama
3. NOT DUPLICATE - Nama mirip tapi orang beda

Respons dengan JSON array:
[
  {
    "confidence": "LIKELY_DUPLICATE" | "POSSIBLE_DUPLICATE" | "NOT_DUPLICATE",
    "similarity": 95,
    "reasoning": "Penjelasan singkat"
  }
]

Pertimbangkan:
- Kesamaan nama depan/belakang
- Typo umum Indonesia (e.g., "Ahmad" vs "Achmad")
- Nama panggilan vs nama lengkap
- Email domain (jika email berbeda tapi nama sama, lebih mungkin duplikat)`;

      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash-lite',
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse AI response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const aiResults = JSON.parse(jsonMatch[0]);

            // Update duplicates with AI confidence
            aiRefinedDuplicates = duplicates
              .map((d, idx) => {
                const aiResult = aiResults[idx];
                if (aiResult?.confidence === 'NOT_DUPLICATE') {
                  return null; // Filter out non-duplicates
                }
                return {
                  ...d,
                  similarityScore: aiResult?.similarity || d.similarityScore,
                  reason: aiResult?.reasoning || d.reason,
                  aiConfidence: aiResult?.confidence,
                };
              })
              .filter(Boolean) as DuplicatePair[];
          } catch (parseErr) {
            console.error('Failed to parse AI response:', parseErr);
            // Fall back to rule-based results
          }
        }
      } catch (aiErr) {
        console.error('AI analysis failed, using rule-based results:', aiErr);
        // Continue with rule-based results
      }
    }

    return NextResponse.json({
      success: true,
      duplicateCount: aiRefinedDuplicates.length,
      duplicates: aiRefinedDuplicates.slice(0, 20), // Return top 20 most similar
      totalMembers: members.length,
    });
  } catch (error) {
    console.error('[detect-duplicate-members]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to detect duplicates' },
      { status: 500 }
    );
  }
}
