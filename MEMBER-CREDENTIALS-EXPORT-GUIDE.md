# Member Credentials Export Guide

## Overview

Script untuk membuat **Excel file** berisi credentials (email & password) untuk semua member DLOB Community yang menggunakan temporary email (`@temp.dlob.local`).

File Excel ini dapat dibagikan kepada member untuk informasi login mereka.

---

## ✨ Features

### Excel File Contains:

#### **Sheet 1: Member Credentials**
| No | Nama Lengkap | Email (Username) | Password | Status | Catatan |
|----|--------------|------------------|----------|--------|---------|
| 1  | Yudha        | yudha@temp.dlob.local | DLOB2026 | Akun Aktif | Silakan login dan lengkapi profil Anda |
| 2  | Yudi         | yudi@temp.dlob.local | DLOB2026 | Akun Aktif | Silakan login dan lengkapi profil Anda |
| ... | ... | ... | ... | ... | ... |

#### **Sheet 2: Instruksi**
- Panduan lengkap cara login
- Instruksi mengganti email temporary ke email pribadi
- Informasi penting tentang keamanan account

---

## 🚀 Quick Start

### 1. Run the Export Script

```powershell
node export-member-credentials.js
```

### 2. Output

Script akan membuat file Excel di folder root project:
```
DLOB_Member_Credentials_2026-02-19.xlsx
```

### 3. File Contents

Excel file berisi:
- ✅ Nama lengkap member
- ✅ Email (username) untuk login
- ✅ Password default (DLOB2026)
- ✅ Status akun
- ✅ Instruksi login lengkap (Bahasa Indonesia)

---

## 📋 Example Output

```
📊 DLOB Member Credentials Export

🔍 Checking environment variables...
   Supabase URL: ✅ Found
   Service Key: ✅ Found

📋 Fetching members from database...

✅ Found 12 members with temporary emails

   1. Yudha
      Email: yudha@temp.dlob.local
      Password: DLOB2026

   2. Yudi
      Email: yudi@temp.dlob.local
      Password: DLOB2026

   [... more members ...]

✅ Excel file created successfully!
📁 File location: D:\Kerjaan\dlob-webnew\DLOB_Member_Credentials_2026-02-19.xlsx
📊 Total members: 12

📋 File contains:
   - Sheet 1: Member Credentials (username & password)
   - Sheet 2: Login Instructions (Bahasa Indonesia)

⚠️  IMPORTANT: This file contains sensitive information!
   - Keep it secure and share only with authorized members
   - Consider password-protecting the Excel file before sharing
   - Delete after distributing to members
```

---

## 🔒 Security Best Practices

### **Before Sharing the File:**

1. **Password Protect the Excel**
   - Open file in Excel
   - Go to: File → Info → Protect Workbook → Encrypt with Password
   - Set a strong password
   - Share password separately (via WhatsApp/SMS)

2. **Share Securely**
   - Use encrypted messaging (WhatsApp, Telegram)
   - Or use secure file sharing (Google Drive with restricted access)
   - Never email unprotected credentials

3. **After Distribution**
   - Delete the Excel file from your computer
   - Clear any backups or copies
   - Inform members to delete after saving their credentials

---

## 📱 How Members Use This Information

### Step 1: Receive Excel File
Member menerima file Excel dari admin (password-protected)

### Step 2: Open & Find Credentials
Buka Excel, cari nama mereka, catat:
- Email (username)
- Password

### Step 3: Login to Platform
1. Go to: https://dlob.community
2. Click "Login"
3. Enter email & password from Excel
4. Login berhasil!

### Step 4: Complete Profile
1. Ganti email temporary → email pribadi
2. Verifikasi email baru
3. (Optional) Ganti password default

---

## 🔧 Customization

### Change Default Password

Edit in script:
```javascript
const defaultPassword = 'DLOB2026';  // Change here
```

### Add More Columns

Edit the `memberData.push()` section:
```javascript
memberData.push({
  'No': memberData.length + 1,
  'Nama Lengkap': fullName,
  'Email (Username)': user.email,
  'Password': 'DLOB2026',
  'Status': 'Akun Aktif',
  'Catatan': 'Silakan login dan lengkapi profil Anda',
  'Tanggal Dibuat': new Date().toLocaleDateString('id-ID')  // New column
});
```

### Change File Name

Edit the filename template:
```javascript
const filename = `DLOB_Member_Credentials_${timestamp}.xlsx`;
```

---

## ❓ Troubleshooting

### Issue: "No members with temporary emails found"

**Solution:**
- Check if members have been created with `@temp.dlob.local` emails
- Run `node create-multiple-members.js` to create members first

### Issue: "Missing Supabase credentials"

**Solution:**
- Ensure `.env.local` exists
- Check `NEXT_PUBLIC_SUPABASE_URL` is set
- Check `SUPABASE_SERVICE_ROLE_KEY` is set

### Issue: "Database permission issue"

**Solution:**
- Service role key should bypass RLS
- Check Supabase dashboard for any database errors
- Verify profiles table exists

### Issue: Excel file won't open

**Solution:**
- Make sure `xlsx` package is installed: `npm install xlsx`
- Check write permissions in project folder
- Try different Excel viewer (Excel, LibreOffice, Google Sheets)

---

## 📊 Excel File Features

### Auto-Formatted Columns
- Number column: 5 characters wide
- Name: 25 characters wide
- Email: 35 characters wide
- Password: 12 characters wide
- Status: 15 characters wide
- Notes: 40 characters wide

### Two Sheets
1. **Member Credentials** - Main data
2. **Instruksi** - Login instructions in Indonesian

### Professional Appearance
- Clean headers
- Properly sized columns
- Easy to read
- Print-friendly

---

## 🎯 Use Cases

### 1. **New Member Onboarding**
- Create accounts for new members
- Export credentials to Excel
- Share file securely
- Members can login immediately

### 2. **Batch Account Creation**
- Admin creates multiple accounts at once
- Export all credentials
- Distribute to members via WhatsApp group
- Track who has logged in

### 3. **Password Recovery**
- Member forgets password
- Admin can re-export their credentials
- Share individual credentials securely

### 4. **Audit Trail**
- Keep encrypted copy for audit purposes
- Know which members have temp vs real emails
- Track account creation dates

---

## 📝 Notes

- **Default Password**: DLOB2026 (same for all members)
- **Email Format**: `[username]@temp.dlob.local`
- **Excel Format**: `.xlsx` (Excel 2007+)
- **Encoding**: UTF-8 (supports Indonesian characters)

---

## 🔄 Workflow Example

```
┌─────────────────────────────────────────┐
│  1. Admin creates member accounts       │
│     (node create-multiple-members.js)   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  2. Export credentials to Excel         │
│     (node export-member-credentials.js) │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  3. Password-protect Excel file         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  4. Share via WhatsApp/Telegram         │
│     + Share password separately         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  5. Members login & complete profile    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  6. Delete Excel file (security)        │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist for Admins

Before sharing credentials:

- [ ] Run export script successfully
- [ ] Verify all members are in Excel
- [ ] Check names and emails are correct
- [ ] Password-protect Excel file
- [ ] Test opening file with password
- [ ] Share file via secure channel
- [ ] Share password separately
- [ ] Confirm members received it
- [ ] Delete original file after distribution
- [ ] Remind members to complete profile

---

## 🆘 Support

For issues or questions:
1. Check this guide first
2. Verify `.env.local` configuration
3. Check Supabase dashboard
4. Review script console output

---

**Generated**: February 19, 2026  
**Version**: 1.0.0  
**Maintained by**: DLOB Platform Team
