import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import EnhancedDlobChatbot from '@/components/EnhancedDlobChatbot';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DLOB - Badminton Community Platform",
  description: "AI-powered badminton community platform for attendance, matches, and payments",
  icons: {
    icon: [
      {
        url: '/dlob.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    shortcut: '/dlob.png',
    apple: [
      {
        url: '/dlob.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/dlob.png" />
        <link rel="shortcut icon" href="/dlob.png" />
        <link rel="apple-touch-icon" href="/dlob.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <EnhancedDlobChatbot />
        </AuthProvider>
      </body>
    </html>
  );
}
