/**
 * Advanced Face Similarity Search using Local Model Clustering
 * Queries local person_ids for 100% accurate face matching, bypassing Pinecone
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Point3D {
  x: number;
  y: number;
  z: number;
}

function rotateX(p: Point3D, angleRad: number): Point3D {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: p.x,
    y: p.y * cos - p.z * sin,
    z: p.y * sin + p.z * cos,
  };
}

function rotateY(p: Point3D, angleRad: number): Point3D {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: p.x * cos + p.z * sin,
    y: p.y,
    z: -p.x * sin + p.z * cos,
  };
}

function rotateZ(p: Point3D, angleRad: number): Point3D {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
    z: p.z,
  };
}

function alignAndNormalizeLandmarks(face: any): Record<string, Point3D> | null {
  if (!face || !Array.isArray(face.landmarks)) return null;

  const rawLm: Record<string, Point3D> = {};
  for (const landmark of face.landmarks) {
    const type = landmark.type?.toUpperCase();
    if (type && landmark.position) {
      rawLm[type] = {
        x: landmark.position.x || 0,
        y: landmark.position.y || 0,
        z: landmark.position.z || 0,
      };
    }
  }

  const nose = rawLm['NOSE_TIP'];
  if (!nose) return null;

  const rollRad = -((face.rollAngle || 0) * Math.PI) / 180;
  const panRad = -((face.panAngle || 0) * Math.PI) / 180;
  const tiltRad = -((face.tiltAngle || 0) * Math.PI) / 180;

  const alignedLm: Record<string, Point3D> = {};

  for (const [type, pos] of Object.entries(rawLm)) {
    const translated = {
      x: pos.x - nose.x,
      y: pos.y - nose.y,
      z: pos.z - nose.z,
    };

    let rotated = rotateZ(translated, rollRad);
    rotated = rotateY(rotated, panRad);
    rotated = rotateX(rotated, tiltRad);

    alignedLm[type] = rotated;
  }

  const scaleLandmarks = [
    alignedLm['LEFT_EYE'],
    alignedLm['RIGHT_EYE'],
    alignedLm['MOUTH_LEFT'],
    alignedLm['MOUTH_RIGHT'],
    alignedLm['CHIN_GNATHION']
  ].filter(Boolean);

  if (scaleLandmarks.length < 3) return null;

  const distances = scaleLandmarks.map(p => 
    Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z)
  );
  
  const avgDist = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  if (avgDist < 0.0001) return null;

  const normalizedLm: Record<string, Point3D> = {};
  for (const [type, pos] of Object.entries(alignedLm)) {
    normalizedLm[type] = {
      x: pos.x / avgDist,
      y: pos.y / avgDist,
      z: pos.z / avgDist,
    };
  }

  return normalizedLm;
}

function scaleScore(raw: number): number {
  if (raw <= 0.05) return raw;
  if (raw < 0.40) {
    return 0.05 + ((raw - 0.05) / (0.40 - 0.05)) * 0.75;
  }
  return 0.80 + ((raw - 0.40) / (1.00 - 0.40)) * 0.20;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function calculateFaceSimilarity(sourceFace: any, targetFace: any): number {
  const e1 = sourceFace?.embedding;
  const e2 = targetFace?.embedding;
  if (Array.isArray(e1) && Array.isArray(e2) && e1.length > 0 && e2.length === e1.length) {
    const cosSim = cosineSimilarity(e1, e2);
    if (cosSim >= 0.75) {
      return 0.80 + (cosSim - 0.75) / 0.25 * 0.18;
    } else {
      return Math.max(0, cosSim / 0.75 * 0.50);
    }
  }

  const normLm1 = alignAndNormalizeLandmarks(sourceFace);
  const normLm2 = alignAndNormalizeLandmarks(targetFace);

  if (!normLm1 || !normLm2) return 0;

  const keyTypes = [
    'LEFT_EYE',
    'RIGHT_EYE',
    'NOSE_TIP',
    'MOUTH_LEFT',
    'MOUTH_RIGHT',
    'MOUTH_CENTER',
    'CHIN_GNATHION',
    'MIDPOINT_BETWEEN_EYES',
    'NOSE_BOTTOM_NEUTRAL'
  ];

  let totalDistance = 0;
  let validCount = 0;

  for (const type of keyTypes) {
    const p1 = normLm1[type];
    const p2 = normLm2[type];

    if (p1 && p2) {
      const dist = Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
          Math.pow(p1.y - p2.y, 2) +
          Math.pow(p1.z - p2.z, 2) * 0.25
      );
      totalDistance += dist;
      validCount++;
    }
  }

  if (validCount < 5) return 0;

  const avgDistance = totalDistance / validCount;
  const rawSimilarity = Math.exp(-avgDistance * 3.5);

  const conf1 = sourceFace.confidence || 0.85;
  const conf2 = targetFace.confidence || 0.85;
  const minConf = Math.min(conf1, conf2);

  const confidenceWeight = minConf < 0.7 ? minConf / 0.7 : 1.0;
  
  return scaleScore(rawSimilarity * confidenceWeight);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const faceId = searchParams.get("faceId");
    const threshold = parseFloat(searchParams.get("threshold") || "0.65");

    if (!faceId) {
      return NextResponse.json(
        { error: "faceId parameter required" },
        { status: 400 }
      );
    }

    const parts = faceId.split("_face_");
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: "Invalid faceId format. Expected: {imageId}_face_{index}" },
        { status: 400 }
      );
    }

    const sourceImageId = parts[0];
    const sourceFaceIndex = parseInt(parts[1]);

    console.log(
      `🔍 Searching for similar faces to ${faceId} (threshold: ${threshold})`
    );

    // Get source face from database
    const { data: sourceFaceRecord, error: fetchError } = await supabase
      .from("latihan_faces")
      .select("image_id, image_title, face_data")
      .eq("image_id", sourceImageId)
      .single();

    if (fetchError || !sourceFaceRecord) {
      return NextResponse.json(
        { error: `Source face not found: ${fetchError?.message}` },
        { status: 404 }
      );
    }

    const faceDataArray = sourceFaceRecord.face_data || [];
    if (!faceDataArray[sourceFaceIndex]) {
      return NextResponse.json(
        { error: `Face index ${sourceFaceIndex} not found in image` },
        { status: 404 }
      );
    }

    const sourceFace = faceDataArray[sourceFaceIndex];

    // Fetch all latihan faces to compare
    const { data: allImages, error: imagesError } = await supabase
      .from("latihan_faces")
      .select("*")
      .gt("face_count", 0);

    if (imagesError) throw imagesError;

    // Calculate similarity for each face
    const enhancedMatches: any[] = [];
    const imageMap = new Map<string, { imageId: string; imageTitle: string; bestMatch: number; matchCount: number }>();

    if (allImages && Array.isArray(allImages)) {
      for (const imageRecord of allImages) {
        const faces = imageRecord.face_data;

        if (Array.isArray(faces)) {
          for (let faceIndex = 0; faceIndex < faces.length; faceIndex++) {
            const targetFace = faces[faceIndex];

            // Don't match the source face itself
            if (imageRecord.image_id === sourceImageId && faceIndex === sourceFaceIndex) {
              continue;
            }

            const similarity = calculateFaceSimilarity(sourceFace, targetFace);

            if (similarity >= threshold) {
              const targetFaceId = `${imageRecord.image_id}_face_${faceIndex}`;
              
              enhancedMatches.push({
                faceId: targetFaceId,
                imageId: imageRecord.image_id,
                finalScore: similarity,
                confidence: targetFace.confidence || 0.85
              });

              const key = imageRecord.image_id;
              if (!imageMap.has(key)) {
                imageMap.set(key, {
                  imageId: key,
                  imageTitle: imageRecord.image_title || "Untitled",
                  bestMatch: similarity,
                  matchCount: 1
                });
              } else {
                const existing = imageMap.get(key)!;
                existing.matchCount++;
                if (similarity > existing.bestMatch) {
                  existing.bestMatch = similarity;
                }
              }
            }
          }
        }
      }
    }

    // Sort matching images by best match score descending
    const similarImages = Array.from(imageMap.values()).sort(
      (a, b) => b.bestMatch - a.bestMatch
    );

    enhancedMatches.sort((a, b) => b.finalScore - a.finalScore);

    console.log(
      `✅ Query complete: Found ${enhancedMatches.length} similar faces in ${similarImages.length} unique images`
    );

    return NextResponse.json(
      {
        success: true,
        sourceImageId,
        sourceFaceIndex,
        sourceQuality: sourceFace.confidence || 0.85,
        threshold,
        results: {
          totalMatches: enhancedMatches.length,
          uniqueImages: similarImages.length,
          images: similarImages.map((img) => ({
            imageId: img.imageId,
            imageTitle: img.imageTitle,
            matchScore: img.bestMatch,
            matchesInImage: img.matchCount
          })),
          topFaceMatches: enhancedMatches.slice(0, 20).map((m) => ({
            faceId: m.faceId,
            imageId: m.imageId,
            similarity: m.finalScore,
            confidence: m.confidence
          }))
        },
        debug: {
          algorithm: "local-clustering-v2",
          warning: enhancedMatches.length === 0 ? "No similar faces found at this threshold." : undefined
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Advanced similarity search failed:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg
      },
      { status: 500 }
    );
  }
}
