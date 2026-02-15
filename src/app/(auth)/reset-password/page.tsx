'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

const portraits = [
  'IMG_1999.jpg', 'IMG_2035.jpg', 'IMG_2039.jpg', 'IMG_2046.jpg', 'IMG_2049.jpg',
  'IMG_2129.jpg', 'IMG_2631.jpg', 'IMG_7627.JPG', 'IMG_7631.JPG', 'IMG_7635.JPG',
  'IMG_7800.JPG', 'IMG_8028.JPG', 'IMG_8861.JPG', 'IMG_8865.JPG', 'IMG_8873.JPG'
];

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [bgImage, setBgImage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const randomImage = portraits[Math.floor(Math.random() * portraits.length)];
    setBgImage(`/images/potrait/${randomImage}`);
  }, []);

  // Check if we have a valid session (from the reset link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Link reset password tidak valid atau sudah kadaluarsa. Silakan request ulang.');
      }
    };
    
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
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
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?message=password-reset-success');
      }, 2000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err?.message || 'Gagal mereset password. Silakan coba lagi.');
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
              Reset Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              Masukkan password baru Anda
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm">
                ✅ Password berhasil direset! Anda akan diarahkan ke halaman login...
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  Password Baru
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
                  Konfirmasi Password Baru
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

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !!error}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Mereset Password...' : 'Reset Password'}
              </button>

              <div className="text-center">
                <Link href="/lupa-password" className="text-sm text-blue-400 hover:text-blue-300">
                  Kirim ulang link reset
                </Link>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-gray-300/20">
            <p className="text-xs text-gray-400 text-center">
              <Link href="/login" className="text-blue-400 hover:text-blue-300">
                ← Kembali ke Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
