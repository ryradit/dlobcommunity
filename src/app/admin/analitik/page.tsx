'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { TrendingUp, Users, Trophy, Edit, Save, X, HelpCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/LoadingSkeletons';
import TutorialOverlay from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';

interface Match {
  id: string;
  match_number: number;
  shuttlecock_count: number;
  cost_per_shuttlecock: number;
  total_cost: number;
  cost_per_member: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  match_date?: string;
  team1_player1?: string;
  team1_player2?: string;
  team2_player1?: string;
  team2_player2?: string;
  team1_score?: number;
  team2_score?: number;
  winner?: 'team1' | 'team2' | null;
}

interface MatchMember {
  id: string;
  member_name: string;
  match_id: string;
}

export default function AdminAnalitikPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchMembers, setMatchMembers] = useState<Record<string, MatchMember[]>>({});
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    team1_player1: '',
    team1_player2: '',
    team2_player1: '',
    team2_player2: '',
    team1_score: 0,
    team2_score: 0,
  });

  // Tutorial for analitik page
  const tutorialSteps = getTutorialSteps('analitik');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('admin-analitik', tutorialSteps);

  useEffect(() => {
    fetchMatches();
  }, [pathname, selectedMonth]);

  async function fetchMatches() {
    try {
      setLoading(true);
      
      // Calculate month boundaries
      const targetMonth = selectedMonth.getMonth() + 1;
      const targetYear = selectedMonth.getFullYear();
      const monthStart = new Date(targetYear, targetMonth - 1, 1);
      const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);
      
      // Fetch matches with caching for selected month
      const matchesResult = await cachedQuery(
        `admin-analytics-matches-${targetMonth}-${targetYear}`,
        async () => {
          const result = await supabase
            .from('matches')
            .select('*')
            .gte('match_date', monthStart.toISOString())
            .lte('match_date', monthEnd.toISOString())
            .order('match_date', { ascending: false });
          return result;
        },
        30000 // 30 seconds cache
      );
      
      const matchesRes = matchesResult as { data: Match[] | null; error: any };
      if (!matchesRes.error && matchesRes.data) {
        setMatches(matchesRes.data);

        // Fetch match members in parallel for all matches
        const memberQueries = matchesRes.data.map(match =>
          supabase
            .from('match_members')
            .select('id, member_name, match_id')
            .eq('match_id', match.id)
        );
        
        const membersResults = await Promise.allSettled(memberQueries);
        const membersMap: Record<string, MatchMember[]> = {};
        
        membersResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const res = result.value as { data: MatchMember[] | null; error: any };
            if (!res.error && res.data) {
              membersMap[matchesRes.data![index].id] = res.data;
            }
          }
        });

        setMatchMembers(membersMap);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }

  function selectMatch(match: Match) {
    setSelectedMatch(match);
    setFormData({
      team1_player1: match.team1_player1 || '',
      team1_player2: match.team1_player2 || '',
      team2_player1: match.team2_player1 || '',
      team2_player2: match.team2_player2 || '',
      team1_score: match.team1_score || 0,
      team2_score: match.team2_score || 0,
    });
    setEditMode(false);
  }

  async function saveMatchInfo() {
    if (!selectedMatch) return;

    try {
      // Determine winner based on highest score
      let winner: 'team1' | 'team2' | null = null;
      if (formData.team1_score > formData.team2_score) {
        winner = 'team1';
      } else if (formData.team2_score > formData.team1_score) {
        winner = 'team2';
      }
      // If equal or both 0, winner stays null

      const { error } = await supabase
        .from('matches')
        .update({
          team1_player1: formData.team1_player1,
          team1_player2: formData.team1_player2,
          team2_player1: formData.team2_player1,
          team2_player2: formData.team2_player2,
          team1_score: formData.team1_score,
          team2_score: formData.team2_score,
          winner,
          status: winner ? 'completed' : 'active',
        })
        .eq('id', selectedMatch.id);

      if (error) throw error;

      alert('Informasi pertandingan berhasil disimpan!');
      setEditMode(false);
      fetchMatches();
    } catch (error) {
      console.error('Error saving match info:', error);
      alert('Gagal menyimpan informasi pertandingan');
    }
  }

  const getAvailablePlayers = () => {
    if (!selectedMatch) return [];
    return matchMembers[selectedMatch.id]?.map(m => m.member_name) || [];
  };

  // Calculate monthly statistics
  const monthlyStats = {
    totalMatches: matches.length,
    completedMatches: matches.filter(m => m.winner).length,
    activeMatches: matches.filter(m => !m.winner && m.status === 'active').length,
    completionRate: matches.length > 0 ? Math.round((matches.filter(m => m.winner).length / matches.length) * 100) : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 lg:p-8 transition-colors duration-300">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-zinc-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">
      <div>
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Analitik Pertandingan</h1>
            <p className="text-gray-600 dark:text-zinc-400 font-medium transition-colors duration-300">Kelola informasi dan hasil pertandingan</p>
          </div>
          
          <button
            onClick={toggleTutorial}
            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
            title="Tampilkan panduan fitur"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Monthly Summary Card */}
        <div className="analitik-monthly-summary bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/5 rounded-xl p-6 mb-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 transition-colors duration-300">
                Rekap {selectedMonth.getMonth() === new Date().getMonth() && 
                       selectedMonth.getFullYear() === new Date().getFullYear() 
                       ? 'Bulan Ini' : 'Bulan'}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                {/* Month Navigator */}
                <button
                  onClick={() => {
                    const prevMonth = new Date(selectedMonth);
                    prevMonth.setMonth(prevMonth.getMonth() - 1);
                    setSelectedMonth(prevMonth);
                    setSelectedMatch(null);
                  }}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-300"
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-zinc-400 transition-colors duration-300" />
                </button>
                
                <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-45 text-center transition-colors duration-300">
                  {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
                
                <button
                  onClick={() => {
                    const nextMonth = new Date(selectedMonth);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    setSelectedMonth(nextMonth);
                    setSelectedMatch(null);
                  }}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-300"
                  title="Bulan berikutnya"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-zinc-400 transition-colors duration-300" />
                </button>

                {/* Current Month Button */}
                {(selectedMonth.getMonth() !== new Date().getMonth() || 
                  selectedMonth.getFullYear() !== new Date().getFullYear()) && (
                  <button
                    onClick={() => setSelectedMonth(new Date())}
                    className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors duration-300 font-medium border border-gray-300 dark:border-white/10"
                  >
                    Bulan Ini
                  </button>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Tingkat Penyelesaian</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded-full h-2 w-32 border border-gray-300 dark:border-transparent transition-colors duration-300">
                  <div 
                    className="bg-gray-700 dark:bg-zinc-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${monthlyStats.completionRate}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300">{monthlyStats.completionRate}%</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-100 dark:bg-black/20 border-2 border-gray-200 dark:border-white/5 rounded-lg p-4 transition-colors duration-300">
              <p className="text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Total Pertandingan</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                {monthlyStats.totalMatches}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-black/20 border-2 border-gray-200 dark:border-white/5 rounded-lg p-4 transition-colors duration-300">
              <p className="text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Selesai</p>
              <p className="text-xl font-bold text-gray-700 dark:text-zinc-400 transition-colors duration-300">
                {monthlyStats.completedMatches}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-black/20 border-2 border-gray-200 dark:border-white/5 rounded-lg p-4 transition-colors duration-300">
              <p className="text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Berlangsung</p>
              <p className="text-xl font-bold text-gray-700 dark:text-zinc-400 transition-colors duration-300">
                {monthlyStats.activeMatches}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-black/20 border-2 border-gray-200 dark:border-white/5 rounded-lg p-4 transition-colors duration-300">
              <p className="text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Total Pemain</p>
              <p className="text-xl font-bold text-gray-700 dark:text-zinc-400 transition-colors duration-300">
                {monthlyStats.totalMatches * 4}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match List */}
          <div className="analitik-matches-list lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/5 rounded-xl p-6 shadow-sm transition-colors duration-300">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
                <TrendingUp className="w-5 h-5 text-gray-600 dark:text-zinc-400 transition-colors duration-300" />
                Daftar Pertandingan
              </h2>
              
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-zinc-700 transition-colors duration-300" />
                  <p className="text-gray-500 dark:text-zinc-500 font-medium transition-colors duration-300">Tidak ada pertandingan</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1 transition-colors duration-300">
                    di bulan {selectedMonth.toLocaleDateString('id-ID', { month: 'long' })}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-150 overflow-y-auto">
                  {matches.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => selectMatch(match)}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-300 border-2 ${
                        selectedMatch?.id === match.id
                          ? 'bg-gray-100 dark:bg-zinc-800 border-gray-400 dark:border-zinc-700 text-gray-900 dark:text-white shadow-sm'
                          : 'bg-gray-50 dark:bg-zinc-800/30 border-gray-200 dark:border-white/5 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold">Match #{match.match_number}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500 flex items-center gap-1 mt-1 transition-colors duration-300">
                            <Calendar className="w-3 h-3" />
                            {match.match_date 
                              ? new Date(match.match_date).toLocaleDateString('id-ID', { 
                                  weekday: 'short', 
                                  day: 'numeric', 
                                  month: 'short' 
                                })
                              : new Date(match.created_at).toLocaleDateString('id-ID')
                            }
                          </p>
                        </div>
                        {match.winner && (
                          <Trophy className="w-4 h-4 text-gray-500 dark:text-zinc-500 transition-colors duration-300" />
                        )}
                      </div>
                      {match.winner && (
                        <div className="mt-2 text-xs">
                          <span className="px-2 py-1 bg-green-100 dark:bg-zinc-700 text-green-700 dark:text-zinc-400 rounded text-xs font-semibold border border-green-300 dark:border-transparent transition-colors duration-300">
                            Selesai
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Match Details */}
          <div className="analitik-match-stats lg:col-span-2">
            {selectedMatch ? (
              <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/5 rounded-xl p-6 shadow-sm transition-colors duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                      Pertandingan #{selectedMatch.match_number}
                    </h2>
                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-500 mt-1 transition-colors duration-300">
                      {selectedMatch.match_date 
                        ? new Date(selectedMatch.match_date).toLocaleDateString('id-ID', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })
                        : new Date(selectedMatch.created_at).toLocaleDateString('id-ID')
                      }
                    </p>
                  </div>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="analitik-edit-scores px-4 py-2 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-lg transition-colors duration-300 flex items-center gap-2 border-2 border-gray-300 dark:border-white/5 font-semibold"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-lg transition-colors duration-300 flex items-center gap-2 border-2 border-gray-300 dark:border-white/5 font-semibold"
                      >
                        <X className="w-4 h-4" />
                        Batal
                      </button>
                      <button
                        onClick={saveMatchInfo}
                        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors duration-300 flex items-center gap-2 font-bold border-2 border-gray-900 dark:border-white"
                      >
                        <Save className="w-4 h-4" />
                        Simpan
                      </button>
                    </div>
                  )}
                </div>

                {/* Players List */}
                <div className="analitik-member-selection mb-6 pb-6 border-b-2 border-gray-200 dark:border-white/5 transition-colors duration-300">
                  <h3 className="text-sm font-bold text-gray-600 dark:text-zinc-400 mb-3 transition-colors duration-300">Pemain:</h3>
                  <div className="flex flex-wrap gap-2">
                    {getAvailablePlayers().map((player, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg text-sm border-2 border-gray-200 dark:border-white/5 font-medium transition-colors duration-300">
                        {player}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Team 1 */}
                  <div className="bg-gray-100 dark:bg-zinc-800/50 border-2 border-gray-300 dark:border-white/5 rounded-xl p-6 transition-colors duration-300">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
                      <Users className="w-5 h-5 text-gray-600 dark:text-zinc-400 transition-colors duration-300" />
                      Tim 1
                    </h3>
                    
                    {editMode ? (
                      <>
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-1 transition-colors duration-300">Pemain 1</label>
                            <select
                              value={formData.team1_player1}
                              onChange={(e) => setFormData({...formData, team1_player1: e.target.value})}
                              className="w-full bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-medium transition-colors duration-300"
                            >
                              <option value="">Pilih pemain</option>
                              {getAvailablePlayers().map((player, idx) => (
                                <option key={idx} value={player}>{player}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-1 transition-colors duration-300">Pemain 2</label>
                            <select
                              value={formData.team1_player2}
                              onChange={(e) => setFormData({...formData, team1_player2: e.target.value})}
                              className="w-full bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-medium transition-colors duration-300"
                            >
                              <option value="">Pilih pemain</option>
                              {getAvailablePlayers().map((player, idx) => (
                                <option key={idx} value={player}>{player}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-1 transition-colors duration-300">Skor</label>
                          <input
                            type="number"
                            min="0"
                            max="42"
                            value={formData.team1_score}
                            onChange={(e) => setFormData({...formData, team1_score: parseInt(e.target.value) || 0})}
                            className="w-full bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-2xl font-bold text-center transition-colors duration-300"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2 mb-4">
                          <p className="text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">{formData.team1_player1 || 'Belum diatur'}</p>
                          <p className="text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">{formData.team1_player2 || 'Belum diatur'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-5xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{formData.team1_score}</p>
                          <p className="text-sm font-semibold text-gray-500 dark:text-zinc-500 mt-1 transition-colors duration-300">poin</p>
                        </div>
                      </>
                    )}
                    
                    {formData.team1_score > formData.team2_score && (
                      <div className="mt-4 px-3 py-2 bg-green-100 dark:bg-zinc-700 border-2 border-green-300 dark:border-zinc-600 text-green-700 dark:text-zinc-300 rounded-lg text-center font-bold text-sm transition-colors duration-300">
                        Pemenang
                      </div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className="bg-gray-100 dark:bg-zinc-800/50 border-2 border-gray-300 dark:border-white/5 rounded-xl p-6 transition-colors duration-300">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
                      <Users className="w-5 h-5 text-gray-600 dark:text-zinc-400 transition-colors duration-300" />
                      Tim 2
                    </h3>
                    
                    {editMode ? (
                      <>
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-1 transition-colors duration-300">Pemain 1</label>
                            <select
                              value={formData.team2_player1}
                              onChange={(e) => setFormData({...formData, team2_player1: e.target.value})}
                              className="w-full bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-medium transition-colors duration-300"
                            >
                              <option value="">Pilih pemain</option>
                              {getAvailablePlayers().map((player, idx) => (
                                <option key={idx} value={player}>{player}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-1 transition-colors duration-300">Pemain 2</label>
                            <select
                              value={formData.team2_player2}
                              onChange={(e) => setFormData({...formData, team2_player2: e.target.value})}
                              className="w-full bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-medium transition-colors duration-300"
                            >
                              <option value="">Pilih pemain</option>
                              {getAvailablePlayers().map((player, idx) => (
                                <option key={idx} value={player}>{player}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-1 transition-colors duration-300">Skor</label>
                          <input
                            type="number"
                            min="0"
                            max="42"
                            value={formData.team2_score}
                            onChange={(e) => setFormData({...formData, team2_score: parseInt(e.target.value) || 0})}
                            className="w-full bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-2xl font-bold text-center transition-colors duration-300"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2 mb-4">
                          <p className="text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">{formData.team2_player1 || 'Belum diatur'}</p>
                          <p className="text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">{formData.team2_player2 || 'Belum diatur'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-5xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{formData.team2_score}</p>
                          <p className="text-sm font-semibold text-gray-500 dark:text-zinc-500 mt-1 transition-colors duration-300">poin</p>
                        </div>
                      </>
                    )}
                    
                    {formData.team2_score > formData.team1_score && (
                      <div className="mt-4 px-3 py-2 bg-green-100 dark:bg-zinc-700 border-2 border-green-300 dark:border-zinc-600 text-green-700 dark:text-zinc-300 rounded-lg text-center font-bold text-sm transition-colors duration-300">
                        Pemenang
                      </div>
                    )}
                  </div>
                </div>

                {/* Game Info */}
                <div className="mt-6 bg-gray-100 dark:bg-zinc-800/30 border-2 border-gray-200 dark:border-white/5 rounded-xl p-4 transition-colors duration-300">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-zinc-500 font-semibold transition-colors duration-300">Target Skor</p>
                      <p className="text-gray-900 dark:text-white font-bold transition-colors duration-300">42 poin</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-zinc-500 font-semibold transition-colors duration-300">Status</p>
                      <p className="text-gray-900 dark:text-white font-bold transition-colors duration-300">
                        {formData.team1_score !== formData.team2_score && (formData.team1_score > 0 || formData.team2_score > 0) ? 'Selesai' : 'Berlangsung'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/5 rounded-xl p-12 text-center shadow-sm transition-colors duration-300">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-zinc-700 transition-colors duration-300" />
                <p className="text-gray-500 dark:text-zinc-500 font-semibold transition-colors duration-300">Pilih pertandingan untuk melihat detail</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay
        steps={tutorialSteps}
        isActive={isTutorialActive}
        onClose={closeTutorial}
        tutorialKey="admin-analitik"
      />
    </div>
  );
}