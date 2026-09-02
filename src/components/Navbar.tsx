'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/tentang', label: 'Tentang' },
    { href: '/galeri', label: 'Galeri' },
    { href: '/store', label: 'Store' },
    { href: '/artikel', label: 'Artikel' },
    { href: '/kontak', label: 'Kontak' },
  ];

  // ── HOMEPAGE: Floating Glassmorphic Header (Seamless into Hero) ───────
  if (isHome) {
    return (
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

              {/* Desktop Navigation Links */}
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

              {/* Auth Buttons */}
              <div className="hidden md:flex items-center gap-2.5">
                {loading ? (
                  <div className="w-20 h-8 bg-white/10 rounded-full animate-pulse" />
                ) : user ? (
                  <Link
                    href="/dashboard"
                    className="px-4 py-1.5 rounded-full text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-100 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Dashboard
                  </Link>
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
                      className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 shadow-sm transition-all active:scale-95"
                    >
                      Daftar
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {/* Mobile Dropdown Panel */}
            {mobileMenuOpen && (
              <div className="md:hidden pt-4 pb-2 border-t border-white/10 mt-3 space-y-1.5 animate-fade-in">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-white/15 text-white font-semibold'
                          : 'text-zinc-300 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="border-t border-white/10 pt-3 mt-3 flex flex-col gap-2">
                  {user ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-2.5 rounded-xl text-center text-sm font-bold text-zinc-950 bg-white hover:bg-zinc-100 transition-colors"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <div className="flex gap-2">
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex-1 py-2 text-center rounded-xl text-sm font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        Masuk
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex-1 py-2 text-center rounded-xl text-sm font-semibold text-white bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        Daftar
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>
    );
  }

  // ── NON-HOMEPAGE: Standard Simple Sticky Header ────────────────────────
  return (
    <nav className="sticky top-0 z-50 bg-zinc-950 border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1.5 bg-white/5 border border-white/10 rounded-full px-2 py-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-white/15 font-semibold shadow-xs'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {loading ? (
              <div className="w-20 h-8 bg-white/10 rounded-full animate-pulse"></div>
            ) : user ? (
              <Link
                href="/dashboard"
                className="px-4 py-1.5 rounded-full text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-100 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-300 hover:text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-white/20 hover:bg-white/30 border border-white/20 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2.5 rounded-full text-base font-medium text-zinc-300 hover:text-white hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-full text-base font-bold text-zinc-950 bg-white hover:bg-zinc-100 text-center"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 rounded-full text-base font-medium text-zinc-300 hover:text-white text-center bg-white/5"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 rounded-full text-base font-medium text-white bg-white/20 text-center"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
