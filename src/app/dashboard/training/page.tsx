'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Dumbbell,
  AlertCircle,
  Search,
  Play,
  Users,
  Zap,
  TrendingUp,
  Shield,
  Target,
  ArrowRight,
  Clock,
  CheckCircle2,
  Brain,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Send,
  Star,
  RefreshCw,
  Video,
  ListTodo,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  HelpCircle
} from 'lucide-react';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';
import TutorialOverlay from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';
import { analyzeMatchHistory, MatchAnalyticsResult } from '@/lib/matchAnalytics';

// ============================================================================
// TYPES
// ============================================================================

interface TrainingPlan {
  id: string;
  focus_weakness: string;
  duration_weeks: number;
  days_per_week: number;
  weekly_schedule: any[];
  expected_outcome: string;
  progression_level: string;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  progress_percentage: number;
  started_at: string;
  created_at: string;
}

interface AssignedDrill {
  id: string;
  drill_name: string;
  drill_type: string;
  sets: number;
  reps_per_set: number;
  current_difficulty: string;
  assigned_date: string;
  target_completion_date: string;
  completed_at: string | null;
  completion_count: number;
  quality_score: number | null;
}

interface MentalAssessment {
  id: string;
  assessment_type: string;
  confidence_level: number;
  pressure_response_score: number;
  consistency_score: number;
  winning_mentality_score: number;
  overall_psychological_score: number;
  findings: any;
  recommendations: string[];
  mental_strengths?: string[];
  improvement_areas?: string[];
  assessed_date: string;
}

interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  actionItems?: any[];
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  url: string;
}

// Lightweight custom Markdown component to render bold text, lists, and headings safely
function FormattedMarkdown({ text }: { text: string }) {
  if (!text) return null;

  // Split text by lines
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const content = line.trim();
        if (content === '') return <div key={idx} className="h-2" />;

        // Check for headings (e.g., #### **Title** or ### Title)
        const headingMatch = content.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const headingText = headingMatch[2].replace(/\*\*/g, '').trim();
          
          if (level >= 4) {
            return (
              <h4 key={idx} className="text-xs font-bold text-gray-900 dark:text-white mt-3 mb-1">
                {headingText}
              </h4>
            );
          }
          return (
            <h3 key={idx} className="text-sm font-bold text-gray-900 dark:text-white mt-4 mb-1">
              {headingText}
            </h3>
          );
        }

        // Check for list items (e.g., * **Item** or - Item)
        const isListItem = content.startsWith('*') || content.startsWith('-') || content.startsWith('•');
        if (isListItem) {
          // Remove leading bullet marker
          const itemText = content.replace(/^[\*\-\•]\s*/, '');
          
          // Render with inline bold parsing
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-blue-500 shrink-0 select-none mt-1 text-[10px]">●</span>
              <span className="text-xs font-normal">
                {renderInlineBold(itemText)}
              </span>
            </div>
          );
        }

        // Standard paragraph line with inline bold parsing
        return (
          <p key={idx} className="text-xs font-normal leading-relaxed">
            {renderInlineBold(content)}
          </p>
        );
      })}
    </div>
  );
}

// Helper to split text by ** and alternate normal and bold spans
function renderInlineBold(text: string) {
  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-bold text-gray-900 dark:text-white">
          {part}
        </strong>
      );
    }
    return part;
  });
}
const translateDrillName = (name: string): string => {
  const mapping: { [key: string]: string } = {
    'approach smash': 'Smash Approach / Bergerak',
    'jump smash': 'Jump Smash / Smash Lompat',
    'smash accuracy': 'Akurasi Smash',
    'shadow smash': 'Shadow Smash (Tanpa Kok)',
    'ghosting drills': 'Ghosting Drills (Footwork Lapangan)',
    'ghosting': 'Ghosting (Footwork Lapangan)',
    'multi-shuttle footwork': 'Footwork Multi-Shuttle',
    'multi-shuttle smash': 'Smash Multi-Shuttle',
    'multi shuttle smash': 'Smash Multi-Shuttle',
    'multishuttle smash': 'Smash Multi-Shuttle',
    'smash drive': 'Smash Drive / Transisi Cepat',
    'net play': 'Permainan Net (Net Play)',
    'net_play': 'Permainan Net (Net Play)',
    'backhand clear': 'Clear Backhand',
    'backhand drop': 'Drop Backhand',
    'backhand drive': 'Drive Backhand',
    'backhand smash': 'Smash Backhand',
    'defense': 'Pertahanan (Defense)',
    'defense drill': 'Drill Pertahanan',
    'interval shuttle': 'Drill Shuttle Interval',
    'shuttle run': 'Shuttle Run (Kelincahan)',
    'hiit': 'Latihan Fisik Interval (HIIT)',
    'plyometrics': 'Latihan Plyometric (Ledakan Otot)',
    'core stability': 'Stabilitas Otot Inti (Core)',
    'wrist strength': 'Kekuatan Pergelangan Tangan (Wrist)',
  };
  const key = name.toLowerCase().trim();
  return mapping[key] || name;
};

const translateDrillType = (type: string): string => {
  const mapping: { [key: string]: string } = {
    'technique': 'Teknik',
    'conditioning': 'Kondisi Fisik / Stamina',
    'tactical': 'Taktik',
    'match_simulation': 'Simulasi Game / Tanding',
    'match simulation': 'Simulasi Game / Tanding',
  };
  const key = type.toLowerCase().trim();
  return mapping[key] || type;
};

const translateDifficulty = (difficulty: string): string => {
  const mapping: { [key: string]: string } = {
    'beginner': 'Pemula',
    'intermediate': 'Menengah',
    'advanced': 'Mahir',
    'elite': 'Elite',
  };
  const key = difficulty.toLowerCase().trim();
  return mapping[key] || difficulty;
};

const translateExpectedOutcome = (text: string): string => {
  if (!text) return '';
  let translated = text;
  
  // Replace "Improve [focus] by [X-Y]% within [Z] weeks"
  translated = translated.replace(/Improve (\w+[\s\w]*?) by (\d+-\d+|\d+)% within (\d+) weeks/gi, (match, focus, range, weeks) => {
    let focusIndo = focus.toLowerCase().trim();
    if (focusIndo === 'smash') focusIndo = 'smash';
    else if (focusIndo === 'defense') focusIndo = 'pertahanan';
    else if (focusIndo === 'backhand') focusIndo = 'backhand';
    else if (focusIndo === 'stamina') focusIndo = 'stamina';
    else if (focusIndo === 'footwork') focusIndo = 'footwork';
    else if (focusIndo === 'netting' || focusIndo === 'net' || focusIndo === 'net play') focusIndo = 'permainan net (netting)';
    return `Meningkatkan ${focusIndo} sebesar ${range}% dalam waktu ${weeks} minggu`;
  });

  // Simple direct translation fallbacks
  translated = translated.replace(/Improve/gi, 'Meningkatkan');
  translated = translated.replace(/by/gi, 'sebesar');
  translated = translated.replace(/within/gi, 'dalam waktu');
  translated = translated.replace(/weeks/gi, 'minggu');
  translated = translated.replace(/week/gi, 'minggu');
  
  return translated;
};

const renderTrend = (current: number, previous?: number) => {
  if (previous === undefined || previous === null) return null;
  const diff = current - previous;
  if (diff > 0) {
    return <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 ml-1.5 bg-emerald-500/10 px-1 py-0.5 rounded leading-none">+{diff}</span>;
  } else if (diff < 0) {
    return <span className="text-[10px] font-extrabold text-red-650 dark:text-red-405 ml-1.5 bg-red-500/10 px-1 py-0.5 rounded leading-none">{diff}</span>;
  }
  return <span className="text-[10px] font-extrabold text-gray-400 ml-1.5 bg-gray-500/10 px-1 py-0.5 rounded leading-none">±0</span>;
};

const translateFocus = (focus: string): string => {
  if (!focus) return '';
  const focusLower = focus.toLowerCase().replace(/_/g, ' ').trim();
  if (focusLower === 'smash') return 'Smash';
  if (focusLower === 'defense') return 'Pertahanan (Defense)';
  if (focusLower === 'backhand') return 'Backhand';
  if (focusLower === 'stamina') return 'Stamina / Fisik';
  if (focusLower === 'footwork') return 'Langkah Kaki (Footwork)';
  if (focusLower === 'net play' || focusLower === 'netting') return 'Permainan Net (Netting)';
  return focus;
};

export default function TrainingCenterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const userId = user?.id;

  // Tabs navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'videos'>('dashboard');

  // Dashboard & Coach State
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const [assignedDrills, setAssignedDrills] = useState<AssignedDrill[]>([]);
  const [mentalAssessment, setMentalAssessment] = useState<MentalAssessment | null>(null);
  const [previousMentalAssessment, setPreviousMentalAssessment] = useState<MentalAssessment | null>(null);
  const [matchAnalytics, setMatchAnalytics] = useState<MatchAnalyticsResult | null>(null);
  const [latestMatch, setLatestMatch] = useState<any | null>(null);
  const [isTacticalLoading, setIsTacticalLoading] = useState(true);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [memberName, setMemberName] = useState('Pemain');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);

  // Independent Mental Assessment State
  const [isMentalModalOpen, setIsMentalModalOpen] = useState(false);
  const [isSubmittingMental, setIsSubmittingMental] = useState(false);
  const [mentalConfidence, setMentalConfidence] = useState(70);
  const [mentalSymptoms, setMentalSymptoms] = useState<string[]>([]);
  const [mentalDecision, setMentalDecision] = useState('');
  const [mentalWinning, setMentalWinning] = useState('');

  // Drill Logging Modal State
  const [selectedDrill, setSelectedDrill] = useState<AssignedDrill | null>(null);
  const [logSets, setLogSets] = useState(3);
  const [logReps, setLogReps] = useState(15);
  const [logRating, setLogRating] = useState(4);
  const [isSubmittingDrill, setIsSubmittingDrill] = useState(false);

  // YouTube Recommendations State
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [isSearchingVideos, setIsSearchingVideos] = useState(false);
  const [videoAdvice, setVideoAdvice] = useState('');
  const [videosList, setVideosList] = useState<YouTubeVideo[]>([]);
  const [searchSuccess, setSearchSuccess] = useState(false);

  // Tutorial Hook Setup
  const tutorialSteps = getTutorialSteps('member-training');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('member-training', tutorialSteps);



  // Video Library Search History State
  const [recentQueries, setRecentQueries] = useState<string[]>([
    'Cara meningkatkan smash badminton',
    'Drill footwork badminton kelincahan',
    'Teknik netting tipis menyilang'
  ]);

  const handleDeleteQuery = (queryToDelete: string) => {
    setRecentQueries(prev => prev.filter(q => q !== queryToDelete));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Fetch initial coach and plan data
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Member Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single();

        if (profileData) {
          setMemberName(profileData.full_name || 'Member');
        }

        // Fetch active training plan
        const { data: planData } = await supabase
          .from('training_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        let activePlan = null;
        if (planData && planData.length > 0) {
          activePlan = planData[0];
          setTrainingPlan(activePlan);
        }

        // Fetch assigned drills
        if (activePlan) {
          const { data: drillsData } = await supabase
            .from('assigned_drills')
            .select('*')
            .eq('user_id', userId)
            .eq('training_plan_id', activePlan.id)
            .order('assigned_date', { ascending: false });

          if (drillsData) {
            setAssignedDrills(drillsData);
          }
        } else {
          setAssignedDrills([]);
        }

        // Fetch latest mental assessments (up to 2 for progress comparison)
        const { data: assessmentData } = await supabase
          .from('mental_assessment')
          .select('*')
          .eq('user_id', userId)
          .order('assessed_date', { ascending: false })
          .limit(2);

        if (assessmentData && assessmentData.length > 0) {
          setMentalAssessment(assessmentData[0]);
          if (assessmentData.length > 1) {
            setPreviousMentalAssessment(assessmentData[1]);
          } else {
            setPreviousMentalAssessment(null);
          }
        }

        // Fetch match analytics using real match history
        try {
          const nameToUse = profileData?.full_name || undefined;
          const analytics = await analyzeMatchHistory(nameToUse, userId);
          if (analytics) {
            setMatchAnalytics(analytics);
          }
        } catch (err) {
          console.error('Error fetching match analytics:', err);
        }

        // Fetch latest match for the user and compute direct tactical analysis using Gemini
        try {
          setIsTacticalLoading(true);
          const response = await fetch('/api/ai/tactical-analysis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.found && data.analysis) {
              setLatestMatch({
                isWinner: data.matchDetails.isWinner,
                userScore: data.matchDetails.userScore,
                opponentScore: data.matchDetails.opponentScore,
                partner: data.matchDetails.partner,
                opponents: data.matchDetails.opponents,
                analysisText: data.analysis.analysis,
                attackEfficiency: data.analysis.attackEfficiency,
                defenseSolidity: data.analysis.defenseSolidity,
              });
            } else {
              setLatestMatch(null);
            }
          } else {
            setLatestMatch(null);
          }
        } catch (err) {
          console.error('Error fetching latest match tactical analysis:', err);
          setLatestMatch(null);
        } finally {
          setIsTacticalLoading(false);
        }

        // Initialize session ID
        const storedSessionId = localStorage.getItem(`training_coach_session_${userId}`);
        const storedDate = localStorage.getItem(`training_coach_session_${userId}_date`);
        const today = new Date().toDateString();
        const storedToday = storedDate ? new Date(storedDate).toDateString() : null;

        let activeSessionId = storedSessionId;
        if (!storedSessionId || storedToday !== today) {
          activeSessionId = crypto.randomUUID();
          localStorage.setItem(`training_coach_session_${userId}`, activeSessionId);
          localStorage.setItem(`training_coach_session_${userId}_date`, new Date().toISOString());
        }
        setSessionId(activeSessionId);

        // Load coaching sessions history
        const { data: sessionsData } = await supabase
          .from('coaching_sessions')
          .select('query, response, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(10);

        if (sessionsData && sessionsData.length > 0) {
          const loadedMessages: CoachMessage[] = [];
          sessionsData.forEach((session: any) => {
            loadedMessages.push(
              {
                id: `u-${session.created_at}`,
                role: 'user',
                content: session.query,
                timestamp: new Date(session.created_at),
              },
              {
                id: `c-${session.created_at}`,
                role: 'coach',
                content: session.response,
                timestamp: new Date(session.created_at),
              }
            );
          });
          setMessages(loadedMessages);
        } else {
          // Default greeting
          setMessages([
            {
              id: 'welcome',
              role: 'coach',
              content: `Halo ${profileData?.full_name || 'Pemain'}! Saya adalah Dlob AI Coach Anda. Saya siap membantu merancang rencana latihan fisik, menganalisis taktik bertanding, serta menguji kesiapan mental Anda. Silakan pilih menu aksi cepat di dashboard latihan atau ajukan pertanyaan langsung kepada saya di sini.`,
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching training data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Trigger video recommendation query
  const handleVideoSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearchingVideos(true);
    setVideoSearchQuery(queryText);
    setSearchSuccess(false);

    // Save search to history
    setRecentQueries(prev => {
      const filtered = prev.filter(q => q !== queryText);
      return [queryText, ...filtered].slice(0, 5);
    });

    try {
      const response = await fetch('/api/ai/training-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      });

      if (!response.ok) {
        throw new Error('Failed to get video recommendations');
      }

      const data = await response.json();
      setVideoAdvice(data.advice || '');
      setVideosList(data.videos || []);
      setSearchSuccess(true);
    } catch (error) {
      console.error('Error getting videos:', error);
    } finally {
      setIsSearchingVideos(false);
    }
  };

  // Send message to Coach Agent
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim() || !userId || !sessionId) return;

    const userMessage: CoachMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsSendingMessage(true);

    try {
      const response = await fetch('/api/ai/coaching-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          userId,
          memberName,
          sessionId,
          agentMode: 'autonomous',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Coaching API Error]:', errorText);
        throw new Error(`Failed to get coaching response: ${errorText}`);
      }

      const data = await response.json();

      const coachMessage: CoachMessage = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: data.response || 'Maaf, saya sedang tidak dapat merespons.',
        timestamp: new Date(),
        toolsUsed: data.toolsExecuted || [],
        actionItems: data.actionItems || [],
      };

      setMessages((prev) => [...prev, coachMessage]);

      // Always refetch latest mental assessment to update the dashboard UI in real-time
      const { data: latestMentalData } = await supabase
        .from('mental_assessment')
        .select('*')
        .eq('user_id', userId)
        .order('assessed_date', { ascending: false })
        .limit(2);

      if (latestMentalData && latestMentalData.length > 0) {
        setMentalAssessment(latestMentalData[0]);
        if (latestMentalData.length > 1) {
          setPreviousMentalAssessment(latestMentalData[1]);
        } else {
          setPreviousMentalAssessment(null);
        }
      }

      // Refetch plan & drills if agent modified them
      if (data.toolsExecuted?.includes('generate_training_plan') || data.toolsExecuted?.includes('track_progress_metrics')) {
        const { data: planData } = await supabase
          .from('training_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        let activePlan = null;
        if (planData && planData.length > 0) {
          activePlan = planData[0];
          setTrainingPlan(activePlan);
        } else {
          setTrainingPlan(null);
        }

        if (activePlan) {
          const { data: drillsData } = await supabase
            .from('assigned_drills')
            .select('*')
            .eq('user_id', userId)
            .eq('training_plan_id', activePlan.id)
            .order('assigned_date', { ascending: false });

          if (drillsData) {
            setAssignedDrills(drillsData);
          }
        } else {
          setAssignedDrills([]);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: CoachMessage = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: 'Maaf, terjadi kesalahan saat menghubungi AI Coach. Coba lagi dalam beberapa saat.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Run Quick Action query and switch to Chat Tab
  const triggerQuickAction = (actionQuery: string) => {
    setActiveTab('chat');
    setTimeout(() => {
      handleSendMessage(actionQuery);
    }, 100);
  };

  // Open drill detail logging
  const handleOpenDrillModal = (drill: AssignedDrill) => {
    setSelectedDrill(drill);
    setLogSets(drill.sets);
    setLogReps(drill.reps_per_set);
    setLogRating(drill.quality_score || 4);
  };

  // Submit drill log session
  const submitDrillLog = async () => {
    if (!selectedDrill) return;
    setIsSubmittingDrill(true);

    try {
      const newCount = (selectedDrill.completion_count || 0) + 1;
      const { error } = await supabase
        .from('assigned_drills')
        .update({
          completed_at: new Date().toISOString(),
          completion_count: newCount,
          quality_score: logRating,
        })
        .eq('id', selectedDrill.id);

      if (error) throw error;

      // Update state
      setAssignedDrills((prev) =>
        prev.map((d) =>
          d.id === selectedDrill.id
            ? { ...d, completed_at: new Date().toISOString(), completion_count: newCount, quality_score: logRating }
            : d
        )
      );

      // Dynamically recalculate plan progress percentage if plan is active
      if (trainingPlan) {
        const total = assignedDrills.length;
        const completedCount = assignedDrills.filter(d => d.id === selectedDrill.id ? true : d.completed_at).length;
        const newPct = Math.min(100, Math.round((completedCount / total) * 100));

        await supabase
          .from('training_plans')
          .update({ progress_percentage: newPct })
          .eq('id', trainingPlan.id);

        setTrainingPlan((prev) => (prev ? { ...prev, progress_percentage: newPct } : null));
      }

      setSelectedDrill(null);
    } catch (err: any) {
      console.error('Error logging drill:', err.message || err);
      if (err.details) console.error('Details:', err.details);
      if (err.hint) console.error('Hint:', err.hint);
      alert('Gagal mencatat latihan. Coba lagi.');
    } finally {
      setIsSubmittingDrill(false);
    }
  };

  // Abandon/archive the current active training plan
  const handleAbandonTrainingPlan = async () => {
    if (!trainingPlan || !userId) return;
    setIsAbandoning(true);
    try {
      const { error: planError } = await supabase
        .from('training_plans')
        .delete()
        .eq('user_id', userId)
        .eq('status', 'active');

      if (planError) throw planError;

      // Clear drills state and plan state
      setTrainingPlan(null);
      setAssignedDrills([]);
      setIsAbandonModalOpen(false);

      // Add a friendly coaching message explaining they can start a new plan
      const coachMessage: CoachMessage = {
        id: Date.now().toString(),
        role: 'coach',
        content: `Rencana latihan fokus "${translateFocus(trainingPlan.focus_weakness)}" Anda telah dihentikan dan dihapus. Anda sekarang bisa meminta saya kapan saja untuk membuat program latihan baru!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, coachMessage]);
    } catch (err: any) {
      console.error('Error abandoning training plan:', err);
      alert('Gagal menghentikan rencana latihan. Silakan coba lagi.');
    } finally {
      setIsAbandoning(false);
    }
  };

  const handleMentalAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSubmittingMental(true);
    try {
      const response = await fetch('/api/ai/mental-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          confidenceLevel: mentalConfidence,
          pressureSymptoms: mentalSymptoms,
          decisionStyle: mentalDecision,
          winningMentalityStyle: mentalWinning,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal mengirim asesmen mental');
      }

      const data = await response.json();
      if (data.success && data.assessment) {
        // Refetch both assessments to get previous comparison object
        const { data: latestMentalData } = await supabase
          .from('mental_assessment')
          .select('*')
          .eq('user_id', userId)
          .order('assessed_date', { ascending: false })
          .limit(2);

        if (latestMentalData && latestMentalData.length > 0) {
          setMentalAssessment(latestMentalData[0]);
          if (latestMentalData.length > 1) {
            setPreviousMentalAssessment(latestMentalData[1]);
          } else {
            setPreviousMentalAssessment(null);
          }
        } else {
          setMentalAssessment(data.assessment);
        }
        setIsMentalModalOpen(false);
        
        // Add a success coach message
        const coachMessage: CoachMessage = {
          id: Date.now().toString(),
          role: 'coach',
          content: `Asesmen psikologi tanding Anda telah berhasil dianalisis secara independen! Anda bisa melihat metrik kesiapan mental Anda diperbarui di dashboard training.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, coachMessage]);
      }
    } catch (err: any) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses asesmen mental. Silakan coba lagi.');
    } finally {
      setIsSubmittingMental(false);
    }
  };

  const trainingTopics = [
    { id: 'smash', icon: '💥', label: 'Smash Power', query: 'Cara melatih pukulan smash tajam dan bertenaga' },
    { id: 'backhand', icon: '🎾', label: 'Backhand Clear', query: 'Latihan teknik backhand badminton untuk pemula' },
    { id: 'footwork', icon: '🏃', label: 'Kecepatan Footwork', query: 'Drill footwork badminton meningkatkan kelincahan lapangan' },
    { id: 'stamina', icon: '⚡', label: 'Daya Tahan Fisik', query: 'Latihan fisik badminton untuk meningkatkan stamina dan nafas' },
    { id: 'netplay', icon: '🕸️', label: 'Net Play Tipis', query: 'Teknik netting tipis dan silang badminton' },
    { id: 'defense', icon: '🛡️', label: 'Defense Kokoh', query: 'Cara defense smash lawan dan penempatan posisi badminton' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-flex p-4 bg-blue-500/10 rounded-full mb-4 animate-pulse">
            <AlertCircle className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading...</h1>
          <p className="text-gray-600 dark:text-gray-400">Tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900 text-gray-900 dark:text-white px-4 lg:px-8 py-6 lg:py-8 transition-colors duration-300">
      <ProfileCompletionWarning />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md text-white">
              <Dumbbell className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                AI Coach & Training Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Pusat latihan badminton cerdas terintegrasi pelatih AI dan video panduan taktis
              </p>
            </div>
          </div>
          <button
            onClick={toggleTutorial}
            className="px-4 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 transition-all shadow-xs flex items-center justify-center gap-2 font-extrabold text-xs"
            title="Tampilkan panduan fitur"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Panduan Fitur</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800 mb-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`training-tab-dashboard flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            <Target className="w-4 h-4" />
            Dashboard Latihan
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`training-tab-chat flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Asisten Coach AI
            {messages.length > 1 && (
              <span className="ml-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {Math.ceil(messages.length / 2)}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`training-tab-videos flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'videos'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            <Video className="w-4 h-4" />
            Perpustakaan Video Latihan
          </button>
        </div>

        {/* LOADING INDICATOR FOR INITIAL FETCH */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-zinc-400 font-medium">Memuat data latihan...</p>
          </div>
        ) : (
          <>
            {/* 1. DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left and Middle Columns */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Hero Training Plan Card */}
                  {trainingPlan ? (
                    <div className="training-plan-card relative rounded-2xl p-6 md:p-8 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-xl overflow-hidden">
                      <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3 flex-1">
                          <span className="px-3 py-1 bg-white/20 text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-xs">
                            Rencana Latihan Aktif
                          </span>
                          <h2 className="text-3xl font-black tracking-tight mt-1 capitalize">
                            Fokus: {translateFocus(trainingPlan.focus_weakness)}
                          </h2>
                          <p className="text-blue-100 text-base max-w-lg leading-relaxed font-medium">
                            Target Pencapaian: {translateExpectedOutcome(trainingPlan.expected_outcome) || 'Meningkatkan refleks dan akurasi pukulan secara signifikan.'}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs font-bold text-blue-100 pt-2">
                            <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-lg">
                              <Clock className="w-3.5 h-3.5" /> {trainingPlan.duration_weeks} Minggu
                            </span>
                            <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-lg">
                              <Dumbbell className="w-3.5 h-3.5" /> {trainingPlan.days_per_week} Hari / Minggu
                            </span>
                            <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-lg capitalize">
                              <TrendingUp className="w-3.5 h-3.5" /> Level: {trainingPlan.progression_level}
                            </span>
                          </div>
                        </div>

                        {/* Circular Progress Indicator */}
                        <div className="flex flex-col items-center shrink-0 bg-white/10 p-5 rounded-xl border border-white/10 backdrop-blur-xs">
                          <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="48"
                                cy="48"
                                r="40"
                                className="text-white/10"
                                strokeWidth="8"
                                stroke="currentColor"
                                fill="transparent"
                              />
                              <circle
                                cx="48"
                                cy="48"
                                r="40"
                                className="text-blue-300"
                                strokeWidth="8"
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (251.2 * trainingPlan.progress_percentage) / 100}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                              />
                            </svg>
                            <span className="absolute text-xl font-extrabold">{trainingPlan.progress_percentage.toFixed(0)}%</span>
                          </div>
                          <span className="text-xs font-bold text-blue-200 mt-3 uppercase tracking-wider">Progres Program</span>
                          <button
                            onClick={() => setIsAbandonModalOpen(true)}
                            className="mt-3.5 px-3 py-1.5 bg-red-650/30 hover:bg-red-600/50 text-red-100 border border-red-500/20 hover:border-red-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                          >
                            <X className="w-3 h-3" /> Ganti / Hentikan Program
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="training-plan-card rounded-2xl p-8 border border-dashed border-gray-300 dark:border-zinc-800 text-center bg-white dark:bg-zinc-900/40">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum ada Program Latihan Aktif</h3>
                      <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto mb-6 text-sm">
                        Asisten Pelatih AI kami siap merancang program pelatihan khusus untuk Anda berdasarkan data kelemahan dan target performa Anda.
                      </p>
                      <button
                        onClick={() => triggerQuickAction('Tolong buatkan rencana latihan (training plan) baru berdurasi 4 minggu untuk meningkatkan kekuatan smash dan stamina saya.')}
                        className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-all shadow-md inline-flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" /> Buat Rencana Latihan AI
                      </button>
                    </div>
                  )}

                  {/* Assigned Drills Checklist Section */}
                  <div className="training-drills-card bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                          <ListTodo className="w-5 h-5 text-blue-500" /> Daftar Drill Latihan
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                          Klik drill untuk mencatat riwayat latihan Anda dan memberi rating kualitas
                        </p>
                      </div>
                      <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md">
                        {assignedDrills.filter(d => d.completed_at).length} / {assignedDrills.length} Selesai
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assignedDrills.map((drill) => {
                        const isCompleted = !!drill.completed_at;
                        return (
                          <div
                            key={drill.id}
                            onClick={() => handleOpenDrillModal(drill)}
                            className={`group p-4 rounded-xl border text-left cursor-pointer transition-all hover:shadow-md flex items-start gap-3.5 relative ${
                              isCompleted
                                ? 'bg-green-500/5 border-green-200 dark:border-green-900/30'
                                : 'bg-gray-50 dark:bg-zinc-800/40 border-gray-200 dark:border-zinc-800/80 hover:border-blue-300 dark:hover:border-blue-900/50'
                            }`}
                          >
                            <div className={`p-2.5 rounded-lg shrink-0 ${
                              isCompleted
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-blue-500/10 text-blue-500 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                            </div>

                            <div className="flex-1 min-w-0 pr-6">
                              <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                {translateDrillName(drill.drill_name)}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 flex items-center gap-1 bg-white dark:bg-zinc-900/50 w-fit px-1.5 py-0.5 rounded border border-gray-100 dark:border-zinc-800 font-semibold capitalize">
                                {translateDrillType(drill.drill_type)}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-zinc-400 mt-2.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" /> {drill.sets} Set x {drill.reps_per_set} Rep
                                </span>
                                {drill.completion_count > 0 && (
                                  <span className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                                    🔄 {drill.completion_count}x Selesai
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="absolute right-3 top-3">
                              {drill.quality_score && (
                                <div className="flex items-center text-amber-500 text-xs font-extrabold bg-amber-500/10 px-1.5 py-0.5 rounded-sm">
                                  ★ {drill.quality_score}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {assignedDrills.length === 0 && (
                        <div className="col-span-2 py-8 text-center bg-gray-50 dark:bg-zinc-900/30 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
                          <p className="text-sm text-gray-500 dark:text-zinc-400">Belum ada drill latihan yang ditugaskan.</p>
                          <p className="text-xs text-gray-400 mt-1">Tanya Pelatih AI untuk merekomendasikan drill latihan yang cocok!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Match & Psychological Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Performance Analytics Card */}
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
                      <h3 className="text-md font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Analisis Taktis Terkini
                      </h3>
                      
                      {isTacticalLoading ? (
                        <div className="space-y-4 animate-pulse">
                          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800/50">
                            <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-700 rounded-sm mb-2"></div>
                            <div className="h-5 w-24 bg-gray-200 dark:bg-zinc-700 rounded-md mb-2"></div>
                            <div className="h-3 w-full bg-gray-200 dark:bg-zinc-700 rounded-sm mb-1"></div>
                            <div className="h-3 w-4/5 bg-gray-200 dark:bg-zinc-700 rounded-sm"></div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="h-3 w-28 bg-gray-200 dark:bg-zinc-700 rounded-sm mb-1.5"></div>
                              <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full"></div>
                            </div>
                            <div>
                              <div className="h-3 w-32 bg-gray-200 dark:bg-zinc-700 rounded-sm mb-1.5"></div>
                              <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      ) : latestMatch ? (
                        <div className="space-y-4">
                          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800/50">
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Match Terakhir</span>
                              <span className={`px-2 py-0.5 ${latestMatch.isWinner ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'} font-extrabold rounded-sm`}>
                                {latestMatch.isWinner ? 'WIN' : 'LOSE'}
                              </span>
                            </div>
                            <p className="font-extrabold text-gray-900 dark:text-white text-base">
                              Skor: {latestMatch.userScore} - {latestMatch.opponentScore}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 font-semibold">
                              Lawan: {latestMatch.opponents && latestMatch.opponents.length > 0 ? latestMatch.opponents.join(' & ') : '-'}
                              {latestMatch.partner ? ` (Partner: ${latestMatch.partner})` : ' (Single)'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-zinc-400 italic mt-2">
                              &ldquo;{latestMatch.analysisText}&rdquo;
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-gray-600 dark:text-zinc-400">Efisiensi Serangan</span>
                                <span className="text-blue-600 dark:text-blue-400">{latestMatch.attackEfficiency}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${latestMatch.attackEfficiency}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-gray-600 dark:text-zinc-400">Kekokohan Pertahanan</span>
                                <span className="text-emerald-600 dark:text-emerald-400">{latestMatch.defenseSolidity}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${latestMatch.defenseSolidity}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800/50 text-center py-6">
                          <div className="text-gray-400 dark:text-zinc-500 mb-2">
                            <TrendingUp className="w-8 h-8 mx-auto opacity-45" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Belum Ada Riwayat Pertandingan</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-[240px] mx-auto">
                            Catat hasil pertandingan Anda di menu Analitik untuk menerima analisis taktis otomatis dari Coach AI.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Psychological / Mental Resilience Card */}
                    <div className="training-mental-card bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
                      <h3 className="text-md font-extrabold text-gray-900 dark:text-white mb-4 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-500" /> Kesiapan Mental & Psikologis
                        </span>
                        {mentalAssessment && (
                          <button 
                            onClick={() => setIsMentalModalOpen(true)}
                            title="Ulangi Asesmen"
                            className="text-xs text-purple-650 dark:text-purple-400 hover:text-purple-700 font-bold transition-colors"
                          >
                            Ulangi Asesmen
                          </button>
                        )}
                      </h3>

                      {mentalAssessment ? (
                        <div className="space-y-4">
                          {/* Outdated assessment notice (if older than 30 days / 1 month) */}
                          {(() => {
                            const isOutdated = new Date().getTime() - new Date(mentalAssessment.assessed_date).getTime() > 30 * 24 * 60 * 60 * 1000;
                            if (!isOutdated) return null;
                            return (
                              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                                <div className="space-y-1 text-left">
                                  <p className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                    Pembaruan Bulanan Diperlukan
                                  </p>
                                  <p className="text-[10px] text-gray-650 dark:text-zinc-300 leading-relaxed font-medium">
                                    Sudah lebih dari 1 bulan sejak asesmen mental terakhir Anda. Mari perbarui untuk menganalisis perkembangan psikologi tanding Anda saat ini!
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setIsMentalModalOpen(true)}
                                    className="mt-1.5 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[9px] font-extrabold transition-all"
                                  >
                                    Ambil Asesmen Sekarang
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="bg-gray-50 dark:bg-zinc-800/40 p-2.5 rounded-lg text-center border border-gray-100 dark:border-zinc-800">
                              <span className="text-[10px] uppercase font-bold text-gray-400">Tingkat Percaya Diri</span>
                              <p className="text-lg font-black text-blue-500 mt-1 flex items-center justify-center">
                                {mentalAssessment.confidence_level}/100
                                {renderTrend(mentalAssessment.confidence_level, previousMentalAssessment?.confidence_level)}
                              </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-zinc-800/40 p-2.5 rounded-lg text-center border border-gray-100 dark:border-zinc-800">
                              <span className="text-[10px] uppercase font-bold text-gray-400">Respon Tekanan</span>
                              <p className="text-lg font-black text-purple-500 mt-1 flex items-center justify-center">
                                {mentalAssessment.pressure_response_score}/100
                                {renderTrend(mentalAssessment.pressure_response_score, previousMentalAssessment?.pressure_response_score)}
                              </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-zinc-800/40 p-2.5 rounded-lg text-center border border-gray-100 dark:border-zinc-800">
                              <span className="text-[10px] uppercase font-bold text-gray-400">Konsistensi Mental</span>
                              <p className="text-lg font-black text-emerald-500 mt-1 flex items-center justify-center">
                                {mentalAssessment.consistency_score}/100
                                {renderTrend(mentalAssessment.consistency_score, previousMentalAssessment?.consistency_score)}
                              </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-zinc-800/40 p-2.5 rounded-lg text-center border border-gray-100 dark:border-zinc-800">
                              <span className="text-[10px] uppercase font-bold text-gray-400">Mental Juara</span>
                              <p className="text-lg font-black text-amber-500 mt-1 flex items-center justify-center">
                                {mentalAssessment.winning_mentality_score}/100
                                {renderTrend(mentalAssessment.winning_mentality_score, previousMentalAssessment?.winning_mentality_score)}
                              </p>
                            </div>
                          </div>

                          {/* Findings Description */}
                          {mentalAssessment.findings && (
                            <div className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed bg-gray-50 dark:bg-zinc-800/20 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                              {typeof mentalAssessment.findings === 'object' 
                                ? (mentalAssessment.findings.description || mentalAssessment.findings.assessment || 'Asesmen mental Anda stabil.')
                                : mentalAssessment.findings}
                            </div>
                          )}

                          {/* Strengths List */}
                          {Array.isArray(mentalAssessment.mental_strengths) && mentalAssessment.mental_strengths.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-extrabold text-emerald-600 dark:text-emerald-450 tracking-wider">Kelebihan Mental:</span>
                              <ul className="list-disc list-inside text-xs text-gray-600 dark:text-zinc-300 space-y-1 pl-1">
                                {mentalAssessment.mental_strengths.map((str: string, index: number) => (
                                  <li key={index} className="leading-relaxed">{str}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Improvements List */}
                          {Array.isArray(mentalAssessment.improvement_areas) && mentalAssessment.improvement_areas.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-extrabold text-amber-600 dark:text-amber-450 tracking-wider">Area Peningkatan:</span>
                              <ul className="list-disc list-inside text-xs text-gray-600 dark:text-zinc-300 space-y-1 pl-1">
                                {mentalAssessment.improvement_areas.map((imp: string, index: number) => (
                                  <li key={index} className="leading-relaxed">{imp}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Recommendations List */}
                          {Array.isArray(mentalAssessment.recommendations) && mentalAssessment.recommendations.length > 0 && (
                            <div className="p-3 bg-purple-500/5 border border-purple-200/40 dark:border-purple-900/30 rounded-xl space-y-1.5 animate-pulse-once">
                              <span className="text-[10px] uppercase font-extrabold text-purple-600 dark:text-purple-400 tracking-wider block">Rekomendasi Latihan Mental:</span>
                              <ul className="list-decimal list-inside text-xs text-gray-650 dark:text-zinc-300 space-y-1 pl-1 font-medium">
                                {mentalAssessment.recommendations.map((rec: string, index: number) => (
                                  <li key={index} className="leading-relaxed">{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 dark:bg-zinc-800/20 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 flex flex-col justify-center items-center">
                          <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-[200px] mb-3">Belum ada asesmen psikologi tanding.</p>
                          <button
                            onClick={() => setIsMentalModalOpen(true)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[11px] font-bold transition-all shadow-xs"
                          >
                            Mulai Asesmen AI
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Quick Action cards */}
                <div className="space-y-6">
                  {/* Quick AI Coaching Actions */}
                  <div className="training-quick-actions bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
                    <h3 className="text-md font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-500" /> Aksi Cepat Coach AI
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => triggerQuickAction('Tolong berikan analisis kelemahan taktis dan rekomendasi perbaikannya berdasarkan profil badminton saya.')}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-blue-50 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl transition-all text-left flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📊</span>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Analisis Kelemahan Taktis</p>
                            <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">Analisis kelemahan per zona lapangan</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => triggerQuickAction('Tolong buatkan rencana latihan (training plan) baru berdurasi 4 minggu untuk meningkatkan kekuatan smash dan stamina saya.')}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-blue-50 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl transition-all text-left flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🎯</span>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Buat Rencana Latihan</p>
                            <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">Generator target rencana drill mingguan</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => triggerQuickAction('Tolong berikan asesmen mental tanding saya dan tips mengatasi tekanan saat match poin.')}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-blue-50 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl transition-all text-left flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🧠</span>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Asesmen Mental Tanding</p>
                            <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">Ukur tingkat mentalitas juara Anda</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => triggerQuickAction('Tolong berikan prediksi match dan taktik bermain untuk game berikutnya melawan pemain dengan tipe penyerang agresif.')}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-blue-50 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl transition-all text-left flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🔮</span>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Prediksi Taktis Match</p>
                            <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">Taktik spesifik hadapi jenis lawan</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Quick video tutorials search banner */}
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl"></div>
                    <h4 className="font-black text-lg mb-2">Video Tutorial Pilihan</h4>
                    <p className="text-xs text-orange-100 leading-relaxed mb-4 font-medium">
                      Butuh tutorial visual? Jelajahi perpustakaan video latihan khusus yang ditenagai rekomendasi cerdas YouTube.
                    </p>
                    <button
                      onClick={() => setActiveTab('videos')}
                      className="px-4 py-2 bg-white text-orange-600 font-extrabold text-xs rounded-lg transition-all hover:bg-orange-50 flex items-center gap-2"
                    >
                      Buka Galeri Video <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CHAT COACH TAB */}
            {activeTab === 'chat' && (
              <div className="training-chat-container bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-md overflow-hidden flex flex-col h-[650px]">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-xs font-black">
                      🤖
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                        Dlob AI Coach Agent
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      </h3>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-400">Aktif & Siap Membantu</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Bersihkan riwayat percakapan sesi ini?')) {
                        try {
                          const { error } = await supabase
                            .from('coaching_sessions')
                            .delete()
                            .eq('user_id', userId);
                          
                          if (error) {
                            console.error('Error clearing session history:', error);
                          } else {
                            console.log('Session history cleared successfully!');
                          }
                        } catch (err) {
                          console.error('Exception clearing session history:', err);
                        }

                        setMessages([
                          {
                            id: 'welcome-reset',
                            role: 'coach',
                            content: `Halo ${memberName}! Sesi dibersihkan. Apa yang ingin Anda diskusikan atau latih hari ini?`,
                            timestamp: new Date()
                          }
                        ]);
                      }
                    }}
                    title="Bersihkan Percakapan"
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                  >
                    🗑️
                  </button>
                </div>

                {/* Message Log Screen */}
                <div className="training-chat-box flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/50 dark:bg-zinc-950/20">
                  {messages.map((msg) => {
                    const isCoach = msg.role === 'coach';
                    return (
                      <div key={msg.id} className={`flex ${isCoach ? 'justify-start' : 'justify-end'} items-start gap-3`}>
                        {isCoach && (
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            C
                          </div>
                        )}
                        <div className="max-w-[80%] flex flex-col gap-1.5">
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                              isCoach
                                ? 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-100'
                                : 'bg-blue-600 text-white font-medium'
                            }`}
                          >
                            {/* Render Message Text */}
                            <FormattedMarkdown text={msg.content} />

                            {/* Render Autonomous Agent Tools Badges */}
                            {isCoach && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-800/80 flex flex-wrap gap-1.5 items-center">
                                <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 mr-1 flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" /> Agent Action:
                                </span>
                                {msg.toolsUsed.map((tool, idx) => (
                                  <span
                                    key={`${tool}-${idx}`}
                                    className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-sm border border-blue-100 dark:border-blue-900/30 capitalize"
                                  >
                                    🔧 {tool.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Render AI Action Items checklist */}
                            {isCoach && msg.actionItems && msg.actionItems.length > 0 && (
                              <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-gray-100 dark:border-zinc-800">
                                <p className="text-xs font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1">
                                  🎯 Action Items Pelatihan:
                                </p>
                                <ul className="space-y-1.5 text-xs text-gray-600 dark:text-zinc-300">
                                  {msg.actionItems.map((item: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="w-4 h-4 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                                        {idx + 1}
                                      </span>
                                      <span className="font-medium">
                                        {typeof item === 'object' && item !== null
                                          ? (item.title || item.task || item.description || JSON.stringify(item))
                                          : item}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 dark:text-zinc-500 self-end px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Thinking Spinner */}
                  {isSendingMessage && (
                    <div className="flex justify-start items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs animate-bounce shrink-0 mt-0.5">
                        ⏳
                      </div>
                      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm text-gray-500 dark:text-zinc-400 shadow-xs flex items-center gap-2 font-medium">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                        AI Coach sedang menganalisis performa Anda...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <div className="training-chat-input p-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Tanya coach tentang program latihan, taktik lawan, cara smash, dll..."
                      disabled={isSendingMessage}
                      className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isSendingMessage || !chatInput.trim()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-zinc-800 disabled:text-gray-400 dark:disabled:text-zinc-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                    <span>Coba tanya:</span>
                    <button
                      onClick={() => setChatInput('Bagaimana melatih kesiapan mental tanding?')}
                      className="hover:underline text-blue-500"
                    >
                      &ldquo;Kesiapan mental tanding&rdquo;
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setChatInput('Berikan latihan fisik penunjang stamina bulutangkis')}
                      className="hover:underline text-blue-500"
                    >
                      &ldquo;Fisik penunjang stamina&rdquo;
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. VIDEOS & TUTORIALS TAB */}
            {activeTab === 'videos' && (
              <div className="space-y-8">
                {/* Search Header Container */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">
                    Cari Video Tutorial Badminton Berbasis AI
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">
                    Ketik teknik spesifik yang ingin Anda latih. AI Coach akan memberikan saran singkat lalu menyajikan daftar video YouTube teratas.
                  </p>

                  <div className="training-search-bar relative mb-6">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari tutorial... contoh: 'Cara meningkatkan smash yang powerful' atau 'Teknik netting tipis'"
                      value={videoSearchQuery}
                      onChange={(e) => setVideoSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleVideoSearch(videoSearchQuery)}
                      className="w-full pl-12 pr-28 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                    />
                    <button
                      onClick={() => handleVideoSearch(videoSearchQuery)}
                      disabled={isSearchingVideos || !videoSearchQuery.trim()}
                      className="absolute right-2 top-2 px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg transition-all shadow-xs"
                    >
                      {isSearchingVideos ? 'Cari...' : 'Cari'}
                    </button>
                  </div>

                  {/* Popular Topics Tags Grid */}
                  <div className="training-popular-topics">
                    <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-3">Topik Populer:</p>
                    <div className="flex flex-wrap gap-2.5">
                      {trainingTopics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => handleVideoSearch(topic.query)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-blue-50 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-lg text-xs font-semibold transition-all"
                        >
                          <span>{topic.icon}</span>
                          <span className="text-gray-700 dark:text-zinc-300">{topic.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="training-main-content w-full">
                  {/* SEARCHING STATE */}
                  {isSearchingVideos && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                      <p className="text-sm text-gray-500 dark:text-zinc-400 font-semibold">Menganalisis teknik & mencari video panduan terbaik...</p>
                    </div>
                  )}

                  {/* RESULTS */}
                  {!isSearchingVideos && searchSuccess && (
                    <div className="space-y-6">
                      {/* AI Coach Advice Box */}
                      {videoAdvice && (
                        <div className="bg-blue-500/5 dark:bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl p-5 md:p-6">
                          <h4 className="font-extrabold text-sm text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            💡 Saran Singkat AI Coach:
                          </h4>
                          <p className="text-sm text-gray-800 dark:text-zinc-200 leading-relaxed font-medium">
                            {videoAdvice}
                          </p>
                        </div>
                      )}

                      {/* Video Cards Grid */}
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          🎥 Video Tutorial Terkait ({videosList.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {videosList.map((video) => (
                            <a
                              key={video.id}
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                            >
                              {/* Video Thumbnail */}
                              <div className="relative aspect-video w-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                    <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                                  </div>
                                </div>
                                <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                  {video.duration}
                                </span>
                              </div>

                              {/* Video Metadata */}
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                                <div>
                                  <h5 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 leading-relaxed group-hover:text-blue-500 transition-colors" dangerouslySetInnerHTML={{ __html: video.title }}>
                                  </h5>
                                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1.5 font-medium">
                                    Saluran: {video.channelTitle}
                                  </p>
                                </div>
                                <div className="pt-2.5 border-t border-gray-100 dark:border-zinc-850 flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                  <span>Tonton di YouTube</span>
                                  <ExternalLink className="w-3 h-3" />
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>

                        {videosList.length === 0 && (
                          <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-850 rounded-xl">
                            <p className="text-sm text-gray-500">Tidak ada video yang ditemukan. Cari topik lainnya.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DEFAULT VIDEO INTRO SCREEN (Before searching) */}
                  {!isSearchingVideos && !searchSuccess && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left Column: Intro */}
                      <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 text-center flex flex-col justify-center items-center shadow-xs">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/20 text-orange-500 rounded-full flex items-center justify-center mb-4">
                          <Play className="w-8 h-8 fill-orange-500 text-orange-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Perpustakaan Video Badminton</h3>
                        <p className="text-sm text-gray-600 dark:text-zinc-400 max-w-md mx-auto mb-4 leading-relaxed">
                          Silakan ketik teknik yang ingin dicari di kolom pencarian di atas, atau klik salah satu Topik Populer untuk memulainya.
                        </p>
                      </div>

                      {/* Right Column: Tips & History */}
                      <div className="space-y-6">
                        {/* Tips Section */}
                        <div className="training-tips bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
                          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            💡 Tips Bertanya
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed font-semibold">
                            Jelaskan masalah spesifik Anda secara detail (misal: "smash sering nyangkut net") dan sertakan level bermain Anda (pemula/menengah) untuk mendapatkan saran latihan yang paling optimal dari AI Coach.
                          </p>
                        </div>

                        {/* History Section */}
                        <div className="training-history bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
                          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            📚 Riwayat Latihan
                          </h4>
                          {/* List of recent queries */}
                          <div className="space-y-2">
                            {recentQueries.map((q, idx) => (
                              <div key={idx} className="group/item flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/40 hover:bg-blue-50 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800 transition-all">
                                <button
                                  onClick={() => handleVideoSearch(q)}
                                  className="text-xs text-left font-semibold text-gray-700 dark:text-zinc-300 truncate flex-1 focus:outline-none"
                                >
                                  {q}
                                </button>
                                <button
                                  onClick={() => handleDeleteQuery(q)}
                                  className="opacity-0 group-hover/item:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-opacity"
                                  title="Hapus riwayat"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            {recentQueries.length === 0 && (
                              <p className="text-xs text-gray-500 text-center py-4">Belum ada riwayat pencarian.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* DRILL LOGGING MODAL */}
      {selectedDrill && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-850 flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Catat Riwayat Latihan</h3>
              <button
                onClick={() => setSelectedDrill(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                  {translateDrillType(selectedDrill.drill_type)}
                </span>
                <h4 className="text-lg font-black text-gray-900 dark:text-white mt-2">{translateDrillName(selectedDrill.drill_name)}</h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  Target Asli: <span className="font-bold text-gray-700 dark:text-zinc-300">{selectedDrill.sets} set x {selectedDrill.reps_per_set} rep</span> (Tingkat Kesulitan: {translateDifficulty(selectedDrill.current_difficulty)})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 mb-1.5">Set Selesai</label>
                  <input
                    type="number"
                    value={logSets}
                    onChange={(e) => setLogSets(parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white font-semibold outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 mb-1.5">Repetisi per Set</label>
                  <input
                    type="number"
                    value={logReps}
                    onChange={(e) => setLogReps(parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white font-semibold outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quality rating slider */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 mb-1.5 flex justify-between">
                  <span>Rating Kualitas Pukulan</span>
                  <span className="text-amber-500 font-extrabold">{logRating} / 5</span>
                </label>
                <div className="flex items-center gap-2 justify-center py-2 bg-gray-50 dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setLogRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= logRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300 dark:text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 text-center mt-2">
                  1 = Banyak error/sulit, 5 = Sempurna/konsisten
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-850 bg-gray-50 dark:bg-zinc-900/50 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedDrill(null)}
                disabled={isSubmittingDrill}
                className="flex-1 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-200 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitDrillLog}
                disabled={isSubmittingDrill}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingDrill ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Latihan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Independent Mental Assessment Modal */}
      {isMentalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <form onSubmit={handleMentalAssessmentSubmit}>
              <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
                <div className="flex items-center gap-3 text-purple-650 mb-2">
                  <Brain className="w-8 h-8 shrink-0 text-purple-500" />
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Asesmen Psikologi Tanding Mandiri</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Analisis kesiapan mental dan ketahanan tekanan tanding Anda.</p>
                  </div>
                </div>

                {/* Q1: Confidence Level */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                    1. Tingkat Kepercayaan Diri ({mentalConfidence}/100)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={mentalConfidence}
                    onChange={(e) => setMentalConfidence(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    {mentalConfidence < 40 && 'Sangat Cemas / Kurang Yakin'}
                    {mentalConfidence >= 40 && mentalConfidence < 70 && 'Cukup Percaya Diri (Fluktuatif)'}
                    {mentalConfidence >= 70 && mentalConfidence < 90 && 'Percaya Diri Tinggi & Stabil'}
                    {mentalConfidence >= 90 && 'Sangat Optimis / Mentalitas Juara'}
                  </div>
                </div>

                {/* Q2: Pressure Symptoms (Checkboxes) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                    2. Reaksi Fisik/Mental saat Skor Ketat (Pilih yang sesuai)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'sweaty', label: 'Tangan berkeringat / tegang' },
                      { id: 'blank', label: 'Pikiran kosong (blank)' },
                      { id: 'rushed', label: 'Terburu-buru ingin mematikan bola' },
                      { id: 'cautious', label: 'Terlalu ragu-ragu / takut salah' },
                      { id: 'heart', label: 'Jantung berdebar cepat' },
                      { id: 'calm', label: 'Tetap tenang & fokus' },
                    ].map((item) => {
                      const isChecked = mentalSymptoms.includes(item.label);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setMentalSymptoms(mentalSymptoms.filter((s) => s !== item.label));
                            } else {
                              setMentalSymptoms([...mentalSymptoms, item.label]);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                            isChecked
                              ? 'border-purple-500 bg-purple-500/5 text-purple-700 dark:text-purple-300'
                              : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q3: Focus and Decision Making (Radio Group) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                    3. Pengambilan Keputusan Di Bawah Tekanan
                  </label>
                  <div className="space-y-2">
                    {[
                      'Cenderung bermain sangat aman (pasif/bertahan)',
                      'Sering melakukan kesalahan sendiri yang tidak perlu (unforced error)',
                      'Tetap tenang dan membuat pilihan pukulan taktis yang cerdas',
                    ].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setMentalDecision(option)}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                          mentalDecision === option
                            ? 'border-purple-500 bg-purple-500/5 text-purple-700 dark:text-purple-300'
                            : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q4: Winning Mentality (Radio Group) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                    4. Fokus Pikiran Saat Menjelang Match Point
                  </label>
                  <div className="space-y-2">
                    {[
                      'Fokus memenangkan rally demi rally demi meraih poin',
                      'Khawatir berlebih akan kekalahan atau kehilangan momentum',
                      'Terbawa emosi atau sulit melupakan kesalahan/error sebelumnya',
                    ].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setMentalWinning(option)}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                          mentalWinning === option
                            ? 'border-purple-500 bg-purple-500/5 text-purple-700 dark:text-purple-300'
                            : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-850 bg-gray-50 dark:bg-zinc-900/50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsMentalModalOpen(false)}
                  disabled={isSubmittingMental}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-200 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMental || !mentalDecision || !mentalWinning}
                  className="flex-1 px-4 py-2.5 bg-purple-650 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingMental ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menganalisis...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Kirim Asesmen</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Abandon/Change Training Plan Confirmation Modal */}
      {isAbandonModalOpen && trainingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <AlertCircle className="w-8 h-8 shrink-0" />
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Ganti / Hentikan Program</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4 leading-relaxed">
                Apakah Anda yakin ingin menghentikan rencana latihan aktif saat ini: <strong className="text-gray-900 dark:text-white capitalize">Fokus {translateFocus(trainingPlan.focus_weakness)}</strong>?
              </p>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl mb-4 text-xs text-red-700 dark:text-red-455 flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Konsekuensi Penting:</strong> Tindakan ini tidak dapat dibatalkan (cannot be undone). Seluruh progres program saat ini akan diarsipkan dan tidak dapat dilanjutkan kembali.
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                Setelah dihentikan, Anda dapat meminta Asisten Coach AI untuk merancang rencana latihan baru.
              </p>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-850 bg-gray-50 dark:bg-zinc-900/50 flex gap-3">
              <button
                type="button"
                onClick={() => setIsAbandonModalOpen(false)}
                disabled={isAbandoning}
                className="flex-1 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-200 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAbandonTrainingPlan}
                disabled={isAbandoning}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isAbandoning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Ya, Hentikan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay
        steps={tutorialSteps}
        isActive={isTutorialActive}
        onClose={closeTutorial}
        tutorialKey="member-training"
        onStepChange={(stepIndex) => {
          const step = tutorialSteps[stepIndex];
          if (!step) return;
          
          if (step.element.includes('dashboard') || 
              step.element.includes('plan-card') || 
              step.element.includes('drills-card') || 
              step.element.includes('mental-card') || 
              step.element.includes('quick-actions')) {
            setActiveTab('dashboard');
          } else if (step.element.includes('chat')) {
            setActiveTab('chat');
          } else if (step.element.includes('videos') || 
                     step.element.includes('search-bar') || 
                     step.element.includes('popular-topics') || 
                     step.element.includes('tips') || 
                     step.element.includes('history')) {
            setActiveTab('videos');
          }
        }}
      />
    </div>
  );
}
