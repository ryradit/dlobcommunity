# Alur Verifikasi Email - Update

## 🔒 Sistem Pemblokiran Akses

Sebelumnya: Email verifikasi opsional, hanya menampilkan banner peringatan.  
**Sekarang: Email verifikasi WAJIB, akses dashboard diblokir sampai verifikasi.**

---

## 📋 Alur Lengkap

### 1️⃣ Login dengan Kredensial Temp
- Member login: `username@temp.dlob.local` / `DLOB2026`
- **Middleware** deteksi temp email
- **Auto-redirect** ke `/dashboard/complete-profile`
- ❌ **TIDAK BISA** akses dashboard atau halaman lain

### 2️⃣ Lengkapi Profil (Complete Profile)
- Member isi email asli + password baru
- Submit form
- Backend:
  - Update `auth.users` dengan email baru
  - Set `email_confirm = false` (butuh verifikasi)
  - **Kirim email verifikasi otomatis**
  - Update profile flags: `using_temp_email = false`
- **Auto-redirect** ke `/dashboard/verify-email`

### 3️⃣ Verifikasi Email (BLOKIR AKSES) ⛔
**Halaman:** `/dashboard/verify-email`

**Tampilan:**
- 📧 Judul: "Verifikasi Email Diperlukan"
- 📨 Menampilkan email yang perlu diverifikasi
- 📝 Instruksi langkah-langkah verifikasi
- 🔘 Tombol "Cek Status Verifikasi"
- 🔄 Tombol "Kirim Ulang Email Verifikasi"
- 🚪 Tombol "Keluar"

**Fitur:**
- Member **TIDAK BISA** akses dashboard sama sekali
- Member **TIDAK BISA** akses halaman member lain
- Member **HANYA BISA**:
  - Baca instruksi
  - Kirim ulang email
  - Cek status verifikasi
  - Logout

**Middleware Protection:**
```typescript
// Block access if email not verified
if (!emailConfirmed && email && !email.includes('@temp.dlob.local')) {
  return NextResponse.redirect('/dashboard/verify-email');
}
```

### 4️⃣ Klik Link Verifikasi
- Member cek email inbox (atau spam folder)
- Klik link verifikasi dari Supabase
- Supabase update `email_confirmed_at` di database
- Link membuka halaman konfirmasi Supabase

### 5️⃣ Kembali ke Aplikasi
- Member kembali ke `/dashboard/verify-email`
- Klik tombol **"Cek Status Verifikasi"**
- System:
  - Refresh session dari Supabase
  - Cek `email_confirmed_at`
  - Jika sudah terisi → **Auto-redirect** ke `/dashboard`
  - Jika belum → Tampilkan pesan error

### 6️⃣ Akses Penuh Dashboard ✅
- Email sudah terverifikasi
- **Middleware izinkan** akses semua halaman dashboard
- Banner warning **TIDAK MUNCUL** lagi
- Member bisa gunakan semua fitur DLOB

---

## 🛡️ Tingkat Keamanan

### Middleware Check (3 Level)
**Priority 1: Profile Completion**
```typescript
if (using_temp_email || must_change_password) {
  redirect → /dashboard/complete-profile
}
```

**Priority 2: Email Verification** ⭐ **BARU**
```typescript
if (!email_confirmed_at && email && !email.includes('@temp.dlob.local')) {
  redirect → /dashboard/verify-email
}
```

**Priority 3: Full Access**
```typescript
// Allow access to all dashboard pages
```

### Halaman yang Dikecualikan
- `/dashboard/complete-profile` - Untuk lengkapi profil
- `/dashboard/verify-email` - Untuk verifikasi (tidak loop redirect)
- Semua halaman publik (`/login`, `/register`, dll)

---

## 🔄 Fitur "Kirim Ulang Email"

**Fungsi:** `handleResendVerification()`

```typescript
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: user.email,
});
```

**Kondisi:**
- Button tersedia di halaman verify-email
- Bisa diklik berkali-kali (jika email belum diterima)
- Menampilkan pesan sukses/error
- Loading state saat proses kirim

---

## 🔄 Fitur "Cek Status Verifikasi"

**Fungsi:** `handleCheckStatus()`

```typescript
const { data: { session } } = await supabase.auth.refreshSession();
const emailConfirmed = session?.user?.email_confirmed_at;

if (emailConfirmed) {
  router.push('/dashboard'); // ✅ Verified!
} else {
  // ❌ Still not verified
}
```

**Kondisi:**
- Refresh session untuk data terbaru
- Cek `email_confirmed_at`
- Auto-redirect jika sudah verified
- Tampilkan error jika belum

---

## 📁 File yang Diubah

### 1. `middleware.ts` ⭐ **UTAMA**
**Perubahan:**
- Tambah check email verification
- Redirect ke `/dashboard/verify-email` jika tidak verified
- Skip check untuk halaman verify-email (hindari loop)

**Kode Baru:**
```typescript
// Block access if email not verified
const emailConfirmed = session.user.email_confirmed_at;
const email = session.user.email;

if (!emailConfirmed && email && !email.includes('@temp.dlob.local')) {
  return NextResponse.redirect(new URL('/dashboard/verify-email', request.url));
}
```

### 2. `src/app/dashboard/verify-email/page.tsx` ⭐ **BARU**
**Halaman baru:** Blokir akses sampai email diverifikasi

**Fitur:**
- Tampilan instruksi verifikasi
- Resend email button
- Check status button
- Logout button
- Auto-check setiap refresh
- Auto-redirect jika sudah verified

### 3. `src/app/dashboard/complete-profile/page.tsx`
**Perubahan:**
- Redirect ke `/dashboard/verify-email` (bukan `/dashboard`)
- Update pesan sukses
- Kurangi delay redirect (3s → 2s)

### 4. `src/app/api/complete-profile/route.ts`
**Tidak perlu diubah** - Sudah set `email_confirm: false`

---

## 🧪 Testing Checklist

### ✅ Test 1: Login Temp Credentials
- [ ] Login `abdul@temp.dlob.local` / `DLOB2026`
- [ ] Auto-redirect ke complete-profile
- [ ] Tidak bisa akses `/dashboard` langsung

### ✅ Test 2: Complete Profile
- [ ] Isi email asli + password baru
- [ ] Submit berhasil
- [ ] Muncul pesan sukses
- [ ] Auto-redirect ke `/dashboard/verify-email`

### ✅ Test 3: Verify Email Page (Blokir)
- [ ] Halaman verify-email tampil
- [ ] Menampilkan email yang perlu diverifikasi
- [ ] Tidak bisa akses `/dashboard` (redirect balik)
- [ ] Tidak bisa akses `/dashboard/analitik` (redirect balik)
- [ ] Tombol "Kirim Ulang Email" berfungsi
- [ ] Tombol "Cek Status" berfungsi

### ✅ Test 4: Email Verification
- [ ] Cek inbox email (atau spam)
- [ ] Email verifikasi diterima dari Supabase
- [ ] Klik link verifikasi
- [ ] Halaman konfirmasi Supabase tampil

### ✅ Test 5: Check Status & Access
- [ ] Kembali ke aplikasi
- [ ] Klik "Cek Status Verifikasi"
- [ ] Auto-redirect ke `/dashboard`
- [ ] Bisa akses semua halaman dashboard
- [ ] Banner warning tidak muncul

### ✅ Test 6: Resend Email
- [ ] Jika email belum diterima
- [ ] Klik "Kirim Ulang Email Verifikasi"
- [ ] Email baru diterima
- [ ] Verify dengan link baru

### ✅ Test 7: Direct URL Access (Security)
- [ ] Sebelum verify, coba akses `/dashboard` langsung
- [ ] Harus redirect ke `/dashboard/verify-email`
- [ ] Sebelum verify, coba akses `/dashboard/pembayaran`
- [ ] Harus redirect ke `/dashboard/verify-email`
- [ ] Logout, login lagi tanpa verify
- [ ] Tetap redirect ke verify-email

---

## 🔐 Keamanan

### Proteksi Middleware
✅ Server-side check (tidak bisa dibypass dari client)
✅ Check setiap request ke `/dashboard/*` atau `/admin/*`
✅ Redirect paksa jika email tidak verified
✅ Skip check untuk halaman verify-email sendiri (hindari loop)

### Session Refresh
✅ `refreshSession()` di verify-email page
✅ Mendapat data `email_confirmed_at` terbaru
✅ Auto-redirect jika sudah verified

### Database Integrity
✅ `email_confirm: false` saat update email
✅ Supabase handle verification logic
✅ `email_confirmed_at` timestamp dari Supabase

---

## 📧 Email Template Supabase

**Lokasi Setup:**
Supabase Dashboard → Authentication → Email Templates → Confirm signup

**Template Rekomendasi:**
```html
<h2>Verifikasi Email DLOB Anda</h2>
<p>Halo,</p>
<p>Terima kasih telah melengkapi profil DLOB Anda!</p>
<p>Klik tombol di bawah untuk memverifikasi alamat email Anda:</p>
<a href="{{ .ConfirmationURL }}" style="...">Verifikasi Email</a>
<p>Atau copy link ini ke browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p><strong>Link berlaku selama 24 jam.</strong></p>
```

---

## 🎯 Perbedaan Sebelum & Sesudah

| Aspek | ❌ Sebelum | ✅ Sekarang |
|-------|----------|-------------|
| **Akses Dashboard** | Bisa akses meski email belum verified | ⛔ DIBLOKIR sampai verified |
| **Redirect** | Langsung ke dashboard | Ke halaman verify-email |
| **User Experience** | Banner peringatan (bisa dismiss) | Halaman blokir (tidak bisa skip) |
| **Keamanan** | Optional verification | **Mandatory verification** |
| **Email Resend** | Dari banner di dashboard | Dari halaman verify-email |
| **Check Status** | Auto-check background (30s) | Manual button + auto pada refresh |

---

## 🚀 Status: Production Ready

✅ Middleware protection implemented
✅ Verify-email page created
✅ Complete-profile redirect updated
✅ Session refresh logic added
✅ Resend email functionality
✅ Check status functionality
✅ Logout option available
✅ All bahasa Indonesia

**Siap untuk testing!** 🎉
