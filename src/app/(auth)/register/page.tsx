'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const portraits = [
  'IMG_1999.jpg', 'IMG_2035.jpg', 'IMG_2039.jpg', 'IMG_2046.jpg', 'IMG_2049.jpg',
  'IMG_2129.jpg', 'IMG_2631.jpg', 'IMG_7627.JPG', 'IMG_7631.JPG', 'IMG_7635.JPG',
  'IMG_7800.JPG', 'IMG_8028.JPG', 'IMG_8861.JPG', 'IMG_8865.JPG', 'IMG_8873.JPG'
];

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bgImage, setBgImage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signInWithGoogle, user } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    const randomImage = portraits[Math.floor(Math.random() * portraits.length)];
    setBgImage(`/images/potrait/${randomImage}`);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    try {
      const result = await signUp(email, password, fullName);
      setSuccess(true);
      
      // Check if email confirmation is required
      if (result?.user && !result.session) {
        setError('');
        alert('Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi akun.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        // Auto login successful
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = 'Pendaftaran gagal';
      
      if (err.message) {
        if (err.message.includes('already registered') || err.message.includes('already exists')) {
          errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain atau login.';
        } else if (err.message.includes('invalid email')) {
          errorMessage = 'Format email tidak valid';
        } else if (err.message.includes('password')) {
          errorMessage = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google signup failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12 relative overflow-hidden">
      {/* Background Image */}
      {bgImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImage}
            alt="Background"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/80 via-zinc-950/60 to-zinc-950/80" />
        </div>
      )}
      
      <div className="w-full max-w-md mx-auto relative z-10">
        {/* Register Form Section */}
        <div className="w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
          <div>
            <h2 className="text-center text-3xl font-bold text-white">
              Daftar DLOB
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
                Masuk sekarang
              </Link>
            </p>
          </div>

          {success ? (
            <div className="bg-green-500/10 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-center">
              Pendaftaran berhasil! Redirecting...
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleRegister}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-200 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300/20 placeholder-gray-400 text-white bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Nama lengkap"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300/20 placeholder-gray-400 text-white bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300/20 placeholder-gray-400 text-white bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">
                    Konfirmasi Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300/20 placeholder-gray-400 text-white bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ketik ulang password"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Mendaftar...' : 'Daftar'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-gray-300">Atau Lanjutkan Dengan</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300/20 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-gray-300/20">
            <p className="text-xs text-gray-400 text-center">
              Dengan mendaftar, Anda menyetujui{' '}
              <Link href="/syarat-layanan" className="text-blue-400 hover:text-blue-300">
                Syarat Layanan
              </Link>
              {' '}dan{' '}
              <Link href="/kebijakan-privasi" className="text-blue-400 hover:text-blue-300">
                Kebijakan Privasi
              </Link>
              {' '}kami.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
