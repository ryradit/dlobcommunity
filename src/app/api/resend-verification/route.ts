import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email diperlukan' },
        { status: 400 }
      );
    }

    console.log('[Resend Verification] Resending confirmation email to:', email);

    // Find the user by email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Send verification email using our Resend API
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          email: email 
        })
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error('[Resend Verification] Email API error:', errorData);
        return NextResponse.json(
          { error: 'Gagal mengirim email verifikasi' },
          { status: 500 }
        );
      }

      console.log('[Resend Verification] ✅ Verification email sent via Resend to:', email);

      return NextResponse.json({
        success: true,
        message: 'Email verifikasi telah dikirim ulang. Silakan cek inbox Anda.'
      });

    } catch (emailError) {
      console.error('[Resend Verification] Error sending email:', emailError);
      return NextResponse.json(
        { error: 'Gagal mengirim email verifikasi' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Resend Verification] Error:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim email verifikasi' },
      { status: 500 }
    );
  }
}
