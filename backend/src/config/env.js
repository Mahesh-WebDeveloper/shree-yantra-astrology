// Saare environment variables ek jagah load + organize karta hai.
// Baaki code yahin se config padhega (process.env har jagah scatter na ho).
// override: true => .env ki values system env vars ko bhi override kar dengi
// (warna agar system me PORT/koi var pehle se set ho to .env ignore ho jaata hai)
require('dotenv').config({ override: true });

const numberEnv = (key, fallback) => {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const positiveIntEnv = (key, fallback) => {
  const n = Number(process.env[key]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
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
    // ALL OpenRouter keys (primary + extras via OPENROUTER_API_KEYS csv). Each key has
    // its own free-tier rate-limit, so more keys = more fallback capacity. Deduped.
    openrouterKeys: [process.env.OPENROUTER_API_KEY, ...String(process.env.OPENROUTER_API_KEYS || '').split(',')]
      .map((s) => String(s || '').trim()).filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i),
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
    // ofox.ai (OpenAI-compatible aggregator) — last-resort fallback. Default free model;
    // paid models (e.g. openai/gpt-5.4-mini) need account credits → add via OFOX_FALLBACK_MODELS.
    ofoxKey: process.env.OFOX_API_KEY || '',
    ofoxModel: process.env.OFOX_MODEL || 'z-ai/glm-4.7-flash:free',
    ofoxExtra: (process.env.OFOX_FALLBACK_MODELS || '')
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
    // Photon (photon.komoot.io) — free OSM-based typeahead with typo tolerance; the
    // primary source for tiny Indian villages/tehsils. A self-hosted URL can be set
    // via PHOTON_URL; otherwise the public endpoint is used.
    photonEnabled: process.env.PHOTON_ENABLED !== 'false',
    photonUrl: process.env.PHOTON_URL || 'https://photon.komoot.io/api',
  },
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  msg91: {
    authkey: process.env.MSG91_AUTHKEY || '',
    // MSG91 OTP dashboard template ID; this is not the telecom DLT template ID.
    // Deliberately do not fall back to MSG91_TEMPLATE_ID: that legacy variable in
    // this project contains an SMS-template ID, which MSG91's OTP API rejects.
    otpTemplateId: process.env.MSG91_OTP_TEMPLATE_ID || '',
    dltTemplateId: process.env.MSG91_DLT_TEMPLATE_ID || '',
    senderId: process.env.MSG91_SENDER_ID || '',
    peId: process.env.MSG91_PE_ID || '',
    hashSecret: process.env.OTP_HASH_SECRET || '',
    expirySeconds: positiveIntEnv('MSG91_OTP_EXPIRY_SECONDS', 300),
    resendCooldownSeconds: positiveIntEnv('OTP_RESEND_COOLDOWN_SECONDS', 45),
    maxSendAttempts: positiveIntEnv('OTP_MAX_SEND_ATTEMPTS', 3),
    maxIpSendAttempts: positiveIntEnv('OTP_MAX_IP_SEND_ATTEMPTS', 10),
    maxIpVerifyAttempts: positiveIntEnv('OTP_MAX_IP_VERIFY_ATTEMPTS', 30),
    maxVerifyAttempts: positiveIntEnv('OTP_MAX_VERIFY_ATTEMPTS', 5),
    maxResendAttempts: positiveIntEnv('OTP_MAX_RESEND_ATTEMPTS', 2),
    sendWindowMs: positiveIntEnv('OTP_SEND_WINDOW_SECONDS', 15 * 60) * 1000,
    verifyWindowMs: positiveIntEnv('OTP_VERIFY_WINDOW_SECONDS', 15 * 60) * 1000,
    timeoutMs: positiveIntEnv('MSG91_TIMEOUT_MS', 20000),
    requestTimeoutMs: positiveIntEnv('MSG91_REQUEST_LOCK_MS', 15000),
  },
  // Google Sign-In: the WEB OAuth client ID (used as the ID-token audience to verify).
  google: { clientId: process.env.GOOGLE_CLIENT_ID || '' },
  payments: {
    enabled: process.env.PAYMENTS_ENABLED === 'true',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
    razorpayPlanId: process.env.RAZORPAY_PLAN_ID || '',
    // Use a separate random secret configured in Razorpay Dashboard for webhooks.
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    currency: 'INR',
    trialAmountPaise: 100,
    trialDays: 7,
    monthlyAmountPaise: 49900,
    totalBillingCycles: positiveIntEnv('RAZORPAY_TOTAL_BILLING_CYCLES', 1200),
    checkoutExpiryMinutes: positiveIntEnv('RAZORPAY_CHECKOUT_EXPIRY_MINUTES', 30),
  },
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
