'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Camera, Save, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function AdminSettingsPage() {
  const { user, updateProfile, uploadAvatar, refreshUser, updatePassword } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [isNameLoading, setIsNameLoading] = useState(false);

  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  // Initialize full name from user data
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

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

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fullName.trim()) return;

    try {
      setIsNameLoading(true);
      setMessage(null);

      await updateProfile({
        full_name: fullName.trim(),
      });

      await refreshUser();
      
      setMessage({ type: 'success', text: 'Nama berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Update name error:', error);
      setMessage({ type: 'error', text: 'Gagal memperbarui nama' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsNameLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Pengaturan Admin</h1>
          <p className="text-gray-600 dark:text-zinc-400 font-medium transition-colors duration-300">
            Kelola profil dan keamanan akun Anda
          </p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border-2 font-semibold transition-colors duration-300 ${
            message.type === 'success' 
              ? 'bg-green-100 dark:bg-green-500/20 border-green-300 dark:border-green-500/50 text-green-700 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Picture Section */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-8 mb-6 shadow-sm transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">Foto Profil</h2>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-transparent"
                  unoptimized
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center border-2 border-gray-300 dark:border-transparent">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-zinc-700 text-white p-2 rounded-full transition-colors border-2 border-white dark:border-transparent"
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
            
            <div>
              <p className="text-gray-900 dark:text-white font-bold mb-1 transition-colors duration-300">Upload foto profil</p>
              <p className="text-sm text-gray-600 dark:text-zinc-400 font-medium transition-colors duration-300">JPG, PNG maksimal 5MB</p>
            </div>
          </div>
        </div>

        {/* Personal Info Section */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-8 mb-6 shadow-sm transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">Informasi Pribadi</h2>
          
          <form onSubmit={handleSaveName} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-2 transition-colors duration-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500 transition-colors duration-300" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-xl text-gray-400 dark:text-zinc-500 cursor-not-allowed font-medium transition-colors duration-300"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 font-semibold transition-colors duration-300">Email tidak dapat diubah</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-2 transition-colors duration-300">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-zinc-400 transition-colors duration-300" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:border-red-500 focus:outline-none font-medium transition-colors duration-300"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isNameLoading || !fullName.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-zinc-700 disabled:text-gray-500 dark:disabled:text-zinc-500 text-white rounded-xl transition-colors font-bold border-2 border-transparent hover:border-red-400 shadow-sm"
            >
              {isNameLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl p-8 shadow-sm transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">Ubah Password</h2>
          
          {isOAuthUser && (
            <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-500/10 border-2 border-blue-300 dark:border-blue-500/30 rounded-lg transition-colors duration-300">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium transition-colors duration-300">
                ℹ️ Anda login dengan Google. Membuat password akan memungkinkan Anda login dengan email & password selain Google OAuth.
              </p>
            </div>
          )}
          
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-2 transition-colors duration-300">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-zinc-400 transition-colors duration-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:border-red-500 focus:outline-none font-medium transition-colors duration-300"
                  placeholder="Minimal 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-2 transition-colors duration-300">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-zinc-400 transition-colors duration-300" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:border-red-500 focus:outline-none font-medium transition-colors duration-300"
                  placeholder="Ketik ulang password baru"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPasswordLoading || !newPassword || !confirmPassword}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-zinc-700 disabled:text-gray-500 dark:disabled:text-zinc-500 text-white rounded-xl transition-colors font-bold border-2 border-transparent hover:border-red-400 shadow-sm"
            >
              {isPasswordLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memperbarui...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Ubah Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
