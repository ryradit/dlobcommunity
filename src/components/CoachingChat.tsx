'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, BarChart3, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client at module level for consistent auth session
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
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
}

const CoachingChat: React.FC<CoachingChatProps> = ({ memberName, onClose }) => {
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

    fetchCoachingHistory();
  }, [userId]);

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

  const handleSendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Store the user query - will be saved with coach response
    setPendingUserQuery(messageText);

    console.log('[CoachingChat] Sending message:', {
      memberName,
      userId,
      messageText: messageText.substring(0, 50),
    });

    try {
      // Call coach-agent endpoint
      const response = await fetch('/api/ai/coach-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: messageText,
          userId,
          memberName: actualMemberName || memberName,
          sessionHistory: messages.map((m) => ({
            query: m.role === 'user' ? m.content : undefined,
            response: m.role === 'coach' ? m.content : undefined,
          })).filter((m) => m.query || m.response),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get coach response');
      }

      const data = await response.json();
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: data.response || 'Maaf, saya tidak bisa merespons sekarang. Coba lagi nanti.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, coachMessage]);

      // Save the complete conversation pair (user query + coach response) as ONE row
      if (pendingUserQuery) {
        await saveCoachingExchange(pendingUserQuery, coachMessage.content);
        setPendingUserQuery(null);
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
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none shadow-sm'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none shadow-sm'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
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
