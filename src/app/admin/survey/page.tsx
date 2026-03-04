'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, BarChart3, Eye, X, Calendar, User,
  TrendingUp, AlertTriangle, Sparkles, Loader2, Search, RefreshCw,
} from 'lucide-react';

type AnswerValue =
  | { q: string; a: string | string[]; section: string; sectionLabel: string }
  | string
  | string[];

interface Submission {
  id: string;
  member_name: string | null;
  is_anonymous: boolean;
  started_at: string;
  completed_at: string | null;
  answers: Record<string, AnswerValue>;
}

type RichAnswer = { q: string; a: string | string[]; section: string; sectionLabel: string };

function isRich(v: AnswerValue): v is RichAnswer {
  return typeof v === 'object' && !Array.isArray(v) && 'q' in (v as object);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function humanize(val: string) {
  return val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getSatisfaction(answers: Record<string, AnswerValue>): string | null {
  for (const val of Object.values(answers)) {
    if (isRich(val) && val.section === 'A' && typeof val.a === 'string') {
      const a = val.a.toLowerCase();
      if (a.includes('puas') || a === 'cukup') return val.a;
    }
  }
  return null;
}

function aggregatePainPoints(submissions: Submission[]) {
  const counts: Record<string, number> = {};
  submissions.forEach(s =>
    Object.values(s.answers).forEach(val => {
      if (isRich(val) && val.section === 'B' && Array.isArray(val.a)) {
        (val.a as string[]).forEach(p => { counts[p] = (counts[p] || 0) + 1; });
      }
    })
  );
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
}

function aggregateSingle(submissions: Submission[], section: string) {
  const counts: Record<string, number> = {};
  submissions.forEach(s =>
    Object.values(s.answers).forEach(val => {
      if (isRich(val) && val.section === section && typeof val.a === 'string') {
        counts[val.a] = (counts[val.a] || 0) + 1;
      }
    })
  );
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function calcNPS(submissions: Submission[]): number | null {
  let promoters = 0, detractors = 0, total = 0;
  submissions.forEach(s =>
    Object.values(s.answers).forEach(val => {
      if (isRich(val) && val.section === 'A' && typeof val.a === 'string' &&
        val.q.toLowerCase().includes('rekomendasikan')) {
        total++;
        const a = val.a.toLowerCase();
        if (a.includes('pasti') || (a.includes('kemungkinan') && a.includes('besar'))) promoters++;
        else if (a.includes('tidak_akan') || a.includes('tidak akan') ||
          (a.includes('kemungkinan') && a.includes('tidak'))) detractors++;
      }
    })
  );
  return total === 0 ? null : Math.round(((promoters - detractors) / total) * 100);
}

function calcRetentionRisk(submissions: Submission[]): number {
  let risk = 0;
  submissions.forEach(s =>
    Object.values(s.answers).forEach(val => {
      if (isRich(val) && val.section === 'B' && typeof val.a === 'string' &&
        (val.q.toLowerCase().includes('aktif') || val.q.toLowerCase().includes('6 bulan'))) {
        const a = val.a.toLowerCase();
        if (a.includes('berhenti') || a.includes('tidak_aktif') || a.includes('sudah tidak')) risk++;
      }
    })
  );
  return risk;
}

const SAT_LABELS: Record<string, string> = {
  sangat_puas: 'Sangat Puas ⭐⭐⭐⭐⭐',
  puas: 'Puas ⭐⭐⭐⭐',
  cukup: 'Cukup ⭐⭐⭐',
  kurang_puas: 'Kurang Puas ⭐⭐',
  tidak_puas: 'Tidak Puas ⭐',
};
const SAT_ORDER = ['sangat_puas', 'puas', 'cukup', 'kurang_puas', 'tidak_puas'];

const SECTIONS = ['intro', 'A', 'B', 'C', 'D'] as const;
const SECTION_LABELS: Record<string, string> = {
  intro: 'Perkenalan', A: 'Evaluasi', B: 'Masukan', C: 'Fitur Platform', D: 'Fitur AI',
};

export default function AdminSurveyResultsPage() {
  const { session } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [activeTab, setActiveTab] = useState<string>('intro');
  const [search, setSearch] = useState('');
  const [filterSat, setFilterSat] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => { load(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/survey', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const data = await res.json();
      if (data.submissions) setSubmissions(data.submissions);
    } catch { /* silent */ }
    setLoading(false);
  };

  const completed = useMemo(() => submissions.filter(s => s.completed_at), [submissions]);

  const filtered = useMemo(() => completed.filter(s => {
    if (search && !(s.member_name || 'Anonim').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSat && getSatisfaction(s.answers) !== filterSat) return false;
    return true;
  }), [completed, search, filterSat]);

  const satisfactionCounts = useMemo(() => {
    const c: Record<string, number> = {};
    completed.forEach(s => { const v = getSatisfaction(s.answers); if (v) c[v] = (c[v] || 0) + 1; });
    return c;
  }, [completed]);

  const painPoints   = useMemo(() => aggregatePainPoints(completed), [completed]);
  const featureReqs  = useMemo(() => aggregateSingle(completed, 'C'), [completed]);
  const aiFeatures   = useMemo(() => aggregateSingle(completed, 'D'), [completed]);
  const nps          = useMemo(() => calcNPS(completed), [completed]);
  const retentionRisk = useMemo(() => calcRetentionRisk(completed), [completed]);

  const generateSummary = async () => {
    setSummaryLoading(true);
    setAiSummary('');
    try {
      const openTexts = completed
        .flatMap(s => Object.values(s.answers)
          .filter(v => isRich(v) && typeof (v as RichAnswer).a === 'string' && ((v as RichAnswer).a as string).length > 25)
          .map(v => (v as RichAnswer).a as string))
        .slice(0, 12);

      const res = await fetch('/api/admin/survey/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          total: completed.length,
          satisfactionCounts,
          painPoints: Object.fromEntries(painPoints),
          featureRequests: Object.fromEntries(featureReqs),
          aiFeatures: Object.fromEntries(aiFeatures),
          nps,
          retentionRisk,
          openTexts,
        }),
      });
      const data = await res.json();
      if (data.summary) setAiSummary(data.summary.replace(/\*\*/g, ''));
    } catch { /* silent */ }
    setSummaryLoading(false);
  };

  const getAvailableSections = (s: Submission) => {
    const secs = new Set<string>();
    Object.values(s.answers).forEach(val => { if (isRich(val)) secs.add(val.section); });
    return SECTIONS.filter(sec => secs.has(sec));
  };

  const openModal = (s: Submission) => {
    setSelected(s);
    setActiveTab(getAvailableSections(s)[0] ?? 'intro');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hasil Survey DLOB</h1>
            <p className="text-zinc-400 text-sm mt-1">{completed.length} respons lengkap</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={generateSummary}
              disabled={summaryLoading || completed.length === 0}
              className="flex items-center gap-2 bg-[#3e6461] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#2d4a47] disabled:opacity-40 transition-colors"
            >
              {summaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Ringkasan AI
            </button>
          </div>
        </div>

        {/* AI Summary */}
        {(aiSummary || summaryLoading) && (
          <div className="bg-[#3e6461]/10 border border-[#3e6461]/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#3e6461]" />
              <span className="text-sm font-semibold text-[#3e6461]">Ringkasan AI</span>
            </div>
            {summaryLoading ? (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Menganalisis data survey...
              </div>
            ) : (
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">{aiSummary}</p>
            )}
          </div>
        )}

        {/* KPI stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Responden', value: completed.length, color: 'text-white' },
            {
              icon: TrendingUp, label: 'NPS Score',
              value: nps !== null ? `${nps > 0 ? '+' : ''}${nps}` : '—',
              color: nps === null ? 'text-zinc-400' : nps >= 30 ? 'text-green-400' : nps >= 0 ? 'text-yellow-400' : 'text-red-400',
            },
            {
              icon: AlertTriangle, label: 'Risiko Churn',
              value: retentionRisk,
              color: retentionRisk === 0 ? 'text-zinc-400' : retentionRisk <= 2 ? 'text-yellow-400' : 'text-red-400',
            },
            {
              icon: Calendar, label: '7 Hari Terakhir',
              value: completed.filter(s => new Date(s.completed_at!).getTime() > Date.now() - 7 * 86400000).length,
              color: 'text-[#3e6461]',
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
              <Icon className={`w-5 h-5 ${color} mb-2 opacity-80`} />
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-zinc-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts: Pain Points + Feature Requests */}
        {(painPoints.length > 0 || featureReqs.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {painPoints.length > 0 && (
              <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
                <h2 className="font-semibold text-sm text-zinc-300 mb-4">⚠️ Pain Points Terbanyak</h2>
                <div className="space-y-3">
                  {painPoints.map(([key, count]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1">
                        <span className="truncate pr-2">{humanize(key)}</span>
                        <span className="shrink-0">{count} ({Math.round((count / completed.length) * 100)}%)</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full">
                        <div className="h-1.5 rounded-full bg-red-400/70"
                          style={{ width: `${Math.round((count / completed.length) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {featureReqs.length > 0 && (
              <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
                <h2 className="font-semibold text-sm text-zinc-300 mb-4">💡 Fitur Platform Diminati</h2>
                <div className="space-y-3">
                  {featureReqs.map(([key, count]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1">
                        <span className="truncate pr-2">{humanize(key)}</span>
                        <span className="shrink-0">{count} ({Math.round((count / completed.length) * 100)}%)</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full">
                        <div className="h-1.5 rounded-full bg-[#3e6461]"
                          style={{ width: `${Math.round((count / completed.length) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Features tally */}
        {aiFeatures.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
            <h2 className="font-semibold text-sm text-zinc-300 mb-3">🤖 Fitur AI Diminati</h2>
            <div className="flex flex-wrap gap-2">
              {aiFeatures.map(([key, count]) => (
                <span key={key} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-full text-xs text-zinc-300">
                  {humanize(key)}
                  <span className="bg-[#3e6461]/60 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Satisfaction breakdown */}
        {Object.keys(satisfactionCounts).length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
            <h2 className="font-semibold mb-4 text-sm text-zinc-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Distribusi Kepuasan
            </h2>
            <div className="space-y-2">
              {SAT_ORDER.filter(k => satisfactionCounts[k]).map(val => (
                <div key={val} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-44 shrink-0">{SAT_LABELS[val]}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2">
                    <div className="h-2 rounded-full bg-[#3e6461] transition-all"
                      style={{ width: `${Math.round((satisfactionCounts[val] / completed.length) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-zinc-400 w-8 text-right">{satisfactionCounts[val]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama responden..."
              className="w-full bg-zinc-900 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#3e6461]/50"
            />
          </div>
          <select
            value={filterSat}
            onChange={e => setFilterSat(e.target.value)}
            className="bg-zinc-900 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3e6461]/50"
          >
            <option value="">Semua kepuasan</option>
            {SAT_ORDER.map(val => <option key={val} value={val}>{SAT_LABELS[val]}</option>)}
          </select>
        </div>

        {/* Responses table */}
        <div className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Responden</h2>
            <span className="text-xs text-zinc-500">{filtered.length} dari {completed.length}</span>
          </div>
          {loading ? (
            <div className="py-12 text-center text-zinc-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">Tidak ada data.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs border-b border-white/5">
                  <th className="px-5 py-3 text-left font-medium">Nama</th>
                  <th className="px-5 py-3 text-left font-medium">Kepuasan</th>
                  <th className="px-5 py-3 text-left font-medium">Jawaban</th>
                  <th className="px-5 py-3 text-left font-medium">Tanggal</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => openModal(s)}>
                    <td className="px-5 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-zinc-500" />
                        <span>{s.member_name || (s.is_anonymous ? 'Anonim' : 'Tanpa nama')}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-400 text-xs">{SAT_LABELS[getSatisfaction(s.answers) ?? ''] ?? '—'}</td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">{Object.keys(s.answers).length} jawaban</td>
                    <td className="px-5 py-3 text-zinc-400 text-xs">{formatDate(s.completed_at!)}</td>
                    <td className="px-5 py-3"><Eye className="w-4 h-4 text-zinc-500" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-zinc-900 rounded-3xl border border-white/10 w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold">{selected.member_name || (selected.is_anonymous ? 'Anonim' : 'Tanpa nama')}</h3>
                <p className="text-xs text-zinc-400">{formatDate(selected.completed_at!)} · {Object.keys(selected.answers).length} jawaban</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-1 px-4 py-2.5 border-b border-white/10 shrink-0 overflow-x-auto">
              {getAvailableSections(selected).map(sec => (
                <button key={sec} onClick={() => setActiveTab(sec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeTab === sec ? 'bg-[#3e6461] text-white' : 'text-zinc-400 hover:bg-white/10'}`}>
                  {SECTION_LABELS[sec] ?? sec}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {Object.entries(selected.answers)
                .filter(([, val]) => isRich(val) && (val as RichAnswer).section === activeTab)
                .map(([key, val]) => {
                  const rich = val as RichAnswer;
                  return (
                    <div key={key}>
                      <p className="text-sm font-medium text-zinc-300 mb-1.5 leading-snug">{rich.q}</p>
                      <p className="text-sm text-white bg-white/5 rounded-xl px-3 py-2">
                        {Array.isArray(rich.a) ? rich.a.join(', ') : rich.a}
                      </p>
                    </div>
                  );
                })}
              {activeTab === (getAvailableSections(selected)[0] ?? 'intro') &&
                Object.entries(selected.answers).filter(([, val]) => !isRich(val)).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs text-zinc-500 mb-1">{key}</p>
                    <p className="text-sm text-white bg-white/5 rounded-xl px-3 py-2">
                      {Array.isArray(val) ? (val as string[]).join(', ') : String(val)}
                    </p>
                  </div>
                ))}
              {Object.entries(selected.answers).filter(([, val]) => isRich(val) && (val as RichAnswer).section === activeTab).length === 0 &&
                Object.entries(selected.answers).filter(([, val]) => !isRich(val)).length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-4">Tidak ada jawaban di seksi ini.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
