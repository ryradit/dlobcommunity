'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, Mail, Phone, Camera, Save, Loader2, Edit3, X, Award, 
  Instagram, Lock, Eye, EyeOff, HelpCircle, AlertTriangle, 
  ShieldCheck, CheckCircle2, ChevronRight, Trophy, Sparkles, Activity,
  Maximize2
} from 'lucide-react';
import Image from 'next/image';
import TutorialOverlay from '@/components/TutorialOverlay';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { user, updateProfile, uploadAvatar, refreshUser, updatePassword } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Settings blocking state
  const [isSettingsBlocked, setIsSettingsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<'temp_credentials' | 'unverified_email' | null>(null);
  const [checkingBlockStatus, setCheckingBlockStatus] = useState(true);

  // Modal states
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showBadmintonModal, setShowBadmintonModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Personal Info Form States
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isResetEmailSending, setIsResetEmailSending] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  // Account Linking States
  const [hasGoogleLinked, setHasGoogleLinked] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [linkedIdentities, setLinkedIdentities] = useState<any[]>([]);

  // Tutorial for member settings
  const tutorialSteps = getTutorialSteps('member-settings');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('member-settings', tutorialSteps);

  // Fetch phone from profiles table
  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('phone').eq('id', user.id).single()
        .then(({ data }) => { if (data?.phone) setProfilePhone(data.phone); });
    }
  }, [user?.id]);

  // Update avatar URL when user data changes
  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      const urlWithTimestamp = user.user_metadata.avatar_url.includes('?') 
        ? user.user_metadata.avatar_url 
        : `${user.user_metadata.avatar_url}?t=${Date.now()}`;
      setAvatarUrl(urlWithTimestamp);
    } else {
      setAvatarUrl('');
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

  // Check linked identities
  useEffect(() => {
    const checkLinkedIdentities = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase.auth.getUserIdentities();
        
        if (error) {
          console.error('Error fetching identities:', error);
          return;
        }

        if (data?.identities) {
          setLinkedIdentities(data.identities);
          const googleLinked = data.identities.some(
            (identity: any) => identity.provider === 'google'
          );
          setHasGoogleLinked(googleLinked);
        }
      } catch (error) {
        console.error('Error checking linked identities:', error);
      }
    };

    checkLinkedIdentities();
  }, [user]);

  // Detect returning from OAuth account linking
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const url = new URL(window.location.href);
      const fromOAuth = url.searchParams.get('from_oauth');
      
      if (fromOAuth === 'true') {
        const checkAfterLink = async () => {
          const { data } = await supabase.auth.getUserIdentities();
          if (data?.identities) {
            const googleLinked = data.identities.some(
              (identity: any) => identity.provider === 'google'
            );
            
            if (googleLinked) {
              setHasGoogleLinked(true);
              setLinkedIdentities(data.identities);
              setMessage({ 
                type: 'success', 
                text: 'Akun Google berhasil dihubungkan! Anda sekarang bisa login cepat dengan Google.' 
              });
              setTimeout(() => setMessage(null), 5000);
            }
          }
          setIsLinkingGoogle(false);
        };
        
        checkAfterLink();
        url.searchParams.delete('from_oauth');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [user]);

  // Check if settings should be blocked
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!user) {
        setCheckingBlockStatus(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('using_temp_email, must_change_password, pending_email_verification')
          .eq('id', user.id)
          .single();

        if (error) {
          setCheckingBlockStatus(false);
          return;
        }

        if (profile?.using_temp_email || profile?.must_change_password) {
          setIsSettingsBlocked(true);
          setBlockReason('temp_credentials');
          setCheckingBlockStatus(false);
          return;
        }

        if (profile?.pending_email_verification === true) {
          setIsSettingsBlocked(true);
          setBlockReason('unverified_email');
          setCheckingBlockStatus(false);
          return;
        }

        setIsSettingsBlocked(false);
        setBlockReason(null);
        setCheckingBlockStatus(false);
      } catch (error) {
        setCheckingBlockStatus(false);
      }
    };

    checkBlockStatus();
    const interval = setInterval(checkBlockStatus, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'File harus berupa gambar (JPG, PNG)' });
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
      setMessage({ type: 'error', text: error?.message || 'Gagal mengupload foto profil' });
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
    setEditPhone(user?.user_metadata?.phone || profilePhone || '');
    setShowPersonalModal(true);
  };

  // Save Personal Info
  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsPersonalLoading(true);
      setMessage(null);

      const timeoutId = setTimeout(() => {
        setIsPersonalLoading(false);
        setShowPersonalModal(false);
        setMessage({ type: 'success', text: 'Informasi pribadi berhasil diperbarui!' });
        setTimeout(() => setMessage(null), 3000);
        refreshUser();
      }, 5000);

      await updateProfile({
        full_name: editFullName.trim(),
        phone: editPhone.trim() || undefined,
      });

      if (editPhone.trim()) {
        await supabase
          .from('profiles')
          .update({ phone: editPhone.trim() })
          .eq('id', user.id);
        setProfilePhone(editPhone.trim());
      }

      clearTimeout(timeoutId);
      setIsPersonalLoading(false);
      setShowPersonalModal(false);
      setMessage({ type: 'success', text: 'Informasi pribadi berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
      await refreshUser();
    } catch (error) {
      setIsPersonalLoading(false);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memperbarui data' });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Open Badminton Profile Modal
  const openBadmintonModal = () => {
    setEditPlayingLevel(user?.user_metadata?.playing_level || 'beginner');
    setEditDominantHand(user?.user_metadata?.dominant_hand || 'right');
    setEditYearsPlaying(user?.user_metadata?.years_playing?.toString() || '');
    setShowBadmintonModal(true);
  };

  // Save Badminton Profile
  const handleSaveBadmintonProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsBadmintonLoading(true);
      setMessage(null);

      await updateProfile({
        playing_level: editPlayingLevel,
        dominant_hand: editDominantHand,
        years_playing: editYearsPlaying ? parseInt(editYearsPlaying) : undefined,
      });

      await refreshUser();
      setIsBadmintonLoading(false);
      setShowBadmintonModal(false);
      setMessage({ type: 'success', text: 'Profil badminton berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setIsBadmintonLoading(false);
      setMessage({ type: 'error', text: 'Gagal memperbarui profil badminton' });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Open Achievements Modal
  const openAchievementsModal = () => {
    const achievementsData = user?.user_metadata?.achievements;
    if (Array.isArray(achievementsData)) {
      setEditAchievements([...achievementsData]);
    } else if (typeof achievementsData === 'string') {
      try {
        setEditAchievements(JSON.parse(achievementsData));
      } catch (e) {
        setEditAchievements([]);
      }
    } else {
      setEditAchievements([]);
    }
    setShowAchievementsModal(true);
  };

  // Save Achievements
  const handleSaveAchievements = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsAchievementsLoading(true);
      setMessage(null);

      const filteredAchievements = editAchievements.filter(
        a => a.tournament.trim() && a.place.trim()
      );

      await updateProfile({
        achievements: filteredAchievements,
      });

      await refreshUser();
      setIsAchievementsLoading(false);
      setShowAchievementsModal(false);
      setMessage({ type: 'success', text: 'Pencapaian turnamen berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setIsAchievementsLoading(false);
      setMessage({ type: 'error', text: 'Gagal menyimpan pencapaian' });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Open Partner Modal
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

      await updateProfile({
        partner_preferences: editPartnerPreferences.trim() || undefined,
        instagram_url: editInstagramUrl.trim() || undefined,
      });

      await refreshUser();
      setIsPartnerLoading(false);
      setShowPartnerModal(false);
      setMessage({ type: 'success', text: 'Preferensi partner berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setIsPartnerLoading(false);
      setMessage({ type: 'error', text: 'Gagal memperbarui preferensi partner' });
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
    return hand === 'right' ? 'Tangan Kanan' : 'Tangan Kiri';
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '', textColor: '' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: 'Lemah', color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400' };
    if (score <= 2) return { score: 2, label: 'Sedang', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' };
    return { score: 3, label: 'Kuat', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' };
  };

  // Handle Send Reset Email Link
  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    try {
      setIsResetEmailSending(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: `Link reset kata sandi berhasil dikirim ke ${user.email}. Silakan periksa inbox atau spam Anda.` });
      setTimeout(() => setMessage(null), 6000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Gagal mengirim email reset kata sandi' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsResetEmailSending(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security check: require current password if user has email/password login
    if (!isOAuthUser && !currentPassword) {
      setMessage({ type: 'error', text: 'Mohon masukkan kata sandi Anda saat ini untuk verifikasi keamanan' });
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Mohon isi semua kolom kata sandi' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Kata sandi baru minimal 6 karakter' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setIsPasswordLoading(true);
      setMessage(null);

      // Re-authenticate with current password to ensure legitimate account owner
      if (!isOAuthUser && user?.email) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (verifyError) {
          throw new Error('Kata sandi saat ini tidak cocok. Silakan coba lagi.');
        }
      }

      await updatePassword(newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      setMessage({ type: 'success', text: '✅ Kata sandi berhasil diverifikasi dan diperbarui!' });
      setTimeout(() => setMessage(null), 4000);
    } catch (error: any) {
      console.error('Update password error:', error);
      setMessage({ type: 'error', text: error?.message || 'Gagal memperbarui kata sandi' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Handle Link Google Account
  const handleLinkGoogle = async () => {
    try {
      setIsLinkingGoogle(true);
      setMessage(null);

      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings&from_oauth=true`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Link Google error:', error);
      setMessage({ 
        type: 'error', 
        text: error?.message || 'Gagal menghubungkan akun Google' 
      });
      setTimeout(() => setMessage(null), 5000);
      setIsLinkingGoogle(false);
    }
  };

  // Handle Unlink Google Account
  const handleUnlinkGoogle = async () => {
    if (!confirm('Putuskan hubungan akun Google? Anda masih bisa login menggunakan email & password.')) {
      return;
    }

    try {
      setMessage(null);
      const googleIdentity = linkedIdentities.find(
        (identity: any) => identity.provider === 'google'
      );

      if (!googleIdentity) {
        throw new Error('Identitas Google tidak ditemukan');
      }

      const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
      if (error) throw error;

      setHasGoogleLinked(false);
      setMessage({ 
        type: 'success', 
        text: 'Akun Google berhasil diputuskan.' 
      });
      setTimeout(() => setMessage(null), 5000);

      const { data } = await supabase.auth.getUserIdentities();
      if (data?.identities) {
        setLinkedIdentities(data.identities);
      }
    } catch (error: any) {
      console.error('Unlink Google error:', error);
      setMessage({ 
        type: 'error', 
        text: error?.message || 'Gagal memutuskan akun Google' 
      });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Parse user achievements
  const userAchievements: Array<{ year: string; tournament: string; place: string }> = (() => {
    const raw = user?.user_metadata?.achievements;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return []; }
    }
    return [];
  })();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 py-6 lg:py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <ProfileCompletionWarning />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Pengaturan Profil
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Kelola identitas, preferensi bermain, dan keamanan akun member Anda
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTutorial}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 shadow-2xs transition-all"
              title="Tampilkan panduan fitur"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#4382C8]" />
              <span>Panduan Fitur</span>
            </button>
          </div>
        </div>

        {/* Global Toast / Alert */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center justify-between gap-3 transition-all ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hero Identity Card (Claude Design style: clean hero with subtle stats) */}
        <div className="member-settings-avatar bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs transition-all">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Avatar with Camera Trigger */}
            <div className="relative group shrink-0">
              <div 
                onClick={() => {
                  if (avatarUrl) {
                    setZoomImage({ 
                      url: avatarUrl, 
                      title: `Foto Profil ${user?.user_metadata?.full_name || 'Member'}` 
                    });
                  }
                }}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 shadow-xs flex items-center justify-center relative ${
                  avatarUrl ? 'cursor-zoom-in group/avatar' : ''
                }`}
                title={avatarUrl ? 'Klik untuk memperbesar foto' : undefined}
              >
                {avatarUrl ? (
                  <>
                    <Image
                      key={avatarUrl}
                      src={avatarUrl}
                      alt="Foto Profil"
                      width={112}
                      height={112}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                    </div>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                    {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
                  </span>
                )}
              </div>

              <button
                onClick={() => !isSettingsBlocked && fileInputRef.current?.click()}
                disabled={isUploading || isSettingsBlocked}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white dark:border-zinc-900"
                title={isSettingsBlocked ? 'Lengkapi profil terlebih dahulu' : 'Ganti foto profil'}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
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

            {/* User Meta Information */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {user?.user_metadata?.full_name || 'Member DLOB'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4382C8]" />
                  Member Komunitas
                </span>
              </div>

              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {user?.email}
              </p>

              {/* Quick Badminton Tags */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4382C8]" />
                  {getPlayingLevelLabel(user?.user_metadata?.playing_level || 'beginner')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                  {getDominantHandLabel(user?.user_metadata?.dominant_hand || 'right')}
                </span>
                {user?.user_metadata?.years_playing && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                    {user.user_metadata.years_playing} Tahun Pengalaman
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT COLUMN: Personal Info & Badminton Profile */}
          <div className="space-y-6">

            {/* Personal Information Card */}
            <div className="member-settings-personal bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs transition-all">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                    <User className="w-4 h-4 text-[#4382C8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Informasi Pribadi
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Data kontak dan identitas diri
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => !isSettingsBlocked && openPersonalModal()}
                  disabled={isSettingsBlocked}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800/40">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nama Lengkap</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 sm:mt-0">
                    {user?.user_metadata?.full_name || 'Belum diisi'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800/40">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Alamat Email</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 sm:mt-0">
                    {user?.email || '-'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nomor Telepon / WA</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 sm:mt-0">
                    {user?.user_metadata?.phone || profilePhone || 'Belum diisi'}
                  </span>
                </div>
              </div>
            </div>

            {/* Badminton Profile Card */}
            <div className="member-settings-badminton bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs transition-all">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                    <Activity className="w-4 h-4 text-[#4382C8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Profil Badminton
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Parameter matchmaking & skill
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => !isSettingsBlocked && openBadmintonModal()}
                  disabled={isSettingsBlocked}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800/40">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Level Bermain</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 sm:mt-0">
                    {getPlayingLevelLabel(user?.user_metadata?.playing_level || 'beginner')}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-zinc-50 dark:border-zinc-800/40">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tangan Dominan</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 sm:mt-0">
                    {getDominantHandLabel(user?.user_metadata?.dominant_hand || 'right')}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Lama Bermain</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 sm:mt-0">
                    {user?.user_metadata?.years_playing ? `${user.user_metadata.years_playing} Tahun` : 'Belum diisi'}
                  </span>
                </div>
              </div>
            </div>

            {/* Partner Preferences & Social Card */}
            <div className="member-settings-partner bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs transition-all">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                    <Instagram className="w-4 h-4 text-[#4382C8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Preferensi Partner & Sosial
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Gaya bermain & koneksi Instagram
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => !isSettingsBlocked && openPartnerModal()}
                  disabled={isSettingsBlocked}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
              </div>

              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                    Gaya Bermain / Preferensi Partner
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    {user?.user_metadata?.partner_preferences || 'Belum menulis preferensi partner.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Instagram</span>
                  {user?.user_metadata?.instagram_url ? (
                    <a
                      href={user.user_metadata.instagram_url.startsWith('http') ? user.user_metadata.instagram_url : `https://${user.user_metadata.instagram_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#4382C8] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Lihat Profil</span>
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Belum ditautkan</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Achievements & Security / Login Methods */}
          <div className="space-y-6">

            {/* Tournament Achievements Card */}
            <div className="member-settings-achievements bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs transition-all">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                    <Trophy className="w-4 h-4 text-[#4382C8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Pencapaian Turnamen
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Riwayat podium & gelar juara
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => !isSettingsBlocked && openAchievementsModal()}
                  disabled={isSettingsBlocked}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Kelola</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {userAchievements.length > 0 ? (
                  userAchievements.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <Award className="w-4 h-4 text-[#4382C8] shrink-0" />
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {item.tournament}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Tahun {item.year}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {item.place}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                      Belum ada pencapaian yang dicatat
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Login Methods & Security Card */}
            <div className="member-settings-security bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-6 transition-all">
              <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                    <ShieldCheck className="w-4 h-4 text-[#4382C8]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Metode Login & Keamanan
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Koneksi akun Google dan kata sandi
                    </p>
                  </div>
                </div>
              </div>

              {/* Linked Auth Methods */}
              <div className="space-y-3">
                {/* Email / Password Status */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/60 dark:border-zinc-700">
                      <Mail className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Email & Password</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{user?.email}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                    Aktif
                  </span>
                </div>

                {/* Google OAuth Status */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/60 dark:border-zinc-700">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                        <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                        <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1818182,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                        <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Google OAuth</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {hasGoogleLinked ? 'Akun terhubung' : 'Belum terhubung'}
                      </p>
                    </div>
                  </div>

                  {hasGoogleLinked ? (
                    <button
                      onClick={handleUnlinkGoogle}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      Putuskan
                    </button>
                  ) : (
                    <button
                      onClick={handleLinkGoogle}
                      disabled={isLinkingGoogle}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isLinkingGoogle ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menghubungkan...</span>
                        </>
                      ) : (
                        <span>Hubungkan</span>
                      )}
                    </button>
                  )}
                </div>

                {/* Password Item */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/60 dark:border-zinc-700">
                      <Lock className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Kata Sandi Akun</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {isOAuthUser ? 'Login Google aktif • Sandi opsional' : 'Tersimpan & terenkripsi'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNewPassword('');
                      setConfirmPassword('');
                      setShowPasswordModal(true);
                    }}
                    disabled={isSettingsBlocked}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40"
                  >
                    Ubah Sandi
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* MODALS (Claude Design style: clean, soft backdrop blur, refined form controls) */}

      {/* 1. Personal Info Modal */}
      {showPersonalModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Ubah Informasi Pribadi
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Pastikan nomor telepon terhubung ke WhatsApp
                </p>
              </div>
              <button
                onClick={() => setShowPersonalModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePersonalInfo} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  placeholder="Nama lengkap Anda"
                  className="w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/10 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/10 transition-all"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPersonalModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPersonalLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isPersonalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Badminton Profile Modal */}
      {showBadmintonModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Ubah Profil Badminton
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Digunakan untuk perhitungan tim dan matchmaking
                </p>
              </div>
              <button
                onClick={() => setShowBadmintonModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBadmintonProfile} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Level Bermain
                </label>
                <select
                  value={editPlayingLevel}
                  onChange={(e) => setEditPlayingLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/10 transition-all"
                >
                  <option value="beginner">Pemula (Beginner)</option>
                  <option value="intermediate">Menengah (Intermediate)</option>
                  <option value="advanced">Mahir (Advanced)</option>
                  <option value="professional">Profesional</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Tangan Dominan
                </label>
                <select
                  value={editDominantHand}
                  onChange={(e) => setEditDominantHand(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/10 transition-all"
                >
                  <option value="right">Kanan</option>
                  <option value="left">Kiri (Kidal)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Pengalaman Bermain (Tahun)
                </label>
                <input
                  type="number"
                  value={editYearsPlaying}
                  onChange={(e) => setEditYearsPlaying(e.target.value)}
                  min="0"
                  placeholder="Contoh: 3"
                  className="w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/10 transition-all"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBadmintonModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isBadmintonLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isBadmintonLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Achievements Modal */}
      {showAchievementsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Kelola Pencapaian Turnamen
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tambahkan riwayat prestasi dan gelar juara Anda
                </p>
              </div>
              <button
                onClick={() => setShowAchievementsModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAchievements} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Daftar Prestasi
                </span>
                <button
                  type="button"
                  onClick={() => setEditAchievements([...editAchievements, { year: new Date().getFullYear().toString(), tournament: '', place: '' }])}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  + Tambah Baris
                </button>
              </div>

              <div className="space-y-3">
                {editAchievements.length === 0 ? (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    Belum ada data. Klik "+ Tambah Baris" untuk menambahkan prestasi.
                  </p>
                ) : (
                  editAchievements.map((item, index) => (
                    <div
                      key={index}
                      className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 rounded-xl space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-1">Tahun</label>
                          <input
                            type="number"
                            value={item.year}
                            onChange={(e) => {
                              const arr = [...editAchievements];
                              arr[index].year = e.target.value;
                              setEditAchievements(arr);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4382C8]"
                            placeholder="2025"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-1">Nama Turnamen</label>
                          <input
                            type="text"
                            value={item.tournament}
                            onChange={(e) => {
                              const arr = [...editAchievements];
                              arr[index].tournament = e.target.value;
                              setEditAchievements(arr);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4382C8]"
                            placeholder="Contoh: DLOB Cup Season 3"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-1">Peringkat / Juara</label>
                          <input
                            type="text"
                            value={item.place}
                            onChange={(e) => {
                              const arr = [...editAchievements];
                              arr[index].place = e.target.value;
                              setEditAchievements(arr);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4382C8]"
                            placeholder="Contoh: Juara 1"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setEditAchievements(editAchievements.filter((_, i) => i !== index))}
                          className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAchievementsModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAchievementsLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isAchievementsLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Pencapaian</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Partner Preferences Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Ubah Preferensi & Sosial
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Gaya bermain partner dan tautan profil sosial
                </p>
              </div>
              <button
                onClick={() => setShowPartnerModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePartnerPreferences} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Preferensi Partner Bermain
                </label>
                <textarea
                  value={editPartnerPreferences}
                  onChange={(e) => setEditPartnerPreferences(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Suka bermain ganda dengan partner yang aktif smash dari belakang..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/10 transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Link / Username Instagram
                </label>
                <input
                  type="text"
                  value={editInstagramUrl}
                  onChange={(e) => setEditInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/username atau @username"
                  className="w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/10 transition-all"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPartnerLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isPartnerLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Change Password Modal (Claude Design style: strength meter & realtime matching) */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Ubah Kata Sandi
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Amankan akun Anda dengan kata sandi yang kuat
                </p>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {/* Current Password (Required for non-pure-OAuth accounts) */}
              {!isOAuthUser ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Kata Sandi Saat Ini
                    </label>
                    <button
                      type="button"
                      onClick={handleSendResetEmail}
                      disabled={isResetEmailSending}
                      className="text-[11px] font-medium text-[#4382C8] hover:underline disabled:opacity-50"
                    >
                      {isResetEmailSending ? 'Mengirim...' : 'Lupa kata sandi?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama Anda"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#4382C8]" />
                  <span>
                    Akun Anda terhubung dengan Google. Anda dapat langsung menentukan kata sandi baru untuk login mandiri dengan email & password.
                  </span>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (() => {
                  const strength = getPasswordStrength(newPassword);
                  return (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Kekuatan Kata Sandi:</span>
                        <span className={`font-semibold ${strength.textColor}`}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 h-1.5">
                        <div className={`rounded-full ${strength.score >= 1 ? strength.color : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                        <div className={`rounded-full ${strength.score >= 2 ? strength.color : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                        <div className={`rounded-full ${strength.score >= 3 ? strength.color : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className={`w-full pl-10 pr-10 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/50 border rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none transition-all ${
                      confirmPassword.length > 0 && newPassword === confirmPassword
                        ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                        : confirmPassword.length > 0 && newPassword !== confirmPassword
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/10'
                        : 'border-zinc-200 dark:border-zinc-700/80 focus:border-[#4382C8] focus:ring-2 focus:ring-[#4382C8]/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Realtime Match Indicator */}
                {confirmPassword.length > 0 && (
                  <div className="mt-1.5 text-[11px]">
                    {newPassword === confirmPassword ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Kata sandi cocok
                      </span>
                    ) : (
                      <span className="text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> Kata sandi belum cocok
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Forgot password link */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Lupa kata sandi lama?</span>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={isResetEmailSending}
                  className="font-semibold text-[#4382C8] hover:underline disabled:opacity-50"
                >
                  {isResetEmailSending ? 'Mengirim email...' : 'Kirim link reset ke email'}
                </button>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPasswordLoading || (!isOAuthUser && !currentPassword) || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isPasswordLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memperbarui...</span>
                    </>
                  ) : (
                    <span>Perbarui Kata Sandi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setZoomImage(null)}
        >
          <div 
            className="relative max-w-lg w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {zoomImage.title}
              </span>
              <button
                onClick={() => setZoomImage(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-100 dark:border-zinc-800">
              <Image
                src={zoomImage.url}
                alt={zoomImage.title}
                width={600}
                height={600}
                className="max-h-[65vh] w-auto h-auto object-contain rounded-lg shadow-sm"
                unoptimized
              />
            </div>

            <div className="w-full pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay
        steps={tutorialSteps}
        isActive={isTutorialActive}
        onClose={closeTutorial}
        tutorialKey="member-settings"
      />
    </div>
  );
}
