# Email Verification & Login Blocking - Configuration Guide

## 🔍 Issues Identified

1. **No verification email sent** after email update
2. **Can login without email verification** (should be blocked)

## ⚙️ Root Causes

### 1. Supabase Email Configuration
By default, Supabase uses their built-in email service which:
- May not be configured properly
- Might not send emails in development
- Needs SMTP setup for production

### 2. Supabase Auth Settings
By default, Supabase **allows login with unconfirmed emails**. This must be changed.

---

## ✅ Solutions Implemented

### Code Changes Made:

1. **Enhanced Email Sending** (`/api/complete-profile/route.ts`)
   - Now uses `generateLink` to manually trigger confirmation email
   - Better error handling for email sending issues
   - More logging for debugging

2. **Resend Email Feature** (`/api/resend-verification/route.ts`)
   - New API endpoint to resend verification emails
   - Users can request new email if not received

3. **Resend Email Button** (`ProfileCompletionWarning` component)
   - Added "Kirim Ulang Email Verifikasi" button
   - Visible in blue warning (unverified email state)
   - Shows success/error messages

---

## 🔧 Required Supabase Configuration

### CRITICAL: Enable Email Confirmation Requirement

**Option A: Via Supabase Dashboard (REQUIRED)**

1. Go to: **Supabase Dashboard** → Your Project
2. Navigate to: **Authentication** → **Settings**
3. Scroll to: **Email Auth** section
4. Find: **"Confirm email"** setting
5. **Enable it** (toggle ON)
6. Click **Save**

This ensures users CANNOT login without confirming their email first.

---

### Email Sending Configuration

#### For Development/Testing:

**Option 1: Use Supabase Test Email Service**
- Supabase shows confirmation links in logs (not sent to actual email)
- Good for testing, but users won't receive real emails
- Check Supabase Dashboard → Authentication → Users → Click user → See confirmation link

**Option 2: Configure SMTP (Recommended for Production)**

1. Go to: **Supabase Dashboard** → **Project Settings** → **Auth**
2. Scroll to: **SMTP Settings** section
3. Enable **"Enable custom SMTP"**
4. Fill in SMTP details:
   ```
   Host: smtp.gmail.com (for Gmail)
   Port: 587
   User: your-email@gmail.com
   Password: your-app-password
   Sender email: your-email@gmail.com
   Sender name: DLOB System
   ```
5. **Save** changes

#### Getting Gmail App Password:
1. Go to: https://myaccount.google.com/apppasswords
2. Select: **Mail** and **Other (Custom name)**
3. Name it: "Supabase DLOB"
4. Click **Generate**
5. Copy the 16-character password
6. Use this in SMTP settings

---

## 📧 Email Template Configuration

### Confirm Email Template

1. Go to: **Authentication** → **Email Templates**
2. Find: **Confirm signup** template
3. Customize if needed (default works):
   ```html
   <h2>Confirm your signup</h2>
   <p>Follow this link to confirm your email:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
   ```
4. Make sure **Confirmation URL** redirects to: `{{ .SiteURL }}/dashboard`

---

## 🧪 Testing the Complete Flow

### Test Scenario 1: New Email Update

1. **Login** with temp credentials:
   ```
   Email: temptest@temp.dlob.local
   Password: DLOB2026
   ```

2. **See Yellow Warning** (non-dismissible)
   - "🔒 Profil Belum Lengkap (Wajib)"

3. **Update Email & Password**
   - Click "Lengkapi Profil Sekarang"
   - Enter real email: `yourname@gmail.com`
   - Enter new password
   - Submit

4. **Check Email Verification Status**
   - Warning changes to **BLUE**
   - "📧 Email Belum Diverifikasi (Wajib)"
   - Button appears: "Kirim Ulang Email Verifikasi"

5. **Check Email Inbox**
   - Look for email from Supabase
   - Subject: "Confirm your signup"
   - Click verification link

6. **Verify Auto-Detection**
   - Return to dashboard (stay logged in)
   - Within 30 seconds, warning disappears
   - Settings page unlocks

### Test Scenario 2: Login Blocking (After Configuration)

1. **Update email** (logged in)
2. **Logout** from dashboard
3. **Try to login** with new email/password
4. **Should be blocked** with message:
   ```
   "Email not confirmed. Please check your email."
   ```
5. **Check email** and click verification link
6. **Try login again** → Should work! ✅

---

## 🐛 Troubleshooting

### Issue: No Email Received

**Check:**
1. ✅ SMTP configured in Supabase?
2. ✅ "Confirm email" enabled in Auth settings?
3. ✅ Email in spam folder?
4. ✅ Email address correct?

**Solution:**
- Click "Kirim Ulang Email Verifikasi" button
- Check Supabase logs: Dashboard → Logs → Auth
- Manually get link from: Dashboard → Authentication → Users → Click user

### Issue: Can Still Login Without Verification

**Check:**
1. ❌ "Confirm email" setting is **disabled** in Supabase
2. **Enable it**: Authentication → Settings → Email Auth → Confirm email → ON

### Issue: Email Link Doesn't Work

**Check:**
1. Link expired? (valid for 1 hour)
2. Wrong redirect URL?
3. Request new email: Click "Kirim Ulang Email Verifikasi"

---

## 📋 Configuration Checklist

Before deployment, ensure:

- [ ] Supabase **"Confirm email"** enabled (Authentication → Settings)
- [ ] SMTP configured (Project Settings → Auth → SMTP)
- [ ] Email template tested (Authentication → Email Templates)
- [ ] Test email sending with real email address
- [ ] Verify login blocking works (try login with unverified email)
- [ ] Test "Resend Email" button functionality
- [ ] Check emails arrive in reasonable time (<1 minute)

---

## 🎯 Expected Behavior (After Configuration)

### Before Email Verification:
- ❌ Cannot login with new email/password
- ✅ Can stay logged in if already authenticated
- ⚠️ Blue warning visible with resend button
- 🔒 Settings page locked
- 🔒 Account linking unavailable

### After Email Verification:
- ✅ Can login with new email/password
- ✅ Warning disappears automatically
- ✅ Settings page unlocked
- ✅ Account linking available
- ✅ All features accessible

---

## 📞 Support

If verification emails still don't work after configuration:

1. **Check Supabase Logs**: Dashboard → Logs → Auth logs
2. **Test with Different Email**: Try Gmail, Outlook, etc.
3. **Contact Supabase Support**: support@supabase.io
4. **Use Test Mode**: Manually get verification links from Dashboard

---

## 🔐 Security Notes

**Why Email Verification is Important:**
- ✅ Confirms user owns the email address
- ✅ Prevents account takeover
- ✅ Ensures valid contact information
- ✅ Required for password recovery
- ✅ Necessary for account linking security

**Do NOT skip email verification in production!**
