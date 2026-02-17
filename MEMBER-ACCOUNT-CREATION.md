# Member Account Creation - Simple Guide

This guide explains how to create accounts for all 39 members using their names from the members folder.

## Overview

- **Total Members**: 39 (extracted from `public/images/members/` folder)
- **Template Email**: `[username]@temp.dlob.local`
- **Template Password**: `DLOB2026`
- **First Login**: Members must update email and password

## Quick Start

### Step 1: Update Database Schema

Run this in Supabase SQL Editor:

```sql
-- Add required columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS using_temp_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
```

Or run the complete script:
```bash
# In Supabase SQL Editor, run:
supabase-create-members-from-folder.sql
```

### Step 2: Create Member Accounts

**Option A: PowerShell (Easiest)**
```powershell
.\create-members.ps1
```

**Option B: Node.js**
```bash
node create-members-script.js
```

### Step 3: Share Credentials with Members

Send each member their login details:

```
Hi [Member Name],

Welcome to DLOB Community! Your account has been created.

Login at: https://yourdomain.com/login
Email: [username]@temp.dlob.local
Password: DLOB2026

IMPORTANT: On first login, you'll be asked to:
1. Update your real email address
2. Create a new password

See you on the  court!
DLOB Team
```

## Member List

The following 39 members will be created:

1. abdul
2. adi
3. adit
4. alex
5. anthony
6. ardo
7. aren
8. arifin
9. bagas
10. bibit
11. danif
12. dedi
13. dimas
14. dinda
15. edi
16. eka
17. fanis
18. ganex
19. gavin
20. hendi
21. herdan
22. herry
23. iyan
24. jonathan
25. kiki
26. lorenzo
27. mario
28. murdi
29. northon
30. rara
31. reyza
32. tian2
33. uti
34. wahyu
35. wien
36. wiwin
37. yaya
38. yogie
39. zaka

## Login Examples

| Member | Email | Password | Avatar |
|--------|-------|----------|----------|
| Abdul | abdul@temp.dlob.local | DLOB2026 | /images/members/abdul.jpg |
| Rara | rara@temp.dlob.local | DLOB2026 | /images/members/rara.jpg |
| Mario | mario@temp.dlob.local | DLOB2026 | /images/members/mario.jpg |

## First Login Flow

### 1. Member logs in with temp credentials
- Email: `username@temp.dlob.local`
- Password: `DLOB2026`

### 2. Automatic redirect to Complete Profile page
- Middleware detects `using_temp_email = true`
- Redirects to `/dashboard/complete-profile`

### 3. Member completes profile
- Enters real email address
- Creates new password
- Confirms password

### 4. Profile updated
- Email updated in `auth.users`
- Password updated in `auth.users`
- `using_temp_email` set to `false`
- `must_change_password` set to `false`

### 5. Full dashboard access
- Member can now access all features
- Avatar automatically linked from their image file

## Verification

### Check created accounts
```sql
-- Run in Supabase SQL Editor
SELECT * FROM member_accounts_status;
```

### Check who has logged in
```sql
SELECT 
    full_name,
    email,
    last_sign_in_at,
    CASE 
        WHEN using_temp_email THEN '⚠️ Needs email update'
        ELSE '✓ Email updated'
    END as status
FROM member_accounts_status
WHERE last_sign_in_at IS NOT NULL
ORDER BY last_sign_in_at DESC;
```

### Find members who haven't updated profile
```sql
SELECT 
    full_name,
    email,
    last_sign_in_at
FROM member_accounts_status
WHERE using_temp_email = true
ORDER BY full_name;
```

## Files Created

| File | Purpose |
|------|---------|
| `supabase-create-members-from-folder.sql` | Database schema and verification queries |
| `create-members-script.js` | Node.js script to create accounts |
| `create-members.ps1` | PowerShell script wrapper |
| `src/app/dashboard/complete-profile/page.tsx` | Profile completion page |
| `src/app/api/complete-profile/route.ts` | API to update email/password |
| `middleware.ts` | Updated to redirect temp email users |

## Troubleshooting

### "Email already in use"
- Check if account was already created
- Query: `SELECT * FROM auth.users WHERE email LIKE '%@temp.dlob.local'`

### Script fails with "Missing Supabase credentials"
- Check `.env.local` exists
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### Member can't complete profile
- Check if `/api/complete-profile` endpoint is working
- Verify member provided valid email (not @temp.dlob.local)
- Check browser console for errors

### Member stuck in redirect loop
- Check middleware is correctly detecting profile completion
- Verify `using_temp_email` and `must_change_password` are updated
- Clear browser cookies and try again

## Security Notes

✅ **Good Practices:**
- Template password is simple for initial login only
- Members forced to change password immediately
- Temp emails can't be used permanently
- Real emails required for full access

⚠️ **Important:**
- Don't share template password publicly after setup
- Monitor which members have updated their profiles
- Consider setting expiry date for temp accounts
- Send reminder emails to members who haven't updated

## Production Checklist

Before deploying:

- [ ] Run database schema update in production Supabase
- [ ] Create all member accounts
- [ ] Test login with test account
- [ ] Verify profile completion flow works
- [ ] Prepare welcome emails for all members
- [ ] Set up monitoring for incomplete profiles
- [ ] Document process for adding new members later

## Adding New Members Later

1. Add image to `public/images/members/[username].jpg`
2. Edit `create-members-script.js` and add username to array
3. Run `node create-members-script.js`
4. Send welcome email to new member

Or manually:
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Invite User"
3. Email: `[username]@temp.dlob.local`
4. Password: `DLOB2026`
5. Confirm email automatically
6. Update profile with temp email flags

## Support

For issues or questions:
1. Check Supabase logs for errors
2. Verify middleware is redirecting correctly
3. Test with a single account first
4. Check browser console for client-side errors
