'use client';

import Link from "next/link";
import Image from "next/image";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useLanguage, LanguageSwitcher } from "@/hooks/useLanguage";

interface HeaderProps {
  currentPage?: 'home' | 'about' | 'contact' | 'gallery' | 'store' | 'artikel';
  showAuth?: boolean;
}

export default function Header({ currentPage = 'home', showAuth = false }: HeaderProps) {
  const { language } = useLanguage();
  const { user, loading, logout } = showAuth ? useAuth() : { user: null, loading: false, logout: () => {} };
  const router = useRouter();

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
          
          {/* Navigation */}
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
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Authentication Menu - Only show if showAuth is true */}
            {showAuth && (
              <>
                {user ? (
                  // Authenticated user menu
                  <div className="flex items-center space-x-3">
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
                  </div>
                ) : (
                  // Guest user menu - show even when loading
                  <div className="flex items-center space-x-3">
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
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}