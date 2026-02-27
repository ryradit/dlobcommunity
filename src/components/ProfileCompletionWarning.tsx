'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Mail, Send } from 'lucide-react';
import Link from 'next/link';

export default function ProfileCompletionWarning() {
  const { user } = useAuth();
  const [needsCompletion, setNeedsCompletion] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    async function checkProfileStatus() {
      console.log('[ProfileWarning] ==> RUNNING CHECK');
      if (!user) {
        console.log('[ProfileWarning] No user - NOT SHOWING WARNING');
        setLoading(false);
        return;
      }

      console.log('[ProfileWarning] User ID:', user.id);
      console.log('[ProfileWarning] User email:', user.email);

      try {
        // Check profile flags
        const { data: profile } = await supabase
          .from('profiles')
          .select('using_temp_email, must_change_password, email')
          .eq('id', user.id)
          .single();

        console.log('[ProfileWarning] Profile query result:', profile);
        console.log('[ProfileWarning] using_temp_email:', profile?.using_temp_email);
        console.log('[ProfileWarning] must_change_password:', profile?.must_change_password);

        // Check email verification status
        const { data: { session } } = await supabase.auth.getSession();
        const emailConfirmed = session?.user?.email_confirmed_at;
        const email = session?.user?.email;

        console.log('[ProfileWarning] Email status:', { email, emailConfirmed });

        // Show warning if:
        // 1. Still using temp credentials OR
        // 2. Email updated but not verified yet
        const hasTempCredentials = profile?.using_temp_email || profile?.must_change_password;
        const hasUnverifiedEmail = !emailConfirmed && email && !email.includes('@temp.dlob.local');

        console.log('[ProfileWarning] ==> FINAL CHECKS:');
        console.log('[ProfileWarning]    hasTempCredentials:', hasTempCredentials);
        console.log('[ProfileWarning]    hasUnverifiedEmail:', hasUnverifiedEmail);

        if (hasTempCredentials || hasUnverifiedEmail) {
          setNeedsCompletion(!!hasTempCredentials);
          setNeedsVerification(!!hasUnverifiedEmail);
          console.log('[ProfileWarning] ✅ WARNING SHOULD SHOW:', { 
            needsCompletion: !!hasTempCredentials, 
            needsVerification: !!hasUnverifiedEmail 
          });
        } else {
          setNeedsCompletion(false);
          setNeedsVerification(false);
          console.log('[ProfileWarning] ❌ NO WARNINGS NEEDED');
        }
      } catch (error) {
        console.error('[ProfileWarning] Error checking profile status:', error);
      } finally {
        setLoading(false);
      }
    }

    checkProfileStatus();

    // Auto-check every 30 seconds to detect when email is verified
    const interval = setInterval(checkProfileStatus, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleResendEmail = async () => {
    if (!user?.email || resendingEmail) return;

    try {
      setResendingEmail(true);
      setResendMessage('');

      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage('✅ Email verifikasi telah dikirim ulang! Silakan cek inbox Anda.');
      } else {
        setResendMessage('❌ ' + (data.error || 'Gagal mengirim email'));
      }

      // Clear message after 5 seconds
      setTimeout(() => setResendMessage(''), 5000);
    } catch (error) {
      console.error('Error resending verification:', error);
      setResendMessage('❌ Gagal mengirim email verifikasi');
      setTimeout(() => setResendMessage(''), 5000);
    } finally {
      setResendingEmail(false);
    }
  };

  if (loading || (!needsCompletion && !needsVerification)) {
    console.log('[ProfileWarning] ==> NOT RENDERING:', { loading, needsCompletion, needsVerification });
    return null;
  }

  console.log('[ProfileWarning] ==> RENDERING WARNING BANNER!');

  return (
    <div className={`border-l-4 p-4 mb-6 rounded-r-lg ${
      needsCompletion 
        ? 'bg-yellow-500/10 border-yellow-500' 
        : 'bg-blue-500/10 border-blue-500'
    }`}>
      {/* Remove X button - warning cannot be dismissed */}
      
      <div className="flex items-start gap-4">
        {needsCompletion ? (
          <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
        ) : (
          <Mail className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          {needsCompletion ? (
            <>
              <h3 className="text-yellow-500 font-semibold mb-1">
                🔒 Profil Belum Lengkap (Wajib)
              </h3>
              <p className="text-yellow-200/80 text-sm mb-2">
                Anda masih menggunakan email sementara dan password default. 
                <strong className="text-yellow-300"> Harap perbarui dengan email asli dan password baru Anda untuk keamanan akun.</strong>
              </p>
              <p className="text-yellow-300/90 text-xs mb-3">
                ⚠️ <strong>Penting:</strong> Pengaturan profil tidak bisa diubah sampai Anda lengkapi data ini.
              </p>
              <Link
                href="/dashboard/complete-profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 
                         text-black font-medium rounded-lg transition-colors text-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                Lengkapi Profil Sekarang
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-blue-500 font-semibold mb-1">
                📧 Email Belum Diverifikasi (Wajib)
              </h3>
              <p className="text-blue-200/80 text-sm mb-2">
                Anda telah memperbarui email, tetapi belum diverifikasi. 
                <strong className="text-blue-300"> Silakan cek inbox email Anda dan klik link verifikasi.</strong>
              </p>
              <p className="text-blue-300/90 text-xs mb-2">
                💡 <strong>Tips:</strong> Cek folder spam jika email tidak ditemukan. 
                Warning akan hilang otomatis setelah email diverifikasi.
              </p>
              <p className="text-blue-300/90 text-xs mb-3">
                ⚠️ <strong>Penting:</strong> Pengaturan profil tidak bisa diubah sampai email diverifikasi.
              </p>
              
              {resendMessage && (
                <div className={`mb-3 p-2 rounded text-xs ${
                  resendMessage.startsWith('✅') 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {resendMessage}
                </div>
              )}

              <button
                onClick={handleResendEmail}
                disabled={resendingEmail}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 
                         text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendingEmail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim Ulang Email Verifikasi
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
