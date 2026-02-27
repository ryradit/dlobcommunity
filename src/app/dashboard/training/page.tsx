'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dumbbell, Send, Loader2, Play, ExternalLink, BookOpen, Trophy, Target, Zap, Clock, Star, Trash2, HelpCircle, X } from 'lucide-react';
import Image from 'next/image';
import TutorialOverlay from '@/components/TutorialOverlay';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  url: string;
}

interface TrainingSession {
  id: string;
  query: string;
  advice: string;
  videos: YouTubeVideo[];
  timestamp: string;
}

export default function TrainingCenterPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentAdvice, setCurrentAdvice] = useState('');
  const [currentVideos, setCurrentVideos] = useState<YouTubeVideo[]>([]);
  const [history, setHistory] = useState<TrainingSession[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Tutorial
  const tutorialSteps = getTutorialSteps('member-training');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('member-training', tutorialSteps);

  // Load training history from Supabase on mount
  useEffect(() => {
    if (user?.id) {
      loadTrainingHistory();
    }
  }, [user?.id]);

  // Handle ESC key to close video modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVideoModalOpen) {
        setIsVideoModalOpen(false);
        setSelectedVideo(null);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isVideoModalOpen]);

  const loadTrainingHistory = async () => {
    if (!user?.id) return;

    try {
      setLoadingHistory(true);
      const response = await fetch(`/api/training-history?userId=${user.id}&limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        const formattedHistory = data.history.map((item: any) => ({
          id: item.id,
          query: item.query,
          advice: item.advice,
          videos: item.videos,
          timestamp: item.created_at,
        }));
        setHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Failed to load training history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveToHistory = async (session: TrainingSession) => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/training-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          query: session.query,
          advice: session.advice,
          videos: session.videos,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedSession = {
          ...session,
          id: data.data.id,
          timestamp: data.data.created_at,
        };
        
        // Remove old entry if it exists (in case of update)
        setHistory(prev => {
          const filtered = prev.filter(item => item.id !== data.data.id);
          return [updatedSession, ...filtered];
        });

        console.log('[Training UI] ✅ History saved/updated:', data.data.id);
      }
    } catch (error) {
      console.error('Failed to save training history:', error);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/training-history?id=${id}&userId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete training history:', error);
    }
  };

  const popularTopics = [
    { icon: Zap, label: 'Smash Power', query: 'Bagaimana cara meningkatkan kekuatan smash saya?' },
    { icon: Target, label: 'Backhand', query: 'Teknik backhand yang benar untuk pemula' },
    { icon: Clock, label: 'Footwork', query: 'Cara meningkatkan footwork dan kecepatan bergerak' },
    { icon: Trophy, label: 'Servis', query: 'Teknik servis yang akurat dan konsisten' },
    { icon: BookOpen, label: 'Defense', query: 'Cara bertahan dari serangan lawan yang kuat' },
    { icon: Star, label: 'Stamina', query: 'Latihan untuk meningkatkan stamina badminton' },
  ];

  const handleSubmit = async (e: React.FormEvent, presetQuery?: string) => {
    e.preventDefault();
    const searchQuery = presetQuery || query;
    if (!searchQuery.trim() || isLoading) return;

    setIsLoading(true);
    setQuery('');
    setCurrentAdvice('');
    setCurrentVideos([]);

    try {
      const response = await fetch('/api/ai/training-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (!response.ok) throw new Error('Gagal mendapatkan rekomendasi');

      const data = await response.json();
      
      console.log('[Training UI] Received data:', {
        hasAdvice: !!data.advice,
        adviceLength: data.advice?.length || 0,
        videoCount: data.videos?.length || 0,
        videos: data.videos
      });
      
      setCurrentAdvice(data.advice);
      setCurrentVideos(data.videos || []);

      if (!data.videos || data.videos.length === 0) {
        console.warn('[Training UI] ⚠️ No videos in response!');
      }

      // Create session and save to Supabase
      const newSession: TrainingSession = {
        id: '', // Will be set by database
        query: searchQuery,
        advice: data.advice,
        videos: data.videos || [],
        timestamp: new Date().toISOString(),
      };
      
      // Save to Supabase
      await saveToHistory(newSession);

    } catch (error) {
      console.error('Training recommendations error:', error);
      setCurrentAdvice('Maaf, terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicClick = (topicQuery: string) => {
    setQuery(topicQuery);
    handleSubmit(new Event('submit') as any, topicQuery);
  };

  const loadHistorySession = (session: TrainingSession) => {
    setCurrentAdvice(session.advice);
    setCurrentVideos(session.videos);
    setQuery(session.query);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white p-6 transition-colors duration-300">
      <ProfileCompletionWarning />
      <div>
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-linear-to-br from-[#3e6461] to-[#2d4a47] rounded-xl">
              <Dumbbell className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Training Center</h1>
              <p className="text-gray-600 dark:text-zinc-400 text-sm font-medium">Tingkatkan skill badminton Anda dengan panduan AI</p>
            </div>
          </div>
          
          <button
            onClick={toggleTutorial}
            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
            title="Tampilkan panduan fitur"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="training-search-bar bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-2xl p-6 mb-6 shadow-sm transition-colors duration-300">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Contoh: Bagaimana cara meningkatkan smash saya?"
              disabled={isLoading}
              className="flex-1 px-5 py-4 bg-gray-50 dark:bg-zinc-800/60 border-2 border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#3e6461] dark:focus:border-[#3e6461]/50 focus:ring-2 focus:ring-[#3e6461]/20 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="px-6 py-4 bg-linear-to-br from-[#3e6461] to-[#2d4a47] hover:from-[#3e6461]/90 hover:to-[#2d4a47]/90 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Mencari...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Tanya AI
                </>
              )}
            </button>
          </form>

          {/* Popular Topics */}
          <div className="training-popular-topics mt-6">
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-3">Topik Populer:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {popularTopics.map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => handleTopicClick(topic.query)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-zinc-800/40 hover:bg-gray-200 dark:hover:bg-zinc-800/60 border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 rounded-lg transition-all text-left disabled:opacity-50"
                >
                  <topic.icon className="w-4 h-4 text-[#3e6461]" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-white">{topic.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="training-main-content lg:col-span-2 space-y-6">
            {/* AI Advice */}
            {currentAdvice && (
              <div className="training-ai-advice bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-[#3e6461]/10 dark:bg-[#3e6461]/20 rounded-lg">
                    <Dumbbell className="w-5 h-5 text-[#3e6461]" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Saran Pelatih AI</h2>
                </div>
                <p className="text-gray-600 dark:text-zinc-300 leading-relaxed font-medium">{currentAdvice}</p>
              </div>
            )}

            {/* Video Recommendations */}
            {currentVideos.length > 0 && (
              <div className="training-video-recommendations bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <Play className="w-5 h-5 text-[#3e6461]" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Video Tutorial</h2>
                </div>
                <div className="space-y-3">
                  {currentVideos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => {
                        setSelectedVideo(video);
                        setIsVideoModalOpen(true);
                      }}
                      className="block group w-full text-left"
                    >
                      <div className="flex gap-4 bg-gray-100 dark:bg-zinc-800/40 hover:bg-gray-200 dark:hover:bg-zinc-800/60 p-4 rounded-xl border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all cursor-pointer">
                        <div className="relative w-40 h-24 shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={video.thumbnail}
                            alt={video.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-white ml-1" fill="white" />
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-semibold">
                            {video.duration}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 dark:text-zinc-200 line-clamp-2 mb-2 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                            {video.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-zinc-500 mb-3">{video.channelTitle}</p>
                          <div className="flex items-center gap-2 text-xs text-[#3e6461] group-hover:text-[#4a7774] transition-colors">
                            <Play className="w-4 h-4" />
                            <span>Putar Video</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!currentAdvice && !isLoading && (
              <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-2xl p-12 text-center shadow-sm transition-colors duration-300">
                <div className="inline-flex p-4 bg-[#3e6461]/10 dark:bg-[#3e6461]/20 rounded-full mb-4">
                  <Dumbbell className="w-12 h-12 text-[#3e6461]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mulai Latihan Anda</h3>
                <p className="text-gray-600 dark:text-zinc-400 font-medium mb-6">
                  Tanyakan tentang teknik badminton, dan AI akan memberikan saran plus video tutorial!
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => handleTopicClick('Bagaimana cara meningkatkan smash saya?')}
                    className="px-4 py-2 bg-gray-200 dark:bg-zinc-800/60 hover:bg-gray-300 dark:hover:bg-zinc-800/80 text-gray-700 dark:text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    Contoh Pertanyaan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - History */}
          <div className="space-y-6">
            <div className="training-history bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-2xl p-6 shadow-sm transition-colors duration-300">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Riwayat Latihan</h2>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#3e6461]" />
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((session) => (
                    <div
                      key={session.id}
                      className="group flex items-start gap-2 p-3 bg-gray-100 dark:bg-zinc-800/40 hover:bg-gray-200 dark:hover:bg-zinc-800/60 rounded-lg border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all"
                    >
                      <button
                        onClick={() => loadHistorySession(session)}
                        className="flex-1 text-left"
                      >
                        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 line-clamp-2 mb-1">
                          {session.query}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                          {new Date(session.timestamp).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(session.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded transition-all"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-zinc-500 text-center py-4">
                  Belum ada riwayat latihan
                </p>
              )}
            </div>

            {/* Tips */}
            <div className="training-tips bg-teal-50 dark:bg-linear-to-br dark:from-[#3e6461]/20 dark:to-[#2d4a47]/20 border-2 border-teal-200 dark:border-[#3e6461]/30 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-[#3e6461]" />
                Tips Bertanya
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-zinc-300">
                <li className="flex gap-2">
                  <span className="text-[#3e6461] font-bold">•</span>
                  <span className="font-medium">Jelaskan masalah spesifik Anda</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#3e6461] font-bold">•</span>
                  <span className="font-medium">Sebutkan level skill Anda</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#3e6461] font-bold">•</span>
                  <span className="font-medium">Fokus pada satu topik per pertanyaan</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#3e6461] font-bold">•</span>
                  <span className="font-medium">Tonton video tutorial untuk hasil terbaik</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay
        steps={tutorialSteps}
        isActive={isTutorialActive}
        onClose={closeTutorial}
        tutorialKey="member-training"
      />

      {/* Video Modal */}
      {isVideoModalOpen && selectedVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => {
            setIsVideoModalOpen(false);
            setSelectedVideo(null);
          }}
        >
          <div 
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setIsVideoModalOpen(false);
                setSelectedVideo(null);
              }}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors z-10"
              title="Tutup"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Video Player */}
            <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Open in YouTube Link */}
            <div className="mt-3 flex justify-end">
              <a
                href={selectedVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka di YouTube</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
