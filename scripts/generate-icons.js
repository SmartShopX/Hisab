import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal PNG generator in pure Node with zlib
function createSolidPng(width, height, r, g, b, a = 255) {
  // Each scanline starts with filter byte 0
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    rawData[rowStart] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 4;
      // Let's create an emerald background with rounded corner effect and center gold accent
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isCenter = dist < width * 0.25;

      if (isCenter) {
        rawData[pixelStart] = 250;     // R (Gold)
        rawData[pixelStart + 1] = 204; // G
        rawData[pixelStart + 2] = 21;  // B
        rawData[pixelStart + 3] = 255; // A
      } else {
        rawData[pixelStart] = r;
        rawData[pixelStart + 1] = g;
        rawData[pixelStart + 2] = b;
        rawData[pixelStart + 3] = a;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression: Deflate
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace: None

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 implementation
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return crc ^ -1;
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write 192x192, 512x512, apple-touch-icon, and maskable
const png192 = createSolidPng(192, 192, 5, 150, 105, 255);
const png512 = createSolidPng(512, 512, 5, 150, 105, 255);
const apple180 = createSolidPng(180, 180, 5, 150, 105, 255);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), apple180);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png192);

console.log('Successfully generated PWA icon assets in public directory!');
