'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, RefreshCw, CheckCircle2, AlertCircle, LogOut, Inbox } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    setLoading(true);
    try {
      // Refresh session to get latest email_confirmed_at
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;

      const emailConfirmed = session?.user?.email_confirmed_at;
      const email = session?.user?.email;

      // If verified or using temp email, redirect to dashboard
      if (emailConfirmed || email?.includes('@temp.dlob.local')) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setResending(true);
    setMessage('');
    setMessageType('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      setMessage('✅ Email verifikasi berhasil dikirim! Silakan cek inbox Anda.');
      setMessageType('success');
    } catch (error) {
      setMessage('❌ Gagal mengirim email verifikasi. Silakan coba lagi.');
      setMessageType('error');
      console.error('Error resending verification:', error);
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage('Memeriksa status verifikasi...');
    setMessageType('');
    
    await checkVerificationStatus();
    
    if (!checking) {
      setMessage('Email Anda belum diverifikasi. Silakan cek inbox dan klik link verifikasi.');
      setMessageType('error');
    }
    setChecking(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-white">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-blue-500/20 rounded-full mb-4">
              <Mail className="w-12 h-12 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Verifikasi Email Diperlukan
            </h1>
            <p className="text-zinc-400 text-sm">
              Anda harus memverifikasi email sebelum mengakses dashboard
            </p>
          </div>

          {/* Email Display */}
          <div className="bg-zinc-800/40 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Inbox className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500 mb-0.5">Email Anda:</p>
                <p className="font-medium text-white truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-300 font-medium mb-2">
                  Langkah Verifikasi:
                </p>
                <ol className="text-xs text-yellow-200/80 space-y-1.5 list-decimal list-inside">
                  <li>Buka aplikasi email Anda</li>
                  <li>Cari email dari DLOB (cek folder spam jika tidak ada)</li>
                  <li>Klik link verifikasi dalam email</li>
                  <li>Kembali ke halaman ini dan klik "Cek Status Verifikasi"</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`rounded-xl p-3 mb-6 ${
              messageType === 'success' 
                ? 'bg-green-500/10 border border-green-500/30' 
                : messageType === 'error'
                ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-blue-500/10 border border-blue-500/30'
            }`}>
              <div className="flex gap-2 items-start">
                {messageType === 'success' && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />}
                {messageType === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                {!messageType && <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                <p className={`text-sm ${
                  messageType === 'success' 
                    ? 'text-green-300' 
                    : messageType === 'error'
                    ? 'text-red-300'
                    : 'text-blue-300'
                }`}>{message}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Check Status Button */}
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full px-6 py-4 bg-gradient-to-br from-[#3e6461] to-[#2d4a47] hover:from-[#3e6461]/90 hover:to-[#2d4a47]/90 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-white"
            >
              {checking ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memeriksa...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Cek Status Verifikasi
                </>
              )}
            </button>

            {/* Resend Email Button */}
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full px-6 py-3 bg-zinc-800/60 hover:bg-zinc-800 disabled:bg-zinc-800/40 disabled:cursor-not-allowed border border-white/10 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-white"
            >
              {resending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Kirim Ulang Email Verifikasi
                </>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-transparent hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/50 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-red-400"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>

          {/* Help Note */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-xs text-zinc-500 text-center">
              📧 Email belum diterima? Pastikan cek folder spam/junk.
              <br />
              Link verifikasi berlaku selama 24 jam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
