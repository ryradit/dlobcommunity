const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../public/images/rail');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function processJerseyPair(srcFile, prefix, options = {}) {
  console.log('Processing:', srcFile);
  const image = sharp(srcFile);
  const meta = await image.metadata();

  let baseSharp = image;
  if (meta.width > 2000) {
    baseSharp = image.resize({ width: 1000 });
  }

  const { data, info } = await baseSharp.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Flood fill outside background from all 4 corners
  const isBgVisited = new Uint8Array(width * height);
  const queue = [0, width - 1, (height - 1) * width, width * height - 1];
  for (const q of queue) isBgVisited[q] = 1;

  const r0 = data[0], g0 = data[1], b0 = data[2];
  const tol = options.tolerance || 30;

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const x = curr % width;
    const y = Math.floor(curr / width);

    const neighbors = [
      [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nidx = ny * width + nx;
        if (!isBgVisited[nidx]) {
          const pidx = nidx * channels;
          const dr = data[pidx] - r0;
          const dg = data[pidx + 1] - g0;
          const db = data[pidx + 2] - b0;
          if (Math.sqrt(dr * dr + dg * dg + db * db) < tol) {
            isBgVisited[nidx] = 1;
            queue.push(nidx);
          }
        }
      }
    }
  }

  // Build RGBA buffer with transparent background
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const sidx = i * channels;
    const didx = i * 4;
    rgba[didx] = data[sidx];
    rgba[didx + 1] = data[sidx + 1];
    rgba[didx + 2] = data[sidx + 2];
    rgba[didx + 3] = isBgVisited[i] ? 0 : 255;
  }

  // Split into left (front) and right (back)
  const midX = Math.floor(width / 2);

  const frontRawPng = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .extract({ left: 0, top: 0, width: midX, height })
    .png()
    .toBuffer();
  const frontBuf = await sharp(frontRawPng).trim().toBuffer();

  const backRawPng = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .extract({ left: midX, top: 0, width: width - midX, height })
    .png()
    .toBuffer();
  const backBuf = await sharp(backRawPng).trim().toBuffer();

  // Target canvas: 400 x 620
  const CANVAS_W = 400;
  const CANVAS_H = 620;
  const TARGET_JERSEY_W = 345;
  const TOP_OFFSET = 36;

  // Composite Front
  const frontResized = await sharp(frontBuf).resize({ width: TARGET_JERSEY_W, fit: 'inside' }).toBuffer({ resolveWithObject: true });
  const frontLeft = Math.floor((CANVAS_W - frontResized.info.width) / 2);

  await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: frontResized.data, left: frontLeft, top: TOP_OFFSET }])
    .png()
    .toFile(path.join(OUT_DIR, prefix + '-front.png'));

  // Composite Back
  const backResized = await sharp(backBuf).resize({ width: TARGET_JERSEY_W, fit: 'inside' }).toBuffer({ resolveWithObject: true });
  const backLeft = Math.floor((CANVAS_W - backResized.info.width) / 2);

  await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: backResized.data, left: backLeft, top: TOP_OFFSET }])
    .png()
    .toFile(path.join(OUT_DIR, prefix + '-back.png'));

  console.log('Saved:', prefix + '-front.png', prefix + '-back.png');
}

// Generate red jersey from Biru by remapping blue fabric pixels to DLOB Red (#c8102e)
async function generateRedFromBiru() {
  console.log('Generating Red Jersey from Official Navy...');
  const frontPath = path.join(OUT_DIR, 'jersey-official-biru-front.png');
  const backPath = path.join(OUT_DIR, 'jersey-official-biru-back.png');

  for (const [srcFile, outFile] of [[frontPath, 'jersey-official-merah-front.png'], [backPath, 'jersey-official-merah-back.png']]) {
    const { data, info } = await sharp(srcFile).raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    const out = Buffer.alloc(data.length);

    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a === 0) {
        out[idx] = 0; out[idx+1] = 0; out[idx+2] = 0; out[idx+3] = 0;
        continue;
      }

      // Check if it's the blue body fabric (blue is predominant or r, g are low while b is high)
      const isBlueFabric = (b > r + 15 || (b > 60 && r < 100 && g < 100));
      const isWhiteTextOrLogo = (r > 200 && g > 200 && b > 200);
      const isGoldTrim = (r > 130 && g > 90 && b < 70);

      if (isWhiteTextOrLogo || isGoldTrim) {
        // Keep white text/logos and gold trim
        out[idx] = r;
        out[idx + 1] = g;
        out[idx + 2] = b;
        out[idx + 3] = a;
      } else if (isBlueFabric) {
        // Remap to DLOB Red (#c8102e = 200, 16, 46) preserving lightness/shading
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 120;
        out[idx] = Math.min(255, Math.round(200 * lum));
        out[idx + 1] = Math.min(255, Math.round(18 * lum));
        out[idx + 2] = Math.min(255, Math.round(42 * lum));
        out[idx + 3] = a;
      } else {
        out[idx] = r;
        out[idx + 1] = g;
        out[idx + 2] = b;
        out[idx + 3] = a;
      }
    }

    await sharp(out, { raw: { width, height, channels: 4 } })
      .png()
      .toFile(path.join(OUT_DIR, outFile));
    console.log('Saved:', outFile);
  }
}

async function main() {
  await processJerseyPair(path.join(__dirname, '../public/images/jersey/Jersey Dlob Biru.png'), 'jersey-official-biru');
  await processJerseyPair(path.join(__dirname, '../public/images/jersey/Jersey Dlob Yellow.png'), 'jersey-official-kuning');
  await processJerseyPair(path.join(__dirname, '../public/images/jersey/Jersey Dlob Pink.png'), 'jersey-official-pink');
  await processJerseyPair(path.join(__dirname, '../public/images/jersey/Jersey Dlob Balen.png'), 'jersey-noir');
  await generateRedFromBiru();
  console.log('All rail jerseys generated successfully!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
