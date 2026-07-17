// AI layer — VedAstro ke REAL data ko padhke rashifal / insights LIKHta hai.
// IMPORTANT: AI khud astrology calculate NAHI karta — numbers VedAstro (Swiss Eph)
// se aate hain, AI sirf un par insaani bhasha me prediction likhta hai.
//
// Provider abstraction: abhi Gemini (free tier). 'claude' baad me plug ho sakta hai.
// Cache: AiCache me, key me date/period — taaki content time ke saath refresh ho.
const env = require('../config/env');
const crypto = require('crypto');
const AiCache = require('../models/AiCache');
const Settings = require('../models/Settings');
const { getKundli, getDasha, getPanchang, getGochar } = require('./vedastro.service');
const { getVargaCharts } = require('./varga.service');
const { nameNumerology, birthNumerology } = require('../utils/numerology');
const { sadeSatiTimeline } = require('../utils/sadeSati');
const { filterLocalNames, firstSoundMatches } = require('../utils/nameMatch');
const { fetchT } = require('../utils/httpFetch');

// ── Gemini REST call (model fallback ke saath) ──
function parseJsonLoose(text) {
  let t = String(text).trim();
  if (t.startsWith('```')) t = t.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(t);
  } catch (_) {
    // try to salvage the largest {...} block, else fail cleanly (don't crash the request)
    const m = t.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch (_2) { /* fall through */ } }
    throw Object.assign(new Error('Reading could not be generated'), { status: 502 });
  }
}

// ── Circuit breaker (per-model cooldown) ────────────────────────────────────
// Jab koi model 429 (quota) / 5xx / down ho, use thodi der ke liye "cooldown" me
// daal dete hain — agle requests me usse SKIP karke seedhe agle model par jaate
// hain (bina network call ke). Isse user ko kabhi slow/error feel nahi hota:
// hum sirf un models ko try karte hain jo abhi healthy hain. (Process-memory me;
// restart par reset — yeh by design hai.)
const _cooldownUntil = new Map();
function inCooldown(id) {
  const until = _cooldownUntil.get(id);
  if (!until) return false;
  if (Date.now() >= until) { _cooldownUntil.delete(id); return false; }
  return true;
}
function tripCooldown(id, ms) { _cooldownUntil.set(id, Date.now() + ms); }
function clearCooldown(id) { _cooldownUntil.delete(id); }

// Error ke hisaab se model ko kitni der skip karein:
function cooldownMsFor(err) {
  const s = err && err.status;
  const msg = String((err && err.message) || '');
  if (s === 429) return /per[\s-]?day|daily|free-?models?-?per-?day/i.test(msg) ? 20 * 60 * 1000 : 60 * 1000; // daily quota → 20min, per-min → 60s
  if (s === 402) return 6 * 60 * 60 * 1000; // needs credits (paid model on free key) → long skip
  if (s === 404 || s === 400) return 6 * 60 * 60 * 1000; // stale/invalid model id → long skip (self-heal)
  if (s === 401 || s === 403) return 10 * 60 * 1000; // auth issue → skip a while
  if (s == null || s >= 500) return 30 * 1000; // server/timeout/invalid-response → short
  return 15 * 1000;
}

// Ek model-chain ko ek-ke-baad-ek try karta hai. Cooldown-wale models instantly
// skip. Success par cooldown clear. Sab models cooldown me ho to allCooldown flag
// ke saath turant throw (taaki caller agle provider par bina ruke jump kar sake).
async function runModelChain(label, models, doCall) {
  let lastErr;
  let triedLive = false;
  for (const model of models) {
    const id = `${label}:${model}`;
    if (inCooldown(id)) continue; // circuit OPEN → skip instantly (no network)
    triedLive = true;
    try {
      const out = await doCall(model);
      clearCooldown(id);
      return out;
    } catch (e) {
      lastErr = e;
      const ms = cooldownMsFor(e);
      if (ms) tripCooldown(id, ms);
    }
  }
  const err = lastErr || Object.assign(new Error(`${label}: koi model available nahi`), { status: 503 });
  if (!triedLive) err.allCooldown = true; // sabhi cooldown me the → fast failover signal
  throw err;
}

// Reasoning/open models ke output ko saaf karta hai (harmony channel tokens etc.)
function sanitizeText(t) {
  return String(t == null ? '' : t)
    .replace(/<\|[^|>]*\|>/g, ' ')        // OpenAI "harmony" channel tokens (gpt-oss)
    .replace(/^\s*assistantfinal\s*/i, '') // gpt-oss final-channel marker
    .trim();
}

async function callGemini(prompt, { json = false } = {}) {
  // MULTI-KEY: free tier quota is PER-MODEL-PER-DAY (~20/day each) and PER-KEY.
  // So we try every (key × model) pair. When a model on one key is exhausted (429),
  // the circuit breaker cools that exact (key,model) and we instantly skip to the
  // next model — and when a whole key is exhausted, we move to the NEXT KEY. With N
  // keys this multiplies the effective free quota ~N×. Order: best model first,
  // primary key first; extra keys only kick in once the earlier ones are spent.
  const keys = (env.ai.geminiKeys && env.ai.geminiKeys.length) ? env.ai.geminiKeys : (env.ai.geminiKey ? [env.ai.geminiKey] : []);
  if (!keys.length) throw Object.assign(new Error('GEMINI_API_KEY set nahi hai (.env)'), { status: 500 });
  const models = [
    env.ai.geminiModel,
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
  ].filter((v, i, a) => v && a.indexOf(v) === i);
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 2600,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  };
  const callOne = async (key, model) => {
    const res = await fetchT(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      18000
    );
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw Object.assign(new Error(`Gemini ${res.status} (${model}): ${txt.slice(0, 140)}`), { status: res.status });
    }
    const data = await res.json();
    const text = ((data.candidates && data.candidates[0] && data.candidates[0].content
      && data.candidates[0].content.parts) || []).map((p) => p.text || '').join('');
    if (!text) throw Object.assign(new Error(`Gemini empty (${model})`), { status: 502 });
    return json ? parseJsonLoose(text) : text.trim();
  };
  let lastErr;
  let triedLive = false;
  for (let ki = 0; ki < keys.length; ki++) {
    for (const model of models) {
      const id = `gemini:k${ki}:${model}`;       // per-(key,model) cooldown
      if (inCooldown(id)) continue;              // circuit OPEN → skip instantly (no network)
      triedLive = true;
      try {
        const out = await callOne(keys[ki], model);
        clearCooldown(id);
        return out;
      } catch (e) {
        lastErr = e;
        const ms = cooldownMsFor(e);
        if (ms) tripCooldown(id, ms);
      }
    }
  }
  const err = lastErr || Object.assign(new Error('Gemini: koi key/model available nahi'), { status: 503 });
  if (!triedLive) err.allCooldown = true;        // all (key,model) cooled → fast failover to OpenRouter
  throw err;
}

async function callClaude(prompt, { json = false } = {}) {
  const key = env.anthropicKey;
  if (!key) throw Object.assign(new Error('ANTHROPIC_API_KEY set nahi hai (.env)'), { status: 500 });
  const res = await fetchT('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 2600,
      temperature: 0.85,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw Object.assign(new Error(`Claude ${res.status}: ${txt.slice(0, 160)}`), { status: 502 });
  }
  const data = await res.json();
  const text = (data.content || []).map((part) => part.text || '').join('').trim();
  if (!text) throw Object.assign(new Error('Claude: empty response'), { status: 502 });
  return json ? parseJsonLoose(text) : text;
}

// ── OpenRouter (OpenAI-compatible) — FREE model chain ───────────────────────
// Yeh hamara FALLBACK provider hai: jab Gemini quota (429)/down ho, hum yahan
// switch karte hain. OpenRouter par ye sab models BILKUL FREE hain (:free) —
// $0 balance par chalte hain. Free tier ka rate-limit account-wide (~20 req/min)
// hai, isliye hum ek-ke-baad-ek kai models try karte hain + circuit breaker se
// rate-limited model ko skip karte hain. (Live-verified working models, order:
// best quality + cleanest output first; gpt-oss JSON ke liye reliable backup.)
const OPENROUTER_FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'openai/gpt-oss-120b:free',
  'google/gemma-4-31b-it:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
];

async function callOpenRouter(prompt, { json = false } = {}) {
  // MULTI-KEY: free tier rate-limit is PER-KEY (~20/min, 50/day). So we try every
  // (key × free-model) pair — when one key's models are rate-limited (429) we skip
  // to the next model, and when a whole key is spent we move to the NEXT KEY.
  const keys = (env.ai.openrouterKeys && env.ai.openrouterKeys.length) ? env.ai.openrouterKeys : (env.ai.openrouterKey ? [env.ai.openrouterKey] : []);
  if (!keys.length) throw Object.assign(new Error('OPENROUTER_API_KEY set nahi hai (.env)'), { status: 500 });
  const models = [
    env.ai.openrouterModel,
    ...OPENROUTER_FREE_MODELS,
    ...env.ai.openrouterExtra,
  ].filter((v, i, a) => v && a.indexOf(v) === i);
  const callOne = async (key, model) => {
    const res = await fetchT('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'https://shreeyantra.app',
        'X-Title': 'Shree Yantra',
      },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        max_tokens: 2600,
        messages: [
          json
            ? { role: 'system', content: 'Respond with ONLY valid JSON — no markdown, no code fences, no analysis, no commentary.' }
            : { role: 'system', content: "You are the Vedic astrologer (jyotishi) of Shree Yantra, writing from real ephemeris calculations. Reply with ONLY the final answer in the user's language. Do not include any analysis, reasoning, or meta commentary. NEVER refer to yourself as an AI, a model, a bot, an assistant or software, and never mention being generated -- always speak simply as the app's astrologer." },
          { role: 'user', content: prompt },
        ],
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    }, 22000);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw Object.assign(new Error(`OpenRouter ${res.status} (${model}): ${txt.slice(0, 140)}`), { status: res.status });
    }
    const data = await res.json();
    if (data && data.error) throw Object.assign(new Error(`OpenRouter ${model}: ${String(data.error.message || 'provider error').slice(0, 120)}`), { status: 502 });
    const raw = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    const text = sanitizeText(raw);
    if (!text) throw Object.assign(new Error(`OpenRouter empty (${model})`), { status: 502 });
    return json ? parseJsonLoose(text) : text;
  };
  let lastErr;
  let triedLive = false;
  for (let ki = 0; ki < keys.length; ki++) {
    for (const model of models) {
      const id = `openrouter:k${ki}:${model}`;     // per-(key,model) cooldown
      if (inCooldown(id)) continue;                // circuit OPEN → skip instantly
      triedLive = true;
      try {
        const out = await callOne(keys[ki], model);
        clearCooldown(id);
        return out;
      } catch (e) {
        lastErr = e;
        const ms = cooldownMsFor(e);
        if (ms) tripCooldown(id, ms);
      }
    }
  }
  const err = lastErr || Object.assign(new Error('OpenRouter: koi key/model available nahi'), { status: 503 });
  if (!triedLive) err.allCooldown = true;
  throw err;
}

// ── Groq (OpenAI-compatible) — VERY fast LPU inference, free tier ───────────
// Gemini ke baad, OpenRouter se pehle: Groq bahut tez hai aur reliable. Live-
// verified models: llama-3.3-70b-versatile (strong) + llama-3.1-8b-instant (fast).
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
async function callGroq(prompt, { json = false } = {}) {
  const key = env.ai.groqKey;
  if (!key) throw Object.assign(new Error('GROQ_API_KEY set nahi hai (.env)'), { status: 500 });
  const models = [env.ai.groqModel, ...GROQ_MODELS, ...env.ai.groqExtra].filter((v, i, a) => v && a.indexOf(v) === i);
  return runModelChain('groq', models, async (model) => {
    const res = await fetchT('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        max_tokens: 2600,
        messages: [
          json
            ? { role: 'system', content: 'Respond with ONLY valid JSON — no markdown, no code fences, no analysis, no commentary.' }
            : { role: 'system', content: "You are the Vedic astrologer (jyotishi) of Shree Yantra, writing from real ephemeris calculations. Reply with ONLY the final answer in the user's language. Do not include any analysis, reasoning, or meta commentary. NEVER refer to yourself as an AI, a model, a bot, an assistant or software, and never mention being generated -- always speak simply as the app's astrologer." },
          { role: 'user', content: prompt },
        ],
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    }, 20000);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw Object.assign(new Error(`Groq ${res.status} (${model}): ${txt.slice(0, 140)}`), { status: res.status });
    }
    const data = await res.json();
    const raw = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    const text = sanitizeText(raw);
    if (!text) throw Object.assign(new Error(`Groq empty (${model})`), { status: 502 });
    return json ? parseJsonLoose(text) : text;
  });
}

// ── ofox.ai (OpenAI-compatible aggregator) — LAST-resort fallback ───────────
// Default = free model z-ai/glm-4.7-flash:free ($0 balance OK; occasionally
// rate-limited → circuit breaker skips it). Paid models (e.g. openai/gpt-5.4-mini)
// need account credits — add them via OFOX_FALLBACK_MODELS once topped up.
const OFOX_MODELS = ['z-ai/glm-4.7-flash:free'];
async function callOfox(prompt, { json = false } = {}) {
  const key = env.ai.ofoxKey;
  if (!key) throw Object.assign(new Error('OFOX_API_KEY set nahi hai (.env)'), { status: 500 });
  const models = [env.ai.ofoxModel, ...OFOX_MODELS, ...env.ai.ofoxExtra].filter((v, i, a) => v && a.indexOf(v) === i);
  return runModelChain('ofox', models, async (model) => {
    const res = await fetchT('https://api.ofox.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        max_tokens: 2600,
        messages: [
          json
            ? { role: 'system', content: 'Respond with ONLY valid JSON — no markdown, no code fences, no analysis, no commentary.' }
            : { role: 'system', content: "You are the Vedic astrologer (jyotishi) of Shree Yantra, writing from real ephemeris calculations. Reply with ONLY the final answer in the user's language. Do not include any analysis, reasoning, or meta commentary. NEVER refer to yourself as an AI, a model, a bot, an assistant or software, and never mention being generated -- always speak simply as the app's astrologer." },
          { role: 'user', content: prompt },
        ],
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    }, 22000);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw Object.assign(new Error(`ofox ${res.status} (${model}): ${txt.slice(0, 140)}`), { status: res.status });
    }
    const data = await res.json();
    if (data && data.error) throw Object.assign(new Error(`ofox ${model}: ${String(data.error.message || 'provider error').slice(0, 120)}`), { status: 502 });
    const raw = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    const text = sanitizeText(raw);
    if (!text) throw Object.assign(new Error(`ofox empty (${model})`), { status: 502 });
    return json ? parseJsonLoose(text) : text;
  });
}

// Kya is error par hum fallback provider try karein? Sirf availability/quota errors par —
// (rate-limit 429, server 5xx, timeout/network, invalid-response 502, ya allCooldown).
// 4xx client errors (galat input) par fallback ka koi fayda nahi.
function shouldFailover(err) {
  if (err && err.allCooldown) return true;
  const s = err && err.status;
  return s === 429 || s === 500 || s === 502 || s === 503 || s === 504 || s == null;
}

// provider switch + smart failover (industry-standard graceful degradation)
// Chain: PRIMARY (Gemini free models, per-model daily quota) → OpenRouter FREE models.
// Har layer ke andar multi-model + circuit breaker. Result: user ko kabhi "AI down /
// slow / quota exceeded" feel nahi hota — koi na koi healthy model jawab de deta hai.
async function callAI(prompt, opts) {
  let provider = env.ai.provider || 'gemini';
  try {
    const settings = await Settings.getGlobal();
    provider = settings.aiProvider || provider;
  } catch (_) {
    // fallback to .env provider if DB settings are temporarily unavailable
  }
  // Fallback chain (each layer = its own multi-model + circuit breaker):
  //   PRIMARY (Gemini multi-key / Claude) → Groq (fast) → OpenRouter (free).
  // We only step to the next provider on a failover-worthy error (quota/5xx/down).
  const chain = [{ name: provider, fn: provider === 'claude' ? callClaude : callGemini }];
  if (env.ai.groqKey) chain.push({ name: 'groq', fn: callGroq });
  if (env.ai.openrouterKey) chain.push({ name: 'openrouter', fn: callOpenRouter });
  if (env.ai.ofoxKey) chain.push({ name: 'ofox', fn: callOfox });
  let lastErr;
  for (let i = 0; i < chain.length; i++) {
    try {
      return await chain[i].fn(prompt, opts);
    } catch (err) {
      lastErr = err;
      if (i < chain.length - 1 && shouldFailover(err)) {
        console.warn(`[ai] ${chain[i].name} unavailable (${err.status || 'err'}${err.allCooldown ? '/all-cooldown' : ''}) → ${chain[i + 1].name} fallback`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// ── helpers ──
const pad2 = (n) => (n < 10 ? '0' : '') + n;
const todayStr = () => { const n = new Date(); return `${pad2(n.getDate())}/${pad2(n.getMonth() + 1)}/${n.getFullYear()}`; };
const birthSig = (i) => `${i.dob}|${i.tob}|${i.place || `${i.lat},${i.lng}`}`;

// Global AI prompt version — bump to invalidate ALL cached AI text at once.
// 'sx1' = added the SARAL SAMJHAO beginner-friendly directive to every reading.
// 'sx2' = also explain hard Sanskrit/spiritual terms in scripture/shloka readings.
// 'sx3' = added a dedicated "saralVivaran" plain-language section to every reading.
// 'sx4' = Sade Sati now gets DETERMINISTIC start/end dates (no AI date hallucination).
// 'sx5' = prompt: never confuse Sade Sati (transit) with the Shani Mahadasha (dasha).
// 'sx8' = stronger no-Hinglish / pure-language directive in writeIn().
// 'sx9' = daily rashifal grounded in FULL astro dossier (dasha timeline + live
//         gochar + deterministic Sade Sati) + strict "traceable-to-a-field" contract.
const PROMPT_VERSION = 'sx9';

async function cached(key, type, producer) {
  const vkey = `${PROMPT_VERSION}|${key}`;
  const hit = await AiCache.findOne({ cacheKey: vkey });
  if (hit) return hit.data;
  const data = await producer();
  // AI down/quota fallback ko cache MAT karo (warna quota aane par bhi chipka rahega)
  if (!(data && data._fallback)) {
    try { await AiCache.findOneAndUpdate({ cacheKey: vkey }, { cacheKey: vkey, type, data }, { upsert: true }); } catch (_) {}
  }
  return data;
}

// Panchang response → compact "today" block (shared by buildContext + full context)
function panchToToday(panch) {
  if (!panch) return null;
  // "Aaj ki" tithi/nakshatra = UDAYA (sunrise) limbs — dharmik niyam: सूर्योदय ki tithi
  // pura din maani jaati hai. Current-moment limb bhejne se AI din ko "ek aage" padhta
  // tha jaise hi sunrise-tithi khatam hoti (app display bhi isi niyam par fix hua hai).
  const tithi = panch.sunriseTithi || panch.tithi;
  const nakshatra = panch.sunriseNakshatra || panch.nakshatra;
  const yoga = panch.sunriseYoga || panch.yoga;
  const karana = panch.sunriseKarana || panch.karana;
  return {
    date: panch.date, weekday: panch.weekday, tithi: tithi && tithi.name,
    paksha: tithi && tithi.paksha, nakshatra: nakshatra && nakshatra.name,
    yoga: yoga && yoga.name,
    karana: karana && karana.name,
    transitMoon: panch.moon && panch.moon.sign,
    transitMoonNakshatra: panch.moon && panch.moon.nakshatra,
    sun: panch.sun && panch.sun.sign,
    sunrise: panch.sunrise,
    sunset: panch.sunset,
    inauspicious: panch.inauspicious || [],
    source: panch.source,
  };
}

// VedAstro se real astro-context banata hai (kundli + dasha + aaj ka panchang)
async function buildContext(input) {
  const [k, d, panch] = await Promise.all([
    getKundli(input),
    getDasha(input).catch(() => null),
    getPanchang({ place: input.place, lat: input.lat, lng: input.lng }).catch(() => null),
  ]);
  const data = k.data || {};
  const activeDasha = d && d.dasha && d.dasha[0] ? d.dasha[0] : null;
  return {
    name: input.name || 'User',
    birth: {
      dob: input.dob,
      tob: input.tob,
      tz: input.tz,
      place: input.place || (input.lat != null && input.lng != null ? `${input.lat},${input.lng}` : null),
    },
    ascendant: data.ascendant,
    moonSign: data.moonSign,
    currentDasha: activeDasha ? activeDasha.lord : null,
    dasha: activeDasha ? {
      lord: activeDasha.lord,
      start: activeDasha.start,
      end: activeDasha.end,
      durationText: activeDasha.durationText,
    } : null,
    yogas: (data.yogas || []).slice(0, 6).map((y) => ({ name: y.name, description: y.description })),
    doshas: (data.doshas || []).filter((x) => x.present).map((x) => ({ name: x.name, detail: x.detail, tag: x.tag })),
    planets: (data.planets || []).filter((p) => p.sign).map((p) => ({
      planet: p.planet,
      sign: p.sign,
      house: p.house || null,
      nakshatra: p.nakshatra || null,
      isRetrograde: p.isRetrograde || null,
      isCombust: p.isCombust || null,
    })),
    today: panchToToday(panch),
  };
}

// ── FULL ASTRO CONTEXT — the complete, grounded per-user dossier for AI readings ──
// Everything the daily rashifal AI may mention MUST be present here, sourced from the
// real engines (VedAstro / Swiss-Eph / local ephemeris) — the model NEVER computes or
// invents chart facts itself.
// - NATAL part (kundli + full Vimshottari mahadasha list): immutable per birth →
//   cached forever in Mongo under `astroctx|v1|<birthSig>` (repeat generations skip VedAstro).
// - DAILY part (panchang + gochar/transits + deterministic Sade Sati status): changes
//   each day → cached under a date-keyed key; an incomplete day (a fetch failed) is NOT
//   cached, so the next request retries instead of pinning nulls for the whole day.
// NOTE: getDasha() returns MAHADASHAS only (no antardasha/sub-periods), so antardasha is
// deliberately NOT part of this context — we never fabricate a sub-period the engine
// didn't compute.
const NATAL_CTX_V = 'v1';
const DAILY_CTX_V = 'v1';

// "00:00 15/08/1995 +05:30" → Date (day precision — enough to order mahadashas)
function parseDashaDate(s) {
  const m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]))) : null;
}

async function buildNatalAstroPart(input) {
  return cached(`astroctx|${NATAL_CTX_V}|${birthSig(input)}`, 'astro-context-natal', async () => {
    const [k, d] = await Promise.all([
      getKundli(input),
      getDasha(input).catch(() => null),
    ]);
    const data = (k && k.data) || {};
    const natal = {
      ascendant: data.ascendant || null,
      moonSign: data.moonSign || null,
      yogas: (data.yogas || []).slice(0, 6).map((y) => ({ name: y.name, description: y.description })),
      doshas: (data.doshas || []).filter((x) => x.present).map((x) => ({ name: x.name, detail: x.detail, tag: x.tag })),
      planets: (data.planets || []).filter((p) => p.sign).map((p) => ({
        planet: p.planet,
        sign: p.sign,
        house: p.house || null,
        nakshatra: p.nakshatra || null,
        isRetrograde: p.isRetrograde || null,
        isCombust: p.isCombust || null,
      })),
      // full remaining Vimshottari mahadasha list (current + future) — real engine output
      dashaList: d && Array.isArray(d.dasha)
        ? d.dasha.map((p) => ({ lord: p.lord, start: p.start, end: p.end, durationText: p.durationText }))
        : [],
    };
    // incomplete chart (VedAstro + local fallback both failed) → don't pin in cache
    if (!natal.planets.length && !natal.ascendant) natal._fallback = true;
    return natal;
  });
}

async function buildDailyAstroPart(input) {
  return cached(`astroctx-day|${DAILY_CTX_V}|${birthSig(input)}|${todayStr()}`, 'astro-context-daily', async () => {
    const [panch, gochar] = await Promise.all([
      getPanchang({ place: input.place, lat: input.lat, lng: input.lng }).catch(() => null),
      getGochar(input).catch(() => null),
    ]);
    const out = {
      panch,
      // all 9 planets' CURRENT signs + house-from-Moon/Lagna — straight from the gochar engine
      gochar: gochar && Array.isArray(gochar.transits) ? {
        date: gochar.date || null,
        transits: gochar.transits.map((t) => ({
          planet: t.planet,
          sign: t.sign,
          nakshatra: t.nakshatra || null,
          isRetrograde: t.isRetrograde || null,
          houseFromMoon: t.houseFromMoon != null ? t.houseFromMoon : null,
          houseFromLagna: t.houseFromLagna != null ? t.houseFromLagna : null,
        })),
      } : null,
      // deterministic Saturn/Sade Sati status + exact windows (code-computed, never AI-guessed)
      sadeSati: (() => { try { return saturnStatusFrom(gochar); } catch (_) { return null; } })(),
    };
    if (!panch || !out.gochar) out._fallback = true; // incomplete day → retry on next request
    return out;
  });
}

async function buildFullAstroContext(input) {
  const [natalRaw, dailyRaw] = await Promise.all([
    buildNatalAstroPart(input),
    buildDailyAstroPart(input).catch(() => null),
  ]);
  const natal = natalRaw || {};
  const daily = dailyRaw || {};
  // current mahadasha + next 2 (drop any period that fully ended since the natal cache was written)
  const dashaList = Array.isArray(natal.dashaList) ? natal.dashaList : [];
  const nowMs = Date.now();
  const running = dashaList.filter((p) => { const e = parseDashaDate(p.end); return !e || e.getTime() >= nowMs; });
  const dashaTimeline = (running.length ? running : dashaList).slice(0, 3);
  const activeDasha = dashaTimeline[0] || null;
  return {
    name: input.name || 'User',
    birth: {
      dob: input.dob,
      tob: input.tob,
      tz: input.tz,
      place: input.place || (input.lat != null && input.lng != null ? `${input.lat},${input.lng}` : null),
    },
    ascendant: natal.ascendant || null,
    moonSign: natal.moonSign || null,
    currentDasha: activeDasha ? activeDasha.lord : null,
    dasha: activeDasha, // same shape buildContext exposes ({lord,start,end,durationText})
    dashaTimeline,      // current mahadasha + next 2 — real Vimshottari periods
    yogas: natal.yogas || [],
    doshas: natal.doshas || [],
    planets: natal.planets || [],
    gochar: daily.gochar || null,     // today's transits (all 9 planets) or null if engine unreachable
    sadeSati: daily.sadeSati || null, // deterministic status + exact current/next windows
    today: panchToToday(daily.panch),
  };
}

// ── 1) DAILY PREDICTION (roz naya — date se cache) ──
const langOf = (input) => (input && input.lang === 'hi' ? 'hi' : 'en');
// ── SARAL SAMJHAO — beginner-friendly directive added to EVERY AI reading ──
// The app is used by normal people who know NOTHING about astrology (not only
// astrologers). So every technical term must come WITH a plain-words meaning +
// a tiny real-life example. Appended to writeIn() → reaches all chart features.
const SIMPLIFY_EN =
  ' BEGINNER-FRIENDLY (VERY IMPORTANT — this app is used by ordinary people who know NOTHING about astrology, not only astrologers): whenever you use ANY technical astrology term — e.g. planet/graha, sign/rashi, house/bhava, house-lord, dasha/antardasha, nakshatra, yoga, dosha, lagna/ascendant, gochar/transit, exalted/debilitated/retrograde/combust, varga/divisional chart, Sade Sati — NEVER leave it unexplained. Right there, add its meaning in very simple everyday words AND a tiny real-life example a common person relates to. Keep the technical term (for accuracy) but always pair it with the plain meaning in brackets, e.g. "...your 10th house (the area of career and public image — your job, status and the work people know you for)...". Explain each term the first time it appears, keep it natural (not repetitive), warm and easy to read.';
const SIMPLIFY_HI =
  ' आम आदमी के लिए सरल (बहुत ज़रूरी — यह ऐप सिर्फ़ ज्योतिषी नहीं, ऐसे सामान्य लोग भी इस्तेमाल करते हैं जिन्हें ज्योतिष का कोई ज्ञान नहीं है): जब भी कोई तकनीकी ज्योतिषीय शब्द आए — जैसे ग्रह, राशि, भाव (घर), भावेश/स्वामी, दशा/अंतर्दशा, नक्षत्र, योग, दोष, लग्न, गोचर, उच्च/नीच/वक्री/अस्त, वर्ग कुंडली, साढ़ेसाती — उसे कभी बिना समझाए मत छोड़ो। वहीं पर बहुत आसान रोज़मर्रा की भाषा में उसका मतलब और एक छोटा-सा असल ज़िंदगी का उदाहरण भी दो जिससे आम व्यक्ति तुरंत समझ जाए। तकनीकी शब्द भी रखो (सटीकता के लिए) और साथ में कोष्ठक में आसान मतलब भी दो, जैसे "...आपका दशम भाव (यानी करियर और समाज में पहचान का घर — आपकी नौकरी, पद और जिस काम से लोग आपको जानते हैं)..."। हर शब्द को पहली बार आने पर ही समझाओ, बार-बार नहीं; लेखन गर्मजोशी भरा और सरल रखो।';
// For scripture/shloka explanations (Gita/Ramayan/Veda/RCM/daily-shloka) — explain
// any hard Sanskrit/spiritual concept simply, for readers with no shastra background.
const SIMPLIFY_SCRIPTURE_HI =
  'महत्वपूर्ण — आम पाठक के लिए: यदि कोई कठिन संस्कृत/शास्त्रीय/आध्यात्मिक शब्द आए (जैसे आत्मा, कर्म, धर्म, मोक्ष, गुण, प्रकृति, यज्ञ, माया, इन्द्रिय, स्थितप्रज्ञ आदि), तो उसे बिना समझाए मत छोड़ो — वहीं बहुत आसान रोज़मर्रा की भाषा में उसका मतलब और एक छोटा-सा जीवन का उदाहरण भी दो, ताकि जिस व्यक्ति को शास्त्रों की कोई जानकारी नहीं है, वह भी आसानी से गहराई तक समझ जाए।';
// A dedicated "saralVivaran" output field every reading should include — a full,
// stand-alone plain-language explanation section for non-technical / non-educated users.
const SARAL_FIELD_HI = '"saralVivaran":"इस पूरे विश्लेषण का सार बहुत ही आसान, रोज़मर्रा की हिंदी में लिखो — जैसे किसी ऐसे अपने को समझा रहे हो जिसे ज्योतिष का बिल्कुल ज्ञान नहीं है। 5-8 वाक्य, कोई कठिन शब्द नहीं; हर मुख्य बात को एक छोटे, असल-ज़िंदगी के उदाहरण के साथ समझाओ, और अंत में हौसला बढ़ाने वाली एक पंक्ति।"';
const SARAL_FIELD_EN = '"saralVivaran":"a complete, stand-alone summary of this whole reading in very simple everyday language — as if explaining to a close one who has ZERO astrology knowledge. 5-8 sentences, no hard words; explain each main point with a small real-life example, and end with one encouraging line."';
const saralField = (lang) => (lang === 'hi' ? SARAL_FIELD_HI : SARAL_FIELD_EN);
const writeIn = (lang) =>
  lang === 'hi'
    ? 'VERY IMPORTANT — LANGUAGE: Write ALL text values in PURE, SIMPLE HINDI in DEVANAGARI script ONLY (शुद्ध हिंदी). ABSOLUTELY NO HINGLISH — never write Hindi words in Roman/English letters, and do NOT mix English words into the Hindi sentences (keep only unavoidable proper nouns and numerals). Every single sentence must be natural Devanagari Hindi. Keep JSON keys in English. Be specific to the data, warm and natural — like a kind Hindi-speaking astrologer.' + SIMPLIFY_HI
    : 'VERY IMPORTANT — LANGUAGE: Write ALL text in clear, simple English ONLY. Do NOT mix in any Hindi/Devanagari or Hinglish words. Be specific to the data, positive and easy for an average Indian reader.' + SIMPLIFY_EN;

const fixedMoods = ['Energy', 'Love', 'Career', 'Health'];
const fixedAreas = ['Love', 'Career', 'Finance', 'Health'];
const clampPct = (n, fallback = 70) => Math.max(35, Math.min(98, Number(n) || fallback));
const asText = (value) => (typeof value === 'string' ? value.trim() : '');
const asList = (value) => (Array.isArray(value) ? value.filter((x) => x != null) : []);
const firstText = (...values) => values.map(asText).find(Boolean) || '';

function dailyDefaults(lang) {
  if (lang === 'hi') {
    return {
      headline: 'आज संतुलित और सजग दिन',
      overall: 'आज अपने मन, समय और वाणी को संतुलित रखकर चलें। छोटे निर्णय भी स्पष्टता से लिए जाएं तो दिन उपयोगी और शांत रह सकता है।',
      detailedSummary: 'आपके जन्म विवरण, चंद्र राशि और आज के पंचांग संकेतों के आधार पर दिन में धैर्य, नियमितता और सही समय-चयन अधिक सहायक रहेगा।',
      advice: 'जल्दबाजी में प्रतिक्रिया देने से बचें और जरूरी काम शांत मन से करें।',
      panchangSummary: 'आज के पंचांग को ध्यान में रखकर शुभ कामों में समय और शांति दोनों का ध्यान रखें।',
      transitSummary: 'चंद्र गोचर मन और निर्णयों को प्रभावित कर सकता है, इसलिए भावनात्मक संतुलन रखें।',
      sourceNote: 'यह मार्गदर्शन आपकी सटीक जन्म-कुंडली और पंचांग डेटा पर आधारित है।',
    };
  }
  return {
    headline: 'A steady, mindful day',
    overall: 'Today favours calm planning, balanced speech, and practical decisions. Move important work with patience and keep your routine clean.',
    detailedSummary: 'Based on your birth details, moon sign, current dasha, and today’s panchang, the day works best when you combine discipline with emotional balance.',
    advice: 'Avoid rushed reactions; complete priority work with a steady mind.',
    panchangSummary: 'Use today’s panchang as a timing guide and avoid starting important work during inauspicious windows.',
    transitSummary: 'The Moon transit can influence mood and focus, so keep decisions grounded.',
    sourceNote: 'This guidance is based on your precise birth-chart and panchang data.',
  };
}

function fallbackAreas(lang) {
  return lang === 'hi'
    ? {
        Love: 'रिश्तों में गर्मजोशी रखें और छोटी बातों को बड़ा न बनाएं।',
        Career: 'काम में प्राथमिकता साफ रखें; अधूरे काम पूरे करने के लिए अच्छा दिन है।',
        Finance: 'खर्च और निवेश में सोच-समझकर निर्णय लें।',
        Health: 'दिनचर्या, पानी और आराम पर ध्यान दें।',
      }
    : {
        Love: 'Keep communication warm and do not stretch small issues.',
        Career: 'Set clear priorities; pending work can move forward today.',
        Finance: 'Review spending and avoid impulsive commitments.',
        Health: 'Support your energy with hydration, food discipline, and rest.',
      };
}

function fallbackRemedies(lang) {
  return lang === 'hi'
    ? [
        { title: 'सुबह प्रार्थना', body: 'दिन शुरू करने से पहले अपने इष्ट का स्मरण करें और मन को स्थिर करें।', timing: 'सुबह', priority: 'high' },
        { title: 'हल्का दान', body: 'जरूरतमंद को अन्न, फल या जल का दान करें।', timing: 'दिन में', priority: 'medium' },
        { title: 'शांत वाणी', body: 'आज बहस से बचकर मधुर वाणी का अभ्यास करें।', timing: 'पूरे दिन', priority: 'medium' },
      ]
    : [
        { title: 'Morning prayer', body: 'Begin the day with a short prayer or gratitude practice to steady the mind.', timing: 'Morning', priority: 'high' },
        { title: 'Simple donation', body: 'Offer food, fruit, or water to someone in need.', timing: 'Daytime', priority: 'medium' },
        { title: 'Mindful speech', body: 'Avoid arguments and choose calm words throughout the day.', timing: 'All day', priority: 'medium' },
      ];
}

function ensureDailyShape(out, ctx, lang) {
  const src = out && typeof out === 'object' ? out : {};
  const defaults = dailyDefaults(lang);
  const areaFallback = fallbackAreas(lang);
  const inputMoods = asList(src.moods);
  const inputAreas = asList(src.areas);
  const inputTimes = asList(src.timeWindows);

  const moods = fixedMoods.map((label, i) => {
    const found = inputMoods.find((m) => String(m && m.label).toLowerCase() === label.toLowerCase()) || {};
    return { label, pct: clampPct(found.pct, [76, 70, 68, 72][i]) };
  });

  const areas = fixedAreas.map((title, i) => {
    const found = inputAreas.find((a) => String(a && a.title).toLowerCase() === title.toLowerCase()) || {};
    return {
      title,
      score: clampPct(found.score, moods[Math.min(i, moods.length - 1)].pct),
      text: firstText(found.text, areaFallback[title]),
      action: firstText(found.action, lang === 'hi' ? 'आज इसे छोटे, शांत कदमों में करें।' : 'Handle this through small, calm steps today.'),
    };
  });

  const timeWindows = inputTimes.length ? inputTimes.slice(0, 4).map((t) => ({
    label: firstText(t.label, lang === 'hi' ? 'उपयोगी समय' : 'Helpful time'),
    time: firstText(t.time, src.luckyTime, lang === 'hi' ? 'दिन में' : 'During the day'),
    quality: ['good', 'neutral', 'caution'].includes(t.quality) ? t.quality : 'neutral',
    advice: firstText(t.advice, defaults.advice),
  })) : [
    {
      label: lang === 'hi' ? 'शुभ काम' : 'Best focus',
      time: firstText(src.luckyTime, ctx.today && ctx.today.sunrise ? `After ${ctx.today.sunrise}` : ''),
      quality: 'good',
      advice: defaults.advice,
    },
    ...asList(ctx.today && ctx.today.inauspicious).slice(0, 2).map((p) => ({
      label: p.name,
      time: `${p.start} - ${p.end}`,
      quality: 'caution',
      advice: p.note || (lang === 'hi' ? 'इस समय नए शुभ काम टालें।' : 'Avoid starting important new work.'),
    })),
  ].filter((x) => x.time);

  const remedies = (asList(src.remedies).length ? asList(src.remedies) : fallbackRemedies(lang)).slice(0, 5).map((r) => ({
    title: firstText(r.title, lang === 'hi' ? 'सरल उपाय' : 'Simple remedy'),
    body: firstText(r.body, r.text, defaults.advice),
    timing: firstText(r.timing, r.tag),
    mantra: firstText(r.mantra),
    priority: ['high', 'medium', 'low'].includes(r.priority) ? r.priority : 'medium',
  }));

  const doList = asList(src.doList).map(asText).filter(Boolean).slice(0, 5);
  const avoidList = asList(src.avoidList).map(asText).filter(Boolean).slice(0, 5);
  const aiQuestions = asList(src.aiQuestions).map(asText).filter(Boolean).slice(0, 4);
  const focus = asList(src.focus).map(asText).filter(Boolean).slice(0, 4);
  const mantra = src.mantra && typeof src.mantra === 'object' ? {
    title: firstText(src.mantra.title, lang === 'hi' ? 'आज का मंत्र' : 'Today’s mantra'),
    text: firstText(src.mantra.text),
    count: firstText(src.mantra.count),
    bestTime: firstText(src.mantra.bestTime),
  } : null;

  return {
    headline: firstText(src.headline, defaults.headline),
    overall: firstText(src.overall, defaults.overall),
    detailedSummary: firstText(src.detailedSummary, defaults.detailedSummary),
    panchangSummary: firstText(src.panchangSummary, defaults.panchangSummary),
    transitSummary: firstText(src.transitSummary, defaults.transitSummary),
    moods,
    areas,
    timeWindows,
    remedies,
    doList: doList.length ? doList : (lang === 'hi' ? ['प्राथमिक काम पहले करें', 'परिवार से शांत संवाद रखें'] : ['Finish priority work first', 'Keep family communication calm']),
    avoidList: avoidList.length ? avoidList : (lang === 'hi' ? ['जल्दबाजी में निर्णय', 'अनावश्यक बहस'] : ['Rushed decisions', 'Unnecessary arguments']),
    mantra,
    focus,
    aiQuestions: aiQuestions.length ? aiQuestions : (lang === 'hi'
      ? ['आज मेरे करियर के लिए सबसे अच्छा कदम क्या है?', 'मेरे रिश्तों में आज किस बात का ध्यान रखूं?']
      : ['What is the best career step for me today?', 'What should I be careful about in relationships today?']),
    luckyColour: firstText(src.luckyColour, lang === 'hi' ? 'सुनहरा' : 'Gold'),
    luckyNumber: firstText(src.luckyNumber, '7'),
    luckyTime: firstText(src.luckyTime, timeWindows[0] && timeWindows[0].time),
    advice: firstText(src.advice, defaults.advice),
    confidence: Math.max(0.4, Math.min(0.95, Number(src.confidence) || 0.72)),
    sourceNote: firstText(src.sourceNote, defaults.sourceNote),
  };
}

async function generateDailyPrediction(input) {
  const lang = langOf(input);
  // v8: today block ab udaya (sunrise) tithi bolta hai — purani cached readings current-
  // moment tithi ke saath bani thi, unhe regenerate hona chahiye
  const key = `daily|v8|${birthSig(input)}|${todayStr()}|${lang}`;
  return cached(key, 'daily', async () => {
    const ctx = await buildFullAstroContext(input);
    // Missing blocks are OMITTED (not sent as null) so the model is never tempted
    // to "fill in" an empty field with invented astrology.
    const realData = {
      name: ctx.name,
      birth: ctx.birth,
      ...(ctx.ascendant ? { ascendant: ctx.ascendant } : {}),
      ...(ctx.moonSign ? { moonSign: ctx.moonSign } : {}),
      ...(ctx.dasha ? { dasha: ctx.dasha } : {}),
      ...(ctx.dashaTimeline && ctx.dashaTimeline.length ? { dashaTimeline: ctx.dashaTimeline } : {}),
      ...(ctx.yogas && ctx.yogas.length ? { yogas: ctx.yogas } : {}),
      ...(ctx.doshas && ctx.doshas.length ? { doshas: ctx.doshas } : {}),
      ...(ctx.planets && ctx.planets.length ? { planets: ctx.planets } : {}),
      ...(ctx.gochar ? { gochar: ctx.gochar } : {}),
      ...(ctx.sadeSati ? { sadeSati: ctx.sadeSati } : {}),
      ...(ctx.today ? { today: ctx.today } : {}),
    };
    const prompt = `You are an expert Vedic astrologer for the Shree Yantra app. Build a complete DAILY RASHIFAL for ${ctx.name}.

Use ONLY the real astrological data below. Do not invent planet positions, transits (gochar), yogas, doshas, dasha periods or dates, Sade Sati status or dates, nakshatra, tithi, sunrise, sunset, or time windows.
STRICT GROUNDING CONTRACT: every astrological fact you state MUST be traceable to a specific field in the REAL DATA JSON below. If a fact is NOT in that JSON, you must NOT state it — leave it out and write around it; never fill a gap from general knowledge or guesswork.
- "dashaTimeline" lists the current mahadasha first, then the next ones — use those lords and dates verbatim.
- "gochar.transits" are today's REAL planet positions (with house counted from the natal Moon and Lagna) — base transitSummary only on these (and "today"), never on remembered planetary positions.
- "sadeSati" is pre-computed by a precise ephemeris: use its status and currentSadeSati/nextSadeSati window text VERBATIM if you mention Sade Sati or Dhaiya; NEVER calculate, estimate or round any Sade Sati date yourself, and never confuse Sade Sati (a Saturn transit) with the Shani mahadasha.
- If a block (e.g. gochar, sadeSati, today) is absent from the JSON, simply do not talk about that topic.
You may interpret the data in a practical, kind way. Avoid fear, certainty, medical diagnosis, financial guarantees, or fatalistic language.
Mention that remedies are optional spiritual practices, not guaranteed outcomes.

REAL DATA JSON (from precise Vedic chart data plus classical Panchang rules):
${JSON.stringify(realData, null, 2)}

${writeIn(lang)}
Return STRICT JSON only. Keep mood labels EXACTLY "Energy", "Love", "Career", "Health". Keep area titles EXACTLY "Love", "Career", "Finance", "Health".
{
 "headline": "a short punchy 4-7 word highlight for today",
 "overall": "2-3 sentence prediction for today",
 "detailedSummary": "5-7 sentence personalised explanation using moon sign, lagna, dasha and today's panchang",
 "panchangSummary": "2-3 sentence simple explanation of today's tithi, nakshatra, moon transit and timing",
 "transitSummary": "2-3 sentence explanation of how today's moon/sun transit can affect the user",
 "moods": [{"label":"Energy","pct":<50-95>},{"label":"Love","pct":<50-95>},{"label":"Career","pct":<50-95>},{"label":"Health","pct":<50-95>}],
 "areas": [{"title":"Love","score":<50-95>,"text":"2 sentences","action":"one practical action"},{"title":"Career","score":<50-95>,"text":"2 sentences","action":"one practical action"},{"title":"Finance","score":<50-95>,"text":"2 sentences","action":"one practical action"},{"title":"Health","score":<50-95>,"text":"2 sentences","action":"one practical action"}],
 "timeWindows": [{"label":"Best Focus","time":"e.g. 8:30 AM - 10:00 AM","quality":"good|neutral|caution","advice":"short timing advice"}],
 "remedies": [{"title":"remedy name","body":"why and how to do it in simple terms","timing":"best timing","mantra":"optional mantra if suitable","priority":"high|medium|low"}],
 "doList": ["3-5 practical do items"],
 "avoidList": ["3-5 practical avoid items"],
 "mantra": {"title":"Today's mantra","text":"short mantra or prayer","count":"e.g. 11 times","bestTime":"best time"},
 "focus": ["2-4 focus keywords for the day"],
 "aiQuestions": ["3-4 useful follow-up questions the user may ask the astrologer next"],
 "luckyColour":"<one colour>",
 "luckyNumber":"<1-9>",
 "luckyTime":"<a short good-time window today, e.g. 'After 4 PM' or '6-8 AM'>",
 "advice":"one short do/avoid tip for today",
 "confidence": <0.4-0.95>,
 ${saralField(lang)},
 "sourceNote":"short note: based on precise chart/panchang data (do NOT mention AI or provider/API names)"
}`;
    let out; let aiFailed = false;
    try { out = await callAI(prompt, { json: true }); }
    catch (e) { out = {}; aiFailed = true; } // AI down/quota → real chart data phir bhi dikhega
    const shaped = ensureDailyShape(out, ctx, lang);
    return {
      ...shaped,
      saralVivaran: asText(out.saralVivaran),
      ...(aiFailed ? { _fallback: true } : {}),
      generatedFor: ctx.today ? ctx.today.date : todayStr(),
      basis: {
        moonSign: ctx.moonSign,
        ascendant: ctx.ascendant,
        dasha: ctx.currentDasha,
        dashaPeriod: ctx.dasha,
        yogas: ctx.yogas,
        activeDoshas: ctx.doshas,
        today: ctx.today,
        // additive (v7): full grounding dossier — mobile can ignore these safely
        dashaTimeline: ctx.dashaTimeline,
        gochar: ctx.gochar,
        sadeSati: ctx.sadeSati,
        source: 'Precise Vedic chart & Panchang data',
      },
      contextForChat: {
        name: ctx.name,
        birth: ctx.birth,
        ascendant: ctx.ascendant,
        moonSign: ctx.moonSign,
        currentDasha: ctx.currentDasha,
        // additive (v7): fuller real-data context for follow-up chat
        dashaTimeline: ctx.dashaTimeline,
        gochar: ctx.gochar,
        sadeSati: ctx.sadeSati,
        today: ctx.today,
        focus: shaped.focus,
        latestDailyPrediction: {
          date: ctx.today ? ctx.today.date : todayStr(),
          headline: shaped.headline,
          advice: shaped.advice,
          areas: shaped.areas.map((a) => ({ title: a.title, score: a.score })),
        },
      },
    };
  });
}

function questionKey(question) {
  return crypto.createHash('sha1').update(String(question).trim().toLowerCase()).digest('hex');
}

function stripProviderText(value, lang = 'en') {
  const replacement = lang === 'hi' ? 'गणना प्रणाली' : 'calculation engine';
  return asText(value).replace(/\bVedAstro(?:\s+API)?\b/gi, replacement).replace(/\s+/g, ' ').trim();
}

function ensureAskShape(out, ctx, question, lang) {
  const src = out && typeof out === 'object' ? out : {};
  const defaults = dailyDefaults(lang);
  const clean = (value) => stripProviderText(value, lang);
  const answer = clean(firstText(
    src.answer,
    lang === 'hi'
      ? 'आपके जन्म विवरण और उपलब्ध कुंडली-पंचांग डेटा के आधार पर अभी सबसे अच्छा मार्गदर्शन यह है कि निर्णय शांत मन से लें और आज के पंचांग के अनुसार समय का ध्यान रखें।'
      : 'Based on your birth details and available chart/panchang data, the best guidance is to act calmly and use today’s panchang as a timing support.'
  ));
  const sections = asList(src.sections).slice(0, 5).map((s) => ({
    title: clean(firstText(s.title, lang === 'hi' ? 'मार्गदर्शन' : 'Guidance')),
    text: clean(firstText(s.text, answer)),
  }));
  const vedastroBasis = asList(src.vedastroBasis).map(clean).filter(Boolean).slice(0, 8);
  const followUpQuestions = asList(src.followUpQuestions).map(clean).filter(Boolean).slice(0, 4);
  const remedies = asList(src.remedies).slice(0, 4).map((r) => ({
    title: clean(firstText(r.title, lang === 'hi' ? 'सरल उपाय' : 'Simple remedy')),
    body: clean(firstText(r.body, r.text, defaults.advice)),
    timing: clean(firstText(r.timing)),
    mantra: clean(firstText(r.mantra)),
  }));

  return {
    question,
    answer,
    sections: sections.length ? sections : [{ title: lang === 'hi' ? 'उत्तर' : 'Answer', text: answer }],
    vedastroBasis: vedastroBasis.length ? vedastroBasis : [
      ctx.moonSign ? `Moon sign: ${ctx.moonSign}` : '',
      ctx.ascendant ? `Ascendant: ${ctx.ascendant}` : '',
      ctx.currentDasha ? `Current dasha: ${ctx.currentDasha}` : '',
      ctx.today && ctx.today.nakshatra ? `Today nakshatra: ${ctx.today.nakshatra}` : '',
    ].filter(Boolean),
    remedies,
    followUpQuestions: followUpQuestions.length ? followUpQuestions : (lang === 'hi'
      ? ['मेरे लिए आज कौन सा समय बेहतर है?', 'इस विषय में कौन सा सरल उपाय करूं?']
      : ['Which time is better for me today?', 'What simple remedy should I follow for this?']),
    confidence: Math.max(0.4, Math.min(0.95, Number(src.confidence) || 0.72)),
    sourceNote: clean(firstText(src.sourceNote, defaults.sourceNote)),
    generatedFor: ctx.today ? ctx.today.date : todayStr(),
    basis: {
      moonSign: ctx.moonSign,
      ascendant: ctx.ascendant,
      dasha: ctx.currentDasha,
      dashaPeriod: ctx.dasha,
      today: ctx.today,
      source: 'Precise Vedic chart & Panchang data',
    },
    contextForChat: {
      name: ctx.name,
      birth: ctx.birth,
      ascendant: ctx.ascendant,
      moonSign: ctx.moonSign,
      currentDasha: ctx.currentDasha,
      today: ctx.today,
    },
  };
}

const VARGA_ALIASES = [
  { code: 'D1', keys: ['d1', 'lagna', 'birth chart', 'janma'] },
  { code: 'MOON', keys: ['moon chart', 'chandra', 'rashi chart'] },
  { code: 'D2', keys: ['d2', 'hora', 'wealth'] },
  { code: 'D3', keys: ['d3', 'dreshkana', 'drekkana', 'siblings'] },
  { code: 'D4', keys: ['d4', 'chaturthamsa', 'property'] },
  { code: 'D7', keys: ['d7', 'saptamsha', 'children'] },
  { code: 'D9', keys: ['d9', 'navamsha', 'marriage'] },
  { code: 'D10', keys: ['d10', 'dashamsha', 'career'] },
  { code: 'D12', keys: ['d12', 'dwadashamsha', 'parents'] },
  { code: 'D16', keys: ['d16', 'shodashamsha', 'comfort'] },
  { code: 'D20', keys: ['d20', 'vimshamsha', 'spiritual'] },
  { code: 'D24', keys: ['d24', 'education', 'siddhamsha'] },
  { code: 'D27', keys: ['d27', 'strength', 'bhamsa'] },
  { code: 'D30', keys: ['d30', 'trimsamsha', 'challenge'] },
  { code: 'D40', keys: ['d40', 'khavedamsha'] },
  { code: 'D45', keys: ['d45', 'akshavedamsha'] },
  { code: 'D60', keys: ['d60', 'shashtiamsha', 'karma'] },
];

function chartsForQuestion(question) {
  const q = String(question || '').toLowerCase();
  if (q.includes('all varga') || q.includes('all chart') || q.includes('shodashvarga') || q.includes('16 chart')) {
    return null;
  }
  const codes = new Set(['D1', 'MOON', 'D9', 'D10']);
  VARGA_ALIASES.forEach((item) => {
    if (item.keys.some((key) => q.includes(key))) codes.add(item.code);
  });
  return Array.from(codes);
}

function compactVargaCharts(varga) {
  const charts = varga && varga.data && Array.isArray(varga.data.charts) ? varga.data.charts : [];
  return charts.map((chart) => ({
    code: chart.code,
    name: chart.name,
    area: chart.area,
    ascendantSign: chart.ascendantSign || null,
    planets: (chart.planets || []).map((p) => `${p.planet}:${p.sign}`).join(', '),
  }));
}

// Deterministic Saturn / Sade Sati / Dhaiya status — COMPUTED from the gochar engine,
// never guessed by the AI. This is the single source of truth for any Shani question.
function saturnStatusFrom(gochar) {
  if (!gochar) return null;
  const sat = (gochar.transits || []).find((t) => t.planet === 'Saturn') || null;
  const ss = gochar.sadeSati || {};
  let status, statusHi;
  if (ss.active) {
    status = `Sade Sati is ACTIVE — ${ss.phase}`;
    statusHi = `साढ़े साती चल रही है — ${ss.phaseHi}`;
  } else if (ss.dhaiya) {
    status = 'Shani Dhaiya (small panoti) is ACTIVE';
    statusHi = 'शनि की ढैय्या (छोटी पनौती) चल रही है';
  } else {
    status = 'Neither Sade Sati nor Dhaiya is active right now';
    statusHi = 'अभी न साढ़े साती है और न ढैय्या';
  }
  // DETERMINISTIC dates — scanned from the ephemeris (NEVER guessed by AI). This is what
  // stopped the "Sade Sati ended today" hallucination: the AI now gets exact start/end months.
  const tl = (() => { try { return sadeSatiTimeline(gochar.natalMoonSign, new Date()); } catch (_) { return null; } })();
  return {
    asOfDate: gochar.date || null,
    natalMoonSign: gochar.natalMoonSign || null,
    saturnTransitSign: sat ? sat.sign : null,
    saturnHouseFromMoon: sat ? sat.houseFromMoon : null,
    saturnIsRetrograde: sat ? sat.isRetrograde : null,
    status,
    statusHi,
    // EXACT windows (month-year). currentSadeSati = the one running now (null if none);
    // nextSadeSati = the upcoming one. Use these verbatim — do NOT estimate any other date.
    currentSadeSati: tl && tl.current ? `${tl.current.start} → ${tl.current.end}` : null,
    nextSadeSati: tl && tl.next ? `${tl.next.start} → ${tl.next.end}` : null,
    sadeSatiActive: tl ? tl.active : (ss.active || false),
    dhaiyaActive: tl ? tl.dhaiya : (ss.dhaiya || false),
  };
}

async function askAstrologer(input) {
  const lang = langOf(input);
  const question = String(input.question || '').trim();
  if (!question) throw Object.assign(new Error('Question chahiye'), { status: 400 });
  if (question.length > 900) throw Object.assign(new Error('Question 900 characters se chhota rakhein'), { status: 400 });
  const key = `ask|v4|${birthSig(input)}|${todayStr()}|${lang}|${questionKey(question)}`;
  return cached(key, 'ask-astrologer', async () => {
    // Pull the user's COMPLETE kundli in parallel: natal chart+dasha+panchang (buildContext),
    // full Vimshottari dasha timeline, live gochar (transits + Sade Sati/Dhaiya), and varga charts.
    const [ctx, dashaTimeline, gochar, varga] = await Promise.all([
      buildContext(input),
      getDasha(input).catch(() => null),
      getGochar(input).catch(() => null),
      getVargaCharts(input, { charts: chartsForQuestion(question) }).catch(() => null),
    ]);
    const vargaContext = varga ? compactVargaCharts(varga) : [];
    const saturnStatus = saturnStatusFrom(gochar);
    // DETERMINISTIC numerology (mulank/bhagyank) from DOB — so "mera mulank?" gets REAL data, never a guess.
    const numerology = (() => { try { return birthNumerology(input.dob, ctx.name); } catch (_) { return null; } })();
    const currentTransits = gochar && Array.isArray(gochar.transits)
      ? gochar.transits.map((t) => ({ planet: t.planet, sign: t.sign, houseFromMoon: t.houseFromMoon, houseFromLagna: t.houseFromLagna, isRetrograde: t.isRetrograde }))
      : [];
    const dashaList = dashaTimeline && Array.isArray(dashaTimeline.dasha)
      ? dashaTimeline.dasha.slice(0, 7).map((d) => ({ lord: d.lord, start: d.start, end: d.end, durationText: d.durationText }))
      : (ctx.dasha ? [ctx.dasha] : []);

    const prompt = `You are Shree Yantra's Vedic astrologer (jyotishi). Answer the user's question with trust, clarity, and humility — like a warm, wise personal jyotishi.

GROUND RULES:
- VOICE: Speak only as the app's astrologer. NEVER refer to yourself as an AI, a model, a bot, an assistant, or software; never say your answer was "generated". Do not mention technology at all — just give the reading.
- SCOPE (very important): You ONLY help with Vedic astrology & this app's topics — the user's kundli/horoscope/rashifal, planets/dashas/yogas/doshas, Sade Sati & transits, panchang/muhurat, remedies/upaay, numerology/mulank, kundli matching, baby names, festivals, mantras & spirituality. If the question is OFF-TOPIC (e.g. product/mobile prices like iPhone, shopping, general knowledge, news, sports, politics, coding, math, current affairs, or anything NOT about astrology/spirituality), DO NOT answer it and DO NOT make something up. Instead, in the user's language, warmly decline in 1-2 sentences — say you are the app's Vedic astrologer and can only help with jyotish/kundli matters — and invite them to ask an astrology question (suggest 1-2 examples like "aaj ka rashifal" or "mera career kaisa rahega"). For an off-topic question return ONLY: a polite redirect in "answer", empty "sections" [], empty "remedies" [], a couple of astrology "followUpQuestions", and confidence 0.3. Stay on scope no matter how the question is phrased.
- Use ONLY the real Vedic chart / Panchang / transit data in "REAL ASTRO CONTEXT JSON" below as the astrological ground source. Never invent or change any chart fact.
- NEVER recompute or guess the Lagna (Ascendant), planet houses, Moon sign, or Saturn status yourself. They are pre-computed below from a precise ephemeris. Use them verbatim.
- If a required data point is missing/null, say it is unavailable instead of inventing it.
- Do not claim guaranteed accuracy, medical diagnosis, or fixed destiny. Be practical, spiritual, culturally respectful.
- Keep JSON keys in English.
- NEVER reveal anything technical/internal to the user: do NOT mention "JSON", "data", "context", "field", "not provided to me", "system", code, or any error. You are a human jyotishi, not a program. If something is genuinely NOT in the data, do NOT guess and do NOT expose it as an error — instead warmly say (in the user's language) that for that specific detail you'd need a bit more (e.g. exact birth time/place) or that it isn't part of this reading, and give whatever you CAN from the real data.

DIRECT-ANSWER RULES (the user hates vague replies — answer the EXACT question first):
1. SATURN / SADE SATI / SHANI / DHAIYA / "shani kab lagega/utrega/khatam hoga": Use the "saturnStatus" object as the ONLY source of truth. CRITICAL — DO NOT CONFUSE TWO DIFFERENT THINGS: (a) SADE SATI / DHAIYA is Saturn's TRANSIT (gochar) over the 12th/1st/2nd (or 4th/8th) sign from the natal Moon (~7.5 yrs) — its dates live ONLY in saturnStatus.currentSadeSati / nextSadeSati. (b) The SHANI MAHADASHA is a completely separate Vimshottari dasha period (in dashaTimeline) and has NOTHING to do with Sade Sati dates. If the user asks about SADE SATI, answer ONLY with the Sade Sati transit window from saturnStatus — NEVER answer a Sade Sati question with the Shani Mahadasha years (e.g. do not say Sade Sati ends in 2040 just because the Saturn mahadasha does). State plainly in the FIRST 1-2 sentences: the natal Moon sign, Saturn's CURRENT transit sign, and the exact status. ABSOLUTE DATE RULE (to avoid wrong info): you may ONLY use the dates in saturnStatus.currentSadeSati and saturnStatus.nextSadeSati VERBATIM. NEVER calculate, estimate, round or invent ANY Sade Sati / Dhaiya date yourself. — If saturnStatus.sadeSatiActive is true: say Sade Sati is running and give its window from "currentSadeSati" (e.g. "from X to Y"). — If sadeSatiActive is false but dhaiyaActive is true: clearly say this is SHANI DHAIYA (small panoti), NOT Sade Sati, and that the NEXT Sade Sati is "nextSadeSati". — If both are false: say neither is running now and the next Sade Sati is "nextSadeSati". — If a needed date field is null/missing: say you don't have that exact date here and suggest checking the Kundli's Sade Sati / transit section — do NOT make up a date. Never say "it varies" or give only theory.
2. DASHA / "kab" timing questions: Use "dashaTimeline" — name the exact mahadasha lord(s) and their start–end dates that answer the question.
3. ALWAYS state the user's Lagna (ascendant) and Moon sign correctly from the context whenever relevant; never omit or alter them.
4. MULANK / NUMEROLOGY ("mera mulank/bhagyank kya hai", lucky number): use the "numerology" object ONLY — mulank = numerology.psychic (reduced day-of-birth), bhagyank = numerology.destiny (reduced full DOB). State the number + its meaning. NEVER guess a number; if numerology is null, warmly say you need the exact birth date.
5. Always directly answer what was asked in the first 2 sentences, THEN explain.

USER QUESTION:
${question}

REAL ASTRO CONTEXT JSON:
${JSON.stringify({
  name: ctx.name,
  birth: ctx.birth,
  ascendant: ctx.ascendant,
  moonSign: ctx.moonSign,
  currentMahadasha: ctx.dasha,
  dashaTimeline: dashaList,
  yogas: ctx.yogas,
  doshas: ctx.doshas,
  planets: ctx.planets,
  saturnStatus,
  currentTransits,
  numerology, // mulank (psychic/day number) + bhagyank (destiny/full-DOB number) — deterministic
  today: ctx.today,
  vargaCharts: vargaContext,
}, null, 2)}

${writeIn(lang)}
WRITING STYLE — give TWO LAYERS for every point (MANY users have ZERO astrology knowledge, so always explain in plain words too):
- "answer": warm, DIRECT 4-6 sentences. First directly answer the exact question (apply DIRECT-ANSWER RULES) in SIMPLE everyday language a non-technical person instantly understands, then reassure.
- "sections": 3 to 6 well-titled sections. EACH section's "text" MUST do BOTH, in this order:
   (a) TECHNICAL BASIS — name the exact astrological factor used (which graha / house / sign / yoga / transit / dasha) — the precise reason.
   (b) SIMPLE MEANING — then re-explain the SAME thing in very easy, everyday words, starting that part on a new line with "${lang === 'hi' ? 'आसान भाषा में:' : 'In simple words:'}" so someone with no astrology knowledge fully understands what it means for their real life.
- "vedastroBasis" (internal key): short PRECISE calculation facts actually used (e.g. "Saturn transit Pisces = 8th from Moon (Leo) → Dhaiya"), bullet style. Never mention any provider, API, or brand name.
- Be warm, encouraging, practical. NEVER leave jargon without its simple explanation.
Return STRICT JSON only:
{
 "answer":"warm personal 4-6 sentence summary that DIRECTLY answers the question first",
 "sections":[{"title":"short heading","text":"2-4 sentence explanation that names the actual chart factor used"}],
 "vedastroBasis":["bullet-like facts used from the chart context"],
 "remedies":[{"title":"optional remedy","body":"simple practical steps","timing":"best timing","mantra":"optional mantra"}],
 "followUpQuestions":["3-4 useful next questions"],
 "confidence":<0.4-0.95>,
 "sourceNote":"short note: based on precise chart/panchang data (do NOT mention AI or provider/API names)"
}`;
    const out = await callAI(prompt, { json: true });
    return ensureAskShape(out, ctx, question, lang);
  });
}

// ── 2) KEY INSIGHTS (natal — stable, birth se cache) ──
async function generateInsights(input) {
  const lang = langOf(input);
  const key = `insights|v3|${birthSig(input)}|${lang}`;
  return cached(key, 'insights', async () => {
    const ctx = await buildContext(input);
    const prompt = `You are an expert Vedic astrologer. Using ONLY this real birth-chart data, write 5 concise KEY INSIGHTS about the person.

- Ascendant: ${ctx.ascendant}
- Moon sign: ${ctx.moonSign}
- Planets: ${ctx.planets.map((p) => `${p.planet} in ${p.sign} (house ${p.house || '?'}, nakshatra ${p.nakshatra || 'n/a'})`).join('; ')}
- Yogas: ${ctx.yogas.map((y) => y.name).join(', ') || 'none'}
- Doshas present: ${ctx.doshas.map((d) => `${d.name}: ${d.detail || d.tag || 'present'}`).join('; ') || 'none'}

Each insight: a short title + 1 specific sentence grounded in the data above. ${writeIn(lang)}
Return STRICT JSON: {"insights":[{"title":"...","text":"..."}, ... 5 items]}`;
    const out = await callAI(prompt, { json: true });
    return out.insights || [];
  });
}

// ── 3) CHOGHADIYA SPECIAL MESSAGE (period ke hisaab se badalta — time-dynamic) ──
async function generateChoghadiyaMessage(input, { period, quality }) {
  const lang = langOf(input);
  const key = `chog|v3|${birthSig(input)}|${todayStr()}|${period}|${lang}`;
  return cached(key, 'choghadiya', async () => {
    let moonSign = null;
    try { const k = await getKundli(input); moonSign = k.data && k.data.moonSign; } catch (_) {}
    const prompt = `You are a Vedic astrologer. The current Choghadiya period is "${period}" (quality: ${quality}). The user's Moon sign is ${moonSign || 'unknown'}.
Write ONE warm, practical 1-2 sentence message: what this period is good/bad for RIGHT NOW, personalised lightly to the moon sign. ${writeIn(lang)}
Return STRICT JSON: {"message":"..."}`;
    const out = await callAI(prompt, { json: true });
    return { message: out.message, period, moonSign };
  });
}

// ── MUHURAT FINDER — best upcoming Choghadiya window for a user's activity ──
// Grounded on today's REAL periods (passed from client). AI picks + explains; deterministic fallback.
async function generateMuhuratPick({ activity, periods, lang }) {
  const L = lang === 'hi' ? 'hi' : 'en';
  const act = asText(activity);
  if (!act) { const e = new Error('activity required'); e.status = 400; throw e; }
  const list = (Array.isArray(periods) ? periods : []).filter((p) => p && p.name).slice(0, 12);
  if (!list.length) { const e = new Error('periods required'); e.status = 400; throw e; }
  const key = `muhurat|v1|${act.toLowerCase()}|${list.map((p) => `${p.name}:${p.nature || ''}`).join(',')}|${L}`;
  return cached(key, 'muhurat-pick', async () => {
    const lines = list.map((p) => `${p.name} (${p.time || ''}, ${p.nature || 'neutral'})`).join('; ');
    const prompt = `You are a Vedic Muhurat (auspicious timing) expert. The user wants to do this activity: "${act}".
Choose the SINGLE best window from today's upcoming Choghadiya periods below. Follow classical Choghadiya tradition: Amrit, Shubh and Labh are auspicious for most good work; Char suits travel/movement; avoid Rog, Kaal and Udveg. Pick from the listed periods only.
PERIODS: ${lines}
${writeIn(L)}
Return STRICT JSON: {"period":"<exactly one period name from the list>","reason":"1-2 warm sentences why this window suits the activity"}`;
    const out = await callAI(prompt, { json: true }).catch(() => null);
    const names = list.map((p) => p.name);
    const pick = out && names.includes(asText(out.period)) ? asText(out.period) : null;
    if (!pick) {
      const good = list.find((p) => (p.nature || '') === 'good') || list[0];
      return {
        period: good.name,
        reason: L === 'hi' ? `"${act}" के लिए यह आने वाला सबसे शुभ चौघड़िया समय है।` : `This is the next most auspicious Choghadiya window for "${act}".`,
        aiAssisted: false, source: 'local', _fallback: true,
      };
    }
    return { period: pick, reason: asText(out.reason), aiAssisted: true, source: 'ai' };
  });
}

// ── 4) GENERIC VERSE EXPLANATION (kisi bhi book ke shlok/chand ka Hindi me) ──
// Mool paath Gemini ko dekar: saral Hindi anuvad + kahani (katha) jaisa explanation + jeevan ki seekh.
// Reusable — Ramcharitmanas, Gita, Valmiki Ramayan, aur aage saari books ke liye ek hi engine.
// Cache: book-specific key se (content fixed — ek baar generate, hamesha reuse).
async function generateVerseExplanation({ cacheKey, book, refLabel, sourceText, sourceScript, hint, lang }) {
  const en = lang === 'en';
  // English cache is a separate key so existing Hindi caches stay valid.
  const key = en ? `${cacheKey}|en` : cacheKey;
  return cached(key, 'verse-explain', async () => {
    const prompt = en
      ? `You are a learned commentator and a warm, gifted storyteller for ${book}.
Below is ${refLabel} (original text in ${sourceScript}):

"""
${sourceText}
"""
Explain this text in simple, clear English so that even a complete beginner who knows nothing about it understands easily. Do not invent anything — base everything only on this text.
- "anuvad": a simple English meaning/translation of this text (2-4 sentences).
- "katha": explain the scene like a short, vivid story — the context, the feeling and the imagery, as if a loving storyteller is narrating it (3-5 sentences).
- "seekh": what lesson we learn from this for our own life — practical and inspiring, with a tiny everyday example (2-3 sentences).
Explain any hard spiritual/Sanskrit term in plain everyday English with a small example. Write ONLY in English.
Return STRICT JSON: {"anuvad":"...","katha":"...","seekh":"..."}`
      : `तुम ${book} के विद्वान व्याख्याकार और कुशल कथावाचक हो।
नीचे ${refLabel} दिया गया है (${sourceScript} में मूल पाठ):

"""
${sourceText}
"""
${hint ? `\nसंदर्भ हेतु (केवल तुम्हारी सहायता के लिए, इसे दोहराना नहीं) अंग्रेज़ी भावार्थ: ${hint}\n` : ''}
इस पाठ का सरल, शुद्ध हिंदी (केवल देवनागरी) में वर्णन करो। कुछ मत बनाओ — केवल इसी पाठ के आधार पर लिखो।
- "anuvad": इस पाठ का सरल हिंदी अनुवाद/अर्थ (2-4 वाक्य), जैसे आम पाठक को आसानी से समझ आए।
- "katha": इस प्रसंग को एक छोटी, रोचक कहानी/कथा की तरह सरल भाषा में समझाओ — संदर्भ, भाव और दृश्य ऐसे कि पाठक को लगे जैसे कोई कथावाचक प्रेम से समझा रहा हो (3-5 वाक्य)।
- "seekh": इस पाठ से हमें जीवन में क्या शिक्षा/सीख मिलती है — व्यावहारिक और प्रेरक (2-3 वाक्य)।
${SIMPLIFY_SCRIPTURE_HI}
केवल शुद्ध हिंदी देवनागरी में लिखो, रोमन/अंग्रेज़ी अक्षर मत डालो (अनिवार्य संज्ञाओं/नामों को छोड़कर)। JSON keys अंग्रेज़ी में रखो।
STRICT JSON लौटाओ: {"anuvad":"...","katha":"...","seekh":"..."}`;
    const out = await callAI(prompt, { json: true });
    return { anuvad: out.anuvad || '', katha: out.katha || '', seekh: out.seekh || '', aiAssisted: true };
  });
}

// Ramcharitmanas (Tulsidas) — kand + chand number
function generateRcmExplanation({ kandaOrder, kandaHindi, number, type, text }) {
  return generateVerseExplanation({
    cacheKey: `rcm|v2|${kandaOrder}|${number}`,
    book: 'श्रीरामचरितमानस (गोस्वामी तुलसीदास)',
    refLabel: `${kandaHindi} का ${type || 'पद'} (क्रमांक ${number})`,
    sourceText: text,
    sourceScript: 'अवधी/हिंदी',
  });
}

// Bhagavad Gita — adhyay + shlok
function generateGitaExplanation({ chapter, verse, chapterName, sanskrit, english }) {
  return generateVerseExplanation({
    cacheKey: `gita|explain|v1|${chapter}|${verse}`,
    book: 'श्रीमद्भगवद्गीता',
    refLabel: `अध्याय ${chapter}${chapterName ? ` (${chapterName})` : ''} का श्लोक ${chapter}.${verse}`,
    sourceText: sanskrit,
    sourceScript: 'संस्कृत',
    hint: english,
  });
}

// Valmiki Ramayan — kanda + sarga + shloka
function generateRamayanExplanation({ kandaOrder, kandaName, sarga, shloka, sanskrit, english }) {
  return generateVerseExplanation({
    cacheKey: `ramayan|explain|v1|${kandaOrder}|${sarga}|${shloka}`,
    book: 'वाल्मीकि रामायण',
    refLabel: `${kandaName || `कांड ${kandaOrder}`} के सर्ग ${sarga} का श्लोक ${shloka}`,
    sourceText: sanskrit,
    sourceScript: 'संस्कृत',
    hint: english,
  });
}

// Rigveda — mandala + sukta + mantra
function generateRigvedaExplanation({ mandala, sukta, verse, sanskrit, english }) {
  return generateVerseExplanation({
    cacheKey: `rigveda|explain|v1|${mandala}|${sukta}|${verse}`,
    book: 'ऋग्वेद',
    refLabel: `मंडल ${mandala}, सूक्त ${sukta} का मंत्र ${mandala}.${sukta}.${verse}`,
    sourceText: sanskrit,
    sourceScript: 'संस्कृत (वैदिक)',
    hint: english,
  });
}

// Generic Veda (Yajur/Sama/Atharva) — bookLabel/sectionLabel display ke saath
const VEDA_HI = { yajurveda: 'यजुर्वेद', samaveda: 'सामवेद', atharvaveda: 'अथर्ववेद', mahabharata: 'महाभारत', upanishads: 'उपनिषद्', 'hanuman-chalisa': 'श्री हनुमान चालीसा' };
const VEDA_EN = { 'hanuman-chalisa': 'the Hanuman Chalisa (by Goswami Tulsidas)' };
function generateVedaExplanation({ veda, book, section, verse, sanskrit, english, lang }) {
  const en = lang === 'en';
  const name = en ? (VEDA_EN[veda] || VEDA_HI[veda] || veda) : (VEDA_HI[veda] || veda);
  const isChalisa = veda === 'hanuman-chalisa';
  const script = isChalisa ? (en ? 'Awadhi/Hindi' : 'अवधी/हिंदी') : (en ? 'Sanskrit' : 'संस्कृत');
  const unit = isChalisa ? (en ? 'verse' : 'चौपाई/दोहा') : (veda === 'mahabharata' ? 'श्लोक' : 'मंत्र');
  return generateVerseExplanation({
    lang,
    cacheKey: `veda|explain|v1|${veda}|${book}|${section}|${verse}`,
    book: name,
    refLabel: en ? `verse ${verse} of ${name}` : `${name} — ${book}.${section}.${verse} (${unit})`,
    sourceText: sanskrit,
    sourceScript: script,
    hint: english,
  });
}

// ── DAILY SPIRITUAL BOOST — shlok ka complete, saral, jeevan-upyogi explanation ──
// anuvad + vistrut vyakhya + aaj ke jeevan me upyog + ek line sandesh. Cache: shlok id se.
async function generateDailyShlokaExplain({ id, book, refLabel, sanskrit, english }) {
  return cached(`dailyshlok|v1|${id}`, 'daily-shlok', async () => {
    const prompt = `तुम एक प्रिय, ज्ञानी आध्यात्मिक गुरु हो जो आम लोगों को सरल भाषा में शास्त्र समझाते हो।
नीचे ${book} का श्लोक (${refLabel}) दिया गया है:

संस्कृत: """${sanskrit}"""
${english ? `English (संदर्भ हेतु): ${english}` : ''}

इस श्लोक को इस तरह समझाओ कि एक आम व्यक्ति को भी गहराई से समझ आए और वह आज अपने जीवन में कुछ नया सीखे। केवल इसी श्लोक के आधार पर, कुछ मत बनाओ।
- "anuvad": श्लोक का सरल, स्पष्ट हिंदी अर्थ (2-3 वाक्य)।
- "vyakhya": विस्तृत व्याख्या — इसका गहरा भाव, संदर्भ और संदेश सरल भाषा में (4-6 वाक्य)। ऐसे जैसे गुरु प्रेम से समझा रहे हों।
- "jeevanUpyog": आज के दैनिक जीवन में इसे कैसे अपनाएँ — व्यावहारिक, सम्बन्धित उदाहरणों के साथ (3-5 वाक्य)।
- "seekh": आज का एक पंक्ति का प्रेरक संदेश/सीख।
${SIMPLIFY_SCRIPTURE_HI}
केवल शुद्ध हिंदी देवनागरी में लिखो (अनिवार्य नामों को छोड़कर), रोमन अक्षर मत डालो। JSON keys अंग्रेज़ी में।
STRICT JSON लौटाओ: {"anuvad":"...","vyakhya":"...","jeevanUpyog":"...","seekh":"..."}`;
    const out = await callAI(prompt, { json: true });
    return {
      anuvad: out.anuvad || '', vyakhya: out.vyakhya || '',
      jeevanUpyog: out.jeevanUpyog || '', seekh: out.seekh || '', aiAssisted: true,
    };
  });
}

// ── KUNDLI MILAN — Gun Milan ka simple-language verdict + strengths/cautions/advice ──
// Numbers (gunMilan.js) authoritative hain; AI sirf inhe aasaan, warm bhasha me samjhata hai.
async function generateMatchExplanation({ milan, mangal, people, lang }) {
  const L = lang === 'hi' ? 'hi' : 'en';
  const b = people.boy || {}; const g = people.girl || {};
  const key = `match|v1|${b.nakshatra}.${b.rashi}.${b.mangal ? 1 : 0}|${g.nakshatra}.${g.rashi}.${g.mangal ? 1 : 0}|${L}`;
  return cached(key, 'match-explain', async () => {
    const kootaLines = (milan.kootas || [])
      .map((k) => `${k.label}: ${k.got}/${k.max} (boy ${k.boy || '-'}, girl ${k.girl || '-'})`)
      .join('; ');
    const prompt = `You are a kind, experienced Vedic astrologer explaining a marriage Kundli-Milan (Ashtakoot Gun Milan) result to a common family in VERY SIMPLE words. Use ONLY the real data below — do not invent numbers.

TOTAL GUNA: ${milan.total} out of 36 (${milan.percent}%), classical verdict tier: ${milan.verdict}.
KOOTA BREAKDOWN: ${kootaLines}
MANGAL (Manglik) DOSHA: boy=${mangal.boy ? 'yes' : 'no'}, girl=${mangal.girl ? 'yes' : 'no'} → ${mangal.compatible ? 'compatible' : 'needs attention'} (${mangal.severity}).
Boy: Moon nakshatra ${b.nakshatraName || '-'}, Rashi ${b.moonSign || '-'}. Girl: Moon nakshatra ${g.nakshatraName || '-'}, Rashi ${g.moonSign || '-'}.

Explain warmly and practically (not scary, not blindly positive — honest and balanced). ${writeIn(L)}
- "verdict": ONE short line — overall compatibility in simple words (e.g. a good/average/strong match) referencing the ${milan.total}/36 score.
- "summary": 3-4 simple sentences — what this score means for the couple's life together, grounded in the koota breakdown above.
- "strengths": array of 2-4 short points — the areas where they match well (name the relevant koota in simple words, e.g. mental bond, nature, health/progeny).
- "cautions": array of 1-3 short points — areas to be mindful of (low-scoring kootas, Nadi/Bhakoot/Mangal if relevant). If everything is fine, give gentle general advice instead.
- "advice": ONE practical, hopeful sentence on how to make the relationship work (and note that an astrologer can suggest remedies if needed).
Return STRICT JSON: {"verdict":"...","summary":"...","strengths":["..."],"cautions":["..."],"advice":"...",${saralField(L)}}`;
    const out = await callAI(prompt, { json: true });
    return {
      verdict: asText(out.verdict),
      summary: asText(out.summary),
      strengths: asList(out.strengths).map(asText).filter(Boolean).slice(0, 4),
      cautions: asList(out.cautions).map(asText).filter(Boolean).slice(0, 3),
      advice: asText(out.advice),
      saralVivaran: asText(out.saralVivaran),
      aiAssisted: true,
    };
  });
}

// ── GOCHAR (Transits) — abhi ke major grah-gochar ka simple matlab ──
async function generateGocharExplanation({ transits, natalMoonSign, sadeSati, lang }) {
  const L = lang === 'hi' ? 'hi' : 'en';
  const key = `gochar|v1|${natalMoonSign}|${todayStr()}|${L}`;
  return cached(key, 'gochar-explain', async () => {
    const major = (transits || []).filter((t) => ['Saturn', 'Jupiter', 'Rahu', 'Ketu'].includes(t.planet));
    const lines = major.map((t) => `${t.planet} in ${t.sign} (house ${t.houseFromMoon || '?'} from Moon${t.isRetrograde === 'True' ? ', retrograde' : ''})`).join('; ');
    const sade = sadeSati && sadeSati.active ? `Sade Sati ACTIVE — ${sadeSati.phase}.` : (sadeSati && sadeSati.dhaiya ? 'Shani Dhaiya (small panoti) active.' : 'No Sade Sati currently.');
    const prompt = `You are a kind Vedic astrologer explaining the person's CURRENT planetary transits (gochar) in VERY SIMPLE words. Natal Moon sign: ${natalMoonSign}. ${sade}
Major transits now: ${lines || 'n/a'}.

Explain what is happening for this person RIGHT NOW, grounded ONLY in the data above (Chandra-based gochar). Be honest, calm and practical — not scary. ${writeIn(L)}
- "summary": 3-4 simple sentences — the overall current planetary weather for this person and what to focus on.
- "highlights": array of 2-4 items, each {"planet":"Saturn/Jupiter/Rahu/Ketu","text":"1 simple sentence on what THIS transit means for them now"}.
- "advice": ONE practical, hopeful sentence (mention an astrologer can suggest remedies if a hard transit like Sade Sati is on).
Return STRICT JSON: {"summary":"...","highlights":[{"planet":"...","text":"..."}],"advice":"...",${saralField(L)}}`;
    const out = await callAI(prompt, { json: true });
    return {
      summary: asText(out.summary),
      highlights: asList(out.highlights).map((h) => ({ planet: asText(h && h.planet), text: asText(h && h.text) })).filter((h) => h.text).slice(0, 4),
      advice: asText(out.advice),
      saralVivaran: asText(out.saralVivaran),
      aiAssisted: true,
    };
  });
}

// ── REMEDIES (Upaay) — simple "why+how" + scripture-grounded encouragement ──
async function generateRemediesExplanation({ remedies, ascendant, moonSign, doshas, sadeSati, lang }) {
  const L = lang === 'hi' ? 'hi' : 'en';
  const present = (doshas || []).filter((d) => d.present).map((d) => d.name);
  if (sadeSati && sadeSati.active) present.push('Sade Sati');
  else if (sadeSati && sadeSati.dhaiya) present.push('Shani Dhaiya');
  const gem = remedies && remedies.lifeGem;
  const key = `remedies|v1|${ascendant}|${present.join(',')}|${L}`;
  return cached(key, 'remedies-explain', async () => {
    const prompt = `You are a wise, kind Vedic astrologer + spiritual guide. Explain this person's remedies (upaay) in VERY SIMPLE words, grounded ONLY in the data below. Ascendant: ${ascendant}, Moon sign: ${moonSign}.
Life gemstone (Lagna lord): ${gem ? `${gem.gemstone} for ${gem.planet}` : 'n/a'}.
Doshas/conditions present: ${present.length ? present.join(', ') : 'none major'}.

Be honest and reassuring — remedies SUPPORT, but self-effort (karma) and good conduct matter most. ${writeIn(L)}
- "summary": 2-3 simple sentences — overall guidance on how remedies help this specific chart.
- "gemWhy": 1-2 simple sentences — why this gemstone suits them (Lagna lord). If no gem, return "".
- "scriptureNote": 1-2 sentences — a relevant teaching from the Bhagavad Gita or Ramayan about faith + self-effort (e.g. karma yoga), tying it to using remedies with sincerity. Keep it authentic and simple.
- "advice": ONE practical, hopeful sentence (note that a gemstone should be worn only after consulting an astrologer).
Return STRICT JSON: {"summary":"...","gemWhy":"...","scriptureNote":"...","advice":"...",${saralField(L)}}`;
    const out = await callAI(prompt, { json: true });
    return {
      summary: asText(out.summary), gemWhy: asText(out.gemWhy),
      scriptureNote: asText(out.scriptureNote), advice: asText(out.advice),
      saralVivaran: asText(out.saralVivaran), aiAssisted: true,
    };
  });
}

// ── WEEKLY / MONTHLY / YEARLY RASHIFAL (period-scaled richness; chart+dasha+transit grounded) ──
function isoWeekKey(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((t - ys) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-W${wk}`;
}
async function generatePeriodPrediction(input, periodIn) {
  const lang = langOf(input);
  const period = ['week', 'month', 'year'].includes(periodIn) ? periodIn : 'week';
  const now = new Date();
  const bucket = period === 'year' ? `${now.getFullYear()}` : period === 'month' ? `${now.getFullYear()}-${pad2(now.getMonth() + 1)}` : isoWeekKey(now);
  const key = `period|v1|${period}|${birthSig(input)}|${bucket}|${lang}`;
  return cached(key, 'period-pred', async () => {
    const ctx = await buildContext(input);
    const meta = period === 'year'
      ? { label: 'YEARLY (next 12 months)', hl: '6-8', hlWhat: 'major phases / month-by-month highlights', sent: '5-7', areaSent: '4-5', extra: '"phases":[{"title":"period e.g. Jan-Mar 2026","text":"3-4 sentences"} — 4-6 items covering the whole year], "majorDates":["4-6 important date ranges with one-line significance (festivals, dasha shifts, eclipses if known)"],' }
      : period === 'month'
        ? { label: 'MONTHLY (this month)', hl: '4-6', hlWhat: 'key dates / phases this month', sent: '4-5', areaSent: '3', extra: '"phases":[{"title":"early / mid / late month","text":"2-3 sentences"} — 3-4 items], "majorDates":["3-5 key dates this month with significance"],' }
        : { label: 'WEEKLY (next 7 days)', hl: '3-5', hlWhat: 'best days this week', sent: '4-5', areaSent: '3', extra: '"bestDays":["2-3 best days with one-line reason"],' };
    const prompt = `You are an expert Vedic astrologer for the Shree Yantra app. Build a ${meta.label} RASHIFAL for ${ctx.name}.
Use ONLY the real astrological data below (chart, current dasha, current transits, panchang). Do NOT invent planet positions, dasha, yogas or doshas. Be practical, kind and non-fatalistic; remedies are optional spiritual practices.
This is a ${meta.label} outlook — give RICHER, deeper detail than a one-day horoscope.

REAL DATA JSON:
${JSON.stringify({ name: ctx.name, ascendant: ctx.ascendant, moonSign: ctx.moonSign, dasha: ctx.dasha, yogas: ctx.yogas, doshas: ctx.doshas, planets: ctx.planets, today: ctx.today }, null, 2)}

${writeIn(lang)}
Return STRICT JSON only. Area titles EXACTLY "Love","Career","Finance","Health".
{
 "headline":"short 4-8 word highlight for this ${period}",
 "overall":"${meta.sent} sentence overall outlook for this ${period}",
 "areas":[{"title":"Love","score":<50-95>,"text":"${meta.areaSent} sentences","action":"one practical action"},{"title":"Career","score":<50-95>,"text":"${meta.areaSent} sentences","action":"one action"},{"title":"Finance","score":<50-95>,"text":"${meta.areaSent} sentences","action":"one action"},{"title":"Health","score":<50-95>,"text":"${meta.areaSent} sentences","action":"one action"}],
 ${meta.extra}
 "highlights":[${meta.hl} items as {"label":"...","text":"..."} — ${meta.hlWhat}],
 "remedies":[{"title":"remedy","body":"why & how simply","priority":"high|medium|low"}],
 "advice":"one key guidance line for this ${period}",
 ${saralField(lang)},
 "sourceNote":"short note (do NOT mention AI)"
}`;
    let out; let aiFailed = false;
    try { out = await callAI(prompt, { json: true }); }
    catch (e) { out = {}; aiFailed = true; }
    const fallbackOverall = lang === 'hi'
      ? `${ctx.moonSign || 'आपकी'} राशि के लिए यह ${period === 'year' ? 'वर्ष' : period === 'month' ? 'महीना' : 'सप्ताह'} संतुलित रहेगा। विस्तृत विवरण थोड़ी देर में उपलब्ध होगा।`
      : `A balanced ${period} ahead for your chart. The detailed reading will be available shortly.`;
    return {
      period, range: bucket,
      ...(aiFailed ? { _fallback: true } : {}),
      headline: asText(out.headline),
      overall: asText(out.overall) || (aiFailed ? fallbackOverall : ''),
      areas: asList(out.areas).map((a) => ({ title: asText(a && a.title), score: clampPct(a && a.score), text: asText(a && a.text), action: asText(a && a.action) })).filter((a) => a.title),
      phases: asList(out.phases).map((p) => ({ title: asText(p && p.title), text: asText(p && p.text) })).filter((p) => p.text),
      bestDays: asList(out.bestDays).map(asText).filter(Boolean),
      majorDates: asList(out.majorDates).map(asText).filter(Boolean),
      highlights: asList(out.highlights).map((h) => ({ label: asText(h && h.label), text: asText(h && h.text) })).filter((h) => h.text),
      remedies: asList(out.remedies).map((r) => ({ title: asText(r && r.title), body: asText(r && r.body), priority: asText(r && r.priority) })).filter((r) => r.title),
      advice: asText(out.advice),
      saralVivaran: asText(out.saralVivaran),
      sourceNote: asText(out.sourceNote) || 'Based on your precise birth chart, dasha and transits.',
      aiAssisted: true,
    };
  });
}

// ── TRADITIONAL READING — warm grounded summary over the classical phala (predictions stay authentic) ──
async function generateTraditionalReading({ janma, predictions, ascendant, moonSign, lang }) {
  const L = lang === 'hi' ? 'hi' : 'en';
  const key = `reading|v1|${ascendant}|${moonSign}|${(predictions || []).length}|${L}`;
  return cached(key, 'reading-summary', async () => {
    const list = (predictions || []).map((p) => `${p.category}: ${p.title && (L === 'hi' ? p.title.hi : p.title.en)}`).join('; ');
    const prompt = `You are a kind, learned Vedic astrologer. A classical phala-kathan engine (BPHS/Phaldeepika/Mansagari) has produced the authentic findings below for a native (Lagna ${ascendant}, Moon ${moonSign}, Gana ${janma && janma.gana && janma.gana.en}, Yoni ${janma && janma.yoni && janma.yoni.en}, Nadi ${janma && janma.nadi && janma.nadi.en}${janma && janma.gandmool && janma.gandmool.present ? ', Gandmool present' : ''}).
Classical findings: ${list || 'general chart'}.

Write a warm, premium, NON-fatalistic introduction that ties these together — do NOT invent new predictions, only synthesize the findings above. ${writeIn(L)}
- "summary": 4-6 sentences — an encouraging overview of this person's chart blending personality, key strength and life direction (grounded in the findings).
- "advice": ONE practical, hopeful guidance line.
Return STRICT JSON: {"summary":"...","advice":"...",${saralField(L)}}`;
    const out = await callAI(prompt, { json: true });
    return { summary: asText(out.summary), advice: asText(out.advice), saralVivaran: asText(out.saralVivaran), aiAssisted: true };
  });
}

// ── DASHA PHALA — per mahadasha-lord: effect + do/avoid + remedy, grounded on chart placement ──
async function generateDashaPhala({ lang, ascendant, moonSign, periods }) {
  const L = lang === 'hi' ? 'hi' : 'en';
  const lords = (periods || []).map((p) => p.lord);
  const key = `dashaphala|v1|${ascendant}|${moonSign}|${lords.join('')}|${L}`;
  return cached(key, 'dasha-phala', async () => {
    const lines = (periods || []).map((p) => `${p.lord}: in house ${p.house || '?'} (${p.sign || '?'}), dignity ${p.dignity}, period age ${p.fromAge}-${p.toAge}, nature ${p.nature}`).join('\n');
    const prompt = `You are an expert Vedic astrologer. For a native with Lagna ${ascendant} and Moon ${moonSign}, explain each Vimshottari Mahadasha period below. Base each reading STRICTLY on that planet's actual house, sign and dignity given (this is the "why"/proof). Be practical, balanced, non-fatalistic.

PERIODS (planet : placement : nature):
${lines}

${writeIn(L)}
For EACH planet return: "effect" (2-3 sentences on what this multi-year period brings for THIS person, citing the house/sign), "good" (one key benefit / what to do), "caution" (one risk / what to avoid), "remedy" (one simple remedy).
Return STRICT JSON: an object keyed by planet name, e.g. {"Venus":{"effect":"...","good":"...","caution":"...","remedy":"..."}, "Sun":{...}, ...} — include every planet listed above. ALSO add ONE extra top-level key (alongside the planet keys): ${saralField(L)} — a simple overall explanation of the person's whole dasha (life-period) journey for a complete beginner.`;
    const out = await callAI(prompt, { json: true });
    const res = {};
    (periods || []).forEach((p) => {
      const o = out && out[p.lord];
      if (o) res[p.lord] = { effect: asText(o.effect), good: asText(o.good), caution: asText(o.caution), remedy: asText(o.remedy) };
    });
    res.saralVivaran = asText(out && out.saralVivaran);
    return res;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// NAME ENGINE (industry-standard) — one core that powers both the general name
// explorer and the chart-based Naamkaran. Filters: gender, startWith
// (string | array of letters/syllables), origin/religion, theme (meaning),
// lengthPref, words (combine), count, candidate + astrology seed (nakshatra,
// rashi) for the "why" badge. Numerology per name is computed in CODE
// (numerology.js) — NEVER AI — so each name's lucky number/stone/colour card is
// deterministic and trustworthy. AI only supplies name + meaning + origin + script.
// ═══════════════════════════════════════════════════════════════════════════
const normGender = (gender) => {
  const s = (gender || '').toLowerCase();
  if (s.startsWith('f') || s.startsWith('g') || s.startsWith('ल')) return 'girl';
  if (s.startsWith('m') || s.startsWith('b') || s.startsWith('ल')) return 'boy';
  return s.startsWith('girl') ? 'girl' : s.startsWith('boy') ? 'boy' : 'any';
};

function numerologyCard(name) {
  const n = nameNumerology(name);
  if (!n) return null;
  return {
    number: n.nameNumber, luckyNumber: n.luckyNumber,
    planet: n.planet, planetHi: n.planetHi,
    color: n.color, colorHi: n.colorHi,
    stone: n.stone, stoneHi: n.stoneHi,
    metal: n.metal, metalHi: n.metalHi,
    day: n.day, dayHi: n.dayHi,
    supporting: n.supporting,
  };
}

function enrichName(n) {
  const name = asText(n && n.name);
  if (!name) return null;
  return {
    name,
    nameHi: asText(n && (n.nameHi || n.hi)) || null, // curated dataset uses `hi`
    meaning: asText(n && n.meaning),
    meaningHi: asText(n && n.meaningHi) || null,
    origin: asText(n && n.origin) || null,
    gender: asText(n && n.gender) || null,
    pronunciation: asText(n && n.pronunciation) || null,
    themes: asList(n && n.themes).map(asText).filter(Boolean).slice(0, 3),
    letterCount: name.replace(/[^A-Za-z]/g, '').length || name.length,
    numerology: numerologyCard(name),
  };
}

async function generateNames(filters = {}) {
  const L = filters.lang === 'hi' ? 'hi' : 'en';
  const g = normGender(filters.gender);
  const startArr = (Array.isArray(filters.startWith) ? filters.startWith : (filters.startWith ? [filters.startWith] : []))
    .map((s) => String(s).trim()).filter(Boolean);
  const startWith = startArr.join('", "');
  const origin = asText(filters.origin);
  const theme = asText(filters.theme);
  const words = asText(filters.words);
  const lengthPref = ['short', 'medium', 'long'].includes(filters.lengthPref) ? filters.lengthPref : '';
  const count = Math.min(Math.max(Number(filters.count) || 16, 6), 24);
  const cand = asText(filters.candidate);
  const nakshatra = asText(filters.nakshatra);
  const rashi = asText(filters.rashi);

  const key = `names|v6|${g}|${startArr.join(',')}|${origin.toLowerCase()}|${theme.toLowerCase()}|${words.toLowerCase()}|${lengthPref}|${count}|${cand.toLowerCase()}`;
  return cached(key, 'name-engine', async () => {
    const lenRule = lengthPref === 'short' ? 'Keep names SHORT (3-4 letters / 1-2 syllables).'
      : lengthPref === 'medium' ? 'Names of MEDIUM length (5-7 letters / 2-3 syllables).'
      : lengthPref === 'long' ? 'Prefer LONGER, fuller names (8+ letters / 3+ syllables).' : '';
    const constraints = [
      g === 'any' ? '' : `Gender: ${g} names only.`,
      startArr.length ? `ABSOLUTE RULE: every name's FIRST SOUND must match one of these: "${startWith}". Judge by spoken sound, not spelling. Do NOT include a single name starting with any other sound.` : '',
      origin ? `Origin / tradition: ${origin} names.` : '',
      theme ? `Theme / meaning: every name should relate to "${theme}".` : '',
      words ? `Blend or combine the parents' words/ideas: "${words}" — names that evoke both, all real and positive.` : '',
      lenRule,
    ].filter(Boolean).join('\n');

    const prompt = `You are an expert Indian / Vedic baby-naming consultant. Suggest ${count} beautiful, REAL, positive-meaning names.

REALNESS RULES (CRITICAL — the user hates fake/awkward names):
- Suggest ONLY real, well-established, commonly-used Indian baby names that real families actually use today — the kind found on popular baby-name websites and heard in real life.
- NEVER invent, coin, fabricate, or make up a name. NEVER create new Sanskrit-sounding words. NEVER output rare, obscure, or awkward-sounding names.
- Prefer popular, trending, widely-recognized, easy-to-pronounce names over uncommon ones.
- Give each name's TRUE, well-known meaning. If you are not fully sure a name is REAL and actually used, or you are unsure of its real meaning, DO NOT include that name — replace it with a more common one.
- Every name must be genuinely beautiful and something parents would be proud to use.
${constraints}
${nakshatra || rashi ? `Astrology context (for tone only): Janma Nakshatra ${nakshatra || '-'}, Rashi ${rashi || '-'}.` : ''}
Provide every name's meaning in BOTH English (meaning) and Hindi/Devanagari (meaningHi), and the candidate reason in both English (reason) and Hindi (reasonHi).
For EACH name provide: name (Roman script), nameHi (the SAME name written in Devanagari), meaning (short, English), meaningHi (the same meaning in Hindi/Devanagari), origin (e.g. Sanskrit / Hindu / Sikh / Persian), gender (boy|girl|unisex), pronunciation (simple phonetic, e.g. "AH-rav"), and 1-3 single-word themes (e.g. "light","strength","goddess").
${cand ? `ALSO evaluate this candidate name the parents like: "${cand}" — give its meaning (meaning + meaningHi), origin and ${startArr.length ? `whether its first sound matches one of "${startWith}"` : 'whether it is auspicious'}; if not, give 2-3 close alternatives that fit.` : ''}
Return STRICT JSON:
{
 "names":[{"name":"...","nameHi":"...","meaning":"...","meaningHi":"...","origin":"...","gender":"boy|girl|unisex","pronunciation":"...","themes":["..."]} ... ${count} items]${cand ? `,
 "candidate":{"name":"${cand}","nameHi":"...","meaning":"...","meaningHi":"...","origin":"...","suitable":true,"reason":"1 line","reasonHi":"1 line (Hindi)","alternatives":["..."]}` : ''}
}`;
    // PHASE 2 — DB-FIRST for plain browse (letter/gender/origin/length): serve the large
    // curated dataset (real, fast, offline, fake-proof). The AI is only used for
    // theme/word-blend/candidate queries, or to TOP UP when the dataset has too few matches.
    const isBrowse = !theme && !words && !cand;
    let names = [];
    if (isBrowse) {
      names = filterLocalNames({ gender: filters.gender, startWith: startArr, origin, lengthPref, count })
        .map(enrichName).filter(Boolean);
    }
    let out = null;
    if (!isBrowse || names.length < count) {
      out = await callAI(prompt, { json: true }).catch(() => null);
      if (out) {
        const seen = new Set(names.map((n) => n.name.toLowerCase()));
        asList(out.names).map(enrichName).filter(Boolean).forEach((n) => {
          if (!seen.has(n.name.toLowerCase())) { names.push(n); seen.add(n.name.toLowerCase()); }
        });
      }
    }
    // guaranteed non-empty: broad curated top-up if still short
    let usedLocal = false;
    if (names.length < Math.min(6, count)) {
      usedLocal = true;
      const seen = new Set(names.map((n) => n.name.toLowerCase()));
      filterLocalNames({ gender: filters.gender, startWith: startArr, origin, theme, words, lengthPref, count })
        .map(enrichName).filter(Boolean)
        .forEach((n) => { if (!seen.has(n.name.toLowerCase())) { names.push(n); seen.add(n.name.toLowerCase()); } });
    }
    const finalNames = names.slice(0, count);
    const servedFromDb = isBrowse && !out; // browse fully satisfied by the curated dataset

    let candidate = null;
    if (cand) {
      if (out && out.candidate) {
        const alts = asList(out.candidate.alternatives).map(asText).filter(Boolean).slice(0, 3);
        candidate = {
          name: asText(out.candidate.name) || cand,
          nameHi: asText(out.candidate.nameHi) || null,
          meaning: asText(out.candidate.meaning),
          meaningHi: asText(out.candidate.meaningHi) || null,
          origin: asText(out.candidate.origin) || null,
          suitable: !!out.candidate.suitable,
          reason: asText(out.candidate.reason),
          reasonHi: asText(out.candidate.reasonHi) || null,
          alternatives: alts,
          alternativesIfNo: alts, // backward-compat alias (JanamPatri screen)
          numerology: numerologyCard(asText(out.candidate.name) || cand),
        };
      } else {
        // deterministic candidate check (AI unavailable): does it start with the auspicious sound?
        const suitable = startArr.length ? startArr.some((sw) => firstSoundMatches({ name: cand, hi: '' }, sw)) : true;
        const alts = finalNames.slice(0, 3).map((n) => n.name);
        candidate = {
          name: cand, nameHi: null, meaning: '', meaningHi: null, origin: null,
          suitable,
          reason: startArr.length
            ? (suitable ? `"${cand}" begins with the auspicious sound.` : `"${cand}" does not begin with "${startArr.join('", "')}".`)
            : `"${cand}" — numerology computed.`,
          reasonHi: startArr.length
            ? (suitable ? `"${cand}" शुभ अक्षर से आरंभ होता है।` : `"${cand}" "${startArr.join('", "')}" अक्षर से आरंभ नहीं होता।`)
            : `"${cand}" — अंक-ज्योतिष गणना की गई।`,
          alternatives: alts, alternativesIfNo: alts,
          numerology: numerologyCard(cand),
        };
      }
    }
    const result = { names: finalNames, candidate, count: finalNames.length, aiAssisted: !!out, source: servedFromDb ? 'curated' : (out ? (usedLocal ? 'mixed' : 'ai') : 'local') };
    // cache curated/browse results; only retry AI for NON-browse queries when the AI was down
    if (!out && !isBrowse) result._fallback = true;
    return result;
  });
}

// General name explorer (no chart). Accepts rich filters; `letter` kept as alias for startWith.
async function generateBabyNames(input = {}) {
  const { letter, startWith, words, gender, lang, origin, theme, lengthPref, count } = input;
  const r = await generateNames({
    gender, lang, words, origin, theme, lengthPref, count,
    startWith: startWith || letter || undefined,
  });
  return {
    mode: words ? 'words' : (startWith || letter) ? 'letter' : (theme ? 'theme' : 'browse'),
    startWith: startWith || letter || null,
    words: asText(words) || null,
    gender: normGender(gender),
    ...r,
  };
}

// Chart-based Naamkaran — auto-seeded from the child's Janma Nakshatra/pada → naamakshar syllable.
async function generateNameSuggestions({ syllable, nakshatra, pada, rashi, gender, lang, candidate, startWith, origin, theme, lengthPref }) {
  const sw = (Array.isArray(startWith) && startWith.length) ? startWith : (startWith ? [startWith] : (syllable ? [syllable] : []));
  const r = await generateNames({ gender, lang, candidate, origin, theme, lengthPref, startWith: sw, nakshatra, rashi });
  const rashiNote = lang === 'hi'
    ? `${rashi || ''} राशि · ${nakshatra || ''} नक्षत्र (चरण ${pada || '-'}) के अनुसार नाम "${syllable || ''}" अक्षर से रखना शुभ है।`
    : `By ${rashi || ''} rashi · ${nakshatra || ''} nakshatra (pada ${pada || '-'}), names beginning with "${syllable || ''}" are auspicious.`;
  return { syllable, nakshatra, pada, rashi, rashiNote, ...r };
}

// ── NAME HELPER (Q&A) — parent asks anything about names; answer is grounded on
// the names they're considering. AI when available; graceful fallback otherwise. ──
async function answerNameQuestion({ question, names, gender, lang }) {
  const L = lang === 'hi' ? 'hi' : 'en';
  const q = asText(question);
  if (!q) { const e = new Error('question required'); e.status = 400; throw e; }
  const ctxNames = (Array.isArray(names) ? names : [])
    .map((n) => (typeof n === 'string' ? n : (n && n.name))).filter(Boolean).slice(0, 40);
  const key = `nameask|v1|${q.toLowerCase()}|${ctxNames.slice(0, 18).join(',').toLowerCase()}|${(gender || '').toLowerCase()}|${L}`;
  return cached(key, 'name-ask', async () => {
    const prompt = `You are a warm, knowledgeable baby-naming consultant for Indian / Vedic names. Speak directly to the parent, kindly and practically.
${ctxNames.length ? `The parent is currently considering these names: ${ctxNames.join(', ')}.` : ''}
${gender ? `The baby is a ${normGender(gender)}.` : ''}
Parent's question: "${q}"
${writeIn(L)}
Give a helpful, specific answer in 3-6 sentences (compare/recommend/explain meanings as the question needs). If — and only if — the question asks for name ideas, also include up to 6 real name suggestions.
Return STRICT JSON: {"answer":"...","suggestions":[{"name":"...","nameHi":"...","meaning":"...","origin":"...","gender":"boy|girl|unisex","themes":["..."]}]}`;
    const out = await callAI(prompt, { json: true }).catch(() => null);
    if (!out) {
      return {
        answer: L === 'hi'
          ? 'अभी विस्तृत उत्तर देने में थोड़ी दिक्कत है — कृपया कुछ देर बाद दोबारा पूछें। नीचे हमारी लाइब्रेरी से कुछ सुंदर नाम सुझाए गए हैं।'
          : 'I’m having a little trouble giving a detailed answer right now — please ask again shortly. Meanwhile, here are some beautiful names from our library.',
        suggestions: filterLocalNames({ gender, count: 6 }).map(enrichName).filter(Boolean),
        aiAssisted: false, source: 'local', _fallback: true,
      };
    }
    return {
      answer: asText(out.answer),
      suggestions: asList(out.suggestions).map(enrichName).filter(Boolean).slice(0, 6),
      aiAssisted: true, source: 'ai',
    };
  });
}

// ── TRANSIT FORECAST — year-by-year gochar summary + notes for notable years ──
async function generateTransitForecast({ lang, moonSign, years }) {
  const L = lang === 'hi' ? 'hi' : 'en';
  const notable = (years || []).filter((y) => (y.shani && y.shani.event) || (y.guru && y.guru.event));
  const key = `transitfc|v1|${moonSign}|${years && years.length ? years[0].year + '-' + years[years.length - 1].year : ''}|${L}`;
  return cached(key, 'transit-forecast', async () => {
    const lines = notable.map((y) => `${y.year}: ${y.shani && y.shani.event ? 'Saturn ' + y.shani.event + ' (' + y.shani.sign + ')' : ''}${y.guru && y.guru.event ? '; Jupiter favorable (' + y.guru.sign + ')' : ''}`).join('\n');
    const prompt = `You are a Vedic astrologer. Native's Moon sign (rashi) is ${moonSign}. Below are the deterministic slow-planet transit events (relative to the Moon) for several years. Explain them simply and practically (non-fatalistic). Do NOT invent events beyond these.

EVENTS:
${lines || 'No major slow-planet events in this window.'}

${writeIn(L)}
- "summary": 3-4 sentences on the overall transit weather across this period (Saturn Sade Sati/Dhaiya impact + Jupiter's supportive years).
- "notes": array of {"year":<number>,"text":"1 simple sentence for that year"} for the NOTABLE years listed above (max 10).
Return STRICT JSON: {"summary":"...","notes":[{"year":2026,"text":"..."}],${saralField(L)}}`;
    const out = await callAI(prompt, { json: true });
    return {
      summary: asText(out.summary),
      notes: asList(out.notes).map((n) => ({ year: Number(n && n.year), text: asText(n && n.text) })).filter((n) => n.year && n.text),
      saralVivaran: asText(out.saralVivaran),
    };
  });
}

// ── SIGN RASHIFAL (12-rashi page) — AI-rich, period-SCALED horoscope for ONE zodiac sign.
// Every section carries the main reading + a "saral" simple-language explanation with an
// example; ends with a conclusion (निष्कर्ष). weekly > daily, monthly > weekly, yearly = deep. ──
const SIGN_HI = { Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क', Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक', Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन' };
async function generateSignRashifal({ sign, period, lang, moonTransit, sunTransit }) {
  const L = lang === 'hi' ? 'hi' : 'en';
  const P = ['daily', 'weekly', 'monthly', 'yearly'].includes(period) ? period : 'daily';
  const now = new Date();
  const bucket = P === 'yearly' ? `${now.getFullYear()}` : P === 'monthly' ? `${now.getFullYear()}-${pad2(now.getMonth() + 1)}` : P === 'weekly' ? isoWeekKey(now) : todayStr();
  const key = `signrashifal|v1|${sign}|${P}|${bucket}|${L}`;
  return cached(key, 'sign-rashifal', async () => {
    const meta = {
      daily: { secs: '3', span: L === 'hi' ? 'आज' : 'today', depth: 'a focused day-ahead reading' },
      weekly: { secs: '4', span: L === 'hi' ? 'इस सप्ताह' : 'this week', depth: 'a richer week-ahead reading, clearly more detailed than a single day' },
      monthly: { secs: '6', span: L === 'hi' ? 'इस महीने' : 'this month', depth: 'a deep month-long reading, more detailed than a week, covered phase by phase (start / middle / end)' },
      yearly: { secs: '8', span: L === 'hi' ? 'इस वर्ष' : 'this year', depth: 'a thorough, deeply-analysed YEAR-LONG outlook — the most detailed of all: cover every life area (self & health, career & money, love & relationships, family & home, education/growth, travel, spirituality), quarter by quarter, and the major slow-planet (Saturn/Jupiter) themes for the whole year' },
    }[P];
    const prompt = `You are an expert Vedic astrologer writing a ${P.toUpperCase()} RASHIFAL (horoscope) for the ${sign} (${SIGN_HI[sign] || sign}) moon sign (rashi). Produce ${meta.depth}.
Use deep astrological reasoning grounded in this sign's classical nature + ruling planet and the CURRENT transit context: Moon currently in ${moonTransit || 'its current sign'}, Sun in ${sunTransit || 'its current sign'}. Be specific to ${sign}, honest, practical, encouraging and NON-fatalistic. Do NOT invent exact calendar dates — speak in general timeframes (early/mid/late, quarters).
${writeIn(L)}
VERY IMPORTANT STRUCTURE — for EVERY section give TWO things:
- "text": the main astrology reading (specific to ${sign} for ${meta.span}).
- "saral": the SAME point re-explained in very simple everyday ${L === 'hi' ? 'Hindi' : 'English'} with ONE small real-life example, so a person with NO astrology knowledge fully understands it.
Return STRICT JSON only:
{
 "headline": "a short ${meta.span} headline for ${sign}",
 "sections": [ ${meta.secs} items, each {"heading":"section title (e.g. Career & Money / करियर व धन)","text":"2-5 sentence main reading","saral":"simple explanation + a tiny real-life example"} ],
 "conclusion": {"text":"overall ${P} conclusion / निष्कर्ष (3-4 sentences drawing it all together)","saral":"the WHOLE rashifal summed up in very simple words, ending with one encouraging line"}
}`;
    const out = await callAI(prompt, { json: true });
    return {
      sign, period: P, range: bucket,
      headline: asText(out.headline),
      sections: asList(out.sections).map((s) => ({ heading: asText(s && s.heading), text: asText(s && s.text), saral: asText(s && s.saral) })).filter((s) => s.text),
      conclusion: { text: asText(out.conclusion && out.conclusion.text), saral: asText(out.conclusion && out.conclusion.saral) },
      aiAssisted: true,
    };
  });
}

// Numerology interpretation. The numbers are computed DETERMINISTICALLY in
// numerology.service.js and passed in here as immutable facts — the AI only writes the
// human-readable meaning and NEVER computes or invents a number.
async function generateNumerologyReading({ profile, lang = 'hi' } = {}) {
  if (!profile || !profile.mulank) { const e = new Error('numerology profile required'); e.status = 400; throw e; }
  const L = lang === 'hi' ? 'hi' : 'en';
  const pl = (p) => (p ? (L === 'hi' ? p.hi : p.en) : '');
  const facts = {
    name: profile.name || '',
    mulank: `${profile.mulank.final} (${pl(profile.mulank.planet)})`,
    bhagyank: `${profile.bhagyank.final} (${pl(profile.bhagyank.planet)})`,
    namank: `${profile.namank.final} (${pl(profile.namank.planet)})`,
    soulUrge: profile.soulUrge.final,
    personality: profile.personality.final,
    personalYear: profile.personalYear.final,
    loShuMissing: profile.loShu.missing,
    loShuPresentArrows: (profile.loShu.presentArrows || []).map((a) => (L === 'hi' ? a.hi : a.en)),
    isMasterMulank: profile.mulank.isMaster,
    hasKarmicDebt: [profile.mulank, profile.bhagyank, profile.namank].some((x) => x.isKarmic),
  };
  const key = `numerology|${L}|${profile.dob}|${(profile.name || '').toLowerCase()}|m${facts.mulank}|b${facts.bhagyank}|n${facts.namank}|py${facts.personalYear}|miss${facts.loShuMissing.join('')}`;
  return cached(key, 'numerology', async () => {
    const prompt = `You are an experienced Indian (Vedic + Chaldean) numerologist. You are given a person's ALREADY-COMPUTED numerology numbers. Use ONLY these numbers and their planets. NEVER invent, recompute, or state any number that is not in this DATA. If something is not in the DATA, do not mention it.

DATA (immutable — do not change any number):
${JSON.stringify(facts, null, 2)}

Return STRICT JSON only:
{
 "mulank": {"title": "short heading", "meaning": "what this Driver number + its planet says about inner nature", "traits": ["3-5 short traits"], "health": "1 line general wellbeing tendency"},
 "bhagyank": {"title": "short heading", "meaning": "life-path / career direction from this Destiny number + planet", "career": ["2-4 suited directions"]},
 "namank": {"title": "short heading", "meaning": "how the name vibration supports or challenges the core numbers"},
 "personalYear": {"title": "short heading", "meaning": "theme of the current personal year ${facts.personalYear} and one simple focus"},
 "loShu": {"strengths": "what the present planes/arrows give", "gaps": "what the missing numbers (${facts.loShuMissing.join(', ') || 'none'}) suggest to work on", "remedies": ["2-4 simple, safe remedies — charity/mantra/colour/habit; do NOT advise an expensive gemstone as the first step"]},
 "summary": "4-6 line overall guidance tying the numbers together",
 ${saralField(L)}
}
${writeIn(L)}`;
    const out = await callAI(prompt, { json: true });
    return {
      mulank: out.mulank || null,
      bhagyank: out.bhagyank || null,
      namank: out.namank || null,
      personalYear: out.personalYear || null,
      loShu: out.loShu || null,
      summary: asText(out.summary),
      saralVivaran: asText(out.saralVivaran),
      aiAssisted: true,
    };
  });
}

// ── SHUBH AVSAR — authentic Hindu occasion / ritual guide (bilingual, AI-assisted, cached) ──
const OCCASION_META = {
  'vivah':        { hi: 'विवाह (शादी) संस्कार', en: 'Vivah (the Hindu marriage ceremony)', deity: 'Ganesha, Lakshmi-Narayana' },
  'grah-pravesh': { hi: 'गृह प्रवेश', en: 'Grah Pravesh (housewarming)', deity: 'Ganesha, Vastu Purusha, Lakshmi' },
  'naamkaran':    { hi: 'नामकरण संस्कार', en: 'Naamkaran (baby naming ceremony)', deity: 'Ganesha' },
  'business':     { hi: 'नए व्यापार/दुकान का आरंभ', en: 'opening a new business / shop', deity: 'Ganesha, Lakshmi, Kubera' },
  'vehicle':      { hi: 'वाहन पूजा', en: 'new vehicle puja', deity: 'Ganesha' },
  'bhoomi-pujan': { hi: 'भूमि पूजन (निर्माण आरंभ)', en: 'Bhoomi Pujan (ground-breaking ceremony)', deity: 'Bhumi Devi, Vastu Purusha, Naga Devta, Ganesha' },
  'birthday':     { hi: 'जन्मदिन (आयुष्य पूजा)', en: 'a Hindu birthday (Ayushya / long-life puja)', deity: 'Ayushya Devata, Satyanarayana' },
  'education':    { hi: 'विद्या आरंभ / अक्षर आरंभ', en: 'Vidyarambh (beginning of a child’s learning)', deity: 'Saraswati, Ganesha' },
  'daily-puja':   { hi: 'नित्य (रोज़ की) पूजा', en: 'daily home puja', deity: 'Panchadeva (Ganesha, Vishnu, Shiva, Devi, Surya)' },
  'festival':     { hi: 'त्योहार की पूजा', en: 'festival worship', deity: 'the deity of the festival' },
  'vrat':         { hi: 'व्रत (उपवास)', en: 'Vrat (a religious fast)', deity: 'the deity of the vrat' },
  'dosh-nivaran': { hi: 'ग्रह दोष निवारण', en: 'planetary dosha remedies (shanti)', deity: 'Navagraha, Shiva (Mahamrityunjaya)' },
};

async function generateOccasionGuide({ occasion, lang }) {
  const meta = OCCASION_META[occasion];
  if (!meta) throw Object.assign(new Error('Unknown occasion'), { status: 400 });
  const en = lang === 'en';
  const name = en ? meta.en : meta.hi;
  return cached(`occasion|guide|v1|${occasion}|${en ? 'en' : 'hi'}`, 'occasion-guide', async () => {
    const prompt = en
      ? `You are a knowledgeable, humble Hindu family priest (purohit) and Vedic scholar. Give an AUTHENTIC, traditional ritual guide for: ${name} (presiding deity: ${meta.deity}).
STRICT AUTHENTICITY: base everything only on well-established, traditional Hindu practice (Grihya Sutras / Puranas / common Dharmashastra custom). Do NOT invent mantras or steps. Where customs genuinely differ by region (North/South/Gujarat/Maharashtra/Bengal etc.), say so briefly in "regionalNote" rather than presenting one version as the only truth. Keep language extremely simple — imagine explaining to a first-time, elderly user. Explain each step practically (which direction to face, what to place, what to offer).
Return STRICT JSON with these keys (all text in simple English, EXCEPT mantra.sanskrit which stays in Devanagari):
{
 "significance":"2-4 sentences on what this occasion is and why it matters spiritually",
 "muhurat":"1-2 sentences on how the auspicious time is chosen (or say any time is fine if it is not muhurat-bound)",
 "samagri":["8-14 common puja items"],
 "steps":["6-12 ordered, practical steps of the puja vidhi"],
 "mantras":[{"sanskrit":"मंत्र देवनागरी में","transliteration":"roman","meaning":"simple English meaning","when":"when to chant","benefit":"why / benefit","count":"e.g. 3 / 11 / 108"}],
 "dos":["4-6 things to do"],
 "donts":["4-6 things to avoid"],
 "faqs":[{"q":"common question","a":"clear answer"}],
 "regionalNote":"1-2 sentences on regional variation, or empty",
 "disclaimer":"one line: confirm exact family tradition with a local priest"
}
Give 2-4 authentic, widely-accepted mantras and 3-5 FAQs.`
      : `तुम एक ज्ञानी, विनम्र हिंदू परिवार-पुरोहित और वैदिक विद्वान हो। "${name}" (मुख्य देवता: ${meta.deity}) के लिए प्रामाणिक, पारंपरिक पूजा विधि दो।
प्रामाणिकता अनिवार्य: केवल सुस्थापित पारंपरिक हिंदू परंपरा (गृह्यसूत्र/पुराण/धर्मशास्त्र की सामान्य परंपरा) के आधार पर लिखो। कोई मंत्र या विधि मत गढ़ो। जहाँ क्षेत्र अनुसार (उत्तर/दक्षिण/गुजरात/महाराष्ट्र/बंगाल आदि) रीति सचमुच बदलती है, उसे "regionalNote" में संक्षेप में बताओ — एक ही रूप को अंतिम सत्य मत बताओ। भाषा बेहद सरल रखो, जैसे किसी बुज़ुर्ग/पहली बार करने वाले को समझा रहे हो। हर चरण व्यावहारिक रूप से समझाओ (किस दिशा में मुँह, क्या रखें, क्या चढ़ाएँ)।
STRICT JSON लौटाओ इन keys के साथ (सारा पाठ सरल हिंदी देवनागरी में; केवल mantra.sanskrit देवनागरी संस्कृत में):
{
 "significance":"2-4 वाक्य: यह अवसर क्या है और आध्यात्मिक रूप से क्यों महत्वपूर्ण",
 "muhurat":"1-2 वाक्य: शुभ मुहूर्त कैसे चुनें (या यदि मुहूर्त आवश्यक नहीं तो कहो कभी भी)",
 "samagri":["8-14 सामान्य पूजा सामग्री"],
 "steps":["6-12 क्रमवार, व्यावहारिक पूजा विधि"],
 "mantras":[{"sanskrit":"मंत्र देवनागरी में","transliteration":"roman","meaning":"सरल हिंदी अर्थ","when":"कब जपें","benefit":"लाभ","count":"जैसे 3/11/108"}],
 "dos":["4-6 करने योग्य बातें"],
 "donts":["4-6 न करने योग्य बातें"],
 "faqs":[{"q":"आम प्रश्न","a":"स्पष्ट उत्तर"}],
 "regionalNote":"1-2 वाक्य क्षेत्रीय भिन्नता, या खाली",
 "disclaimer":"एक पंक्ति: सटीक पारिवारिक परंपरा हेतु स्थानीय पुरोहित से पुष्टि कर लें"
}
2-4 प्रामाणिक, सर्वमान्य मंत्र और 3-5 FAQ दो।`;
    const out = await callAI(prompt, { json: true });
    const arr = (x) => (Array.isArray(x) ? x : []);
    return {
      significance: out.significance || '', muhurat: out.muhurat || '',
      samagri: arr(out.samagri), steps: arr(out.steps), mantras: arr(out.mantras),
      dos: arr(out.dos), donts: arr(out.donts), faqs: arr(out.faqs),
      regionalNote: out.regionalNote || '', disclaimer: out.disclaimer || '',
      aiAssisted: true,
    };
  });
}

// Explain ANY snippet of ritual text in the simplest possible way, with a tiny everyday example.
// Cached by a hash of the text + language, so repeated taps are instant.
async function generateSimpleExplain({ text, context, lang }) {
  const crypto = require('crypto');
  const en = lang === 'en';
  const t = String(text || '').slice(0, 1400);
  const key = crypto.createHash('md5').update(`${context || ''}||${t}`).digest('hex').slice(0, 18);
  return cached(`explain|simple|v1|${en ? 'en' : 'hi'}|${key}`, 'simple-explain', async () => {
    const prompt = en
      ? `You are a kind, patient teacher explaining a Hindu ritual to someone using it for the very first time — perhaps elderly or not highly literate. In VERY simple English, explain the following${context ? ` (this is part of: ${context})` : ''}, then give ONE tiny everyday-life example so it becomes crystal clear. 2-4 short sentences. Do not add facts beyond the text; if it is a mantra, explain its feeling/meaning simply.
Text: """${t}"""
Return STRICT JSON: {"explanation":"..."}`
      : `तुम एक स्नेही, धैर्यवान शिक्षक हो जो किसी पहली बार करने वाले — शायद बुज़ुर्ग या कम पढ़े-लिखे — व्यक्ति को हिंदू रीति समझा रहे हो। नीचे दी गई बात को${context ? ` (यह इसका हिस्सा है: ${context})` : ''} बहुत सरल हिंदी में समझाओ, फिर एक छोटा रोज़मर्रा का उदाहरण दो ताकि बात एकदम साफ हो जाए। 2-4 छोटे वाक्य। पाठ से बाहर कुछ मत जोड़ो; यदि यह मंत्र है तो उसका भाव सरलता से बताओ।
पाठ: """${t}"""
STRICT JSON लौटाओ: {"explanation":"..."}`;
    const out = await callAI(prompt, { json: true });
    return { explanation: out.explanation || '' };
  });
}

async function answerOccasionQuestion({ occasion, question, lang }) {
  const meta = OCCASION_META[occasion] || { en: occasion, hi: occasion, deity: '' };
  const en = lang === 'en';
  const name = en ? meta.en : meta.hi;
  const q = String(question || '').slice(0, 500);
  const prompt = en
    ? `You are a humble, knowledgeable Hindu family priest helping with: ${name}. Answer the user's question authentically and simply, based only on well-established Hindu tradition. If customs vary by region, say so. If you are genuinely not sure, say so honestly instead of inventing. Keep it short and practical (2-5 sentences), in simple English.
User's question: "${q}"
Return STRICT JSON: {"answer":"..."}`
    : `तुम एक विनम्र, ज्ञानी हिंदू परिवार-पुरोहित हो और "${name}" में सहायता कर रहे हो। उपयोगकर्ता के प्रश्न का प्रामाणिक व सरल उत्तर दो, केवल सुस्थापित हिंदू परंपरा के आधार पर। यदि क्षेत्र अनुसार भिन्नता हो तो बताओ। यदि सचमुच निश्चित न हो तो ईमानदारी से कहो, कुछ मत गढ़ो। उत्तर छोटा व व्यावहारिक रखो (2-5 वाक्य), सरल हिंदी देवनागरी में।
प्रश्न: "${q}"
STRICT JSON लौटाओ: {"answer":"..."}`;
  const out = await callAI(prompt, { json: true });
  return { answer: out.answer || '' };
}

module.exports = {
  generateDailyPrediction, generatePeriodPrediction, generateTraditionalReading, generateDashaPhala, generateNames, generateNameSuggestions, generateBabyNames, answerNameQuestion, generateTransitForecast, askAstrologer, generateInsights, generateChoghadiyaMessage, generateMuhuratPick, generateSignRashifal, generateNumerologyReading,
  generateRcmExplanation, generateGitaExplanation, generateRamayanExplanation, generateRigvedaExplanation,
  generateVedaExplanation, generateDailyShlokaExplain, generateMatchExplanation, generateGocharExplanation,
  generateRemediesExplanation, generateOccasionGuide, answerOccasionQuestion, generateSimpleExplain,
  buildFullAstroContext,
  callAI,
};
