const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const OUT = path.resolve(__dirname, '..', 'assets');

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function blend(png, x, y, color, alpha) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height || alpha <= 0) return;
  const i = (Math.floor(y) * png.width + Math.floor(x)) * 4;
  const a = clamp(alpha);
  const ia = 1 - a;
  png.data[i] = Math.round(color.r * a + png.data[i] * ia);
  png.data[i + 1] = Math.round(color.g * a + png.data[i + 1] * ia);
  png.data[i + 2] = Math.round(color.b * a + png.data[i + 2] * ia);
  png.data[i + 3] = Math.round((a + (png.data[i + 3] / 255) * ia) * 255);
}

function fillBackground(png) {
  const base = hexToRgb('#020100');
  const warm = hexToRgb('#d7a23b');
  const cx = png.width / 2;
  const cy = png.height / 2;
  const maxR = png.width * 0.72;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const i = (y * png.width + x) * 4;
      const d = Math.hypot(x - cx, y - cy);
      const glow = clamp(1 - d / maxR);
      const vignette = clamp(d / (png.width * 0.64));
      const warmA = glow * glow * 0.28;
      png.data[i] = Math.round(base.r * (1 - warmA) + warm.r * warmA);
      png.data[i + 1] = Math.round(base.g * (1 - warmA) + warm.g * warmA);
      png.data[i + 2] = Math.round(base.b * (1 - warmA) + warm.b * warmA);
      png.data[i] = Math.round(png.data[i] * (1 - vignette * 0.28));
      png.data[i + 1] = Math.round(png.data[i + 1] * (1 - vignette * 0.28));
      png.data[i + 2] = Math.round(png.data[i + 2] * (1 - vignette * 0.28));
      png.data[i + 3] = 255;
    }
  }
}

function radialGlow(png, cx, cy, radius, color, maxAlpha) {
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(png.width - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(png.height - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const d = Math.hypot(x - cx, y - cy);
      const t = clamp(1 - d / radius);
      blend(png, x, y, color, maxAlpha * t * t);
    }
  }
}

function strokeCircle(png, cx, cy, r, width, color, alpha) {
  const pad = width + 2;
  const x0 = Math.max(0, Math.floor(cx - r - pad));
  const x1 = Math.min(png.width - 1, Math.ceil(cx + r + pad));
  const y0 = Math.max(0, Math.floor(cy - r - pad));
  const y1 = Math.min(png.height - 1, Math.ceil(cy + r + pad));
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const d = Math.abs(Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - r);
      const a = clamp(width / 2 + 1 - d);
      blend(png, x, y, color, alpha * a);
    }
  }
}

function fillCircle(png, cx, cy, r, color, alpha) {
  const x0 = Math.max(0, Math.floor(cx - r - 1));
  const x1 = Math.min(png.width - 1, Math.ceil(cx + r + 1));
  const y0 = Math.max(0, Math.floor(cy - r - 1));
  const y1 = Math.min(png.height - 1, Math.ceil(cy + r + 1));
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      blend(png, x, y, color, alpha * clamp(r + 1 - d));
    }
  }
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : clamp(((px - ax) * dx + (py - ay) * dy) / len2);
  const x = ax + t * dx;
  const y = ay + t * dy;
  return Math.hypot(px - x, py - y);
}

function strokeLine(png, ax, ay, bx, by, width, color, alpha) {
  const pad = width + 2;
  const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - pad));
  const x1 = Math.min(png.width - 1, Math.ceil(Math.max(ax, bx) + pad));
  const y0 = Math.max(0, Math.floor(Math.min(ay, by) - pad));
  const y1 = Math.min(png.height - 1, Math.ceil(Math.max(ay, by) + pad));
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const d = distToSegment(x + 0.5, y + 0.5, ax, ay, bx, by);
      blend(png, x, y, color, alpha * clamp(width / 2 + 1 - d));
    }
  }
}

function strokePolygon(png, points, width, color, alpha) {
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    strokeLine(png, a[0], a[1], b[0], b[1], width, color, alpha);
  }
}

function emblemPoint(cx, cy, size, x, y) {
  return [cx + (x - 24) * (size / 48), cy + (y - 24) * (size / 48)];
}

function drawEmblem(png, cx, cy, size, options = {}) {
  const gold = hexToRgb(options.color || '#f6d27a');
  const glow = hexToRgb('#e9b850');
  const scale = size / 48;
  radialGlow(png, cx, cy, size * 0.52, glow, options.glowAlpha ?? 0.18);
  strokeCircle(png, cx, cy, 21 * scale, 1.2 * scale, gold, 0.55);
  strokePolygon(
    png,
    [
      emblemPoint(cx, cy, size, 24, 7),
      emblemPoint(cx, cy, size, 38, 32),
      emblemPoint(cx, cy, size, 10, 32),
    ],
    1.2 * scale,
    gold,
    1,
  );
  strokePolygon(
    png,
    [
      emblemPoint(cx, cy, size, 24, 41),
      emblemPoint(cx, cy, size, 10, 16),
      emblemPoint(cx, cy, size, 38, 16),
    ],
    1.2 * scale,
    gold,
    1,
  );
  fillCircle(png, cx, cy, 3.4 * scale, gold, 0.85);
}

function writePng(file, png) {
  fs.writeFileSync(path.join(OUT, file), PNG.sync.write(png));
}

function makeIcon() {
  const png = new PNG({ width: 1024, height: 1024, colorType: 6 });
  fillBackground(png);
  drawEmblem(png, 512, 512, 590, { glowAlpha: 0.24 });
  writePng('icon.png', png);
}

function makeAdaptiveIcon() {
  const png = new PNG({ width: 1024, height: 1024, colorType: 6 });
  drawEmblem(png, 512, 512, 610, { glowAlpha: 0.12 });
  writePng('adaptive-icon.png', png);
}

function makeSplash() {
  const png = new PNG({ width: 1024, height: 1024, colorType: 6 });
  drawEmblem(png, 512, 512, 560, { glowAlpha: 0.22 });
  writePng('splash.png', png);
}

makeIcon();
makeAdaptiveIcon();
makeSplash();

console.log('Generated brand assets:');
console.log('- assets/icon.png 1024x1024');
console.log('- assets/adaptive-icon.png 1024x1024');
console.log('- assets/splash.png 1024x1024');
