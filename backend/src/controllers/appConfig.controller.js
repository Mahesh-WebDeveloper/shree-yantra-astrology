const asyncHandler = require('../middleware/asyncHandler');
const AppConfig = require('../models/AppConfig');
const { i18nValue, langFromReq, normalizeTranslations } = require('../utils/localize');

function parseJsonMaybe(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function normalizeImageItems(value) {
  const items = parseJsonMaybe(value, []);
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    title: String(item.title || '').trim(),
    subtitle: String(item.subtitle || '').trim(),
    translations: normalizeTranslations(item.translations, {
      en: { title: item.title || '', subtitle: item.subtitle || '' },
      hi: {},
    }),
    imageUrl: String(item.imageUrl || '').trim(),
    link: String(item.link || '').trim(),
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
    isActive: item.isActive === undefined ? true : !!item.isActive,
  }));
}

function normalizeFeatured(value) {
  const items = parseJsonMaybe(value, []);
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    type: String(item.type || 'library').trim(),
    refId: item.refId || undefined,
    title: String(item.title || '').trim(),
    translations: normalizeTranslations(item.translations, {
      en: { title: item.title || '' },
      hi: {},
    }),
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
  }));
}

function applyPayload(config, body) {
  if (body.onboardingSlides !== undefined) config.onboardingSlides = normalizeImageItems(body.onboardingSlides);
  if (body.homeBanners !== undefined) config.homeBanners = normalizeImageItems(body.homeBanners);
  if (body.featuredContent !== undefined) config.featuredContent = normalizeFeatured(body.featuredContent);
  if (body.support !== undefined) {
    const support = parseJsonMaybe(body.support, {});
    config.support = {
      email: String(support.email || '').trim(),
      phone: String(support.phone || '').trim(),
    };
  }
  config.support = config.support || {};
  if (body.supportEmail !== undefined) config.support.email = String(body.supportEmail || '').trim();
  if (body.supportPhone !== undefined) config.support.phone = String(body.supportPhone || '').trim();
  if (body.appVersion !== undefined) config.appVersion = String(body.appVersion || '').trim();
  if (body.branding !== undefined) {
    const b = parseJsonMaybe(body.branding, {});
    config.branding = config.branding || {};
    ['appName', 'tagline', 'logoUrl', 'primaryColor', 'accentColor'].forEach((k) => {
      if (b[k] !== undefined) config.branding[k] = String(b[k] || '').trim();
    });
    if (b.translations !== undefined) {
      config.branding.translations = normalizeTranslations(b.translations, {
        en: { appName: config.branding.appName || '', tagline: config.branding.tagline || '' },
        hi: {},
      });
    }
    config.markModified('branding');
  }
  if (body.featureFlags !== undefined) {
    const flags = parseJsonMaybe(body.featureFlags, {});
    config.featureFlags = flags && typeof flags === 'object' && !Array.isArray(flags) ? flags : {};
    config.markModified('featureFlags');
  }
}

function localizeImageItem(item, lang) {
  return {
    ...item,
    title: i18nValue(item, 'title', lang),
    subtitle: i18nValue(item, 'subtitle', lang),
  };
}

function localizeConfig(config, lang) {
  const obj = config.toObject ? config.toObject() : config;
  const branding = obj.branding || {};
  return {
    ...obj,
    onboardingSlides: (obj.onboardingSlides || []).map((item) => localizeImageItem(item, lang)),
    homeBanners: (obj.homeBanners || []).map((item) => localizeImageItem(item, lang)),
    featuredContent: (obj.featuredContent || []).map((item) => ({
      ...item,
      title: i18nValue(item, 'title', lang),
    })),
    branding: {
      ...branding,
      appName: i18nValue(branding, 'appName', lang, branding.appName || 'Shree Yantra'),
      tagline: i18nValue(branding, 'tagline', lang, branding.tagline || 'Astrology'),
    },
  };
}

exports.publicGet = asyncHandler(async (req, res) => {
  const config = await AppConfig.getGlobal();
  res.json({ config: localizeConfig(config, langFromReq(req)) });
});

exports.adminGet = asyncHandler(async (req, res) => {
  const config = await AppConfig.getGlobal();
  res.json({ config });
});

exports.update = asyncHandler(async (req, res) => {
  const config = await AppConfig.getGlobal();
  applyPayload(config, req.body);
  await config.save();
  res.json({ config });
});
