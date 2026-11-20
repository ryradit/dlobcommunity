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

    const cleanEmail = email.trim();

    // 1. Try finding user in profiles table first (indexed, fast, no 50-item limit)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    let userId = profile?.id;

    // 2. Fallback to auth.admin.listUsers with large perPage if not found in profiles
    if (!userId) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const user = users?.users.find(u => u.email?.toLowerCase() === cleanEmail.toLowerCase());
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Determine site URL dynamically from request or env
    const siteUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://dlobcommunity.com';

    // Send verification email using our internal API
    try {
      const emailResponse = await fetch(`${siteUrl}/api/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          email: cleanEmail 
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
