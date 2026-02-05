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
      <Navbar />
      {children}
      <Footer />
      <FloatingAIChat />
    </AuthProvider>
  );
}
