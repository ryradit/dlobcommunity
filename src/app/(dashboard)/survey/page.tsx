'use client';

import { useRouter } from 'next/navigation';
import { ClipboardList, Clock, Shield, ChevronRight, ChevronLeft, ArrowLeft, ArrowRight } from 'lucide-react';

export default function SurveyWelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3e6461]/5 via-white to-[#3e6461]/10 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back button */}
        <button
          onClick={() => {
            router.push('/');
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'instant' });
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white px-3.5 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div>
            <span className="text-xs font-semibold text-[#3e6461] uppercase tracking-wider bg-[#3e6461]/10 px-3 py-1 rounded-full">
              Survey DLOB 2026
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-3">
              Bantu kami membuat DLOB lebih seru untukmu
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
              Survey ini menggunakan AI adaptif — pertanyaan akan menyesuaikan dengan apa yang kamu ceritakan.
            </p>
          </div>

          <div className="space-y-6">

            {/* Info items */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#3e6461]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-[#3e6461]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">5–7 menit</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Estimasi waktu pengisian</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#3e6461]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-[#3e6461]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Boleh anonim</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Kamu bisa memilih untuk tidak menyertakan nama</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#3e6461]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">🎯</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Adaptif & personal</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Pertanyaan menyesuaikan jawabanmu secara otomatis</p>
                </div>
              </div>
            </div>

            {/* Topics */}
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Topik yang dibahas</p>
              {[
                { emoji: '🏸', label: 'Evaluasi umum komunitas DLOB' },
                { emoji: '🔥', label: 'Uneg-uneg & pain point kamu' },
                { emoji: '💻', label: 'Fitur platform yang diinginkan' },
                { emoji: '🧠', label: 'Fitur AI yang menarik buatmu' },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => router.push('/survey/start')}
              className="w-full bg-[#3e6461] hover:bg-[#2d4a47] hover:scale-[1.02] active:scale-[0.98] text-white font-semibold py-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-md"
            >
              Mulai Survey Sekarang
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
              Terima kasih sudah meluangkan waktu untuk DLOB 🙏
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
