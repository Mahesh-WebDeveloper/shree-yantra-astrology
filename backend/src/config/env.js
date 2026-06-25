// Saare environment variables ek jagah load + organize karta hai.
// Baaki code yahin se config padhega (process.env har jagah scatter na ho).
// override: true => .env ki values system env vars ko bhi override kar dengi
// (warna agar system me PORT/koi var pehle se set ho to .env ignore ho jaata hai)
require('dotenv').config({ override: true });

const numberEnv = (key, fallback) => {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const env = {
  nodeEnv,
  isProd,
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shree_yantra',
  vedastro: {
    apiKey: process.env.VEDASTRO_API_KEY || '',
    tier: (process.env.VEDASTRO_TIER || 'free').toLowerCase(), // 'free' | 'paid' (seed)
    ayanamsa: process.env.VEDASTRO_AYANAMSA || 'LAHIRI',
    baseUrl: 'https://api.vedastro.org/api',
  },
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  ai: {
    provider: (process.env.AI_PROVIDER || 'gemini').toLowerCase(), // 'gemini' | 'claude'
    geminiKey: process.env.GEMINI_API_KEY || '',
    // ALL Gemini keys tried in order (primary + extras). Each key has its own
    // per-model daily quota, so more keys = more effective free quota. Extra keys
    // via GEMINI_API_KEYS (comma-separated). Deduped, primary first.
    geminiKeys: [process.env.GEMINI_API_KEY, ...String(process.env.GEMINI_API_KEYS || '').split(',')]
      .map((s) => String(s || '').trim()).filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i),
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    // OpenRouter (OpenAI-compatible) — automatic FREE-model fallback jab primary (Gemini) fail/quota ho.
    openrouterKey: process.env.OPENROUTER_API_KEY || '',
    // Default = ek capable FREE model. Service ke andar pura free-model chain try hota hai.
    openrouterModel: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
    // Extra fallback models (CSV) — bina code change ke chain extend karne ke liye. e.g.
    // OPENROUTER_FALLBACK_MODELS="qwen/qwen-2.5-72b-instruct:free,openai/gpt-4o-mini"
    openrouterExtra: (process.env.OPENROUTER_FALLBACK_MODELS || '')
      .split(',').map((s) => s.trim()).filter(Boolean),
    // Groq (OpenAI-compatible, very fast LPU) — fallback between Gemini and OpenRouter.
    groqKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    groqExtra: (process.env.GROQ_FALLBACK_MODELS || '')
      .split(',').map((s) => s.trim()).filter(Boolean),
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || '',
    regionCode: process.env.YOUTUBE_REGION_CODE || 'IN',
  },
  maps: {
    googleApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    defaultCountry: (process.env.LOCATION_DEFAULT_COUNTRY || 'in').toLowerCase(),
    googleEnabled: process.env.GOOGLE_MAPS_ENABLED !== 'false',
    googleAutocompleteDailyLimit: numberEnv('GOOGLE_MAPS_AUTOCOMPLETE_DAILY_LIMIT', 250),
    googleAutocompleteMonthlyLimit: numberEnv('GOOGLE_MAPS_AUTOCOMPLETE_MONTHLY_LIMIT', 8000),
    googlePlaceDetailsDailyLimit: numberEnv('GOOGLE_MAPS_PLACE_DETAILS_DAILY_LIMIT', 250),
    googlePlaceDetailsMonthlyLimit: numberEnv('GOOGLE_MAPS_PLACE_DETAILS_MONTHLY_LIMIT', 8000),
  },
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  admin: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
    name: process.env.ADMIN_NAME || 'Admin',
    origin: process.env.ADMIN_ORIGIN || 'http://localhost:5173',
  },
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

module.exports = env;
