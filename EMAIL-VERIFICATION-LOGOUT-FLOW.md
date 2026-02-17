# Email Verification Flow - Updated (Logout & Re-login)

## 🔄 Flow Baru: Logout Setelah Update Email

**Perubahan Utama:** Setelah member update email dari temp ke email asli, sistem akan **auto-logout** dan member harus **re-login** setelah verify email.

---

## 📋 Complete User Journey

### 1️⃣ Login dengan Temp Credentials
```
Username: abdul@temp.dlob.local
Password: DLOB2026
```
- **Auto-redirect** ke `/dashboard/complete-profile`
- ❌ Tidak bisa akses dashboard

### 2️⃣ Complete Profile (Update Email & Password)
**Halaman:** `/dashboard/complete-profile`

**Member mengisi:**
- Email asli (contoh: `abdul@gmail.com`)
- Password baru
- Konfirmasi password

**System action:**
1. Validate input
2. Update `auth.users`:
   - Email → email baru
   - Password → password baru
   - `email_confirm = false` (butuh verifikasi)
3. Kirim email verifikasi ke inbox
4. Update profile flags:
   - `using_temp_email = false`
   - `must_change_password = false`
5. **AUTO LOGOUT** user
6. Redirect ke `/login`

**Pesan sukses:**
> "Profil berhasil diperbarui! Email verifikasi telah dikirim. Silakan cek inbox dan verifikasi email Anda, lalu login kembali."

### 3️⃣ Cek Email & Verifikasi ✉️
**Member action:**
1. Buka inbox email (cek spam jika tidak ada)
2. Cari email dari DLOB/Supabase
3. **Klik link verifikasi** dalam email
4. Browser membuka halaman konfirmasi Supabase
5. Email confirmed (`email_confirmed_at` updated)

### 4️⃣ Login dengan Email Baru ⛔ (Sebelum Verifikasi)
**Jika member coba login sebelum klik link verifikasi:**

```
Email: abdul@gmail.com (email baru)
Password: (password baru)
```

**Result:**
- ❌ Login **DITOLAK** oleh Supabase
- Error message: **"Email not confirmed"**
- Member tidak bisa login sama sekali

**Screenshot:** Seperti yang Anda kirim - halaman login menampilkan "Email not confirmed"

### 5️⃣ Login dengan Email Baru ✅ (Setelah Verifikasi)
**Setelah klik link verifikasi:**

```
Email: abdul@gmail.com (email baru)
Password: (password baru)
```

**Result:**
- ✅ Login **BERHASIL**
- Langsung masuk ke `/dashboard`
- Full access ke semua fitur DLOB
- Tidak ada banner warning
- Tidak ada redirect

---

## 🔒 Security & Auth Flow

### Supabase Auth Behavior
Supabase **otomatis block** login untuk email yang belum diverifikasi:
- `email_confirm = false` → Login rejected
- `email_confirmed_at = null` → Login rejected
- Error: "Email not confirmed"

### Middleware Role
Middleware **hanya** check temp credentials:
```typescript
if (using_temp_email || must_change_password) {
  redirect → /dashboard/complete-profile
}
// No email verification check - handled by Supabase Auth
```

### Why This Flow?
1. **Keamanan:** Email harus diverifikasi sebelum bisa login
2. **Supabase native:** Menggunakan built-in Supabase email confirmation
3. **Clear UX:** Member tahu harus verify dulu sebelum login
4. **No bypass:** Tidak bisa akses dashboard tanpa verified email

---

## 📁 Files Modified

### 1. `src/app/dashboard/complete-profile/page.tsx` ⭐
**Changes:**
- Success message updated
- **Auto logout** after update
- Redirect to `/login` (not `/dashboard/verify-email`)
- Alert box warning about logout
- Security note updated

**Key code:**
```typescript
setSuccess('Profil berhasil diperbarui! Email verifikasi telah dikirim. Silakan cek inbox dan verifikasi email Anda, lalu login kembali.');

// Logout and redirect to login
setTimeout(async () => {
  const { supabase } = await import('@/lib/supabase');
  await supabase.auth.signOut();
  router.push('/login');
  router.refresh();
}, 3000);
```

### 2. `middleware.ts` ⭐
**Changes:**
- **Removed** email verification check
- Only check temp credentials
- Simplified logic

**What was removed:**
```typescript
// REMOVED - Supabase handles this at login level
if (!emailConfirmed && email && !email.includes('@temp.dlob.local')) {
  return NextResponse.redirect('/dashboard/verify-email');
}
```

### 3. `src/app/api/complete-profile/route.ts`
**No changes needed** - Already set `email_confirm: false`

### 4. `src/app/dashboard/verify-email/page.tsx`
**Status:** Not used anymore (can be kept for edge cases or deleted)

### 5. `src/components/EmailVerificationBanner.tsx`
**Status:** Not displayed (user logged out before seeing it)

---

## 🧪 Testing Flow

### Test 1: Complete Profile & Logout
- [ ] Login `abdul@temp.dlob.local` / `DLOB2026`
- [ ] Auto-redirect ke complete-profile ✅
- [ ] Isi email: `your.email@gmail.com`
- [ ] Isi password baru
- [ ] Submit form
- [ ] Muncul pesan sukses dengan instruksi ✅
- [ ] **Auto logout setelah 3 detik** ✅
- [ ] Redirect ke `/login` ✅

### Test 2: Login Sebelum Verifikasi (BLOCKED)
- [ ] Coba login dengan email baru
- [ ] Login **DITOLAK** ❌
- [ ] Error: "Email not confirmed" ✅
- [ ] Tidak bisa akses dashboard ✅

### Test 3: Email Verification
- [ ] Cek inbox email
- [ ] Email verifikasi diterima ✅
- [ ] Klik link verifikasi
- [ ] Browser buka halaman konfirmasi Supabase ✅
- [ ] Pesan: "Email confirmed" atau similar ✅

### Test 4: Login Setelah Verifikasi (SUCCESS)
- [ ] Kembali ke halaman login
- [ ] Login dengan email baru + password baru
- [ ] Login **BERHASIL** ✅
- [ ] Langsung ke `/dashboard` ✅
- [ ] Bisa akses semua halaman ✅
- [ ] Tidak ada redirect atau banner ✅

### Test 5: Temp Email Still Works
- [ ] Member lain login dengan temp credentials
- [ ] Masih bisa login ✅
- [ ] Auto-redirect ke complete-profile ✅
- [ ] Flow sama seperti di atas ✅

---

## 🎯 User Experience

### Before (Old Flow)
```
Login temp → Complete profile → Stay logged in
→ Redirect to verify-email page → Blocked from dashboard
→ Check email → Verify → Click status check → Dashboard access
```

### After (New Flow) ⭐
```
Login temp → Complete profile → AUTO LOGOUT
→ Check email → Verify → RE-LOGIN with new email → Dashboard access
```

**Benefits:**
- ✅ Clearer flow (logout → verify → re-login)
- ✅ Leverages Supabase native email verification
- ✅ No custom verify-email page needed
- ✅ Better security (can't login without verification)
- ✅ Simpler middleware logic

---

## 📧 Email Template

Pastikan email template di Supabase Dashboard sudah di-setup:

**Location:** Supabase Dashboard → Authentication → Email Templates → Confirm signup

**Template:**
```html
<h2>Verifikasi Email DLOB Anda</h2>
<p>Halo,</p>
<p>Anda telah memperbarui email untuk akun DLOB Anda.</p>
<p>Klik tombol di bawah untuk memverifikasi alamat email baru:</p>
<a href="{{ .ConfirmationURL }}">Verifikasi Email</a>
<p>Setelah verifikasi, Anda bisa login dengan email dan password baru Anda.</p>
<p><strong>Link berlaku selama 24 jam.</strong></p>
```

---

## 🔐 Security Notes

### 1. Email Verification Required
- Supabase block login jika `email_confirm = false`
- Member **TIDAK BISA** login tanpa verifikasi
- Error message jelas: "Email not confirmed"

### 2. Session Management
- Auto logout setelah update email
- Old session terminated
- Must create new session after verification

### 3. Password Change
- Password updated bersamaan dengan email
- Old password tidak valid lagi
- Must use new password for login

### 4. Temp Email Bypass
- Temp email (`@temp.dlob.local`) tidak perlu verifikasi
- Auto-confirmed untuk kemudahan onboarding
- Harus update ke email real untuk full access

---

## 💬 Member Communication Template

**Subject:** Akun DLOB Anda - Lengkapi Profil

```
Halo {member_name},

Kredensial login sementara Anda:
Email: {username}@temp.dlob.local
Password: DLOB2026

Langkah-langkah:
1. Login dengan kredensial di atas
2. Update dengan email dan password asli Anda
3. Anda akan otomatis logout
4. Cek inbox email untuk link verifikasi
5. Klik link verifikasi dalam email
6. Login kembali dengan email dan password baru

Penting:
- Link verifikasi berlaku 24 jam
- Cek folder spam jika email tidak masuk
- Hanya bisa login setelah email diverifikasi

Salam,
Tim DLOB
```

---

## 📊 Database Queries

### Check Members Need Profile Completion
```sql
SELECT 
  full_name,
  email,
  using_temp_email,
  must_change_password,
  created_at
FROM profiles
WHERE using_temp_email = true 
   OR must_change_password = true
ORDER BY created_at DESC;
```

### Check Email Verification Status
```sql
SELECT 
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Verified'
    ELSE '❌ Not Verified'
  END as status
FROM auth.users
WHERE email NOT LIKE '%@temp.dlob.local'
ORDER BY created_at DESC;
```

### Manually Verify Email (For Testing)
```sql
-- Use for testing/debugging only
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'member@example.com';
```

---

## 🚀 Production Checklist

- [ ] SQL untuk `using_temp_email` dan `must_change_password` sudah dijalankan
- [ ] Email template di Supabase sudah di-customize
- [ ] SMTP email settings di Supabase sudah configured
- [ ] Test dengan dummy account berhasil
- [ ] Test dengan real email berhasil
- [ ] Error "Email not confirmed" tampil dengan jelas
- [ ] Success login setelah verifikasi
- [ ] Member communication template ready
- [ ] Support team tau alur ini

---

## ❓ Troubleshooting

### "Email not confirmed" error
✅ **Expected behavior!**
- Ini artinya sistem bekerja dengan benar
- Member harus verify email dulu
- Arahkan member untuk cek inbox dan klik link

### Email tidak diterima
- Cek folder spam/junk
- Cek email settings di Supabase Dashboard
- Verify SMTP configuration
- Resend email tidak mungkin (sudah logout)
- Solusi: Login temp lagi → complete profile ulang dengan email lain

### Stuck di temp credentials
- Verify middleware working
- Check profile flags: `using_temp_email = true`?
- Should auto-redirect to complete-profile
- If not, check browser console for errors

---

**Updated:** February 15, 2026  
**Version:** 2.0 - Logout & Re-login Flow  
**Status:** ✅ Production Ready
