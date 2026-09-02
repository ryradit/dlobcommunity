'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const GOOGLE_ICON = (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function LoginPromptModal() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [visible, setVisible] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (loading || user) {
      setVisible(false);
      return;
    }

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('dlob_quick_login_dismissed');
    if (isDismissed) return;

    // Smooth entrance timer
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [user, loading]);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('dlob_quick_login_dismissed', 'true');
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading || user) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="fixed top-20 right-4 sm:right-6 z-[80] w-[310px]"
        >
          {/* Card Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-4.5 overflow-hidden">
            {/* Subtle brand ambient glow */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-radial from-[#4382C8]/15 to-transparent rounded-full pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2.5 relative">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#4382C8] flex items-center justify-center text-white font-black text-sm shadow-sm flex-shrink-0">
                  D
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 leading-tight">DLOB Community</h4>
                  <p className="text-[11px] text-gray-400 font-medium">Akses Cepat Member</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 mb-3.5 leading-relaxed relative">
              Masuk dengan akun Google untuk akses fitur lengkap jadwal mabar & statistik.
            </p>

            {/* Google Sign In Button */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 px-3.5 rounded-xl bg-white border border-gray-200 hover:border-[#4382C8]/40 hover:bg-slate-50 text-gray-800 font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoggingIn ? (
                <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : GOOGLE_ICON}
              <span>{isLoggingIn ? 'Mengarahkan...' : 'Lanjutkan dengan Google'}</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
