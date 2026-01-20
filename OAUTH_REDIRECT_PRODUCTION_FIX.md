# OAuth Redirect Production Fix Guide

## Problem
Google OAuth is redirecting to `http://localhost:3000` instead of the production URL `https://dlobcommunity.vercel.app` when users sign in on the live site.

## Root Cause
The Supabase dashboard OAuth configuration still has localhost URLs configured as redirect URLs.

## Solution Steps

### 1. Update Supabase Dashboard OAuth Configuration

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/qtdayzlrwmzdezkavjpd
   - Go to Authentication > Settings > Auth Providers

2. **Update Google OAuth Settings**
   - Find the Google provider configuration
   - In the "Redirect URLs" section, add:
     ```
     https://dlobcommunity.vercel.app/auth/callback
     https://qtdayzlrwmzdezkavjpd.supabase.co/auth/v1/callback
     ```
   - Remove or keep localhost URLs for development:
     ```
     http://localhost:3000/auth/callback
     ```

3. **Update Site URL**
   - In Authentication > Settings > General
   - Set Site URL to: `https://dlobcommunity.vercel.app`

### 2. Update Google Cloud Console (if needed)

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Go to APIs & Services > Credentials
   - Find your OAuth 2.0 client ID

2. **Update Authorized Redirect URIs**
   - Add: `https://qtdayzlrwmzdezkavjpd.supabase.co/auth/v1/callback`
   - Keep existing localhost URI for development

### 3. Verify Environment Variables

Ensure these are set in Vercel:
```bash
NEXT_PUBLIC_SITE_URL=https://dlobcommunity.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://qtdayzlrwmzdezkavjpd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDAyODgsImV4cCI6MjA3NjcxNjI4OH0.RhftETaaO_7Y6YoJdKG6nmr5WAM1BT5Ttpww3tzjLLg
NEXT_PUBLIC_FORCE_DEMO_MODE=false
```

### 4. Code Changes Made

Updated `src/lib/auth.ts` to use `getAuthCallbackUrl()` from auth-utils for consistent URL handling:

```typescript
// Get the correct redirect URL using auth-utils
const redirectUrl = getAuthCallbackUrl();
console.log('Google OAuth redirect URL:', redirectUrl);
```

### 5. Testing Steps

After making the changes above:

1. **Test on Production**
   - Go to https://dlobcommunity.vercel.app
   - Click "Sign in with Google"
   - Should redirect to Google OAuth
   - After authentication, should redirect back to production site, not localhost

2. **Test on Development**
   - Go to http://localhost:3000
   - Click "Sign in with Google"
   - Should work with localhost callback

### 6. Expected Behavior

✅ **Production**: Google OAuth → Production callback → Dashboard/Admin
✅ **Development**: Google OAuth → Localhost callback → Dashboard/Admin

### 7. Quick Fix Commands

If you need to deploy the auth fix immediately:

```bash
# Deploy the updated auth configuration
git add .
git commit -m "fix: Use auth-utils for Google OAuth redirect consistency"
git push origin feature/ocr-implementation-ui-cleanup

# Or deploy directly to main if urgent
git checkout main
git merge feature/ocr-implementation-ui-cleanup
git push origin main
```

## Important Notes

- The Supabase dashboard configuration is the most critical step
- Make sure both development and production redirect URLs are configured
- Test thoroughly on both environments after changes
- The `getAuthCallbackUrl()` function automatically detects the environment and returns the correct URL

## Verification

You can verify the OAuth URLs are working by:
1. Opening browser dev tools
2. Going to Network tab
3. Clicking "Sign in with Google"
4. Checking the redirect_uri parameter in the OAuth request

The redirect_uri should match your production domain, not localhost.