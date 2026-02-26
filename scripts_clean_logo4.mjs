import sharp from 'sharp';

const input = 'src/media/logo4.png';
const output = 'src/media/logo4_clean.png';

const target = { r: 58, g: 104, b: 197 };
const tolerance = 55;

const image = sharp(input).ensureAlpha();
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const dr = Math.abs(r - target.r);
  const dg = Math.abs(g - target.g);
  const db = Math.abs(b - target.b);

  if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
    data[i + 3] = 0;
  }
}

let minX = info.width;
let minY = info.height;
let maxX = 0;
let maxY = 0;
let hasOpaque = false;

for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const idx = (y * info.width + x) * 4;
    if (data[idx + 3] > 0) {
      hasOpaque = true;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

if (!hasOpaque) {
  throw new Error('No opaque pixels found after background removal.');
}

const margin = 8;
const left = Math.max(0, minX - margin);
const top = Math.max(0, minY - margin);
const right = Math.min(info.width - 1, maxX + margin);
const bottom = Math.min(info.height - 1, maxY + margin);
const width = right - left + 1;
const height = bottom - top + 1;

await sharp(data, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
})
  .extract({ left, top, width, height })
  .png()
  .toFile(output);

console.log(`Created ${output} (${width}x${height})`);
