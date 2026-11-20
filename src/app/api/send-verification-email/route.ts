import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

// Create SMTP transporter using DreamHost email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.dreamhost.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // Use SSL
  auth: {
    user: process.env.SMTP_USER, // e.g., support@dlobcommunity.com
    pass: process.env.SMTP_PASS, // Your email password
  },
});

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

    // Fetch user's full name for personalization
    let recipientName = 'Member DLOB';
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
      if (profile?.full_name?.trim()) {
        recipientName = profile.full_name.trim();
      }
    } catch (err) {
      console.warn('[Send Verification] Could not fetch profile name:', err);
    }

    // Generate verification token (valid for 24 hours)
    const verificationToken = await generateVerificationToken(userId);
    
    // Create verification link with robust domain detection
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    let siteUrl = host ? `${proto}://${host}` : (request.nextUrl.origin || 'https://dlobcommunity.com');
    if (siteUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
      siteUrl = 'https://dlobcommunity.com';
    }
    const verificationLink = `${siteUrl}/api/verify-email?token=${verificationToken}&userId=${userId}`;
    
    console.log('[Send Verification] Sending email to:', email);
    console.log('[Send Verification] Verification link:', verificationLink);

    // Prepare logo attachment via CID so it renders without being blocked
    const attachments: any[] = [];
    const logoFile = path.join(process.cwd(), 'public/dlob.png');
    let hasCidLogo = false;
    if (fs.existsSync(logoFile)) {
      attachments.push({
        filename: 'dlob-logo.png',
        path: logoFile,
        cid: 'dloblogo',
      });
      hasCidLogo = true;
    }

    const logoSrc = hasCidLogo ? 'cid:dloblogo' : 'https://dlobcommunity.com/dlob.png';

    // Minimal, authentic DLOB styling: clean white card, deep obsidian type, signature DLOB blue
    const emailHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Email - DLOB Badminton Community</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px -2px rgba(0,0,0,0.05);">
          
          <!-- Top Header Bar with DLOB Logo -->
          <tr>
            <td style="padding:28px 36px 20px;border-bottom:1px solid #f4f4f5;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="${logoSrc}" alt="D'LOB Badminton" width="130" style="display:block;border:0;outline:none;" />
                  </td>
                  <td style="vertical-align:middle;text-align:right;">
                    <span style="display:inline-block;padding:4px 10px;font-size:11px;font-weight:600;letter-spacing:0.5px;color:#2563eb;background-color:#eff6ff;border:1px solid #dbeafe;border-radius:20px;text-transform:uppercase;">
                      Official Verification
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Body Content -->
          <tr>
            <td style="padding:32px 36px 28px;">
              <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#09090b;line-height:1.3;">
                Verifikasi Alamat Email Anda
              </h1>
              
              <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#27272a;">
                Halo <strong>${recipientName}</strong>,
              </p>
              
              <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#52525b;">
                Terima kasih telah bergabung di <strong>D'LOB Badminton Community</strong>. Untuk mengaktifkan akun Anda secara penuh dan mengamankan akses ke platform, silakan konfirmasi alamat email Anda dengan menekan tombol di bawah ini:
              </p>

              <!-- Primary Action Button (DLOB Signature Blue) -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 30px;width:100%;">
                <tr>
                  <td align="center">
                    <a href="${verificationLink}" 
                       target="_blank"
                       style="display:inline-block;padding:14px 36px;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;text-align:center;box-shadow:0 2px 8px rgba(37,99,235,0.25);">
                      Verifikasi Email Saya
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry & Security Notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">
                <tr>
                  <td style="font-size:12px;line-height:1.5;color:#64748b;">
                    ⏰ <strong>Masa Berlaku:</strong> Tautan ini berlaku selama <strong>24 jam</strong>. Jika Anda tidak merasa membuat atau memperbarui akun di DLOB, abaikan email ini dengan aman.
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct URL -->
              <p style="margin:0 0 8px;font-size:12px;color:#71717a;line-height:1.5;">
                Jika tombol di atas tidak dapat diklik, salin dan tempel tautan berikut ke browser Anda:
              </p>
              <div style="background-color:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:12px 14px;word-break:break-all;">
                <a href="${verificationLink}" style="font-size:12px;color:#2563eb;text-decoration:none;font-family:monospace;">
                  ${verificationLink}
                </a>
              </div>
            </td>
          </tr>

          <!-- Clean Minimal Footer -->
          <tr>
            <td style="padding:24px 36px;background-color:#fafafa;border-top:1px solid #f4f4f5;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#27272a;">
                D'LOB Badminton Community
              </p>
              <p style="margin:0 0 8px;font-size:11px;color:#71717a;">
                Main Bareng, Tumbuh Bareng, Juara Bareng.
              </p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                © ${new Date().getFullYear()} D'LOB. Email ini dikirim secara otomatis oleh sistem, mohon tidak membalas.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send email using DreamHost SMTP
    const mailOptions: any = {
      from: `D'LOB Community <${process.env.SMTP_USER || 'support@dlobcommunity.com'}>`,
      to: email,
      subject: '[No-Reply] Verifikasi Email Anda — D\'LOB Badminton Community',
      html: emailHtml,
    };

    if (attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('[Send Verification] ✅ Email sent successfully!', info.messageId);

      return NextResponse.json({
        success: true,
        message: 'Email verifikasi berhasil dikirim',
        emailId: info.messageId
      });
    } catch (error: any) {
      console.error('[Send Verification] SMTP error:', error);
      return NextResponse.json(
        { error: 'Gagal mengirim email verifikasi', details: error.message },
        { status: 500 }
      );
    }

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
