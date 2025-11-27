'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Trophy, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { isDemoMode } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dlob-language') || 'en';
    }
    return 'en';
  });
  
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

  // Language management
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dlob-language', newLanguage);
    }
  };

  // Listen for language changes from other components
  useEffect(() => {
    const handleLanguageEvent = (event: CustomEvent) => {
      setLanguage(event.detail);
    };

    window.addEventListener('languageChange', handleLanguageEvent as EventListener);
    
    return () => {
      window.removeEventListener('languageChange', handleLanguageEvent as EventListener);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      
      // Redirect based on user role
      if (result?.profile?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials and try again.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await loginWithGoogle();
      // Redirect will be handled by the auth callback
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  // Bilingual content
  const content = {
    en: {
      title: "Welcome Back",
      subtitle: "Sign in to your badminton community account",
      email: "Email Address",
      password: "Password",
      login: "Sign In",
      googleLogin: "Continue with Google",
      forgotPassword: "Forgot your password?",
      noAccount: "Don't have an account?",
      signUp: "Sign up",
      demoMode: "Demo Mode Active",
      demoCredentials: "Testing without Supabase database. Use these credentials:",
      or: "Or"
    },
    id: {
      title: "Selamat Datang Kembali",
      subtitle: "Masuk ke akun komunitas bulu tangkis Anda",
      email: "Alamat Email",
      password: "Kata Sandi",
      login: "Masuk",
      googleLogin: "Lanjutkan dengan Google",
      forgotPassword: "Lupa kata sandi?",
      noAccount: "Belum punya akun?",
      signUp: "Daftar",
      demoMode: "Mode Demo Aktif",
      demoCredentials: "Menguji tanpa database Supabase. Gunakan kredensial berikut:",
      or: "Atau"
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/dlob.png"
              alt="DLOB"
              width={80}
              height={80}
              className="rounded-full object-cover"
              priority
            />
          </div>
          {/* Language Switcher */}
          <div className="flex justify-center mb-4">
            <select 
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="en" className="text-gray-700">🇺🇸 EN</option>
              <option value="id" className="text-gray-700">🇮🇩 ID</option>
            </select>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
          <p className="text-gray-600 mt-2">{t.subtitle}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t.email}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t.password}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={async () => {
                    if (email) {
                      try {
                        const { resetPassword } = useAuth();
                        await resetPassword(email);
                        alert('Password reset email sent! Check your inbox.');
                      } catch (err: any) {
                        setError(err.message);
                      }
                    } else {
                      alert('Please enter your email address first.');
                    }
                  }}
                  className="text-blue-600 hover:text-blue-500"
                >
                  {t.forgotPassword}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {language === 'en' ? 'Signing in...' : 'Masuk...'}
                </div>
              ) : (
                t.login
              )}
            </button>
          </form>

          {/* Google Sign-In */}
          {!isDemoMode && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t.or}</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t.googleLogin}
                </button>
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Google Sign-In setup required in Supabase Dashboard
                </p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t.noAccount}</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                {t.signUp}
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Mode Info */}
        {isDemoMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-800">
              <strong>🎭 Demo Mode Active</strong><br/>
              Testing without Supabase database. Use these credentials:<br/>
              <strong>Admin:</strong> admin@dlob.com / password123<br/>
              <strong>Member:</strong> member@dlob.com / password123<br/>
              <em className="text-yellow-600">Set NEXT_PUBLIC_FORCE_DEMO_MODE=false when database is ready</em>
            </div>
          </div>
        )}

        {/* Legal Links */}
        <div className="text-center space-y-2">
          <div className="flex justify-center space-x-6 text-sm">
            <Link
              href="/terms"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              {language === 'en' ? 'Terms of Service' : 'Syarat dan Ketentuan'}
            </Link>
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              {language === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-500 text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}