import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("public", { recursive: true });

async function gen(size, out) {
  const svg = `
  <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="${size*0.18}" fill="#2e7d32"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
      font-family="system-ui, sans-serif" font-size="${size*0.42}" font-weight="800" fill="white">O</text>
    <text x="50%" y="78%" dominant-baseline="middle" text-anchor="middle"
      font-family="system-ui, sans-serif" font-size="${size*0.09}" font-weight="600" fill="white" letter-spacing="${size*0.01}">oseille</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`wrote ${out} ${size}x${size}`);
}

await gen(192, "public/pwa-192x192.png");
await gen(512, "public/pwa-512x512.png");
// also apple touch
await gen(180, "public/apple-touch-icon.png");
console.log("done");
