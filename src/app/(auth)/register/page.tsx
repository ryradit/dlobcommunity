'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User, Chrome } from 'lucide-react';

const portraitImages = [
  'IMG_1999.jpg',
  'IMG_2035.jpg',
  'IMG_2039.jpg',
  'IMG_2046.jpg',
  'IMG_2049.jpg',
  'IMG_2129.jpg',
  'IMG_2631.jpg',
  'IMG_7627.JPG',
  'IMG_7631.JPG',
  'IMG_7635.JPG',
  'IMG_7800.JPG',
  'IMG_8028.JPG',
  'IMG_8861.JPG',
  'IMG_8865.JPG',
  'IMG_8873.JPG',
];

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [randomImage, setRandomImage] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * portraitImages.length);
    setRandomImage(portraitImages[randomIndex]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Password tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Password harus minimal 6 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, fullName);
      setSuccess('Daftar berhasil! Silahkan cek email Anda untuk verifikasi.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Silahkan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Gagal daftar dengan Google.');
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl flex gap-8 items-center">
        {/* Image Section - Hidden on mobile */}
        {randomImage && (
          <div className="hidden lg:block flex-1">
            <div className="relative h-[700px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src={`/images/potrait/${randomImage}`}
                alt="DLOB Community"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-2xl font-bold text-white mb-2">Mulai Perjalanan Anda</h2>
                <p className="text-zinc-300 text-sm">Bergabung dengan 50+ member aktif dan tingkatkan skill badminton Anda</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Section */}
        <div className="w-full lg:flex-1 max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">DLOB</h1>
          <p className="text-zinc-400">Buat Akun Baru</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-sm text-green-400">
              {success}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-white mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-white text-zinc-950 font-semibold rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? 'Sedang Mendaftar...' : 'Daftar'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-zinc-900/50 text-zinc-400">atau</span>
            </div>
          </div>

          {/* Google Register */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={isLoading}
            className="w-full py-2.5 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Chrome className="w-5 h-5" />
            Daftar dengan Google
          </button>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-zinc-400">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-white font-semibold hover:text-zinc-200 transition-colors">
              Masuk Sekarang
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
