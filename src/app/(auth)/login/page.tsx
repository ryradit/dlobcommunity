'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Chrome } from 'lucide-react';

export const dynamic = 'force-dynamic';

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle, loading, user, session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [randomImage, setRandomImage] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * portraitImages.length);
    setRandomImage(portraitImages[randomIndex]);
  }, []);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (session && user && !loading) {
      router.push('/dashboard');
    }
  }, [session, user, loading, router]);

  // Handle OAuth errors from URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        'auth': 'Gagal melakukan autentikasi. Silakan coba lagi.',
        'access_denied': 'Akses ditolak. Silakan coba lagi.',
        'server_error': 'Terjadi kesalahan server. Silakan coba lagi nanti.',
        'session_expired': 'Sesi Anda telah berakhir. Silakan login kembali.',
        'session_timeout': 'Sesi Anda telah berakhir karena inaktivitas. Silakan login kembali.'
      };
      setError(errorMessages[errorParam] || 'Terjadi kesalahan saat login.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Cek email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Gagal masuk dengan Google.');
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
            <div className="relative h-[600px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src={`/images/potrait/${randomImage}`}
                alt="DLOB Community"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-2xl font-bold text-white mb-2">Bergabunglah dengan DLOB</h2>
                <p className="text-zinc-300 text-sm">Komunitas badminton terdepan dengan teknologi smart</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Section */}
        <div className="w-full lg:flex-1 max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">DLOB</h1>
          <p className="text-zinc-400">Masuk ke Akun Anda</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-white text-zinc-950 font-semibold rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sedang Masuk...' : 'Masuk'}
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

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Chrome className="w-5 h-5" />
            Masuk dengan Google
          </button>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-zinc-400">
            Belum punya akun?{' '}
            <Link href="/register" className="text-white font-semibold hover:text-zinc-200 transition-colors">
              Daftar Sekarang
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
