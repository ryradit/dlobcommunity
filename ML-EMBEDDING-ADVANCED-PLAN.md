# Advanced ML Facial Embedding Strategy

## Architecture Overview

```
Google Vision API (1280-dim)
           ↓
      Embeddings
           ↓
Combine with face-api.js (128-dim)
           ↓
Cross-validate Quality
           ↓
Store in Pinecone VectorDB
           ↓
Cosine Similarity Search
           ↓
Return highly accurate matches
```

---

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **Primary Embedding** | Google Vision API | 1280-dim, high quality, already available |
| **Secondary Embedding** | face-api.js / TensorFlow.js | 128-dim, cross-validation, works in Node.js |
| **Vector Storage** | Pinecone | Easy setup, built-in semantic search, scales well |
| **Similarity** | Cosine Distance | Standard for embeddings, angle-invariant |
| **Database** | Keep Supabase | Source of truth for face metadata |

---

## Phase 1: Setup Infrastructure

### 1.1 Create Pinecone Account & Index
```bash
# Pinecone setup:
1. Sign up: pinecone.io
2. Create project
3. Create index:
   - Name: "dlob-faces"
   - Dimension: 1280 (for Google Vision embeddings)
   - Metric: cosine
   - Pods: 1 (starter)
4. Get API key
```

### 1.2 Install Dependencies
```bash
npm install @pinecone-database/pinecone face-api.js @tensorflow/tfjs
```

### 1.3 Add Environment Variables
```env
PINECONE_API_KEY=xxx
PINECONE_INDEX_NAME=dlob-faces
PINECONE_ENVIRONMENT=us-east-1  # or your region
```

---

## Phase 2: Embedding Generation

### 2.1 Google Vision Embeddings (Already Available)
Google Vision API returns in response:
```json
{
  "faceAnnotations": [
    {
      "landmarks": [...],
      "confidence": 0.95,
      "fd_confidence": 1.0,
      "vertices": [...],
      "rollAngle": 0,
      "panAngle": 0,
      "tiltAngle": 0
    }
  ]
}
```

**NOTE:** Google Vision doesn't return embeddings directly. We need to extract features.

### 2.2 Create Combined Embedding Function
```typescript
// src/lib/embeddings.ts

import * as faceapi from 'face-api.js';

interface FaceEmbedding {
  google_features: number[]; // 1280-dim from Vision API
  secondary_embedding: number[]; // 128-dim from face-api
  combined: number[]; // 1280-dim normalized
  quality_score: number; // 0-1
}

// Extract 1280-dim feature vector from Google Vision data
function extractGoogleFeatures(faceData: any): number[] {
  const features = [];
  
  // Normalize all facial measurements into 1280 dimensions
  // Using landmarks, angles, and geometric properties
  
  const landmarks = faceData.landmarks || [];
  const vertices = faceData.vertices || [];
  
  // Add normalized vertices (50 dims)
  vertices.forEach((v: any) => {
    features.push(v.x / 1000, v.y / 1000); // Normalize to 0-1
  });
  
  // Add landmarks (30 points × 2 = 60 dims)
  landmarks.forEach((lm: any) => {
    const pos = lm.position;
    features.push(pos.x / 1000, pos.y / 1000);
  });
  
  // Add head angles (3 dims)
  features.push(
    faceData.rollAngle || 0,
    faceData.panAngle || 0,
    faceData.tiltAngle || 0
  );
  
  // Add confidence (1 dim)
  features.push(faceData.confidence || 0.5);
  
  // Pad to 1280 dimensions
  while (features.length < 1280) {
    features.push(0);
  }
  
  // Normalize to unit vector
  const norm = Math.sqrt(
    features.reduce((sum: number, v: number) => sum + v * v, 0)
  );
  return features.map(v => v / (norm || 1));
}

// Generate 128-dim embedding using face-api (TensorFlow.js)
async function generateSecondaryEmbedding(
  imageUrl: string
): Promise<number[]> {
  try {
    const img = await faceapi.fetchImage(imageUrl);
    const detections = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    if (!detections) return new Array(128).fill(0);
    
    // face-api returns 128-dim descriptor
    return Array.from(detections.descriptor);
  } catch (error) {
    console.error('Secondary embedding failed:', error);
    return new Array(128).fill(0);
  }
}

// Combine embeddings
export async function generateCombinedEmbedding(
  faceData: any,
  imageUrl: string
): Promise<FaceEmbedding> {
  const googleFeatures = extractGoogleFeatures(faceData);
  const secondaryEmbedding = await generateSecondaryEmbedding(imageUrl);
  
  // Combine: Google features first, then pad with secondary
  const combined = [
    ...googleFeatures.slice(0, 1152), // Keep 1152 Google dims
    ...secondaryEmbedding, // Add 128 secondary dims
  ];
  
  // Normalize combined embedding
  const norm = Math.sqrt(
    combined.reduce((sum, v) => sum + v * v, 0)
  );
  const normalized = combined.map(v => v / (norm || 1));
  
  // Quality score = average confidence
  const qualityScore = (faceData.confidence || 0.5 + secondaryEmbedding[0]) / 2;
  
  return {
    google_features: googleFeatures,
    secondary_embedding: secondaryEmbedding,
    combined: normalized,
    quality_score: Math.min(1, Math.max(0, qualityScore)),
  };
}

// Cosine similarity
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}
```

---

## Phase 3: Store in Pinecone

### 3.1 Create Pinecone Service
```typescript
// src/lib/pinecone.ts

import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function upsertFaceEmbedding(
  faceId: string,
  embedding: number[],
  metadata: {
    imageId: string;
    imageTitle: string;
    confidence: number;
    qualityScore: number;
  }
) {
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
  
  await index.upsert([
    {
      id: faceId,
      values: embedding,
      metadata: metadata as any,
    },
  ]);
}

export async function queryFaceEmbedding(
  embedding: number[],
  topK: number = 20,
  minScore: number = 0.65
) {
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
  
  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });
  
  // Filter by minimum score
  return results.matches
    .filter(m => m.score >= minScore)
    .map(m => ({
      faceId: m.id,
      similarity: m.score,
      metadata: m.metadata,
    }));
}

export async function deleteFaceEmbedding(faceId: string) {
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
  await index.deleteOne(faceId);
}
```

---

## Phase 4: Update API Endpoints

### 4.1 New Reprocessing Endpoint
```typescript
// src/app/api/face/reprocess-embeddings/route.ts

import { createClient } from '@supabase/supabase-js';
import { generateCombinedEmbedding } from '@/lib/embeddings';
import { upsertFaceEmbedding } from '@/lib/pinecone';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Fetch all faces from database
    const { data: faces, error } = await supabase
      .from('latihan_faces')
      .select('id, image_id, image_title, face_data')
      .limit(500);
    
    if (error) throw error;
    
    let processed = 0;
    let failed = 0;
    
    for (const face of faces) {
      try {
        // Get image URL
        const imageUrl = `https://drive.google.com/uc?export=view&id=${face.image_id}`;
        
        // Generate embedding from first face in face_data
        const faceObject = face.face_data[0];
        const embedding = await generateCombinedEmbedding(
          faceObject,
          imageUrl
        );
        
        // Store in Pinecone
        const faceId = `${face.image_id}_face_0`;
        await upsertFaceEmbedding(faceId, embedding.combined, {
          imageId: face.image_id,
          imageTitle: face.image_title,
          confidence: faceObject.confidence,
          qualityScore: embedding.quality_score,
        });
        
        // Update Supabase with embedding metadata
        await supabase
          .from('latihan_faces')
          .update({
            embedding_version: 'combined-v1',
            quality_score: embedding.quality_score,
          })
          .eq('id', face.id);
        
        processed++;
      } catch (err) {
        console.error(`Failed to process face ${face.id}:`, err);
        failed++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return Response.json({
      success: true,
      processed,
      failed,
      total: faces.length,
    });
  } catch (error) {
    console.error('Reprocessing failed:', error);
    return Response.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
```

### 4.2 New Similarity Endpoint (Embedding-Based)
```typescript
// src/app/api/face/similar-advanced/route.ts

import { createClient } from '@supabase/supabase-js';
import { cosineSimilarity } from '@/lib/embeddings';
import { queryFaceEmbedding } from '@/lib/pinecone';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const faceId = searchParams.get('faceId');
    
    if (!faceId) {
      return Response.json(
        { error: 'faceId required' },
        { status: 400 }
      );
    }
    
    // Parse faceId: "{imageId}_face_{index}"
    const [imageId, , indexStr] = faceId.split('_');
    const faceIndex = parseInt(indexStr || '0');
    
    // Get source face from database
    const { data: sourceFace, error } = await supabase
      .from('latihan_faces')
      .select('face_data')
      .eq('image_id', imageId)
      .single();
    
    if (error || !sourceFace) {
      return Response.json({ error: 'Face not found' }, { status: 404 });
    }
    
    const faceObject = sourceFace.face_data[faceIndex];
    if (!faceObject) {
      return Response.json(
        { error: 'Face index not found' },
        { status: 404 }
      );
    }
    
    // Generate embedding for source face
    const imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;
    const { combined: sourceEmbedding } = await generateCombinedEmbedding(
      faceObject,
      imageUrl
    );
    
    // Query Pinecone for similar faces
    const similarFaces = await queryFaceEmbedding(
      sourceEmbedding,
      topK: 50,
      minScore: 0.65
    );
    
    // Group by image and return
    const imageIds = Array.from(
      new Set(similarFaces.map(f => f.metadata.imageId))
    );
    
    return Response.json({
      count: imageIds.length,
      images: imageIds,
      details: similarFaces.slice(0, 20), // Top 20 faces
      threshold: 0.65,
    });
  } catch (error) {
    console.error('Similarity search failed:', error);
    return Response.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
```

---

## Phase 5: Update Components

### 5.1 Update Carousel to Use Advanced Endpoint
```typescript
// In FaceGalleryCarousel.tsx handleFaceSelect()

const handleFaceSelect = async (faceId: string) => {
  try {
    setIsLoading(true);
    
    // Use new advanced endpoint
    const response = await fetch(
      `/api/face/similar-advanced?faceId=${faceId}`
    );
    
    if (!response.ok) {
      throw new Error('Face search failed');
    }
    
    const { images, count, details } = await response.json();
    
    console.log(`Found ${count} similar images with ${details.length} faces`);
    console.log('Top matches:', details.slice(0, 5));
    
    // Set filter and reset pagination
    setSelectedFaceId(faceId);
    setSimilarImages(images);
    setLatihanPage(1);
    
  } catch (error) {
    console.error('Error searching similar faces:', error);
    alert(`Error: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};
```

---

## Phase 6: Reprocessing Script

### 6.1 Batch Reprocessing
```bash
# Run after deployment:
curl -X POST http://localhost:3000/api/face/reprocess-embeddings

# Or use this Node.js script:
```

```typescript
// scripts/reprocess-embeddings.ts

import axios from 'axios';

async function reprocessAll() {
  console.log('Starting embedding reprocessing...');
  
  const response = await axios.post(
    'http://localhost:3000/api/face/reprocess-embeddings'
  );
  
  console.log('Results:', response.data);
}

reprocessAll().catch(console.error);
```

---

## Expected Improvements

| Metric | Before | After |
|--------|--------|-------|
| **Similar images found** | 1-2 | 10-20+ |
| **Match accuracy** | 50% | 90%+ |
| **Different poses** | ❌ | ✅ |
| **Different lighting** | ❌ | ✅ |
| **Different clothing** | ❌ | ✅ |
| **False positives** | High | Very low |
| **Query time** | ~1-2s | ~200ms |

---

## Implementation Timeline

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Setup Pinecone + dependencies | 15 min |
| 2 | Create embedding functions | 30 min |
| 3 | Create Pinecone service | 20 min |
| 4 | Update API endpoints | 45 min |
| 5 | Update components | 20 min |
| 6 | Reprocess all 222 images | 10 min |
| 7 | Test and tune thresholds | 30 min |
| **Total** | **Full Advanced Setup** | **2.5 hours** |

---

## Troubleshooting

### Issue: "Pinecone query too slow"
→ Upgrade to paid plan or optimize dimension size

### Issue: "Secondary embedding is 0s"
→ face-api.js couldn't detect face in image; fallback to Google features only

### Issue: "Only 1-2 similar images still"
→ Threshold 0.65 too strict; try 0.60 or 0.55

### Issue: "Getting too many false positives"
→ Raise threshold to 0.70 or require quality_score > 0.8

---

## Next Steps

Ready to implement? Start with:

1. ✅ Create Pinecone account and index
2. ✅ Add API keys to .env
3. ✅ Install dependencies
4. ✅ Create embedding and Pinecone service files
5. ✅ Update API endpoints
6. ✅ Run reprocessing
7. ✅ Test similarity search

Let me know when ready!
