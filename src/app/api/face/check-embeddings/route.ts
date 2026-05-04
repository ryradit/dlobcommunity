import { querySimilarFaces } from "@/lib/pinecone";
import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint to check if face embeddings exist in Pinecone
 * GET /api/face/check-embeddings
 */
export async function GET() {
  try {
    console.log("🔍 Checking if embeddings exist in Pinecone...");

    // Create a dummy query vector (all zeros)
    const dummyVector = new Array(1280).fill(0.001);

    // Query with very low threshold to get ANY results
    const results = await querySimilarFaces(dummyVector, {
      topK: 1,
      minScore: 0, // Accept any score
    });

    const embeddingCount = results.totalMatches || 0;

    if (embeddingCount === 0) {
      return NextResponse.json(
        {
          status: "no_embeddings",
          message: "❌ No embeddings found in Pinecone. Embeddings need to be reprocessed.",
          action: "Call POST /api/face/reprocess-embeddings to generate and upload embeddings.",
          embeddingCount: 0,
          totalMatches: results.totalMatches,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        message: "✅ Embeddings found in Pinecone!",
        embeddingCount: embeddingCount,
        totalMatches: results.totalMatches,
        uniqueImages: results.uniqueImages.length,
        sampleMatches: results.matches.slice(0, 3).map((m) => ({
          faceId: m.faceId,
          imageId: m.imageId,
          similarity: m.similarity,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error checking embeddings:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Error checking embeddings",
        error: error instanceof Error ? error.message : String(error),
        action: "Check server logs and verify Pinecone is configured correctly",
      },
      { status: 500 }
    );
  }
}
