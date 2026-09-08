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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-700 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      <div>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Analitik & Rekap Pertandingan</h1>
            <p className="text-xs text-zinc-400 mt-1">Kelola skor, susunan pasangan pemain, dan rekap pertandingan per bulan</p>
          </div>
          
          <button
            onClick={toggleTutorial}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Tampilkan panduan fitur"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Monthly Summary Card */}
        <div className="analitik-monthly-summary bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white mb-2">
                Pilih Periode Pertandingan
              </h2>
              <div className="flex items-center gap-2">
                {/* Month Navigator */}
                <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl p-1">
                  <button
                    onClick={() => {
                      const prevMonth = new Date(selectedMonth);
                      prevMonth.setMonth(prevMonth.getMonth() - 1);
                      setSelectedMonth(prevMonth);
                      setSelectedMatch(null);
                    }}
                    className="p-1 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Bulan sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="text-xs font-semibold text-white px-3 min-w-32 text-center">
                    {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </span>
                  
                  <button
                    onClick={() => {
                      const nextMonth = new Date(selectedMonth);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      setSelectedMonth(nextMonth);
                      setSelectedMatch(null);
                    }}
                    className="p-1 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Bulan berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Current Month Button */}
                {(selectedMonth.getMonth() !== new Date().getMonth() || 
                  selectedMonth.getFullYear() !== new Date().getFullYear()) && (
                  <button
                    onClick={() => setSelectedMonth(new Date())}
                    className="px-2.5 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl transition-colors font-medium border border-white/10 cursor-pointer"
                  >
                    Bulan Ini
                  </button>
                )}
              </div>
            </div>
            
            <div className="sm:text-right">
              <p className="text-xs font-medium text-zinc-400 mb-1.5">Tingkat Penyelesaian</p>
              <div className="flex items-center sm:justify-end gap-2">
                <div className="bg-white/5 rounded-full h-2 w-28 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${monthlyStats.completionRate}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-white">{monthlyStats.completionRate}%</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
              <p className="text-[11px] font-medium text-zinc-400 mb-1">Total Pertandingan</p>
              <p className="text-xl font-bold text-white tracking-tight">
                {monthlyStats.totalMatches}
              </p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
              <p className="text-[11px] font-medium text-zinc-400 mb-1">Pertandingan Selesai</p>
              <p className="text-xl font-bold text-emerald-400 tracking-tight">
                {monthlyStats.completedMatches}
              </p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
              <p className="text-[11px] font-medium text-zinc-400 mb-1">Berlangsung</p>
              <p className="text-xl font-bold text-amber-400 tracking-tight">
                {monthlyStats.activeMatches}
              </p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
              <p className="text-[11px] font-medium text-zinc-400 mb-1">Slot Partisipasi</p>
              <p className="text-xl font-bold text-sky-400 tracking-tight">
                {monthlyStats.totalMatches * 4}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match List */}
          <div className="analitik-matches-list lg:col-span-1">
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-white mb-3.5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                <span>Daftar Pertandingan</span>
                <span className="ml-auto text-xs text-zinc-500 font-normal">({matches.length})</span>
              </h2>
              
              {matches.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                  <p className="text-xs text-zinc-400 font-medium">Tidak ada pertandingan</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    di {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-140 overflow-y-auto pr-1">
                  {matches.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => selectMatch(match)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all border cursor-pointer ${
                        selectedMatch?.id === match.id
                          ? 'bg-white/10 border-white/30 text-white shadow-xs'
                          : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-white">Match #{match.match_number}</p>
                        {match.winner && (
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {match.match_date 
                          ? new Date(match.match_date).toLocaleDateString('id-ID', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })
                          : new Date(match.created_at).toLocaleDateString('id-ID')
                        }
                      </p>
                      {match.winner && (
                        <div className="mt-2">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-semibold">
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
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      Pertandingan #{selectedMatch.match_number}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
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
                      className="analitik-edit-scores px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-white/10 font-medium cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Skor & Pemain</span>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-xs transition-colors border border-white/10 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        onClick={saveMatchInfo}
                        className="px-3.5 py-1.5 bg-white text-zinc-900 hover:bg-zinc-200 rounded-xl text-xs transition-colors flex items-center gap-1.5 font-semibold cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Players List */}
                <div className="analitik-member-selection mb-5 pb-5 border-b border-white/10">
                  <h3 className="text-xs font-semibold text-zinc-400 mb-2">Pemain Terdaftar Dalam Match:</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {getAvailablePlayers().map((player, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-white/5 text-zinc-300 rounded-lg text-xs border border-white/10 font-medium">
                        {player}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Team 1 */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-400" />
                      <span>Tim 1</span>
                    </h3>
                    
                    {editMode ? (
                      <>
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-zinc-300 mb-1">Pemain 1</label>
                            <select
                              value={formData.team1_player1}
                              onChange={(e) => setFormData({...formData, team1_player1: e.target.value})}
                              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
                            >
                              <option value="">Pilih pemain</option>
                              {getAvailablePlayers().map((player, idx) => (
                                <option key={idx} value={player}>{player}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-300 mb-1">Pemain 2</label>
                            <select
                              value={formData.team1_player2}
                              onChange={(e) => setFormData({...formData, team1_player2: e.target.value})}
                              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
                            >
                              <option value="">Pilih pemain</option>
                              {getAvailablePlayers().map((player, idx) => (
                                <option key={idx} value={player}>{player}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">Skor Akhir</label>
                          <input
                            type="number"
                            min="0"
                            max="42"
                            value={formData.team1_score}
                            onChange={(e) => setFormData({...formData, team1_score: parseInt(e.target.value) || 0})}
                            className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-2xl font-bold text-center focus:outline-hidden focus:ring-1 focus:ring-zinc-400 font-mono"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5 mb-4 text-xs">
                          <p className="text-zinc-200 font-medium">• {formData.team1_player1 || 'Belum diatur'}</p>
                          <p className="text-zinc-200 font-medium">• {formData.team1_player2 || 'Belum diatur'}</p>
                        </div>
                        <div className="text-center py-2 bg-zinc-900/60 rounded-xl border border-white/5">
                          <p className="text-4xl font-bold text-white font-mono tracking-tight">{formData.team1_score}</p>
                          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Poin</p>
                        </div>
                      </>
                    )}
                    
                    {formData.team1_score > formData.team2_score && (
                      <div className="mt-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-center font-semibold text-xs">
                        🏆 Pemenang
                      </div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-400" />
                      <span>Tim 2</span>
                    </h3>
                    
                    {editMode ? (
                      <>
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-zinc-300 mb-1">Pemain 1</label>
                            <select
                              value={formData.team2_player1}
                              onChange={(e) => setFormData({...formData, team2_player1: e.target.value})}
                              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
                            >
                              <option value="">Pilih pemain</option>
                              {getAvailablePlayers().map((player, idx) => (
                                <option key={idx} value={player}>{player}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-300 mb-1">Pemain 2</label>
                            <select
                              value={formData.team2_player2}
                              onChange={(e) => setFormData({...formData, team2_player2: e.target.value})}
                              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
                            >
                              <option value="">Pilih pemain</option>
                              {getAvailablePlayers().map((player, idx) => (
                                <option key={idx} value={player}>{player}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">Skor Akhir</label>
                          <input
                            type="number"
                            min="0"
                            max="42"
                            value={formData.team2_score}
                            onChange={(e) => setFormData({...formData, team2_score: parseInt(e.target.value) || 0})}
                            className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-2xl font-bold text-center focus:outline-hidden focus:ring-1 focus:ring-zinc-400 font-mono"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5 mb-4 text-xs">
                          <p className="text-zinc-200 font-medium">• {formData.team2_player1 || 'Belum diatur'}</p>
                          <p className="text-zinc-200 font-medium">• {formData.team2_player2 || 'Belum diatur'}</p>
                        </div>
                        <div className="text-center py-2 bg-zinc-900/60 rounded-xl border border-white/5">
                          <p className="text-4xl font-bold text-white font-mono tracking-tight">{formData.team2_score}</p>
                          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Poin</p>
                        </div>
                      </>
                    )}
                    
                    {formData.team2_score > formData.team1_score && (
                      <div className="mt-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-center font-semibold text-xs">
                        🏆 Pemenang
                      </div>
                    )}
                  </div>
                </div>

                {/* Game Info */}
                <div className="mt-5 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-zinc-400 mb-0.5">Target Skor Maksimal</p>
                      <p className="text-white font-semibold">42 poin</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 mb-0.5">Status Pertandingan</p>
                      <p className="text-white font-semibold">
                        {formData.team1_score !== formData.team2_score && (formData.team1_score > 0 || formData.team2_score > 0) ? 'Selesai' : 'Berlangsung'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center shadow-sm">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                <p className="text-xs text-zinc-400 font-medium">Pilih salah satu pertandingan dari daftar sebelah kiri untuk melihat rincian skor & pemain</p>
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