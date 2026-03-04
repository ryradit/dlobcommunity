'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import type { AIQuestion } from '@/app/api/survey/next-question/route';

type Answers = Record<string, string | string[]>;

interface QAEntry {
  question: AIQuestion;
  answer: string | string[];
}

export default function SurveyStartPage() {
  const { session } = useAuth();
  const router = useRouter();

  // History of answered QA pairs (for back navigation & API context)
  const [qaHistory, setQaHistory] = useState<QAEntry[]>([]);
  // Current AI-generated question being shown
  const [current, setCurrent] = useState<AIQuestion | null>(null);
  // Current answer for the active question
  const [currentAnswer, setCurrentAnswer] = useState<string | string[]>('');

  const [isLoadingNext, setIsLoadingNext] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent double-fetch on mount
  const fetchedRef = useRef(false);

  const MAX_QUESTIONS = 20;
  const questionNumber = qaHistory.length;
  const totalShown = qaHistory.length + (current ? 1 : 0);
  const progress = (questionNumber / MAX_QUESTIONS) * 100;

  // ── Fetch next question from Gemini ────────────────────────────────────
  const fetchNextQuestion = useCallback(async (history: QAEntry[]) => {
    setIsLoadingNext(true);
    try {
      const historyPayload = history.map(h => ({
        question: h.question.question,
        answer: Array.isArray(h.answer) ? h.answer.join(', ') : h.answer,
        section: h.question.section,
      }));

      const res = await fetch('/api/survey/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: historyPayload, questionNumber: history.length }),
      });
      const data = await res.json();

      if (data.done) {
        // Guard: never mark done if no questions were answered yet — treat as an error
        if (history.length === 0) {
          setHasError(true);
          setCurrent(null);
        } else {
          setIsDone(true);
          setCurrent(null);
        }
      } else {
        setHasError(false);
        setCurrent(data as AIQuestion);
        setCurrentAnswer(data.type === 'multiple' ? [] : '');
      }
    } catch {
      setHasError(true);
      setCurrent(null);
    } finally {
      setIsLoadingNext(false);
    }
  }, []);

  // Mount: fetch first question
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchNextQuestion([]);
  }, [fetchNextQuestion]);

  // Scroll to top on question change
  useEffect(() => {
    containerRef.current?.scrollTo(0, 0);
  }, [current]);

  // ── Answer helpers ──────────────────────────────────────────────────────
  const toggleMulti = (optionValue: string) => {
    const cur = (currentAnswer as string[]) || [];
    const next = cur.includes(optionValue)
      ? cur.filter(v => v !== optionValue)
      : [...cur, optionValue];
    setCurrentAnswer(next);
  };

  const canProceed = (): boolean => {
    if (!current) return isDone;
    if (current.type === 'text') return !!(currentAnswer as string)?.trim();
    if (current.type === 'single') return !!(currentAnswer as string);
    if (current.type === 'multiple') return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    return false;
  };

  // ── Navigation ──────────────────────────────────────────────────────────
  const animate = (dir: 'forward' | 'back', cb: () => void) => {
    setDirection(dir);
    setVisible(false);
    setTimeout(() => { cb(); setVisible(true); }, 200);
  };

  const handleNext = async () => {
    if (!current) { handleSubmit(); return; }

    const finalAnswer = currentAnswer;
    const newHistory: QAEntry[] = [...qaHistory, { question: current, answer: finalAnswer }];
    setQaHistory(newHistory);

    if (newHistory.length >= MAX_QUESTIONS) {
      setIsDone(true);
      setCurrent(null);
      setIsLoadingNext(false);
      return;
    }

    animate('forward', () => {
      setCurrent(null);
      fetchNextQuestion(newHistory);
    });
  };

  const handleBack = () => {
    if (qaHistory.length > 0) {
      const prev = qaHistory[qaHistory.length - 1];
      const newHistory = qaHistory.slice(0, -1);
      setQaHistory(newHistory);
      setIsDone(false);
      animate('back', () => {
        setCurrent(prev.question);
        setCurrentAnswer(prev.answer);
        setIsLoadingNext(false);
      });
    } else {
      router.push('/survey');
    }
  };

  // ── Auto-advance for single choice ─────────────────────────────────────
  const handleSingleSelect = (value: string) => {
    setCurrentAnswer(value);
    setTimeout(() => {
      const newHistory: QAEntry[] = [...qaHistory, { question: current!, answer: value }];
      setQaHistory(newHistory);
      if (newHistory.length >= MAX_QUESTIONS) {
        setIsDone(true);
        setCurrent(null);
        setIsLoadingNext(false);
        return;
      }
      animate('forward', () => {
        setCurrent(null);
        fetchNextQuestion(newHistory);
      });
    }, 320);
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Store each answer as { q, a, section, sectionLabel } so admin can read question text
      const answers: Record<string, { q: string; a: string | string[]; section: string; sectionLabel: string }> = {};
      qaHistory.forEach(h => {
        answers[h.question.id] = {
          q: h.question.question,
          a: h.answer,
          section: h.question.section,
          sectionLabel: h.question.sectionLabel,
        };
      });

      await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          memberName: (qaHistory.find(h => h.question.id === 'q_1')?.answer as string) || null,
          isAnonymous,
          authToken: session?.access_token || null,
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Thank you screen ────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-[#3e6461]/10 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-[#3e6461]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Terima kasih! 🙏</h1>
        <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
          Responmu sudah kami terima. Masukan kamu sangat berarti untuk perkembangan komunitas DLOB.
        </p>
        <button
          onClick={() => router.push('/survey')}
          className="bg-[#3e6461] text-white px-8 py-3 rounded-2xl font-semibold hover:bg-[#2d4a47] transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  // ── Error / retry screen ────────────────────────────────────────────────
  if (hasError && !isLoadingNext) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">😕</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Gagal memuat pertanyaan</h1>
        <p className="text-gray-500 max-w-sm mb-8 text-sm leading-relaxed">
          Terjadi masalah saat mempersiapkan survey. Pastikan koneksimu stabil dan coba lagi.
        </p>
        <button
          onClick={() => {
            setHasError(false);
            fetchedRef.current = false;
            fetchNextQuestion([]);
          }}
          className="bg-[#3e6461] text-white px-8 py-3 rounded-2xl font-semibold hover:bg-[#2d4a47] transition-colors"
        >
          Coba Lagi
        </button>
        <button
          onClick={() => router.push('/survey')}
          className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Kembali ke halaman survey
        </button>
      </div>
    );
  }

  // ── Done screen ─────────────────────────────────────────────────────────
  if (isDone && !isLoadingNext) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-[#3e6461]/10 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-[#3e6461]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Semua pertanyaan selesai!</h1>
        <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
          Kamu sudah menjawab {qaHistory.length} pertanyaan. Kirim responsmu sekarang?
        </p>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#3e6461] text-white px-8 py-3 rounded-2xl font-semibold hover:bg-[#2d4a47] transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isSubmitting ? 'Mengirim...' : 'Kirim Respons'}
        </button>
      </div>
    );
  }

  // ── Loading screen ──────────────────────────────────────────────────────
  if (isLoadingNext && !current) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-4 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-[#3e6461]" />
        <p className="text-sm">Menyiapkan pertanyaan...</p>
      </div>
    );
  }

  if (!current) return null;

  // ── Main survey UI ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-gray-100 shrink-0">
        <div
          className="h-full bg-[#3e6461] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali
        </button>
        <div className="text-xs text-gray-400 font-medium">
          {totalShown} / maks {MAX_QUESTIONS}
        </div>
        <div className="text-xs text-[#3e6461] font-semibold bg-[#3e6461]/10 px-2 py-1 rounded-full">
          {current.sectionLabel}
        </div>
      </div>

      {/* Question area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div
          className="px-6 py-8 min-h-full flex flex-col"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? 'translateX(0)'
              : direction === 'forward' ? 'translateX(24px)' : 'translateX(-24px)',
            transition: 'opacity 200ms ease, transform 200ms ease',
          }}
        >
          {/* Question text */}
          <div className="mb-6">
            <p className="text-[17px] font-semibold text-gray-900 leading-snug mb-2">
              {current.question}
            </p>
            {current.subtext && (
              <p className="text-sm text-gray-400">{current.subtext}</p>
            )}
            {current.type === 'multiple' && (
              <p className="text-xs text-[#3e6461] mt-1">Pilih semua yang sesuai</p>
            )}
          </div>

          {/* Text input */}
          {current.type === 'text' && (
            <div className="space-y-3">
              <textarea
                value={currentAnswer as string}
                onChange={e => { setCurrentAnswer(e.target.value); if (current.id === 'q_1') setIsAnonymous(false); }}
                placeholder={current.placeholder || 'Ketik jawabanmu di sini...'}
                rows={4}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3e6461]/30 focus:border-[#3e6461] resize-none placeholder:text-gray-400"
              />
              {current.id === 'q_1' && (
                <button
                  type="button"
                  onClick={() => { setCurrentAnswer('Anonim'); setIsAnonymous(true); }}
                  className={`text-sm px-4 py-2 rounded-xl border transition-all ${
                    isAnonymous
                      ? 'bg-[#3e6461] text-white border-[#3e6461]'
                      : 'text-gray-400 border-gray-200 hover:border-[#3e6461]/40 hover:text-[#3e6461]'
                  }`}
                >
                  {isAnonymous ? '✓ Jawab sebagai Anonim' : 'Ingin anonim? Tidak apa-apa 👋'}
                </button>
              )}
            </div>
          )}

          {/* Single choice */}
          {current.type === 'single' && current.options && (
            <div className="flex flex-col gap-2">
              {current.options.map(opt => {
                const selected = currentAnswer === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSingleSelect(opt.value)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl border text-sm font-medium transition-all ${
                      selected
                        ? 'bg-[#3e6461] text-white border-[#3e6461]'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#3e6461]/40 hover:bg-[#3e6461]/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Multiple choice */}
          {current.type === 'multiple' && current.options && (
            <div className="flex flex-col gap-2">
              {current.options.map(opt => {
                const selected = (currentAnswer as string[]).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleMulti(opt.value)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl border text-sm font-medium transition-all ${
                      selected
                        ? 'bg-[#3e6461] text-white border-[#3e6461]'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#3e6461]/40 hover:bg-[#3e6461]/5'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-all ${
                          selected ? 'bg-white/30 border-white' : 'border-gray-300'
                        }`}
                      >
                        {selected && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex-1 min-h-8" />
        </div>
      </div>

      {/* Bottom nav */}
      <div className="px-6 py-5 border-t border-gray-100 shrink-0">
        {isLoadingNext && current && (
          <div className="flex items-center justify-center gap-2 text-[#3e6461] text-sm mb-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Memuat pertanyaan berikutnya...</span>
          </div>
        )}
        {current.type !== 'single' && (
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting || isLoadingNext}
            className="w-full bg-[#3e6461] text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-[#2d4a47] transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Lanjut
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
