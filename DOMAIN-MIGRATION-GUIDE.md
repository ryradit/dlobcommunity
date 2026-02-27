# 🌐 Domain Migration Guide: dlobcommunity.online → dlobcommunity.com

**Migration Date:** February 21, 2026  
**Old Domain:** dlobcommunity.online  
**New Domain:** dlobcommunity.com  
**Hosting Provider:** DreamHost

---

## 🎯 Recommended Setup for DreamHost Users

Since you're using **DreamHost**, here's the recommended approach:

### Option 1: DreamHost Domain + Vercel Hosting (RECOMMENDED ✅)
- **Domain Registration:** DreamHost ($15.99/year)
- **DNS Management:** DreamHost Panel
- **Application Hosting:** Vercel (Free tier available)
- **Why:** Easier deployment, automatic scaling, built-in CDN
- **Setup Time:** ~1 hour

### Option 2: Full DreamHost Setup (Advanced)
- **Domain + Hosting:** All on DreamHost VPS/Dedicated
- **Requirements:** VPS or Dedicated plan with Node.js support
- **Why:** Keep everything in one place
- **Setup Time:** ~3-4 hours (requires SSH access)

**This guide covers both options.** Follow the steps that match your choice.

---

## ✅ Codebase Updates (COMPLETED)

- ✅ Updated email sender: `noreply@dlobcommunity.com`
- ✅ Updated logo URL in email template
- ✅ Added production site URL configuration in `.env.local`

---

## 🚀 Deployment Steps

### Step 1: Domain Registration/Transfer

**Option A: Register New Domain (if not owned)**
1. Go to domain registrar:
   - **Recommended:** [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (lowest cost)
   - Alternatives: Namecheap, GoDaddy, Google Domains
2. Search for `dlobcommunity.com`
3. Complete purchase (~$10-15/year)
4. Wait for registration confirmation (usually instant)

**Option B: Transfer Existing Domain**
1. Unlock domain at current registrar
2. Get authorization/EPP code
3. Initiate transfer at new registrar
4. Approve transfer email
5. Wait 5-7 days for completion

---

### Step 2: Configure DNS Settings

#### If Using DreamHost (Your Current Setup)

**Option A: Domain Already at DreamHost**

1. **Login to DreamHost Panel:**
   - Go to https://panel.dreamhost.com/
   - Navigate to **Domains** → **Manage Domains**

2. **Verify Domain Registration:**
   - If `dlobcommunity.com` is not registered yet:
     - Click **Register a New Domain**
     - Search for `dlobcommunity.com`
     - Complete purchase (~$15.99/year for .com)
   
3. **Point Domain to Your Hosting:**
   - Find `dlobcommunity.com` in domain list
   - Click **DNS** button
   - Choose hosting type:
     - **For DreamHost Shared/VPS Hosting:** Select "Fully Hosted"
     - **For External Hosting (Vercel/Netlify):** See Option B below

4. **Enable HTTPS:**
   - In domain list, find `dlobcommunity.com`
   - Click **Add** under "Secure Hosting" column
   - DreamHost will auto-provision Let's Encrypt SSL (free)
   - Wait 10-30 minutes for activation

**Option B: Domain at DreamHost, Hosting Elsewhere (Vercel/Netlify)**

1. **Login to DreamHost Panel:**
   - Go to https://panel.dreamhost.com/
   - Navigate to **Domains** → **Manage Domains**

2. **Set Domain to DNS Only:**
   - Find `dlobcommunity.com`
   - Click **DNS** under "Web Hosting" column
   - Select **DNS Only**

3. **Go to DNS Management:**
   - Navigate to **Domains** → **Manage Domains** → Click **DNS** next to your domain
   - Or go to **Domains** → **Custom DNS**

4. **Add DNS Records for Vercel:**
   
   *Delete existing A records first, then add:*
   
   | Type  | Name  | Value                          | TTL  |
   |-------|-------|--------------------------------|------|
   | A     | @     | 76.76.21.21                    | Auto |
   | CNAME | www   | cname.vercel-dns.com          | Auto |

5. **Add DNS Records for Netlify:**
   
   *If using Netlify instead:*
   
   | Type  | Name  | Value                          | TTL  |
   |-------|-------|--------------------------------|------|
   | A     | @     | 75.2.60.5                      | Auto |
   | CNAME | www   | [your-site].netlify.app        | Auto |

6. **Configure Hosting Platform:**
   - **Vercel:** Go to project → Settings → Domains → Add `dlobcommunity.com`
   - **Netlify:** Site Settings → Domain Management → Add `dlobcommunity.com`

7. **Wait for SSL:**
   - SSL will be provisioned by Vercel/Netlify (not DreamHost)
   - Usually takes 10-60 minutes

**Option C: Keep Domain at Current Registrar, Transfer DNS to DreamHost**

1. **Add Domain to DreamHost:**
   - Panel → **Domains** → **Add Domain**
   - Select **I will manage my domain registration elsewhere**
   - Enter: `dlobcommunity.com`

2. **Get DreamHost Nameservers:**
   ```
   ns1.dreamhost.com
   ns2.dreamhost.com
   ns3.dreamhost.com
   ```

3. **Update Nameservers at Current Registrar:**
   - Login to current domain registrar
   - Find DNS/Nameserver settings
   - Replace with DreamHost nameservers above
   - Save (propagation takes 4-48 hours)

4. **Configure Hosting in DreamHost:**
   - After nameserver propagation (check with `nslookup dlobcommunity.com`)
   - Return to DreamHost panel
   - Select hosting type (Fully Hosted or DNS Only)

#### If Using Vercel (Alternative Option)

1. **Add Domain in Vercel Dashboard:**
   ```
   1. Go to your project → Settings → Domains
   2. Click "Add Domain"
   3. Enter: dlobcommunity.com
   4. Click "Add"
   ```

2. **Configure DNS Records at Your Domain Registrar:**
   
   Vercel will show you the required DNS records. Typically:
   
   | Type  | Name  | Value                          | TTL  |
   |-------|-------|--------------------------------|------|
   | A     | @     | 76.76.21.21                    | Auto |
   | CNAME | www   | cname.vercel-dns.com          | Auto |

3. **Add Subdomain (if needed):**
   ```
   For www.dlobcommunity.com → same DNS records as above
   ```

4. **SSL Certificate:** Vercel auto-provisions (wait 10-60 minutes)

#### If Using Netlify

1. **Add Custom Domain:**
   ```
   Site Settings → Domain Management → Add Custom Domain
   Enter: dlobcommunity.com
   ```

2. **Configure DNS:**
   
   | Type  | Name  | Value                          |
   |-------|-------|--------------------------------|
   | A     | @     | 75.2.60.5                      |
   | CNAME | www   | [your-site].netlify.app        |

3. **Enable HTTPS:** Automatic with Let's Encrypt

#### If Self-Hosting or Other Platforms

Point A record to your server IP:
```
Type: A
Name: @
Value: [Your Server IP]
TTL: 3600
```

---

### Step 3: Update Environment Variables

**For Production Deployment:**

Update your hosting platform's environment variables:

```bash
# Vercel/Netlify Dashboard → Environment Variables
NEXT_PUBLIC_SITE_URL=https://dlobcommunity.com
```

**Local Development (already configured):**
```bash
# .env.local remains as localhost
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

### Step 4: Configure Resend Email Service

**Important:** You must verify the new domain for email sending

1. **Login to Resend Dashboard:**
   - Go to https://resend.com/domains

2. **Add Domain:**
   ```
   Click "Add Domain"
   Enter: dlobcommunity.com
   ```

3. **Add DNS Records for Email Verification:**
   
   Resend will provide DNS records. **For DreamHost users:**
   
   a. **Copy the DNS records from Resend**
   
   b. **Login to DreamHost Panel:**
      - Go to https://panel.dreamhost.com/
      - Navigate to **Domains** → **Manage Domains**
      - Click **DNS** next to `dlobcommunity.com`
   
   c. **Add each record manually:**
   
   *Example records (your actual values will differ):*
   
   | Type  | Name                          | Value                                    | Notes |
   |-------|-------------------------------|------------------------------------------|-------|
   | TXT   | _resend                       | [verification-code from Resend]          | For verification |
   | MX    | @                             | feedback-smtp.us-east-1.amazonses.com    | Priority: 10 |
   | TXT   | @                             | v=spf1 include:amazonses.com ~all        | SPF record |
   | CNAME | [dkim-value]._domainkey       | [dkim-value].dkim.amazonses.com          | DKIM auth |
   
   **DreamHost-Specific Steps:**
   
   - For **TXT records:**
     - Name: Enter the exact name from Resend (e.g., `_resend`)
     - Value: Paste the entire value **including quotes if shown**
     - Click "Add Record Now"
   
   - For **MX record:**
     - Name: `@` or leave blank
     - Value: `feedback-smtp.us-east-1.amazonses.com`
     - Priority/Weight: 10
     - Click "Add Record Now"
   
   - For **CNAME (DKIM):**
     - Name: Copy the full subdomain from Resend (e.g., `resend123._domainkey`)
     - Value: Paste the target domain
     - Click "Add Record Now"

4. **Verify Domain:**
   - Wait 5-30 minutes for DNS propagation
   - Return to Resend dashboard
   - Click "Verify" button
   - Status should change to ✅ Verified
   
   **Troubleshooting DreamHost DNS:**
   - DreamHost DNS can take 4-6 hours to fully propagate
   - Use https://dnschecker.org to verify records are visible
   - If verification fails, double-check each record in DreamHost panel

5. **Update Email Sender (Already Done):**
   ```typescript
   from: 'DLOB System <noreply@dlobcommunity.com>'
   ```

---

### Step 5: Update Supabase Authentication URLs

1. **Go to Supabase Dashboard:**
   ```
   https://app.supabase.com/project/qtdayzlrwmzdezkavjpd
   ```

2. **Update Site URL:**
   ```
   Authentication → URL Configuration
   Site URL: https://dlobcommunity.com
   ```

3. **Add Redirect URLs:**
   ```
   Redirect URLs (add both):
   - https://dlobcommunity.com/*
   - https://www.dlobcommunity.com/*
   - http://localhost:3000/* (keep for development)
   ```

---

### Step 6: Deploy Updated Code

**For DreamHost Hosting:**

Next.js apps require Node.js hosting. DreamHost supports this through their VPS or Dedicated plans.

**Option A: Deploy to DreamHost VPS/Dedicated (Advanced)**

1. **SSH into your DreamHost server:**
   ```bash
   ssh username@dlobcommunity.com
   ```

2. **Install Node.js (if not installed):**
   ```bash
   # Check Node version
   node --version
   
   # If needed, install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   
   # Install Node 18 or higher
   nvm install 18
   nvm use 18
   ```

3. **Clone your repository:**
   ```bash
   cd ~
   git clone https://github.com/ryradit/dlobcommunity.git
   cd dlobcommunity
   git checkout new-dlob-web-2026
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Create production environment file:**
   ```bash
   # Copy environment variables
   nano .env.production.local
   # Paste all variables from .env.production.example
   # Update NEXT_PUBLIC_SITE_URL=https://dlobcommunity.com
   # Save: Ctrl+O, Enter, Ctrl+X
   ```

6. **Build the application:**
   ```bash
   npm run build
   ```

7. **Set up PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "dlob-app" -- start
   pm2 save
   pm2 startup
   ```

8. **Configure domain in DreamHost:**
   - Panel → Domains → Manage Domains
   - Edit `dlobcommunity.com`
   - Set "Web directory" to your app's `.next` folder
   - Enable Passenger (Node.js support)

9. **Create Passenger config:**
   ```bash
   cd ~/dlobcommunity
   nano passenger_wsgi.py
   ```
   
   Paste:
   ```python
   import sys, os
   INTERP = os.path.expanduser("~/.nvm/versions/node/v18.x.x/bin/node")
   if sys.executable != INTERP: os.execl(INTERP, INTERP, *sys.argv)
   ```

**Option B: Deploy to Vercel/Netlify (Recommended - Easier)**

If DreamHost Node.js setup is complex, use DreamHost only for DNS:

```bash
# Local development machine
git add .
git commit -m "chore: migrate to dlobcommunity.com domain"
git push origin new-dlob-web-2026

# Deploy to Vercel
# 1. Create account at vercel.com
# 2. Import your GitHub repository
# 3. Vercel auto-detects Next.js and deploys
# 4. Add environment variables in Vercel dashboard
# 5. Add dlobcommunity.com in Vercel domains
# 6. Update DNS at DreamHost (see Step 2, Option B)
```

**For Local Development:**

---

### Step 7: Set Up Domain Redirect (Optional but Recommended)

**Redirect old domain to new domain:**

#### Option A: Using Vercel
1. Keep dlobcommunity.online in your domains list
2. Vercel automatically redirects to primary domain

#### Option B: Using Cloudflare (Free)
1. Add both domains to Cloudflare
2. Create Page Rule:
   ```
   URL: *dlobcommunity.online/*
   Setting: Forwarding URL (301 Permanent Redirect)
   Destination: https://dlobcommunity.com/$1
   ```

#### Option C: Using DNS ALIAS/CNAME
```
Point dlobcommunity.online → same records as dlobcommunity.com
Use middleware to redirect:
```

Add to `middleware.ts`:
```typescript
if (request.nextUrl.hostname === 'dlobcommunity.online') {
  return NextResponse.redirect(
    `https://dlobcommunity.com${request.nextUrl.pathname}${request.nextUrl.search}`,
    { status: 301 }
  );
}
```

---

## 📋 Verification Checklist

After completing all steps, verify:

- [ ] **DNS Propagation:** Use https://dnschecker.org/ to check if `dlobcommunity.com` resolves correctly
- [ ] **SSL Certificate:** Visit https://dlobcommunity.com and check for 🔒 lock icon
- [ ] **Email Sending:** Test email verification by registering a new user
- [ ] **Homepage Loads:** https://dlobcommunity.com should display your site
- [ ] **WWW Redirect:** https://www.dlobcommunity.com should work
- [ ] **Images/Assets:** Check if `/dlob.png` loads correctly
- [ ] **Authentication:** Test login/logout functionality
- [ ] **API Routes:** Test all endpoints (payment, AI features, etc.)

---

## ⏱️ Timeline Expectations

| Step | Duration |
|------|----------|
| Domain registration | Instant - 24 hours |
| DNS propagation | 5 minutes - 48 hours (usually ~1 hour) |
| SSL certificate issuance | 10-60 minutes |
| Email domain verification | 5-30 minutes |
| Code deployment | 2-5 minutes |

**Total estimated time:** 1-3 hours (excluding domain transfer which takes 5-7 days)

---

## 🆘 Troubleshooting

### DNS Not Propagating
- Wait longer (can take up to 48 hours)
- Clear browser cache: Ctrl + F5
- Use different DNS: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### SSL Certificate Error
- Wait 30-60 minutes after DNS propagation
- Try accessing via incognito/private mode
- Force SSL renewal in Vercel/Netlify dashboard

### Email Not Sending
- Check Resend domain verification status
- Verify DNS records are correct (use `nslookup` or `dig`)
- Check Resend API key is correct in `.env.local`
- Review Resend logs for error messages

### 404 Errors on New Domain
- Ensure deployment finished successfully
- Check environment variables are set correctly
- Verify `NEXT_PUBLIC_SITE_URL` uses new domain

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs/concepts/projects/custom-domains
- **Netlify Docs:** https://docs.netlify.com/domains-https/custom-domains/
- **Cloudflare Docs:** https://developers.cloudflare.com/dns/
- **Resend Docs:** https://resend.com/docs/dashboard/domains/introduction

---

## 🔄 Rollback Plan (If Issues Occur)

If something goes wrong:

1. **Revert code changes:**
   ```bash
   git revert HEAD
   git push origin new-dlob-web-2026
   ```

2. **Keep old domain active:**
   - Don't delete dlobcommunity.online DNS records
   - Both domains can coexist during testing

3. **Revert environment variables:**
   ```bash
   NEXT_PUBLIC_SITE_URL=https://dlobcommunity.online
   ```

---

**Status:** ✅ Code updated and ready for deployment  
**Next Steps:** Complete Steps 1-7 above to go live with new domain
