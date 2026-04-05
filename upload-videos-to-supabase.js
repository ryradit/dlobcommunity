#!/usr/bin/env node

/**
 * Upload Store Videos to Supabase Storage
 * 
 * Usage: node upload-videos-to-supabase.js
 * 
 * Prerequisite:
 * - Set environment variables or create .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing environment variables');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Video files to upload
const videoFiles = [
  'videomodel1.mp4',
  'videomodel2.mp4',
  'videomodel3.mp4',
  'videomodel4.mp4',
  'videomodel5.mp4',
  'videomodel6.mp4',
  'videomodel7.mp4',
];

// Source directory (where MP4 files are stored locally)
const sourceDir = path.join(__dirname, 'public/images/members/model');

// Bucket name
const bucketName = 'store-videos';

async function uploadVideos() {
  console.log('🎬 Starting video upload to Supabase...\n');

  let uploadedCount = 0;
  let failedCount = 0;
  const uploadedUrls = [];

  for (const videoFile of videoFiles) {
    const filePath = path.join(sourceDir, videoFile);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  ${videoFile} - File not found at ${filePath}`);
      continue;
    }

    try {
      console.log(`📤 Uploading: ${videoFile}...`);

      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      const fileSize = (fileBuffer.length / (1024 * 1024)).toFixed(2); // MB

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(videoFile, fileBuffer, {
          cacheControl: '3600',
          upsert: false, // Set to true to overwrite existing
          contentType: 'video/mp4',
        });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failedCount++;
      } else {
        // Get public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${videoFile}`;
        
        console.log(`   ✅ Success! (${fileSize} MB)`);
        console.log(`   🔗 URL: ${publicUrl}\n`);
        
        uploadedUrls.push({
          file: videoFile,
          size: fileSize,
          url: publicUrl,
        });
        uploadedCount++;
      }
    } catch (err) {
      console.error(`   ❌ Exception: ${err.message}\n`);
      failedCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Upload Summary');
  console.log('='.repeat(60));
  console.log(`✅ Uploaded: ${uploadedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📦 Total: ${uploadedCount + failedCount}\n`);

  if (uploadedUrls.length > 0) {
    console.log('📝 Uploaded URLs (copy paste to code):');
    console.log('─'.repeat(60));
    uploadedUrls.forEach((item) => {
      console.log(`// ${item.file} (${item.size} MB)`);
      console.log(`${item.url}\n`);
    });
  }

  console.log('📌 Next Steps:');
  console.log('1. Copy the URLs above');
  console.log('2. Update src/app/(public)/store/page.tsx with these URLs');
  console.log('3. Test videos load correctly in browser\n');

  process.exit(failedCount > 0 ? 1 : 0);
}

uploadVideos();
