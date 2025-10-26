'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Trophy, Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dlob-language') || 'en';
    }
    return 'en';
  });

  const { register } = useAuth();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      return 'Please fill in all required fields.';
    }
    
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address.';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || undefined
      });
      
      setSuccess('Registration successful! Please check your email to verify your account.');
      
      // Redirect to login after a delay
      setTimeout(() => {
        router.push('/login?message=Please verify your email and then login');
      }, 2000);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = error.message || 'Registration failed. Please try again.';
      
      // Provide helpful error messages based on common issues
      if (error.message?.includes('Tables not found') || error.message?.includes('relation "members" does not exist')) {
        errorMessage = 'Database not set up yet. Please run the database schema or enable demo mode.';
      } else if (error.message?.includes('Permission denied') || error.message?.includes('RLS')) {
        errorMessage = 'Database permission issue. Please check your Supabase RLS policies.';
      } else if (error.message?.includes('Email already')) {
        errorMessage = 'This email is already registered. Please try logging in instead.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Bilingual content
  const content = {
    en: {
      title: "Join the Community",
      subtitle: "Create your badminton community account",
      fullName: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      password: "Password",
      confirmPassword: "Confirm Password",
      register: "Create Account",
      alreadyAccount: "Already have an account?",
      signIn: "Sign in",
      phoneOptional: "(Optional)",
      creating: "Creating Account..."
    },
    id: {
      title: "Bergabung dengan Komunitas",
      subtitle: "Buat akun komunitas bulu tangkis Anda",
      fullName: "Nama Lengkap",
      email: "Alamat Email",
      phone: "Nomor Telepon",
      password: "Kata Sandi",
      confirmPassword: "Konfirmasi Kata Sandi",
      register: "Buat Akun",
      alreadyAccount: "Sudah punya akun?",
      signIn: "Masuk",
      phoneOptional: "(Opsional)",
      creating: "Membuat Akun..."
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

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t.fullName}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                {t.phone} {t.phoneOptional}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your phone number"
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Create a password"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t.confirmPassword}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                {language === 'en' ? (
                  <>
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-500 underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                      Privacy Policy
                    </Link>
                  </>
                ) : (
                  <>
                    Saya setuju dengan{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-500 underline">
                      Syarat dan Ketentuan
                    </Link>{' '}
                    dan{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                      Kebijakan Privasi
                    </Link>
                  </>
                )}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t.creating}
                </div>
              ) : (
                t.register
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t.alreadyAccount}</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                {t.signIn}
              </Link>
            </div>
          </div>
        </div>

        {/* Registration Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <strong>New Member Registration:</strong> After registering, you'll receive an email verification link. 
            Please verify your email before logging in to access member features.
          </div>
        </div>



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