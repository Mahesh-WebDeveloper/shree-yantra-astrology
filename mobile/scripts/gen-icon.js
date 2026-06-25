/* Generates the Shree Yantra app launcher icons (gold mandala on black) from an
 * inline SVG, using sharp. Outputs:
 *   assets/icon.png          1024 — black bg + emblem (iOS / legacy / store)
 *   assets/adaptive-icon.png 1024 — transparent bg + smaller emblem (Android
 *                                   adaptive foreground; bg colour set in app.json)
 *   assets/favicon.png       512  — web favicon
 * Run: node scripts/gen-icon.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const C = 512; // center of a 1024 canvas
const D2R = Math.PI / 180;

function poly(cx, cy, r, anglesDeg) {
  return anglesDeg.map((a) => `${(cx + r * Math.cos(a * D2R)).toFixed(1)},${(cy + r * Math.sin(a * D2R)).toFixed(1)}`).join(' ');
}

/** Build the emblem SVG. scale 1 = fills ~the 1024 canvas; <1 shrinks (adaptive safe zone). */
function emblemSvg({ bg = true, scale = 1 } = {}) {
  const s = scale;
  // a single lotus petal pointing "up" (north), to be rotated around the centre
  const petal = (rotDeg) =>
    `<path d="M512 ${512 - 196 * s} C ${512 - 44 * s} ${512 - 286 * s} ${512 - 36 * s} ${512 - 386 * s} 512 ${512 - 440 * s} C ${512 + 36 * s} ${512 - 386 * s} ${512 + 44 * s} ${512 - 286 * s} 512 ${512 - 196 * s} Z" transform="rotate(${rotDeg} 512 512)" fill="none" stroke="url(#g)" stroke-width="${5 * s}" stroke-linejoin="round" opacity="0.95"/>`;
  const petals = Array.from({ length: 12 }, (_, i) => petal(i * 30)).join('');

  const upBig = poly(C, C, 250 * s, [-90, 30, 150]);
  const dnBig = poly(C, C, 250 * s, [90, 210, 330]);
  const upSm = poly(C, C, 158 * s, [-90, 30, 150]);
  const dnSm = poly(C, C, 158 * s, [90, 210, 330]);

  const dot = (r, fill, o = 1) =>
    `<circle cx="512" cy="${512 - (r ? 0 : 0)}" cy="512" r="${r}" fill="${fill}" opacity="${o}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff4cc"/>
      <stop offset="0.5" stop-color="#e9b850"/>
      <stop offset="1" stop-color="#a17613"/>
    </linearGradient>
    <radialGradient id="bg" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stop-color="#15131f"/>
      <stop offset="60%" stop-color="#070710"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#e9b850" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="#e9b850" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${bg ? '<rect width="1024" height="1024" rx="0" fill="url(#bg)"/>' : ''}
  <circle cx="512" cy="512" r="${360 * s}" fill="url(#glow)"/>
  <!-- outer rings -->
  <circle cx="512" cy="512" r="${452 * s}" fill="none" stroke="url(#g)" stroke-width="${7 * s}"/>
  <circle cx="512" cy="512" r="${300 * s}" fill="none" stroke="url(#g)" stroke-width="${4 * s}" opacity="0.85"/>
  <!-- lotus petals -->
  ${petals}
  <!-- yantra interlocking triangles -->
  <polygon points="${upBig}" fill="none" stroke="url(#g)" stroke-width="${6 * s}" stroke-linejoin="round"/>
  <polygon points="${dnBig}" fill="none" stroke="url(#g)" stroke-width="${6 * s}" stroke-linejoin="round"/>
  <polygon points="${upSm}" fill="none" stroke="url(#g)" stroke-width="${4.5 * s}" stroke-linejoin="round" opacity="0.9"/>
  <polygon points="${dnSm}" fill="none" stroke="url(#g)" stroke-width="${4.5 * s}" stroke-linejoin="round" opacity="0.9"/>
  <!-- bindu -->
  <circle cx="512" cy="512" r="${30 * s}" fill="url(#g)"/>
  <circle cx="512" cy="512" r="${11 * s}" fill="#fff7e0"/>
</svg>`;
}

const out = (name) => path.join(__dirname, '..', 'assets', name);
const res = (d, name) => path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', `mipmap-${d}`, name);
const draw = (d, name) => path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', `drawable-${d}`, name);

// Android density sizes
const FG = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 }; // adaptive foreground (108dp)
const LEGACY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }; // legacy launcher (48dp)
const SPLASH = { mdpi: 288, hdpi: 432, xhdpi: 576, xxhdpi: 864, xxxhdpi: 1152 }; // native splash icon

async function run() {
  // 1) Expo asset PNGs (used by app.json / iOS / store / web)
  await sharp(Buffer.from(emblemSvg({ bg: true, scale: 1 }))).png().toFile(out('icon.png'));
  await sharp(Buffer.from(emblemSvg({ bg: false, scale: 0.62 }))).png().toFile(out('adaptive-icon.png'));
  await sharp(Buffer.from(emblemSvg({ bg: true, scale: 1 }))).resize(512, 512).png().toFile(out('favicon.png'));
  await sharp(Buffer.from(emblemSvg({ bg: false, scale: 0.8 }))).png().toFile(out('splash.png'));

  // 2) Android native launcher icons (webp) at every density — what the installed APK actually shows
  const fgSvg = Buffer.from(emblemSvg({ bg: false, scale: 0.62 }));   // adaptive foreground (transparent, safe-zone)
  const legacySvg = Buffer.from(emblemSvg({ bg: true, scale: 0.9 })); // legacy + round (black bg + emblem)
  for (const d of Object.keys(FG)) {
    await sharp(fgSvg).resize(FG[d], FG[d]).webp({ quality: 92 }).toFile(res(d, 'ic_launcher_foreground.webp'));
    await sharp(legacySvg).resize(LEGACY[d], LEGACY[d]).webp({ quality: 92 }).toFile(res(d, 'ic_launcher.webp'));
    await sharp(legacySvg).resize(LEGACY[d], LEGACY[d]).webp({ quality: 92 }).toFile(res(d, 'ic_launcher_round.webp'));
  }

  // 3) Native splash icon (drawable-*/splashscreen_logo.png) — emblem sized to
  //    fit Android 12's circular splash mask (transparent; bg is black via theme)
  const splashSvg = Buffer.from(emblemSvg({ bg: false, scale: 0.58 }));
  for (const d of Object.keys(SPLASH)) {
    await sharp(splashSvg).resize(SPLASH[d], SPLASH[d]).png().toFile(draw(d, 'splashscreen_logo.png'));
  }
  console.log('icons written: assets/*.png + mipmap launcher icons + drawable splash logos (all densities)');
}
run().catch((e) => { console.error(e); process.exit(1); });
