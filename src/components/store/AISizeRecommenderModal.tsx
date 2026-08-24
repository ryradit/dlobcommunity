'use client';

import { useState } from 'react';
import { Sparkles, Bot, CheckCircle2, ChevronRight, X, ArrowRight, Activity, HelpCircle } from 'lucide-react';

export type SizeCategory = 'dewasa' | 'kids' | 'balita';

interface AISizeResponse {
  success: boolean;
  recommendedCategory: SizeCategory;
  recommendedSize: string;
  measurements?: {
    category: SizeCategory;
    label: string;
    tinggi: number;
    lebar: number;
    keterangan: string;
    price: number;
  };
  alternativeSize?: string;
  fitType?: string;
  reasoning: string;
  tips?: string;
  source?: string;
}

interface AISizeRecommenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySize?: (category: SizeCategory, sizeId: string) => void;
  theme?: 'dark' | 'light';
}

export default function AISizeRecommenderModal({
  isOpen,
  onClose,
  onApplySize,
  theme = 'light',
}: AISizeRecommenderModalProps) {
  const [age, setAge] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [fitPreference, setFitPreference] = useState<'regular' | 'loose' | 'slim'>('regular');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AISizeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const ageNum = parseInt(age, 10);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (!ageNum || !heightNum || !weightNum) {
      setErrorMsg('Mohon lengkapi usia, tinggi badan, dan berat badan Anda.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/size-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: ageNum,
          height: heightNum,
          weight: weightNum,
          fitPreference,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mendapatkan rekomendasi AI.');
      }

      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi gangguan pada koneksi AI. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result && onApplySize) {
      onApplySize(result.recommendedCategory, result.recommendedSize);
      onClose();
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl transition-all ${
          isDark
            ? 'bg-zinc-900 border border-white/15 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className={`p-6 pb-4 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>D&apos;LOB AI Size Recommender</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  D&apos;LOB AI
                </span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                Rekomendasi ukuran presisi berdasarkan postur &amp; usia Anda
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'bg-white/10 hover:bg-white/20 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {/* Age */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Usia (Thn) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Cth: 24"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold border transition-all ${
                    isDark
                      ? 'bg-zinc-800/80 border-white/10 text-white focus:border-emerald-400'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-black'
                  }`}
                />
              </div>

              {/* Height */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Tinggi (cm) *
                </label>
                <input
                  type="number"
                  min="30"
                  max="220"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Cth: 172"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold border transition-all ${
                    isDark
                      ? 'bg-zinc-800/80 border-white/10 text-white focus:border-emerald-400'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-black'
                  }`}
                />
              </div>

              {/* Weight */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Berat (kg) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Cth: 68"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold border transition-all ${
                    isDark
                      ? 'bg-zinc-800/80 border-white/10 text-white focus:border-emerald-400'
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-black'
                  }`}
                />
              </div>
            </div>

            {/* Fit Preference */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                Preferensi Fitting
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'regular', label: 'Standar Pas' },
                  { value: 'loose', label: 'Agak Longgar' },
                  { value: 'slim', label: 'Pas Badan (Slim)' },
                ].map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFitPreference(f.value as any)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                      fitPreference === f.value
                        ? isDark
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                          : 'border-black bg-black text-white'
                        : isDark
                        ? 'border-white/10 bg-zinc-800/50 text-zinc-400 hover:text-white'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md ${
                isDark
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-950'
                  : 'bg-black hover:bg-gray-800 text-white'
              } disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Menganalisis dengan D&apos;LOB AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Hitung Rekomendasi Ukuran</span>
                </>
              )}
            </button>
          </form>

          {/* ── Recommendation Result Card ── */}
          {result && (
            <div
              className={`p-5 rounded-3xl border transition-all animate-fadeIn space-y-4 ${
                isDark
                  ? 'bg-zinc-800/60 border-emerald-500/30'
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Hasil Rekomendasi AI
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-white text-gray-700 border border-gray-200'
                }`}>
                  {result.fitType || 'Regular Fit'}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono">
                  {result.recommendedSize}
                </div>
                <div className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  Kategori: <strong className="text-emerald-600 dark:text-emerald-400">{result.recommendedCategory.toUpperCase()}</strong>
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                {result.reasoning}
              </p>

              {/* ── Table Size Grounding Breakdown ── */}
              {result.measurements && (
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  isDark ? 'bg-zinc-900/90 border-white/10' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-500">
                      <span>📏</span>
                      <span>Spesifikasi Tabel {result.recommendedSize}:</span>
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">{result.measurements.keterangan}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-zinc-400 uppercase">Tinggi Jersey</p>
                      <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">{result.measurements.tinggi} cm</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-zinc-400 uppercase">Lebar Dada</p>
                      <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">{result.measurements.lebar} cm</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-zinc-400 uppercase">Toleransi</p>
                      <p className="text-sm font-bold font-mono text-zinc-300 mt-0.5">±2 cm</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-zinc-400 uppercase">Harga Dasar</p>
                      <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(result.measurements.price)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result.alternativeSize && (
                <div className={`p-3 rounded-2xl text-xs flex items-center justify-between ${
                  isDark ? 'bg-zinc-900/80 border border-white/5' : 'bg-white border border-emerald-100'
                }`}>
                  <span className="text-gray-500 dark:text-zinc-400">Ukuran Alternatif (Lebih Longgar):</span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">{result.alternativeSize}</span>
                </div>
              )}

              {onApplySize && (
                <button
                  type="button"
                  onClick={handleApply}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Gunakan Ukuran {result.recommendedSize}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
