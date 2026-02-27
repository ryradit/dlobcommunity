'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function CompleteProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) {
      router.push('/login');
      return;
    }

    loadProfile();
  }, [user, router]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/members/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        
        // If profile is already complete, redirect to dashboard
        if (!data.using_temp_email && !data.must_change_password) {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.email.includes('@')) {
      setError('Silakan masukkan alamat email yang valid');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password harus minimal 6 karakter');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          newEmail: formData.email,
          newPassword: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('✅ Profil berhasil diperbarui! Email verifikasi telah dikirim ke inbox Anda. Anda akan diarahkan ke halaman login. Silakan verifikasi email terlebih dahulu sebelum login.');
      
      // Log out the user and redirect to login
      setTimeout(async () => {
        await signOut();
        router.push('/login?message=please-verify-email');
      }, 4000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-white">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-[#3e6461]/20 rounded-full mb-4">
              <User className="w-12 h-12 text-[#3e6461]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Lengkapi Profil Anda
            </h1>
            <p className="text-zinc-400 text-sm">
              {profile?.using_temp_email && 'Perbarui alamat email dan '}
              {profile?.must_change_password && 'buat password baru'}
            </p>
          </div>

          {/* Current Info */}
          <div className="bg-zinc-800/40 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              {profile?.avatar_url && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Member'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{profile?.full_name}</p>
                <p className="text-sm text-zinc-400 truncate">{profile?.email}</p>
              </div>
            </div>
          </div>

          {/* Alert */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-300 font-medium mb-1">
                  Pengaturan Awal Diperlukan
                </p>
                <p className="text-xs text-blue-200/80 mb-2">
                  Silakan masukkan alamat email asli Anda dan buat password yang aman.
                </p>
                <p className="text-xs text-yellow-300 font-medium">
                  ⚠️ Setelah submit, Anda akan logout otomatis. Email verifikasi akan dikirim ke inbox Anda. Silakan klik link verifikasi terlebih dahulu sebelum login kembali dengan email dan password baru.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Alamat Email Anda
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email.anda@contoh.com"
                required
                className="w-full px-4 py-3 bg-zinc-800/60 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#3e6461]/50 focus:ring-2 focus:ring-[#3e6461]/20"
              />
              <p className="text-xs text-zinc-500 mt-1.5">
                Gunakan email yang valid dan bisa Anda akses
              </p>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Password Baru
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-zinc-800/60 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#3e6461]/50 focus:ring-2 focus:ring-[#3e6461]/20"
              />
              <p className="text-xs text-zinc-500 mt-1.5">
                Minimal 6 karakter
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-zinc-800/60 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#3e6461]/50 focus:ring-2 focus:ring-[#3e6461]/20"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                <div className="flex gap-2 items-start">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-300">{success}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-4 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] hover:from-[#3e6461]/90 hover:to-[#2d4a47]/90 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-white"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memperbarui...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Lengkapi Pengaturan
                </>
              )}
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-xs text-zinc-500 text-center">
              🔒 Informasi Anda terenkripsi dan aman.
              <br />
              📧 Email verifikasi akan dikirim ke inbox Anda setelah submit.
              <br />
              ✅ Anda tetap bisa menggunakan dashboard. Warning hilang setelah verifikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
