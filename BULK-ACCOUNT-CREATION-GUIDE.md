# Bulk Account Creation Guide

This guide explains how to create accounts for all members with a template password.

## Quick Start

### Option 1: Using the API Endpoint (Recommended)

**1. Prepare your member data in JSON format:**

```json
{
  "members": [
    {
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "08123456789",
      "playing_level": "Intermediate",
      "dominant_hand": "Right",
      "years_playing": "2-5 years"
    },
    {
      "full_name": "Jane Smith",
      "email": "jane.smith@example.com",
      "phone": "08234567890",
      "playing_level": "Advanced",
      "dominant_hand": "Left",
      "years_playing": "5+ years"
    }
  ],
  "template_password": "DLOB2026!Member",
  "send_email": false
}
```

**2. Get your admin access token:**
- Login to the admin dashboard
- Open browser console (F12)
- Run: `localStorage.getItem('supabase.auth.token')`
- Copy the token value

**3. Send POST request:**

Using `curl`:
```bash
curl -X POST https://yourdomain.com/api/admin/bulk-create-accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d @members.json
```

Using PowerShell:
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_ADMIN_TOKEN"
}

$body = @{
    members = @(
        @{
            full_name = "John Doe"
            email = "john.doe@example.com"
            phone = "08123456789"
            playing_level = "Intermediate"
            dominant_hand = "Right"
        }
    )
    template_password = "DLOB2026!Member"
    send_email = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/bulk-create-accounts" `
  -Method Post `
  -Headers $headers `
  -Body $body
```

Using Node.js/JavaScript:
```javascript
const response = await fetch('http://localhost:3000/api/admin/bulk-create-accounts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  },
  body: JSON.stringify({
    members: [
      {
        full_name: "John Doe",
        email: "john.doe@example.com",
        phone: "08123456789",
        playing_level: "Intermediate",
        dominant_hand: "Right"
      }
    ],
    template_password: "DLOB2026!Member",
    send_email: false
  })
});

const result = await response.json();
console.log(result);
```

**4. Response format:**

```json
{
  "success": true,
  "summary": {
    "total": 50,
    "created": 48,
    "exists": 2,
    "errors": 0
  },
  "results": [
    {
      "email": "john.doe@example.com",
      "status": "created",
      "user_id": "uuid-here"
    },
    {
      "email": "existing@example.com",
      "status": "exists",
      "error": "Account already exists"
    }
  ],
  "template_password": "DLOB2026!Member"
}
```

### Option 2: Using Supabase SQL (Manual)

1. Open `supabase-bulk-create-accounts.sql`
2. Update the member data in the INSERT statement
3. Set your template password
4. Run in Supabase SQL Editor
5. Note: You'll need to create auth.users manually via Supabase Dashboard or Admin API

## API Endpoints

### POST `/api/admin/bulk-create-accounts`

Create multiple user accounts at once.

**Authorization:** Admin only (Bearer token)

**Request Body:**
```typescript
{
  members: Array<{
    full_name: string;
    email: string;
    phone?: string;
    playing_level?: string;      // "Beginner" | "Intermediate" | "Advanced"
    dominant_hand?: string;        // "Left" | "Right"
    years_playing?: string;        // "< 1 year" | "1-2 years" | "2-5 years" | "5+ years"
    role?: string;                 // Default: "member"
  }>;
  template_password: string;       // Min 6 characters
  send_email?: boolean;            // Default: false
}
```

**Response:**
```typescript
{
  success: boolean;
  summary: {
    total: number;
    created: number;
    exists: number;
    errors: number;
  };
  results: Array<{
    email: string;
    status: "created" | "exists" | "error";
    user_id?: string;
    error?: string;
  }>;
  template_password: string;
}
```

### GET `/api/admin/bulk-create-accounts`

List all users (for verification).

**Authorization:** Admin only

**Response:**
```typescript
{
  total_auth_users: number;
  total_profiles: number;
  users: Array<{
    id: string;
    email: string;
    created_at: string;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
  }>;
}
```

## Template Password Guidelines

Choose a strong template password that members will change on first login:

- ✅ **Good:** `DLOB2026!Member`, `Badminton@2026`, `Welcome2DLOB!`
- ❌ **Bad:** `123456`, `password`, `member`

**Requirements:**
- Minimum 6 characters (recommended: 12+)
- Include uppercase and lowercase letters
- Include numbers
- Include special characters
- Easy to communicate to members

## After Account Creation

### 1. Send Welcome Emails

Each member needs to receive:

```
Subject: Welcome to DLOB Community - Your Account Details

Hi [Member Name],

Welcome to DLOB Badminton Community! Your account has been created.

Login Details:
- Website: https://yourdomain.com/login
- Email: [member.email]
- Temporary Password: [template_password]

IMPORTANT: Please change your password after first login.

To change your password:
1. Login with the details above
2. Go to Settings > Change Password
3. Choose a strong, unique password

See you on the court!
DLOB Admin Team
```

### 2. Force Password Change (Optional)

To enforce password change on first login, you can:

1. Add a `password_changed` flag to profiles table
2. Check this flag in middleware
3. Redirect to password change page if false

### 3. Verify Accounts

Use the GET endpoint to verify all accounts were created:

```bash
curl -X GET https://yourdomain.com/api/admin/bulk-create-accounts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Example Member Data Templates

### From CSV

If you have members in CSV format:

```csv
full_name,email,phone,playing_level,dominant_hand,years_playing
John Doe,john.doe@example.com,08123456789,Intermediate,Right,2-5 years
Jane Smith,jane.smith@example.com,08234567890,Advanced,Left,5+ years
```

Convert to JSON using:
```bash
# Using jq (Linux/Mac)
cat members.csv | jq -Rs 'split("\n") | map(split(",")) | .[1:] | map({full_name: .[0], email: .[1], phone: .[2], playing_level: .[3], dominant_hand: .[4], years_playing: .[5]})'
```

### From Google Sheets

1. Export as CSV
2. Use the conversion method above
3. Or manually format as JSON

### Bulk Import Script

Create a Node.js script:

```javascript
const fs = require('fs');
const fetch = require('node-fetch');

const members = JSON.parse(fs.readFileSync('members.json', 'utf8'));
const adminToken = 'YOUR_ADMIN_TOKEN';

async function bulkCreate() {
  const response = await fetch('http://localhost:3000/api/admin/bulk-create-accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      members: members,
      template_password: 'DLOB2026!Member',
      send_email: false
    })
  });

  const result = await response.json();
  console.log('Summary:', result.summary);
  console.log('Created accounts:', result.results.filter(r => r.status === 'created').length);
  
  // Save results to file
  fs.writeFileSync('creation-results.json', JSON.stringify(result, null, 2));
}

bulkCreate();
```

## Troubleshooting

### "Unauthorized" Error
- Verify you're using admin account token
- Check token hasn't expired (login again)
- Ensure Authorization header is correctly formatted

### "Email already exists"
- Normal if member already has an account
- Check in Supabase dashboard: Authentication > Users
- Use GET endpoint to list existing users

### "Password too weak"
- Use minimum 6 characters
- Recommended: 12+ with uppercase, lowercase, numbers, symbols

### Users created but no profiles
- Check Supabase triggers are enabled
- Run Step 5 of SQL script to manually create profiles
- Verify `handle_new_user()` function exists

### Rate limiting
- API includes 100ms delay between each user
- For large batches (100+), split into multiple requests
- Wait 1-2 seconds between batches

## Security Notes

⚠️ **IMPORTANT:**

1. **Never commit template passwords to git**
2. **Use HTTPS in production**
3. **Change template password after bulk creation**
4. **Require password change on first login**
5. **Use email confirmation in production** (set `send_email: true`)
6. **Log and monitor account creation activity**
7. **Revoke admin tokens after use**

## Testing

Test with a few accounts first:

```json
{
  "members": [
    {
      "full_name": "Test User",
      "email": "test@example.com",
      "playing_level": "Beginner"
    }
  ],
  "template_password": "TestPass123!",
  "send_email": false
}
```

Verify:
1. User appears in Supabase Authentication
2. Profile created in profiles table
3. User can login with email + template password
4. User can change password

## Support

If you encounter issues:
1. Check Supabase logs
2. Check browser console for errors
3. Verify service role key is set in `.env.local`
4. Test with a single account first
