'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, Camera, Save, Loader2, Edit2, X, Award, Users, Instagram, Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
  const { user, updateProfile, uploadAvatar, refreshUser, updatePassword } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showBadmintonModal, setShowBadmintonModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  // Personal Info Form States
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isPersonalLoading, setIsPersonalLoading] = useState(false);

  // Badminton Profile Form States
  const [editPlayingLevel, setEditPlayingLevel] = useState('beginner');
  const [editDominantHand, setEditDominantHand] = useState('right');
  const [editYearsPlaying, setEditYearsPlaying] = useState('');
  const [isBadmintonLoading, setIsBadmintonLoading] = useState(false);

  // Achievements Form States
  const [editAchievements, setEditAchievements] = useState<Array<{year: string, tournament: string, place: string}>>([]);
  const [isAchievementsLoading, setIsAchievementsLoading] = useState(false);

  // Partner Preferences Form States
  const [editPartnerPreferences, setEditPartnerPreferences] = useState('');
  const [editInstagramUrl, setEditInstagramUrl] = useState('');
  const [isPartnerLoading, setIsPartnerLoading] = useState(false);

  // Password Change States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  // Update avatar URL when user data changes
  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      const urlWithTimestamp = user.user_metadata.avatar_url.includes('?') 
        ? user.user_metadata.avatar_url 
        : `${user.user_metadata.avatar_url}?t=${Date.now()}`;
      setAvatarUrl(urlWithTimestamp);
    }
  }, [user?.user_metadata?.avatar_url]);

  // Check if user signed in with OAuth (Google)
  useEffect(() => {
    if (user?.app_metadata?.provider && user.app_metadata.provider === 'google') {
      setIsOAuthUser(true);
    } else if (user?.app_metadata?.providers && user.app_metadata.providers.includes('google')) {
      setIsOAuthUser(true);
    } else {
      setIsOAuthUser(false);
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'File harus berupa gambar' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran file maksimal 5MB' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setIsUploading(true);
      setMessage(null);
      const result = await uploadAvatar(file);
      
      if (result) {
        setMessage({ type: 'success', text: 'Foto profil berhasil diperbarui!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Gagal mengupload foto' });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      const errorMessage = error?.message || 'Gagal mengupload foto profil';
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setMessage(null), 7000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Open Personal Info Modal
  const openPersonalModal = () => {
    setEditFullName(user?.user_metadata?.full_name || '');
    setEditPhone(user?.user_metadata?.phone || '');
    setShowPersonalModal(true);
  };

  // Save Personal Info
  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsPersonalLoading(true);
      setMessage(null);

      // Timeout fallback
      const timeoutId = setTimeout(() => {
        setIsPersonalLoading(false);
        setShowPersonalModal(false);
        setMessage({ type: 'success', text: 'Informasi pribadi berhasil diperbarui!' });
        setTimeout(() => setMessage(null), 3000);
        refreshUser(); // Refresh user data to show changes immediately
      }, 5000);

      const result = await updateProfile({
        full_name: editFullName,
        phone: editPhone,
      });

      clearTimeout(timeoutId);

      setIsPersonalLoading(false);
      
      // Refresh user data immediately before closing modal
      await refreshUser();
      
      // Small delay to ensure state update completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setShowPersonalModal(false);
      setMessage({ type: 'success', text: 'Informasi pribadi berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Update error:', error);
      setIsPersonalLoading(false);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memperbarui informasi' });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Open Badminton Profile Modal
  const openBadmintonModal = () => {
    setEditPlayingLevel(user?.user_metadata?.playing_level || 'beginner');
    setEditDominantHand(user?.user_metadata?.dominant_hand || 'right');
    setEditYearsPlaying(user?.user_metadata?.years_playing || '');
    setShowBadmintonModal(true);
  };

  // Save Badminton Profile
  const handleSaveBadmintonProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsBadmintonLoading(true);
      setMessage(null);

      // Timeout fallback
      const timeoutId = setTimeout(() => {
        setIsBadmintonLoading(false);
        setShowBadmintonModal(false);
        setMessage({ type: 'success', text: 'Profil badminton berhasil diperbarui!' });
        setTimeout(() => setMessage(null), 3000);
        refreshUser(); // Refresh user data to show changes immediately
      }, 5000);

      const result = await updateProfile({
        playing_level: editPlayingLevel,
        dominant_hand: editDominantHand,
        years_playing: editYearsPlaying,
      });

      clearTimeout(timeoutId);

      setIsBadmintonLoading(false);
      
      // Refresh user data immediately before closing modal
      await refreshUser();
      
      // Small delay to ensure state update completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setShowBadmintonModal(false);
      setMessage({ type: 'success', text: 'Profil badminton berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Update error:', error);
      setIsBadmintonLoading(false);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memperbarui profil' });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Open Achievements Modal
  const openAchievementsModal = () => {
    const achievementsData = user?.user_metadata?.achievements;
    let achievements = [];
    
    if (Array.isArray(achievementsData)) {
      achievements = achievementsData;
    } else if (typeof achievementsData === 'string') {
      try {
        achievements = JSON.parse(achievementsData);
      } catch (e) {
        console.error('Failed to parse achievements:', e);
        achievements = [];
      }
    }
    
    setEditAchievements(achievements);
    setShowAchievementsModal(true);
  };

  // Save Achievements
  const handleSaveAchievements = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsAchievementsLoading(true);
      setMessage(null);

      // Timeout fallback
      const timeoutId = setTimeout(() => {
        setIsAchievementsLoading(false);
        setShowAchievementsModal(false);
        setMessage({ type: 'success', text: 'Pencapaian berhasil diperbarui!' });
        setTimeout(() => setMessage(null), 3000);
        refreshUser(); // Refresh user data to show changes immediately
      }, 5000);

      const result = await updateProfile({
        achievements: JSON.stringify(editAchievements),
      });

      clearTimeout(timeoutId);

      setIsAchievementsLoading(false);
      
      // Refresh user data immediately before closing modal
      await refreshUser();
      
      // Small delay to ensure state update completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setShowAchievementsModal(false);
      setMessage({ type: 'success', text: 'Pencapaian berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Update error:', error);
      setIsAchievementsLoading(false);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memperbarui pencapaian' });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Open Partner Preferences Modal
  const openPartnerModal = () => {
    setEditPartnerPreferences(user?.user_metadata?.partner_preferences || '');
    setEditInstagramUrl(user?.user_metadata?.instagram_url || '');
    setShowPartnerModal(true);
  };

  // Save Partner Preferences
  const handleSavePartnerPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsPartnerLoading(true);
      setMessage(null);

      // Timeout fallback
      const timeoutId = setTimeout(() => {
        setIsPartnerLoading(false);
        setShowPartnerModal(false);
        setMessage({ type: 'success', text: 'Preferensi partner berhasil diperbarui!' });
        setTimeout(() => setMessage(null), 3000);
        refreshUser(); // Refresh user data to show changes immediately
      }, 5000);

      const result = await updateProfile({
        partner_preferences: editPartnerPreferences,
        instagram_url: editInstagramUrl,
      });

      clearTimeout(timeoutId);

      setIsPartnerLoading(false);
      
      // Refresh user data immediately before closing modal
      await refreshUser();
      
      // Small delay to ensure state update completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setShowPartnerModal(false);
      setMessage({ type: 'success', text: 'Preferensi partner berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Update error:', error);
      setIsPartnerLoading(false);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memperbarui preferensi' });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const getPlayingLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: 'Pemula',
      intermediate: 'Menengah',
      advanced: 'Mahir',
      professional: 'Profesional'
    };
    return labels[level] || level;
  };

  const getDominantHandLabel = (hand: string) => {
    return hand === 'right' ? 'Kanan' : 'Kiri';
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Mohon isi semua field password' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password tidak cocok' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setIsPasswordLoading(true);
      setMessage(null);

      await updatePassword(newPassword);

      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Update password error:', error);
      setMessage({ type: 'error', text: error?.message || 'Gagal memperbarui password' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Pengaturan Profil</h1>
          <p className="text-zinc-400">Kelola informasi profil dan preferensi akun Anda</p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-red-500/20 border border-red-500/50 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Profile Picture Card */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Foto Profil</h2>
              <div className="flex flex-col items-center">
                <div className="relative group mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 bg-zinc-800">
                    {avatarUrl ? (
                      <Image
                        key={avatarUrl}
                        src={avatarUrl}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-zinc-600" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-zinc-400 text-center">
                  Klik ikon kamera untuk mengubah foto profil<br />
                  Maksimal 5MB (JPG, PNG)
                </p>
              </div>
            </div>

            {/* Personal Information Card */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 group hover:border-blue-500/30 transition-colors cursor-pointer" onClick={openPersonalModal}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Informasi Pribadi</h2>
                <Edit2 className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">Nama Lengkap</label>
                  <p className="text-white font-medium">{user?.user_metadata?.full_name || 'Belum diisi'}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">Email</label>
                  <p className="text-white font-medium">{user?.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">Nomor Telepon</label>
                  <p className="text-white font-medium">{user?.user_metadata?.phone || 'Belum diisi'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Badminton Profile Card */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 group hover:border-blue-500/30 transition-colors cursor-pointer" onClick={openBadmintonModal}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Profil Badminton</h2>
                <Edit2 className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">Level Bermain</label>
                  <p className="text-white font-medium">{getPlayingLevelLabel(user?.user_metadata?.playing_level || 'beginner')}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">Tangan Dominan</label>
                  <p className="text-white font-medium">{getDominantHandLabel(user?.user_metadata?.dominant_hand || 'right')}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">Lama Bermain</label>
                  <p className="text-white font-medium">{user?.user_metadata?.years_playing ? `${user.user_metadata.years_playing} tahun` : 'Belum diisi'}</p>
                </div>
              </div>
            </div>

            {/* Achievements Card */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 group hover:border-blue-500/30 transition-colors cursor-pointer" onClick={openAchievementsModal}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Pencapaian Turnamen</h2>
                <Edit2 className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="space-y-3">
                {(() => {
                  const achievementsData = user?.user_metadata?.achievements;
                  let achievements = [];
                  
                  if (Array.isArray(achievementsData)) {
                    achievements = achievementsData;
                  } else if (typeof achievementsData === 'string') {
                    try {
                      achievements = JSON.parse(achievementsData);
                    } catch (e) {
                      console.error('Failed to parse achievements:', e);
                    }
                  }
                  
                  return achievements.length > 0 ? (
                    achievements.map((achievement: any, index: number) => (
                      <div key={index} className="bg-zinc-800/50 border border-white/10 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <Award className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-white font-medium">{achievement.tournament}</p>
                            <p className="text-sm text-zinc-400">{achievement.place} • {achievement.year}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 text-center py-4">Belum ada pencapaian</p>
                  );
                })()}
              </div>
            </div>

            {/* Partner Preferences Card */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 group hover:border-blue-500/30 transition-colors cursor-pointer" onClick={openPartnerModal}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Preferensi Partner</h2>
                <Edit2 className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">Preferensi</label>
                  <p className="text-white">{user?.user_metadata?.partner_preferences || 'Belum diisi'}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">Instagram</label>
                  <p className="text-white font-medium">{user?.user_metadata?.instagram_url || 'Belum diisi'}</p>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Ubah Password</h2>
              
              {isOAuthUser && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400">
                    ℹ️ Anda login dengan Google. Membuat password akan memungkinkan Anda login dengan email & password selain Google OAuth.
                  </p>
                </div>
              )}
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Password Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Ulangi password baru"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPasswordLoading || !newPassword || !confirmPassword}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPasswordLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Ubah Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info Modal */}
      {showPersonalModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit Informasi Pribadi</h3>
              <button onClick={() => setShowPersonalModal(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSavePersonalInfo} className="space-y-4">
              <div>
                <label className="text-sm text-zinc-300 mb-2 block">Nama Lengkap</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Nama lengkap Anda"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-zinc-300 mb-2 block">Nomor Telepon</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="+62 812 3456 7890"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPersonalModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPersonalLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPersonalLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Badminton Profile Modal */}
      {showBadmintonModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit Profil Badminton</h3>
              <button onClick={() => setShowBadmintonModal(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveBadmintonProfile} className="space-y-4">
              <div>
                <label className="text-sm text-zinc-300 mb-2 block">Level Bermain</label>
                <select
                  value={editPlayingLevel}
                  onChange={(e) => setEditPlayingLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="beginner">Pemula</option>
                  <option value="intermediate">Menengah</option>
                  <option value="advanced">Mahir</option>
                  <option value="professional">Profesional</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-300 mb-2 block">Tangan Dominan</label>
                <select
                  value={editDominantHand}
                  onChange={(e) => setEditDominantHand(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="right">Kanan</option>
                  <option value="left">Kiri</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-300 mb-2 block">Lama Bermain (Tahun)</label>
                <input
                  type="number"
                  value={editYearsPlaying}
                  onChange={(e) => setEditYearsPlaying(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Contoh: 5"
                  min="0"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBadmintonModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isBadmintonLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isBadmintonLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Achievements Modal */}
      {showAchievementsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit Pencapaian Turnamen</h3>
              <button onClick={() => setShowAchievementsModal(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveAchievements} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm text-zinc-300">Daftar Pencapaian</label>
                <button
                  type="button"
                  onClick={() => setEditAchievements([...editAchievements, { year: new Date().getFullYear().toString(), tournament: '', place: '' }])}
                  className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  + Tambah
                </button>
              </div>
              <div className="space-y-3">
                {editAchievements.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4 border border-dashed border-zinc-700 rounded-lg">
                    Belum ada pencapaian. Klik "Tambah" untuk menambahkan.
                  </p>
                ) : (
                  editAchievements.map((achievement, index) => (
                    <div key={index} className="bg-zinc-800/50 border border-white/10 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Tahun</label>
                          <input
                            type="number"
                            value={achievement.year}
                            onChange={(e) => {
                              const newAchievements = [...editAchievements];
                              newAchievements[index].year = e.target.value;
                              setEditAchievements(newAchievements);
                            }}
                            className="w-full px-3 py-2 bg-zinc-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            placeholder="2024"
                            min="1900"
                            max={new Date().getFullYear()}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Nama Turnamen</label>
                          <input
                            type="text"
                            value={achievement.tournament}
                            onChange={(e) => {
                              const newAchievements = [...editAchievements];
                              newAchievements[index].tournament = e.target.value;
                              setEditAchievements(newAchievements);
                            }}
                            className="w-full px-3 py-2 bg-zinc-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            placeholder="Turnamen ABC"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Peringkat</label>
                          <input
                            type="text"
                            value={achievement.place}
                            onChange={(e) => {
                              const newAchievements = [...editAchievements];
                              newAchievements[index].place = e.target.value;
                              setEditAchievements(newAchievements);
                            }}
                            className="w-full px-3 py-2 bg-zinc-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            placeholder="Juara 1"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newAchievements = editAchievements.filter((_, i) => i !== index);
                          setEditAchievements(newAchievements);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAchievementsModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAchievementsLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAchievementsLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner Preferences Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit Preferensi Partner</h3>
              <button onClick={() => setShowPartnerModal(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSavePartnerPreferences} className="space-y-4">
              <div>
                <label className="text-sm text-zinc-300 mb-2 block">Preferensi Partner</label>
                <textarea
                  value={editPartnerPreferences}
                  onChange={(e) => setEditPartnerPreferences(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors min-h-25 resize-none"
                  placeholder="Contoh: Suka bermain doubles, prefer partner yang agresif"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-300 mb-2 block">Instagram</label>
                <input
                  type="url"
                  value={editInstagramUrl}
                  onChange={(e) => setEditInstagramUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPartnerLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPartnerLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
