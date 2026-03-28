'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { TrendingUp, Shield, Target, Zap, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TrainingCoachPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const userId = user?.id;

  // State
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const [assignedDrills, setAssignedDrills] = useState<AssignedDrill[]>([]);
  const [mentalAssessment, setMentalAssessment] = useState<MentalAssessment | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [memberName, setMemberName] = useState('Pemain');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recentWinRate, setRecentWinRate] = useState(0);
  const [selectedDrill, setSelectedDrill] = useState<AssignedDrill | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get member name from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, full_name')
          .eq('user_id', userId)
          .single();

        if (profileData) {
          setMemberName(profileData.display_name || profileData.full_name || 'Coach Member');
        }

        // Fetch active training plan
        const { data: planData } = await supabase
          .from('training_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (planData && planData.length > 0) {
          setTrainingPlan(planData[0]);
        }

        // Fetch assigned drills
        const { data: drillsData } = await supabase
          .from('assigned_drills')
          .select('*')
          .eq('user_id', userId)
          .order('assigned_date', { ascending: false });

        if (drillsData) {
          setAssignedDrills(drillsData);
        }

        // Fetch latest mental assessment
        const { data: assessmentData } = await supabase
          .from('mental_assessment')
          .select('*')
          .eq('user_id', userId)
          .order('assessed_date', { ascending: false })
          .limit(1);

        if (assessmentData && assessmentData.length > 0) {
          setMentalAssessment(assessmentData[0]);
        }

        // Initialize or retrieve session ID
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

        // Load recent coaching sessions as message history
        const { data: sessionsData } = await supabase
          .from('coaching_sessions')
          .select('query, response, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(5);

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
        }
      } catch (error) {
        console.error('Error fetching training data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message to coach agent
  const handleSendMessage = async () => {
    if (!input.trim() || !userId || !sessionId) return;

    const userMessage: CoachMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSendingMessage(true);

    try {
      // Call coaching agent endpoint (autonomous mode)
      const response = await fetch('/api/ai/coaching-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          userId,
          memberName,
          sessionId,
          agentMode: 'autonomous', // Let agent decide what to do
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get coaching response');
      }

      const data = await response.json();

      const coachMessage: CoachMessage = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: data.response || 'Maaf, saya tidak bisa merespons sekarang.',
        timestamp: new Date(),
        toolsUsed: data.toolsExecuted,
        actionItems: data.actionItems,
      };

      setMessages((prev) => [...prev, coachMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: CoachMessage = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: 'Oops! Ada error saat memproses. Coba lagi sebentar.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Mark drill as completed
  const completeDrill = async (drillId: string) => {
    try {
      const { error } = await supabase
        .from('assigned_drills')
        .update({
          completed_at: new Date().toISOString(),
          completion_count: (assignedDrills.find(d => d.id === drillId)?.completion_count || 0) + 1,
        })
        .eq('id', drillId);

      if (!error) {
        setAssignedDrills(prev =>
          prev.map(d =>
            d.id === drillId
              ? { ...d, completed_at: new Date().toISOString(), completion_count: (d.completion_count || 0) + 1 }
              : d
          )
        );
      }
    } catch (error) {
      console.error('Error completing drill:', error);
    }
  };

  // Rate drill quality
  const rateDrill = async (drillId: string, score: number) => {
    try {
      const { error } = await supabase
        .from('assigned_drills')
        .update({ quality_score: score })
        .eq('id', drillId);

      if (!error) {
        setAssignedDrills(prev =>
          prev.map(d => d.id === drillId ? { ...d, quality_score: score } : d)
        );
      }
    } catch (error) {
      console.error('Error rating drill:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-zinc-950' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Memuat Training Coach...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-zinc-950' : 'bg-gray-50'} py-6 px-4 lg:px-8 transition-colors duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            🏅 AI Coach
          </h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
            Personalisasi coaching & analisis performa
          </p>
        </div>
        <button className={`p-3 rounded-lg transition-colors ${theme === 'dark' ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-gray-200 hover:bg-gray-300'}`}>
          ⚙️
        </button>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - Coaching Insights */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Weekly Summary Card - Large Featured */}
          {trainingPlan ? (
            <div className={`rounded-xl p-8 ${theme === 'dark' ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-500 to-blue-600'} text-white shadow-lg overflow-hidden relative`}>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <p className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-blue-100' : 'text-blue-50'}`}>
                  📊 RINGKASAN MINGGUAN
                </p>
                <h2 className="text-3xl font-bold mb-3">
                  {trainingPlan.progress_percentage.toFixed(0)}% Progress
                </h2>
                <p className={`text-lg ${theme === 'dark' ? 'text-blue-100' : 'text-blue-50'}`}>
                  Rencana latihan <span className="font-bold">{trainingPlan.focus_weakness.replace(/_/g, ' ')}</span> Anda berkembang sangat baik. Terus pertahankan momentum!
                </p>
                <div className="flex items-center gap-3 mt-4 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Progres konsisten minggu ini</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`rounded-xl p-8 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-gradient-to-br from-gray-200 to-gray-300'} text-center`}>
              <p className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Belum ada rencana latihan aktif</p>
            </div>
          )}

          {/* Recent Performance Analysis */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'} shadow-sm`}>
            <h3 className={`text-lg font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Analisis Performa Terkini
            </h3>
            
            <div className="space-y-4">
              {/* Sample Performance Cards */}
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-zinc-800/50 border border-zinc-700/50' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                      VS KOMPETITOR TERBARU
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      21-18, 19-21, 21-15
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full text-sm font-bold">
                    MENANG
                  </span>
                </div>
                <p className={`text-sm italic ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                  "Anda paling kuat di set kedua. Stamina Anda memuncak di menit ke-45."
                </p>
                <div className="flex gap-6 mt-4 pt-4 border-t border-gray-300/30">
                  <div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Intensitas</p>
                    <p className={`font-bold text-orange-500`}>Tinggi</p>
                  </div>
                  <div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Kesalahan</p>
                    <p className={`font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Rendah</p>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
                  <Shield className={`w-5 h-5 mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                  <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} mb-2`}>
                    ANALISIS DEFENSIVE
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Perbaiki back court defense. 40% poin hilang di sudut backhand.
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
                  <Zap className={`w-5 h-5 mb-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                  <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} mb-2`}>
                    TAKTIS
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                    Net play Anda 12% lebih cepat dari rata-rata bulanan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Actions & Drills */}
        <div className="space-y-6">
          
          {/* Next Steps */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'} shadow-sm`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Langkah Berikutnya
              </h3>
              <ArrowRight className={`w-5 h-5 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
            </div>

            <div className="space-y-3">
              {assignedDrills.slice(0, 3).map((drill, idx) => (
                <div
                  key={drill.id}
                  onClick={() => setSelectedDrill(drill)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    theme === 'dark'
                      ? 'bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {drill.drill_name}
                      </p>
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                        {drill.sets}x{drill.reps_per_set} - ~45 menit
                      </p>
                    </div>
                    <Clock className={`w-4 h-4 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                  </div>
                </div>
              ))}
              {assignedDrills.length === 0 && (
                <p className={`text-sm ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-600'}`}>
                  Tanya coach untuk latihan yang dipersonalisasi
                </p>
              )}
            </div>

            {assignedDrills.length > 3 && (
              <button className={`w-full mt-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}>
                Lihat Semua Drills
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'} shadow-sm`}>
            <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Aksi Cepat
            </h3>
            <div className="space-y-2">
              <button className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}>
                📊 Analisis Kelemahan
              </button>
              <button className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}>
                🎯 Buat Rencana Latihan
              </button>
              <button className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}>
                🧠 Asessment Mental
              </button>
            </div>
          </div>

          {/* Video Content Placeholder */}
          <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'} shadow-sm`}>
            <div className={`h-40 ${theme === 'dark' ? 'bg-gradient-to-br from-orange-900/30 to-orange-800/20' : 'bg-gradient-to-br from-orange-100 to-orange-50'} flex items-center justify-center relative`}>
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <div className={`w-12 h-12 rounded-full ${theme === 'dark' ? 'bg-white/20' : 'bg-white/40'} flex items-center justify-center backdrop-blur-sm`}>
                  ▶️
                </div>
              </div>
              <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>
                APEX ARENA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Input Section */}
      <div className="mt-8">
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'} shadow-sm`}>
          <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
                💡 Tanya coach apa saja tentang performa, latihan, atau strategi Anda
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Minta rencana latihan, analisis, atau prediksi..."
              className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } outline-none focus:ring-2 focus:ring-blue-500/20`}
              disabled={isSendingMessage}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSendingMessage}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors text-white ${
                isSendingMessage
                  ? theme === 'dark'
                    ? 'bg-zinc-700'
                    : 'bg-gray-400'
                  : theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isSendingMessage ? '⏳' : '▶️'}
            </button>
          </div>
        </div>
      </div>

      {/* Chat History - Minimal */}
      {messages.length > 0 && (
        <div className="mt-8">
          <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Riwayat Percakapan
          </h3>
          <div className={`max-h-64 overflow-y-auto space-y-3 rounded-xl p-4 ${theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'}`}>
            {messages.slice(-5).map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`px-4 py-2 rounded-lg max-w-xs text-sm ${
                    msg.role === 'user'
                      ? theme === 'dark'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : theme === 'dark'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
