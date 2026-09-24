"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Sparkles,
  CreditCard,
  Trophy,
  Dumbbell,
  BarChart3,
  Video,
  Target,
  Brain,
  ChevronRight,
  Flame,
} from "lucide-react";

interface DashboardWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName?: string;
  initialSlide?: number;
}

export default function DashboardWelcomeModal({
  isOpen,
  onClose,
  memberName = "Member",
  initialSlide = 0,
}: DashboardWelcomeModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Sync with initialSlide prop (0-indexed -> 1-indexed)
  useEffect(() => {
    if (isOpen) {
      setStep((initialSlide || 0) + 1);
    }
  }, [isOpen, initialSlide]);

  const stepContent = [
    {
      badge: "PANDUAN DASHBOARD",
      title: `Selamat Datang, ${memberName}! 👋`,
      description:
        "Mari jelajahi fitur lengkap member DLOB untuk memantau pembayaran, melihat statistik pertandingan, dan melatih skill badminton Anda secara terarah.",
      image:
        "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop",
      tag: "OVERVIEW",
      tagColor: "bg-blue-500",
    },
    {
      badge: "KELOLA KEUANGAN",
      title: "Ringkasan Pembayaran & Membership",
      description:
        "Pantau total tagihan pending, riwayat lunas, dan status iuran membership bulanan secara transparan dan real-time langsung dari dashboard Anda.",
      image:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
      tag: "FINANSIAL",
      tagColor: "bg-cyan-500",
    },
    {
      badge: "BANDINGKAN PERFORMA",
      title: "Head-to-Head & Peringkat Komunitas",
      description:
        "Bandingkan win rate dan rekor pertemuan Anda dengan sesama pemain di komunitas DLOB. Temukan partner dengan chemistry tertinggi dan pantau posisi leaderboard.",
      image:
        "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=800&auto=format&fit=crop",
      tag: "HEAD TO HEAD",
      tagColor: "bg-amber-500",
    },
    {
      badge: "FITUR BARU UNGGULAN ✨",
      title: "Training Center & DLOB AI Coach 2.0",
      description:
        "Analisis video stroke pukulan dengan DLOB AI Vision, petakan rotasi & celah blindspot di Radar Lapangan 2v2, serta bimbingan AI Coach yang memiliki ingatan taktis jangka panjang (Knowledge Graph).",
      image:
        "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?q=80&w=800&auto=format&fit=crop",
      tag: "AI & TRAINING",
      tagColor: "bg-emerald-500",
      isTrainingSlide: true,
    },
    {
      badge: "DATA & STRATEGI",
      title: "Analitik Mendalam & AI Chat Kapan Saja",
      description:
        "Akses grafik performa bulanan dan tanyakan strategi atau program drill kepada asisten AI kapanpun Anda membutuhkannya.",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
      tag: "ANALITIK",
      tagColor: "bg-purple-500",
    },
  ];

  const totalSteps = stepContent.length;
  const currentStepData = stepContent[step - 1] || stepContent[0];

  const handleContinue = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="gap-0 p-0 max-w-[440px] sm:max-w-[460px] overflow-hidden rounded-2xl border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl [&>button:last-child]:text-white [&>button:last-child]:bg-black/50 [&>button:last-child]:backdrop-blur-md [&>button:last-child]:hover:bg-black/70 [&>button:last-child]:border [&>button:last-child]:border-white/20 [&>button:last-child]:z-20">
        {/* Top Visual Image Banner */}
        <div className="relative p-2.5 pb-0">
          <div className="relative h-48 w-full overflow-hidden rounded-xl">
            <img
              className="h-full w-full object-cover transition-all duration-500 hover:scale-105"
              src={currentStepData.image}
              alt={currentStepData.title}
            />
            {/* Dark gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10" />

            {/* Badges on Top of Image */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-white text-[10px] font-black uppercase tracking-wider shadow-sm",
                  currentStepData.tagColor,
                )}
              >
                {currentStepData.tag}
              </span>
              {currentStepData.isTrainingSlide && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  Baru
                </span>
              )}
            </div>

            {/* Category / Step counter bottom of image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white/90">
              <span className="text-[11px] font-bold tracking-widest uppercase text-white/80">
                {currentStepData.badge}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-white font-bold">
                {step} / {totalSteps}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body & Text Content */}
        <div className="space-y-4 px-6 pb-6 pt-4">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-snug">
              {currentStepData.title}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
              {currentStepData.description}
            </DialogDescription>
          </DialogHeader>

          {/* Special Feature Highlight for Training Center (Slide 4) */}
          {currentStepData.isTrainingSlide && (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50">
                  <Video className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-gray-900 dark:text-white">AI Vision</p>
                  <p className="text-[9px] text-gray-500 dark:text-zinc-400">Analisis Stroke</p>
                </div>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50">
                  <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-gray-900 dark:text-white">Radar 2v2</p>
                  <p className="text-[9px] text-gray-500 dark:text-zinc-400">Blindspot Lapangan</p>
                </div>
                <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-800/50">
                  <Brain className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-gray-900 dark:text-white">AI Memory</p>
                  <p className="text-[9px] text-gray-500 dark:text-zinc-400">Knowledge Graph</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/dashboard/training");
                }}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer group"
              >
                <span>Buka Training Center Sekarang</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Footer with Step Dots and Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-zinc-800/80">
            {/* Indicator Dots */}
            <div className="flex justify-center space-x-1.5 order-2 sm:order-1">
              {[...Array(totalSteps)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setStep(index + 1)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                    index + 1 === step
                      ? "w-6 bg-emerald-600 dark:bg-emerald-400"
                      : "w-1.5 bg-gray-300 dark:bg-zinc-700 hover:bg-gray-400",
                  )}
                  aria-label={`Ke slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 order-1 sm:order-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
              >
                Lewati
              </Button>

              {step < totalSteps ? (
                <Button
                  size="sm"
                  type="button"
                  onClick={handleContinue}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs group"
                >
                  <span>Lanjut</span>
                  <ArrowRight
                    className="-me-1 ms-1.5 opacity-70 transition-transform group-hover:translate-x-0.5"
                    size={14}
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                </Button>
              ) : (
                <Button
                  size="sm"
                  type="button"
                  onClick={onClose}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Selesai
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
