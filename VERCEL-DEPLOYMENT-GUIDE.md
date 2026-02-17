# Vercel Deployment Guide - AI Article Generator

## Prerequisites

Before deploying, ensure you have:
1. ✅ Supabase project set up
2. ✅ Google Cloud Project with Vertex AI enabled
3. ✅ Service account JSON credentials file
4. ✅ Gemini API key

---

## Step 1: Database Setup (Supabase)

Run these SQL scripts in your Supabase SQL Editor:

### 1.1 Create Articles Table
```sql
-- Run: supabase-articles-table.sql
```
This creates the `articles` table with all necessary columns and indexes.

### 1.2 Create Article Queue System
```sql
-- Run: supabase-article-queue.sql
```
This creates:
- `article_generation_queue` table
- `get_next_queue_job()` function
- `update_queue_positions()` function
- Auto-triggers for queue management

### 1.3 Setup Storage Bucket
```sql
-- Run: supabase-storage-articles-setup.sql
```
This creates the `article-images` bucket for storing generated images.

**Alternative**: Create bucket manually in Supabase Dashboard:
1. Go to Storage
2. Create new bucket: `article-images`
3. Set to **Public**
4. Add policy for authenticated uploads

---

## Step 2: Vercel Environment Variables

Go to your Vercel project: **Settings → Environment Variables**

Add the following variables:

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Google Cloud / Vertex AI Configuration
GOOGLE_CLOUD_PROJECT_ID=dlobplatform
GOOGLE_CLOUD_LOCATION=us-central1

# Service Account Credentials (CRITICAL!)
GOOGLE_APPLICATION_CREDENTIALS_JSON=<paste entire JSON content>
```

### How to Add Service Account JSON

1. Open `dlobplatform-36fbbb1bde67.json` locally
2. Copy the **entire content** (all the JSON)
3. In Vercel, create environment variable:
   - Name: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - Value: Paste the entire JSON (it should look like `{"type":"service_account","project_id":...}`)
   - Available for: All environments (Production, Preview, Development)

**Important**: The JSON should be pasted as-is, not base64 encoded.

---

## Step 3: Verify Build Settings

### Build Command
```bash
npm run build
```

### Output Directory
```bash
.next
```

### Install Command
```bash
npm install
```

### Node Version
Ensure you're using Node 18.x or higher in Vercel settings.

---

## Step 4: Deploy

### Option A: Auto-Deploy (Recommended)
1. Push to GitHub (already done: `new-dlob-web-2026` branch)
2. Vercel will auto-deploy if connected to your repo
3. Check deployment logs for any errors

### Option B: Manual Deploy
```bash
vercel --prod
```

---

## Step 5: Post-Deployment Verification

### 5.1 Test Article Generation
1. Go to: `https://your-domain.vercel.app/admin/artikel`
2. Click "Generate AI Artikel"
3. Enter a prompt (e.g., "Tips latihan badminton untuk pemula")
4. Monitor progress (should take 5-8 minutes)

### 5.2 Check Storage
1. Go to Supabase Dashboard → Storage → `article-images`
2. Verify images are being uploaded

### 5.3 Check Queue System
1. Open Supabase SQL Editor
2. Query: 
   ```sql
   SELECT * FROM article_generation_queue ORDER BY created_at DESC;
   ```
3. Verify queue entries are being created and processed

---

## Common Issues & Solutions

### Issue 1: "Failed to authenticate with Google Cloud"
**Cause**: Service account credentials not properly set
**Solution**: 
- Verify `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set in Vercel
- Ensure the entire JSON is pasted (including `{` and `}`)
- Redeploy after adding/updating the variable

### Issue 2: "Quota exceeded" errors
**Cause**: Imagen 3 has 1 request/minute limit
**Solution**: 
- This is normal behavior
- Sequential generation handles this automatically
- Make sure queue system is working properly

### Issue 3: Images not uploading to Supabase
**Cause**: Storage bucket not configured or RLS policy issues
**Solution**:
- Check bucket exists: `article-images`
- Verify bucket is set to **Public**
- Check RLS policies allow service role uploads

### Issue 4: Articles not appearing in list
**Cause**: Database insert failed or status is 'draft'
**Solution**:
- Check Vercel function logs for errors
- Verify `articles` table exists in Supabase
- Check article status (only 'published' shows in public list)

### Issue 5: Queue not processing
**Cause**: Database functions not created or process endpoint not called
**Solution**:
- Verify `supabase-article-queue.sql` was executed
- Check function exists: `get_next_queue_job()`
- Check Vercel function logs for process endpoint errors

---

## Environment Variable Checklist

Before deploying, verify all these are set in Vercel:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `GOOGLE_CLOUD_PROJECT_ID`
- [ ] `GOOGLE_CLOUD_LOCATION`
- [ ] `GOOGLE_APPLICATION_CREDENTIALS_JSON` ⚠️ **CRITICAL**

---

## Testing Features

### Admin Features (Requires Login)
1. **AI Article Generation**: `/admin/artikel` → "Generate AI Artikel"
2. **Queue Management**: Multiple admins can queue articles simultaneously
3. **Article Management**: Publish, delete, edit (coming soon)

### Public Features
1. **Article Listing**: `/artikel` - Shows all published articles
2. **Article Detail**: `/artikel/[slug]` - Full article with images
3. **Social Sharing**: Facebook, X (Twitter), Instagram sharing buttons

### Special Article
- **Refleksi 2025**: Hardcoded article (cannot be deleted)
- URL: `/artikel/refleksi-2025`

---

## Performance Notes

- **Generation Time**: ~5-8 minutes per article (due to Imagen 3 quota)
- **Queue Wait**: Position × 6 minutes (e.g., position 2 = ~12 min wait)
- **Image Count**: 5 images total (hero, 3 content, 1 CTA)
- **Sequential Processing**: One article at a time to avoid quota issues

---

## Security Notes

- ✅ Service account JSON excluded from Git (in `.gitignore`)
- ✅ Environment variables only in Vercel (not committed)
- ✅ RLS policies enabled on Supabase tables
- ✅ Service role key only used server-side
- ⚠️ Keep `GOOGLE_APPLICATION_CREDENTIALS_JSON` secret
- ⚠️ Never commit credentials to GitHub

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Vercel function logs (Runtime Logs)
3. Check Supabase logs
4. Verify all environment variables are set correctly
5. Test locally first with `npm run dev`
