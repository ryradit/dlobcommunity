'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, Camera, Save, Loader2, Edit2, X, Award, Users, Instagram, Lock, Eye, EyeOff, HelpCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import TutorialOverlay from '@/components/TutorialOverlay';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, updateProfile, uploadAvatar, refreshUser, updatePassword } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
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

  // Personal Info Form States
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profilePhone, setProfilePhone] = useState(''); // from profiles table
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

  // Account Linking States
  const [hasGoogleLinked, setHasGoogleLinked] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [linkedIdentities, setLinkedIdentities] = useState<any[]>([]);

  // Tutorial for member settings
  const tutorialSteps = getTutorialSteps('member-settings');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('member-settings', tutorialSteps);

  // Update avatar URL when user data changes
  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('phone').eq('id', user.id).single()
        .then(({ data }) => { if (data?.phone) setProfilePhone(data.phone); });
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      const urlWithTimestamp = user.user_metadata.avatar_url.includes('?') 
        ? user.user_metadata.avatar_url 
        : `${user.user_metadata.avatar_url}?t=${Date.now()}`;
      setAvatarUrl(urlWithTimestamp);
    } else {
      setAvatarUrl(''); // Clear avatar if none exists
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
          
          // Check if Google is linked
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
    // Check URL for indication of successful account linking
    if (typeof window !== 'undefined' && user) {
      const url = new URL(window.location.href);
      const fromOAuth = url.searchParams.get('from_oauth');
      
      if (fromOAuth === 'true') {
        // Refresh identities and show success message
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
                text: '✅ Akun Google berhasil dihubungkan! Anda sekarang bisa login dengan Google.' 
              });
              setTimeout(() => setMessage(null), 5000);
            }
          }
          setIsLinkingGoogle(false);
        };
        
        checkAfterLink();
        
        // Clean up URL
        url.searchParams.delete('from_oauth');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [user]); // Run when user is available

  // Check if settings should be blocked
  useEffect(() => {
    const checkBlockStatus = async () => {
      console.log('[Settings] ==> CHECKING BLOCK STATUS');
      if (!user) {
        console.log('[Settings] No user');
        setCheckingBlockStatus(false);
        return;
      }

      console.log('[Settings] User ID:', user.id);

      try {
        // Check profile flags
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('using_temp_email, must_change_password, pending_email_verification')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('[Settings] ❌ Error fetching profile:', error);
          setCheckingBlockStatus(false);
          return;
        }

        console.log('[Settings] Profile data:', profile);
        console.log('[Settings] using_temp_email:', profile?.using_temp_email);
        console.log('[Settings] must_change_password:', profile?.must_change_password);
        console.log('[Settings] pending_email_verification:', profile?.pending_email_verification);

        // Check if using temp credentials
        if (profile?.using_temp_email || profile?.must_change_password) {
          console.log('[Settings] 🔒 BLOCKING SETTINGS - temp credentials');
          setIsSettingsBlocked(true);
          setBlockReason('temp_credentials');
          setCheckingBlockStatus(false);
          return;
        }

        // Check if email verification is pending (use DB flag — more reliable than session JWT)
        if (profile?.pending_email_verification === true) {
          console.log('[Settings] 🔒 BLOCKING SETTINGS - unverified email');
          setIsSettingsBlocked(true);
          setBlockReason('unverified_email');
          setCheckingBlockStatus(false);
          return;
        }

        // All checks passed
        console.log('[Settings] ✅ SETTINGS UNLOCKED');
        setIsSettingsBlocked(false);
        setBlockReason(null);
        setCheckingBlockStatus(false);
      } catch (error) {
        console.error('Error checking block status:', error);
        setCheckingBlockStatus(false);
      }
    };

    checkBlockStatus();
    
    // Re-check every 30 seconds to detect verification
    const interval = setInterval(checkBlockStatus, 30000);
    return () => clearInterval(interval);
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
      setProfilePhone(editPhone); // update display immediately
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

  // Handle Link Google Account
  const handleLinkGoogle = async () => {
    try {
      setIsLinkingGoogle(true);
      setMessage(null);

      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
        },
      });

      if (error) {
        throw error;
      }

      // The user will be redirected to Google OAuth
      // After successful link, they'll be redirected back to settings page
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
    if (!confirm('Apakah Anda yakin ingin memutuskan hubungan dengan akun Google? Anda masih bisa login dengan email & password.')) {
      return;
    }

    try {
      setMessage(null);

      // Find the Google identity
      const googleIdentity = linkedIdentities.find(
        (identity: any) => identity.provider === 'google'
      );

      if (!googleIdentity) {
        setMessage({ type: 'error', text: 'Akun Google tidak ditemukan' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      const { error } = await supabase.auth.unlinkIdentity(googleIdentity);

      if (error) {
        throw error;
      }

      setHasGoogleLinked(false);
      setMessage({ 
        type: 'success', 
        text: 'Akun Google berhasil diputuskan. Anda masih bisa login dengan email & password.' 
      });
      setTimeout(() => setMessage(null), 5000);

      // Refresh identities
      const { data } = await supabase.auth.getUserIdentities();
      if (data?.identities) {
        setLinkedIdentities(data.identities);
      }
    } catch (error: any) {
      console.error('Unlink Google error:', error);
      setMessage({ 
        type: 'error', 
        text: error?.message || 'Gagal memutuskan hubungan dengan akun Google' 
      });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">
      <div>
        <ProfileCompletionWarning />
        
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Pengaturan Profil</h1>
            <p className="text-gray-600 dark:text-zinc-400 font-medium">Kelola informasi profil dan preferensi akun Anda</p>
          </div>
          
          <button
            onClick={toggleTutorial}
            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
            title="Tampilkan panduan fitur"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
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
            <div className="member-settings-avatar bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 shadow-sm transition-colors duration-300">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Foto Profil</h2>
              <div className="flex flex-col items-center">
                <div className="relative group mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500">
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
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 via-purple-500 to-pink-500">
                        <span className="text-5xl font-bold text-white">
                          {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => !isSettingsBlocked && fileInputRef.current?.click()}
                    disabled={isUploading || isSettingsBlocked}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isSettingsBlocked ? 'Lengkapi profil terlebih dahulu' : 'Ubah foto profil'}
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
                <p className="text-sm text-gray-500 dark:text-zinc-400 text-center font-medium">
                  Klik ikon kamera untuk mengubah foto profil<br />
                  Maksimal 5MB (JPG, PNG)
                </p>
              </div>
            </div>

            {/* Personal Information Card */}
            <div 
              className={`member-settings-personal bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 group shadow-sm transition-colors ${
                isSettingsBlocked 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:border-blue-400 dark:hover:border-blue-500/30 cursor-pointer'
              }`} 
              onClick={() => !isSettingsBlocked && openPersonalModal()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Informasi Pribadi</h2>
                <Edit2 className={`w-5 h-5 transition-colors ${
                  isSettingsBlocked 
                    ? 'text-gray-300 dark:text-zinc-600' 
                    : 'text-gray-400 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                }`} />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-zinc-400 font-semibold block mb-1">Nama Lengkap</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{user?.user_metadata?.full_name || 'Belum diisi'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-zinc-400 font-semibold block mb-1">Email</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{user?.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-zinc-400 font-semibold block mb-1">Nomor Telepon</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{user?.user_metadata?.phone || profilePhone || 'Belum diisi'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Badminton Profile Card */}
            <div 
              className={`member-settings-badminton bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 group shadow-sm transition-colors ${
                isSettingsBlocked 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:border-green-400 dark:hover:border-green-500/30 cursor-pointer'
              }`} 
              onClick={() => !isSettingsBlocked && openBadmintonModal()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profil Badminton</h2>
                <Edit2 className={`w-5 h-5 transition-colors ${
                  isSettingsBlocked 
                    ? 'text-gray-300 dark:text-zinc-600' 
                    : 'text-gray-400 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                }`} />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-zinc-400 font-semibold block mb-1">Level Bermain</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{getPlayingLevelLabel(user?.user_metadata?.playing_level || 'beginner')}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-zinc-400 font-semibold block mb-1">Tangan Dominan</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{getDominantHandLabel(user?.user_metadata?.dominant_hand || 'right')}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-zinc-400 font-semibold block mb-1">Lama Bermain</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{user?.user_metadata?.years_playing ? `${user.user_metadata.years_playing} tahun` : 'Belum diisi'}</p>
                </div>
              </div>
            </div>

            {/* Achievements Card */}
            <div 
              className={`member-settings-achievements bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 group shadow-sm transition-colors ${
                isSettingsBlocked 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:border-yellow-400 dark:hover:border-yellow-500/30 cursor-pointer'
              }`} 
              onClick={() => !isSettingsBlocked && openAchievementsModal()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pencapaian Turnamen</h2>
                <Edit2 className={`w-5 h-5 transition-colors ${
                  isSettingsBlocked 
                    ? 'text-gray-300 dark:text-zinc-600' 
                    : 'text-gray-400 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                }`} />
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
                      <div key={index} className="bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <Award className="w-5 h-5 text-yellow-500 dark:text-yellow-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-900 dark:text-white font-semibold">{achievement.tournament}</p>
                            <p className="text-sm text-gray-500 dark:text-zinc-400">{achievement.place} • {achievement.year}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 dark:text-zinc-500 text-center py-4">Belum ada pencapaian</p>
                  );
                })()}
              </div>
            </div>

            {/* Partner Preferences Card */}
            <div 
              className={`member-settings-partner bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 group shadow-sm transition-colors ${
                isSettingsBlocked 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:border-purple-400 dark:hover:border-purple-500/30 cursor-pointer'
              }`} 
              onClick={() => !isSettingsBlocked && openPartnerModal()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preferensi Partner</h2>
                <Edit2 className={`w-5 h-5 transition-colors ${
                  isSettingsBlocked 
                    ? 'text-gray-300 dark:text-zinc-600' 
                    : 'text-gray-400 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                }`} />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-zinc-400 font-semibold block mb-1">Preferensi</label>
                  <p className="text-gray-900 dark:text-white font-medium">{user?.user_metadata?.partner_preferences || 'Belum diisi'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-zinc-400 font-semibold block mb-1">Instagram</label>
                  <p className="text-gray-900 dark:text-white font-semibold">{user?.user_metadata?.instagram_url || 'Belum diisi'}</p>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className={`bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 shadow-sm transition-colors duration-300 ${isSettingsBlocked ? 'opacity-50' : ''}`}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Ubah Password</h2>
              
              {isSettingsBlocked && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">
                    🔒 Lengkapi profil terlebih dahulu untuk mengubah password
                  </p>
                </div>
              )}
              
              {isOAuthUser && !isSettingsBlocked && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400">
                    ℹ️ Anda login dengan Google. Membuat password akan memungkinkan Anda login dengan email & password selain Google OAuth.
                  </p>
                </div>
              )}
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-400 mb-2">
                    Password Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isSettingsBlocked}
                      className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-400 mb-2">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSettingsBlocked}
                      className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  disabled={isPasswordLoading || !newPassword || !confirmPassword || isSettingsBlocked}
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

            {/* Linked Accounts / Authentication Methods Card */}
            {!isSettingsBlocked ? (
              <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Metode Login</h2>
                <p className="text-sm text-zinc-400 mb-6">
                  Kelola cara Anda masuk ke akun ini. Anda bisa menggunakan email & password, Google, atau keduanya.
                </p>

                <div className="space-y-3">
                  {/* Email/Password Method */}
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-white/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Mail className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Email & Password</p>
                        <p className="text-sm text-gray-500 dark:text-zinc-400">{user?.email}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-transparent rounded-full text-sm font-bold">
                      Aktif
                    </span>
                  </div>

                  {/* Google OAuth Method */}
                  <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                          <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                          <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1818182,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                          <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-semibold">Google</p>
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                          {hasGoogleLinked ? 'Terhubung' : 'Belum terhubung'}
                        </p>
                      </div>
                    </div>
                    
                    {hasGoogleLinked ? (
                      <button
                        onClick={handleUnlinkGoogle}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                      >
                        Putuskan
                      </button>
                    ) : (
                      <button
                        onClick={handleLinkGoogle}
                        disabled={isLinkingGoogle}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLinkingGoogle ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Menghubungkan...
                          </>
                        ) : (
                          'Hubungkan'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                    💡 Tips: Dengan menghubungkan Google, Anda bisa login menggunakan email & password <strong>atau</strong> tombol "Sign in with Google" di halaman login.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 opacity-50">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Metode Login</h2>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-medium mb-2">🔒 Fitur Terkunci</p>
                      <p className="text-sm text-yellow-300">
                        Fitur pengelolaan metode login (termasuk menghubungkan akun Google) akan tersedia setelah Anda:
                      </p>
                      <ol className="text-sm text-yellow-300 mt-2 ml-4 list-decimal space-y-1">
                        <li>Memperbarui email ke alamat email sebenarnya</li>
                        <li>Memverifikasi email tersebut</li>
                        <li>Mengubah password default</li>
                      </ol>
                      <p className="text-sm text-yellow-400 mt-3">
                        Silakan lengkapi profil Anda terlebih dahulu untuk membuka fitur ini.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personal Info Modal */}
      {showPersonalModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Informasi Pribadi</h3>
              <button onClick={() => setShowPersonalModal(false)} className="text-gray-400 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSavePersonalInfo} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-zinc-300 font-semibold mb-2 block">Nama Lengkap</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Nama lengkap Anda"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-zinc-300 font-semibold mb-2 block">Nomor Telepon</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="+62 812 3456 7890"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPersonalModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-white rounded-lg font-semibold transition-colors"
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
          <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profil Badminton</h3>
              <button onClick={() => setShowBadmintonModal(false)} className="text-gray-400 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveBadmintonProfile} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-zinc-300 font-semibold mb-2 block">Level Bermain</label>
                <select
                  value={editPlayingLevel}
                  onChange={(e) => setEditPlayingLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="beginner">Pemula</option>
                  <option value="intermediate">Menengah</option>
                  <option value="advanced">Mahir</option>
                  <option value="professional">Profesional</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-zinc-300 font-semibold mb-2 block">Tangan Dominan</label>
                <select
                  value={editDominantHand}
                  onChange={(e) => setEditDominantHand(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="right">Kanan</option>
                  <option value="left">Kiri</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-zinc-300 font-semibold mb-2 block">Lama Bermain (Tahun)</label>
                <input
                  type="number"
                  value={editYearsPlaying}
                  onChange={(e) => setEditYearsPlaying(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Contoh: 5"
                  min="0"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBadmintonModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-white rounded-lg font-semibold transition-colors"
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
          <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Pencapaian Turnamen</h3>
              <button onClick={() => setShowAchievementsModal(false)} className="text-gray-400 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveAchievements} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm text-gray-600 dark:text-zinc-300 font-semibold">Daftar Pencapaian</label>
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
                  <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-4 border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg">
                    Belum ada pencapaian. Klik "Tambah" untuk menambahkan.
                  </p>
                ) : (
                  editAchievements.map((achievement, index) => (
                    <div key={index} className="bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-1 block">Tahun</label>
                          <input
                            type="number"
                            value={achievement.year}
                            onChange={(e) => {
                              const newAchievements = [...editAchievements];
                              newAchievements[index].year = e.target.value;
                              setEditAchievements(newAchievements);
                            }}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="2024"
                            min="1900"
                            max={new Date().getFullYear()}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-1 block">Nama Turnamen</label>
                          <input
                            type="text"
                            value={achievement.tournament}
                            onChange={(e) => {
                              const newAchievements = [...editAchievements];
                              newAchievements[index].tournament = e.target.value;
                              setEditAchievements(newAchievements);
                            }}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Turnamen ABC"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-1 block">Peringkat</label>
                          <input
                            type="text"
                            value={achievement.place}
                            onChange={(e) => {
                              const newAchievements = [...editAchievements];
                              newAchievements[index].place = e.target.value;
                              setEditAchievements(newAchievements);
                            }}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
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
          <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Preferensi Partner</h3>
              <button onClick={() => setShowPartnerModal(false)} className="text-gray-400 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSavePartnerPreferences} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-zinc-300 font-semibold mb-2 block">Preferensi Partner</label>
                <textarea
                  value={editPartnerPreferences}
                  onChange={(e) => setEditPartnerPreferences(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors min-h-25 resize-none"
                  placeholder="Contoh: Suka bermain doubles, prefer partner yang agresif"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-zinc-300 font-semibold mb-2 block">Instagram</label>
                <input
                  type="url"
                  value={editInstagramUrl}
                  onChange={(e) => setEditInstagramUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-white rounded-lg font-semibold transition-colors"
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
