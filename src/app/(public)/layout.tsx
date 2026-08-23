'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingAIChat from "@/components/FloatingAIChat";
import { usePathname } from 'next/navigation';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className={isHome ? '' : 'pt-24 sm:pt-28'}>
          {children}
        </div>
        <Footer />
        <FloatingAIChat />
      </div>
    </AuthProvider>
  );
}
