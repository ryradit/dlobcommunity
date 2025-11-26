# 🔧 OAuth Redirect URL Fix for Production Deployment

## Problem
When deploying to Vercel, Google OAuth redirects users to `http://localhost:3000` instead of your production URL, causing the error you encountered.

## Solution Implemented

### 1. Updated Auth Service
Modified `frontend/src/lib/auth.ts` to dynamically detect the environment and use the correct redirect URL:

- ✅ **Development**: Uses `http://localhost:3000/auth/callback`
- ✅ **Production**: Uses your Vercel URL + `/auth/callback`
- ✅ **Custom Domain**: Uses `NEXT_PUBLIC_SITE_URL` environment variable

### 2. Environment Variables Required

#### For Vercel Deployment (Production)
Add these environment variables in your **Vercel Dashboard** → Project → Settings → Environment Variables:

```bash
# Required: Your production site URL
NEXT_PUBLIC_SITE_URL=https://YOUR-APP.vercel.app

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qtdayzlrwmzdezkavjpd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDAyODgsImV4cCI6MjA3NjcxNjI4OH0.RhftETaaO_7Y6YoJdKG6nmr5WAM1BT5Ttpww3tzjLLg

# Disable demo mode for production
NEXT_PUBLIC_FORCE_DEMO_MODE=false
```

### 3. Supabase Dashboard Configuration

#### Update OAuth Redirect URLs in Supabase:

1. **Go to Supabase Dashboard** → Your Project → Authentication → URL Configuration

2. **Add these URLs to "Redirect URLs":**
   ```
   http://localhost:3000/auth/callback
   https://YOUR-APP.vercel.app/auth/callback
   ```

3. **Update Site URL:**
   ```
   https://YOUR-APP.vercel.app
   ```

#### Google OAuth Provider Setup:
1. **Authentication** → Providers → Google
2. **Enable Google Provider**
3. **Add your Google OAuth credentials**:
   - Client ID: `YOUR_GOOGLE_CLIENT_ID`
   - Client Secret: `YOUR_GOOGLE_CLIENT_SECRET`

### 4. Google Cloud Console Configuration

#### Update Authorized Redirect URIs:
1. **Go to Google Cloud Console** → APIs & Services → Credentials
2. **Find your OAuth 2.0 Client ID**
3. **Add both URLs to "Authorized redirect URIs":**
   ```
   https://qtdayzlrwmzdezkavjpd.supabase.co/auth/v1/callback
   ```

## How to Deploy the Fix

### Step 1: Commit and Push Changes
```bash
git add .
git commit -m "fix: OAuth redirect URL for production deployment"
git push
```

### Step 2: Update Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the variables listed above
4. Redeploy your application

### Step 3: Update Supabase Configuration
1. Update redirect URLs in Supabase Dashboard as described above
2. Ensure Google OAuth provider is properly configured

### Step 4: Test the Fix
1. Visit your production site: `https://YOUR-APP.vercel.app`
2. Try Google Sign-In
3. Should now redirect properly to your production callback URL

## Verification

After deployment, the OAuth flow should work like this:

1. **User clicks "Sign in with Google"** → Google OAuth page
2. **User authorizes** → Redirects to `https://YOUR-APP.vercel.app/auth/callback`
3. **Callback processes** → User lands on dashboard/admin panel
4. **No more localhost redirects!** ✅

## Troubleshooting

### If still redirecting to localhost:
1. **Clear browser cache and cookies**
2. **Verify Vercel environment variables are set**
3. **Check Supabase redirect URLs include both localhost AND production**
4. **Ensure latest code is deployed to Vercel**

### If Google OAuth not working:
1. **Check Google Cloud Console redirect URIs**
2. **Verify Supabase Google provider is enabled**
3. **Confirm environment variables are correct**

## Notes

- The fix automatically detects the environment (dev vs production)
- No code changes needed when switching between environments
- Supports custom domains via `NEXT_PUBLIC_SITE_URL`
- Maintains backward compatibility with localhost development

---

**Result**: Users can now successfully sign in with Google on your production Vercel deployment! 🎉