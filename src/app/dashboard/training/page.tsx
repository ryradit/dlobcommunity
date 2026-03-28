'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Dumbbell, AlertCircle, Search, Play, Users, Zap } from 'lucide-react';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';

interface TrainingTopic {
  id: string;
  icon: string;
  label: string;
  query: string;
}

export default function TrainingCenterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrainingSoon, setShowTrainingSoon] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const trainingTopics: TrainingTopic[] = [
    { id: 'smash', icon: '💥', label: 'Smash', query: 'Bagaimana cara meningkatkan kekuatan smash saya?' },
    { id: 'backhand', icon: '🎾', label: 'Backhand', query: 'Teknik backhand yang benar untuk pemula' },
    { id: 'footwork', icon: '🏃', label: 'Footwork', query: 'Cara meningkatkan footwork dan kecepatan bergerak' },
    { id: 'stamina', icon: '⚡', label: 'Stamina', query: 'Latihan untuk meningkatkan stamina badminton' },
    { id: 'netplay', icon: '🕸️', label: 'Net Play', query: 'Teknik net play yang efektif' },
    { id: 'defense', icon: '🛡️', label: 'Defense', query: 'Cara meningkatkan defense dan positioning' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-flex p-4 bg-blue-500/10 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading...</h1>
          <p className="text-gray-600 dark:text-gray-400">Tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900 text-gray-900 dark:text-white p-6 transition-colors duration-300">
      <ProfileCompletionWarning />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Training Center</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mt-1">
                Tingkatkan kemampuan badminton dengan video tutorial dan latihan berkualitas
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari topik latihan... contoh: 'Cara meningkatkan smash yang powerful'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Popular Topics */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Topik Populer</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {trainingTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setShowTrainingSoon(true)}
                className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all text-center group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{topic.icon}</div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{topic.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Play className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Video Tutorial</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Koleksi video tutorial badminton dari YouTube dengan subtitle Indonesia
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Dipandu AI</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Dapatkan rekomendasi personal dari AI Dlob Coach berdasarkan kebutuhan Anda
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Cepat & Efisien</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Latihan intensif yang dirancang untuk hasil maksimal dalam waktu singkat
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        {showTrainingSoon && (
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-amber-900 dark:text-amber-200">
              ✨ Fitur Coaching AI sedang dalam pengembangan. Akan segera hadir dalam Training Center!
            </p>
          </div>
        )}

        {/* Placeholder Content */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
          <div className="inline-flex p-4 bg-gray-100 dark:bg-zinc-800 rounded-full mb-4">
            <Dumbbell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Konten Latihan Lengkap</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Video tutorial, rencana latihan, dan tips dari para ahli sedang dalam pengembangan.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium cursor-not-allowed opacity-60">
            <span>🔜 Coming Soon - Coaching AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
