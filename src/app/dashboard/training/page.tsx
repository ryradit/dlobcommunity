'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Dumbbell, AlertCircle, Search, Play, Users, Zap, Sparkles, 
  MessageSquare, BookOpen, CheckCircle2, ChevronRight, X, 
  ExternalLink, Flame, Target, Trophy, Clock, Video, ArrowRight,
  Upload, FileVideo, Activity, ShieldCheck, Check, RotateCw, RefreshCw, History,
  Compass, Radio, Layers, Award
} from 'lucide-react';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';
import CoachingChat from '@/components/CoachingChat';
import { DoublesCourtRadar } from '@/components/training/DoublesCourtRadar';

interface TrainingTopic {
  id: string;
  icon: string;
  label: string;
  query: string;
  category: 'smash' | 'backhand' | 'footwork' | 'stamina' | 'netplay' | 'defense';
}

interface TutorialVideo {
  id: string;
  title: string;
  creator: string;
  category: 'smash' | 'backhand' | 'footwork' | 'netplay' | 'defense' | 'stamina';
  categoryLabel: string;
  level: 'Pemula' | 'Menengah' | 'Lanjutan' | 'Semua Level';
  duration: string;
  youtubeId: string;
  description: string;
  coachAdvicePrompt: string;
}

interface WeeklyDrill {
  id: string;
  day: string;
  title: string;
  category: string;
  duration: string;
  reps: string;
  description: string;
  keyPoints: string[];
}

const TRAINING_TOPICS: TrainingTopic[] = [
  { id: 'smash', icon: '💥', label: 'Smash Power', query: 'Bagaimana cara meningkatkan kekuatan dan akurasi smash saya agar menukik tajam seperti arahan Tontowi Ahmad?', category: 'smash' },
  { id: 'backhand', icon: '🎾', label: 'Backhand', query: 'Teknik beveled grip dan swing backhand clear yang benar ala Taufik Hidayat agar kok melambung ke baseline?', category: 'backhand' },
  { id: 'footwork', icon: '🏃', label: 'Footwork', query: 'Bagaimana pola footwork 6 sudut yang efisien dan cara recovery cepat ke tengah lapangan standar PB Djarum?', category: 'footwork' },
  { id: 'stamina', icon: '⚡', label: 'Stamina & Fisik', query: 'Program latihan fisik dan interval shuttle run apa yang paling efektif untuk endurance 3 set?', category: 'stamina' },
  { id: 'netplay', icon: '🕸️', label: 'Net Play', query: 'Bagaimana teknik spinning net shot dan cara antisipasi net kill tipuan lawan berdasarkan tips PB Djarum?', category: 'netplay' },
  { id: 'defense', icon: '🛡️', label: 'Defense Solid', query: 'Bagaimana posisi kuda-kuda dan reflek defense terbaik saat lawan melakukan smash keras bertubi-tubi?', category: 'defense' },
];

const TUTORIAL_VIDEOS: TutorialVideo[] = [
  {
    id: 'vid-1',
    title: 'Teknik Pukulan Smash Badminton (Juara Olimpiade)',
    creator: 'Tontowi Ahmad',
    category: 'smash',
    categoryLabel: 'Smash & Serangan',
    level: 'Menengah',
    duration: '01:00',
    youtubeId: '5YebKbCMCdc',
    description: 'Pelajari ayunan lengan pronasi, timing loncatan, dan transfer beban tubuh ala Tontowi Ahmad (Peraih Emas Olimpiade Rio 2016).',
    coachAdvicePrompt: 'Tolong berikan drill bertahap untuk melatih pronasi pergelangan tangan dan timing smash tajam seperti di tutorial Tontowi Ahmad.',
  },
  {
    id: 'vid-2',
    title: 'Tips Backhand Masterclass Legenda Dunia',
    creator: 'Taufik Hidayat',
    category: 'backhand',
    categoryLabel: 'Backhand',
    level: 'Menengah',
    duration: '05:32',
    youtubeId: '4euRuqBt_2A',
    description: 'Kunci pegangan beveled grip, sentakan jempol (thumb grip), dan rotasi pinggang langsung dari maestro backhand dunia, Taufik Hidayat.',
    coachAdvicePrompt: 'Bagaimana tips memperbaiki cengkeraman jempol (thumb grip) saat melakukan backhand tertekan di sudut belakang seperti arahan Taufik Hidayat?',
  },
  {
    id: 'vid-3',
    title: 'Tutorial Bermain Bulutangkis: Footwork 6 Sudut',
    creator: 'PB Djarum',
    category: 'footwork',
    categoryLabel: 'Footwork',
    level: 'Pemula',
    duration: '07:45',
    youtubeId: '79ZyEif8Mfg',
    description: 'Panduan langkah kaki fundamental: chassé step, split step, dan langkah mundur efisien standar pembinaan atlet PB Djarum.',
    coachAdvicePrompt: 'Berapa repetisi shadow footwork 6 sudut yang ideal dilakukan per hari untuk pemain intermediate menurut standar latihan PB Djarum?',
  },
  {
    id: 'vid-4',
    title: 'Teknik Dasar & Defense Solid Bulutangkis',
    creator: 'PB Djarum',
    category: 'defense',
    categoryLabel: 'Defense',
    level: 'Pemula',
    duration: '06:18',
    youtubeId: 'Q50ZQXe_pwI',
    description: 'Kuda-kuda rendah dengan raket siap di depan dada, mengarahkan kok balik menyilang, dan teknik mematahkan smash bertubi-tubi.',
    coachAdvicePrompt: 'Bagaimana cara melatih reflek defense drive balik saat ditekan smash beruntun oleh lawan ganda?',
  },
  {
    id: 'vid-5',
    title: 'BADMINTIPS: Cara Melakukan Netting yang Benar',
    creator: 'PB Djarum',
    category: 'netplay',
    categoryLabel: 'Net Play',
    level: 'Lanjutan',
    duration: '08:15',
    youtubeId: '7LxH9Dy8mrc',
    description: 'Sentuhan tipis pada gabus kok menggunakan sudut raket miring untuk menghasilkan gulungan tipis di atas bibir net.',
    coachAdvicePrompt: 'Apa kunci utama agar kok berputar tipis di atas bibir net tanpa raket menyentuh net berdasarkan tips PB Djarum?',
  },
  {
    id: 'vid-6',
    title: 'Latihan Fisik & Stamina Atlet Terarah',
    creator: 'PB Djarum',
    category: 'stamina',
    categoryLabel: 'Stamina',
    level: 'Semua Level',
    duration: '10:20',
    youtubeId: 'xOAPTiVcu-g',
    description: 'Drill kardio terstruktur, kelincahan kaki, core stability, dan ketahanan anaerobik untuk menjaga stamina prima di set ketiga.',
    coachAdvicePrompt: 'Tolong buatkan jadwal latihan fisik dan kardio mingguan yang seimbang tanpa bikin kaki overtraining sesuai standar fisik bulutangkis.',
  },
];

const WEEKLY_DRILLS: WeeklyDrill[] = [
  {
    id: 'drill-1',
    day: 'Hari 1',
    title: 'Shadow Badminton 6 Sudut & Split Step',
    category: 'Footwork & Kelincahan',
    duration: '20 Menit',
    reps: '4 Set x 2 Menit (Istirahat 1 Menit)',
    description: 'Lakukan shadow footwork menyentuh 6 sudut lapangan dengan raket. Fokus pada split step setiap kembali ke home position.',
    keyPoints: ['Jaga lutut tetap rileks dan badan condong ke depan', 'Split step tepat saat bayangan lawan memukul', 'Kembali cepat ke titik tengah'],
  },
  {
    id: 'drill-2',
    day: 'Hari 2',
    title: 'Wall Rally Reflex & Drive Cepat',
    category: 'Reflek & Defense',
    duration: '15 Menit',
    reps: '5 Set x 50 Pukulan Tanpa Jatuh',
    description: 'Pukul kok ke dinding dari jarak 2 meter menggunakan grip forehand dan backhand secara bergantian secepat mungkin.',
    keyPoints: ['Posisikan raket selalu di atas dada', 'Sentakan jari dan pergelangan tangan, bukan lengan besar', 'Mata selalu fokus ke kok'],
  },
  {
    id: 'drill-3',
    day: 'Hari 3',
    title: 'Drill Net Tap & Spinning Net Shot',
    category: 'Net Play & Kontrol',
    duration: '20 Menit',
    reps: '4 Set x 25 Repetisi Net Tipis',
    description: 'Latihan sentuhan halus raket menyilang di bibir net untuk membiasakan kok berputar tipis melewati net.',
    keyPoints: ['Grip rileks (relaxed fingers)', 'Sudut raket sedikit miring saat kontak', 'Jangan mengayun berlebihan'],
  },
  {
    id: 'drill-4',
    day: 'Hari 4',
    title: 'Interval Kardio Shuttle Run 6 Titik',
    category: 'Fisik & Stamina',
    duration: '25 Menit',
    reps: '6 Set x 1 Menit Sprint Penuh',
    description: 'Lari bolak-balik menyentuh garis samping dan depan-belakang lapangan dengan tempo tinggi menyerupai rally ketat.',
    keyPoints: ['Sentuh lantai dengan ujung jari', 'Jaga pernapasan ritmis', 'Pertahankan kecepatan di set terakhir'],
  },
  {
    id: 'drill-5',
    day: 'Hari 5',
    title: 'Smash Repetition & Front Court Follow-Up',
    category: 'Serangan & Finishing',
    duration: '25 Menit',
    reps: '5 Set x 15 Smash Beruntun',
    description: 'Smash keras dari baseline diikuti loncatan maju cepat untuk menutup bola tanggung di area net.',
    keyPoints: ['Titik kontak kok tepat di atas depan kepala', 'Pronasi lengan penuh saat impact', 'Segera ambil langkah maju setelah landing'],
  },
];

type TabKey = 'daily-hub' | 'ai-coach' | 'video-stroke' | 'videos' | 'drills';

export default function TrainingPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // Navigation tab state: 'daily-hub' | 'ai-coach' | 'video-stroke' | 'videos' | 'drills'
  const [activeTab, setActiveTab] = useState<TabKey>('daily-hub');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeQuery, setActiveQuery] = useState<string>('');

  // Video modal state
  const [selectedVideo, setSelectedVideo] = useState<TutorialVideo | null>(null);

  // Completed drills state
  const [completedDrills, setCompletedDrills] = useState<Record<string, boolean>>({});

  // ── Option C: Video Stroke & Doubles Tactical Analysis State ──
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState<boolean>(false);
  const [videoAnalysisError, setVideoAnalysisError] = useState<string | null>(null);
  const [strokeAnalysisResult, setStrokeAnalysisResult] = useState<any | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'doubles_tactics' | 'stroke'>('doubles_tactics');
  const [strokeCategory, setStrokeCategory] = useState<string>('Rotasi Serang & Bertahan (Front-Back vs Side-by-Side)');
  const [userJersey, setUserJersey] = useState<string>('');
  const [partnerJersey, setPartnerJersey] = useState<string>('');
  const [cameraView, setCameraView] = useState<string>('Kamera Belakang (Back-Court)');
  const [courtSide, setCourtSide] = useState<'near_court' | 'far_court'>('near_court');
  const [userHandedness, setUserHandedness] = useState<'right' | 'left'>('right');
  const [partnerHandedness, setPartnerHandedness] = useState<'right' | 'left'>('right');
  const [showRecordingGuide, setShowRecordingGuide] = useState<boolean>(false);
  const [isDetectingJerseys, setIsDetectingJerseys] = useState<boolean>(false);
  const [pastVideoAnalyses, setPastVideoAnalyses] = useState<any[]>([]);
  const [isLoadingPastAnalyses, setIsLoadingPastAnalyses] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load past video analyses from Supabase
  useEffect(() => {
    if (!user?.id) return;
    const fetchPastAnalyses = async () => {
      setIsLoadingPastAnalyses(true);
      try {
        const res = await fetch(`/api/ai/video-analysis/member-stroke?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.analyses)) {
            setPastVideoAnalyses(data.analyses);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat riwayat analisis video:', err);
      } finally {
        setIsLoadingPastAnalyses(false);
      }
    };
    fetchPastAnalyses();
  }, [user?.id]);

  // Load completed drills from localStorage
  useEffect(() => {
    if (!user?.id) return;
    try {
      const saved = localStorage.getItem(`dlob_completed_drills_${user.id}`);
      if (saved) {
        setCompletedDrills(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load completed drills:', e);
    }
  }, [user?.id]);

  const toggleDrillCompletion = (drillId: string) => {
    if (!user?.id) return;
    const updated = {
      ...completedDrills,
      [drillId]: !completedDrills[drillId],
    };
    setCompletedDrills(updated);
    try {
      localStorage.setItem(`dlob_completed_drills_${user.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save completed drills:', e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveQuery(searchQuery.trim());
    setActiveTab('ai-coach');
  };

  const handleTopicClick = (topic: TrainingTopic) => {
    setActiveQuery(topic.query);
    setActiveTab('ai-coach');
  };

  const handleAskAboutVideo = (video: TutorialVideo) => {
    setSelectedVideo(null);
    setActiveQuery(video.coachAdvicePrompt);
    setActiveTab('ai-coach');
  };

  // ── Video Stroke Validation & Upload (Max 180s / 3 Minutes) ──
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoAnalysisError(null);
    setStrokeAnalysisResult(null);

    // Max 75MB limit
    if (file.size > 75 * 1024 * 1024) {
      setVideoAnalysisError('Ukuran video melebihi 75 MB. Silakan pilih video yang lebih pendek.');
      return;
    }

    // Strict duration check: max 180 seconds (2-3 minutes)
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      const dur = Math.round(video.duration);
      setVideoDuration(dur);

      if (dur > 185) {
        const mins = Math.floor(dur / 60);
        const secs = dur % 60;
        setVideoAnalysisError(`⚠️ Durasi video Anda (${mins}m ${secs}s) melebihi batas maksimal 2-3 menit (180 detik). Silakan potong klip video pukulan atau latihan Anda.`);
        setVideoFile(null);
        setVideoPreviewUrl(null);
        URL.revokeObjectURL(objectUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setVideoFile(file);
      setVideoPreviewUrl(objectUrl);
    };

    video.onerror = () => {
      // Fallback if video metadata cannot be read
      setVideoFile(file);
      setVideoPreviewUrl(objectUrl);
    };
  };

  // ── Auto-Detect Jersey Colors from Video Frame ──
  const handleAutoDetectJerseys = async () => {
    if (!videoPreviewUrl) return;
    setIsDetectingJerseys(true);

    try {
      const video = document.createElement('video');
      video.src = videoPreviewUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      await new Promise<void>((resolve) => {
        video.onloadeddata = () => {
          video.currentTime = Math.min(1.5, (video.duration || 2) / 2);
        };
        video.onseeked = () => resolve();
        video.onerror = () => resolve();
        setTimeout(() => resolve(), 3000);
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);

        const res = await fetch('/api/ai/video-analysis/detect-jerseys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, courtSide }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.userJersey) setUserJersey(data.userJersey);
          if (data.partnerJersey) setPartnerJersey(data.partnerJersey);
        }
      }
    } catch (err) {
      console.warn('[Auto-Detect Jerseys] Failed to extract frame:', err);
    } finally {
      setIsDetectingJerseys(false);
    }
  };

  const handleRunStrokeAnalysis = async () => {
    if (!videoFile) return;
    setIsAnalyzingVideo(true);
    setVideoAnalysisError(null);

    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('stroke_type', strokeCategory);
      formData.append('analysis_mode', analysisMode);
      formData.append('duration', String(videoDuration));
      formData.append('user_jersey', userJersey);
      formData.append('partner_jersey', partnerJersey);
      formData.append('camera_view', cameraView);
      formData.append('court_side', courtSide);
      formData.append('user_handedness', userHandedness);
      formData.append('partner_handedness', partnerHandedness);
      formData.append('user_name', memberName);
      formData.append('user_id', user?.id || '');

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/ai/video-analysis/member-stroke', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal memproses analisis video');
      }

      const data = await res.json();
      setStrokeAnalysisResult({
        ...data.analysis,
        savedToDatabase: data.savedToDatabase,
        analysisId: data.savedAnalysisId,
      });

      if (data.savedAnalysisId) {
        setPastVideoAnalyses((prev) => [
          {
            id: data.savedAnalysisId,
            video_name: videoFile?.name || 'video_stroke.mp4',
            stroke_type: data.analysis.strokeType,
            overall_score: data.analysis.overallScore,
            grade: data.analysis.grade,
            analyzed_at: data.analyzedAt || new Date().toISOString(),
            doubles_metrics: data.analysis.doublesMetrics,
            court_radar: data.analysis.courtRadar,
            biomechanics: data.analysis.biomechanics,
            key_strengths: data.analysis.keyStrengths,
            critical_fixes: data.analysis.criticalFixes,
            coach_recommendation: data.analysis.coachRecommendation,
          },
          ...prev.filter(item => item.id !== data.savedAnalysisId)
        ]);
      }
    } catch (err: any) {
      setVideoAnalysisError(err.message || 'Terjadi gangguan saat memproses video stroke.');
    } finally {
      setIsAnalyzingVideo(false);
    }
  };

  const memberName = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Member';

  const filteredVideos = selectedCategory === 'all'
    ? TUTORIAL_VIDEOS
    : TUTORIAL_VIDEOS.filter(v => v.category === selectedCategory);

  const completedCount = Object.values(completedDrills).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / WEEKLY_DRILLS.length) * 100);

  const todayDrill = WEEKLY_DRILLS[0];
  const todayVideo = TUTORIAL_VIDEOS[0];
  const isTodayDrillDone = !!completedDrills[todayDrill.id];

  const TABS: { id: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'daily-hub', label: 'Daily Hub', icon: <Target className="w-4 h-4" /> },
    { id: 'ai-coach', label: 'AI Coach Studio', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'video-stroke', label: 'Radar & Taktik AI', icon: <Compass className="w-4 h-4" />, badge: 'DLOB AI VISION' },
    { id: 'videos', label: 'Masterclass', icon: <Play className="w-4 h-4" /> },
    { id: 'drills', label: 'Drill Mingguan', icon: <BookOpen className="w-4 h-4" /> },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Menyiapkan DLOB Performance Lab...</h1>
          <p className="text-zinc-500 text-xs font-mono">Memuat kurikulum latihan bulutangkis personal Anda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 p-3 sm:p-6 lg:p-8 selection:bg-emerald-500/30 selection:text-emerald-200">
      <ProfileCompletionWarning />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ── HIGH-END STUDIO MASTER HEADER (Double Bezel + Kinetic Accents) ── */}
        <div className="relative rounded-3xl p-1 bg-gradient-to-b from-white/15 via-white/5 to-white/0 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />
          
          <div className="relative rounded-[calc(1.5rem-2px)] bg-slate-950/90 dark:bg-[#0B0F17]/95 p-5 sm:p-8 backdrop-blur-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Left Identity Column */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>DLOB PERFORMANCE LAB v2.4</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 text-zinc-300 border border-white/10">
                    <Radio className="w-3 h-3 text-emerald-400" />
                    <span>Real-time Court Vision</span>
                  </div>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
                      <Dumbbell className="w-7 h-7 sm:w-8 sm:h-8" />
                    </span>
                    <span className="bg-gradient-to-r from-white via-slate-100 to-zinc-400 bg-clip-text text-transparent">
                      Training Center & AI Studio
                    </span>
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                    Sistem akselerasi kemampuan bulutangkis terpadu: drill harian terarah, simulasi 2D radar penutupan blindspot ganda, dan konsultasi taktis personal untuk <strong className="text-emerald-400 font-semibold">{memberName}</strong>.
                  </p>
                </div>
              </div>

              {/* Right Stat Widget */}
              <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shrink-0">
                <div className="space-y-1 sm:text-right">
                  <span className="text-[11px] text-zinc-400 font-medium block">Progress Drill Pekanan</span>
                  <div className="flex items-baseline sm:justify-end gap-2 font-mono">
                    <span className="text-3xl font-black text-emerald-400">{completedCount}</span>
                    <span className="text-sm text-zinc-500">/ {WEEKLY_DRILLS.length} Sesi</span>
                  </div>
                </div>

                <div className="w-full sm:w-44 bg-zinc-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-emerald-400/90 sm:text-right block">
                  {progressPercent}% target tercapai minggu ini
                </span>
              </div>
            </div>

            {/* Smart Integrated Studio Search */}
            <form onSubmit={handleSearchSubmit} className="relative mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <input
                type="text"
                placeholder="Tanyakan analisis taktik atau minta program latihan (contoh: 'Cara rotasi ganda saat bola lob diserang' atau 'Drill footwork 20 menit')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-32 py-3 bg-white/5 hover:bg-white/[0.08] focus:bg-white/10 border border-white/10 focus:border-emerald-500/50 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Konsultasi</span>
              </button>
            </form>
          </div>
        </div>

        {/* ── FLOATING ISLAND SEGMENTED TAB NAVIGATION ── */}
        <div className="sticky top-2 z-40 p-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-xl overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2 min-w-max">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 z-10 ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTrainingTab"
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md shadow-emerald-500/30"
                    />
                  )}
                  <span className="relative z-20 flex items-center gap-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase tracking-wider ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB 1: OPTION A - AUTONOMOUS DAILY ACTION HUB ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'daily-hub' && (
            <motion.div
              key="daily-hub-tab"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Daily Spotlight Bento Hero */}
              <div className="relative rounded-3xl p-1 bg-gradient-to-b from-emerald-500/20 via-white/5 to-white/0 border border-emerald-500/30 shadow-xl overflow-hidden">
                <div className="relative rounded-[calc(1.5rem-2px)] bg-slate-900/90 dark:bg-[#0B0F17]/95 p-5 sm:p-7 backdrop-blur-xl space-y-6">
                  
                  {/* Headline & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          FOKUS HARI INI
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          🇮🇩 Masterclass: {todayVideo.creator}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        {todayVideo.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => toggleDrillCompletion(todayDrill.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                        isTodayDrillDone
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                          : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${isTodayDrillDone ? 'text-white' : 'text-zinc-500'}`} />
                      <span>{isTodayDrillDone ? 'Drill Hari Ini Selesai' : 'Tandai Selesai'}</span>
                    </button>
                  </div>

                  {/* Asymmetric 2-Column Bento */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Left: Video Preview Card */}
                    <div className="lg:col-span-6 flex flex-col justify-between space-y-3">
                      <div 
                        onClick={() => setSelectedVideo(todayVideo)}
                        className="relative aspect-video rounded-2xl overflow-hidden bg-black cursor-pointer group shadow-2xl border border-white/10"
                      >
                        <img
                          src={`https://img.youtube.com/vi/${todayVideo.youtubeId}/hqdefault.jpg`}
                          alt={todayVideo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="w-6 h-6 ml-0.5 fill-current" />
                          </div>
                        </div>
                        <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/85 text-xs font-mono font-bold text-white flex items-center gap-1.5 border border-white/10">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" /> {todayVideo.duration}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {todayVideo.description}
                      </p>
                    </div>

                    {/* Right: Tactical Field Drill Card */}
                    <div className="lg:col-span-6 flex flex-col justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" />
                            Instruksi Latihan Fisik & Lapangan
                          </span>
                          <span className="text-xs font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            ⏱️ {todayDrill.duration}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-white">
                          {todayDrill.title}
                        </h3>

                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {todayDrill.description}
                        </p>

                        <div className="space-y-2 pt-3 border-t border-white/10">
                          <span className="text-[11px] font-bold text-zinc-300">Kunci Pelaksanaan:</span>
                          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                            {todayDrill.keyPoints.map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* 1-Click Interactive CTA Row */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                        <button
                          onClick={() => setSelectedVideo(todayVideo)}
                          className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Tonton Video</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveQuery(todayVideo.coachAdvicePrompt);
                            setActiveTab('ai-coach');
                          }}
                          className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-colors"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Konsultasi AI</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* High-Impact Vision AI Feature Banner */}
              <div className="relative rounded-3xl p-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/30 shadow-xl overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                    <Activity className="w-3.5 h-3.5" />
                    <span>AI COURT RADAR 2D • MULTI-RALLY SCAN</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Punya Rekaman Video Latihan atau Game Ganda? (Maks 180s)
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                    Unggah klip permainan Anda. Model AI kami akan memetakan formasi rotasi, mendeteksi celah blindspot lapangan, dan memberikan koordinat langkah presisi.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('video-stroke')}
                  className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shrink-0 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Buka Radar AI Lapangan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Kinetic Topic Grid */}
              <div className="rounded-3xl bg-slate-900/70 border border-white/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-black text-white">
                      Konsultasi Instan Berdasarkan Topik
                    </h3>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
                    Pilih topik untuk otomatis membuka AI Coach
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {TRAINING_TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleTopicClick(topic)}
                      className="p-4 rounded-2xl bg-white/[0.02] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all text-left group flex flex-col justify-between h-32 cursor-pointer shadow-sm hover:shadow-emerald-500/10"
                    >
                      <div className="text-3xl">{topic.icon}</div>
                      <div>
                        <div className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">
                          {topic.label}
                        </div>
                        <div className="text-[10px] text-zinc-500 group-hover:text-emerald-300 font-medium flex items-center gap-1 mt-1">
                          <span>Konsultasi</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TAB 2: COACHING AI (always mounted to protect active chat session) ── */}
        <div style={{ display: activeTab === 'ai-coach' ? 'block' : 'none' }} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/20">
                  🏸
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">DLOB AI Badminton Coach</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    DIALECTIC ENGINE ACTIVE
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Sesi bimbingan personal & evaluasi data tanding untuk <strong className="text-white">{memberName}</strong>
                </p>
              </div>
            </div>

            {/* Quick AI Prompts Bar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 font-medium mr-1">Rekomendasi pertanyaan:</span>
              {[
                'Analisis form video terakhir',
                'Latihan smash tajam',
                'Tips defense ganda',
                'Footwork 15 menit'
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveQuery(prompt)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors cursor-pointer border border-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Embedded Coaching Chat Interface */}
          <div className="h-[680px] bg-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <CoachingChat
              memberName={memberName}
              initialQuery={activeQuery}
              onQueryConsumed={() => setActiveQuery('')}
              completedDrills={completedDrills}
              activeVideoAnalysis={strokeAnalysisResult}
              onClearVideoContext={() => setStrokeAnalysisResult(null)}
            />
          </div>
        </div>

        {/* ── TAB 3: OPTION C - MEMBER VIDEO STROKE & DOUBLES TACTICAL ANALYSIS ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'video-stroke' && (
            <motion.div
              key="video-stroke-tab"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="rounded-3xl p-6 sm:p-8 bg-slate-900/80 border border-white/10 shadow-2xl space-y-6">
                
                {/* Section Header */}
                <div className="border-b border-white/10 pb-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Compass className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-black text-white">
                      Analisis Video Taktik Ganda & Radar Lapangan 2D
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Unggah klip rekaman game ganda atau drill pukulan (<strong>maksimal 2-3 menit / 180 detik</strong>). Sistem akan memetakan pergerakan pemain, celah blindspot, dan merekomendasikan penutupan area.
                  </p>
                </div>

                {/* Past Saved Video Analyses History from Supabase */}
                {pastVideoAnalyses.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <History className="w-4 h-4 text-emerald-400" />
                        Riwayat Rekaman Tersimpan ({pastVideoAnalyses.length})
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Supabase Synced
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {pastVideoAnalyses.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setStrokeAnalysisResult({
                              ...item,
                              mode: item.doubles_metrics ? 'doubles_tactics' : 'stroke',
                              strokeType: item.stroke_type,
                              overallScore: item.overall_score,
                              grade: item.grade,
                              courtRadar: item.court_radar,
                              doublesMetrics: item.doubles_metrics,
                              biomechanics: item.biomechanics,
                              keyStrengths: item.key_strengths,
                              criticalFixes: item.critical_fixes,
                              coachRecommendation: item.coach_recommendation,
                              savedToDatabase: true,
                              analysisId: item.id,
                            });
                          }}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 hover:border-emerald-500/50 transition-all text-left group cursor-pointer shadow-sm hover:shadow-emerald-500/10"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-white truncate">
                              {item.stroke_type || item.video_name}
                            </span>
                            <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                              {item.overall_score}/100
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span>{new Date(item.analyzed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5">
                              <span>Buka Radar</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">Pilih Mode Analisis Video:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAnalysisMode('doubles_tactics');
                        setStrokeCategory('Rotasi Serang & Bertahan (Front-Back vs Side-by-Side)');
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                        analysisMode === 'doubles_tactics'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                          : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold block text-white">Taktik & Rotasi Ganda (Doubles Play)</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500 text-slate-950">REKOMENDASI</span>
                        </div>
                        <span className="text-[11px] text-zinc-400 block mt-1 leading-snug">
                          Analisis sinergi pasangan, penutupan ruang kosong (anti-blindspot), formasi serang/bertahan, & radar lapangan 2D.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAnalysisMode('stroke');
                        setStrokeCategory('Smash & Serangan');
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                        analysisMode === 'stroke'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                          : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-white">Biomekanik Pukulan Solo (Drill & Stroke)</span>
                        <span className="text-[11px] text-zinc-400 block mt-1 leading-snug">
                          Evaluasi sudut siku, kinetika ayunan lengan, kuda-kuda kaki (split step), dan follow-through pukulan tunggal.
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Scenario Category Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">
                    {analysisMode === 'doubles_tactics' ? 'Fokus Skenario Lapangan Ganda:' : 'Pilih Fokus Gerakan yang Direkam:'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(analysisMode === 'doubles_tactics'
                      ? [
                          'Rotasi Serang & Bertahan (Front-Back vs Side-by-Side)',
                          'Penutupan Ruang Kosong (Complementary Coverage)',
                          'Pertahanan Garis Tengah (Seam Defense)',
                          'Transisi Netting ke Belakang',
                          'Rally Game Ganda Umum',
                        ]
                      : ['Smash & Serangan', 'Backhand Clear', 'Footwork 6 Sudut', 'Netting & Net Kill', 'Defense & Kuda-kuda']
                    ).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setStrokeCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          strokeCategory === cat
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Precision Calibration Box */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Konteks Visual & Kalibrasi Kamera
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Mencegah AI tertukar dengan pasangan lawan di seberang net & mengoptimalkan akurasi radar.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRecordingGuide(!showRecordingGuide)}
                      className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                    >
                      <span>{showRecordingGuide ? 'Sembunyikan Panduan Kamera' : 'Lihat Panduan Rekaman'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showRecordingGuide ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {/* Collapsible Camera Guide */}
                  {showRecordingGuide && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-zinc-300 space-y-2">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                        🎥 Rekomendasi Sudut Kamera Rekaman:
                      </span>
                      <ul className="space-y-1 text-[11px] list-disc pl-5 text-zinc-400">
                        <li><strong>Posisi Ideal:</strong> Kamera/tripod diletakkan di belakang garis baseline agar kedua garis samping lapangan terlihat penuh.</li>
                        <li><strong>Durasi Fokus:</strong> Rekam 1-2 reli aktif (15-45 detik) dari durasi maksimal 180 detik.</li>
                        <li><strong>Warna Baju:</strong> Warna pakaian yang kontras antara Anda dan partner sangat membantu pelacakan pemain.</li>
                      </ul>
                    </div>
                  )}

                  {/* Auto-detect Trigger */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-white/5">
                    <span className="text-[11px] font-bold text-zinc-300">
                      Identifikasi Pemain & Sudut Kamera:
                    </span>
                    {videoPreviewUrl && (
                      <button
                        type="button"
                        onClick={handleAutoDetectJerseys}
                        disabled={isDetectingJerseys}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isDetectingJerseys ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                            <span>Mendeteksi Warna dari Frame Video...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>Ekstrak Warna Otomatis dari Video</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Input Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Warna Baju Anda:
                      </label>
                      <input
                        type="text"
                        value={userJersey}
                        onChange={(e) => setUserJersey(e.target.value)}
                        placeholder="Contoh: Baju Hitam, Celana Merah"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Warna Baju Partner:
                      </label>
                      <input
                        type="text"
                        value={partnerJersey}
                        onChange={(e) => setPartnerJersey(e.target.value)}
                        placeholder="Contoh: Baju Biru, Celana Putih"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Sudut Kamera:
                      </label>
                      <select
                        value={cameraView}
                        onChange={(e) => setCameraView(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="Kamera Belakang (Back-Court)">Kamera Belakang (Paling Akurat)</option>
                        <option value="Kamera Samping (Side-Court)">Kamera Samping Lapangan</option>
                        <option value="Kamera Sudut (Corner View)">Kamera Sudut Diagonal</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Court side and handedness */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Sisi Lapangan Anda:
                      </label>
                      <select
                        value={courtSide}
                        onChange={(e) => setCourtSide(e.target.value as 'near_court' | 'far_court')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="near_court">Sisi Dekat Kamera (Bawah - Disarankan)</option>
                        <option value="far_court">Sisi Seberang Net (Atas)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Tangan Dominan Anda:
                      </label>
                      <select
                        value={userHandedness}
                        onChange={(e) => setUserHandedness(e.target.value as 'right' | 'left')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="right">Tangan Kanan (Dominan)</option>
                        <option value="left">Kidal / Tangan Kiri</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Tangan Dominan Partner:
                      </label>
                      <select
                        value={partnerHandedness}
                        onChange={(e) => setPartnerHandedness(e.target.value as 'right' | 'left')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="right">Tangan Kanan (Dominan)</option>
                        <option value="left">Kidal / Tangan Kiri</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Upload Zone */}
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={handleVideoSelect}
                    className="hidden"
                    id="stroke-video-input"
                  />

                  {!videoPreviewUrl ? (
                    <label
                      htmlFor="stroke-video-input"
                      className="border-2 border-dashed border-white/15 hover:border-emerald-500/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[0.01] hover:bg-white/[0.03] group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7" />
                      </div>
                      <span className="text-sm font-bold text-white">
                        Pilih Klip Video Latihan atau Game Ganda
                      </span>
                      <span className="text-xs text-zinc-400 mt-1 max-w-sm">
                        Maksimal durasi: <strong>2-3 menit (180 detik)</strong>. Format MP4, MOV, WebM (Maks 75 MB).
                      </span>
                    </label>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative aspect-video max-w-2xl mx-auto rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
                        <video
                          src={videoPreviewUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-2xl mx-auto p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                        <div>
                          <span className="text-xs font-bold text-white block line-clamp-1">
                            {videoFile?.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            Durasi: {videoDuration}s {videoDuration <= 180 ? '(✓ Dalam Batas Maksimal)' : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setVideoFile(null);
                              setVideoPreviewUrl(null);
                              setStrokeAnalysisResult(null);
                              setVideoAnalysisError(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                          >
                            Ganti Video
                          </button>

                          <button
                            onClick={handleRunStrokeAnalysis}
                            disabled={isAnalyzingVideo || videoDuration > 185}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                          >
                            {isAnalyzingVideo ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Menganalisis Gerakan AI...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span>Mulai Analisis AI</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Alert */}
                  {videoAnalysisError && (
                    <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                      <div>
                        <span className="font-bold block text-red-200">Pemberitahuan Validasi:</span>
                        <span>{videoAnalysisError}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── ANALYSIS RESULTS DISPLAY (RADAR + TACTICS + BIOMECHANICS) ── */}
                {strokeAnalysisResult && (
                  <div className="space-y-6 pt-6 border-t border-white/10 animate-in fade-in duration-300">
                    
                    {/* Score & Summary Banner */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-zinc-950 text-white border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {strokeAnalysisResult.mode === 'doubles_tactics' ? '🏸 EVALUASI TAKTIK GANDA' : '🎯 EVALUASI BIOMEKANIK'} : {strokeAnalysisResult.strokeType}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white">
                            Grade: {strokeAnalysisResult.grade || 'A-'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Tersimpan di Supabase</span>
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white">
                          {strokeAnalysisResult.mode === 'doubles_tactics'
                            ? 'Hasil Evaluasi Taktik & Rotasi Lapangan Ganda'
                            : 'Hasil Evaluasi Biomekanik Pukulan'}
                        </h3>
                        <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                          {strokeAnalysisResult.coachRecommendation || 'Gerakan dan posisi lapangan Anda telah dianalisis berdasarkan sinergi tim dan pencegahan ruang kosong.'}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl shrink-0">
                          <div className="text-center">
                            <span className="text-[11px] text-zinc-400 block font-medium">
                              {strokeAnalysisResult.mode === 'doubles_tactics' ? 'Skor Sinergi & Taktik' : 'Skor Akurasi Teknik'}
                            </span>
                            <span className="text-3xl font-black text-emerald-400 font-mono">
                              {strokeAnalysisResult.overallScore || 84} <span className="text-sm text-zinc-500">/ 100</span>
                            </span>
                            <span className="text-[10px] text-emerald-300 block font-semibold">Sangat Baik</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const blindspots = strokeAnalysisResult.courtRadar?.exposedZones
                              ?.filter((z: any) => z.status === 'exposed')
                              .map((z: any) => z.name)
                              .join(', ') || 'minim';
                            const prefill = `Coach, tolong analisis hasil rekaman video saya barusan (${strokeAnalysisResult.strokeType || 'Taktik Ganda'}, Skor: ${strokeAnalysisResult.overallScore}/100, Celah Blindspot: ${blindspots}). Bandingkan dengan riwayat pertandingan saya di komunitas, apa program latihan bertahap yang paling tepat?`;
                            setActiveQuery(prefill);
                            setActiveTab('ai-coach');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span className="whitespace-nowrap">Bahas di AI Coach</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* ── 2D Badminton Court Spatial Radar ── */}
                    {strokeAnalysisResult.courtRadar && (
                      <DoublesCourtRadar
                        userPos={strokeAnalysisResult.courtRadar.userPos}
                        partnerPos={strokeAnalysisResult.courtRadar.partnerPos}
                        playerName={memberName}
                        formation={strokeAnalysisResult.doublesMetrics?.formation || 'front_back'}
                        formationName={strokeAnalysisResult.doublesMetrics?.formationName || 'Formasi Serang (Depan-Belakang)'}
                        exposedZones={strokeAnalysisResult.courtRadar.exposedZones}
                        suggestedMove={strokeAnalysisResult.courtRadar.suggestedMove}
                        synergyScore={strokeAnalysisResult.doublesMetrics?.synergyScore || strokeAnalysisResult.overallScore || 84}
                        coverageEfficiency={strokeAnalysisResult.doublesMetrics?.coverageEfficiency || 78}
                        rallyFrames={strokeAnalysisResult.courtRadar.rallyFrames || strokeAnalysisResult.rallyFrames}
                        analyzedRallySegment={strokeAnalysisResult.courtRadar.analyzedRallySegment || strokeAnalysisResult.analyzedRallySegment}
                        detectedRallies={strokeAnalysisResult.detectedRallies}
                      />
                    )}

                    {/* Doubles Tactical Metrics Cards */}
                    {strokeAnalysisResult.doublesMetrics && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm">
                          <span className="text-[11px] text-zinc-400 block font-medium">Formasi Dominan</span>
                          <span className="text-xs font-bold text-white mt-1 block">
                            {strokeAnalysisResult.doublesMetrics.formationName}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm">
                          <span className="text-[11px] text-zinc-400 block font-medium">Kecepatan Transisi</span>
                          <span className="text-xs font-bold text-emerald-400 mt-1 block">
                            {strokeAnalysisResult.doublesMetrics.transitionSpeed || 'Optimal (< 1.2 detik)'}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm">
                          <span className="text-[11px] text-zinc-400 block font-medium">Penguasaan Garis Tengah</span>
                          <span className="text-xs font-bold text-sky-400 mt-1 block">
                            {strokeAnalysisResult.doublesMetrics.seamDefense || 'Tertata Baik'}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm">
                          <span className="text-[11px] text-zinc-400 block font-medium">Efisiensi Lapangan</span>
                          <span className="text-xs font-bold text-purple-400 mt-1 block">
                            {strokeAnalysisResult.doublesMetrics.coverageEfficiency || 78}% Area Aman
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Biomechanics 3 Pillars */}
                    {strokeAnalysisResult.biomechanics && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">1. Sudut Siku & Lengan</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                              {strokeAnalysisResult.biomechanics.elbowAngle?.metric || 'Optimal'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {strokeAnalysisResult.biomechanics.elbowAngle?.description}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">2. Kuda-kuda Footwork</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                              {strokeAnalysisResult.biomechanics.stanceStability?.metric || 'Perlu Perbaikan'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {strokeAnalysisResult.biomechanics.stanceStability?.description}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">3. Ayunan Akhir (Follow-Through)</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                              {strokeAnalysisResult.biomechanics.followThrough?.metric || 'Baik'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {strokeAnalysisResult.biomechanics.followThrough?.description}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Strengths & Critical Fixes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Keunggulan yang Terdeteksi
                        </span>
                        <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                          {(strokeAnalysisResult.keyStrengths || []).map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" /> Aspek Kunci Koreksi
                        </span>
                        <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                          {(strokeAnalysisResult.criticalFixes || []).map((f: string, idx: number) => (
                            <li key={idx}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TAB 4: INDONESIAN CREATOR VIDEO TUTORIALS ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'videos' && (
            <motion.div
              key="videos-tab"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {[
                  { id: 'all', label: 'Semua Video' },
                  { id: 'smash', label: '💥 Smash' },
                  { id: 'backhand', label: '🎾 Backhand' },
                  { id: 'footwork', label: '🏃 Footwork' },
                  { id: 'defense', label: '🛡️ Defense' },
                  { id: 'netplay', label: '🕸️ Net Play' },
                  { id: 'stamina', label: '⚡ Stamina' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-900 text-zinc-400 border border-white/10 hover:border-emerald-500/40 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Video Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className="rounded-3xl bg-slate-900/80 border border-white/10 overflow-hidden shadow-lg flex flex-col justify-between hover:border-emerald-500/40 transition-all group"
                  >
                    <div>
                      {/* Video Thumbnail */}
                      <div 
                        onClick={() => setSelectedVideo(video)}
                        className="relative h-44 bg-black overflow-hidden cursor-pointer flex items-center justify-center"
                      >
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('mqdefault.jpg')) {
                              target.src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 ml-0.5 fill-current" />
                          </div>
                        </div>
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/85 text-[11px] font-mono font-bold text-white flex items-center gap-1 border border-white/10">
                          <Clock className="w-3 h-3 text-emerald-400" /> {video.duration}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            🇮🇩 {video.creator}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {video.level}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug">
                          {video.title}
                        </h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {video.description}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-5 pt-0 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-white/5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tonton</span>
                      </button>
                      <button
                        onClick={() => handleAskAboutVideo(video)}
                        title="Konsultasikan teknik video ini ke AI Coach"
                        className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tanya AI</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TAB 5: WEEKLY DRILLS & TRAINING PLAN ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'drills' && (
            <motion.div
              key="drills-tab"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Progress Summary Header */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-black text-white">Rencana Drill Mandiri Pekanan</h3>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Lakukan drill rutin 15-25 menit per hari untuk melatih memori otot dan konsistensi pukulan Anda.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-36 bg-zinc-800 rounded-full h-3 overflow-hidden border border-white/5">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {progressPercent}% Selesai
                  </span>
                </div>
              </div>

              {/* Drills List */}
              <div className="space-y-4">
                {WEEKLY_DRILLS.map((drill) => {
                  const isDone = !!completedDrills[drill.id];
                  return (
                    <div
                      key={drill.id}
                      className={`p-6 rounded-3xl border transition-all ${
                        isDone 
                          ? 'bg-emerald-950/20 border-emerald-500/40' 
                          : 'bg-slate-900/80 border-white/10 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-white text-slate-950">
                              {drill.day}
                            </span>
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {drill.category}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              ⏱️ {drill.duration} ({drill.reps})
                            </span>
                          </div>

                          <h4 className={`text-base font-black ${isDone ? 'line-through text-zinc-500' : 'text-white'}`}>
                            {drill.title}
                          </h4>

                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {drill.description}
                          </p>

                          <div className="space-y-1 pt-2">
                            <p className="text-[11px] font-bold text-zinc-300">Kunci Pelaksanaan:</p>
                            <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                              {drill.keyPoints.map((point, i) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-2 shrink-0 pt-3 sm:pt-0">
                          <button
                            onClick={() => toggleDrillCompletion(drill.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isDone 
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                            }`}
                          >
                            <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-white' : 'text-zinc-500'}`} />
                            <span>{isDone ? 'Sudah Selesai' : 'Tandai Selesai'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveQuery(`Saya ingin berlatih drill '${drill.title}'. Tolong berikan tips tambahan agar hasil maksimal.`);
                              setActiveTab('ai-coach');
                            }}
                            className="text-[11px] text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Konsultasi AI</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── VIDEO PLAYER MODAL ── */}
        <AnimatePresence>
          {selectedVideo && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-900 border border-white/15 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-4"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                      🇮🇩 {selectedVideo.creator} • {selectedVideo.categoryLabel}
                    </span>
                    <h3 className="text-base font-black text-white line-clamp-1">
                      {selectedVideo.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Video Player */}
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0`}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>

                {/* Modal Footer / AI Coach Trigger */}
                <div className="p-5 pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-zinc-400 max-w-lg">
                    {selectedVideo.description}
                  </p>
                  <button
                    onClick={() => handleAskAboutVideo(selectedVideo)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 shrink-0 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Tanya AI tentang video ini</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
