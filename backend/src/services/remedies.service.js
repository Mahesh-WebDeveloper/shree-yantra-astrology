// Structured Remedies (Upaay) — Lagna gemstone + dosha remedies + navagraha beej mantras.
// Data = user's real chart (getKundli) + live Sade Sati (getGochar). Tables = classical (utils/remedies.js).
const { getKundli, getGochar } = require('./vedastro.service');
const { computeRemedies } = require('../utils/remedies');
const ai = require('./ai.service');

async function getRemedies(input) {
  const { lang } = input;
  const skipAi = !!input.skipAi;
  const birth = { lat: input.lat, lng: input.lng, dob: input.dob, tob: input.tob, tz: input.tz, place: input.place };

  const k = await getKundli(birth);
  const d = (k && k.data) || {};

  let sadeSati = { active: false, dhaiya: false, phase: null, phaseHi: null };
  try { const g = await getGochar(birth); if (g && g.sadeSati) sadeSati = g.sadeSati; } catch (_) { /* gochar optional */ }

  const remedies = computeRemedies({
    ascendant: d.ascendant || null,
    moonSign: d.moonSign || null,
    planets: d.planets || [],
    doshas: d.doshas || [],
    sadeSati,
  });

  let explanation = null;
  if (!skipAi) {
  try {
    explanation = await ai.generateRemediesExplanation({
      remedies, ascendant: d.ascendant, moonSign: d.moonSign, doshas: d.doshas || [], sadeSati, lang,
    });
  } catch (_) { /* AI optional — tables phir bhi dikhenge */ }

  }

  return { ascendant: d.ascendant || null, moonSign: d.moonSign || null, sadeSati, remedies, explanation };
}

module.exports = { getRemedies };
