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

// Map any raw error message + status → professional bilingual message + retriable flag.
function friendly(raw, status, lang) {
  raw = String(raw || '');
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
          const f = friendly(body.error, status, reqLang(req));
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
  console.error('💥', status, raw); // full detail stays in server logs only
  const f = friendly(raw, status, reqLang(req));
  res.status(status >= 400 && status < 600 ? status : 500).json({ error: f.msg, retriable: f.retriable });
}

module.exports = { notFound, errorHandler, sanitizeResponses, friendly };
