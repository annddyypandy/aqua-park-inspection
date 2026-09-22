import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const BG = [6, 38, 46];
const WATER = [13, 61, 72];
const YELLOW = [240, 201, 74];
const LINE = [244, 247, 245];

function crc32(buffer) {
  let crc = ~0;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i] ?? 0;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crcSource = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcSource));
  return Buffer.concat([length, crcSource, crc]);
}

function createPng(size, paint) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  const stride = size * 3;
  const raw = Buffer.alloc((stride + 1) * size);

  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = paint(x, y, size);
      const offset = y * (stride + 1) + 1 + x * 3;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function inRect(nx, ny, x, y, width, height) {
  return nx >= x && nx < x + width && ny >= y && ny < y + height;
}

function inTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const v0x = cx - ax;
  const v0y = cy - ay;
  const v1x = bx - ax;
  const v1y = by - ay;
  const v2x = px - ax;
  const v2y = py - ay;
  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;
  const denom = dot00 * dot11 - dot01 * dot01;
  if (denom === 0) {
    return false;
  }
  const u = (dot11 * dot02 - dot01 * dot12) / denom;
  const v = (dot00 * dot12 - dot01 * dot02) / denom;
  return u >= 0 && v >= 0 && u + v <= 1;
}

function tinyWeightsPaint(x, y, size, inset = 0) {
  const inner = size * (1 - 2 * inset);
  const origin = size * inset;
  const nx = ((x + 0.5 - origin) / inner) * 100;
  const ny = ((y + 0.5 - origin) / inner) * 100;
  const waterY = origin + (52 / 100) * inner;

  if (nx < 0 || ny < 0 || nx > 100 || ny > 100) {
    return y + 0.5 >= waterY ? WATER : BG;
  }

  const lineWidth = Math.max(3.5, 100 / size);

  if (inRect(nx, ny, 29, 92, 10, 8) || inRect(nx, ny, 61, 92, 10, 8)) {
    return YELLOW;
  }
  if (
    inRect(nx, ny, 32 - (lineWidth - 3.5) / 2, 54, lineWidth, 38) ||
    inRect(nx, ny, 64.5 - (lineWidth - 3.5) / 2, 54, lineWidth, 38)
  ) {
    return LINE;
  }
  if (inRect(nx, ny, 14, 51, 72, 3)) {
    return LINE;
  }
  if (inTriangle(nx, ny, 50, 12, 78, 52, 22, 52)) {
    return YELLOW;
  }
  if (ny >= 52) {
    return WATER;
  }
  return BG;
}

function pngToIco(png, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header[6] = size === 256 ? 0 : size;
  header[7] = size === 256 ? 0 : size;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(publicDir, { recursive: true });

const png192 = createPng(192, (x, y, size) => tinyWeightsPaint(x, y, size));
const png512 = createPng(512, (x, y, size) => tinyWeightsPaint(x, y, size));
const pngMaskable = createPng(512, (x, y, size) => tinyWeightsPaint(x, y, size, 0.12));
const png180 = createPng(180, (x, y, size) => tinyWeightsPaint(x, y, size));
const png32 = createPng(32, (x, y, size) => tinyWeightsPaint(x, y, size));

writeFileSync(join(publicDir, 'pwa-192x192.png'), png192);
writeFileSync(join(publicDir, 'pwa-512x512.png'), png512);
writeFileSync(join(publicDir, 'pwa-512x512-maskable.png'), pngMaskable);
writeFileSync(join(publicDir, 'apple-touch-icon.png'), png180);
writeFileSync(join(publicDir, 'favicon.ico'), pngToIco(png32, 32));
writeFileSync(
  join(publicDir, 'app-icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#06262e"/>
  <rect x="0" y="52" width="100" height="48" fill="#0d3d48"/>
  <polygon points="50,12 78,52 22,52" fill="#f0c94a"/>
  <rect x="14" y="51" width="72" height="3" fill="#f4f7f5"/>
  <rect x="32" y="54" width="3.5" height="38" fill="#f4f7f5"/>
  <rect x="64.5" y="54" width="3.5" height="38" fill="#f4f7f5"/>
  <rect x="29" y="92" width="10" height="8" fill="#f0c94a"/>
  <rect x="61" y="92" width="10" height="8" fill="#f0c94a"/>
</svg>
`,
);
