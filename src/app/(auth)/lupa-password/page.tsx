'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

const portraits = [
  'IMG_1999.jpg', 'IMG_2035.jpg', 'IMG_2039.jpg', 'IMG_2046.jpg', 'IMG_2049.jpg',
  'IMG_2129.jpg', 'IMG_2631.jpg', 'IMG_7627.JPG', 'IMG_7631.JPG', 'IMG_7635.JPG',
  'IMG_7800.JPG', 'IMG_8028.JPG', 'IMG_8861.JPG', 'IMG_8865.JPG', 'IMG_8873.JPG'
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bgImage, setBgImage] = useState('');
  const { user } = useAuth();
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

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setError(err?.message || 'Gagal mengirim email reset password. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
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
        <div className="w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
          <div>
            <h2 className="text-center text-3xl font-bold text-white">
              Lupa Password?
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm">
                ✅ Email reset password telah dikirim! Silakan cek inbox Anda dan klik link yang dikirimkan.
              </div>
              <Link
                href="/login"
                className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-center transition-colors"
              >
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleResetRequest}>
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
                {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300">
                  ← Kembali ke Login
                </Link>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-gray-300/20">
            <p className="text-xs text-gray-400 text-center">
              Ingat password Anda?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300">
                Masuk sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
