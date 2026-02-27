# 🚀 DreamHost Domain Migration (Existing Vercel Setup)

**Current Setup:** Vercel hosting with dlobcommunity.online  
**Goal:** Add dlobcommunity.com domain and migrate traffic

**Time Required:** ~30 minutes  
**Cost:** $15.99/year (domain registration only)

**Note:** Your current site at dlobcommunity.online will continue working during this process. Both domains will work simultaneously until you decide to phase out the old one.

---

## 📋 Simplified Checklist (You Already Have Vercel!)

- [ ] Register dlobcommunity.com at DreamHost
- [ ] Add new domain in your existing Vercel project
- [ ] Update DNS records in DreamHost to point to Vercel
- [ ] Update environment variables in Vercel
- [ ] Verify email domain in Resend
- [ ] Update Supabase redirect URLs
- [ ] Redeploy on Vercel
- [ ] Test the new domain

---

## Step 1: Register Domain at DreamHost (5 minutes)

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

## Step 3: Add New Domain in Vercel (3 minutes)

Since you already have your project on Vercel with dlobcommunity.online:

1. **Login to Vercel:**
   - Go to https://vercel.com/dashboard
   - Select your existing DLOB project

2. **Add New Domain:**
   - Click **Settings** → **Domains**
   - You should see `dlobcommunity.online` already listed
   - Click **Add Domain** button
   - Enter: `dlobcommunity.com`
   - Click **Add**

3. **Vercel Shows DNS Instructions:**
   - Note the A record: `76.76.21.21`
   - Note the CNAME: `cname.vercel-dns.com`
   - Keep this page open for Step 5

4. **Optional - Set as Primary:**
   - Click the **•••** menu next to `dlobcommunity.com`
   - Select **Set as Primary Domain**
   - This makes it the default (recommended)

---

## Step 4: Update Environment Variables (2 minutes)

Update your production environment to use the new domain:

1. **In Vercel Dashboard:**
   - Still in your project
   - Click **Settings** → **Environment Variables**

2. **Update Site URL:**
   - Find `NEXT_PUBLIC_SITE_URL`
   - Click **Edit**
   - Change value to: `https://dlobcommunity.com`
   - Click **Save**

3. **Note:** Other environment variables stay the same (Supabase, APIs, etc.)

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

## Step 8: Redeploy on Vercel (2 minutes)

The code changes are already in your GitHub repo, just trigger a new deployment:

1. **Option A: Automatic (Recommended)**
   ```bash
   # Already done - your latest push will trigger auto-deployment
   # Vercel detects the push and deploys automatically
   ```

2. **Option B: Manual Redeploy**
   - In Vercel Dashboard → **Deployments**
   - Click **•••** on the latest deployment
   - Select **Redeploy**
   - Confirm

3. **Wait for Deployment:**
   - Takes ~2-3 minutes
   - Status should show ✅ Ready

4. **Check Deployment:**
   - Click on the deployment
   - Should show your updated code
   - Environment variable should show new SITE_URL

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

---

## 🔄 Managing Both Domains During Transition

After migration, both domains will work simultaneously:

### Current State:
- ✅ `dlobcommunity.com` - New primary domain (SSL active)
- ✅ `dlobcommunity.online` - Old domain (auto-redirects to .com via middleware)
- Both point to the same Vercel deployment

### Recommended Transition Timeline:

**Week 1-2: Soft Launch**
- Announce new domain to members
- Keep old domain fully functional
- Monitor traffic in Vercel Analytics

**Week 3-4: Active Migration**
- Update all external links to use .com
- Update social media profiles and descriptions
- Update email signatures
- Inform partners and sponsors
- Update any printed materials

**Month 2+: Maintain Redirect**
- Keep dlobcommunity.online as permanent redirect
- This prevents breaking external links (social media posts, bookmarks, etc.)
- Minimal cost to maintain (~$10/year)

### In Your Vercel Dashboard:
**Settings → Domains** will show:
- `dlobcommunity.com` ⭐ (Primary Domain)
- `dlobcommunity.online` (Redirects to primary)

### If You Want to Remove Old Domain Later:
1. In Vercel: Settings → Domains
2. Find `dlobcommunity.online`
3. Click **•••** → **Remove Domain**
4. Let domain registration expire at your registrar

**💡 Best Practice:** Keep the old domain active for at least 12 months as a redirect. This ensures no broken links from search engines, social media, or user bookmarks.

---

## 📊 Post-Migration Monitoring

Monitor your migration success in Vercel Dashboard:

### Traffic Analysis:
- Go to **Analytics** tab
- Watch traffic shift from .online → .com
- Most users should migrate within 2-4 weeks

### Check Redirect Logs:
- Go to **Logs** or **Functions**
- Filter for domain redirects
- Verify 301 status codes are working

### Email Verification:
- Test with new user registration
- Confirm emails come from `noreply@dlobcommunity.com`
- Verify links use new domain

### SEO Consideration:
- 301 redirects preserve SEO rankings
- Google will eventually recognize the domain change
- Submit new domain to Google Search Console

