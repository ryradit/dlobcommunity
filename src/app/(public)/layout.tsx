'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingAIChat from "@/components/FloatingAIChat";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        {children}
        <Footer />
        <FloatingAIChat />
      </div>
    </AuthProvider>
  );
}
