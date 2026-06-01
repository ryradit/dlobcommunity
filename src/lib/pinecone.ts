/**
 * Pinecone Vector Database Service
 * Manages face embeddings in vector DB for fast similarity search
 */

import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone client
let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error("PINECONE_API_KEY environment variable is not set");
    }

    pineconeClient = new Pinecone({
      apiKey,
    });
  }
  return pineconeClient;
}

/**
 * Get Pinecone index instance
 */
function getIndex(indexName?: string) {
  const client = getPineconeClient();
  const name = indexName || process.env.PINECONE_INDEX_NAME || "dlob-faces";
  return client.Index(name);
}

/**
 * Upsert a single face embedding
 */
export async function upsertFaceEmbedding(
  faceId: string,
  embedding: number[],
  metadata: {
    imageId: string;
    imageTitle: string;
    confidence: number;
    qualityScore: number;
    faceIndex?: number;
  }
) {
  try {
    const index = getIndex();

    await index.upsert([
      {
        id: faceId,
        values: embedding,
        metadata: {
          imageId: metadata.imageId,
          imageTitle: metadata.imageTitle,
          confidence: metadata.confidence,
          qualityScore: metadata.qualityScore,
          faceIndex: metadata.faceIndex || 0,
          updatedAt: new Date().toISOString(),
        },
      },
    ]);

    console.log(`✓ Upserted embedding for ${faceId}`);
  } catch (error) {
    console.error(`✗ Failed to upsert embedding for ${faceId}:`, error);
    throw error;
  }
}

/**
 * Upsert multiple face embeddings in batch
 */
export async function upsertBatchEmbeddings(
  vectors: Array<{
    id: string;
    values: number[];
    metadata: Record<string, any>;
  }>
) {
  try {
    const index = getIndex();

    // Pinecone has limits on batch size, so chunk if necessary
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
      console.log(`✓ Upserted batch ${i / batchSize + 1}/${Math.ceil(vectors.length / batchSize)}`);
    }
  } catch (error) {
    console.error("Failed to upsert batch embeddings:", error);
    throw error;
  }
}

/**
 * Query for similar faces
 */
export async function querySimilarFaces(
  embedding: number[],
  options: {
    topK?: number;
    minScore?: number;
    filterImageId?: string;
  } = {}
) {
  try {
    const index = getIndex();
    const topK = options.topK || 20;
    const minScore = options.minScore || 0.65;

    const queryResponse = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    // Filter results
    let results = queryResponse.matches || [];

    // Filter by minimum score
    results = results.filter((match) => (match.score ?? 0) >= minScore);

    // Optionally exclude source image
    if (options.filterImageId) {
      results = results.filter(
        (match) => match.metadata?.imageId !== options.filterImageId
      );
    }

    const uniqueImages = Array.from(
      new Set(results.map((r) => r.metadata?.imageId as string))
    );

    console.log(
      `Found ${results.length} similar faces in ${uniqueImages.length} unique images`
    );

    return {
      matches: results.map((m) => ({
        faceId: m.id,
        similarity: m.score,
        imageId: m.metadata?.imageId ? String(m.metadata.imageId) : undefined,
        imageTitle: m.metadata?.imageTitle ? String(m.metadata.imageTitle) : undefined,
        confidence: typeof m.metadata?.confidence === 'number' ? m.metadata.confidence : undefined,
        qualityScore: typeof m.metadata?.qualityScore === 'number' ? m.metadata.qualityScore : undefined,
      })),
      uniqueImages,
      totalMatches: results.length,
    };
  } catch (error) {
    console.error("Failed to query similar faces:", error);
    throw error;
  }
}

/**
 * Delete a face embedding
 */
export async function deleteFaceEmbedding(faceId: string) {
  try {
    const index = getIndex();
    await index.deleteOne(faceId);
    console.log(`✓ Deleted embedding for ${faceId}`);
  } catch (error) {
    console.error(`✗ Failed to delete embedding for ${faceId}:`, error);
    throw error;
  }
}

/**
 * Delete embeddings for an image
 */
export async function deleteImageEmbeddings(imageId: string) {
  try {
    const index = getIndex();

    // Query all faces from this image
    const queryResponse = await index.query({
      vector: new Array(1280).fill(0),
      topK: 1000,
      includeMetadata: true,
      filter: {
        imageId: { $eq: imageId },
      },
    });

    const faceIds = queryResponse.matches.map((m) => m.id);

    if (faceIds.length > 0) {
      // Delete in batches
      for (let i = 0; i < faceIds.length; i += 100) {
        const batch = faceIds.slice(i, i + 100);
        await index.deleteMany(batch);
      }
    }

    console.log(`✓ Deleted ${faceIds.length} embeddings for image ${imageId}`);
  } catch (error) {
    console.error(
      `✗ Failed to delete embeddings for image ${imageId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get index stats
 */
export async function getIndexStats() {
  try {
    const index = getIndex();
    const stats = await index.describeIndexStats();
    return stats;
  } catch (error) {
    console.error("Failed to get index stats:", error);
    throw error;
  }
}

/**
 * Clear all embeddings from index (use with caution!)
 */
export async function clearIndex() {
  try {
    const index = getIndex();
    // Note: Pinecone doesn't have a bulk delete, so we'd need to implement it differently
    console.warn("⚠️  Clearing index is not recommended. Use with caution.");
    // In practice, you'd delete the index and recreate it
  } catch (error) {
    console.error("Failed to clear index:", error);
    throw error;
  }
}
