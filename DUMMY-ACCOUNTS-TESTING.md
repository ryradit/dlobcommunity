# 🧪 Dummy Test Accounts - Created

## ✅ Accounts Created

2 akun dummy telah berhasil dibuat untuk testing flow verifikasi email.

---

## 🔑 Kredensial Akun

### Account 1
- **Email:** `testuser1@example.com`
- **Password:** `Test123456`
- **Nama:** Test User 1
- **Status:** Email belum diverifikasi

### Account 2
- **Email:** `testuser2@example.com`
- **Password:** `Test123456`
- **Nama:** Test User 2
- **Status:** Email belum diverifikasi

---

## 🧪 Testing Scenarios

### Test 1: Complete Flow (testuser1)
1. Login dengan `testuser1@example.com` / `Test123456`
2. Seharusnya redirect ke `/dashboard/verify-email`
3. Dashboard **DIBLOKIR** sampai email diverifikasi
4. Test:
   - Klik "Kirim Ulang Email Verifikasi"
   - Klik "Cek Status Verifikasi" (seharusnya masih blokir)
   - Coba akses `/dashboard` langsung (redirect balik)
   - Coba akses `/dashboard/analitik` (redirect balik)
   - Logout dan login lagi (masih ke verify-email)

### Test 2: Manual Verification Simulation (testuser2)
1. Login dengan `testuser2@example.com` / `Test123456`
2. Redirect ke `/dashboard/verify-email`
3. Untuk simulasi verifikasi email berhasil:
   ```sql
   -- Run di Supabase SQL Editor
   UPDATE auth.users 
   SET email_confirmed_at = NOW()
   WHERE email = 'testuser2@example.com';
   ```
4. Klik "Cek Status Verifikasi"
5. Seharusnya auto-redirect ke `/dashboard`
6. Dashboard sekarang bisa diakses penuh ✅

---

## 🔐 Database Setup Required

Pastikan table `profiles` sudah memiliki kolom:
```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS using_temp_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_temp_email 
ON profiles(using_temp_email);
```

---

## 📊 Verifikasi Akun

### Check di Supabase Dashboard

**Authentication → Users:**
```
testuser1@example.com - Email not confirmed
testuser2@example.com - Email not confirmed
```

**Table Editor → profiles:**
```sql
SELECT id, email, full_name, using_temp_email, must_change_password
FROM profiles
WHERE email IN ('testuser1@example.com', 'testuser2@example.com');
```

Expected results:
- `using_temp_email` = false
- `must_change_password` = false

---

## 🧹 Cleanup (Hapus Akun Dummy)

Jika ingin menghapus akun dummy setelah testing:

```sql
-- Get user IDs first
SELECT id, email FROM auth.users 
WHERE email IN ('testuser1@example.com', 'testuser2@example.com');

-- Delete from profiles (replace with actual IDs)
DELETE FROM profiles 
WHERE email IN ('testuser1@example.com', 'testuser2@example.com');
```

Kemudian hapus dari Supabase Dashboard:
- Authentication → Users → Search email → Delete user

---

## 🎯 Testing Checklist

- [ ] Login testuser1 → Redirect ke verify-email ✅
- [ ] Dashboard diblokir (redirect balik) ✅
- [ ] Analitik diblokir (redirect balik) ✅
- [ ] Tombol "Kirim Ulang Email" muncul ✅
- [ ] Tombol "Cek Status" berfungsi ✅
- [ ] Tombol "Keluar" berfungsi ✅
- [ ] Logout dan login lagi masih ke verify-email ✅
- [ ] Simulasi verify email → Akses dashboard granted ✅
- [ ] Setelah verified, tidak ada banner/redirect ✅

---

## 📝 Notes

- Akun dibuat dengan `email_confirm = false`
- Middleware akan blokir semua akses ke `/dashboard/*` dan `/admin/*`
- Exception hanya untuk `/dashboard/verify-email`
- Email real tidak akan dikirim karena menggunakan `@example.com`
- Untuk testing real email verification, gunakan email asli Anda

---

## 🚀 Next Testing

Setelah testing dengan dummy accounts berhasil:
1. Test dengan member account real: `abdul@temp.dlob.local`
2. Complete profile dengan email asli
3. Test real email verification flow
4. Deploy dan test production

---

**Created:** February 15, 2026
**Status:** ✅ Ready for Testing
