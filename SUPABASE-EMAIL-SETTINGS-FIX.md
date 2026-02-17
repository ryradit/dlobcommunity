# 🔧 Fix: Members Redirected to Login After Email Change

## Problem
When members update their email from temp credentials, they are immediately redirected to login page because Supabase invalidates their session for unverified emails.

## Root Cause
Supabase's **"Confirm email"** setting has a mode that **blocks sign-ins for unverified users**, which causes:
1. User changes email → email becomes unverified
2. Supabase sees unverified email → invalidates session
3. User object becomes null in AuthContext
4. Dashboard layout detects no user → redirects to login

## ✅ Solution: Configure Supabase to Allow Unverified Sign-Ins

### Step 1: Update Supabase Email Auth Settings

Go to: **Supabase Dashboard** → **Authentication** → **Settings** → **Email Auth**

#### Option A: If you see "Confirm email" with dropdown options:
```
Confirm email: 
  ○ Disabled (don't require email confirmation)
  ○ Required - Block sign-ins until verified
  ● Required - Allow sign-ins before verification ✅ SELECT THIS
```

#### Option B: If you see separate toggles:
```
✅ Enable email confirmations: ON
❌ Require email confirmation before sign-in: OFF
✅ Secure email change enabled: ON
```

#### Option C: If settings are different:
Look for any setting mentioning **"block"** or **"require verification to sign in"** and DISABLE those while keeping email confirmation enabled.

### Step 2: Verify "Secure Email Change" Settings

Find: **"Secure email change"** section

**Recommended Configuration:**
```
✅ Secure email change: ON
✅ Require confirmation for new email: ON
❌ Disable existing session after email change: OFF ← CRITICAL!
```

**What this does:**
- ✅ New email requires verification (secure)
- ✅ Members can still login and see dashboard (not blocked)
- ✅ ProfileCompletionWarning shows with resend button
- ✅ Members can resend verification email any time
- ✅ Settings remain blocked until verified (intentional)

---

## 🔍 How to Test if Settings are Correct

### Test 1: Login with Temp Credentials Should Work
```bash
Email: temptest@temp.dlob.local
Password: DLOB2026
Expected: ✅ Login successful → Dashboard loads → Warning banner shows
```

### Test 2: Update Email Should Keep Session Active
1. Click profile section in dashboard
2. Update email to real email: `solasoharyono@gmail.com`
3. Submit form

**Expected Result:**
- ✅ Email updated successfully
- ✅ Still logged in (not redirected to login)
- ✅ Blue warning banner appears: "Silakan verifikasi email Anda"
- ✅ "Kirim Ulang Email Verifikasi" button visible
- ✅ Settings remain locked (intentional security)

**❌ WRONG Result (if settings incorrect):**
- User immediately redirected to `/login`
- Session lost
- Cannot access dashboard

### Test 3: Verification Email Arrives
1. Click "Kirim Ulang Email Verifikasi" button
2. Check email inbox (solasoharyono@gmail.com)
3. Expected: Email arrives within 1-2 minutes

---

## 🚨 Alternative: Disable Email Blocking (Quick Fix)

If you can't find the right settings or need immediate fix:

### Temporary Workaround (Development Only):

**Disable session invalidation in dashboard layout:**

Edit: `src/app/dashboard/layout.tsx`

```typescript
useEffect(() => {
  // Non-blocking redirect - only after 500ms to avoid flash
  const timer = setTimeout(() => {
    // TEMPORARY: Don't redirect if session lost due to email change
    // Check if there's an auth cookie present even if user is null
    const hasAuthCookie = document.cookie.includes('sb-') && 
                          document.cookie.includes('auth-token');
    
    if (!loading && !user && !hasAuthCookie) {
      // Only redirect if truly logged out (no cookies)
      router.replace('/login');
    } else if (!loading && isAdmin && viewAs === 'admin') {
      router.replace('/admin');
    }
  }, 500);

  return () => clearTimeout(timer);
}, [user, isAdmin, viewAs, loading, router]);
```

**⚠️ WARNING:** This is only for testing. The proper fix is adjusting Supabase settings.

---

## 📧 Still No Emails Arriving?

If settings are correct but emails don't arrive:

### Check Email Logs in Supabase:
1. Go to: **Supabase Dashboard** → **Logs** → **Auth logs**
2. Filter by: Recent events
3. Look for:
   - `user_confirmation_requested` ✅ = Email triggered
   - `smtp_error` ❌ = SMTP configuration issue
   - No logs at all ❌ = Email confirmation not enabled

### Gmail SMTP Troubleshooting:
1. **App Password:** Ensure using App Password, not regular password
2. **2FA:** Gmail requires 2FA enabled to generate App Passwords
3. **Less Secure Apps:** Deprecated - must use App Password
4. **Port 587:** Use TLS/STARTTLS on port 587 (not 465/SSL)

### Alternative: Switch to Resend.com
If Gmail continues to fail:

```
Host: smtp.resend.com
Port: 587
User: resend (literal word "resend")
Password: [Your Resend API Key]
Sender: your-domain@resend.dev
```

**Resend.com Benefits:**
- ✅ Better deliverability than Gmail
- ✅ Designed for transactional emails
- ✅ Free tier: 3,000 emails/month
- ✅ Better logging and debugging

---

## ✅ Success Criteria

Your configuration is correct when:

1. ✅ Member logs in with temp credentials → sees dashboard (not redirected)
2. ✅ Member updates email → stays logged in (session maintained)
3. ✅ Blue warning banner appears with resend button
4. ✅ Verification email arrives in inbox within 2 minutes
5. ✅ Member clicks verification link → email verified
6. ✅ Warning banner disappears automatically
7. ✅ Settings unlock after verification
8. ✅ Google account linking becomes available

---

## 📝 Quick Checklist

- [ ] "Confirm email" enabled in Supabase
- [ ] "Block sign-ins for unverified users" **disabled**
- [ ] "Secure email change" enabled
- [ ] "Disable session after email change" **disabled**
- [ ] SMTP configured correctly (Gmail App Password or Resend)
- [ ] Test with temp account: login works
- [ ] Test email update: session stays active
- [ ] Test resend button: emails arrive
- [ ] Test verification link: warning disappears

---

## 🆘 Need Help?

**Check Supabase Documentation:**
- [Email Authentication Settings](https://supabase.com/docs/guides/auth/auth-email)
- [Secure Email Change](https://supabase.com/docs/guides/auth/auth-email-change)

**Check Laravel-style session management:**
If Supabase doesn't have the right toggles, you might need to use "Refresh token rotation" strategy where the refresh token remains valid even when email is unverified.
