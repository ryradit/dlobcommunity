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
      const winner = formData.team1_score >= 42 ? 'team1' :
                     formData.team2_score >= 42 ? 'team2' : null;

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
      <div className="min-h-screen bg-zinc-950 p-4 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analitik Pertandingan</h1>
            <p className="text-zinc-400">Kelola informasi dan hasil pertandingan</p>
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
        <div className="analitik-monthly-summary bg-zinc-900 border border-white/5 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
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
                  className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5 text-zinc-400" />
                </button>
                
                <span className="text-sm font-medium text-white min-w-45 text-center">
                  {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
                
                <button
                  onClick={() => {
                    const nextMonth = new Date(selectedMonth);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    setSelectedMonth(nextMonth);
                    setSelectedMatch(null);
                  }}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Bulan berikutnya"
                >
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </button>

                {/* Current Month Button */}
                {(selectedMonth.getMonth() !== new Date().getMonth() || 
                  selectedMonth.getFullYear() !== new Date().getFullYear()) && (
                  <button
                    onClick={() => setSelectedMonth(new Date())}
                    className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                  >
                    Bulan Ini
                  </button>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400 mb-1">Tingkat Penyelesaian</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-zinc-800 rounded-full h-2 w-32">
                  <div 
                    className="bg-zinc-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${monthlyStats.completionRate}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-white">{monthlyStats.completionRate}%</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/20 border border-white/5 rounded-lg p-4">
              <p className="text-xs text-zinc-400 mb-1">Total Pertandingan</p>
              <p className="text-xl font-bold text-white">
                {monthlyStats.totalMatches}
              </p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-lg p-4">
              <p className="text-xs text-zinc-400 mb-1">Selesai</p>
              <p className="text-xl font-bold text-zinc-400">
                {monthlyStats.completedMatches}
              </p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-lg p-4">
              <p className="text-xs text-zinc-400 mb-1">Berlangsung</p>
              <p className="text-xl font-bold text-zinc-400">
                {monthlyStats.activeMatches}
              </p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-lg p-4">
              <p className="text-xs text-zinc-400 mb-1">Total Pemain</p>
              <p className="text-xl font-bold text-zinc-400">
                {monthlyStats.totalMatches * 4}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match List */}
          <div className="analitik-matches-list lg:col-span-1">
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-zinc-400" />
                Daftar Pertandingan
              </h2>
              
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                  <p className="text-zinc-500">Tidak ada pertandingan</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    di bulan {selectedMonth.toLocaleDateString('id-ID', { month: 'long' })}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-150 overflow-y-auto">
                  {matches.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => selectMatch(match)}
                      className={`w-full text-left p-4 rounded-lg transition-all border ${
                        selectedMatch?.id === match.id
                          ? 'bg-zinc-800 border-zinc-700 text-white'
                          : 'bg-zinc-800/30 border-white/5 text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">Match #{match.match_number}</p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
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
                          <Trophy className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>
                      {match.winner && (
                        <div className="mt-2 text-xs">
                          <span className="px-2 py-1 bg-zinc-700 text-zinc-400 rounded text-xs">
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
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Pertandingan #{selectedMatch.match_number}
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
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
                      className="analitik-edit-scores px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2 border border-white/5"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2 border border-white/5"
                      >
                        <X className="w-4 h-4" />
                        Batal
                      </button>
                      <button
                        onClick={saveMatchInfo}
                        className="px-4 py-2 bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2 font-medium"
                      >
                        <Save className="w-4 h-4" />
                        Simpan
                      </button>
                    </div>
                  )}
                </div>

                {/* Players List */}
                <div className="analitik-member-selection mb-6 pb-6 border-b border-white/5">
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3">Pemain:</h3>
                  <div className="flex flex-wrap gap-2">
                    {getAvailablePlayers().map((player, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm border border-white/5">
                        {player}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Team 1 */}
                  <div className="bg-zinc-800/50 border border-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-zinc-400" />
                      Tim 1
                    </h3>
                    
                    {editMode ? (
                      <>
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">Pemain 1</label>
                            <select
                              value={formData.team1_player1}
                              onChange={(e) => setFormData({...formData, team1_player1: e.target.value})}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white"
                            >
                              <option value="">Pilih pemain</option>
                              {getAvailablePlayers().map((player, idx) => (
                                <option key={idx} value={player}>{player}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">Pemain 2</label>
                            <select
                              value={formData.team1_player2}
                              onChange={(e) => setFormData({...formData, team1_player2: e.target.value})}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white"
                            >
                              <option value="">Pilih pemain</option>
                              {getAvailablePlayers().map((player, idx) => (
                                <option key={idx} value={player}>{player}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-zinc-400 mb-1">Skor</label>
                          <input
                            type="number"
                            min="0"
                            max="42"
                            value={formData.team1_score}
                            onChange={(e) => setFormData({...formData, team1_score: parseInt(e.target.value) || 0})}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-2xl font-bold text-center"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2 mb-4">
                          <p className="text-zinc-300">{formData.team1_player1 || 'Belum diatur'}</p>
                          <p className="text-zinc-300">{formData.team1_player2 || 'Belum diatur'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-5xl font-bold text-white">{formData.team1_score}</p>
                          <p className="text-sm text-zinc-500 mt-1">poin</p>
                        </div>
                      </>
                    )}
                    
                    {formData.team1_score >= 42 && (
                      <div className="mt-4 px-3 py-2 bg-zinc-700 border border-zinc-600 text-zinc-300 rounded-lg text-center font-semibold text-sm">
                        Pemenang
                      </div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className="bg-zinc-800/50 border border-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-zinc-400" />
                      Tim 2
                    </h3>
                    
                    {editMode ? (
                      <>
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">Pemain 1</label>
                            <select
                              value={formData.team2_player1}
                              onChange={(e) => setFormData({...formData, team2_player1: e.target.value})}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white"
                            >
                              <option value="">Pilih pemain</option>
                              {getAvailablePlayers().map((player, idx) => (
                                <option key={idx} value={player}>{player}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">Pemain 2</label>
                            <select
                              value={formData.team2_player2}
                              onChange={(e) => setFormData({...formData, team2_player2: e.target.value})}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white"
                            >
                              <option value="">Pilih pemain</option>
                              {getAvailablePlayers().map((player, idx) => (
                                <option key={idx} value={player}>{player}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-zinc-400 mb-1">Skor</label>
                          <input
                            type="number"
                            min="0"
                            max="42"
                            value={formData.team2_score}
                            onChange={(e) => setFormData({...formData, team2_score: parseInt(e.target.value) || 0})}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-2xl font-bold text-center"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2 mb-4">
                          <p className="text-zinc-300">{formData.team2_player1 || 'Belum diatur'}</p>
                          <p className="text-zinc-300">{formData.team2_player2 || 'Belum diatur'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-5xl font-bold text-white">{formData.team2_score}</p>
                          <p className="text-sm text-zinc-500 mt-1">poin</p>
                        </div>
                      </>
                    )}
                    
                    {formData.team2_score >= 42 && (
                      <div className="mt-4 px-3 py-2 bg-zinc-700 border border-zinc-600 text-zinc-300 rounded-lg text-center font-semibold text-sm">
                        Pemenang
                      </div>
                    )}
                  </div>
                </div>

                {/* Game Info */}
                <div className="mt-6 bg-zinc-800/30 border border-white/5 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500">Target Skor</p>
                      <p className="text-white font-semibold">42 poin</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Status</p>
                      <p className="text-white font-semibold">
                        {formData.team1_score >= 42 || formData.team2_score >= 42 ? 'Selesai' : 'Berlangsung'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                <p className="text-zinc-500">Pilih pertandingan untuk melihat detail</p>
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