'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, Camera, Save, Loader2, Edit2, X, Award, Users, Instagram, Lock, Eye, EyeOff, HelpCircle, AlertTriangle, Shield, CheckCircle, ChevronRight, Star, Zap, Settings } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');

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

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    let score = 0;
    if (user?.user_metadata?.full_name) score += 20;
    if (user?.user_metadata?.phone || profilePhone) score += 20;
    if (user?.user_metadata?.playing_level) score += 20;
    if (user?.user_metadata?.dominant_hand) score += 20;
    if (user?.user_metadata?.years_playing || user?.user_metadata?.instagram_url) score += 20;
    return score;
  };
  const completionScore = calculateCompletion();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 px-4 lg:px-8 py-6 lg:py-8 transition-colors duration-300">
      <div>
        <ProfileCompletionWarning />
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <User className="w-8 h-8 text-blue-500" />
              Pengaturan Profil
            </h1>
            <p className="text-gray-600 dark:text-zinc-400 font-medium">Kelola informasi profil, statistik badminton, dan keamanan akun Anda</p>
          </div>
          
          <button
            onClick={toggleTutorial}
            className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-500 dark:text-blue-400 transition-colors shadow-xs"
            title="Tampilkan panduan fitur"
          >
            <HelpCircle className="w-5.5 h-5.5" />
          </button>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${
            message.type === 'success' 
              ? 'bg-green-50/90 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-400' 
              : 'bg-red-50/90 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Profile Completion Hero Banner */}
        <div className="mb-8 bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs relative overflow-hidden transition-all duration-300">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-100 dark:border-zinc-800 shadow-md bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 relative">
                {avatarUrl ? (
                  <Image
                    key={avatarUrl}
                    src={avatarUrl}
                    alt="Profile"
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 via-purple-500 to-pink-500">
                    <span className="text-4xl font-bold text-white">
                      {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => !isSettingsBlocked && fileInputRef.current?.click()}
                disabled={isUploading || isSettingsBlocked}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                title={isSettingsBlocked ? 'Lengkapi profil terlebih dahulu' : 'Ubah foto profil'}
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

            {/* Info and Progress */}
            <div className="flex-1 w-full text-center md:text-left space-y-3">
              <div>
                <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user?.user_metadata?.full_name || 'Member DLOB'}
                  </h2>
                  <span className={`self-center text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    user?.user_metadata?.playing_level === 'professional' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    user?.user_metadata?.playing_level === 'advanced' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                    user?.user_metadata?.playing_level === 'intermediate' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    'bg-green-500/10 text-green-500 border-green-500/20'
                  }`}>
                    {getPlayingLevelLabel(user?.user_metadata?.playing_level || 'beginner')}
                  </span>
                </div>
                <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">{user?.email}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-zinc-400">
                  <span>Kelengkapan Profil</span>
                  <span>{completionScore}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${completionScore}%` }}
                  />
                </div>
                {completionScore < 100 && (
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
                    💡 Lengkapi profil Anda untuk memaksimalkan rekomendasi partner dan performa AI!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800 mb-8 overflow-x-auto scrollbar-none gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 px-5 font-bold text-sm flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <User className="w-4.5 h-4.5" />
            Profil Member
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`py-3.5 px-5 font-bold text-sm flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'account'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            Pengaturan Akun & Keamanan
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'profile' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Personal Info Card */}
              <div 
                className={`bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-all duration-300 relative overflow-hidden group ${
                  isSettingsBlocked 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:border-blue-500/30 dark:hover:border-blue-500/20 hover:shadow-md'
                }`}
              >
                <div className="absolute left-0 top-0 w-1 h-full bg-blue-500" />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Informasi Pribadi</h2>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Nama lengkap dan nomor kontak Anda</p>
                    </div>
                  </div>
                  {!isSettingsBlocked && (
                    <button 
                      onClick={openPersonalModal}
                      className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-500 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-zinc-800/60">
                    <span className="text-sm font-semibold text-gray-500 dark:text-zinc-400">Nama Lengkap</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{user?.user_metadata?.full_name || 'Belum diisi'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-zinc-800/60">
                    <span className="text-sm font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                      Email
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{user?.email || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-sm font-semibold text-gray-500 dark:text-zinc-400">Nomor Telepon</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{user?.user_metadata?.phone || profilePhone || 'Belum diisi'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Badminton Profile Card */}
              <div 
                className={`bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-all duration-300 relative overflow-hidden group ${
                  isSettingsBlocked 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:border-green-500/30 dark:hover:border-green-500/20 hover:shadow-md'
                }`}
              >
                <div className="absolute left-0 top-0 w-1 h-full bg-green-500" />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-xl">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profil Badminton</h2>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Atribut permainan dan level Anda</p>
                    </div>
                  </div>
                  {!isSettingsBlocked && (
                    <button 
                      onClick={openBadmintonModal}
                      className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-green-50 dark:hover:bg-green-500/10 text-gray-500 hover:text-green-500 dark:text-zinc-400 dark:hover:text-green-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-xl p-4 text-center border border-gray-100 dark:border-zinc-800/50">
                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Level Bermain</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{getPlayingLevelLabel(user?.user_metadata?.playing_level || 'beginner')}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-xl p-4 text-center border border-gray-100 dark:border-zinc-800/50">
                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Tangan Dominan</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{getDominantHandLabel(user?.user_metadata?.dominant_hand || 'right')}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-xl p-4 text-center border border-gray-100 dark:border-zinc-800/50">
                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Pengalaman</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{user?.user_metadata?.years_playing ? `${user.user_metadata.years_playing} Tahun` : 'Belum diisi'}</p>
                  </div>
                </div>
              </div>

              {/* Achievements Card */}
              <div 
                className={`bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-all duration-300 relative overflow-hidden group ${
                  isSettingsBlocked 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:border-yellow-500/30 dark:hover:border-yellow-500/20 hover:shadow-md'
                }`}
              >
                <div className="absolute left-0 top-0 w-1 h-full bg-yellow-500" />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pencapaian Turnamen</h2>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Prestasi dan riwayat kejuaraan Anda</p>
                    </div>
                  </div>
                  {!isSettingsBlocked && (
                    <button 
                      onClick={openAchievementsModal}
                      className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 text-gray-500 hover:text-yellow-600 dark:text-zinc-400 dark:hover:text-yellow-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {achievements.map((achievement: any, index: number) => (
                          <div key={index} className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-150 dark:border-zinc-800/50 rounded-xl p-3 flex items-start gap-2.5">
                            <Star className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{achievement.tournament}</p>
                              <p className="text-[11px] text-gray-500 dark:text-zinc-400">{achievement.place} • {achievement.year}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
                        <p className="text-sm text-gray-400 dark:text-zinc-500">Belum ada pencapaian turnamen</p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Partner Preferences Card */}
              <div 
                className={`bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-all duration-300 relative overflow-hidden group ${
                  isSettingsBlocked 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:border-purple-500/30 dark:hover:border-purple-500/20 hover:shadow-md'
                }`}
              >
                <div className="absolute left-0 top-0 w-1 h-full bg-purple-500" />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kriteria Partner & Sosmed</h2>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Preferensi pasangan main dan link Instagram</p>
                    </div>
                  </div>
                  {!isSettingsBlocked && (
                    <button 
                      onClick={openPartnerModal}
                      className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-500/10 text-gray-500 hover:text-purple-500 dark:text-zinc-400 dark:hover:text-purple-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-xl p-4 border border-gray-100 dark:border-zinc-800/50">
                    <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Kriteria Partner Yang Dicari</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-300 italic">
                      "{user?.user_metadata?.partner_preferences || 'Belum mengisi preferensi'}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-500" />
                      Instagram Link
                    </span>
                    {user?.user_metadata?.instagram_url ? (
                      <a 
                        href={user.user_metadata.instagram_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-bold text-blue-500 hover:underline truncate max-w-[200px]"
                      >
                        {user.user_metadata.instagram_url.split('/').pop() || 'Profil'}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-zinc-500">Belum diisi</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            {/* Left Column - Authentication Methods */}
            <div className="space-y-6">
              {/* Account Linking / Authentication Methods Card */}
              {!isSettingsBlocked ? (
                <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs relative overflow-hidden transition-all duration-300">
                  <div className="absolute left-0 top-0 w-1 h-full bg-slate-500" />
                  <div className="mb-6 flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-zinc-800 text-slate-500 rounded-xl">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Metode Login</h2>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Hubungkan atau kelola integrasi akun login Anda</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Email/Password Method */}
                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-zinc-800/30 border border-gray-150 dark:border-zinc-800/60 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Email & Password</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">{user?.email}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                        Aktif
                      </span>
                    </div>

                    {/* Google OAuth Method */}
                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-zinc-800/30 border border-gray-150 dark:border-zinc-800/60 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Google</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            {hasGoogleLinked ? 'Akun terhubung' : 'Belum terhubung'}
                          </p>
                        </div>
                      </div>
                      
                      {hasGoogleLinked ? (
                        <button
                          onClick={handleUnlinkGoogle}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Putuskan
                        </button>
                      ) : (
                        <button
                          onClick={handleLinkGoogle}
                          disabled={isLinkingGoogle}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {isLinkingGoogle ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Hubungkan'
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/5 border border-blue-200/50 dark:border-blue-500/20 rounded-xl">
                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
                      💡 Menghubungkan Google memudahkan Anda masuk dengan sekali klik tanpa mengetik password.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs opacity-60">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Metode Login</h2>
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-500 font-bold text-sm mb-1">🔒 Pengaturan Terkunci</p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400/90 leading-relaxed">
                          Pengelolaan metode login akan terbuka setelah Anda mengganti email sementara dengan email aktif Anda dan memverifikasinya.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Password Settings */}
            <div className="space-y-6">
              {/* Change Password Card */}
              <div className={`bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs relative overflow-hidden transition-all duration-300 ${isSettingsBlocked ? 'opacity-50' : ''}`}>
                <div className="absolute left-0 top-0 w-1 h-full bg-red-500" />
                <div className="mb-6 flex items-center gap-3">
                  <div className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ubah Password</h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Ganti kata sandi untuk menjaga keamanan akun</p>
                  </div>
                </div>
                
                {isSettingsBlocked && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                      🔒 Lengkapi profil terlebih dahulu untuk mengubah password.
                    </p>
                  </div>
                )}
                
                {isOAuthUser && !isSettingsBlocked && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-xs text-blue-500 dark:text-blue-400/95 leading-relaxed font-medium">
                      ℹ️ Akun Anda login melalui Google. Membuat password baru memungkinkan Anda masuk menggunakan kombinasi email & password reguler.
                    </p>
                  </div>
                )}
                
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      Password Baru
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isSettingsBlocked}
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        placeholder="Minimal 6 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSettingsBlocked}
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        placeholder="Ulangi password baru"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPasswordLoading || !newPassword || !confirmPassword || isSettingsBlocked}
                    className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPasswordLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Ubah Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Personal Info Modal */}
      {showPersonalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 w-full max-w-md shadow-xl transition-all scale-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Informasi Pribadi</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Perbarui nama dan kontak Anda</p>
              </div>
              <button onClick={() => setShowPersonalModal(false)} className="text-gray-400 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSavePersonalInfo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">Nama Lengkap</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Nama lengkap Anda"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">Nomor Telepon</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="+62 812 3456 7890"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPersonalModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700/80 text-gray-700 dark:text-zinc-300 rounded-xl font-semibold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPersonalLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPersonalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 w-full max-w-md shadow-xl scale-100 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profil Badminton</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Atur statistik permainan Anda</p>
              </div>
              <button onClick={() => setShowBadmintonModal(false)} className="text-gray-400 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveBadmintonProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">Level Bermain</label>
                <select
                  value={editPlayingLevel}
                  onChange={(e) => setEditPlayingLevel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="beginner">Pemula</option>
                  <option value="intermediate">Menengah</option>
                  <option value="advanced">Mahir</option>
                  <option value="professional">Profesional</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">Tangan Dominan</label>
                <select
                  value={editDominantHand}
                  onChange={(e) => setEditDominantHand(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="right">Kanan</option>
                  <option value="left">Kiri</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">Lama Bermain (Tahun)</label>
                <input
                  type="number"
                  value={editYearsPlaying}
                  onChange={(e) => setEditYearsPlaying(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Contoh: 5"
                  min="0"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBadmintonModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700/80 text-gray-700 dark:text-zinc-300 rounded-xl font-semibold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isBadmintonLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isBadmintonLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl scale-100 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Pencapaian Turnamen</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Tambahkan atau kelola medali turnamen Anda</p>
              </div>
              <button onClick={() => setShowAchievementsModal(false)} className="text-gray-400 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveAchievements} className="space-y-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-zinc-850">
                <label className="text-sm text-gray-700 dark:text-zinc-300 font-bold uppercase tracking-wider">Daftar Pencapaian</label>
                <button
                  type="button"
                  onClick={() => setEditAchievements([...editAchievements, { year: new Date().getFullYear().toString(), tournament: '', place: '' }])}
                  className="text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold"
                >
                  + Tambah
                </button>
              </div>
              <div className="space-y-3">
                {editAchievements.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
                    <p className="text-sm text-gray-400 dark:text-zinc-500">Belum ada pencapaian. Klik "+ Tambah" di atas.</p>
                  </div>
                ) : (
                  editAchievements.map((achievement, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/80 dark:border-zinc-800/50 rounded-xl p-4 space-y-3 relative group">
                      <button
                        type="button"
                        onClick={() => {
                          const newAchievements = editAchievements.filter((_, i) => i !== index);
                          setEditAchievements(newAchievements);
                        }}
                        className="absolute top-4 right-4 text-xs text-red-500 hover:text-red-600 transition-colors"
                      >
                        Hapus
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500 dark:text-zinc-400 font-semibold">Tahun</label>
                          <input
                            type="number"
                            value={achievement.year}
                            onChange={(e) => {
                              const newAchievements = [...editAchievements];
                              newAchievements[index].year = e.target.value;
                              setEditAchievements(newAchievements);
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="2026"
                            min="1900"
                            max={new Date().getFullYear()}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500 dark:text-zinc-400 font-semibold">Nama Turnamen</label>
                          <input
                            type="text"
                            value={achievement.tournament}
                            onChange={(e) => {
                              const newAchievements = [...editAchievements];
                              newAchievements[index].tournament = e.target.value;
                              setEditAchievements(newAchievements);
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Turnamen DLOB Internal"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500 dark:text-zinc-400 font-semibold">Peringkat</label>
                          <input
                            type="text"
                            value={achievement.place}
                            onChange={(e) => {
                              const newAchievements = [...editAchievements];
                              newAchievements[index].place = e.target.value;
                              setEditAchievements(newAchievements);
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Juara 1 / Runner Up"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAchievementsModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700/80 text-gray-700 dark:text-zinc-300 rounded-xl font-semibold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAchievementsLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAchievementsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl p-6 w-full max-w-md shadow-xl scale-100 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Kriteria Partner</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Atur kriteria partner & info Instagram Anda</p>
              </div>
              <button onClick={() => setShowPartnerModal(false)} className="text-gray-400 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSavePartnerPreferences} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">Kriteria Partner</label>
                <textarea
                  value={editPartnerPreferences}
                  onChange={(e) => setEditPartnerPreferences(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus:outline-none transition-colors min-h-24 resize-none"
                  placeholder="Contoh: Suka bermain menyerang, butuh partner yang bisa mengontrol jaring."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">Link Instagram</label>
                <input
                  type="url"
                  value={editInstagramUrl}
                  onChange={(e) => setEditInstagramUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800/80 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700/80 text-gray-700 dark:text-zinc-300 rounded-xl font-semibold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPartnerLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPartnerLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
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
