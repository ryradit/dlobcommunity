# 📧 DreamHost SMTP Email Setup Guide

**Status:** ✅ Code updated to use DreamHost SMTP  
**Benefit:** Use your existing DreamHost email (`support@dlobcommunity.com`) for sending verification emails

---

## ✅ What Was Changed

### 1. Package Installed
```bash
✅ npm install nodemailer @types/nodemailer
```

### 2. Code Updated
- ✅ Replaced Resend with Nodemailer in `send-verification-email/route.ts`
- ✅ Configured to use DreamHost SMTP server

### 3. Environment Variables Added
- ✅ Added SMTP configuration in `.env.local`

---

## 🔧 Configuration Steps

### Step 1: Update `.env.local` with Your Email Password

Open `.env.local` and update these lines:

```env
# DreamHost SMTP Configuration
SMTP_HOST=smtp.dreamhost.com
SMTP_PORT=465
SMTP_USER=support@dlobcommunity.com
SMTP_PASS=YOUR_ACTUAL_EMAIL_PASSWORD_HERE  ← Change this!
```

**Where to get the password:**
1. Your DreamHost email password (the one you use to login to webmail)
2. Go to https://panel.dreamhost.com/ → **Mail** → **Manage Email**
3. Find `support@dlobcommunity.com` and use that password

---

### Step 2: Update Production Environment (Vercel)

When deploying, add these environment variables in Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add these variables:
   ```
   SMTP_HOST = smtp.dreamhost.com
   SMTP_PORT = 465
   SMTP_USER = support@dlobcommunity.com
   SMTP_PASS = [your_email_password]
   ```

---

## 🎯 How It Works Now

### Email Sending Flow:
```
User registers/updates email
       ↓
Next.js API calls send-verification-email
       ↓
Nodemailer connects to DreamHost SMTP
       ↓
Email sent from: support@dlobcommunity.com
       ↓
User receives verification email
```

### Email Details:
- **Sender:** `DLOB System <support@dlobcommunity.com>`
- **Server:** DreamHost SMTP (`smtp.dreamhost.com`)
- **Port:** 465 (SSL)
- **Template:** Same beautiful HTML template as before

---

## ✅ Benefits

### Compared to Resend:
- ✅ No need to verify domain in Resend
- ✅ No DNS TXT/CNAME records needed for email
- ✅ Uses your existing DreamHost email infrastructure
- ✅ All emails come from your official support address
- ✅ Free (part of your DreamHost package)

### DNS Simplification:
**Before (with Resend):**
- A record → Vercel
- CNAME www → Vercel
- MX records → DreamHost (for receiving)
- TXT _resend → Resend verification
- TXT @ → Resend SPF
- CNAME _domainkey → Resend DKIM

**Now (with DreamHost SMTP):**
- A record → Vercel ✅
- CNAME www → Vercel ✅
- MX records → DreamHost ✅ (already exists)

**That's it!** No extra email DNS records needed.

---

## 🧪 Testing

### Test Email Sending:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Register a new test user** or update email on existing user

3. **Check terminal** for email sending logs:
   ```
   [Send Verification] Sending email to: test@example.com
   [Send Verification] ✅ Email sent successfully! <message-id>
   ```

4. **Check recipient inbox** for verification email

---

## 🔒 Security Best Practices

### For `.env.local` (Development):
- ✅ Already in `.gitignore` - will NOT be committed
- ⚠️ Never share your email password
- ⚠️ Use a strong password

### For Vercel (Production):
- ✅ Environment variables are encrypted
- ✅ Not visible in deployment logs
- ✅ Only accessible to your project

### Alternative: App-Specific Password
For extra security, create an app-specific password in DreamHost:
1. Panel → **Mail** → **Manage Email**
2. Click your email → **App Passwords**
3. Create new password for "DLOB App"
4. Use that instead of your main password

---

## 📋 DNS Configuration (For dlobcommunity.com)

Since you're using DreamHost email, your DNS should have:

### Already Configured by DreamHost:
```
Type: MX
Name: @
Value: mx1.dreamhost.com
Priority: 10

Type: MX
Name: @
Value: mx2.dreamhost.com
Priority: 20
```

### You Need to Add (for website):
```
Type: A
Name: @
Value: [from Vercel - see screenshot]

Type: CNAME
Name: www
Value: [from Vercel - see screenshot]
```

**DO NOT delete the MX records!** They're needed for receiving email at `support@dlobcommunity.com`.

---

## 🆘 Troubleshooting

### Email Not Sending - "Authentication Failed"
**Problem:** Wrong email/password  
**Solution:**
1. Verify password is correct
2. Try logging into https://webmail.dreamhost.com with same credentials
3. If webmail login fails, reset password in DreamHost panel

### Email Not Sending - "Connection Timeout"
**Problem:** Firewall blocking SMTP port  
**Solution:**
1. Check if port 465 is open
2. Try port 587 with `secure: false` and `TLS: true`

### Email Going to Spam
**Problem:** SPF/DKIM not configured  
**Solution:**
1. Check DNS has proper SPF record
2. DreamHost usually configures this automatically
3. Ask DreamHost support to verify email authentication

### "SMTP Server Not Responding"
**Problem:** DreamHost SMTP temporarily down  
**Solution:**
1. Check DreamHost status: https://www.dreamhoststatus.com/
2. Wait a few minutes and retry
3. Contact DreamHost support if persists

---

## 🔄 Switching Back to Resend (Optional)

If you want to switch back to Resend later:

1. **Revert code changes** (git has the old version)
2. **Update environment variables** back to `RESEND_API_KEY`
3. **Configure Resend DNS records** (Step 6 in migration guide)

---

## 📝 Summary

**What you need to do:**
1. ✅ Update `SMTP_PASS` in `.env.local` with your DreamHost email password
2. ✅ Add SMTP environment variables in Vercel (for production)
3. ✅ Test email sending works
4. ✅ Skip Step 6 (Resend configuration) in migration guide

**Email configuration:**
- Sender: `support@dlobcommunity.com` (your DreamHost email)
- Server: DreamHost SMTP
- No additional DNS records needed for email sending

**That's it!** Your email verification system now uses DreamHost directly. 🎉
