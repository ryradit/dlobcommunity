# 🚀 FULL GOOGLE AI STACK SETUP - IMAGEN 3 REST API

Complete guide untuk setup **Gemini 2.5 Flash Lite** (text generation) + **Imagen 3 via REST API** (image generation).

**✅ IMPLEMENTED**: Imagen 3 via Vertex AI REST API - fully functional!

---

## ⚡ Quick Start (If Already Setup)

If you already have:
- ✅ Google Cloud Project
- ✅ Service Account JSON key downloaded
- ✅ Vertex AI API enabled
- ✅ Environment variables configured

Just **test article generation** at `/admin/artikel` and images will be AI-generated!

---

## 📋 Prerequisites

- ✅ Google Cloud Account
- ✅ Kartu kredit/debit untuk verifikasi (tidak akan dicharge untuk free tier)
- ✅ Supabase project sudah setup
- ✅ Node.js installed

---

## 🔧 STEP 1: Google Cloud Project Setup

### 1.1 Create Google Cloud Project

1. **Buka** [Google Cloud Console](https://console.cloud.google.com/)
2. **Klik** "New Project" di top bar
3. **Isi**:
   - Project name: `dlob-ai-article-generator` (atau nama lain)
   - Organization: (kosongkan jika personal)
4. **Klik** "Create"
5. **Copy** Project ID (misal: `dlob-ai-1234567`)

### 1.2 Enable Billing

1. **Buka** [Billing](https://console.cloud.google.com/billing)
2. **Link** kartu kredit/debit
3. **Aktifkan** free trial ($300 credit selama 90 hari)

> ⚠️ **Penting**: Anda TIDAK akan dicharge otomatis setelah trial. Google akan minta konfirmasi untuk upgrade ke paid tier.

### 1.3 Enable Required APIs

1. **Buka** [APIs & Services](https://console.cloud.google.com/apis/library)
2. **Search dan enable** API berikut:
   - ✅ **Vertex AI API** (untuk Imagen 3)
   - ✅ **Generative Language API** (untuk Gemini)
3. **Klik** "Enable" untuk masing-masing

---

## 🔑 STEP 2: Create Service Account

### 2.1 Create Service Account

1. **Buka** [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. **Klik** "Create Service Account"
3. **Isi**:
   - Name: `dlob-article-generator`
   - Description: `Service account for AI article and image generation`
4. **Klik** "Create and Continue"

### 2.2 Grant Permissions

Pilih roles berikut:
- ✅ **Vertex AI User** (untuk Imagen 3)
- ✅ **Storage Object Admin** (jika pakai Google Cloud Storage)

**Klik** "Continue" → "Done"

### 2.3 Create JSON Key

1. **Klik** service account yang baru dibuat
2. **Buka tab** "Keys"
3. **Klik** "Add Key" → "Create new key"
4. **Pilih** JSON format
5. **Klik** "Create"
6. **Download** file JSON (nama: `dlob-ai-xxx.json`)
7. **Pindahkan** file ke root folder project:
   ```bash
   mv ~/Downloads/dlob-ai-xxx.json ./google-service-account-key.json
   ```

> ⚠️ **Security**: Jangan commit file ini ke git! Sudah ada di `.gitignore`

---

## 📦 STEP 3: Supabase Storage Setup

### 3.1 Run SQL Migration

1. **Buka** [Supabase SQL Editor](https://app.supabase.com/project/_/sql)
2. **Copy-paste** content dari `supabase-storage-articles-setup.sql`
3. **Run** query
4. **Verify**: Cek di Storage → Buckets → Harus ada `article-images` bucket

### 3.2 Check Storage Settings

1. **Buka** Storage → article-images
2. **Verify**:
   - ✅ Public bucket: **ON**
   - ✅ RLS enabled: **ON**
   - ✅ File size limit: 50MB (default OK)

---

## 🌍 STEP 4: Environment Variables

### 4.1 Update .env.local

Copy dari `.env.example` dan isi:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key_from_ai_studio

# Google Cloud Configuration (for Imagen 3)
GOOGLE_CLOUD_PROJECT_ID=dlob-ai-1234567
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./google-service-account-key.json
```

**Cara dapat nilai:**
- `NEXT_PUBLIC_SUPABASE_*`: Supabase Dashboard → Settings → API
- `GEMINI_API_KEY`: [Google AI Studio](https://aistudio.google.com/apikey)
- `GOOGLE_CLOUD_PROJECT_ID`: Google Cloud Console → Project Info
- `GOOGLE_APPLICATION_CREDENTIALS`: Path ke file JSON service account

### 4.2 Verify Environment

Run check:
```bash
node -e "console.log(process.env.GOOGLE_CLOUD_PROJECT_ID)"
```

Should output your project ID.

---

## 🧪 STEP 5: Test Setup

### 5.1 Test Article Generation

1. **Login** sebagai admin
2. **Buka** `/admin/artikel`
3. **Masukkan prompt**:
   ```
   Tulis artikel tentang teknik smash bulutangkis untuk pemula, sertakan tips praktis dan kesalahan yang harus dihindari
   ```
4. **Klik** "Generate Artikel"
5. **Wait** 60-90 detik (lebih lama karena generate gambar real)

### 5.2 Expected Behavior

**Console logs** di browser:
```
🚀 Generating article with prompt: ...
✅ Article structure generated: ...
🎨 Starting image generation with Imagen 3...
🎨 Generating image with Imagen 3: ... (hero)
✅ Image generated successfully (xxxxx bytes)
📤 Uploading image to Supabase: ...
✅ Image uploaded: https://...supabase.co/storage/...
🎨 Generating image with Imagen 3: ... (section 1)
...
✅ All images generated and uploaded
💾 Article saved to database: ...
```

### 5.3 Verify Images

1. **Klik** "Preview" pada artikel yang baru dibuat
2. **Check**:
   - ✅ Hero image muncul (bukan placeholder)
   - ✅ Section images muncul sesuai konten
   - ✅ CTA image muncul
3. **Inspect** image URL: Harus dari Supabase Storage (`https://xxx.supabase.co/storage/v1/object/public/article-images/...`)

---

## 💰 Cost Estimation

### Per Artikel (typical):
- **Gemini 2.5 Flash Lite** (text): ~$0.00015
- **Imagen 3** (6 images avg): ~$0.24-0.30
  - Hero: 1 @ $0.04
  - Sections: 4 @ $0.04 each = $0.16
  - CTA: 1 @ $0.04
- **Supabase Storage**: FREE (under 1GB limit)

**Total**: ~$0.25 per artikel

### Free Tier Limits:
- **Google Cloud**: $300 credit = ~1,200 articles
- **Gemini API**: Free tier (limited requests/min)
- **Supabase Storage**: 1GB free = ~1,000 articles

---

## 🐛 Troubleshooting

### Error: "Permission denied"

**Problem**: Service account tidak punya akses
**Solution**:
1. Cek roles di [IAM](https://console.cloud.google.com/iam-admin/iam)
2. Pastikan service account punya role "Vertex AI User"

### Error: "Vertex AI API is not enabled"

**Problem**: API belum diaktifkan
**Solution**:
1. Buka [Vertex AI API](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com)
2. Klik "Enable"

### Error: "Could not load the default credentials"

**Problem**: Service account key tidak ditemukan
**Solution**:
1. Cek path di `.env.local` → `GOOGLE_APPLICATION_CREDENTIALS`
2. Pastikan file `google-service-account-key.json` ada di root folder

### Error: "Storage bucket not found"

**Problem**: Bucket `article-images` belum dibuat
**Solution**:
1. Run SQL migration: `supabase-storage-articles-setup.sql`
2. Verify di Supabase Dashboard → Storage

### Images tidak muncul

**Problem 1**: CORS issue
**Solution**: 
- Supabase → Storage → article-images → Configuration
- Add CORS policy untuk domain Anda

**Problem 2**: RLS blocking
**Solution**:
- Check RLS policies di `supabase-storage-articles-setup.sql`
- Pastikan "Anyone can view" policy ada

### Generation terlalu lama (>2 menit)

**Problem**: Imagen 3 sedang slow/overloaded
**Solution**:
1. Code sudah punya **automatic fallback** ke Picsum placeholder
2. Image akan tetap muncul (placeholder), artikel tetap tersimpan
3. Bisa regenerate image nanti via admin panel (future feature)

---

## 🔒 Security Best Practices

### ✅ DO:
- Simpan service account key di `.env.local` (ignored by git)
- Gunakan environment variables untuk semua credentials
- Enable RLS di Supabase Storage
- Limit file size upload (max 10MB cukup)
- Monitor usage di [Google Cloud Console](https://console.cloud.google.com/billing)

### ❌ DON'T:
- Commit `google-service-account-key.json` ke git
- Share service account key di public
- Hardcode credentials di code
- Disable RLS (kecuali untuk testing)

---

## 📊 Monitoring Usage

### Google Cloud

1. **Buka** [Billing Reports](https://console.cloud.google.com/billing/reports)
2. **Filter** by service:
   - Vertex AI (Imagen 3)
   - Generative Language API (Gemini)
3. **Set budget alert**: $10/month untuk testing

### Supabase

1. **Buka** Supabase Dashboard → Usage
2. **Monitor**:
   - Storage size (max 1GB free)
   - Bandwidth (max 5GB free)

---

## 🚀 Next Steps (Optional Enhancements)

### 1. Add Image Regeneration Feature
Regenerate single image jika hasilnya kurang bagus:
```typescript
async function regenerateImage(articleId: string, imageType: 'hero' | 'section' | 'cta', index: number)
```

### 2. Image Style Presets
Tambahkan style options:
- Realistic
- Illustration
- Minimalist
- Professional

### 3. Batch Image Generation
Generate multiple artikel sekaligus dengan queue system.

### 4. CDN Integration
Serve images via Cloudflare/Vercel untuk faster loading.

---

## 📞 Support

**Issues?**
- Check [Vertex AI Docs](https://cloud.google.com/vertex-ai/docs)
- Check [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- Open issue di repository

**Sukses!** 🎉
Artikel generator Anda sekarang menggunakan **full Google AI stack** dengan gambar real dari Imagen 3!
