# Authentication Debug Guide - Production vs Localhost

## Issue: Dashboard Button Not Showing in Production

This guide will help you debug why the dashboard button appears on localhost but not on your production domain.

---

## What We Fixed

### 1. **Enhanced Supabase Client Configuration**
- Added explicit localStorage storage configuration
- Added custom storage key: `sb-auth-token`
- Added client headers for better tracking

### 2. **Improved Middleware**
- Now handles ALL routes (not just `/dashboard`)
- Properly manages cookies across requests
- Refreshes session on every page load
- Works for both localhost and production domains

### 3. **Added Debug Logging**
- Console logs in Navbar showing auth state
- Console logs in AuthContext showing session initialization
- Helps identify where authentication is failing

---

## How to Debug on Production

### Step 1: Check Browser Console
Open your production site and check the browser console (F12):

Look for these log messages:
```
🚀 [AuthContext] Initializing auth...
🔐 [AuthContext] Session retrieved: { hasSession: true/false, ... }
👤 [AuthContext] User found, syncing avatar...
✅ [AuthContext] Role fetched: admin/member
🔍 [Navbar Debug] Auth State: { loading: false, hasUser: true/false, ... }
```

**What to look for:**
- If `hasSession: false` → Session not being retrieved
- If `localStorage: 'no token'` → Auth token not stored
- If `loading: true` → Still initializing (should become false)

### Step 2: Check LocalStorage
In browser console, run:
```javascript
localStorage.getItem('sb-auth-token')
```

**Expected result:**
- Should show a long JSON string with your session data
- If `null` → Session not being persisted

### Step 3: Check Cookies
In DevTools → Application → Cookies:

Look for cookies starting with `sb-`:
- `sb-access-token`
- `sb-refresh-token`

**If missing:** Cookies might be blocked or not set correctly.

### Step 4: Compare Localhost vs Production

Run the same checks on both:

| Check | Localhost | Production |
|-------|-----------|------------|
| Console logs show session? | ✓ | ? |
| LocalStorage has token? | ✓ | ? |
| Cookies are set? | ✓ | ? |
| Dashboard button appears? | ✓ | ? |

---

## Common Issues & Solutions

### Issue 1: Cookies Not Set in Production
**Symptoms:**
- localStorage empty
- No `sb-` cookies
- User is `null` despite logging in

**Solution:**
1. Check Supabase Dashboard → Settings → Authentication → URL Configuration
2. Make sure your production domain is in:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**: `https://your-domain.com/**`

### Issue 2: Third-Party Cookies Blocked
**Symptoms:**
- Works in localhost
- Fails in production
- Browser console shows cookie warnings

**Solution:**
1. Enable third-party cookies for your site in browser settings
2. Or use a custom domain for Supabase (if available)

### Issue 3: Session Not Refreshing
**Symptoms:**
- User logged in but session expired
- Dashboard shows after page refresh

**Solution:**
- Already fixed with updated middleware
- Middleware now refreshes session on every page load

### Issue 4: CORS Issues
**Symptoms:**
- Console shows CORS errors
- Network tab shows failed requests to Supabase

**Solution:**
1. Go to Supabase Dashboard → Settings → API
2. Add your production domain to CORS allowed origins

### Issue 5: Environment Variables Not Set
**Symptoms:**
- `NEXT_PUBLIC_SUPABASE_URL` is undefined
- Console errors about Supabase initialization

**Solution (Vercel):**
1. Go to Project Settings → Environment Variables
2. Ensure both variables are set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
3. **Important:** Redeploy after adding variables!

---

## Testing Checklist

After deploying these fixes:

- [ ] Clear browser cache completely
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Clear cookies for your domain
- [ ] Log in again on production
- [ ] Check console logs (F12)
- [ ] Verify localStorage has `sb-auth-token`
- [ ] Navigate to homepage
- [ ] Dashboard button should appear
- [ ] Click Dashboard → should go to dashboard (not login)

---

## If Still Not Working

### Collect This Information:

1. **Console Logs:**
   ```javascript
   // Run this in production console:
   console.log('Auth Debug:', {
     localStorage: localStorage.getItem('sb-auth-token') ? 'exists' : 'missing',
     cookies: document.cookie.includes('sb-') ? 'exists' : 'missing',
     supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
   });
   ```

2. **Network Tab:**
   - Filter by "supabase"
   - Look for failed requests
   - Check response codes (200 OK vs 401 Unauthorized vs 403 Forbidden)

3. **Share Screenshots:**
   - Console errors
   - Network tab
   - Application → LocalStorage
   - Application → Cookies

---

## Root Cause Analysis

The most common reason for "works on localhost but not production":

1. **Cookie Domain Mismatch**
   - Localhost uses `localhost` domain
   - Production uses your custom domain
   - Cookies must be set for the correct domain

2. **HTTPS Requirements**
   - Production uses HTTPS (secure cookies)
   - Localhost uses HTTP
   - Secure cookies have stricter rules

3. **Environment Variables**
   - Must be set in hosting platform (Vercel/Netlify)
   - Must match your production Supabase project
   - Requires redeployment after changes

---

## Quick Fix Commands

**To reset everything on production:**

```javascript
// Run in browser console on your production site:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Then log in again and check if dashboard appears.

---

## Contact for Further Help

If the issue persists after trying all steps:
1. Share console logs
2. Share network requests (filter: supabase)
3. Confirm environment variables are set correctly
4. Verify Supabase redirect URLs include your domain

The debug logs we added will help identify exactly where authentication is failing!
