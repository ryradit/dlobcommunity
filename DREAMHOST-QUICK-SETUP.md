# 🚀 DreamHost + Vercel Quick Setup Guide

**Goal:** Use dlobcommunity.com domain from DreamHost with Vercel hosting

**Time Required:** ~1 hour  
**Cost:** $15.99/year (domain only, Vercel is free)

---

## 📋 Quick Checklist

- [ ] Register dlobcommunity.com at DreamHost
- [ ] Set domain to "DNS Only" mode
- [ ] Deploy code to Vercel
- [ ] Add domain in Vercel dashboard
- [ ] Update DNS records in DreamHost
- [ ] Verify email domain in Resend
- [ ] Update Supabase redirect URLs
- [ ] Test the site

---

## Step 1: Register Domain (5 minutes)

1. **Login to DreamHost Panel:**
   - Go to https://panel.dreamhost.com/

2. **Register Domain:**
   - Navigate to **Domains** → **Registrations**
   - Click **Register a New Domain**
   - Search: `dlobcommunity.com`
   - Complete purchase ($15.99/year)
   - Wait for confirmation email

---

## Step 2: Set Domain to DNS Only (2 minutes)

1. **In DreamHost Panel:**
   - Go to **Domains** → **Manage Domains**
   - Find `dlobcommunity.com`
   - Click **DNS** button
   - Select **DNS Only** (not "Fully Hosted")
   - Click **Save**

---

## Step 3: Deploy to Vercel (10 minutes)

1. **Create Vercel Account:**
   - Go to https://vercel.com/signup
   - Sign up with GitHub

2. **Import Project:**
   - Click **Add New** → **Project**
   - Select your GitHub repository: `ryradit/dlobcommunity`
   - Click **Import**

3. **Configure Build Settings:**
   - Framework Preset: **Next.js** (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Click **Deploy**

4. **Wait for Deployment:**
   - First deploy takes ~3-5 minutes
   - You'll get a URL like: `dlobcommunity.vercel.app`

5. **Add Environment Variables:**
   - Go to **Project Settings** → **Environment Variables**
   - Copy all variables from `.env.production.example`
   - **Important:** Set `NEXT_PUBLIC_SITE_URL=https://dlobcommunity.com`
   - Click **Save**
   - Redeploy if needed: **Deployments** → **...** → **Redeploy**

---

## Step 4: Connect Domain in Vercel (5 minutes)

1. **In Vercel Dashboard:**
   - Go to your project
   - Click **Settings** → **Domains**
   - Click **Add Domain**
   - Enter: `dlobcommunity.com`
   - Click **Add**

2. **Vercel Will Show DNS Records:**
   - Note down the A record IP: `76.76.21.21`
   - Note down the CNAME: `cname.vercel-dns.com`

---

## Step 5: Update DNS in DreamHost (10 minutes)

1. **In DreamHost Panel:**
   - Go to **Domains** → **Manage Domains**
   - Click **DNS** next to `dlobcommunity.com`

2. **Delete Old A Records:**
   - Find any existing A records for `@` or `dlobcommunity.com`
   - Click **Delete** for each

3. **Add Vercel A Record:**
   - Click **Add Record**
   - Type: **A**
   - Name: `@` (or leave blank)
   - Value: `76.76.21.21`
   - Click **Add Record Now!**

4. **Add WWW CNAME:**
   - Click **Add Record**
   - Type: **CNAME**
   - Name: `www`
   - Value: `cname.vercel-dns.com`
   - Click **Add Record Now!**

5. **Wait for DNS Propagation:**
   - Usually takes 5-30 minutes
   - Can take up to 4-6 hours for DreamHost
   - Check status: https://dnschecker.org

---

## Step 6: Configure Email Domain (15 minutes)

1. **Login to Resend:**
   - Go to https://resend.com/domains
   - Click **Add Domain**
   - Enter: `dlobcommunity.com`

2. **Resend Provides DNS Records:**
   - Copy each record (TXT, MX, CNAME)

3. **Add to DreamHost DNS:**
   - Back to DreamHost → **Domains** → **DNS** for `dlobcommunity.com`
   
4. **Add TXT Record (Verification):**
   - Type: **TXT**
   - Name: `_resend`
   - Value: [paste from Resend - keep quotes if shown]
   - Click **Add Record Now!**

5. **Add MX Record:**
   - Type: **MX**
   - Name: `@`
   - Value: `feedback-smtp.us-east-1.amazonses.com`
   - Priority: `10`
   - Click **Add Record Now!**

6. **Add TXT Record (SPF):**
   - Type: **TXT**
   - Name: `@`
   - Value: `v=spf1 include:amazonses.com ~all`
   - Click **Add Record Now!**

7. **Add CNAME Record (DKIM):**
   - Type: **CNAME**
   - Name: [copy full name from Resend, e.g., `xyz123._domainkey`]
   - Value: [paste from Resend, e.g., `xyz123.dkim.amazonses.com`]
   - Click **Add Record Now!**

8. **Verify in Resend:**
   - Wait 10-30 minutes
   - Return to Resend dashboard
   - Click **Verify**
   - Should show ✅ Verified

---

## Step 7: Update Supabase (5 minutes)

1. **Go to Supabase Dashboard:**
   - URL: https://app.supabase.com/project/qtdayzlrwmzdezkavjpd

2. **Update Authentication URLs:**
   - Click **Authentication** (left sidebar)
   - Click **URL Configuration**
   
3. **Set Site URL:**
   - Site URL: `https://dlobcommunity.com`
   - Click **Save**

4. **Add Redirect URLs:**
   - In "Redirect URLs" section, add:
   ```
   https://dlobcommunity.com/**
   https://www.dlobcommunity.com/**
   http://localhost:3000/**
   ```
   - Click **Save**

---

## Step 8: Push Code to GitHub (3 minutes)

```bash
# In your local terminal (VS Code)
git add .
git commit -m "chore: migrate to dlobcommunity.com with DreamHost DNS + Vercel hosting"
git push origin new-dlob-web-2026
```

Vercel will automatically detect the push and redeploy (~2 minutes).

---

## Step 9: Verify Everything Works (10 minutes)

### Check DNS:
- Visit https://dnschecker.org
- Enter: `dlobcommunity.com`
- Should show IP: `76.76.21.21` globally

### Check SSL:
- Visit https://dlobcommunity.com
- Should show 🔒 (secure)
- Click padlock → Certificate should be valid

### Check Site:
- Navigate to: https://dlobcommunity.com
- Homepage should load
- Images should display
- Login should work

### Check Email:
- Create a test account
- Should receive verification email
- Sender should be: `noreply@dlobcommunity.com`
- Link should work

### Check WWW Redirect:
- Visit: https://www.dlobcommunity.com
- Should redirect to: https://dlobcommunity.com

### Check Old Domain:
- Visit: https://dlobcommunity.online
- Should redirect to: https://dlobcommunity.com (301)

---

## 🔧 Troubleshooting

### Domain not accessible after 30 minutes:

```bash
# Check DNS propagation
nslookup dlobcommunity.com

# If it shows wrong IP or no result:
# 1. Wait longer (DreamHost can take 4-6 hours)
# 2. Double-check DNS records in DreamHost panel
# 3. Confirm domain is in "DNS Only" mode, not "Fully Hosted"
```

### SSL Certificate Error:

1. Wait 30-60 minutes after DNS propagates
2. In Vercel: Settings → Domains → Click "Refresh" next to domain
3. Try incognito mode to bypass browser cache

### Email Not Sending:

1. Check Resend domain status: https://resend.com/domains
2. Should show ✅ Verified
3. If not verified:
   - Check DNS records in DreamHost
   - Wait longer (DNS propagation)
   - Use `dig TXT _resend.dlobcommunity.com` to verify

### 404 Errors:

1. Check Vercel deployment status (should be green)
2. Verify environment variable: `NEXT_PUBLIC_SITE_URL=https://dlobcommunity.com`
3. Redeploy in Vercel dashboard

---

## 📞 Support Links

- **DreamHost Panel:** https://panel.dreamhost.com/
- **DreamHost Support:** https://help.dreamhost.com/
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Resend Dashboard:** https://resend.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com/project/qtdayzlrwmzdezkavjpd
- **DNS Checker:** https://dnschecker.org

---

## ✅ Success Checklist

When everything is working, you should have:

- ✅ Domain registered at DreamHost
- ✅ DNS records pointing to Vercel
- ✅ SSL certificate active (https://)
- ✅ Site loads at dlobcommunity.com
- ✅ WWW subdomain works
- ✅ Email verification working
- ✅ Old domain redirects (301)
- ✅ Supabase auth working
- ✅ All API routes functional

**Congratulations! Your migration is complete! 🎉**
