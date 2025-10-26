# Supabase Service Role Key Setup for Authentication Creation

## Issue
When adding new members through the admin panel, authentication accounts are not being created because the `SUPABASE_SERVICE_ROLE_KEY` is missing from the environment variables.

## Solution

### 1. Get Your Service Role Key from Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Settings** → **API**
3. In the **Project API keys** section, find the **service_role** key
4. **⚠️ IMPORTANT**: This is a secret key - never expose it in client-side code or public repositories

### 2. Add Service Role Key to Environment Variables

Add the following line to your `frontend/.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ACTUAL_SERVICE_KEY_HERE
```

### 3. Restart Development Server

After adding the key, restart your development server:

```bash
npm run dev
```

## What This Enables

- ✅ **Automatic user account creation** when adding members through admin panel
- ✅ **Auto-confirmed email addresses** (no verification needed for admin-created users)
- ✅ **Default password setting** (`password123` for new members)
- ✅ **Metadata linking** between auth users and member records

## Security Notes

- The service role key bypasses Row Level Security (RLS)
- Only use it in server-side API routes (never in client-side code)
- Keep it secure and never commit it to version control
- Consider rotating it periodically

## Testing Auth Creation

After adding the service role key:

1. Go to **Match Management** → **Create Match** tab
2. Click **"+ Add New Member"**
3. Enter member details and click **"Add Member"**
4. You should see a success message with login credentials
5. The new member can now log in with their email and password `password123`

## Fallback Method

If service role key setup fails, the system will attempt to create users through the regular signup flow, but this may require email verification.