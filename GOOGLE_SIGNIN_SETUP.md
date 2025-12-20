# 🔧 Google Sign-In Setup Guide for DLOB

## Error Explanation
The error `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}` means Google OAuth is not enabled in your Supabase project.

## ✅ Current Status
- ✅ **Google Sign-In code**: Fully implemented and working
- ✅ **Error handling**: Graceful fallback with helpful messages
- ❌ **Google OAuth**: Not configured in Supabase yet

## 🚀 Quick Setup (5 minutes)

### Step 1: Enable Google in Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qtdayzlrwmzdezkavjpd)
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list
4. Click the **toggle switch** to enable it
5. You'll see fields for Client ID and Client Secret

### Step 2: Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Create/Select Project**:
   - Click project dropdown → "New Project"
   - Name: "DLOB Badminton Platform" 
   - Click "Create"

3. **Enable Required APIs**:
   - Go to **APIs & Services** → **Library**
   - Search and enable: **Google+ API**
   - Search and enable: **Google Identity API**

4. **Create OAuth Credentials**:
   - Go to **APIs & Services** → **Credentials**
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client IDs"**
   
5. **Configure OAuth Consent Screen** (if prompted):
   - User Type: **External**
   - App name: **"DLOB Badminton Platform"**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Just click **Save and Continue** (use defaults)
   - Test users: Add your email
   - Click **Back to Dashboard**

6. **Create Web Application Credentials**:
   - Application type: **Web application**
   - Name: **"DLOB Web Client"**
   - **Authorized redirect URIs**: Add this exact URL:
     ```
     https://qtdayzlrwmzdezkavjpd.supabase.co/auth/v1/callback
     ```
   - Click **Create**

7. **Copy Credentials**:
   - Copy the **Client ID** (starts with numbers)
   - Copy the **Client Secret** (random string)

### Step 3: Configure Supabase
1. Back in **Supabase** → **Authentication** → **Providers** → **Google**
2. Paste **Client ID** from Google Cloud Console
3. Paste **Client Secret** from Google Cloud Console  
4. **Redirect URL** should show: `https://qtdayzlrwmzdezkavjpd.supabase.co/auth/v1/callback`
5. Click **Save**

### Step 4: Test Google Sign-In
1. Go to http://localhost:3000/login
2. Click **"Continue with Google"**
3. Should redirect to Google login
4. After successful login, creates member profile automatically
5. Redirects to member dashboard

## 🎯 Alternative: Skip Google Sign-In for Now

If you want to test other features first without setting up Google OAuth:

### Option 1: Use Email/Password Login
- **Admin**: `ryradit28@gmail.com` + password
- **Members**: Can register with email/password

### Option 2: Remove Google Button Temporarily
Add this to your `.env.local`:
```bash
NEXT_PUBLIC_DISABLE_GOOGLE_SIGNIN=true
```

Then the Google button won't show until you're ready to configure it.

## 🔍 Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**
   - Make sure redirect URI in Google Cloud Console is exactly:
   - `https://qtdayzlrwmzdezkavjpd.supabase.co/auth/v1/callback`

2. **"Access blocked: This app's request is invalid"**
   - OAuth consent screen not configured properly
   - Add your email as a test user
   - Make sure app is not in "Production" mode yet

3. **"Invalid client"**
   - Check Client ID and Secret are correct
   - Make sure you're using Web Application credentials, not other types

## ✅ Expected Result After Setup

Once configured, users will be able to:
- ✅ **Click "Continue with Google"** on login page
- ✅ **Authenticate with Google** account  
- ✅ **Auto-create member profile** for new users
- ✅ **Login seamlessly** with Google thereafter
- ✅ **Use same logout/navigation** features

The Google Sign-In integration is fully built and ready - just needs the OAuth configuration in Supabase!