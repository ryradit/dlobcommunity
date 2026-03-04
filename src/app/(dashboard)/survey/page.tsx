'use client';

import { useRouter } from 'next/navigation';
import { ClipboardList, Clock, Shield, ChevronRight } from 'lucide-react';

export default function SurveyWelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3e6461]/5 via-white to-[#3e6461]/10 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">

          {/* Header banner */}
          <div className="bg-gradient-to-br from-[#3e6461] to-[#2d4a47] px-8 py-10 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Survey DLOB Community</h1>
            <p className="text-white/80 text-sm leading-relaxed">
              Bantu kami membangun komunitas badminton yang lebih baik untuk semua member.
            </p>
          </div>

          <div className="px-8 py-8 space-y-6">

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
              className="w-full bg-[#3e6461] hover:bg-[#2d4a47] active:scale-[0.98] text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              Mulai Survey
              <ChevronRight className="w-5 h-5" />
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
