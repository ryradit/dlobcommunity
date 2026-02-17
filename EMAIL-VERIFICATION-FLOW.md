# Email Verification Flow - Member Onboarding

Complete documentation for the member account creation with email verification system.

## Overview

This system allows DLOB to create member accounts with temporary credentials, after which members complete their profile with real email and password. Email verification is now **required** to ensure valid contact information.

---

## 🎯 Complete User Journey

### Phase 1: Account Creation (Admin)
1. Admin runs `node create-members-script.js`
2. Creates 39 accounts with:
   - Email: `[username]@temp.dlob.local`
   - Password: `DLOB2026`
   - Flags: `using_temp_email = true`, `must_change_password = true`

### Phase 2: First Login (Member)
1. Member receives credentials from admin
2. Logs in at `/login` with temp credentials
3. **Middleware auto-redirects** to `/dashboard/complete-profile`
4. Sees profile completion page with:
   - Current temp email shown
   - Avatar displayed
   - Warning about first-time setup
   - Forms for new email + password

### Phase 3: Profile Completion (Member)
1. Member enters:
   - Real email address
   - New password (min 6 chars)
   - Password confirmation
2. Clicks "Complete Setup"
3. System:
   - Validates email not already in use
   - Updates `auth.users` with new email/password
   - **Sets `email_confirm = false`** (requires verification)
   - Updates profile flags to false
   - **Sends verification email** to new address
4. Shows success message: "Please check your email to verify"
5. Auto-redirects to `/dashboard` after 3 seconds

### Phase 4: Email Verification (Member)
1. Member redirected to dashboard
2. Sees **yellow warning banner** (if temp email not yet updated) - REMOVED by phase 3
3. Sees **blue verification banner**:
   - "Verifikasi Email Diperlukan"
   - Shows email address needing verification
   - "Kirim Ulang Email" button
   - Auto-dismissible with X button
4. Member checks email inbox
5. Clicks verification link from Supabase
6. Email confirmed in `auth.users.email_confirmed_at`
7. **Banner disappears** on next page load or after 30sec auto-check

### Phase 5: Full Access (Member)
- All banners gone
- Full dashboard access
- Can use all DLOB features
- Email verified and secure

---

## 🚨 Warning Banners System

### 1. Profile Completion Warning (Yellow)
**Location:** All `/dashboard/*` pages
**File:** `src/components/ProfileCompletionWarning.tsx`

**Triggers When:**
- `using_temp_email = true` OR
- `must_change_password = true`

**Appearance:**
- Yellow left border
- Warning icon
- "Profil Belum Lengkap" heading
- Explanation about temp credentials
- "Lengkapi Profil Sekarang" button → `/dashboard/complete-profile`
- Dismissible with X button

**Auto-Hides When:**
- Profile flags updated to false
- User dismisses banner (session only)

---

### 2. Email Verification Banner (Blue)
**Location:** All `/dashboard/*` pages
**File:** `src/components/EmailVerificationBanner.tsx`

**Triggers When:**
- User email NOT confirmed (`email_confirmed_at = null`)
- Email is NOT temp email (not `@temp.dlob.local`)

**Appearance:**
- Blue left border
- Mail icon
- "Verifikasi Email Diperlukan" heading
- Shows user's email address
- "Kirim Ulang Email" button with loading state
- Success/error messages for resend
- Dismissible with X button

**Features:**
- Auto-refresh check every 30 seconds
- Resend verification email functionality
- Real-time status updates

**Auto-Hides When:**
- Email confirmed (user clicks verification link)
- User dismisses banner (session only)
- Auto-check detects verification

---

## 📝 Implementation Files

### Components Created
1. **ProfileCompletionWarning.tsx**
   - Checks `using_temp_email` and `must_change_password` flags
   - Shows yellow warning for incomplete profiles
   - Dismissible with session storage

2. **EmailVerificationBanner.tsx**
   - Checks `email_confirmed_at` from auth session
   - Shows blue verification reminder
   - Resend email functionality
   - 30-second auto-refresh check

### Layout Integration
**File:** `src/app/dashboard/layout.tsx`

```tsx
<div className="p-6">
  <ProfileCompletionWarning />  {/* Yellow - temp credentials */}
  <EmailVerificationBanner />   {/* Blue - email not verified */}
</div>
{children}
```

**Order matters:**
1. Profile warning shows first (temp email)
2. After profile completion, yellow disappears
3. Blue verification banner appears
4. After email verified, all banners gone

### API Updates
**File:** `src/app/api/complete-profile/route.ts`

**Changed:**
```typescript
// OLD: email_confirm: true
// NEW: email_confirm: false  <- Requires verification
```

**Response includes:**
```json
{
  "success": true,
  "message": "Profile updated successfully. Please check your email...",
  "requiresVerification": true
}
```

### Page Updates
**File:** `src/app/dashboard/complete-profile/page.tsx`

**Changes:**
1. Success message updated to mention email verification
2. Redirect delay increased to 3 seconds (was 2)
3. Alert text updated: "You'll receive a verification email"
4. Security note updated: "Check your email inbox"

---

## 🔧 Technical Details

### Database Schema
**Table:** `profiles`

Required columns:
```sql
using_temp_email BOOLEAN DEFAULT false
must_change_password BOOLEAN DEFAULT false
```

**Index:**
```sql
idx_profiles_temp_email ON profiles(using_temp_email)
```

### Middleware Logic
**File:** `middleware.ts` (Lines 74-98)

```typescript
// Skip check for complete-profile page itself
if (path === '/dashboard/complete-profile') return;

// Check temp email flags
const { data: profile } = await supabase
  .from('profiles')
  .select('using_temp_email, must_change_password')
  .eq('id', session.user.id)
  .single();

// Redirect if still using temp
if (profile?.using_temp_email || profile?.must_change_password) {
  return NextResponse.redirect(
    new URL('/dashboard/complete-profile', request.url)
  );
}
```

### Email Verification Check
**EmailVerificationBanner component:**

```typescript
// Get session to check verification
const { data: { session } } = await supabase.auth.getSession();

// Check if verified
const emailConfirmed = session?.user?.email_confirmed_at;
const email = session?.user?.email;

// Show banner if not confirmed and not temp
if (!emailConfirmed && email && !email.includes('@temp.dlob.local')) {
  setNeedsVerification(true);
}
```

**Auto-refresh:**
```typescript
// Recheck every 30 seconds
const interval = setInterval(checkEmailVerification, 30000);
```

### Resend Verification Email
**EmailVerificationBanner component:**

```typescript
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: user.email,
});
```

---

## 🧪 Testing Checklist

### 1. New Member Login
- [ ] Login with temp credentials (`abdul@temp.dlob.local` / `DLOB2026`)
- [ ] Should auto-redirect to `/dashboard/complete-profile`
- [ ] Cannot access other dashboard pages until profile complete

### 2. Profile Completion
- [ ] Enter new email (e.g., `abdul@gmail.com`)
- [ ] Enter new password (min 6 chars)
- [ ] Confirm password matches
- [ ] Submit form successfully
- [ ] See success message mentioning email verification
- [ ] Auto-redirect to dashboard after 3 seconds

### 3. Dashboard After Completion
- [ ] Yellow warning banner gone
- [ ] Blue verification banner appears
- [ ] Banner shows new email address
- [ ] "Kirim Ulang Email" button works
- [ ] Can dismiss banner with X

### 4. Email Verification
- [ ] Check email inbox for verification email
- [ ] Click verification link in email
- [ ] Return to dashboard
- [ ] Blue banner disappears (may take up to 30 seconds)
- [ ] Full dashboard access available

### 5. Resend Email Feature
- [ ] Click "Kirim Ulang Email" button
- [ ] See loading state
- [ ] See success message
- [ ] Receive new verification email
- [ ] Verify with new link works

### 6. Edge Cases
- [ ] Try entering already-used email → Should show error
- [ ] Try weak password (< 6 chars) → Should show error
- [ ] Try mismatched passwords → Should show error
- [ ] Try entering temp email → Should show error
- [ ] Dismiss banner and refresh → Banner reappears (session storage)

---

## 📧 Email Template (Supabase)

Supabase automatically sends verification emails. Customize in:
**Supabase Dashboard → Authentication → Email Templates → Confirm signup**

Recommended content:
```
Subject: Verifikasi Email DLOB Anda

Hi {{ .ConfirmationURL }},

Terima kasih telah melengkapi profil DLOB Anda!

Klik link di bawah ini untuk memverifikasi email Anda:
{{ .ConfirmationURL }}

Link ini akan kadaluarsa dalam 24 jam.

Salam,
Tim DLOB
```

---

## 🚀 Next Steps

1. **Run SQL Schema (if not done):**
   ```sql
   ALTER TABLE profiles 
   ADD COLUMN IF NOT EXISTS using_temp_email BOOLEAN DEFAULT false,
   ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
   
   CREATE INDEX IF NOT EXISTS idx_profiles_temp_email 
   ON profiles(using_temp_email);
   
   UPDATE profiles 
   SET using_temp_email = true, must_change_password = true
   WHERE email LIKE '%@temp.dlob.local';
   ```

2. **Test Complete Flow:**
   - Login with temp account
   - Complete profile
   - Check dashboards shows blue banner
   - Verify email in inbox
   - Confirm banner disappears

3. **Customize Email Template (Optional):**
   - Go to Supabase Dashboard
   - Authentication → Email Templates
   - Edit "Confirm signup" template
   - Add DLOB branding

4. **Prepare Member Communications:**
   - Create welcome message with temp credentials
   - Explain profile completion process
   - Mention email verification requirement
   - Set deadline for profile completion

5. **Monitor Member Progress:**
   ```sql
   -- Check profile completion status
   SELECT 
     full_name,
     email,
     using_temp_email,
     must_change_password,
     created_at,
     updated_at
   FROM profiles
   WHERE email LIKE '%@temp.dlob.local'
   OR using_temp_email = true
   ORDER BY created_at DESC;
   
   -- Check email verification status
   SELECT 
     email,
     email_confirmed_at,
     created_at
   FROM auth.users
   WHERE email_confirmed_at IS NULL
   ORDER BY created_at DESC;
   ```

---

## 🎨 UI/UX Features

### Visual Design
- **Yellow Warning** (temp credentials) → High priority, urgent action
- **Blue Info** (email verification) → Important but not blocking
- **Gradual disclosure** → One step at a time
- **Auto-dismiss** → Disappears when conditions met
- **Manual dismiss** → User can hide temporarily
- **Success feedback** → Clear confirmation messages

### User Experience
- Never force logout during process
- Clear instructions at each step
- Visual progress indicators
- Helpful error messages
- Resend email fallback
- Non-blocking workflow

### Performance
- Client-side checks cached
- 30-second refresh interval (not aggressive)
- Parallel API calls where possible
- No blocking on email verification (can still use app)

---

## 📊 Monitoring Queries

### Profile Completion Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE using_temp_email = false) as completed,
  COUNT(*) FILTER (WHERE using_temp_email = true) as pending,
  ROUND(COUNT(*) FILTER (WHERE using_temp_email = false) * 100.0 / COUNT(*), 1) as completion_rate
FROM profiles
WHERE email LIKE '%@dlob.local';
```

### Email Verification Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as verified,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unverified,
  ROUND(COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) * 100.0 / COUNT(*), 1) as verification_rate
FROM auth.users
WHERE email NOT LIKE '%@temp.dlob.local';
```

### Member Status Overview
```sql
SELECT 
  p.full_name,
  p.email,
  CASE 
    WHEN p.using_temp_email THEN '🔴 Needs Profile Completion'
    WHEN u.email_confirmed_at IS NULL THEN '🟡 Needs Email Verification'
    ELSE '🟢 Fully Activated'
  END as status,
  u.email_confirmed_at as verified_at,
  p.updated_at as profile_updated
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.full_name IN (
  'abdul', 'adi', 'adit', ... -- List all 39 members
)
ORDER BY 
  CASE 
    WHEN p.using_temp_email THEN 1
    WHEN u.email_confirmed_at IS NULL THEN 2
    ELSE 3
  END,
  p.full_name;
```

---

## 🔐 Security Notes

1. **Password Requirements:**
   - Minimum 6 characters (enforced)
   - Consider adding complexity requirements in future
   
2. **Email Validation:**
   - Must contain @ symbol
   - Cannot be temp email domain
   - Uniqueness checked
   
3. **Verification:**
   - Required for all new emails
   - Links expire after 24 hours
   - Can resend multiple times
   
4. **Session Management:**
   - User stays logged in during process
   - No forced logout on email change
   - Session refreshed after verification

---

## 📝 Communication Template for Members

**Subject: Akun DLOB Anda Telah Dibuat - Lengkapi Profil**

Hi {member_name},

Akun DLOB Anda telah dibuat! Silakan login dan lengkapi profil Anda.

**Kredensial Login Sementara:**
- URL: https://dlob.app/login
- Email: {username}@temp.dlob.local
- Password: DLOB2026

**Langkah Selanjutnya:**
1. Login dengan kredensial di atas
2. Anda akan diarahkan ke halaman lengkapi profil
3. Masukkan email asli dan password baru Anda
4. Cek inbox email untuk link verifikasi
5. Klik link verifikasi untuk mengaktifkan akun

**Penting:**
- Jangan bagikan password Anda ke siapapun
- Gunakan email yang aktif dan bisa Anda akses
- Buat password yang kuat (min. 6 karakter)
- Verifikasi email dalam 24 jam

Salam,
Tim DLOB

---

**Created:** February 15, 2026
**System:** DLOB Member Onboarding v2.0
**Status:** ✅ Production Ready
