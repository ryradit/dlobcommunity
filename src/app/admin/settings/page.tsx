'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Mail, Camera, Save, Loader2, Lock, Eye, EyeOff, MessageSquare, AtSign, CreditCard, Plus, Trash2, Pencil, QrCode, Upload } from 'lucide-react';
import Image from 'next/image';

export default function AdminSettingsPage() {
  const { user, updateProfile, uploadAvatar, refreshUser, updatePassword } = useAuth();

  // Bank account types
  type BankAccount = { name: string; number: string };
  type BankInfo = { holderName: string; banks: BankAccount[]; ewallets: BankAccount[] };

  const DEFAULT_BANK_INFO: BankInfo = {
    holderName: 'Septian Dwiyo Rifalda',
    banks: [
      { name: 'Permata Bank', number: '9937 296 220' },
      { name: 'Jenius', number: '90012823396' },
      { name: 'Mandiri', number: '1700 1093 5998 56' },
      { name: 'BNI', number: '0389 125635' },
      { name: 'Blu (BCA Digital)', number: '0022 2208 9889' },
      { name: 'BCA', number: '5871 788 087' },
    ],
    ewallets: [
      { name: 'DANA', number: '0821 1113 4140' },
      { name: 'Gopay', number: '0812 7073 272' },
      { name: 'ShopeePay', number: '0821 1113 4140' },
    ],
  };

  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WA notification toggle
  const [waEnabled, setWaEnabled] = useState<boolean | null>(null);
  const [waToggling, setWaToggling] = useState(false);

  // Email notification toggle
  const [emailEnabled, setEmailEnabled] = useState<boolean | null>(null);
  const [emailToggling, setEmailToggling] = useState(false);

  // Bank accounts
  const [bankInfo, setBankInfo] = useState<any | null>(null);
  const [bankDraft, setBankDraft] = useState<any>(null);
  const [bankEditing, setBankEditing] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);

  // QRIS
  const [qrisImageUrl, setQrisImageUrl] = useState<string>('');
  const [qrisUploading, setQrisUploading] = useState(false);
  const qrisInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/admin/app-settings', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      const settings: { key: string; value: string }[] = json.settings ?? [];
      const wa = settings.find(s => s.key === 'wa_notifications_enabled');
      const email = settings.find(s => s.key === 'email_notifications_enabled');
      const bank = settings.find(s => s.key === 'bank_accounts');
      const qris = settings.find(s => s.key === 'qris_image_url');
      setWaEnabled(wa ? wa.value === 'true' : false);
      setEmailEnabled(email ? email.value === 'true' : true);
      if (qris?.value) setQrisImageUrl(qris.value);
      if (bank?.value) {
        try {
          const parsed = JSON.parse(bank.value);
          setBankInfo(parsed);
          setBankDraft(parsed);
        } catch { setBankInfo(null); setBankDraft(null); }
      }
    }
    fetchSettings();
  }, []);

  const handleEmailToggle = async () => {
    if (emailToggling || emailEnabled === null) return;
    setEmailToggling(true);
    const newValue = !emailEnabled;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ key: 'email_notifications_enabled', value: String(newValue) }),
      });
      if (res.ok) {
        setEmailEnabled(newValue);
        setMessage({ type: 'success', text: `Notifikasi Email ${newValue ? 'diaktifkan' : 'dinonaktifkan'}` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Gagal update setting');
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Gagal update setting' });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setEmailToggling(false);
    }
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    setQrisUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `admin/qris.${ext}`;
      // upsert (overwrite) to same path so only one QRIS exists
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);
      // force cache-bust
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ key: 'qris_image_url', value: publicUrl }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan URL');
      setQrisImageUrl(urlWithBust);
      setMessage({ type: 'success', text: 'QRIS berhasil diupload!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Gagal upload QRIS' });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setQrisUploading(false);
      if (qrisInputRef.current) qrisInputRef.current.value = '';
    }
  };

  const handleRemoveQris = async () => {
    if (!confirm('Hapus gambar QRIS? Member tidak akan bisa menggunakan metode QRIS.')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/admin/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ key: 'qris_image_url', value: '' }),
      });
      setQrisImageUrl('');
      setMessage({ type: 'success', text: 'QRIS dihapus.' });
      setTimeout(() => setMessage(null), 3000);
    } catch {}
  };

  const handleSaveBankInfo = async () => {
    if (!bankDraft || bankSaving) return;
    setBankSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ key: 'bank_accounts', value: JSON.stringify(bankDraft) }),
      });
      if (res.ok) {
        setBankInfo(bankDraft);
        setBankEditing(false);
        setMessage({ type: 'success', text: 'Rekening berhasil disimpan!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Gagal menyimpan rekening');
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Gagal menyimpan' });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setBankSaving(false);
    }
  };

  const handleWaToggle = async () => {
    if (waToggling || waEnabled === null) return;
    setWaToggling(true);
    const newValue = !waEnabled;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ key: 'wa_notifications_enabled', value: String(newValue) }),
      });
      if (res.ok) {
        setWaEnabled(newValue);
        setMessage({ type: 'success', text: `Notifikasi WhatsApp ${newValue ? 'diaktifkan' : 'dinonaktifkan'}` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Gagal update setting');
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Gagal update setting' });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setWaToggling(false);
    }
  };

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
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-red-500 to-orange-500 flex items-center justify-center border-2 border-gray-300 dark:border-transparent">
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

        {/* QRIS Section */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 mb-8 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-2">
            <QrCode className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Metode QRIS</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
            Upload gambar QR code QRIS. Jika ada gambar, member akan melihat opsi &quot;QRIS&quot; di halaman pembayaran mereka.
            Biarkan kosong untuk menyembunyikan opsi ini.
          </p>

          {qrisImageUrl ? (
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="bg-white p-3 rounded-xl border border-gray-200 dark:border-white/10 w-fit">
                <Image
                  src={qrisImageUrl}
                  alt="QRIS"
                  width={200}
                  height={200}
                  className="rounded-lg object-contain"
                  unoptimized
                />
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <p className="text-sm text-green-500 font-semibold">✅ QRIS aktif — member bisa menggunakan metode ini</p>
                <button
                  onClick={() => qrisInputRef.current?.click()}
                  disabled={qrisUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                >
                  {qrisUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  Ganti Gambar
                </button>
                <button
                  onClick={handleRemoveQris}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus QRIS
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-8 text-center">
              <QrCode className="w-12 h-12 text-gray-400 dark:text-zinc-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Belum ada gambar QRIS. Upload untuk mengaktifkan metode pembayaran QRIS.</p>
              <button
                onClick={() => qrisInputRef.current?.click()}
                disabled={qrisUploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors mx-auto"
              >
                {qrisUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {qrisUploading ? 'Mengupload...' : 'Upload Gambar QRIS'}
              </button>
            </div>
          )}

          <input
            ref={qrisInputRef}
            type="file"
            accept="image/*"
            onChange={handleQrisUpload}
            className="hidden"
          />
        </div>

        {/* Bank Accounts Section */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 mb-8 transition-colors duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Rekening Transfer</h2>
            </div>
            {!bankEditing ? (
              <button
                onClick={() => { setBankDraft(bankInfo ?? DEFAULT_BANK_INFO); setBankEditing(true); }}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setBankEditing(false); setBankDraft(bankInfo ?? DEFAULT_BANK_INFO); }} className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-white rounded-lg transition-colors">Batal</button>
                <button onClick={handleSaveBankInfo} disabled={bankSaving} className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1">
                  {bankSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Simpan
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">Kelola rekening tujuan transfer yang ditampilkan di halaman pembayaran member.</p>

          {/* Holder name */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 block">Nama Pemilik Rekening</label>
            {bankEditing ? (
              <input value={bankDraft?.holderName ?? ''} onChange={e => setBankDraft({...bankDraft, holderName: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500" />
            ) : (
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{(bankInfo ?? DEFAULT_BANK_INFO).holderName}</p>
            )}
          </div>

          {/* Bank accounts list */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Rekening Bank</label>
              {bankEditing && (
                <button onClick={() => setBankDraft({...bankDraft, banks: [...(bankDraft?.banks ?? []), {name:'', number:''}]})} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> Tambah
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(bankEditing ? bankDraft?.banks : (bankInfo ?? DEFAULT_BANK_INFO).banks)?.map((acct: any, i: number) => (
                bankEditing ? (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={acct.name} onChange={e => { const b=[...(bankDraft?.banks??[])]; b[i]={...b[i],name:e.target.value}; setBankDraft({...bankDraft,banks:b}); }} placeholder="Nama Bank" className="w-32 px-2 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded text-sm text-gray-900 dark:text-white focus:outline-none" />
                    <input value={acct.number} onChange={e => { const b=[...(bankDraft?.banks??[])]; b[i]={...b[i],number:e.target.value}; setBankDraft({...bankDraft,banks:b}); }} placeholder="Nomor Rekening" className="flex-1 px-2 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded text-sm font-mono text-gray-900 dark:text-white focus:outline-none" />
                    <button onClick={() => setBankDraft({...bankDraft, banks: bankDraft.banks.filter((_: any, j: number) => j !== i)})} className="p-1 text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div key={i} className="flex justify-between text-sm border-b border-gray-100 dark:border-white/5 pb-1.5">
                    <span className="text-gray-500 dark:text-zinc-400">{acct.name}</span>
                    <span className="font-mono text-gray-900 dark:text-white">{acct.number}</span>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* E-wallets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">E-Wallet</label>
              {bankEditing && (
                <button onClick={() => setBankDraft({...bankDraft, ewallets: [...(bankDraft?.ewallets ?? []), {name:'', number:''}]})} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> Tambah
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(bankEditing ? bankDraft?.ewallets : (bankInfo ?? DEFAULT_BANK_INFO).ewallets)?.map((acct: any, i: number) => (
                bankEditing ? (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={acct.name} onChange={e => { const w=[...(bankDraft?.ewallets??[])]; w[i]={...w[i],name:e.target.value}; setBankDraft({...bankDraft,ewallets:w}); }} placeholder="Nama E-Wallet" className="w-32 px-2 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded text-sm text-gray-900 dark:text-white focus:outline-none" />
                    <input value={acct.number} onChange={e => { const w=[...(bankDraft?.ewallets??[])]; w[i]={...w[i],number:e.target.value}; setBankDraft({...bankDraft,ewallets:w}); }} placeholder="Nomor" className="flex-1 px-2 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded text-sm font-mono text-gray-900 dark:text-white focus:outline-none" />
                    <button onClick={() => setBankDraft({...bankDraft, ewallets: bankDraft.ewallets.filter((_: any, j: number) => j !== i)})} className="p-1 text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div key={i} className="flex justify-between text-sm border-b border-gray-100 dark:border-white/5 pb-1.5">
                    <span className="text-gray-500 dark:text-zinc-400">{acct.name}</span>
                    <span className="font-mono text-gray-900 dark:text-white">{acct.number}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* WA Notification Toggle */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 mb-8 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Notifikasi WhatsApp</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
            Aktifkan atau nonaktifkan pengiriman notifikasi WA ke member saat pertandingan dibuat.
            Nonaktifkan sementara jika nomor sedang dalam proses unban atau cooldown.
          </p>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-white/10">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Kirim notifikasi WA ke member</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                {waEnabled === null ? 'Memuat...' : waEnabled ? '✅ Aktif — pesan WA akan dikirim' : '🔴 Nonaktif — pesan WA tidak akan dikirim'}
              </p>
            </div>
            <button
              onClick={handleWaToggle}
              disabled={waToggling || waEnabled === null}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 ${
                waEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                waEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
              {waToggling && <Loader2 className="absolute inset-0 m-auto w-4 h-4 animate-spin text-white" />}
            </button>
          </div>
        </div>

        {/* Email Notification Toggle */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 mb-8 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-2">
            <AtSign className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Notifikasi Email</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
            Aktifkan atau nonaktifkan pengiriman notifikasi email ke member saat pertandingan dibuat.
          </p>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-white/10">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Kirim notifikasi email ke member</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                {emailEnabled === null ? 'Memuat...' : emailEnabled ? '✅ Aktif — email akan dikirim' : '🔴 Nonaktif — email tidak akan dikirim'}
              </p>
            </div>
            <button
              onClick={handleEmailToggle}
              disabled={emailToggling || emailEnabled === null}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 ${
                emailEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                emailEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
              {emailToggling && <Loader2 className="absolute inset-0 m-auto w-4 h-4 animate-spin text-white" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
