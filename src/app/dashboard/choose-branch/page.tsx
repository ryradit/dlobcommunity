'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MapPin, Shuffle, CheckCircle, Clock } from 'lucide-react';

type Choice = 'dlob-pusat' | 'dlob-cikupa' | 'both';

export default function ChooseBranchPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Choice | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingSuccess, setPendingSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!selected || !user) return;
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/profile/set-branch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ choice: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.status === 'pending') {
        setPendingSuccess(true);
      } else {
        // Redirect to correct dashboard
        if (selected === 'dlob-cikupa') {
          router.replace('/cikupa/dashboard');
        } else {
          router.replace('/dashboard');
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // ── Pending approval state ──────────────────────────────────
  if (pendingSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Menunggu Persetujuan</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Permintaan akses <strong className="text-purple-300">dua cabang</strong> Anda telah dikirim ke Admin.
            Anda akan mendapat notifikasi setelah disetujui.
          </p>
          <p className="text-zinc-500 text-xs">
            Untuk sementara, pilih satu cabang dahulu untuk mengakses dashboard.
          </p>
          <button
            onClick={() => { setSelected(null); setPendingSuccess(false); }}
            className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all text-sm font-medium"
          >
            Kembali & Pilih Satu Cabang
          </button>
        </div>
      </div>
    );
  }

  // ── Main selection UI ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Pilih Cabang Komunitas</h1>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto">
            Pilih cabang komunitas DLOB yang sesuai dengan lokasi bermain Anda.
            Anda dapat mengubah pilihan kapan saja melalui Pengaturan.
          </p>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* DLOB Pusat */}
          <button
            type="button"
            onClick={() => setSelected('dlob-pusat')}
            className={`relative group p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
              selected === 'dlob-pusat'
                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20 scale-[1.02]'
                : 'border-zinc-800 bg-zinc-900/80 hover:border-blue-500/50 hover:bg-blue-500/5'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-md shadow-blue-500/30">
              <span className="text-2xl">🏸</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">DLOB Pusat</h2>
            <p className="text-xs text-zinc-400">Komunitas Utama · Tangerang Pusat</p>
            {selected === 'dlob-pusat' && (
              <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-blue-400" />
            )}
          </button>

          {/* DLBC Cikupa */}
          <button
            type="button"
            onClick={() => setSelected('dlob-cikupa')}
            className={`relative group p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
              selected === 'dlob-cikupa'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                : 'border-zinc-800 bg-zinc-900/80 hover:border-emerald-500/50 hover:bg-emerald-500/5'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mb-4 shadow-md shadow-emerald-500/30">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">DLBC Cikupa</h2>
            <p className="text-xs text-zinc-400">Cabang Cikupa · Area Barat</p>
            {selected === 'dlob-cikupa' && (
              <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-emerald-400" />
            )}
          </button>
        </div>

        {/* Both option */}
        <button
          type="button"
          onClick={() => setSelected('both')}
          className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
            selected === 'both'
              ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
              : 'border-zinc-800 bg-zinc-900/80 hover:border-purple-500/50 hover:bg-purple-500/5'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
            <Shuffle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white">Keduanya (Dua Cabang)</h3>
            <p className="text-xs text-zinc-400">Membutuhkan persetujuan Admin · Anda bisa berpindah antar cabang</p>
          </div>
          {selected === 'both' && (
            <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
          )}
        </button>

        {/* Error */}
        {error && (
          <p className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Confirm button */}
        <button
          type="button"
          disabled={!selected || loading}
          onClick={handleConfirm}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 ${
            selected && !loading
              ? selected === 'dlob-pusat'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01]'
                : selected === 'dlob-cikupa'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.01]'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:scale-[1.01]'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Menyimpan...
            </span>
          ) : selected ? (
            selected === 'both'
              ? 'Kirim Permintaan Dua Cabang →'
              : `Pilih ${selected === 'dlob-pusat' ? 'DLOB Pusat' : 'DLBC Cikupa'} →`
          ) : (
            'Pilih cabang terlebih dahulu'
          )}
        </button>

        <p className="text-center text-xs text-zinc-600">
          Pilihan ini dapat diubah kapan saja melalui menu <strong>Pengaturan</strong>
        </p>
      </div>
    </div>
  );
}
