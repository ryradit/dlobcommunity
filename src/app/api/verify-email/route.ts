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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (!token || !userId) {
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_verification_link', request.url)
      );
    }

    console.log('[Verify Email] Verifying token for user:', userId);

    // Check if token is valid and not expired
    const { data: verification, error: verifyError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('token', token)
      .single();

    if (verifyError || !verification) {
      console.error('[Verify Email] Token not found:', verifyError);
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_token', request.url)
      );
    }

    // Check if token is expired
    const expiresAt = new Date(verification.expires_at);
    if (expiresAt < new Date()) {
      console.error('[Verify Email] Token expired');
      return NextResponse.redirect(
        new URL('/dashboard?error=token_expired', request.url)
      );
    }

    // Get user from auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      console.error('[Verify Email] User not found:', userError);
      return NextResponse.redirect(
        new URL('/dashboard?error=user_not_found', request.url)
      );
    }

    console.log('[Verify Email] Confirming email for:', userData.user.email);

    // Mark email as confirmed in Supabase Auth
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email_confirm: true // Mark email as confirmed
      }
    );

    if (confirmError) {
      console.error('[Verify Email] Error confirming email:', confirmError);
      return NextResponse.redirect(
        new URL('/dashboard?error=verification_failed', request.url)
      );
    }

    // CRITICAL: Clear pending_email_verification flag to allow login
    const { error: flagError } = await supabaseAdmin
      .from('profiles')
      .update({ pending_email_verification: false })
      .eq('id', userId);

    if (flagError) {
      console.error('[Verify Email] Error clearing pending flag:', flagError);
      // Don't fail the operation - email is still confirmed
    } else {
      console.log('[Verify Email] ✅ Pending verification flag cleared');
    }

    // Delete verification token (one-time use)
    await supabaseAdmin
      .from('email_verifications')
      .delete()
      .eq('user_id', userId);

    console.log('[Verify Email] ✅ Email verified successfully!');

    // Redirect to login with success message instead of dashboard
    // This ensures clean session start with proper auth checks
    return NextResponse.redirect(
      new URL('/login?message=email-verified', request.url)
    );

  } catch (error: any) {
    console.error('[Verify Email] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?error=unexpected_error', request.url)
    );
  }
}
