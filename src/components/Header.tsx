'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, LogOut, ChevronDown, Menu, X } from 'lucide-react';

const GOOGLE_ICON = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { user, signOut, signInWithGoogle, isAdmin } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dashboardLink = isAdmin ? '/admin' : '/dashboard';

  const avatarUrl: string =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    '';
  const displayName: string =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Member';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAvatarDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
    setAvatarDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/tentang', label: 'Tentang' },
    { href: '/galeri', label: 'Galeri' },
    { href: '/store', label: 'Store' },
    { href: '/artikel', label: 'Artikel' },
    { href: '/kontak', label: 'Kontak' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex justify-between items-center">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#4382C8] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">
                D
              </div>
              <span className="text-lg font-black text-gray-900 tracking-tight">DLOB Community</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Area */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                /* ── Signed In: Avatar Dropdown ── */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                    className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#4382C8] flex items-center justify-center flex-shrink-0">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={displayName}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-white text-xs font-black">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 max-w-[100px] truncate">
                      {displayName}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${avatarDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {avatarDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                      >
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs text-gray-400 font-medium">Masuk sebagai</p>
                          <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>

                        <div className="p-1.5">
                          <Link
                            href={dashboardLink}
                            onClick={() => setAvatarDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#4382C8]/8 text-gray-700 hover:text-[#4382C8] transition-colors text-sm font-semibold group"
                          >
                            <LayoutDashboard className="w-4 h-4 group-hover:text-[#4382C8]" />
                            Dashboard
                          </Link>

                          <button
                            onClick={() => { setShowLogoutModal(true); setAvatarDropdownOpen(false); }}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors text-sm font-semibold group"
                          >
                            <LogOut className="w-4 h-4 group-hover:text-red-500" />
                            Keluar
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* ── Not Signed In: Continue with Google ── */
                <motion.button
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold text-sm shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isLoggingIn ? (
                    <svg className="w-4 h-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : GOOGLE_ICON}
                  {isLoggingIn ? 'Memuat...' : 'Lanjutkan dengan Google'}
                </motion.button>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="md:hidden overflow-hidden"
              >
                <div className="pt-4 pb-2 space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#4382C8]/8 hover:text-[#4382C8] rounded-xl transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <div className="border-t border-gray-100 pt-3 mt-3 space-y-1">
                    {user ? (
                      <>
                        {/* Mobile user info */}
                        <div className="flex items-center gap-3 px-4 py-2 mb-1">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-[#4382C8] flex items-center justify-center flex-shrink-0">
                            {avatarUrl ? (
                              <Image src={avatarUrl} alt={displayName} width={36} height={36} className="object-cover w-full h-full" />
                            ) : (
                              <span className="text-white text-sm font-black">{displayName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{displayName}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">{user.email}</p>
                          </div>
                        </div>

                        <Link
                          href={dashboardLink}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#4382C8] bg-[#4382C8]/8 rounded-xl"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <button
                          onClick={() => { setShowLogoutModal(true); setMobileMenuOpen(false); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Keluar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { handleGoogleSignIn(); setMobileMenuOpen(false); }}
                        disabled={isLoggingIn}
                        className="flex items-center justify-center gap-2.5 w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold text-sm shadow-sm transition-all disabled:opacity-60"
                      >
                        {isLoggingIn ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : GOOGLE_ICON}
                        {isLoggingIn ? 'Memuat...' : 'Lanjutkan dengan Google'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Konfirmasi Keluar</h3>
                  <p className="text-sm text-gray-500">Anda akan keluar dari akun DLOB.</p>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-semibold text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold text-sm"
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
