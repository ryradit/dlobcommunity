/**
 * Advanced Face Similarity Search using ML Embeddings
 * Queries Pinecone vector DB for high-accuracy face matching
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { generateCombinedEmbedding, calculateSimilarityWithAngleBonus } from "@/lib/embeddings";
import { querySimilarFaces } from "@/lib/pinecone";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const faceId = searchParams.get("faceId");
    const threshold = parseFloat(searchParams.get("threshold") || "0.65");
    const topK = parseInt(searchParams.get("topK") || "100");

    // Validate input
    if (!faceId) {
      return NextResponse.json(
        { error: "faceId parameter required" },
        { status: 400 }
      );
    }

    // Parse faceId: "{imageId}_face_{index}"
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
      `🔍 Searching for similar faces to ${faceId} (threshold: ${threshold}, topK: ${topK})`
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
        {
          error: `Face index ${sourceFaceIndex} not found in image`,
        },
        { status: 404 }
      );
    }

    const sourceFaceObject = faceDataArray[sourceFaceIndex];

    console.log(`Source face confidence: ${sourceFaceObject.confidence}`);

    // Generate embedding for source face
    const sourceImageUrl = `https://drive.google.com/uc?export=view&id=${sourceImageId}`;
    const sourceEmbedding = await generateCombinedEmbedding(
      sourceFaceObject,
      sourceImageUrl
    );

    console.log(`Generated source embedding (quality: ${sourceEmbedding.quality_score})`);

    // Query Pinecone for similar faces
    const results = await querySimilarFaces(
      sourceEmbedding.combined,
      {
        topK,
        minScore: threshold,
        filterImageId: sourceImageId, // Exclude source image
      }
    );

    console.log(
      `✅ Query complete: ${results.matches.length} similar faces in ${results.uniqueImages.length} unique images (threshold: ${threshold})`
    );

    if (results.matches.length === 0) {
      console.warn(`⚠️ No matches found at threshold ${threshold}. Trying lower threshold...`);
      
      // If no results, it might mean:
      // 1. Embeddings weren't reprocessed
      // 2. Threshold is too high
      // 3. Face has no similar matches
      return NextResponse.json(
        {
          success: true,
          sourceImageId,
          sourceFaceIndex,
          sourceQuality: sourceEmbedding.quality_score,
          threshold,
          results: {
            totalMatches: 0,
            uniqueImages: 0,
            images: [],
            topFaceMatches: [],
          },
          debug: {
            algorithm: "ml-embedding-v1",
            embeddingDim: 1280,
            modelCombination: "google-vision + angle-bonus",
            warning: `No similar faces found at threshold ${threshold}. Try lowering threshold or select another face.`,
            hint: "Ensure embeddings have been reprocessed with /api/face/reprocess-embeddings",
          },
        },
        { status: 200 }
      );
    }

    // Apply angle bonus if available
    // Filter with more lenient confidence threshold (0.70 instead of 0.80)
    const enhancedMatches = results.matches
      .filter(match => (match.confidence || 0) >= 0.70)
      .map((match) => {
      let finalScore = match.similarity || 0;

      // Weight by confidence: high-confidence matches are more reliable
      const sourceConfidence = sourceFaceObject.confidence || 0.8;
      const targetConfidence = match.confidence || 0.8;
      const confidenceBoost = Math.min(sourceConfidence, targetConfidence);
      finalScore = finalScore * (0.5 + confidenceBoost * 0.5); // 50-100% weight based on confidence

      // If we have angle data from metadata, apply angle bonus
      // This requires storing angles in Pinecone metadata
      if (sourceFaceObject.rollAngle !== undefined && finalScore > 0) {
        finalScore = calculateSimilarityWithAngleBonus(
          finalScore,
          {
            roll: sourceFaceObject.rollAngle || 0,
            pan: sourceFaceObject.panAngle || 0,
            tilt: sourceFaceObject.tiltAngle || 0,
          },
          {
            roll: 0, // Would come from Pinecone metadata in future
            pan: 0,
            tilt: 0,
          }
        );
      }

      return {
        ...match,
        finalScore: Math.min(1, finalScore),
      };
    });

    console.log(
      `After filtering & scoring: ${enhancedMatches.length} enhanced matches`
    );

    // Sort by final score
    enhancedMatches.sort((a, b) => b.finalScore - a.finalScore);

    // Group by image (preferred: the face with highest score from each image)
    const imageMap = new Map<
      string,
      {
        imageId: string;
        imageTitle: string;
        bestMatch: number;
        matchCount: number;
      }
    >();

    for (const match of enhancedMatches) {
      const imageId = match.imageId || "unknown";
      if ((imageId as string) === "unknown") continue; // Skip if no imageId
      
      const key = imageId as string;
      if (!imageMap.has(key)) {
        imageMap.set(key, {
          imageId: key,
          imageTitle: match.imageTitle || "Untitled",
          bestMatch: match.finalScore,
          matchCount: 1,
        });
      } else {
        const existing = imageMap.get(key)!;
        existing.matchCount++;
      }
    }

    const similarImages = Array.from(imageMap.values()).sort(
      (a, b) => b.bestMatch - a.bestMatch
    );

    return NextResponse.json(
      {
        success: true,
        sourceImageId,
        sourceFaceIndex,
        sourceQuality: sourceEmbedding.quality_score,
        threshold,
        results: {
          totalMatches: results.totalMatches,
          uniqueImages: results.uniqueImages.length,
          images: similarImages.map((img) => ({
            imageId: img.imageId,
            imageTitle: img.imageTitle,
            matchScore: img.bestMatch,
            matchesInImage: img.matchCount,
          })),
          topFaceMatches: enhancedMatches.slice(0, 20).map((m) => ({
            faceId: m.faceId,
            imageId: m.imageId,
            similarity: m.finalScore,
            confidence: m.confidence,
          })),
        },
        debug: {
          algorithm: "ml-embedding-v1",
          embeddingDim: 1280,
          modelCombination: "google-vision + angle-bonus",
          processingTime: "ml-optimized",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Advanced similarity search failed:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        hint: "Make sure Pinecone is configured and embeddings have been reprocessed",
      },
      { status: 500 }
    );
  }
}
