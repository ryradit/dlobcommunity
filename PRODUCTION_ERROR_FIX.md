# 🚨 **PRODUCTION ERROR TROUBLESHOOTING**

## **Current Issue: 500 Internal Server Error**
Your app is deployed but the `/api/pre-orders` endpoint is failing.

## **🔍 Quick Diagnosis Steps:**

### **1. Test Your Debug Endpoint**
Visit: `https://www.dlobcommunity.online/api/debug`

This will show you:
- ✅/❌ Environment variables status
- 🔌 Supabase connection test results
- 📊 Server configuration details

### **2. Most Likely Issues:**

#### **Missing Environment Variables** (90% chance)
Your hosting platform doesn't have the required environment variables set.

**Solution:**
1. **Go to your hosting dashboard** (Vercel/Netlify/etc.)
2. **Add ALL environment variables** from your `.env.prod` file
3. **Critical variables needed:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://qtdayzlrwmzdezkavjpd.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_FORCE_DEMO_MODE=false
   ```

#### **Supabase RLS Policies** (10% chance)
Your database might be blocking the insert.

**Quick Test:**
Set `NEXT_PUBLIC_FORCE_DEMO_MODE=true` temporarily to see if the form works in demo mode.

### **3. Hosting Platform Instructions:**

#### **Vercel Dashboard:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project → Settings → Environment Variables
3. Add each variable from `.env.prod`
4. **Redeploy** the project

#### **Netlify Dashboard:**
1. Go to [netlify.com/sites](https://app.netlify.com/sites)
2. Click your site → Site Settings → Environment Variables
3. Add each variable from `.env.prod`
4. **Trigger new deploy**

### **4. Quick Fixes to Try:**

#### **Enable Demo Mode Temporarily**
Set this environment variable to test:
```
NEXT_PUBLIC_FORCE_DEMO_MODE=true
```

#### **Check Supabase URL Configuration**
Ensure your Supabase project allows your domain:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Project Settings → Authentication → URL Configuration
3. **Site URL:** `https://www.dlobcommunity.online`
4. **Allowed Origins:** Add `https://www.dlobcommunity.online`

## **🐛 Error Analysis:**

The error `POST https://www.dlobcommunity.online/api/pre-orders 500` means:
- ✅ Your domain is working
- ✅ Next.js is deployed successfully  
- ✅ API routes are accessible
- ❌ **Server-side code is failing**

Most common causes:
1. **Missing `SUPABASE_SERVICE_ROLE_KEY`** (causes authentication failure)
2. **Missing `NEXT_PUBLIC_SUPABASE_URL`** (causes connection failure)
3. **Wrong environment variable names** (typos)
4. **Supabase RLS blocking inserts** (access denied)

## **📞 Next Steps:**

1. **Visit `/api/debug`** first to see what's missing
2. **Add missing environment variables** to your hosting platform
3. **Redeploy** your application
4. **Test again** - the error should be resolved

## **🚀 Expected Result:**
After fixing environment variables, your pre-order form should work perfectly on `https://www.dlobcommunity.online`!