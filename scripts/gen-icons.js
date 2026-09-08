// 生成 tabBar 图标与地图标记 PNG（零依赖，纯 Node）
// 用法：node scripts/gen-icons.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const SIZE = 128; // 输出尺寸
const SS = 4;     // 超采样倍数（抗锯齿）
const W = SIZE * SS;

/* ---------- PNG 编码 ---------- */
function crc32(buf) {
  if (!crc32.table) {
    crc32.table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crc32.table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crc32.table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(rgba, w, h) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- 画布（预乘 alpha 浮点） ---------- */
function makeCanvas(w, h) {
  return { w, h, data: new Float64Array(w * h * 4) };
}
function setPx(cv, x, y, c) {
  if (x < 0 || y < 0 || x >= cv.w || y >= cv.h) return;
  const i = (y * cv.w + x) * 4;
  cv.data[i] = c[0] * c[3];
  cv.data[i + 1] = c[1] * c[3];
  cv.data[i + 2] = c[2] * c[3];
  cv.data[i + 3] = c[3];
}

// 以下坐标均为 128 设计稿单位
function fillRect(cv, s, x0, y0, x1, y1, c) {
  for (let y = Math.max(0, Math.round(y0 * s)); y < Math.min(cv.h, Math.round(y1 * s)); y++)
    for (let x = Math.max(0, Math.round(x0 * s)); x < Math.min(cv.w, Math.round(x1 * s)); x++)
      setPx(cv, x, y, c);
}
function fillRoundRect(cv, s, x0, y0, x1, y1, r, c) {
  const R = r * s;
  const X0 = x0 * s, Y0 = y0 * s, X1 = x1 * s, Y1 = y1 * s;
  for (let y = Math.max(0, Math.floor(Y0 - R)); y < Math.min(cv.h, Math.ceil(Y1 + R)); y++) {
    for (let x = Math.max(0, Math.floor(X0 - R)); x < Math.min(cv.w, Math.ceil(X1 + R)); x++) {
      const px = x + 0.5, py = y + 0.5;
      const cx = Math.min(Math.max(px, X0 + R), X1 - R);
      const cy = Math.min(Math.max(py, Y0 + R), Y1 - R);
      const dx = px - cx, dy = py - cy;
      if (dx * dx + dy * dy <= R * R) setPx(cv, x, y, c);
    }
  }
}
function fillCircle(cv, s, cx, cy, r, c) {
  const C = cx * s, Cy = cy * s, R = r * s;
  for (let y = Math.max(0, Math.floor(Cy - R)); y < Math.min(cv.h, Math.ceil(Cy + R)); y++)
    for (let x = Math.max(0, Math.floor(C - R)); x < Math.min(cv.w, Math.ceil(C + R)); x++) {
      const dx = x + 0.5 - C, dy = y + 0.5 - Cy;
      if (dx * dx + dy * dy <= R * R) setPx(cv, x, y, c);
    }
}
function fillTriangle(cv, s, p1, p2, p3, c) {
  const A = p1.map(v => v * s), B = p2.map(v => v * s), C = p3.map(v => v * s);
  const minx = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0])));
  const maxx = Math.min(cv.w, Math.ceil(Math.max(A[0], B[0], C[0])));
  const miny = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1])));
  const maxy = Math.min(cv.h, Math.ceil(Math.max(A[1], B[1], C[1])));
  const sign = (a, b, c2) => (a[0] - c2[0]) * (b[1] - c2[1]) - (b[0] - c2[0]) * (a[1] - c2[1]);
  for (let y = miny; y < maxy; y++) {
    for (let x = minx; x < maxx; x++) {
      const p = [x + 0.5, y + 0.5];
      const d1 = sign(p, A, B), d2 = sign(p, B, C), d3 = sign(p, C, A);
      const neg = d1 < 0 || d2 < 0 || d3 < 0;
      const pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos)) setPx(cv, x, y, c);
    }
  }
}

function downsample(cv, size) {
  const out = Buffer.alloc(size * size * 4);
  const f = cv.w / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < f; sy++) {
        for (let sx = 0; sx < f; sx++) {
          const i = ((y * f + sy) * cv.w + (x * f + sx)) * 4;
          r += cv.data[i]; g += cv.data[i + 1]; b += cv.data[i + 2]; a += cv.data[i + 3];
        }
      }
      const n = f * f;
      const aa = a / n;
      let rr = r / n, gg = g / n, bb = b / n;
      if (aa > 0) { rr /= aa; gg /= aa; bb /= aa; }
      const cl = v => Math.max(0, Math.min(1, v));
      const idx = (y * size + x) * 4;
      out[idx] = Math.round(cl(rr) * 255);
      out[idx + 1] = Math.round(cl(gg) * 255);
      out[idx + 2] = Math.round(cl(bb) * 255);
      out[idx + 3] = Math.round(cl(aa) * 255);
    }
  }
  return out;
}

/* ---------- 颜色 ---------- */
const hex = (h) => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
  1
];
const GRAY = hex('#8a93a1');
const GREEN = hex('#00b578');
const CLEAR = [0, 0, 0, 0];

/* ---------- 图标绘制（128 设计稿） ---------- */
function drawHome(cv, s, col) {
  fillTriangle(cv, s, [8, 62], [64, 12], [120, 62], col);
  fillRoundRect(cv, s, 24, 54, 104, 116, 10, col);
  fillRect(cv, s, 53, 84, 75, 116, CLEAR); // 门
}
function drawBooking(cv, s, col) {
  fillRoundRect(cv, s, 30, 8, 52, 28, 6, col);
  fillRoundRect(cv, s, 76, 8, 98, 28, 6, col);
  fillRoundRect(cv, s, 14, 18, 114, 116, 14, col);
  fillRect(cv, s, 14, 44, 114, 52, CLEAR);
  const xs = [[28, 44], [56, 72], [84, 100]];
  const ys = [[64, 78], [90, 104]];
  for (const [x0, x1] of xs) for (const [y0, y1] of ys) fillRect(cv, s, x0, y0, x1, y1, CLEAR);
}
function drawOrders(cv, s, col) {
  fillRoundRect(cv, s, 24, 12, 104, 116, 12, col);
  fillRect(cv, s, 42, 36, 86, 46, CLEAR);
  fillRect(cv, s, 42, 60, 86, 70, CLEAR);
  fillRect(cv, s, 42, 84, 70, 94, CLEAR);
}
function drawProfile(cv, s, col) {
  fillCircle(cv, s, 64, 42, 22, col);
  fillRoundRect(cv, s, 26, 74, 102, 122, 26, col);
}
function drawPin(cv, s, col) {
  fillTriangle(cv, s, [36, 66], [92, 66], [64, 118], col);
  fillCircle(cv, s, 64, 44, 34, col);
  fillCircle(cv, s, 64, 44, 15, CLEAR);
}

const draws = { home: drawHome, booking: drawBooking, orders: drawOrders, profile: drawProfile };

const outDir = path.join(__dirname, '..', 'images');
fs.mkdirSync(outDir, { recursive: true });

for (const name of Object.keys(draws)) {
  for (const [suffix, col] of [['', GRAY], ['-active', GREEN]]) {
    const cv = makeCanvas(W, W);
    draws[name](cv, SS, col);
    fs.writeFileSync(path.join(outDir, `tab-${name}${suffix}.png`), encodePNG(downsample(cv, SIZE), SIZE, SIZE));
  }
}
{
  const cv = makeCanvas(W, W);
  drawPin(cv, SS, GREEN);
  fs.writeFileSync(path.join(outDir, 'pin.png'), encodePNG(downsample(cv, SIZE), SIZE, SIZE));
}

console.log('icons generated to', outDir);
