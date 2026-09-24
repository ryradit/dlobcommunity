'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, BarChart3, Target, Sparkles, Video, Copy, Check, RotateCw, Brain, Trash2, Network } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client at module level for consistent auth session
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MemoryEntityItem {
  name: string;
  type: string;
  confidence: number;
  mentions: number;
}

interface Message {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
  isCached?: boolean;
  cachedAt?: string;
  originalQuery?: string;
  memoryEntities?: MemoryEntityItem[];
}

interface ActionItem {
  type: 'strength' | 'weakness' | 'goal' | 'milestone';
  title: string;
  description: string;
  progress?: number;
  expectedOutcome?: string;
}

interface WeaknessOption {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'moderate' | 'minor';
  affectedMatches: number;
  impact: string;
}

interface CoachingSession {
  id: string;
  created_at: string;
  query: string;
  response: string;
  response_type: 'ask_weakness' | 'provide_analysis';
  key_finding?: {
    severity: 'critical' | 'moderate' | 'minor';
    title: string;
    stats?: string[];
  };
  action_items?: Array<{
    title: string;
    description: string;
    expectedOutcome?: string;
  }>;
}

interface CoachingChatProps {
  memberName: string;
  onClose?: () => void;
  initialQuery?: string;
  onQueryConsumed?: () => void;
  completedDrills?: Record<string, boolean>;
  activeVideoAnalysis?: any;
  onClearVideoContext?: () => void;
}

function parseInlineMarkdown(text: string): React.ReactNode {
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-extrabold text-gray-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-gray-800 dark:text-zinc-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="font-mono text-xs px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 font-bold">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedCoachMessage({ content }: { content: string }) {
  let displayContent = content;

  // Defensive: if content is stringified JSON containing "response"
  if (typeof displayContent === 'string' && displayContent.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(displayContent);
      if (parsed.response && typeof parsed.response === 'string') {
        displayContent = parsed.response;
      }
    } catch {
      const match = displayContent.match(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (match) {
        try {
          displayContent = JSON.parse(`"${match[1]}"`);
        } catch {
          displayContent = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
      }
    }
  }

  const lines = displayContent.split('\n');

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-gray-800 dark:text-zinc-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading: ### Title or ### **Title**
        if (trimmed.startsWith('### ')) {
          const headingText = trimmed.replace(/^###\s+/, '');
          return (
            <h4 key={idx} className="text-sm sm:text-base font-black text-gray-900 dark:text-white pt-2.5 pb-1 border-b border-gray-200/60 dark:border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{parseInlineMarkdown(headingText)}</span>
            </h4>
          );
        }

        // Bullet point: * or -
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const bulletText = trimmed.replace(/^[\*\-]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-emerald-500 font-bold mt-0.5 text-xs shrink-0">•</span>
              <div className="flex-1">{parseInlineMarkdown(bulletText)}</div>
            </div>
          );
        }

        // Numbered list: 1. 2. etc.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const rest = numMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">{num}.</span>
              <div className="flex-1">{parseInlineMarkdown(rest)}</div>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="leading-relaxed">
            {parseInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

const CoachingChat: React.FC<CoachingChatProps> = ({ 
  memberName, 
  onClose, 
  initialQuery, 
  onQueryConsumed, 
  completedDrills, 
  activeVideoAnalysis, 
  onClearVideoContext 
}) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [actualMemberName, setActualMemberName] = useState<string | null>(null);
  const [possibleMatchNames, setPossibleMatchNames] = useState<string[]>([]);
  const [showMatchNamePrompt, setShowMatchNamePrompt] = useState(true);
  const [weaknessOptions, setWeaknessOptions] = useState<WeaknessOption[]>([]);
  const [currentResponseType, setCurrentResponseType] = useState<'ask_weakness' | 'provide_analysis' | null>(null);
  const [keyFinding, setKeyFinding] = useState<any>(null);
  const [expectedResults, setExpectedResults] = useState<any>(null);
  const [coachingHistory, setCoachingHistory] = useState<CoachingSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState<CoachingSession | null>(null);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [pendingUserQuery, setPendingUserQuery] = useState<string | null>(null); // Track user's message until coach responds
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // Knowledge Graph & Persistent Memory State
  const [memoryInfo, setMemoryInfo] = useState<{
    totalRemembered: number;
    entities: MemoryEntityItem[];
    summary: any;
  } | null>(null);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [memoryGraphData, setMemoryGraphData] = useState<{
    entities: any[];
    edges: any[];
    snapshots: any[];
  } | null>(null);
  const [isLoadingMemory, setIsLoadingMemory] = useState(false);
  const [isClearingMemory, setIsClearingMemory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Quick prompt suggestions based on common coaching scenarios
  const quickPrompts = [
    { icon: '📊', text: 'Analisis form terakhir saya' },
    { icon: '🎯', text: 'Apa area untuk improvement?' },
    { icon: '👥', text: 'Partner terbaik saya siapa?' },
    { icon: '⚡', text: 'Gimme action plan' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch member profile and discover match names on component mount
  useEffect(() => {
    const fetchMemberData = async () => {
      if (!userId) return;

      try {
        // Fetch profile for display name
        const { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .select('full_name, username, display_name')
          .eq('user_id', userId)
          .single();

        let profileName = memberName;
        let searchNamesForMatches = [memberName.toLowerCase().trim()];

        if (!profileError && profileData) {
          profileName = profileData.display_name || profileData.full_name || profileData.username || memberName;
          setActualMemberName(profileName);
          
          // Collect all possible name variations to search with
          searchNamesForMatches = [
            profileData.display_name,
            profileData.full_name,
            profileData.username,
            memberName
          ]
            .filter((n): n is string => !!n)
            .map(n => n.toLowerCase().trim());
          
          console.log('[CoachingChat] Fetched member name:', profileName);
          console.log('[CoachingChat] Search names for matches:', searchNamesForMatches);
        } else {
          setActualMemberName(memberName);
        }

        // Fetch all unique names from matches table where member_id = userId
        const { data: matchesData, error: matchesError } = await supabaseClient
          .from('matches')
          .select('team1_player1, team1_player2, team2_player1, team2_player2')
          .eq('member_id', userId);

        if (!matchesError && matchesData && matchesData.length > 0) {
          // Collect all player names from this user's matches
          const uniqueNames = new Set<string>();
          
          matchesData.forEach((match: any) => {
            // Add only non-null, non-empty names
            if (match.team1_player1?.trim()) uniqueNames.add(match.team1_player1.trim());
            if (match.team1_player2?.trim()) uniqueNames.add(match.team1_player2.trim());
            if (match.team2_player1?.trim()) uniqueNames.add(match.team2_player1.trim());
            if (match.team2_player2?.trim()) uniqueNames.add(match.team2_player2.trim());
          });

          // Sort names alphabetically for better display
          const names = Array.from(uniqueNames).sort();
          
          if (names.length > 0) {
            setPossibleMatchNames(names);
            // Auto-select the first name if only one exists
            if (names.length === 1) {
              setActualMemberName(names[0]);
              setShowMatchNamePrompt(false);
            }
            console.log('[CoachingChat] Discovered match names for user:', names);
          } else {
            console.log('[CoachingChat] No matches found for this member_id:', userId);
          }
        } else if (matchesError) {
          console.warn('[CoachingChat] Error fetching matches:', matchesError.message);
        }
      } catch (error) {
        console.error('[CoachingChat] Failed to fetch member data:', error);
        setActualMemberName(memberName);
      }
    };

    fetchMemberData();
  }, [userId, memberName]);

  // Initialize or retrieve session ID on mount
  useEffect(() => {
    const initializeSession = async () => {
      if (!userId) {
        setIsLoadingSession(false);
        return;
      }

      try {
        // Check if there's an existing session in localStorage
        const storedSessionId = localStorage.getItem(`coaching_session_${userId}`);
        const sessionStartDate = localStorage.getItem(`coaching_session_${userId}_date`);
        
        // Check if stored session is from today
        const isToday = sessionStartDate ? new Date(sessionStartDate).toDateString() === new Date().toDateString() : false;

        // Validate UUID format - reject old format like "userId_timestamp"
        const isValidUUID = (id: string) => {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(id);
        };

        let currentSessionId = storedSessionId && isToday && isValidUUID(storedSessionId) ? storedSessionId : null;

        // If no valid session, create new one with proper UUID
        if (!currentSessionId) {
          // Generate a proper UUID for session_id (required for database column type)
          currentSessionId = crypto.randomUUID();
          localStorage.setItem(`coaching_session_${userId}`, currentSessionId);
          localStorage.setItem(`coaching_session_${userId}_date`, new Date().toISOString());
          console.log('[CoachingChat] Created new session:', currentSessionId);
        } else {
          console.log('[CoachingChat] Loaded existing session:', currentSessionId);
        }

        setSessionId(currentSessionId);

        // Fetch all messages from current session
        const { data: sessionMessages, error } = await supabaseClient
          .from('coaching_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('session_id', currentSessionId)
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('[CoachingChat] Error fetching current session messages:', error);
          setIsLoadingSession(false);
          return;
        }

        // Reconstruct chat from session messages
        if (sessionMessages && sessionMessages.length > 0) {
          const reconstructedMessages: Message[] = [];

          sessionMessages.forEach((s: any) => {
            // Add user message if query exists
            if (s.query && s.query !== 'initial_greeting' && s.query !== 'coach_message') {
              reconstructedMessages.push({
                id: `${s.id}-user`,
                role: 'user',
                content: s.query,
                timestamp: new Date(s.created_at),
              });
            }

            // Add coach response if exists
            if (s.response) {
              reconstructedMessages.push({
                id: `${s.id}-coach`,
                role: 'coach',
                content: s.response,
                timestamp: new Date(s.created_at),
              });
            }
          });

          if (reconstructedMessages.length > 0) {
            setMessages(reconstructedMessages);
            console.log('[CoachingChat] Loaded', reconstructedMessages.length, 'messages from current session');
          }
        }

        setIsLoadingSession(false);
      } catch (error) {
        console.error('[CoachingChat] Failed to initialize session:', error);
        setIsLoadingSession(false);
      }
    };

    initializeSession();
  }, [userId]);

  // Fetch coaching history (past sessions, not current session)
  useEffect(() => {
    const fetchCoachingHistory = async () => {
      if (!userId) return;

      try {
        const { data: sessions, error } = await supabaseClient
          .from('coaching_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.warn('[CoachingChat] Error fetching coaching history:', error);
        } else {
          const formattedSessions: CoachingSession[] = sessions?.map((s: any) => ({
            id: s.id,
            created_at: s.created_at,
            query: s.query,
            response: s.response,
            response_type: s.response_type,
            key_finding: s.key_finding,
            action_items: s.action_items,
          })) || [];
          setCoachingHistory(formattedSessions);
          console.log('[CoachingChat] Loaded coaching history:', formattedSessions.length, 'sessions');
        }
      } catch (error) {
        console.error('[CoachingChat] Failed to fetch coaching history:', error);
      }
    };

    const fetchInitialMemory = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/ai/coach-agent?userId=${userId}&action=get_memory`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.graph) {
            setMemoryGraphData(json.graph);
            setMemoryInfo({
              totalRemembered: json.graph.entities?.length || 0,
              entities: json.graph.entities?.slice(0, 6) || [],
              summary: {
                totalEntities: json.graph.entities?.length || 0,
                topWeaknesses: json.graph.entities?.filter((e: any) => e.entity_type === 'weakness').slice(0, 3).map((e: any) => e.name) || [],
                knownPartners: json.graph.entities?.filter((e: any) => e.entity_type === 'partner').slice(0, 3).map((e: any) => e.name) || [],
                knownOpponents: json.graph.entities?.filter((e: any) => e.entity_type === 'opponent').slice(0, 3).map((e: any) => e.name) || [],
              },
            });
          }
        }
      } catch (e) {
        console.warn('[CoachingChat] Could not load initial memory graph:', e);
      }
    };

    fetchCoachingHistory();
    fetchInitialMemory();
  }, [userId]);

  const fetchFullMemoryGraph = async () => {
    if (!userId) return;
    try {
      setIsLoadingMemory(true);
      const res = await fetch(`/api/ai/coach-agent?userId=${userId}&action=get_memory`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.graph) {
          setMemoryGraphData(json.graph);
          setMemoryInfo({
            totalRemembered: json.graph.entities?.length || 0,
            entities: json.graph.entities?.slice(0, 6) || [],
            summary: {
              totalEntities: json.graph.entities?.length || 0,
              topWeaknesses: json.graph.entities?.filter((e: any) => e.entity_type === 'weakness').slice(0, 3).map((e: any) => e.name) || [],
              knownPartners: json.graph.entities?.filter((e: any) => e.entity_type === 'partner').slice(0, 3).map((e: any) => e.name) || [],
              knownOpponents: json.graph.entities?.filter((e: any) => e.entity_type === 'opponent').slice(0, 3).map((e: any) => e.name) || [],
            },
          });
        }
      }
    } catch (e) {
      console.warn('[CoachingChat] Failed to load memory graph:', e);
    } finally {
      setIsLoadingMemory(false);
    }
  };

  const handleClearMemory = async () => {
    if (!userId) return;
    if (!confirm('Apakah kamu yakin ingin menghapus semua ingatan pengetahuan pelatih? Pelatih akan melupakan riwayat entitas dan metrik masa lalu.')) {
      return;
    }
    try {
      setIsClearingMemory(true);
      const res = await fetch(`/api/ai/coach-agent?userId=${userId}&action=clear_memory`);
      if (res.ok) {
        setMemoryGraphData({ entities: [], edges: [], snapshots: [] });
        setMemoryInfo(null);
        alert('Ingatan pelatih berhasil direset.');
      }
    } catch (e) {
      console.error('[CoachingChat] Error clearing memory:', e);
    } finally {
      setIsClearingMemory(false);
    }
  };

  // Load previous coaching sessions into chat on mount
  useEffect(() => {
    if (coachingHistory.length > 0 && messages.length <= 1) {
      // Load last 3 sessions (excluding current chat)
      const previousSessions = coachingHistory.slice(0, 3).reverse();
      const historicalMessages: Message[] = [];
      
      // Add greeting first
      let greetingText = `Halo ${actualMemberName}! 👋 Saya Coach Agent DLOB.`;
      
      const lastSession = coachingHistory[0];
      const lastDate = new Date(lastSession.created_at).toLocaleDateString('id-ID', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      let sessionSummary = '';
      if (lastSession.key_finding?.title) {
        sessionSummary = lastSession.key_finding.title;
      } else if (lastSession.query) {
        sessionSummary = lastSession.query.substring(0, 50);
      }
      
      if (sessionSummary) {
        greetingText += `\n\nSession terakhir kita (${lastDate}): ${sessionSummary}.\n\n✓ Di bawah ini riwayat sesi-sesi kemarin untuk referensi. Yuk kita lanjutkan!`;
      } else {
        greetingText += '\n\nSiap membantu analisis performa match kamu dan memberikan rekomendasi untuk meningkatkan game.';
      }
      
      const greeting: Message = {
        id: 'greeting',
        role: 'coach',
        content: greetingText,
        timestamp: new Date(),
      };
      
      historicalMessages.push(greeting);
      
      // Don't save greeting - it's UI only, not actual coaching data
      
      // Add separator
      historicalMessages.push({
        id: 'separator-top',
        role: 'coach',
        content: '─────────────────────\n📚 RIWAYAT SESI COACHING\n─────────────────────',
        timestamp: new Date(),
      });
      
      // Add previous sessions
      previousSessions.forEach((session, idx) => {
        historicalMessages.push({
          id: `hist-user-${idx}`,
          role: 'user',
          content: session.query,
          timestamp: new Date(session.created_at),
        });
        
        historicalMessages.push({
          id: `hist-coach-${idx}`,
          role: 'coach',
          content: session.response,
          timestamp: new Date(session.created_at),
        });
      });
      
      // Add new session separator
      historicalMessages.push({
        id: 'separator-bottom',
        role: 'coach',
        content: '─────────────────────\n🆕 SESI BARU\n─────────────────────',
        timestamp: new Date(),
      });
      
      setMessages(historicalMessages);
      console.log('[CoachingChat] Loaded', previousSessions.length, 'previous sessions into chat history');
    }
  }, [coachingHistory, actualMemberName]);

  // Initialize with greeting from coach (only if no history loaded)
  useEffect(() => {
    if (messages.length === 0 && actualMemberName && coachingHistory.length === 0) {
      const greetingText = `Halo ${actualMemberName}! 👋 Saya Coach Agent DLOB. Siap membantu analisis performa match kamu dan memberikan rekomendasi untuk meningkatkan game.\n\nTanya apa saja tentang strategi, performa, atau goal kamu!`;
      
      const greeting: Message = {
        id: '0',
        role: 'coach',
        content: greetingText,
        timestamp: new Date(),
      };
      setMessages([greeting]);
      
      // Don't save greeting - it's just UI initialization, not actual coaching data
    }
  }, [actualMemberName, coachingHistory, sessionId]);

  const handleSendMessage = async (text?: string, forceRefresh: boolean = false) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: forceRefresh ? `${messageText} (🔄 Analisis Ulang)` : messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    console.log('[CoachingChat] Sending message:', {
      memberName,
      userId,
      messageText: messageText.substring(0, 50),
      forceRefresh,
    });

    try {
      // Call coach-agent endpoint
      const response = await fetch('/api/ai/coach-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: messageText,
          userId,
          sessionId,
          memberName: actualMemberName || memberName,
          completedDrills,
          videoAnalysisContext: activeVideoAnalysis || null,
          forceRefresh,
          sessionHistory: messages.map((m) => ({
            query: m.role === 'user' ? m.content : undefined,
            response: m.role === 'coach' ? m.content : undefined,
          })).filter((m) => m.query || m.response),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detailMsg = errorData.details || errorData.error || 'Failed to get coach response';
        console.error('[CoachingChat] Coach Agent HTTP Error:', response.status, detailMsg);
        throw new Error(detailMsg);
      }

      const data = await response.json();
      let coachContent = data.response || 'Maaf, saya tidak bisa merespons sekarang. Coba lagi nanti.';
      if (typeof coachContent === 'string' && coachContent.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(coachContent);
          if (parsed.response && typeof parsed.response === 'string') {
            coachContent = parsed.response;
          }
        } catch {
          const match = coachContent.match(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          if (match) {
            try {
              coachContent = JSON.parse(`"${match[1]}"`);
            } catch {
              coachContent = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }
          }
        }
      }

      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: coachContent,
        timestamp: new Date(),
        isCached: data.isCached || false,
        cachedAt: data.cachedAt,
        originalQuery: messageText,
        memoryEntities: data.memoryContext?.entities || [],
      };

      setMessages((prev) => [...prev, coachMessage]);
      setPendingUserQuery(null);

      // Update knowledge graph memory info
      if (data.memoryContext) {
        setMemoryInfo({
          totalRemembered: data.memoryContext.totalRemembered,
          entities: data.memoryContext.entities,
          summary: data.memoryContext.summary,
        });
      }

      // Store response type and weakness options for progressive disclosure
      setCurrentResponseType(data.responseType || 'provide_analysis');
      if (data.weaknessOptions && data.weaknessOptions.length > 0) {
        setWeaknessOptions(data.weaknessOptions);
      }

      // Extract and set action items if provided
      if (data.actionItems) {
        setActionItems(data.actionItems);
      }

      // Store key finding and expected results for action-focused format
      if (data.keyFinding) {
        setKeyFinding(data.keyFinding);
      }
      if (data.expectedResults) {
        setExpectedResults(data.expectedResults);
      }
    } catch (error) {
      console.error('Error calling coach agent:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: `Oops! Ada error saat memproses: ${error instanceof Error ? error.message : 'Coba lagi sebentar.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(msgId);
      setTimeout(() => {
        setCopiedMessageId((prev) => (prev === msgId ? null : prev));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleRegenerate = (coachMsg: Message) => {
    if (isLoading) return;
    // 1. Check originalQuery
    if (coachMsg.originalQuery) {
      handleSendMessage(coachMsg.originalQuery, true);
      return;
    }
    // 2. Otherwise find the nearest user message directly preceding this coach message
    const coachIdx = messages.findIndex((m) => m.id === coachMsg.id);
    if (coachIdx > 0) {
      for (let i = coachIdx - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          const cleanQuery = messages[i].content.replace(/\s*\(🔄\s*Analisis Ulang\)\s*$/, '');
          handleSendMessage(cleanQuery, true);
          return;
        }
      }
    }
    // 3. Fallback: use initialQuery if present
    if (initialQuery) {
      handleSendMessage(initialQuery, true);
    }
  };

  const handleAskFollowup = (followupText: string) => {
    if (isLoading) return;
    handleSendMessage(followupText);
  };

  const getActionItemIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return '💪';
      case 'weakness':
        return '🔴';
      case 'goal':
        return '🎯';
      case 'milestone':
        return '🏆';
      default:
        return '📌';
    }
  };

  // Save complete coaching exchange (user query + coach response) as ONE database row
  const saveCoachingExchange = async (userQuery: string, coachResponse: string) => {
    if (!userId || !sessionId || !actualMemberName) {
      console.warn('[CoachingChat] Cannot save: missing userId, sessionId, or actualMemberName');
      return;
    }

    try {
      const insertPayload = {
        user_id: userId,
        session_id: sessionId,
        member_name: actualMemberName,
        query: userQuery,  // User's question/message
        response: coachResponse,  // Coach's complete response
        created_at: new Date().toISOString(),
      };

      console.log('[CoachingChat] Saving complete coaching exchange:', {
        memberName: actualMemberName,
        sessionId: sessionId,
        queryLength: userQuery.length,
        responseLength: coachResponse.length,
      });

      const { error } = await supabaseClient
        .from('coaching_sessions')
        .insert([insertPayload]);

      if (error) {
        console.error('[CoachingChat] ❌ Failed to save exchange:', {
          code: (error as any)?.code,
          message: (error as any)?.message,
          details: (error as any)?.details,
        });
      } else {
        console.log('[CoachingChat] ✓ Coaching exchange saved successfully');
      }
    } catch (error) {
      console.error('[CoachingChat] Exception saving exchange:', error);
    }
  };

  const initialQueryHandled = useRef<string | null>(null);

  useEffect(() => {
    if (!initialQuery || !initialQuery.trim()) {
      initialQueryHandled.current = null;
      return;
    }
    if (initialQueryHandled.current === initialQuery) return;
    if (!sessionId || isLoadingSession) return;

    const queryToSend = initialQuery.trim();
    initialQueryHandled.current = queryToSend;

    // Immediately send the query to AI Coach
    handleSendMessage(queryToSend);

    // Consume the query in parent so it clears cleanly
    onQueryConsumed?.();
  }, [initialQuery, sessionId, isLoadingSession, onQueryConsumed]);

  return (
    <div className="flex flex-col h-full">
      {/* Loading session state */}
      {isLoadingSession && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin mr-2">⚙️</div>
            <p className="text-gray-600 dark:text-gray-400">Loading coaching session...</p>
          </div>
        </div>
      )}

      {!isLoadingSession && (
        <>
      {/* Active Video Analysis Session Banner */}
      {activeVideoAnalysis && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                📹 Sesi Video Terhubung: {activeVideoAnalysis.strokeType || 'Taktik Ganda'}
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500 text-white font-black">
                  Skor {activeVideoAnalysis.overallScore}/100
                </span>
              </span>
              <span className="text-[11px] text-gray-600 dark:text-zinc-400 block line-clamp-1">
                {activeVideoAnalysis.criticalFixes?.[0] || 'Koreksi posisi rotasi dan pencegahan area kosong'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => {
                const prompt = `Coach, tolong analisis hasil rekaman video saya barusan (${activeVideoAnalysis.strokeType}, Skor: ${activeVideoAnalysis.overallScore}/100). Bandingkan dengan riwayat pertandingan saya di komunitas, apa program latihan bertahap yang paling tepat?`;
                handleSendMessage(prompt);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <BarChart3 className="w-3 h-3" />
              <span>Sintesiskan dengan Riwayat Match</span>
            </button>
            {onClearVideoContext && (
              <button
                onClick={onClearVideoContext}
                className="text-[10px] text-gray-400 hover:text-red-500 px-1 cursor-pointer"
                title="Lepas konteks video"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Knowledge Graph Memory Status Bar */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-zinc-900/60 flex items-center justify-between text-xs backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchFullMemoryGraph();
              setShowMemoryModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30 font-medium transition-all cursor-pointer group"
            title="Buka Knowledge Graph & Memori Jangka Panjang"
          >
            <Brain className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-[11px]">
              {memoryInfo?.totalRemembered 
                ? `Mengingat ${memoryInfo.totalRemembered} Wawasan & Relasi` 
                : '🧠 Knowledge Graph Memori'}
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-200 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 font-bold uppercase tracking-wider">
              Aktif
            </span>
          </button>
        </div>

        {memoryInfo?.summary?.topWeaknesses && memoryInfo.summary.topWeaknesses.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span>Fokus Utama:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[160px]">
              {memoryInfo.summary.topWeaknesses[0]}
            </span>
          </div>
        )}
      </div>

      {/* Collapsible Session History */}
      {coachingHistory.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Recent Sessions ({coachingHistory.length})
              </span>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}
            />
          </button>

          {showHistory && (
            <div className="px-4 py-2 space-y-2 border-t border-gray-200 dark:border-gray-800">
              {coachingHistory.map((session) => {
                const sessionDate = new Date(session.created_at);
                const isToday = new Date().toDateString() === sessionDate.toDateString();
                const dateStr = isToday 
                  ? sessionDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : sessionDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });

                const severityIcon = session.key_finding?.severity === 'critical' ? '⚠️' :
                                   session.key_finding?.severity === 'moderate' ? '⚡' : '💡';

                return (
                  <button
                    key={session.id}
                    onClick={() => {
                      setSelectedHistorySession(session);
                      setShowHistoryDetail(true);
                    }}
                    className="w-full text-left p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {session.key_finding ? severityIcon : '💬'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{dateStr}</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate mt-0.5">
                          {session.key_finding?.title || session.query.substring(0, 50)}
                        </p>
                        {session.action_items && session.action_items.length > 0 && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {session.action_items.length} action items
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* History Detail Modal */}
      {showHistoryDetail && selectedHistorySession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto shadow-lg">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Session Details
              </h3>
              <button
                onClick={() => setShowHistoryDetail(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Date */}
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Date</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                  {new Date(selectedHistorySession.created_at).toLocaleString('id-ID')}
                </p>
              </div>

              {/* Query */}
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Your Question</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                  {selectedHistorySession.query}
                </p>
              </div>

              {/* Key Finding */}
              {selectedHistorySession.key_finding && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {selectedHistorySession.key_finding.severity === 'critical' ? '⚠️' :
                       selectedHistorySession.key_finding.severity === 'moderate' ? '⚡' : '💡'}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase">
                        Key Finding
                      </p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                        {selectedHistorySession.key_finding.title}
                      </p>
                      {selectedHistorySession.key_finding.stats && (
                        <ul className="text-xs text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                          {selectedHistorySession.key_finding.stats.map((stat, idx) => (
                            <li key={idx} className="flex items-center gap-1">
                              <span>•</span> {stat}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Items */}
              {selectedHistorySession.action_items && selectedHistorySession.action_items.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">Action Items</p>
                  <div className="space-y-2">
                    {selectedHistorySession.action_items.map((item, idx) => (
                      <div key={idx} className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded p-2">
                        <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                          {item.title}
                        </p>
                        {item.expectedOutcome && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            ✓ Expected: {item.expectedOutcome}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Continue Session Button */}
              <button
                onClick={() => {
                  // Load previous session messages and data into chat
                  const userMsg: Message = {
                    id: (Date.now() - 1).toString(),
                    role: 'user',
                    content: selectedHistorySession.query,
                    timestamp: new Date(selectedHistorySession.created_at),
                  };
                  const coachMsg: Message = {
                    id: Date.now().toString(),
                    role: 'coach',
                    content: selectedHistorySession.response,
                    timestamp: new Date(selectedHistorySession.created_at),
                  };
                  
                  setMessages([userMsg, coachMsg]);
                  
                  // Load response details
                  if (selectedHistorySession.key_finding) {
                    setKeyFinding(selectedHistorySession.key_finding);
                  }
                  if (selectedHistorySession.action_items) {
                    setActionItems(selectedHistorySession.action_items.map((item: any) => ({
                      type: 'goal' as const,
                      title: item.title,
                      description: item.description || item.title,
                      expectedOutcome: item.expectedOutcome,
                    })));
                  }
                  
                  setCurrentResponseType(selectedHistorySession.response_type);
                  setShowHistoryDetail(false);
                  
                  // Scroll to bottom to show the loaded session
                  setTimeout(() => scrollToBottom(), 100);
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Continue This Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Graph Memory Modal */}
      {showMemoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50/80 dark:bg-zinc-900/80">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  <Brain className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    Knowledge Graph & Ingatan Pelatih
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Jaringan pemahaman jangka panjang AI tentang teknik, lawan, partner, & progres kamu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMemoryModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {isLoadingMemory ? (
                <div className="py-12 text-center space-y-2">
                  <div className="inline-block animate-spin text-2xl">🧠</div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Memuat jaringan pengetahuan pemain...</p>
                </div>
              ) : (
                <>
                  {/* Top Stats Strip */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-800/50 text-center">
                      <p className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 tracking-wider">Entitas (Nodes)</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                        {memoryGraphData?.entities?.length || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/50 text-center">
                      <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Relasi (Edges)</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                        {memoryGraphData?.edges?.length || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 text-center">
                      <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Snapshot Metrik</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                        {memoryGraphData?.snapshots?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Section 1: Entitas Kunci */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Network className="w-3.5 h-3.5 text-violet-500" />
                        Entitas Badminton yang Diingat ({memoryGraphData?.entities?.length || 0})
                      </span>
                    </div>

                    {(!memoryGraphData?.entities || memoryGraphData.entities.length === 0) ? (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-dashed border-gray-200 dark:border-zinc-700 text-center text-gray-500 dark:text-gray-400">
                        Belum ada memori tercatat. Mulai chat dengan coach tentang teknik, lawan, atau rotasi untuk membangun knowledge graph.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {memoryGraphData.entities.map((ent: any) => {
                          const icon = ent.entity_type === 'weakness' ? '🎯' :
                                       ent.entity_type === 'opponent' ? '⚔️' :
                                       ent.entity_type === 'partner' ? '👥' :
                                       ent.entity_type === 'drill' ? '🏋️' :
                                       ent.entity_type === 'skill' ? '🏸' : '💡';
                          return (
                            <div
                              key={ent.id}
                              className="p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/80 dark:border-zinc-700/80 flex items-start gap-2"
                            >
                              <span className="text-base shrink-0">{icon}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-semibold text-gray-900 dark:text-gray-100 truncate text-[11px]">
                                    {ent.name}
                                  </span>
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 font-mono font-bold shrink-0">
                                    {Math.round((ent.confidence || 0.8) * 100)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                  <span className="capitalize">{ent.entity_type}</span>
                                  <span>{ent.mention_count || 1}x disebut</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Relasi Taktis (Edges) */}
                  {memoryGraphData?.edges && memoryGraphData.edges.length > 0 && (
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-2">
                        🔗 Relasi Taktis Antar Entitas ({memoryGraphData.edges.length})
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {memoryGraphData.edges.map((edge: any) => {
                          const srcName = memoryGraphData.entities.find((e: any) => e.id === edge.source_entity_id)?.name || 'Entitas';
                          const tgtName = memoryGraphData.entities.find((e: any) => e.id === edge.target_entity_id)?.name || 'Entitas';
                          return (
                            <div
                              key={edge.id}
                              className="px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/60 dark:border-zinc-700/50 flex items-center justify-between text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-medium text-gray-800 dark:text-gray-200">{srcName}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono">
                                  {edge.relation_type}
                                </span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">{tgtName}</span>
                              </div>
                              <span className="text-[9px] text-gray-400 font-mono">
                                w:{Math.round((edge.weight || 1.0) * 10) / 10}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section 3: Snapshot Perkembangan */}
                  {memoryGraphData?.snapshots && memoryGraphData.snapshots.length > 0 && (
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-2">
                        📈 Snapshot Perkembangan Metrik ({memoryGraphData.snapshots.length})
                      </span>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {memoryGraphData.snapshots.map((snap: any) => (
                          <div
                            key={snap.id}
                            className="px-2.5 py-1.5 rounded-md bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-[11px]"
                          >
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {snap.metric_name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                {snap.metric_value}
                              </span>
                              <span className="text-[9px] text-gray-400">
                                {new Date(snap.measured_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer with Privacy Controls */}
            <div className="p-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/80 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleClearMemory}
                disabled={isClearingMemory}
                className="px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isClearingMemory ? 'Mereset...' : 'Hapus Ingatan Pelatih'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMemoryModal(false)}
                className="px-4 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-xs transition-colors cursor-pointer hover:opacity-90"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area - Minimal styling, blended background */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-2xl px-4 py-3 shadow-xs transition-all ${
                message.role === 'user'
                  ? 'max-w-xs sm:max-w-md bg-emerald-600 text-white rounded-br-none ml-auto'
                  : 'max-w-xs sm:max-w-xl lg:max-w-2xl bg-gray-100 dark:bg-zinc-800/90 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200/80 dark:border-white/5'
              }`}
            >
              {message.role === 'coach' ? (
                <div>
                  <FormattedCoachMessage content={message.content} />
                  
                  {/* Recalled Knowledge Graph Entities */}
                  {message.memoryEntities && message.memoryEntities.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-gray-200/60 dark:border-white/10 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <Brain className="w-3 h-3" /> Memori Terhubung:
                      </span>
                      {message.memoryEntities.map((ent, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-100/70 dark:bg-violet-950/50 text-violet-800 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/80 shadow-2xs"
                        >
                          <span>
                            {ent.type === 'weakness' ? '🎯' : ent.type === 'opponent' ? '⚔️' : ent.type === 'partner' ? '👥' : ent.type === 'drill' ? '🏋️' : '💡'}
                          </span>
                          <span>{ent.name}</span>
                          {ent.mentions > 1 && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-violet-200 dark:bg-violet-900 text-violet-800 dark:text-violet-200 font-mono">
                              {ent.mentions}x
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {message.isCached && (
                    <div className="mt-3 pt-2.5 border-t border-gray-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="inline-block animate-pulse">⚡</span>
                        <span>Jawaban instan dari analisis sebelumnya (0 token terpakai)</span>
                      </span>
                    </div>
                  )}

                  {/* Micro-Action Toolbar (Copy, Regenerate, Follow-up Drill) */}
                  <div className="mt-3 pt-2 border-t border-gray-200/70 dark:border-white/10 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1">
                      {/* Copy response */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className="px-2 py-1 rounded-lg hover:bg-gray-200/80 dark:hover:bg-zinc-700/70 text-gray-600 dark:text-zinc-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
                        title="Salin jawaban coach ke clipboard"
                      >
                        {copiedMessageId === message.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      {/* Regenerate (Fresh AI) - only if not greeting */}
                      {message.id !== '0' && message.id !== 'greeting' && (
                        <button
                          type="button"
                          onClick={() => handleRegenerate(message)}
                          disabled={isLoading}
                          className="px-2 py-1 rounded-lg hover:bg-gray-200/80 dark:hover:bg-zinc-700/70 text-gray-600 dark:text-zinc-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer text-[11px] disabled:opacity-50"
                          title="Analisis ulang dengan AI terbaru"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                          <span>Regenerate</span>
                        </button>
                      )}

                      {/* Quick Shortcut: Drill lanjutan */}
                      {message.id !== '0' && message.id !== 'greeting' && (
                        <button
                          type="button"
                          onClick={() => handleAskFollowup('Bisa berikan 1 drill latihan spesifik dan durasinya untuk mempraktikkan tips ini di lapangan?')}
                          disabled={isLoading}
                          className="hidden sm:flex px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium transition-colors items-center gap-1 cursor-pointer text-[11px] disabled:opacity-50"
                          title="Minta drill latihan spesifik ke coach"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Minta Drill</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
                      {new Date(message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-white/20 text-[10px] text-emerald-100">
                    <span className="font-mono">
                      {new Date(message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer opacity-90 hover:opacity-100"
                      title="Salin pertanyaan"
                    >
                      {copiedMessageId === message.id ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-lg rounded-bl-none shadow-sm">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        {/* Key Finding Card - Action-Focused Format */}
        {keyFinding && (
          <div className={`flex justify-start`}>
            <div className={`max-w-xs lg:max-w-md rounded-lg p-4 shadow-md border-l-4 ${
              keyFinding.severity === 'critical'
                ? 'bg-red-50 dark:bg-red-900/30 border-red-500'
                : keyFinding.severity === 'moderate'
                ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500'
                : 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
            }`}>
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">
                  {keyFinding.severity === 'critical' ? '⚠️' :
                   keyFinding.severity === 'moderate' ? '⚡' :
                   '💡'}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                      keyFinding.severity === 'critical'
                        ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                        : keyFinding.severity === 'moderate'
                        ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                        : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                    }`}>
                      {keyFinding.severity?.toUpperCase()}
                    </span>
                  </div>
                  <h3 className={`font-semibold text-sm ${
                    keyFinding.severity === 'critical' ? 'text-red-700 dark:text-red-300' :
                    keyFinding.severity === 'moderate' ? 'text-yellow-700 dark:text-yellow-300' :
                    'text-blue-700 dark:text-blue-300'
                  }`}>
                    {keyFinding.title}
                  </h3>
                </div>
              </div>
              
              {/* Stats Array */}
              {keyFinding.stats && keyFinding.stats.length > 0 && (
                <div className="mt-3 space-y-1 ml-6">
                  {keyFinding.stats.map((stat: string, idx: number) => (
                    <p key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">•</span>
                      {stat}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expected Results Card */}
        {expectedResults && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md rounded-lg p-4 shadow-md bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500">
              <div className="flex items-start gap-2">
                <span className="text-lg">📈</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-green-700 dark:text-green-300 mb-2">Target Hasil</h3>
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    {expectedResults.timeframe && (
                      <p className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">⏱️</span>
                        <span><strong>Waktu:</strong> {expectedResults.timeframe}</span>
                      </p>
                    )}
                    {expectedResults.target && (
                      <p className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">🎯</span>
                        <span><strong>Target:</strong> {expectedResults.target}</span>
                      </p>
                    )}
                    {expectedResults.metric && (
                      <p className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">📊</span>
                        <span><strong>Metrik:</strong> {expectedResults.metric}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Items with Expected Outcomes */}
        {actionItems.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md w-full space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-2">🎯 Action Items:</p>
              {actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg p-3 bg-purple-50 dark:bg-purple-900/30 border-l-4 border-purple-500"
                >
                  <p className="font-semibold text-sm text-purple-700 dark:text-purple-300 mb-1">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-400 mb-2">
                    {item.description}
                  </p>
                  {item.expectedOutcome && (
                    <p className="text-xs text-green-700 dark:text-green-300 italic flex items-center gap-1">
                      <span>✓</span>
                      <span><strong>Hasil Diharapkan:</strong> {item.expectedOutcome}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weakness Options - Progressive Disclosure Cards */}
        {currentResponseType === 'ask_weakness' && weaknessOptions.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-2">Pilih salah satu untuk analisis:</p>
            {weaknessOptions.map((weakness) => (
              <button
                key={weakness.id}
                onClick={() => {
                  handleSendMessage(`analisis weakness: ${weakness.title}`);
                  setWeaknessOptions([]);
                  setCurrentResponseType(null);
                }}
                disabled={isLoading}
                className={`w-full text-left p-3 rounded-lg border-l-4 transition-all hover:shadow-md disabled:opacity-50 ${
                  weakness.severity === 'critical'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                    : weakness.severity === 'moderate'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                    : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${
                      weakness.severity === 'critical' ? 'text-red-700 dark:text-red-300' :
                      weakness.severity === 'moderate' ? 'text-yellow-700 dark:text-yellow-300' :
                      'text-blue-700 dark:text-blue-300'
                    }`}>
                      {weakness.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                      {weakness.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
                      {weakness.impact}
                    </p>
                  </div>
                  <div className={`ml-2 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                    weakness.severity === 'critical' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' :
                    weakness.severity === 'moderate' ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                    'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                  }`}>
                    {weakness.severity}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Action Items Panel - Hidden for now */}
      {false && actionItems.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-slate-800/50">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Action Items
          </h4>
          <div className="space-y-2">
            {actionItems.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-700 p-3 rounded-lg text-sm border-l-4 border-blue-500"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getActionItemIcon(item.type)}</span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {item.description}
                    </p>
                    {item.progress !== undefined && (
                      <div className="mt-2 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Prompts - Hidden for now */}
      {false && messages.length === 1 && (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
            Quick Prompts
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt.text)}
                disabled={isLoading}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-left group"
              >
                <p className="text-lg mb-1">{prompt.icon}</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                  {prompt.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Match Name Selector - Auto-discovered from matches table */}
      {showMatchNamePrompt && possibleMatchNames.length > 0 && (
        <div className="px-4 md:px-6 py-3 border-t border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 backdrop-blur-sm">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
            ⚽ Nama Anda di Matches
          </p>
          <p className="text-xs text-blue-800 dark:text-blue-200 mb-3">
            Pilih nama yang digunakan di match Anda:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {possibleMatchNames.map((name) => (
              <button
                key={name}
                onClick={() => {
                  setActualMemberName(name);
                  setShowMatchNamePrompt(false);
                  console.log('[CoachingChat] Selected match name:', name);
                }}
                disabled={isLoading}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 disabled:opacity-50 transition text-center text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Minimal styling */}
      <div className="px-4 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Tanya coach..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
            title="Send"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default CoachingChat;
