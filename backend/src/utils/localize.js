function langFromReq(req) {
  return req.query.lang === 'hi' || req.headers['x-app-language'] === 'hi' ? 'hi' : 'en';
}

function cleanText(value) {
  return value == null ? '' : String(value).trim();
}

function i18nValue(source, field, lang, fallback = '') {
  const tx = source && source.translations;
  const localized = tx && tx[lang] && tx[lang][field];
  const english = tx && tx.en && tx.en[field];
  const hindi = tx && tx.hi && tx.hi[field];
  return cleanText(localized || (lang === 'hi' ? hindi : english) || source[field] || fallback);
}

function i18nArray(source, field, lang, fallback = []) {
  const tx = source && source.translations;
  const localized = tx && tx[lang] && tx[lang][field];
  const english = tx && tx.en && tx.en[field];
  const hindi = tx && tx.hi && tx.hi[field];
  const value = localized || (lang === 'hi' ? hindi : english) || source[field] || fallback;
  return Array.isArray(value) ? value.map((item) => cleanText(item)).filter(Boolean) : fallback;
}

function normalizeTranslations(value, defaults = {}) {
  const input = typeof value === 'string' ? safeJson(value, {}) : value || {};
  const out = {
    en: { ...(defaults.en || {}) },
    hi: { ...(defaults.hi || {}) },
  };
  ['en', 'hi'].forEach((lang) => {
    if (input[lang] && typeof input[lang] === 'object') out[lang] = { ...out[lang], ...input[lang] };
  });
  return out;
}

function safeJson(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function localizeScreenFields(fields = {}, lang = 'en') {
  const out = {};
  Object.entries(fields || {}).forEach(([key, value]) => {
    if (key.endsWith('_en') || key.endsWith('_hi')) return;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = cleanText(value[lang] || value.en || value.hi || '');
    } else {
      const suffixed = fields[`${key}_${lang}`] || fields[`${key}_en`] || fields[`${key}_hi`];
      out[key] = cleanText(suffixed || value || '');
    }
  });
  return out;
}

module.exports = {
  i18nArray,
  i18nValue,
  langFromReq,
  localizeScreenFields,
  normalizeTranslations,
  safeJson,
};
