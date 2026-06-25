/**
 * Generates seamless-looping meditation drone WAV files for the Divine Library
 * player. These are synthesised here (sine fundamentals + soft harmonics +
 * slow tremolo) — the same spirit as the web prototype's Web-Audio engine —
 * so there are no third-party / copyrighted audio assets to license.
 *
 * Run:  node scripts/gen-drones.js
 */
const fs = require('fs');
const path = require('path');

const SR = 22050; // sample rate (mono) — compact but warm enough for drones
const OUT = path.join(__dirname, '..', 'assets', 'audio');

/** Build one looping drone. fundCycles must be an integer so start==end (seamless). */
function makeDrone({ name, baseHz, harmonics, tremHz, seconds }) {
  // Snap length so the fundamental completes a whole number of cycles.
  const approx = Math.round(seconds * SR);
  const fundCycles = Math.round((baseHz * approx) / SR);
  const N = Math.round((fundCycles * SR) / baseHz); // exact samples for integer cycles
  const tremCycles = Math.max(1, Math.round((tremHz * N) / SR));

  const data = Buffer.alloc(N * 2);
  let peak = 0;
  const raw = new Float64Array(N);

  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let s = 0;
    harmonics.forEach((amp, k) => {
      const f = baseHz * (k + 1);
      s += amp * Math.sin(2 * Math.PI * f * t);
    });
    // slow tremolo (whole number of cycles → loops cleanly)
    const trem = 0.85 + 0.15 * Math.sin((2 * Math.PI * tremCycles * i) / N);
    raw[i] = s * trem;
    const a = Math.abs(raw[i]);
    if (a > peak) peak = a;
  }

  const norm = (0.82 / peak) * 32767;
  for (let i = 0; i < N; i++) {
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(raw[i] * norm))), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  fs.writeFileSync(path.join(OUT, name), Buffer.concat([header, data]));
  console.log(`${name}  ${(((header.length + data.length) / 1024)).toFixed(0)} KB  ${(N / SR).toFixed(2)}s`);
}

fs.mkdirSync(OUT, { recursive: true });

// Each "track" gets its own tonal centre + harmonic colour.
makeDrone({ name: 'om-drone.wav',     baseHz: 136.1, harmonics: [1, 0.5, 0.28, 0.12], tremHz: 0.18, seconds: 8 });   // OM (C#, 136.1Hz)
makeDrone({ name: 'tanpura.wav',      baseHz: 146.83, harmonics: [1, 0.62, 0.2, 0.1, 0.06], tremHz: 0.25, seconds: 8 }); // D tanpura-ish
makeDrone({ name: 'flute-calm.wav',   baseHz: 220, harmonics: [1, 0.22, 0.14, 0.05], tremHz: 0.4, seconds: 7 });        // airy A
makeDrone({ name: 'temple-bells.wav', baseHz: 174, harmonics: [1, 0.7, 0.45, 0.3, 0.18], tremHz: 0.6, seconds: 7 });    // F-ish bell body
console.log('done');
