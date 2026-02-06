'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { TrendingUp, Users, Trophy, Edit, Save, X } from 'lucide-react';

interface Match {
  id: string;
  match_number: number;
  shuttlecock_count: number;
  cost_per_shuttlecock: number;
  total_cost: number;
  cost_per_member: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
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

  useEffect(() => {
    fetchMatches();
  }, [pathname]);

  async function fetchMatches() {
    try {
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_number', { ascending: false });

      if (error) throw error;

      setMatches(matchesData || []);

      // Fetch match members for each match
      const membersMap: Record<string, MatchMember[]> = {};
      for (const match of matchesData || []) {
        const { data: members, error: membersError } = await supabase
          .from('match_members')
          .select('id, member_name, match_id')
          .eq('match_id', match.id);

        if (!membersError && members) {
          membersMap[match.id] = members;
        }
      }

      setMatchMembers(membersMap);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analitik Pertandingan</h1>
          <p className="text-zinc-400">Kelola informasi dan hasil pertandingan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match List */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Daftar Pertandingan
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {matches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => selectMatch(match)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      selectedMatch?.id === match.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Match #{match.match_number}</p>
                        <p className="text-xs opacity-75">
                          {new Date(match.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      {match.winner && (
                        <Trophy className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>
                    {match.winner && (
                      <div className="mt-2 text-xs">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                          Selesai
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Match Details */}
          <div className="lg:col-span-2">
            {selectedMatch ? (
              <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Pertandingan #{selectedMatch.match_number}
                  </h2>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Batal
                      </button>
                      <button
                        onClick={saveMatchInfo}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Simpan
                      </button>
                    </div>
                  )}
                </div>

                {/* Players List */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-zinc-400 mb-2">Pemain:</h3>
                  <div className="flex flex-wrap gap-2">
                    {getAvailablePlayers().map((player, idx) => (
                      <span key={idx} className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-sm">
                        {player}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Team 1 */}
                  <div className="bg-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
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
                          <p className="text-4xl font-bold text-white">{formData.team1_score}</p>
                          <p className="text-sm text-zinc-400">poin</p>
                        </div>
                      </>
                    )}
                    
                    {formData.team1_score >= 42 && (
                      <div className="mt-4 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-center font-semibold">
                        🏆 Pemenang!
                      </div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className="bg-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-400" />
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
                          <p className="text-4xl font-bold text-white">{formData.team2_score}</p>
                          <p className="text-sm text-zinc-400">poin</p>
                        </div>
                      </>
                    )}
                    
                    {formData.team2_score >= 42 && (
                      <div className="mt-4 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-center font-semibold">
                        🏆 Pemenang!
                      </div>
                    )}
                  </div>
                </div>

                {/* Game Info */}
                <div className="mt-6 bg-zinc-800 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-400">Target Skor</p>
                      <p className="text-white font-semibold">42 poin</p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Status</p>
                      <p className="text-white font-semibold">
                        {formData.team1_score >= 42 || formData.team2_score >= 42 ? 'Selesai' : 'Berlangsung'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-white/10 rounded-xl p-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400">Pilih pertandingan untuk melihat detail</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
