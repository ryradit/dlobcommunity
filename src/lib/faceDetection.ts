// Face Detection Utility — Gemini Vision API
// Sends each member photo to gemini-2.0-flash via /api/face-detect.
// Returns face center as (faceX%, faceY%) of the original image dimensions.
// Results are cached in localStorage (key: dlob_face_v3_{filename}) so each
// photo is only analysed once — subsequent page loads are instant.

const CACHE_PREFIX = 'dlob_face_v5_';

export interface FacePercent {
  /** Horizontal center of the face, 0-100% of image width */
  faceX: number;
  /** Vertical center of the face, 0-100% of image height */
  faceY: number;
  /** Scale factor to apply on the thumbnail so the face is comfortably visible (1.0–2.5) */
  zoom: number;
}

/** In-flight request dedup: imagePath → pending Promise */
const inFlight = new Map<string, Promise<FacePercent>>();

class FaceDetectionService {
  private static instance: FaceDetectionService;

  static getInstance(): FaceDetectionService {
    if (!FaceDetectionService.instance) {
      FaceDetectionService.instance = new FaceDetectionService();
    }
    return FaceDetectionService.instance;
  }

  // ─── No-op kept for backwards compat with SmartCropImage ─────────────────
  async loadModel(): Promise<void> {}

  // ─── localStorage cache ───────────────────────────────────────────────────

  private cacheKey(imagePath: string): string {
    const slug = imagePath.split('/').pop() ?? imagePath;
    return `${CACHE_PREFIX}${slug}`;
  }

  private getCached(imagePath: string): FacePercent | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.cacheKey(imagePath));
      return raw ? (JSON.parse(raw) as FacePercent) : null;
    } catch {
      return null;
    }
  }

  private setCached(imagePath: string, value: FacePercent): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.cacheKey(imagePath), JSON.stringify(value));
    } catch { /* quota — ignore */ }
  }

  // ─── Gemini Vision API call ───────────────────────────────────────────────

  /**
   * Returns the face center as percentages of the original image dimensions.
   * Results are cached in localStorage so each photo is only analysed once.
   */
  async detectFacePercent(imagePath: string): Promise<FacePercent> {
    const cached = this.getCached(imagePath);
    if (cached) return cached;

    // Dedup: if a request for this path is already in-flight, share it
    const existing = inFlight.get(imagePath);
    if (existing) return existing;

    const promise = (async (): Promise<FacePercent> => {
      try {
        const res = await fetch('/api/face-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagePath }),
        });
        if (!res.ok) throw new Error(`face-detect HTTP ${res.status}`);
        const data = await res.json() as FacePercent;
        // Ensure zoom is always present (handles old cached responses without it)
        if (!data.zoom) data.zoom = 1.0;
        this.setCached(imagePath, data);
        return data;
      } catch (err) {
        console.warn('[FaceDetection] Gemini call failed, using heuristic:', err);
        const fallback: FacePercent = { faceX: 50, faceY: 18, zoom: 1.0 };
        this.setCached(imagePath, fallback);
        return fallback;
      } finally {
        inFlight.delete(imagePath);
      }
    })();

    inFlight.set(imagePath, promise);
    return promise;
  }
}

export const faceDetection = FaceDetectionService.getInstance();
export type { FacePercent as FaceDetectionResult };
