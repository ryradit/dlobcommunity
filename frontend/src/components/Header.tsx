'use client';

import Link from "next/link";
import Image from "next/image";
import { User, LogOut, Menu, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useLanguage, LanguageSwitcher } from "@/hooks/useLanguage";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  currentPage?: 'home' | 'about' | 'contact' | 'gallery' | 'store' | 'artikel';
  showAuth?: boolean;
}

export default function Header({ currentPage = 'home', showAuth = false }: HeaderProps) {
  const { language } = useLanguage();
  const { user, loading, logout } = showAuth ? useAuth() : { user: null, loading: false, logout: () => {} };
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const content = {
    en: {
      nav: {
        home: "Home",
        about: "About",
        gallery: "Gallery",
        store: "Store",
        artikel: "Articles",
        contact: "Contact"
      },
      auth: {
        login: "Login",
        logout: "Logout",
        joinCommunity: "Join Community",
        dashboard: "Dashboard"
      }
    },
    id: {
      nav: {
        home: "Beranda", 
        about: "Tentang",
        gallery: "Gallery",
        store: "Store",
        artikel: "Artikel",
        contact: "Kontak"
      },
      auth: {
        login: "Masuk",
        logout: "Keluar",
        joinCommunity: "Gabung Komunitas",
        dashboard: "Dashboard"
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      router.refresh();
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="bg-white rounded-full p-2">
              <Image
                src="/dlob.png"
                alt="DLOB"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
          </Link>
          
          {/* Navigation - Desktop Only */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className={`text-sm transition-colors font-medium ${
                currentPage === 'home' 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.nav.home}
            </Link>
            <Link 
              href="/about" 
              className={`text-sm transition-colors font-medium ${
                currentPage === 'about' 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.nav.about}
            </Link>
            <Link 
              href="/gallery" 
              className={`text-sm transition-colors font-medium ${
                currentPage === 'gallery' 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.nav.gallery}
            </Link>
            <Link 
              href="/store" 
              className={`text-sm transition-colors font-medium ${
                currentPage === 'store' 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.nav.store}
            </Link>
            <Link 
              href="/artikel" 
              className={`text-sm transition-colors font-medium ${
                currentPage === 'artikel' 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.nav.artikel}
            </Link>
            <Link 
              href="/contact" 
              className={`text-sm transition-colors font-medium ${
                currentPage === 'contact' 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.nav.contact}
            </Link>
          </nav>
          
          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher - Desktop */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Authentication Menu - Desktop Only */}
            {showAuth && (
              <div className="hidden md:flex items-center space-x-3">
                {user ? (
                  <>
                    <Link
                      href={user.role === 'admin' ? "/admin" : "/dashboard"}
                      className="flex items-center px-4 py-2 text-sm text-white border border-gray-600 rounded-lg hover:bg-white/10"
                    >
                      <User className="h-4 w-4 mr-1" />
                      {t.auth.dashboard}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded-lg hover:bg-white/10"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      {t.auth.logout}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-4 py-2 text-sm text-gray-300 hover:text-white"
                    >
                      {t.auth.login}
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-lg bg-white px-6 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors"
                    >
                      {t.auth.joinCommunity}
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Toggle menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col p-4 bg-black/95 md:hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="bg-white rounded-full p-2">
                  <Image
                    src="/dlob.png"
                    alt="DLOB"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Language Selector - Mobile */}
            <div className="mb-6">
              <LanguageSwitcher />
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col space-y-4 mb-8 flex-1">
              <Link 
                href="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-lg text-white hover:text-gray-300 pb-4 border-b border-gray-800"
              >
                {t.nav.home}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/about" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-lg text-white hover:text-gray-300 pb-4 border-b border-gray-800"
              >
                {t.nav.about}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/gallery" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-lg text-white hover:text-gray-300 pb-4 border-b border-gray-800"
              >
                {t.nav.gallery}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/store" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-lg text-white hover:text-gray-300 pb-4 border-b border-gray-800"
              >
                {t.nav.store}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/artikel" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-lg text-white hover:text-gray-300 pb-4 border-b border-gray-800"
              >
                {t.nav.artikel}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-lg text-white hover:text-gray-300 pb-4 border-b border-gray-800"
              >
                {t.nav.contact}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </nav>

            {/* Mobile Auth Buttons */}
            {showAuth && (
              <div className="flex flex-col gap-3">
                {user ? (
                  <>
                    <Link
                      href={user.role === 'admin' ? "/admin" : "/dashboard"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center px-4 py-3 text-white border border-gray-600 rounded-lg hover:bg-white/10"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t.auth.dashboard}
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center px-4 py-3 text-gray-300 border border-gray-600 rounded-lg hover:bg-white/10"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t.auth.logout}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 text-center text-white border border-gray-600 rounded-lg hover:bg-white/10"
                    >
                      {t.auth.login}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 text-center bg-white text-black rounded-full font-medium hover:bg-white/90"
                    >
                      {t.auth.joinCommunity}
                    </Link>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}