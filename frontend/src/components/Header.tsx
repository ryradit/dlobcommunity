'use client';

import Link from "next/link";
import { Trophy, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useLanguage, LanguageSwitcher } from "@/hooks/useLanguage";

interface HeaderProps {
  currentPage?: 'home' | 'about' | 'contact' | 'gallery';
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
        contact: "Contact",
        gallery: "Gallery"
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
        contact: "Kontak",
        gallery: "Gallery"
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
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80">
            <div className="rounded-full bg-blue-600 p-2">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">DLOB</h1>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link 
              href="/" 
              className={`transition-colors ${
                currentPage === 'home' 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {t.nav.home}
            </Link>
            <Link 
              href="/about" 
              className={`transition-colors ${
                currentPage === 'about' 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {t.nav.about}
            </Link>
            <Link 
              href="/contact" 
              className={`transition-colors ${
                currentPage === 'contact' 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {t.nav.contact}
            </Link>
            <Link 
              href="/gallery" 
              className={`transition-colors ${
                currentPage === 'gallery' 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {t.nav.gallery}
            </Link>
          </nav>
          
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
                      className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      <User className="h-4 w-4 mr-1" />
                      {t.auth.dashboard}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 border border-red-600 rounded-lg hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      {t.auth.logout}
                    </button>
                  </div>
                ) : (
                  // Guest user menu - show even when loading
                  <div className="flex space-x-2">
                    <Link
                      href="/login"
                      className="px-4 py-2 text-blue-600 hover:text-blue-700"
                    >
                      {t.auth.login}
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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