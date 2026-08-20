// 404 + central error handler + response sanitizer (industry standard — ek hi jagah).
// IMPORTANT: raw provider/technical errors (Gemini, Google Places, fetch, DB, stack)
// AND romanized-Hindi (Hinglish) messages kabhi user tak nahi jaane chahiye —
// yahan unhe professional bilingual message me badalte hain. Yeh BOTH ko cover karta hai:
//  - thrown errors (errorHandler)
//  - direct res.status(4xx).json({error}) responses (sanitizeResponses res.json patch)

function notFound(req, res, next) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

const reqLang = (req) => {
  const l = String((req && (req.body && req.body.lang || req.query && req.query.lang)) || '').toLowerCase();
  return l.startsWith('hi') ? 'hi' : 'en';
};

// Patterns that mean "technical/provider error" — never show these verbatim.
const TECHNICAL = /(gemini|google|places api|generativelanguage|quota|api[_ ]?key|x-goog|fetch failed|ECONN|ETIMEDOUT|ENOTFOUND|socket|getaddrinfo|nominatim|vedastro|mongo|mongoose|buffering|JSON|undefined|cannot read|is not a function|timeout)/i;

// Romanized-Hindi (Hinglish) tokens → not professional → replace with clean message.
const HINGLISH = /(chahiye|nahi|nhi|karein|kar(o| )|ho paya|thodi|dobara|phir|baad|ke liye| ya | aur |\bYA\b|mila|mili| hua|dalein|bharein|expire ho|galat)/i;

const FRIENDLY = {
  busy: {
    en: 'Our astrology service is busy right now. Please try again in a moment.',
    hi: 'ज्योतिष सेवा अभी व्यस्त है। कृपया थोड़ी देर बाद पुनः प्रयास करें।',
  },
  place: {
    en: 'We could not find that birth place. Please re-select it from the place search.',
    hi: 'जन्म स्थान नहीं मिल पाया। कृपया स्थान खोज से दोबारा चुनें।',
  },
  needInput: {
    en: 'Please provide all the required details to continue.',
    hi: 'कृपया जारी रखने के लिए सभी आवश्यक विवरण भरें।',
  },
  notFound: {
    en: 'The requested content could not be found.',
    hi: 'अनुरोधित जानकारी नहीं मिल पाई।',
  },
  session: {
    en: 'Your session has expired. Please sign in again.',
    hi: 'आपका सत्र समाप्त हो गया है। कृपया पुनः साइन इन करें।',
  },
  rateLimit: {
    en: 'Too many attempts. Please try again after a few minutes.',
    hi: 'बहुत अधिक प्रयास। कृपया कुछ मिनट बाद पुनः प्रयास करें।',
  },
  generic: {
    en: 'Something went wrong. Please try again shortly.',
    hi: 'कुछ गड़बड़ हो गई। कृपया थोड़ी देर बाद पुनः प्रयास करें।',
  },
};

const OTP_FRIENDLY = {
  OTP_INVALID_MOBILE: {
    en: 'Enter a valid 10-digit Indian mobile number.',
    hi: 'कृपया 10 अंकों का सही भारतीय मोबाइल नंबर दर्ज करें।',
  },
  OTP_RATE_LIMIT: {
    en: 'Too many OTP requests. Please try again later.',
    hi: 'बहुत अधिक ओटीपी अनुरोध किए गए हैं। कृपया कुछ समय बाद पुनः प्रयास करें।',
  },
  OTP_COOLDOWN: {
    en: 'Please wait before requesting another OTP.',
    hi: 'नया ओटीपी मंगाने से पहले कृपया कुछ समय प्रतीक्षा करें।',
  },
  OTP_REQUEST_IN_PROGRESS: {
    en: 'An OTP request is already in progress. Please wait.',
    hi: 'ओटीपी भेजने की प्रक्रिया जारी है। कृपया प्रतीक्षा करें।',
  },
  OTP_REQUEST_INVALID: {
    en: 'This verification request is no longer valid. Request a new OTP.',
    hi: 'यह सत्यापन अनुरोध अब मान्य नहीं है। कृपया नया ओटीपी मंगाएँ।',
  },
  OTP_EXPIRED: {
    en: 'The OTP has expired. Request a new OTP.',
    hi: 'ओटीपी की समय-सीमा समाप्त हो गई है। कृपया नया ओटीपी मंगाएँ।',
  },
  OTP_INVALID: {
    en: 'The OTP is incorrect. Please check it and try again.',
    hi: 'ओटीपी सही नहीं है। कृपया जाँचकर पुनः प्रयास करें।',
  },
  OTP_ATTEMPTS_EXCEEDED: {
    en: 'Too many incorrect attempts. Request a new OTP.',
    hi: 'बहुत अधिक गलत प्रयास हुए हैं। कृपया नया ओटीपी मंगाएँ।',
  },
  OTP_RESEND_LIMIT: {
    en: 'The resend limit has been reached. Please try again later.',
    hi: 'ओटीपी दोबारा भेजने की सीमा पूरी हो गई है। कृपया कुछ समय बाद प्रयास करें।',
  },
  OTP_PROVIDER_TIMEOUT: {
    en: 'OTP delivery timed out. Please try again.',
    hi: 'ओटीपी सेवा ने समय पर उत्तर नहीं दिया। कृपया पुनः प्रयास करें।',
  },
  OTP_PROVIDER_UNAVAILABLE: {
    en: 'OTP service is temporarily unavailable. Please try again shortly.',
    hi: 'ओटीपी सेवा अस्थायी रूप से उपलब्ध नहीं है। कृपया थोड़ी देर बाद प्रयास करें।',
  },
  OTP_PROVIDER_REJECTED: {
    en: 'OTP could not be sent or verified. Please try again.',
    hi: 'ओटीपी भेजा या सत्यापित नहीं हो सका। कृपया पुनः प्रयास करें।',
  },
  OTP_PROVIDER_CONFIG: {
    en: 'Mobile verification is temporarily unavailable.',
    hi: 'मोबाइल सत्यापन सेवा अस्थायी रूप से उपलब्ध नहीं है।',
  },
  OTP_PROVIDER_TEMPLATE_INVALID: {
    en: 'Mobile verification is temporarily unavailable. Please contact support.',
    hi: 'मोबाइल सत्यापन सेवा अस्थायी रूप से उपलब्ध नहीं है। कृपया सहायता से संपर्क करें।',
  },
  OTP_PROVIDER_BALANCE: {
    en: 'Mobile verification is temporarily unavailable. Please contact support.',
    hi: 'मोबाइल सत्यापन सेवा अस्थायी रूप से उपलब्ध नहीं है। कृपया सहायता से संपर्क करें।',
  },
  OTP_WIDGET_TOKEN_INVALID: {
    en: 'This mobile verification session is invalid. Please request a new OTP.',
    hi: 'यह मोबाइल सत्यापन सत्र मान्य नहीं है। कृपया नया ओटीपी मंगाएँ।',
  },
  OTP_WIDGET_TOKEN_USED: {
    en: 'This mobile verification session has already been used. Please request a new OTP.',
    hi: 'इस मोबाइल सत्यापन सत्र का पहले ही उपयोग हो चुका है। कृपया नया ओटीपी मंगाएँ।',
  },
  OTP_WIDGET_PHONE_MISMATCH: {
    en: 'The verified mobile number does not match. Please start again.',
    hi: 'सत्यापित मोबाइल नंबर मेल नहीं खाता। कृपया प्रक्रिया फिर से शुरू करें।',
  },
};

// Map any raw error message + status → professional bilingual message + retriable flag.
function friendly(raw, status, lang, code) {
  raw = String(raw || '');
  if (code && OTP_FRIENDLY[code]) {
    return {
      msg: OTP_FRIENDLY[code][lang],
      retriable: ['OTP_RATE_LIMIT', 'OTP_COOLDOWN', 'OTP_REQUEST_IN_PROGRESS', 'OTP_PROVIDER_TIMEOUT', 'OTP_PROVIDER_UNAVAILABLE'].includes(code),
    };
  }
  if (/place nahi mila|birth place|could not find that birth/i.test(raw)) return { msg: FRIENDLY.place[lang], retriable: false };
  if (/too many/i.test(raw)) return { msg: FRIENDLY.rateLimit[lang], retriable: true };
  if (status === 429 || status === 503 || status === 502 || /busy|overload|quota|gemini|places api|generativelanguage/i.test(raw)) return { msg: FRIENDLY.busy[lang], retriable: true };
  if (status >= 500 || TECHNICAL.test(raw)) return { msg: FRIENDLY.generic[lang], retriable: status >= 500 };
  if (status === 401 || /session|sign ?in|\blogin\b|token|unauthor/i.test(raw)) return { msg: FRIENDLY.session[lang], retriable: false };
  if (status === 404 || /not found|nahi mil/i.test(raw)) return { msg: FRIENDLY.notFound[lang], retriable: false };
  if (status === 400 || /chahiye|required|provide|\bYA\b/i.test(raw)) return { msg: FRIENDLY.needInput[lang], retriable: false };
  if (HINGLISH.test(raw)) return { msg: FRIENDLY.generic[lang], retriable: false };
  return { msg: raw || FRIENDLY.generic[lang], retriable: false }; // already-professional message → keep
}

// Patch res.json so EVERY 4xx/5xx { error } body (even direct res.status().json()) gets sanitized.
function sanitizeResponses(req, res, next) {
  const orig = res.json.bind(res);
  res.json = (body) => {
    try {
      if (body && typeof body === 'object' && typeof body.error === 'string') {
        const status = res.statusCode || 200;
        if (status >= 400) {
          const f = friendly(body.error, status, reqLang(req), body.code);
          body = { ...body, error: f.msg, retriable: body.retriable != null ? body.retriable : f.retriable };
        }
      }
    } catch (_) { /* never let sanitization break a response */ }
    return orig(body);
  };
  next();
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const raw = String(err.message || '');
  try {
    const { recordError } = require('../services/observability.service');
    recordError(err, {
      requestId: req.requestId,
      traceId: req.traceId,
      route: req.route?.path ? `${req.baseUrl || ''}${req.route.path}` : req.path,
      method: req.method,
      userId: req.user?._id,
      platform: req.headers['x-platform'],
      appVersion: req.headers['x-app-version'],
      statusCode: status,
    }).catch(() => {});
  } catch (_) { /* fail-safe */ }
  if (err.code) res.locals.errorCode = err.code;
  console.error('💥', status, raw); // full detail stays in server logs only
  const f = friendly(raw, status, reqLang(req), err.code);
  res.status(status >= 400 && status < 600 ? status : 500).json({
    error: f.msg,
    retriable: f.retriable,
    requestId: req.requestId,
    ...(err.code ? { code: err.code } : {}),
    ...(err.retryAfterSeconds ? { retryAfterSeconds: err.retryAfterSeconds } : {}),
  });
}

module.exports = { notFound, errorHandler, sanitizeResponses, friendly };
