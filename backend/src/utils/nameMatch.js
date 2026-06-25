'use strict';

/**
 * nameMatch.js — deterministic filtering over the curated babyNames dataset.
 * Powers the RELIABLE fallback for the name engine when the AI provider is down.
 * Handles startWith as a Roman letter ("R"), a multi-letter sound ("Sh"), OR a
 * Devanagari naamakshar syllable ("रा", "चू", "गू") by mapping the Devanagari
 * base consonant/vowel to its Roman prefix.
 */

const { NAMES } = require('../data/babyNames');

// Devanagari base char → Roman prefix
const DEV_ROMAN = {
  'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u', 'ऋ': 'ri',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh',
  'स': 's', 'ह': 'h', 'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy',
};

const isDevanagari = (ch) => { const c = ch.charCodeAt(0); return c >= 0x0900 && c <= 0x097f; };

// Roman prefix that a name's first sound must start with, for a given startWith token
function romanPrefix(startWith) {
  const s = String(startWith || '').trim();
  if (!s) return '';
  if (isDevanagari(s[0])) return DEV_ROMAN[s[0]] || '';
  return s.toLowerCase();
}

function firstSoundMatches(entry, startWith) {
  const prefix = romanPrefix(startWith);
  if (!prefix) return true;
  const roman = String(entry.name || '').toLowerCase();
  if (roman.startsWith(prefix)) return true;
  // also allow Devanagari direct match (e.g. startWith 'रा' vs hi 'रोहन')
  const s = String(startWith).trim();
  if (s && isDevanagari(s[0]) && String(entry.hi || '').startsWith(s[0])) return true;
  return false;
}

const normGender = (g) => {
  const s = String(g || '').toLowerCase();
  if (s.startsWith('f') || s.startsWith('g')) return 'girl';
  if (s.startsWith('m') || s.startsWith('b')) return 'boy';
  return 'any';
};

const HINDU_ORIGINS = ['sanskrit', 'hindu'];

function lengthOk(name, pref) {
  const n = String(name || '').replace(/[^A-Za-z]/g, '').length;
  if (pref === 'short') return n <= 4;
  if (pref === 'medium') return n >= 5 && n <= 7;
  if (pref === 'long') return n >= 8;
  return true;
}

/**
 * filterLocalNames(filters) → array of { name, nameHi, meaning, origin, gender, themes }
 * filters: { gender, startWith(string|array), origin, theme, words, lengthPref, count }
 */
function filterLocalNames(filters = {}) {
  const g = normGender(filters.gender);
  const startArr = (Array.isArray(filters.startWith) ? filters.startWith : (filters.startWith ? [filters.startWith] : []))
    .map((s) => String(s).trim()).filter(Boolean);
  const origin = String(filters.origin || '').trim().toLowerCase();
  const theme = String(filters.theme || '').trim().toLowerCase();
  const words = String(filters.words || '').trim().toLowerCase();
  const lengthPref = ['short', 'medium', 'long'].includes(filters.lengthPref) ? filters.lengthPref : '';
  const count = Math.min(Math.max(Number(filters.count) || 16, 6), 24);

  const wordTokens = words ? words.split(/[,\s/&+]+/).filter(Boolean) : [];

  const matches = (relaxed) => NAMES.filter((e) => {
    if (g !== 'any' && e.g !== g) return false;
    if (startArr.length && !startArr.some((sw) => firstSoundMatches(e, sw))) return false;
    if (!relaxed && lengthPref && !lengthOk(e.name, lengthPref)) return false;
    if (!relaxed && origin) {
      const eo = String(e.origin || '').toLowerCase();
      const ok = HINDU_ORIGINS.includes(origin) ? HINDU_ORIGINS.includes(eo) : eo === origin;
      if (!ok) return false;
    }
    if (theme) {
      const hay = (e.meaning + ' ' + (e.themes || []).join(' ') + ' ' + e.name).toLowerCase();
      if (!hay.includes(theme)) return false;
    }
    if (wordTokens.length) {
      const hay = (e.meaning + ' ' + e.name + ' ' + (e.themes || []).join(' ')).toLowerCase();
      const hitWord = wordTokens.some((w) => hay.includes(w) || romanPrefix(w[0]) && e.name.toLowerCase().startsWith(w[0]));
      if (!hitWord) return false;
    }
    return true;
  });

  // try strict, then relax soft filters (length/origin) if too few
  let out = matches(false);
  if (out.length < Math.min(6, count)) {
    const seen = new Set(out.map((e) => e.name));
    matches(true).forEach((e) => { if (!seen.has(e.name)) out.push(e); });
  }

  return out.slice(0, count).map((e) => ({
    name: e.name, nameHi: e.hi, meaning: e.meaning,
    origin: e.origin, gender: e.g, themes: e.themes || [],
  }));
}

module.exports = { filterLocalNames, firstSoundMatches, romanPrefix };
