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
    const { userId, newEmail, newPassword, fullName } = await request.json();

    if (!userId || !newEmail || !newPassword) {
      return NextResponse.json(
        { error: 'Field yang diperlukan tidak lengkap' },
        { status: 400 }
      );
    }

    // Validate email
    if (!newEmail.includes('@') || newEmail.includes('@temp.dlob.local')) {
      return NextResponse.json(
        { error: 'Silakan masukkan alamat email yang valid' },
        { status: 400 }
      );
    }

    // Validate password
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password harus minimal 6 karakter' },
        { status: 400 }
      );
    }

    console.log('[Complete Profile] Updating profile for user:', userId);

    // Check if new email is already in use by another user
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUser?.users.some(
      u => u.email === newEmail && u.id !== userId
    );

    if (emailExists) {
      return NextResponse.json(
        { error: 'Alamat email sudah digunakan' },
        { status: 400 }
      );
    }

    // Update user email and password
    // The challenge: Supabase keeps old email_confirmed_at when changing email
    // Solution: Delete the old confirmation explicitly through raw SQL
    console.log('[Complete Profile] Updating user credentials...');
    
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email: newEmail,
        password: newPassword,
        email_confirm: false, // Mark email as unconfirmed
        user_metadata: {
          ...(fullName && { full_name: fullName })
        }
      }
    );

    if (updateError) {
      console.error('[Complete Profile] Update error:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Gagal memperbarui kredensial' },
        { status: 500 }
      );
    }

    console.log('[Complete Profile] ✅ User updated, now sending verification email via Resend...');

    // Update profile to mark as complete (but email not verified yet)
    // CRITICAL: Add pending_email_verification flag to block login
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        email: newEmail,
        ...(fullName && { full_name: fullName }),
        using_temp_email: false,
        must_change_password: false,
        pending_email_verification: true, // NEW: Block login until verified
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[Complete Profile] Profile update warning:', profileError);
      // Don't fail the whole operation for profile errors
    }

    // Send verification email using Resend
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: newEmail })
      });

      if (!emailResponse.ok) {
        console.error('[Complete Profile] Failed to send verification email');
        // Don't fail the operation - user can resend later
      } else {
        console.log('[Complete Profile] ✅ Verification email sent via Resend');
      }
    } catch (emailError) {
      console.error('[Complete Profile] Error sending verification email:', emailError);
      // Don't fail the operation - user can resend later
    }

    console.log('[Complete Profile] ✅ Profile completed for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui. Silakan cek email Anda untuk memverifikasi alamat baru Anda.',
      requiresVerification: true
    });

  } catch (error) {
    console.error('[Complete Profile] Error:', error);
    return NextResponse.json(
      {
        error: 'Gagal memperbarui profil',
        details: error instanceof Error ? error.message : 'Kesalahan tidak diketahui'
      },
      { status: 500 }
    );
  }
}
