const fs = require('fs');
const sharp = require('sharp');

async function run() {
  const fileId = '1Ra1nWHr_srX1LLud7hC9d556BNcCkHE3';
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  console.log(`Downloading original image from Google Drive...`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Failed to download image from Drive');
    return;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`Downloaded image. Size: ${buffer.length} bytes`);

  const metadata = await sharp(buffer).metadata();
  console.log(`Image size: ${metadata.width}x${metadata.height}`);

  // Face #0: {"left":0.7296,"top":0.3366,"right":0.8569,"bottom":0.4473}
  const crop0 = {
    left: Math.round(0.7296 * metadata.width),
    top: Math.round(0.3366 * metadata.height),
    width: Math.round((0.8569 - 0.7296) * metadata.width),
    height: Math.round((0.4473 - 0.3366) * metadata.height),
  };

  // Face #1: {"left":0.4789,"top":0.3740,"right":0.6688,"bottom":0.5394}
  const crop1 = {
    left: Math.round(0.4789 * metadata.width),
    top: Math.round(0.3740 * metadata.height),
    width: Math.round((0.6688 - 0.4789) * metadata.width),
    height: Math.round((0.5394 - 0.3740) * metadata.height),
  };

  console.log('Cropping Face #0:', crop0);
  await sharp(buffer)
    .extract(crop0)
    .toFile('/Users/ryanradityatama/Documents/dlobcommunity-deploy-optimizations/face0.jpg');
  console.log('Saved face0.jpg');

  console.log('Cropping Face #1:', crop1);
  await sharp(buffer)
    .extract(crop1)
    .toFile('/Users/ryanradityatama/Documents/dlobcommunity-deploy-optimizations/face1.jpg');
  console.log('Saved face1.jpg');
}

run().catch(console.error);
