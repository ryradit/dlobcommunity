'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GOOGLE_ICON = (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { user, loading, isAdmin, signOut, signInWithGoogle } = useAuth();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dashboardLink = isAdmin ? '/admin' : '/dashboard';
  const avatarUrl: string = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
  const displayName: string =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Member';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  /* ─── Shared: Avatar pill (dark variant for homepage, light for other) ─── */
  const AvatarDropdown = ({ dark = false }: { dark?: boolean }) => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
        className="flex items-center gap-1.5 p-1 rounded-full transition-all hover:opacity-80"
      >
        <div className="w-7 h-7 rounded-full overflow-hidden bg-[#4382C8] flex items-center justify-center flex-shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} width={28} height={28} className="object-cover w-full h-full" />
          ) : (
            <span className="text-xs font-black text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${avatarDropdownOpen ? 'rotate-180' : ''} ${dark ? 'text-white/60' : 'text-gray-400'}`}
        />
      </button>

      <AnimatePresence>
        {avatarDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Masuk sebagai</p>
              <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <div className="p-1.5">
              <Link
                href={dashboardLink}
                onClick={() => setAvatarDropdownOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#4382C8]/8 text-gray-700 hover:text-[#4382C8] transition-colors text-sm font-semibold group"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <button
                onClick={() => { setShowLogoutModal(true); setAvatarDropdownOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ─── Shared: Google sign-in button ─── */
  const GoogleButton = ({ dark = false }: { dark?: boolean }) => (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoggingIn}
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
        dark
          ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-md hover:scale-[1.02] active:scale-[0.98]'
          : 'bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 shadow-sm'
      }`}
    >
      {isLoggingIn ? (
        <svg className="w-3.5 h-3.5 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : GOOGLE_ICON}
      {isLoggingIn ? 'Memuat...' : 'Lanjutkan dengan Google'}
    </button>
  );

  /* ─── Shared: Mobile auth block ─── */
  const MobileAuthBlock = ({ dark = false }: { dark?: boolean }) => (
    <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
      {user ? (
        <>
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl mb-1 ${dark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#4382C8] flex items-center justify-center flex-shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} width={32} height={32} className="object-cover w-full h-full" />
              ) : (
                <span className="text-white text-xs font-black">{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className={`text-sm font-bold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{displayName}</p>
              <p className={`text-xs truncate max-w-[160px] ${dark ? 'text-white/50' : 'text-gray-400'}`}>{user?.email}</p>
            </div>
          </div>
          <Link
            href={dashboardLink}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              dark ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-[#4382C8]/10 text-[#4382C8]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <button
            onClick={() => { setShowLogoutModal(true); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </>
      ) : (
        <div className="flex gap-2">
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex-1 py-2 text-center rounded-xl text-sm font-semibold transition-colors ${
              dark ? 'text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10' : 'text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            Masuk
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex-1 py-2 text-center rounded-xl text-sm font-semibold transition-colors ${
              dark ? 'text-white bg-white/20 hover:bg-white/30' : 'text-white bg-[#4382C8] hover:bg-[#356ca8]'
            }`}
          >
            Daftar
          </Link>
        </div>
      )}
    </div>
  );

  // ── HOMEPAGE: Floating Glassmorphic Header ──────────────────────────────
  if (isHome) {
    return (
      <>
        <header className="fixed top-0 inset-x-0 z-50 w-full pt-3.5 sm:pt-5 px-3 sm:px-6 pointer-events-none transition-all duration-300">
          <nav className="max-w-6xl mx-auto pointer-events-auto">
            <div
              className={`relative transition-all duration-300 rounded-2xl sm:rounded-full ${
                scrolled || mobileMenuOpen
                  ? 'bg-zinc-950/90 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/50 py-2 sm:py-2.5 px-4 sm:px-6'
                  : 'bg-white/[0.05] backdrop-blur-md border border-white/10 shadow-lg py-2.5 sm:py-3 px-4 sm:px-6'
              }`}
            >
              <div className="flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
                  <Image
                    src="/dlob.png"
                    alt="DLOB Community Logo"
                    width={65}
                    height={65}
                    className="invert transition-transform duration-300 group-hover:scale-105"
                    style={{ width: 'auto', height: 'auto' }}
                    priority
                  />
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-white/15 text-white shadow-sm font-semibold'
                            : 'text-zinc-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Desktop Auth */}
                <div className="hidden md:flex items-center gap-2.5">
                  {loading ? (
                    <div className="w-20 h-7 bg-white/10 rounded-full animate-pulse" />
                  ) : user ? (
                    <AvatarDropdown dark />
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                      >
                        Masuk
                      </Link>
                      <Link
                        href="/register"
                        className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 shadow-sm transition-all"
                      >
                        Daftar
                      </Link>
                    </>
                  )}
                </div>

                {/* Mobile Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Toggle Navigation Menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>

              {/* Mobile Dropdown */}
              {mobileMenuOpen && (
                <div className="md:hidden pt-4 pb-2 border-t border-white/10 mt-3 space-y-1.5">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                          isActive ? 'bg-white/15 text-white font-semibold' : 'text-zinc-300 hover:text-white hover:bg-white/10'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  <MobileAuthBlock dark />
                </div>
              )}
            </div>
          </nav>
        </header>

        <LogoutModal show={showLogoutModal} onCancel={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
      </>
    );
  }

  // ── NON-HOMEPAGE: Standard Dark Sticky Header ──────────────────────────
  return (
    <>
      <nav className="sticky top-0 z-50 bg-zinc-950 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/dlob.png"
                alt="DLOB Community Logo"
                width={70}
                height={70}
                className="invert transition-all duration-300"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex space-x-1.5 bg-white/5 border border-white/10 rounded-full px-2 py-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all duration-200 ${
                      isActive ? 'text-white bg-white/15 font-semibold' : 'text-zinc-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-2.5">
              {loading ? (
                <div className="w-20 h-7 bg-white/10 rounded-full animate-pulse" />
              ) : user ? (
                <AvatarDropdown dark />
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-300 hover:text-white transition-all"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-white/20 hover:bg-white/30 border border-white/20 shadow-sm transition-all"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <MobileAuthBlock dark />
            </div>
          )}
        </div>
      </nav>

      <LogoutModal show={showLogoutModal} onCancel={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </>
  );
}

/* ─── Logout Confirmation Modal ─── */
function LogoutModal({
  show,
  onCancel,
  onConfirm,
}: {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {show && (
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
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-semibold text-sm"
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold text-sm"
              >
                Ya, Keluar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
