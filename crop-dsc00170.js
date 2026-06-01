const fs = require('fs');
const sharp = require('sharp');

async function run() {
  const fileId = '1ZasdsKqyIjU4vID18OnWlM-d4fjqWv6s'; // DSC00170.JPG
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  console.log(`Downloading DSC00170.JPG from Google Drive...`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Failed to download image');
    return;
  }
  const buffer = Buffer.from(await res.arrayBuffer());

  const metadata = await sharp(buffer).metadata();
  console.log(`Image size: ${metadata.width}x${metadata.height}`);

  const crop = {
    left: Math.round(0.3440 * metadata.width),
    top: Math.round(0.3759 * metadata.height),
    width: Math.round((0.3892 - 0.3440) * metadata.width),
    height: Math.round((0.4333 - 0.3759) * metadata.height),
  };

  console.log('Cropping Face:', crop);
  await sharp(buffer)
    .extract(crop)
    .toFile('/Users/ryanradityatama/Documents/dlobcommunity-deploy-optimizations/face_dsc00170.jpg');
  console.log('Saved face_dsc00170.jpg');
}

run().catch(console.error);
