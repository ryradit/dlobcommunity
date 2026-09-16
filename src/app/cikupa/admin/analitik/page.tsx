'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { 
  TrendingUp, Users, Trophy, Edit, Save, X, ChevronLeft, ChevronRight, 
  Calendar, Award, CheckCircle2, Clock, BarChart3, HelpCircle
} from 'lucide-react';
import BranchBadge from '@/components/BranchBadge';

const BRANCH_ID = 'dlob-cikupa';
const ACCENT = '#10B981';

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
  branch_id?: string;
}

interface MatchMember {
  id: string;
  member_name: string;
  match_id: string;
}

export default function CikupaAdminAnalitikPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchMembers, setMatchMembers] = useState<Record<string, MatchMember[]>>({});
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  }, [pathname, selectedMonth]);

  async function fetchMatches() {
    try {
      setLoading(true);
      const targetYear = selectedMonth.getFullYear();
      const targetMonth = selectedMonth.getMonth() + 1;
      const monthStart = new Date(targetYear, targetMonth - 1, 1);
      const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      const { data: matchesData, error } = await supabase
        .from('matches')
        .select('*')
        .eq('branch_id', BRANCH_ID)
        .gte('match_date', monthStart.toISOString())
        .lte('match_date', monthEnd.toISOString())
        .order('match_date', { ascending: false });

      if (error) throw error;

      const fetchedMatches: Match[] = matchesData || [];
      setMatches(fetchedMatches);

      if (fetchedMatches.length > 0) {
        const matchIds = fetchedMatches.map(m => m.id);
        const { data: membersData } = await supabase
          .from('match_members')
          .select('id, member_name, match_id')
          .in('match_id', matchIds);

        const membersMap: Record<string, MatchMember[]> = {};
        (membersData || []).forEach(mm => {
          if (!membersMap[mm.match_id]) membersMap[mm.match_id] = [];
          membersMap[mm.match_id].push(mm);
        });
        setMatchMembers(membersMap);

        if (selectedMatch) {
          const updated = fetchedMatches.find(m => m.id === selectedMatch.id);
          if (updated) setSelectedMatch(updated);
        }
      } else {
        setMatchMembers({});
        setSelectedMatch(null);
      }
    } catch (err) {
      console.error('Error fetching DLBC matches for analitik:', err);
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
      setSaving(true);
      let winner: 'team1' | 'team2' | null = null;
      if (formData.team1_score > formData.team2_score) {
        winner = 'team1';
      } else if (formData.team2_score > formData.team1_score) {
        winner = 'team2';
      }

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

      alert('Skor pertandingan DLBC berhasil disimpan!');
      setEditMode(false);
      await fetchMatches();
    } catch (err: any) {
      console.error('Error saving match info:', err);
      alert('Gagal menyimpan informasi pertandingan: ' + (err?.message || ''));
    } finally {
      setSaving(false);
    }
  }

  const getAvailablePlayers = () => {
    if (!selectedMatch) return [];
    return matchMembers[selectedMatch.id]?.map(m => m.member_name) || [];
  };

  const completedMatchesCount = matches.filter(m => !!m.winner).length;
  const pendingScoreMatchesCount = matches.filter(m => !m.winner).length;
  const completionRate = matches.length > 0 ? Math.round((completedMatchesCount / matches.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              Skor & Analitik Pertandingan DLBC
            </h1>
            <BranchBadge branchId={BRANCH_ID} />
          </div>
          <p className="text-sm text-zinc-400">
            Pencatatan skor set, susunan pemain ganda, dan rekap performa Cikupa
          </p>
        </div>

        {/* Month Picker */}
        <div className="flex items-center gap-2 bg-zinc-800/80 border border-white/10 rounded-xl p-1.5 self-start md:self-auto">
          <button
            onClick={() => {
              const d = new Date(selectedMonth);
              d.setMonth(d.getMonth() - 1);
              setSelectedMonth(d);
              setSelectedMatch(null);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 py-1 text-xs font-bold text-emerald-400">
            {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </div>
          <button
            onClick={() => {
              const d = new Date(selectedMonth);
              d.setMonth(d.getMonth() + 1);
              setSelectedMonth(d);
              setSelectedMatch(null);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedMonth(new Date())}
            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-colors ml-1"
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Total Pertandingan</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{matches.length}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Bulan terpilih</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Ada Pemenang</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{completedMatchesCount}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Skor lengkap</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Belum Ada Skor</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingScoreMatchesCount}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Menunggu input skor</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Penyelesaian</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{completionRate}%</div>
          <p className="text-[11px] text-zinc-500 mt-1">Rasio pertandingan</p>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Match Selector */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Award className="w-4 h-4 text-emerald-400" />
            Daftar Pertandingan DLBC ({matches.length})
          </h3>

          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500">Memuat pertandingan...</div>
          ) : matches.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">Belum ada pertandingan di bulan ini</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {matches.map(m => {
                const isSelected = selectedMatch?.id === m.id;
                const members = matchMembers[m.id] || [];
                const hasScore = !!m.winner;

                return (
                  <button
                    key={m.id}
                    onClick={() => selectMatch(m)}
                    className={`w-full p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-zinc-800/40 border-white/5 hover:bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-white">Match #{m.match_number}</span>
                      {hasScore ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                          {m.team1_score} - {m.team2_score}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold">
                          Belum ada skor
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400">
                      {m.match_date ? new Date(m.match_date).toLocaleDateString('id-ID', {
                        weekday: 'short', day: 'numeric', month: 'short'
                      }) : '-'} · {m.shuttlecock_count} Kock
                    </p>

                    <div className="text-[11px] text-zinc-500 mt-1 truncate">
                      {members.map(mm => mm.member_name).join(', ')}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Score Editor & Detail */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 shadow-xl lg:col-span-2 space-y-5">
          {!selectedMatch ? (
            <div className="py-24 text-center text-zinc-500 space-y-2">
              <BarChart3 className="w-12 h-12 mx-auto text-zinc-600 opacity-40" />
              <p className="text-sm font-semibold text-zinc-400">Pilih Pertandingan</p>
              <p className="text-xs text-zinc-600">Klik salah satu pertandingan di daftar sebelah kiri untuk melihat atau mengedit skor.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Match Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    Match #{selectedMatch.match_number}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {selectedMatch.match_date ? new Date(selectedMatch.match_date).toLocaleDateString('id-ID', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    }) : '-'} · {selectedMatch.shuttlecock_count} Kock
                  </p>
                </div>

                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    editMode
                      ? 'bg-zinc-700 text-white hover:bg-zinc-600'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20'
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" />
                  {editMode ? 'Batal Edit' : 'Edit Pasangan & Skor'}
                </button>
              </div>

              {/* Match Details / Form */}
              {editMode ? (
                /* EDIT MODE */
                <form onSubmit={e => { e.preventDefault(); saveMatchInfo(); }} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Team 1 Form */}
                    <div className="p-4 rounded-2xl bg-zinc-800/60 border border-white/5 space-y-3">
                      <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> Tim 1
                      </h4>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Pemain 1</label>
                        <select
                          value={formData.team1_player1}
                          onChange={e => setFormData({ ...formData, team1_player1: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:border-emerald-500"
                        >
                          <option value="">-- Pilih Pemain --</option>
                          {getAvailablePlayers().map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Pemain 2</label>
                        <select
                          value={formData.team1_player2}
                          onChange={e => setFormData({ ...formData, team1_player2: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:border-emerald-500"
                        >
                          <option value="">-- Pilih Pemain --</option>
                          {getAvailablePlayers().map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Skor Akhir Tim 1</label>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          value={formData.team1_score}
                          onChange={e => setFormData({ ...formData, team1_score: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white font-black text-lg focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Team 2 Form */}
                    <div className="p-4 rounded-2xl bg-zinc-800/60 border border-white/5 space-y-3">
                      <h4 className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> Tim 2
                      </h4>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Pemain 1</label>
                        <select
                          value={formData.team2_player1}
                          onChange={e => setFormData({ ...formData, team2_player1: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:border-blue-500"
                        >
                          <option value="">-- Pilih Pemain --</option>
                          {getAvailablePlayers().map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Pemain 2</label>
                        <select
                          value={formData.team2_player2}
                          onChange={e => setFormData({ ...formData, team2_player2: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:border-blue-500"
                        >
                          <option value="">-- Pilih Pemain --</option>
                          {getAvailablePlayers().map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Skor Akhir Tim 2</label>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          value={formData.team2_score}
                          onChange={e => setFormData({ ...formData, team2_score: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white font-black text-lg focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Menyimpan...' : 'Simpan Skor & Pemenang'}
                    </button>
                  </div>
                </form>
              ) : (
                /* VIEW MODE */
                <div className="space-y-6">
                  {/* Scoreboard display */}
                  <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 flex items-center justify-around text-center">
                    <div className={`space-y-1.5 ${selectedMatch.winner === 'team1' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      <span className="text-xs font-bold uppercase tracking-wider">Tim 1</span>
                      <div className="text-4xl font-black">{selectedMatch.team1_score ?? 0}</div>
                      <p className="text-xs font-semibold text-white">
                        {selectedMatch.team1_player1 || '-'} & {selectedMatch.team1_player2 || '-'}
                      </p>
                      {selectedMatch.winner === 'team1' && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                          🏆 WINNER
                        </span>
                      )}
                    </div>

                    <div className="text-zinc-600 text-2xl font-black px-4">VS</div>

                    <div className={`space-y-1.5 ${selectedMatch.winner === 'team2' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      <span className="text-xs font-bold uppercase tracking-wider">Tim 2</span>
                      <div className="text-4xl font-black">{selectedMatch.team2_score ?? 0}</div>
                      <p className="text-xs font-semibold text-white">
                        {selectedMatch.team2_player1 || '-'} & {selectedMatch.team2_player2 || '-'}
                      </p>
                      {selectedMatch.winner === 'team2' && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                          🏆 WINNER
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Registered Match Members */}
                  <div className="p-4 rounded-xl bg-zinc-800/40 border border-white/5 space-y-2">
                    <h4 className="text-xs font-bold text-zinc-400">Pemain Terdaftar dalam Match:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {getAvailablePlayers().map((p, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-zinc-800 text-center text-xs font-semibold text-white">
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
