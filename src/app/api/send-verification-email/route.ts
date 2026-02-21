import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    // Generate verification token (valid for 24 hours)
    const verificationToken = await generateVerificationToken(userId);
    
    // Create verification link
    const verificationLink = `${process.env.NEXT_PUBLIC_SITE_URL}/api/verify-email?token=${verificationToken}&userId=${userId}`;
    
    console.log('[Send Verification] Sending email to:', email);
    console.log('[Send Verification] Verification link:', verificationLink);

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'DLOB System <noreply@dlobcommunity.com>',
      to: [email],
      subject: 'Verifikasi Email Anda - DLOB',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verifikasi Email - DLOB</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <img src="https://dlobcommunity.com/dlob.png" alt="DLOB Logo" style="width: 80px; height: auto; margin-bottom: 20px;" />
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">DLOB</h1>
                        <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px;">Badminton Community</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Verifikasi Email Anda</h2>
                        
                        <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                          Terima kasih telah melengkapi profil Anda di DLOB! Untuk mengaktifkan akun Anda sepenuhnya, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:
                        </p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="margin: 30px 0; width: 100%;">
                          <tr>
                            <td align="center">
                              <a href="${verificationLink}" 
                                 style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                                ✅ Verifikasi Email Saya
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0; color: #999999; font-size: 14px; line-height: 1.5;">
                          Atau, salin dan tempel link berikut di browser Anda:
                        </p>
                        
                        <div style="padding: 15px; background-color: #f8f9fa; border-radius: 4px; border-left: 4px solid #667eea; word-break: break-all;">
                          <code style="color: #667eea; font-size: 12px;">${verificationLink}</code>
                        </div>
                        
                        <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                          <strong>⏰ Link verifikasi ini berlaku selama 24 jam.</strong>
                        </p>
                        
                        <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                          Jika Anda tidak melakukan pendaftaran di DLOB, abaikan email ini.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="margin: 0; color: #999999; font-size: 12px;">
                          © ${new Date().getFullYear()} DLOB Badminton Community. All rights reserved.
                        </p>
                        <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px;">
                          Email ini dikirim secara otomatis, mohon tidak membalas.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Send Verification] Resend error:', error);
      return NextResponse.json(
        { error: 'Gagal mengirim email verifikasi', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Send Verification] ✅ Email sent successfully!', data);

    return NextResponse.json({
      success: true,
      message: 'Email verifikasi berhasil dikirim',
      emailId: data?.id
    });

  } catch (error: any) {
    console.error('[Send Verification] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan', details: error.message },
      { status: 500 }
    );
  }
}

// Generate verification token
async function generateVerificationToken(userId: string): Promise<string> {
  const token = Buffer.from(
    JSON.stringify({
      userId,
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2)
    })
  ).toString('base64url');

  // Store token in database with expiry
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

  await supabaseAdmin.from('email_verifications').upsert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString()
  });

  return token;
}
