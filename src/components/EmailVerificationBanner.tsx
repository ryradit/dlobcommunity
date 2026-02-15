'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Mail, X, RefreshCw } from 'lucide-react';

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [needsVerification, setNeedsVerification] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    async function checkEmailVerification() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get current session to check email_confirmed_at
        const { data: { session } } = await supabase.auth.getSession();
        
        // Check if email is verified
        const emailConfirmed = session?.user?.email_confirmed_at;
        const email = session?.user?.email;

        // Show banner if email is not confirmed and not a temp email
        if (!emailConfirmed && email && !email.includes('@temp.dlob.local')) {
          setNeedsVerification(true);
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
      } finally {
        setLoading(false);
      }
    }

    checkEmailVerification();

    // Recheck every 30 seconds in case user verifies in another tab
    const interval = setInterval(checkEmailVerification, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setResending(true);
    setResendMessage('');

    try {
      // Resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      setResendMessage('✅ Verification email sent! Please check your inbox.');
    } catch (error) {
      setResendMessage('❌ Failed to send verification email. Please try again later.');
      console.error('Error resending verification:', error);
    } finally {
      setResending(false);
    }
  };

  if (loading || !needsVerification || dismissed) {
    return null;
  }

  return (
    <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-blue-500/60 hover:text-blue-500 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="flex items-start gap-4">
        <Mail className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-blue-500 font-semibold mb-1">
            📧 Verifikasi Email Diperlukan
          </h3>
          <p className="text-blue-200/80 text-sm mb-3">
            Kami telah mengirim email verifikasi ke <strong>{user?.email}</strong>. 
            Silakan cek inbox Anda dan klik link verifikasi untuk mengaktifkan akun sepenuhnya.
          </p>
          
          {resendMessage && (
            <p className="text-sm mb-3 text-blue-300">
              {resendMessage}
            </p>
          )}
          
          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 
                     disabled:bg-blue-500/50 disabled:cursor-not-allowed
                     text-white font-medium rounded-lg transition-colors text-sm"
          >
            {resending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Kirim Ulang Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
