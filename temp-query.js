const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;

  console.log('🔄 Fetching all rows from latihan_faces...');
  const { data: rows, error } = await supabase
    .from('latihan_faces')
    .select('id, image_id, image_title, face_count, face_data');

  if (error) {
    console.error('❌ Error fetching rows:', error);
    return;
  }

  console.log(`📊 Found ${rows.length} rows to check.`);

  let updatedCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const faces = row.face_data;
    if (!Array.isArray(faces) || faces.length === 0) continue;

    // Check if first face is already normalized (coordinates <= 1.0)
    const firstFace = faces[0];
    const isAlreadyNormalized = firstFace.vertices?.every(v => v.x <= 1.0 && v.y <= 1.0);

    if (isAlreadyNormalized) {
      console.log(`[${idx + 1}/${rows.length}] Skip: ${row.image_title || row.image_id} is already normalized.`);
      continue;
    }

    console.log(`[${idx + 1}/${rows.length}] Normalizing: ${row.image_title || row.image_id}...`);

    try {
      // 1. Fetch metadata from Google Drive first (much faster than downloading whole image)
      let width = 0;
      let height = 0;
      
      const metaResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${row.image_id}?fields=imageMediaMetadata(width,height)&key=${apiKey}`
      );
      
      if (metaResponse.ok) {
        const metaData = await metaResponse.json();
        if (metaData.imageMediaMetadata?.width && metaData.imageMediaMetadata?.height) {
          width = parseInt(metaData.imageMediaMetadata.width);
          height = parseInt(metaData.imageMediaMetadata.height);
          console.log(`   Fetched from Google Drive: ${width}x${height}`);
        }
      }

      // 2. Fallback to downloading image and using sharp
      if (!width || !height) {
        console.log(`   Fallback: Downloading image from Drive proxy...`);
        const imageUrl = `https://drive.google.com/uc?export=download&id=${row.image_id}`;
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) {
          throw new Error(`Failed to download image ${row.image_id}`);
        }
        const buffer = await imageRes.arrayBuffer();
        const metadata = await sharp(Buffer.from(buffer)).metadata();
        width = metadata.width;
        height = metadata.height;
        console.log(`   Fetched via sharp: ${width}x${height}`);
      }

      if (!width || !height) {
        console.error(`   ❌ Could not determine size for ${row.image_id}`);
        continue;
      }

      // 3. Normalize coordinates
      const normalizedFaces = faces.map(face => {
        const normVertices = face.vertices?.map(v => ({
          x: v.x / width,
          y: v.y / height
        }));

        const normLandmarks = face.landmarks?.map(lm => ({
          type: lm.type,
          position: {
            x: lm.position.x / width,
            y: lm.position.y / height,
            z: lm.position.z / Math.max(width, height)
          }
        }));

        return {
          ...face,
          vertices: normVertices,
          landmarks: normLandmarks
        };
      });

      // 4. Update row in database
      const { error: updateError } = await supabase
        .from('latihan_faces')
        .update({ face_data: normalizedFaces })
        .eq('id', row.id);

      if (updateError) {
        console.error(`   ❌ Update error:`, updateError.message);
      } else {
        console.log(`   ✅ Success! Normalized ${faces.length} faces.`);
        updatedCount++;
      }
    } catch (err) {
      console.error(`   ❌ Failed to process ${row.image_id}:`, err.message || err);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`\n🎉 Backfill complete! Normalized and updated ${updatedCount} rows.`);
}

run();
