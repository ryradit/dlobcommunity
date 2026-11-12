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

// Generate red jersey with authentic design matching the official DLOB Red Jersey:
// - Top chest & shoulders: Vibrant Athletic Red
// - White chevron emblem on left chest
// - Middle band: Crisp White with black d'lob logo & black border lines
// - Lower half: Authentic dark charcoal leaf pattern
async function generateRedFromBiru() {
  console.log('Generating Authentic Red Jersey (Red top, White mid band with black d\'lob, Dark leaf bottom)...');
  const srcFile = path.join(__dirname, '../public/images/jersey/Jersey Dlob Biru.png');
  const image = sharp(srcFile);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Flood fill outside background from all 4 corners
  const isBgVisited = new Uint8Array(width * height);
  const queue = [0, width - 1, (height - 1) * width, width * height - 1];
  for (const q of queue) isBgVisited[q] = 1;
  const r0 = data[0], g0 = data[1], b0 = data[2];

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const x = curr % width;
    const y = Math.floor(curr / width);
    const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nidx = ny * width + nx;
        if (!isBgVisited[nidx]) {
          const pidx = nidx * channels;
          const dr = data[pidx] - r0;
          const dg = data[pidx + 1] - g0;
          const db = data[pidx + 2] - b0;
          if (Math.sqrt(dr * dr + dg * dg + db * db) < 30) {
            isBgVisited[nidx] = 1;
            queue.push(nidx);
          }
        }
      }
    }
  }

  const out = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const sidx = idx * channels;
      const didx = idx * 4;

      if (isBgVisited[idx]) {
        out[didx] = 0; out[didx + 1] = 0; out[didx + 2] = 0; out[didx + 3] = 0;
        continue;
      }

      const r = data[sidx];
      const g = data[sidx + 1];
      const b = data[sidx + 2];

      // Middle band: y between 256 and 348
      if (y >= 256 && y <= 348) {
        const isBlackText = (r < 60 && g < 60 && b < 60);
        if (isBlackText) {
          out[didx] = 12; out[didx + 1] = 12; out[didx + 2] = 14; out[didx + 3] = 255;
        } else {
          // White band background
          out[didx] = 250; out[didx + 1] = 250; out[didx + 2] = 252; out[didx + 3] = 255;
        }
      } else if (y < 256) {
        // Upper chest / shoulders / collar / sleeves
        const isCollarRib = (Math.abs(r - g) < 15 && Math.abs(r - b) < 15 && y < 165 && ((x > 220 && x < 360) || (x > 650 && x < 790)));
        if (isCollarRib) {
          out[didx] = r; out[didx + 1] = g; out[didx + 2] = b; out[didx + 3] = 255;
        } else {
          // Remap blue fabric to vibrant DLOB red
          const lum = Math.max(0.35, (0.299 * r + 0.587 * g + 0.114 * b) / 55);
          out[didx] = Math.min(255, Math.round(222 * Math.pow(lum, 0.75)));
          out[didx + 1] = Math.min(255, Math.round(24 * Math.pow(lum, 0.75)));
          out[didx + 2] = Math.min(255, Math.round(34 * Math.pow(lum, 0.75)));
          out[didx + 3] = 255;
        }
      } else {
        // Lower abdomen / hem: keep authentic dark leaf pattern
        out[didx] = r; out[didx + 1] = g; out[didx + 2] = b; out[didx + 3] = 255;
      }
    }
  }

  // Draw white chevron '>' emblem on left chest
  for (let dy = -10; dy <= 10; dy++) {
    const cx = 352 + (10 - Math.abs(dy)) * 0.9;
    const cy = 202 + dy;
    for (let dx = -3; dx <= 3; dx++) {
      const px = Math.round(cx + dx);
      const py = Math.round(cy);
      const pidx = (py * width + px) * 4;
      out[pidx] = 255; out[pidx + 1] = 255; out[pidx + 2] = 255; out[pidx + 3] = 255;
    }
  }

  // Thin black borders framing the white band
  for (let x = 0; x < width; x++) {
    for (const by of [255, 256, 348, 349]) {
      const pidx = (by * width + x) * 4;
      if (out[pidx + 3] > 0) {
        out[pidx] = 18; out[pidx + 1] = 18; out[pidx + 2] = 20;
      }
    }
  }

  const midX = Math.floor(width / 2);
  const frontRawPng = await sharp(out, { raw: { width, height, channels: 4 } })
    .extract({ left: 0, top: 0, width: midX, height })
    .png()
    .toBuffer();
  const frontBuf = await sharp(frontRawPng).trim().toBuffer();

  const backRawPng = await sharp(out, { raw: { width, height, channels: 4 } })
    .extract({ left: midX, top: 0, width: width - midX, height })
    .png()
    .toBuffer();
  const backBuf = await sharp(backRawPng).trim().toBuffer();

  const CANVAS_W = 400;
  const CANVAS_H = 620;
  const TARGET_JERSEY_W = 345;
  const TOP_OFFSET = 36;

  const frontResized = await sharp(frontBuf).resize({ width: TARGET_JERSEY_W, fit: 'inside' }).toBuffer({ resolveWithObject: true });
  const frontLeft = Math.floor((CANVAS_W - frontResized.info.width) / 2);

  await sharp({
    create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: frontResized.data, left: frontLeft, top: TOP_OFFSET }])
    .png()
    .toFile(path.join(OUT_DIR, 'jersey-official-merah-front.png'));

  const backResized = await sharp(backBuf).resize({ width: TARGET_JERSEY_W, fit: 'inside' }).toBuffer({ resolveWithObject: true });
  const backLeft = Math.floor((CANVAS_W - backResized.info.width) / 2);

  await sharp({
    create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: backResized.data, left: backLeft, top: TOP_OFFSET }])
    .png()
    .toFile(path.join(OUT_DIR, 'jersey-official-merah-back.png'));

  console.log('Saved authentic red jersey front and back successfully!');
}

async function generateSteelBlueNoir() {
  console.log('Generating DLOB Jersey Noir (Steel Blue Night edition)...');
  const frontIn = path.join(OUT_DIR, 'jersey-noir-front.png');
  const backIn = path.join(OUT_DIR, 'jersey-noir-back.png');

  for (const [inFile, outFile] of [[frontIn, 'jersey-noir-steel-blue-front.png'], [backIn, 'jersey-noir-steel-blue-back.png']]) {
    const { data, info } = await sharp(inFile).raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    const out = Buffer.alloc(data.length);

    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
      if (a === 0) {
        out[idx] = 0; out[idx + 1] = 0; out[idx + 2] = 0; out[idx + 3] = 0;
        continue;
      }

      const isCircuitOrLogo = (r > 60 || g > 60 || b > 60);
      if (isCircuitOrLogo) {
        // Brighten circuit/typography lines with electric cyan/ice-steel tint
        out[idx] = Math.min(255, Math.round(r * 0.7 + 56 * 0.3));
        out[idx + 1] = Math.min(255, Math.round(g * 0.85 + 189 * 0.35));
        out[idx + 2] = Math.min(255, Math.round(b * 0.7 + 248 * 0.45));
        out[idx + 3] = a;
      } else {
        // Base dark fabric: tint into rich Steel Blue Night (#1e2d40 = 30, 45, 64)
        const lum = Math.max(0.4, (r + g + b) / 36);
        out[idx] = Math.min(255, Math.round(24 * lum));
        out[idx + 1] = Math.min(255, Math.round(40 * lum));
        out[idx + 2] = Math.min(255, Math.round(62 * lum));
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
  await generateSteelBlueNoir();
  console.log('All rail jerseys generated successfully!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
