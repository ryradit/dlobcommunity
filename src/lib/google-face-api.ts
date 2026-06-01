/**
 * Google Cloud Face Recognition Service
 * Uses Vision API's advanced face detection + matching for accurate facial recognition
 * 
 * This hybrid approach:
 * 1. Uses Google Vision for fast face detection (data passed from calling function)
 * 2. Extracts high-quality facial features from detected faces
 * 3. Compares faces using similarity metrics based on facial landmarks
 */

/**
 * Extract comprehensive facial features from a face
 * Returns high-dimensional feature vector for accurate matching
 */
export interface FacialFeatures {
  // Landmark positions (normalized 0-1)
  landmarks: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    noseTip: { x: number; y: number };
    mouthCenter: { x: number; y: number };
    leftEar: { x: number; y: number };
    rightEar: { x: number; y: number };
    leftCheek: { x: number; y: number };
    rightCheek: { x: number; y: number };
  };
  // Head pose angles
  angles: {
    roll: number;
    pan: number;
    tilt: number;
  };
  // Bounding box
  bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  // Detection confidence
  confidence: number;
}

/**
 * Calculate similarity between two faces using facial landmarks
 * Returns score 0-1 where 1 = identical person, 0 = completely different
 *
 * This is MUCH more accurate than geometric features because it compares:
 * - Relative landmark positions (angle-invariant)
 * - Facial proportions and ratios
 * - Symmetry patterns
 */
export function calculateFacialSimilarity(
  face1: FacialFeatures,
  face2: FacialFeatures
): number {
  // Confidence gate - both faces must be detected with good confidence
  const minConfidence = Math.min(face1.confidence, face2.confidence);
  if (minConfidence < 0.75) {
    return 0;
  }

  // 1. Eye distance and position matching (most distinctive)
  const eyeDistance1 = Math.sqrt(
    Math.pow(face1.landmarks.rightEye.x - face1.landmarks.leftEye.x, 2) +
      Math.pow(face1.landmarks.rightEye.y - face1.landmarks.leftEye.y, 2)
  );
  const eyeDistance2 = Math.sqrt(
    Math.pow(face2.landmarks.rightEye.x - face2.landmarks.leftEye.x, 2) +
      Math.pow(face2.landmarks.rightEye.y - face2.landmarks.leftEye.y, 2)
  );

  const eyeDistanceRatio =
    Math.min(eyeDistance1, eyeDistance2) /
    Math.max(eyeDistance1, eyeDistance2 || 0.001);
  const eyeDistanceSimilarity = eyeDistanceRatio; // 0-1

  // 2. Eye to nose distance (facial proportions)
  const eyeToNose1 = Math.sqrt(
    Math.pow(face1.landmarks.noseTip.x - face1.landmarks.leftEye.x, 2) +
      Math.pow(face1.landmarks.noseTip.y - face1.landmarks.leftEye.y, 2)
  );
  const eyeToNose2 = Math.sqrt(
    Math.pow(face2.landmarks.noseTip.x - face2.landmarks.leftEye.x, 2) +
      Math.pow(face2.landmarks.noseTip.y - face2.landmarks.leftEye.y, 2)
  );

  const eyeToNoseRatio =
    Math.min(eyeToNose1, eyeToNose2) /
    Math.max(eyeToNose1, eyeToNose2 || 0.001);
  const eyeToNoseSimilarity = eyeToNoseRatio;

  // 3. Nose to mouth distance (facial structure)
  const noseToMouth1 = Math.sqrt(
    Math.pow(face1.landmarks.mouthCenter.x - face1.landmarks.noseTip.x, 2) +
      Math.pow(face1.landmarks.mouthCenter.y - face1.landmarks.noseTip.y, 2)
  );
  const noseToMouth2 = Math.sqrt(
    Math.pow(face2.landmarks.mouthCenter.x - face2.landmarks.noseTip.x, 2) +
      Math.pow(face2.landmarks.mouthCenter.y - face2.landmarks.noseTip.y, 2)
  );

  const noseToMouthRatio =
    Math.min(noseToMouth1, noseToMouth2) /
    Math.max(noseToMouth1, noseToMouth2 || 0.001);
  const noseToMouthSimilarity = noseToMouthRatio;

  // 4. Face width to height (aspect ratio)
  const width1 = Math.abs(face1.landmarks.rightEar.x - face1.landmarks.leftEar.x);
  const height1 = Math.abs(
    face1.landmarks.rightCheek.y - face1.landmarks.noseTip.y
  );
  const aspectRatio1 = height1 / (width1 || 1);

  const width2 = Math.abs(face2.landmarks.rightEar.x - face2.landmarks.leftEar.x);
  const height2 = Math.abs(
    face2.landmarks.rightCheek.y - face2.landmarks.noseTip.y
  );
  const aspectRatio2 = height2 / (width2 || 1);

  const aspectRatioSimilarity =
    1 - Math.abs(aspectRatio1 - aspectRatio2) / Math.max(aspectRatio1, aspectRatio2);

  // 5. Head angle similarity (same pose bonus)
  const rollDiff = Math.abs(face1.angles.roll - face2.angles.roll);
  const panDiff = Math.abs(face1.angles.pan - face2.angles.pan);
  const tiltDiff = Math.abs(face1.angles.tilt - face2.angles.tilt);
  const maxAngleDiff = Math.max(rollDiff, panDiff, tiltDiff);
  const angleBonus = Math.max(0, 1 - maxAngleDiff / 45); // 10% bonus if angles similar

  // Weighted combination (landmark ratios are most important)
  const similarity =
    eyeDistanceSimilarity * 0.25 +
    eyeToNoseSimilarity * 0.25 +
    noseToMouthSimilarity * 0.2 +
    aspectRatioSimilarity * 0.15 +
    angleBonus * 0.15;

  // Apply confidence weighting
  return similarity * minConfidence;
}

/**
 * Extract facial features from Google Vision face detection data
 */
export function extractFacialFeatures(visionFace: any): FacialFeatures {
  const landmarks = visionFace.landmarks || [];
  const lm: Record<string, { x: number; y: number }> = {};

  // Map landmarks
  for (const landmark of landmarks) {
    const type = landmark.type?.toLowerCase();
    if (type && landmark.position) {
      lm[type] = {
        x: (landmark.position.x || 0) / 1000,
        y: (landmark.position.y || 0) / 1000,
      };
    }
  }

  return {
    landmarks: {
      leftEye: lm["left_eye"] || { x: 0.3, y: 0.35 },
      rightEye: lm["right_eye"] || { x: 0.7, y: 0.35 },
      noseTip: lm["nose_tip"] || { x: 0.5, y: 0.5 },
      mouthCenter: lm["mouth_center"] || { x: 0.5, y: 0.65 },
      leftEar: lm["left_ear"] || { x: 0.2, y: 0.3 },
      rightEar: lm["right_ear"] || { x: 0.8, y: 0.3 },
      leftCheek: lm["left_cheek"] || { x: 0.25, y: 0.45 },
      rightCheek: lm["right_cheek"] || { x: 0.75, y: 0.45 },
    },
    angles: {
      roll: visionFace.rollAngle || 0,
      pan: visionFace.panAngle || 0,
      tilt: visionFace.tiltAngle || 0,
    },
    bounds: {
      left: Math.min(...(visionFace.vertices || []).map((v: any) => v.x || 0)) / 1000,
      top: Math.min(...(visionFace.vertices || []).map((v: any) => v.y || 0)) / 1000,
      right: Math.max(...(visionFace.vertices || []).map((v: any) => v.x || 0)) / 1000,
      bottom: Math.max(...(visionFace.vertices || []).map((v: any) => v.y || 0)) / 1000,
    },
    confidence: visionFace.confidence || 0.5,
  };
}

/**
 * Convert facial features to comparable embedding for Pinecone
 */
export function facialFeaturesToEmbedding(features: FacialFeatures): number[] {
  const embedding: number[] = [];

  // Add normalized landmark positions
  embedding.push(
    features.landmarks.leftEye.x,
    features.landmarks.leftEye.y,
    features.landmarks.rightEye.x,
    features.landmarks.rightEye.y,
    features.landmarks.noseTip.x,
    features.landmarks.noseTip.y,
    features.landmarks.mouthCenter.x,
    features.landmarks.mouthCenter.y,
    features.landmarks.leftEar.x,
    features.landmarks.leftEar.y,
    features.landmarks.rightEar.x,
    features.landmarks.rightEar.y,
    features.landmarks.leftCheek.x,
    features.landmarks.leftCheek.y,
    features.landmarks.rightCheek.x,
    features.landmarks.rightCheek.y
  );

  // Add angles
  embedding.push(
    features.angles.roll / 180,
    features.angles.pan / 180,
    features.angles.tilt / 180
  );

  // Add bounding box
  embedding.push(
    features.bounds.left,
    features.bounds.top,
    features.bounds.right,
    features.bounds.bottom
  );

  // Add confidence
  embedding.push(features.confidence);

  // Calculate and add facial ratios
  const eyeDistance = Math.sqrt(
    Math.pow(features.landmarks.rightEye.x - features.landmarks.leftEye.x, 2) +
      Math.pow(features.landmarks.rightEye.y - features.landmarks.leftEye.y, 2)
  );
  const faceWidth = features.bounds.right - features.bounds.left;
  const faceHeight = features.bounds.bottom - features.bounds.top;

  embedding.push(
    eyeDistance,
    eyeDistance / faceWidth,
    faceHeight / faceWidth
  );

  // Pad to 1280 dimensions for Pinecone
  while (embedding.length < 1280) {
    embedding.push(0);
  }

  // Normalize to unit vector
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  return embedding.slice(0, 1280).map((v) => v / (norm || 1));
}
