import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const PROMPT = `You are analyzing a sports/badminton member photo that will be displayed in a small square thumbnail card.
Find the person's FACE (specifically the eyes/nose area, not the top of the head).
Then decide how much to zoom in so the face is comfortably visible in the thumbnail.

Return ONLY valid JSON with no markdown fences or extra text:
{"faceX": <number>, "faceY": <number>, "zoom": <number>}

- faceX: horizontal center of the face as % (0-100) of image width
- faceY: vertical center of the face as % (0-100) of image height
- zoom: thumbnail zoom factor — choose the correct category:
  * 1.0 = CLOSE-UP: face/head or upper-body fills most of the image (no zoom needed)
  * 1.2 = MEDIUM: half-body shot, face clearly visible but with some empty space
  * 1.4 = FULL-BODY NEAR: full-body standing, person takes up most of the image height
  * 1.7 = FULL-BODY FAR: full-body standing but with noticeable empty space above/below
  * 2.0 = VERY FAR: person is small in the frame, face is a tiny fraction of the image

IMPORTANT: If the face already fills a large portion of the image, return zoom 1.0 — do NOT add unnecessary zoom.
If no face is visible, return {"faceX": 50, "faceY": 18, "zoom": 1.0}.`;

export async function POST(req: NextRequest) {
  try {
    const { imagePath } = await req.json() as { imagePath: string };

    if (!imagePath || typeof imagePath !== 'string') {
      return NextResponse.json({ faceX: 50, faceY: 18 });
    }

    // Security: only allow paths inside /public/images/members/
    const normalised = imagePath.replace(/\\/g, '/');
    if (!normalised.startsWith('/images/members/')) {
      return NextResponse.json({ faceX: 50, faceY: 18 });
    }

    const filePath = path.join(process.cwd(), 'public', normalised);
    if (!existsSync(filePath)) {
      return NextResponse.json({ faceX: 50, faceY: 18 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    const imageBuffer = readFileSync(filePath);
    const base64 = imageBuffer.toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      PROMPT,
      { inlineData: { data: base64, mimeType } },
    ]);

    const raw = result.response.text().trim();
    // Strip markdown fences if Gemini adds them despite the instruction
    const cleaned = raw.replace(/```(?:json)?\n?/g, '').replace(/\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned) as { faceX: number; faceY: number; zoom?: number };

    const faceX = Math.max(0, Math.min(100, Number(parsed.faceX) || 50));
    const faceY = Math.max(0, Math.min(100, Number(parsed.faceY) || 18));
    const zoom  = Math.max(1.0, Math.min(2.5, Number(parsed.zoom) || 1.3));

    return NextResponse.json({ faceX, faceY, zoom });
  } catch (err) {
    console.error('[face-detect] error:', err);
    return NextResponse.json({ faceX: 50, faceY: 18 });
  }
}
