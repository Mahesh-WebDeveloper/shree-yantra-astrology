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
const { getKundli, getDasha, getPanchang } = require('./vedastro.service');
const { getVargaCharts } = require('./varga.service');
const { nameNumerology } = require('../utils/numerology');
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
    throw Object.assign(new Error('AI returned invalid JSON'), { status: 502 });
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
            : { role: 'system', content: "You are Shree Yantra's astrology assistant. Reply with ONLY the final answer in the user's language. Do not include any analysis, reasoning, or meta commentary." },
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
            : { role: 'system', content: "You are Shree Yantra's astrology assistant. Reply with ONLY the final answer in the user's language. Do not include any analysis, reasoning, or meta commentary." },
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

async function cached(key, type, producer) {
  const hit = await AiCache.findOne({ cacheKey: key });
  if (hit) return hit.data;
  const data = await producer();
  // AI down/quota fallback ko cache MAT karo (warna quota aane par bhi chipka rahega)
  if (!(data && data._fallback)) {
    try { await AiCache.findOneAndUpdate({ cacheKey: key }, { cacheKey: key, type, data }, { upsert: true }); } catch (_) {}
  }
  return data;
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
    today: panch ? {
      date: panch.date, weekday: panch.weekday, tithi: panch.tithi && panch.tithi.name,
      paksha: panch.tithi && panch.tithi.paksha, nakshatra: panch.nakshatra && panch.nakshatra.name,
      yoga: panch.yoga && panch.yoga.name,
      karana: panch.karana && panch.karana.name,
      transitMoon: panch.moon && panch.moon.sign,
      transitMoonNakshatra: panch.moon && panch.moon.nakshatra,
      sun: panch.sun && panch.sun.sign,
      sunrise: panch.sunrise,
      sunset: panch.sunset,
      inauspicious: panch.inauspicious || [],
      source: panch.source,
    } : null,
  };
}

// ── 1) DAILY PREDICTION (roz naya — date se cache) ──
const langOf = (input) => (input && input.lang === 'hi' ? 'hi' : 'en');
const writeIn = (lang) =>
  lang === 'hi'
    ? 'VERY IMPORTANT: Write ALL text values in PURE, SIMPLE HINDI using DEVANAGARI script ONLY (शुद्ध हिंदी). Do NOT use Hinglish or Roman/English letters inside the Hindi text (only keep unavoidable proper nouns/numbers). Keep JSON keys in English. Be specific to the data, warm and natural — like a kind Hindi-speaking astrologer.'
    : 'Write in simple, positive English (an average Indian user reads it). Be specific to the data, not generic.';

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
  const key = `daily|v6|${birthSig(input)}|${todayStr()}|${lang}`;
  return cached(key, 'daily', async () => {
    const ctx = await buildContext(input);
    const prompt = `You are an expert Vedic astrologer for the Shree Yantra app. Build a complete DAILY RASHIFAL for ${ctx.name}.

Use ONLY the real astrological data below. Do not invent planet positions, yogas, doshas, dasha, nakshatra, tithi, sunrise, sunset, or time windows.
You may interpret the data in a practical, kind way. Avoid fear, certainty, medical diagnosis, financial guarantees, or fatalistic language.
Mention that remedies are optional spiritual practices, not guaranteed outcomes.

REAL DATA JSON (from precise Vedic chart data plus classical Panchang rules):
${JSON.stringify({
  name: ctx.name,
  birth: ctx.birth,
  ascendant: ctx.ascendant,
  moonSign: ctx.moonSign,
  dasha: ctx.dasha,
  yogas: ctx.yogas,
  doshas: ctx.doshas,
  planets: ctx.planets,
  today: ctx.today,
}, null, 2)}

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
 "aiQuestions": ["3-4 useful follow-up questions the user may ask the future AI astrologer"],
 "luckyColour":"<one colour>",
 "luckyNumber":"<1-9>",
 "luckyTime":"<a short good-time window today, e.g. 'After 4 PM' or '6-8 AM'>",
 "advice":"one short do/avoid tip for today",
 "confidence": <0.4-0.95>,
 "sourceNote":"short note: based on precise chart/panchang data (do NOT mention AI)"
}`;
    let out; let aiFailed = false;
    try { out = await callAI(prompt, { json: true }); }
    catch (e) { out = {}; aiFailed = true; } // AI down/quota → real chart data phir bhi dikhega
    const shaped = ensureDailyShape(out, ctx, lang);
    return {
      ...shaped,
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
        source: 'Precise Vedic chart & Panchang data',
      },
      contextForChat: {
        name: ctx.name,
        birth: ctx.birth,
        ascendant: ctx.ascendant,
        moonSign: ctx.moonSign,
        currentDasha: ctx.currentDasha,
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

function ensureAskShape(out, ctx, question, lang) {
  const src = out && typeof out === 'object' ? out : {};
  const defaults = dailyDefaults(lang);
  const answer = firstText(
    src.answer,
    lang === 'hi'
      ? 'आपके जन्म विवरण और उपलब्ध कुंडली-पंचांग डेटा के आधार पर अभी सबसे अच्छा मार्गदर्शन यह है कि निर्णय शांत मन से लें और आज के पंचांग के अनुसार समय का ध्यान रखें।'
      : 'Based on your birth details and available chart/panchang data, the best guidance is to act calmly and use today’s panchang as a timing support.'
  );
  const sections = asList(src.sections).slice(0, 5).map((s) => ({
    title: firstText(s.title, lang === 'hi' ? 'मार्गदर्शन' : 'Guidance'),
    text: firstText(s.text, answer),
  }));
  const vedastroBasis = asList(src.vedastroBasis).map(asText).filter(Boolean).slice(0, 8);
  const followUpQuestions = asList(src.followUpQuestions).map(asText).filter(Boolean).slice(0, 4);
  const remedies = asList(src.remedies).slice(0, 4).map((r) => ({
    title: firstText(r.title, lang === 'hi' ? 'सरल उपाय' : 'Simple remedy'),
    body: firstText(r.body, r.text, defaults.advice),
    timing: firstText(r.timing),
    mantra: firstText(r.mantra),
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
    sourceNote: firstText(src.sourceNote, defaults.sourceNote),
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

async function askAstrologer(input) {
  const lang = langOf(input);
  const question = String(input.question || '').trim();
  if (!question) throw Object.assign(new Error('Question chahiye'), { status: 400 });
  if (question.length > 900) throw Object.assign(new Error('Question 900 characters se chhota rakhein'), { status: 400 });
  const key = `ask|v3|${birthSig(input)}|${todayStr()}|${lang}|${questionKey(question)}`;
  return cached(key, 'ask-astrologer', async () => {
    const ctx = await buildContext(input);
    let vargaContext = [];
    try {
      const varga = await getVargaCharts(input, { charts: chartsForQuestion(question) });
      vargaContext = compactVargaCharts(varga);
    } catch (_) {
      // Varga context is helpful, but the main D1/dasha/panchang answer can still work without it.
    }
    const prompt = `You are Shree Yantra's AI Vedic astrologer. Answer the user's question with trust, clarity, and humility.

GROUND RULES:
- Use ONLY the real Vedic chart / Panchang data below as the astrological ground source.
- If a required data point is missing, say that it is unavailable instead of inventing it.
- Do not claim guaranteed accuracy, medical diagnosis, legal/financial certainty, or fixed destiny.
- Give practical, spiritual, culturally respectful guidance.
- Keep answer personal to the user profile and question.
- Keep JSON keys in English.

USER QUESTION:
${question}

REAL ASTRO CONTEXT JSON:
${JSON.stringify({
  name: ctx.name,
  birth: ctx.birth,
  ascendant: ctx.ascendant,
  moonSign: ctx.moonSign,
  dasha: ctx.dasha,
  yogas: ctx.yogas,
  doshas: ctx.doshas,
  planets: ctx.planets,
  today: ctx.today,
  vargaCharts: vargaContext,
}, null, 2)}

${writeIn(lang)}
WRITING STYLE (make it feel like a warm, wise personal astrologer — not robotic):
- "answer": a warm, direct 4-6 sentence summary that speaks to the user personally.
- "sections": 3 to 6 well-titled sections, EACH 2-4 sentences, specific to THIS chart (name the actual sign/house/planet/yoga you used). Pick headings that fit the question (e.g. Personality, Career & Money, Relationships, Health, Strengths, Cautions, Timing).
- Be encouraging and practical; explain WHY (which graha/yoga) in simple words so the user trusts it.
Return STRICT JSON only:
{
 "answer":"warm personal 4-6 sentence summary",
 "sections":[{"title":"short heading","text":"2-4 sentence explanation that names the actual chart factor used"}],
 "vedastroBasis":["bullet-like facts used from the chart context"],
 "remedies":[{"title":"optional remedy","body":"simple practical steps","timing":"best timing","mantra":"optional mantra"}],
 "followUpQuestions":["3-4 useful next questions"],
 "confidence":<0.4-0.95>,
 "sourceNote":"short note: based on precise chart/panchang data (do NOT mention AI)"
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
async function generateVerseExplanation({ cacheKey, book, refLabel, sourceText, sourceScript, hint }) {
  return cached(cacheKey, 'verse-explain', async () => {
    const prompt = `तुम ${book} के विद्वान व्याख्याकार और कुशल कथावाचक हो।
नीचे ${refLabel} दिया गया है (${sourceScript} में मूल पाठ):

"""
${sourceText}
"""
${hint ? `\nसंदर्भ हेतु (केवल तुम्हारी सहायता के लिए, इसे दोहराना नहीं) अंग्रेज़ी भावार्थ: ${hint}\n` : ''}
इस पाठ का सरल, शुद्ध हिंदी (केवल देवनागरी) में वर्णन करो। कुछ मत बनाओ — केवल इसी पाठ के आधार पर लिखो।
- "anuvad": इस पाठ का सरल हिंदी अनुवाद/अर्थ (2-4 वाक्य), जैसे आम पाठक को आसानी से समझ आए।
- "katha": इस प्रसंग को एक छोटी, रोचक कहानी/कथा की तरह सरल भाषा में समझाओ — संदर्भ, भाव और दृश्य ऐसे कि पाठक को लगे जैसे कोई कथावाचक प्रेम से समझा रहा हो (3-5 वाक्य)।
- "seekh": इस पाठ से हमें जीवन में क्या शिक्षा/सीख मिलती है — व्यावहारिक और प्रेरक (2-3 वाक्य)।
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
const VEDA_HI = { yajurveda: 'यजुर्वेद', samaveda: 'सामवेद', atharvaveda: 'अथर्ववेद', mahabharata: 'महाभारत', upanishads: 'उपनिषद्' };
function generateVedaExplanation({ veda, book, section, verse, sanskrit, english }) {
  const name = VEDA_HI[veda] || veda;
  const unit = veda === 'mahabharata' ? 'श्लोक' : 'मंत्र';
  return generateVerseExplanation({
    cacheKey: `veda|explain|v1|${veda}|${book}|${section}|${verse}`,
    book: name,
    refLabel: `${name} — ${book}.${section}.${verse} (${unit})`,
    sourceText: sanskrit,
    sourceScript: 'संस्कृत',
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
Return STRICT JSON: {"verdict":"...","summary":"...","strengths":["..."],"cautions":["..."],"advice":"..."}`;
    const out = await callAI(prompt, { json: true });
    return {
      verdict: asText(out.verdict),
      summary: asText(out.summary),
      strengths: asList(out.strengths).map(asText).filter(Boolean).slice(0, 4),
      cautions: asList(out.cautions).map(asText).filter(Boolean).slice(0, 3),
      advice: asText(out.advice),
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
Return STRICT JSON: {"summary":"...","highlights":[{"planet":"...","text":"..."}],"advice":"..."}`;
    const out = await callAI(prompt, { json: true });
    return {
      summary: asText(out.summary),
      highlights: asList(out.highlights).map((h) => ({ planet: asText(h && h.planet), text: asText(h && h.text) })).filter((h) => h.text).slice(0, 4),
      advice: asText(out.advice),
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
Return STRICT JSON: {"summary":"...","gemWhy":"...","scriptureNote":"...","advice":"..."}`;
    const out = await callAI(prompt, { json: true });
    return {
      summary: asText(out.summary), gemWhy: asText(out.gemWhy),
      scriptureNote: asText(out.scriptureNote), advice: asText(out.advice), aiAssisted: true,
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
Return STRICT JSON: {"summary":"...","advice":"..."}`;
    const out = await callAI(prompt, { json: true });
    return { summary: asText(out.summary), advice: asText(out.advice), aiAssisted: true };
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
Return STRICT JSON: an object keyed by planet name, e.g. {"Venus":{"effect":"...","good":"...","caution":"...","remedy":"..."}, "Sun":{...}, ...} — include every planet listed above.`;
    const out = await callAI(prompt, { json: true });
    const res = {};
    (periods || []).forEach((p) => {
      const o = out && out[p.lord];
      if (o) res[p.lord] = { effect: asText(o.effect), good: asText(o.good), caution: asText(o.caution), remedy: asText(o.remedy) };
    });
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

  const key = `names|v4|${g}|${startArr.join(',')}|${origin.toLowerCase()}|${theme.toLowerCase()}|${words.toLowerCase()}|${lengthPref}|${count}|${cand.toLowerCase()}`;
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
    // Try AI; if it is down / rate-limited (or returns too few), fall back to the
    // curated local dataset so names ALWAYS appear. Numerology is computed in code either way.
    const out = await callAI(prompt, { json: true }).catch(() => null);
    const names = out ? asList(out.names).map(enrichName).filter(Boolean).slice(0, count) : [];

    let usedLocal = false;
    if (names.length < Math.min(6, count)) {
      usedLocal = true;
      const seen = new Set(names.map((n) => n.name.toLowerCase()));
      filterLocalNames({ gender: filters.gender, startWith: startArr, origin, theme, words, lengthPref, count })
        .map(enrichName).filter(Boolean)
        .forEach((n) => { if (!seen.has(n.name.toLowerCase())) { names.push(n); seen.add(n.name.toLowerCase()); } });
    }
    const finalNames = names.slice(0, count);

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
    const result = { names: finalNames, candidate, count: finalNames.length, aiAssisted: !!out, source: out ? (usedLocal ? 'mixed' : 'ai') : 'local' };
    // don't cache a pure-local fallback — retry AI once quota returns
    if (!out) result._fallback = true;
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
Return STRICT JSON: {"summary":"...","notes":[{"year":2026,"text":"..."}]}`;
    const out = await callAI(prompt, { json: true });
    return {
      summary: asText(out.summary),
      notes: asList(out.notes).map((n) => ({ year: Number(n && n.year), text: asText(n && n.text) })).filter((n) => n.year && n.text),
    };
  });
}

module.exports = {
  generateDailyPrediction, generatePeriodPrediction, generateTraditionalReading, generateDashaPhala, generateNames, generateNameSuggestions, generateBabyNames, answerNameQuestion, generateTransitForecast, askAstrologer, generateInsights, generateChoghadiyaMessage, generateMuhuratPick,
  generateRcmExplanation, generateGitaExplanation, generateRamayanExplanation, generateRigvedaExplanation,
  generateVedaExplanation, generateDailyShlokaExplain, generateMatchExplanation, generateGocharExplanation,
  generateRemediesExplanation,
  callAI,
};
