# 🚀 Domain Migration Guide: dlobcommunity.online

## ✅ **Completed Steps:**
- [x] Added NEXT_PUBLIC_SITE_URL environment variable
- [x] Created production environment file (.env.prod)
- [x] Code already uses dynamic URL resolution via auth-utils.ts

## 📋 **Required Implementation Steps:**

### **1. Supabase Configuration** ⚠️ **CRITICAL**
Go to your Supabase dashboard and update:

1. **Authentication Settings:**
   - Navigate to: Project Settings → Authentication → URL Configuration
   - **Site URL:** `https://www.dlobcommunity.online`
   - **Additional Redirect URLs:** Add `https://www.dlobcommunity.online/**`

2. **Allowed Origins:**
   - Add: `https://www.dlobcommunity.online`
   - Keep: `http://localhost:3000` (for development)

### **2. Deployment Platform Setup**

#### **If using Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod

# Add environment variables in Vercel dashboard:
# - Copy all variables from .env.prod
# - Set custom domain to www.dlobcommunity.online
```

#### **If using Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
cd frontend
npm run build
netlify deploy --prod --dir=.next

# Add environment variables in Netlify dashboard
# Set custom domain to www.dlobcommunity.online
```

### **3. Google OAuth Configuration** (If using Google Sign-in)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Update OAuth 2.0 Client IDs:
   - **Authorized JavaScript origins:** Add `https://www.dlobcommunity.online`
   - **Authorized redirect URIs:** Add `https://www.dlobcommunity.online/auth/v1/callback`
   - **Keep existing Supabase callback:** `https://qtdayzlrwmzdezkavjpd.supabase.co/auth/v1/callback`

### **4. DNS Configuration**
Ensure your domain points to your hosting provider:
- **Vercel:** Add CNAME record pointing to vercel.app
- **Netlify:** Add CNAME record pointing to netlify.app
- **Custom:** Configure A/AAAA records as needed

### **5. SSL Certificate**
- Most hosting platforms (Vercel, Netlify) provide automatic SSL
- Ensure HTTPS redirect is enabled

### **6. Environment Variables**
Copy these to your production environment:

```env
NEXT_PUBLIC_SITE_URL=https://www.dlobcommunity.online
NEXT_PUBLIC_SUPABASE_URL=https://qtdayzlrwmzdezkavjpd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDAyODgsImV4cCI6MjA3NjcxNjI4OH0.RhftETaaO_7Y6YoJdKG6nmr5WAM1BT5Ttpww3tzjLLg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE0MDI4OCwiZXhwIjoyMDc2NzE2Mjg4fQ.jMEuVvHyeNDqfcdqXDsqQFbFAvMWiSiaYRROwVPzxQU
NEXT_PUBLIC_FORCE_DEMO_MODE=false
JWT_SECRET=your_production_jwt_secret_key_here_make_it_very_secure_for_production
```

### **7. Testing Checklist**
After deployment, test:
- [ ] Homepage loads at https://www.dlobcommunity.online
- [ ] Authentication (Google Sign-in) works
- [ ] All pages load correctly
- [ ] Pre-order form submits successfully
- [ ] Store page displays properly
- [ ] Dashboard functionality works
- [ ] Mobile responsiveness

### **8. SEO & Performance**
- [ ] Add sitemap.xml
- [ ] Update meta tags with new domain
- [ ] Set up Google Analytics (if needed)
- [ ] Configure CDN if using custom hosting

## 🔧 **Code Changes Made:**
1. ✅ Added `NEXT_PUBLIC_SITE_URL` environment variable
2. ✅ Created production environment file
3. ✅ Code already uses dynamic URL resolution (no hardcoded URLs)

## 🚨 **Important Notes:**
- **Supabase URL configuration is CRITICAL** - authentication won't work without it
- Keep localhost URLs for development
- Use HTTPS everywhere in production
- Test thoroughly before going live

## 📞 **Support:**
If you encounter issues:
1. Check browser console for errors
2. Verify environment variables are set
3. Check Supabase authentication settings
4. Ensure DNS propagation is complete (may take 24-48 hours)