/**
 * Canonical page content defaults — mirrors what the mobile app shows via i18n
 * when admin CMS fields are empty. Admin Pages screen uses this for live preview.
 */

function bi(en, hi) {
  return { en, hi };
}

const PAGE_CATALOG = {
  branding: {
    label: 'Branding (Logo & Name)',
    group: 'Global',
    order: 0,
    fields: {
      appName: bi('Shree Yantra', 'श्री यंत्र'),
      tagline: bi('Astrology', 'ज्योतिष'),
      logoImage: '',
      splashTagline: bi('“Aligning your path with the cosmos”', '“आपका मार्ग ब्रह्मांड के साथ संरेखित”'),
    },
    fieldMeta: {
      appName: { hint: 'App header / splash name' },
      tagline: { hint: 'Shown under the app name' },
      logoImage: { hint: 'Overrides App Config branding logo when set' },
      splashTagline: { hint: 'Splash screen tagline' },
    },
    appConfigLinks: [
      { label: 'Branding & app version', path: '/app-config' },
    ],
  },
  home: {
    label: 'Home / Welcome',
    group: 'App Pages',
    order: 1,
    fields: {
      greeting: bi('Welcome', 'स्वागत है'),
      subtitle: bi('Your Daily Horoscope', 'आपका दैनिक राशिफल'),
      sectionTitle: bi('Explore Premium Features', 'प्रीमियम सुविधाएँ देखें'),
      featurePredTitle: bi('My Rashifal', 'मेरा राशिफल'),
      featurePredDesc: bi('YOUR personal horoscope — daily, weekly, monthly & yearly from your birth chart', 'आपका व्यक्तिगत राशिफल — अपनी जन्म कुंडली से दैनिक, साप्ताहिक, मासिक व वार्षिक'),
      featureKundliTitle: bi('Kundli / Birth Chart', 'कुंडली / जन्म कुंडली'),
      featureKundliDesc: bi('View your detailed birth chart and planetary positions', 'अपनी विस्तृत जन्म कुंडली और ग्रहों की स्थिति देखें'),
      featureAiTitle: bi('Ask the Astrologer', 'ज्योतिषी से प्रश्न पूछें'),
      featureAiDesc: bi('Ask personal questions using your chart and precise planetary data', 'अपनी कुंडली और सटीक ग्रह डेटा के आधार पर प्रश्न पूछें'),
      featurePatriTitle: bi('Naamkaran — Baby Names', 'नामकरण — शिशु के शुभ नाम'),
      featurePatriDesc: bi('Naming ceremony help: lucky baby names by nakshatra + full kundli & Vedic PDF', 'नामकरण संस्कार: नक्षत्र अनुसार शिशु के शुभ नाम + पूरी कुंडली व वैदिक PDF'),
      featureHoroscopeTitle: bi('Rashifal · 12 Signs', 'राशिफल · 12 राशियाँ'),
      featureHoroscopeDesc: bi("Today's horoscope for any of the 12 zodiac signs (yourself or family)", 'किसी भी राशि का आज का राशिफल (अपना या परिवार का)'),
      featureChogTitle: bi('Choghadiya Muhurat', 'चौघड़िया मुहूर्त'),
      featureChogDesc: bi('Find auspicious timings for important work and decisions', 'महत्वपूर्ण कार्यों के लिए शुभ मुहूर्त जानें'),
      bannerImage: '',
    },
    fieldMeta: {
      greeting: { hint: 'Before user name — e.g. "Welcome, Rahul"' },
      subtitle: { hint: 'Line under the greeting' },
      sectionTitle: { hint: 'Features section heading' },
      bannerImage: { hint: 'Hero banner image (overrides App Config home banner when set)' },
    },
    appConfigLinks: [
      { label: 'Home banners (carousel images)', path: '/app-config' },
      { label: 'Zodiac wheel on welcome screen', path: '/app-config' },
    ],
  },
  dailyPrediction: {
    label: 'Daily Prediction',
    group: 'App Pages',
    order: 2,
    fields: {
      noteText: bi(
        'Predictions are based on your precise chart and Panchang data.',
        'भविष्यवाणियाँ आपकी सटीक कुंडली व पंचांग डेटा पर आधारित हैं।',
      ),
      heroImage: '',
    },
    fieldMeta: {
      noteText: { hint: 'Disclaimer at bottom of rashifal page' },
      heroImage: { hint: 'Optional hero image' },
    },
  },
  kundli: {
    label: 'Kundli',
    group: 'App Pages',
    order: 3,
    fields: {
      pageTitle: bi('KUNDLI', 'कुंडली'),
      heading: bi('YOUR BIRTH CHART', 'आपकी जन्म कुंडली'),
    },
    fieldMeta: {
      pageTitle: { hint: 'Top page title' },
      heading: { hint: 'Chart section heading' },
    },
  },
  choghadiya: {
    label: 'Choghadiya',
    group: 'App Pages',
    order: 4,
    fields: {
      subtitle: bi("Know Today's Auspicious & Inauspicious Timings", 'आज के शुभ व अशुभ समय जानें'),
      locationNote: bi('Timings based on your location', 'आपके स्थान के अनुसार समय'),
    },
    fieldMeta: {
      subtitle: { hint: 'Subtitle under page title' },
      locationNote: { hint: 'Location hint (reserved for future use)' },
    },
  },
  subscribe: {
    label: 'Subscribe / Premium',
    group: 'App Pages',
    order: 5,
    fields: {
      subtitle: bi('Unlock Premium Predictions & Remedies', 'प्रीमियम भविष्यवाणियाँ व उपाय अनलॉक करें'),
      trialTiny: bi('for 7 days', '7 दिनों के लिए'),
      bannerImage: '',
    },
    fieldMeta: {
      subtitle: { hint: 'Main subscribe pitch text' },
      trialTiny: { hint: 'Trial period label' },
      bannerImage: { hint: 'Subscribe screen banner' },
    },
    appConfigLinks: [
      { label: 'Subscription plans', path: '/plans' },
    ],
  },
  profile: {
    label: 'Profile',
    group: 'App Pages',
    order: 6,
    fields: {
      premiumBadge: bi('PREMIUM MEMBER', 'प्रीमियम सदस्य'),
      freeBadge: bi('GO PREMIUM →', 'प्रीमियम लें →'),
    },
    fieldMeta: {
      premiumBadge: { hint: 'Badge when user has premium' },
      freeBadge: { hint: 'Badge when user is on free plan' },
    },
  },
  library: {
    label: 'Library',
    group: 'App Pages',
    order: 7,
    fields: {
      heading: bi('DIVINE LIBRARY', 'दिव्य पुस्तकालय'),
      subtitle: bi('Mantras, Scriptures & Vedic Wisdom', 'मंत्र, शास्त्र व वैदिक ज्ञान'),
    },
    fieldMeta: {
      heading: { hint: 'Library hero title' },
      subtitle: { hint: 'Library hero subtitle' },
    },
    appConfigLinks: [
      { label: 'CMS books (admin library)', path: '/library' },
      { label: 'Audio / media items', path: '/media' },
    ],
  },
};

function isEmptyField(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'object') {
    const en = (value.en || '').trim();
    const hi = (value.hi || '').trim();
    return !en && !hi;
  }
  return true;
}

function normalizeBilingual(value) {
  if (value === undefined || value === null) return { en: '', hi: '' };
  if (typeof value === 'string') return { en: value, hi: value };
  return { en: value.en || '', hi: value.hi || '' };
}

function enrichFields(dbFields = {}, defaultFields = {}) {
  const keys = new Set([...Object.keys(defaultFields), ...Object.keys(dbFields)]);
  const effective = {};
  const sources = {};
  for (const key of keys) {
    const dbVal = dbFields[key];
    const defVal = defaultFields[key];
    if (!isEmptyField(dbVal)) {
      effective[key] = normalizeBilingual(dbVal);
      sources[key] = 'custom';
    } else if (defVal !== undefined && !isImageKey(key)) {
      effective[key] = normalizeBilingual(defVal);
      sources[key] = 'default';
    } else if (isImageKey(key)) {
      effective[key] = typeof dbVal === 'string' ? dbVal : '';
      sources[key] = dbVal ? 'custom' : 'default';
    }
  }
  return { effective, sources };
}

function isImageKey(key) {
  return /image|logo|photo|icon|cover|banner/i.test(key);
}

function enrichScreen(row = {}, appConfig = null) {
  const catalog = PAGE_CATALOG[row.page] || {};
  const defaultFields = catalog.fields || {};
  const dbFields = row.fields || {};
  const { effective, sources } = enrichFields(dbFields, defaultFields);
  const appConfigPreview = buildAppConfigPreview(row.page, appConfig);

  return {
    ...row,
    defaults: defaultFields,
    fieldMeta: catalog.fieldMeta || {},
    effective,
    sources,
    appConfigLinks: catalog.appConfigLinks || [],
    appConfigPreview,
  };
}

function buildAppConfigPreview(page, appConfig) {
  if (!appConfig) return null;
  if (page === 'home') {
    const banners = (appConfig.homeBanners || []).filter((b) => b.isActive !== false);
    const flags = appConfig.featureFlags || {};
    return {
      homeBanners: banners.length,
      activeBannerTitle: banners[0]?.title || null,
      showZodiacWheel: flags.showZodiacWheel !== false,
      zodiacWheelOffsetY: Number(flags.zodiacWheelOffsetY) || 0,
    };
  }
  if (page === 'branding') {
    const b = appConfig.branding || {};
    return {
      appName: b.appName || 'Shree Yantra',
      tagline: b.tagline || 'Astrology',
      logoUrl: b.logoUrl || '',
    };
  }
  return null;
}

async function ensureScreenPages(ScreenContent) {
  let added = 0;
  for (const [page, meta] of Object.entries(PAGE_CATALOG)) {
    const r = await ScreenContent.updateOne(
      { page },
      {
        $setOnInsert: {
          page,
          label: meta.label,
          group: meta.group,
          order: meta.order,
          fields: {},
        },
      },
      { upsert: true },
    );
    if (r.upsertedCount) added += 1;
  }
  return added;
}

module.exports = {
  PAGE_CATALOG,
  isEmptyField,
  normalizeBilingual,
  enrichFields,
  enrichScreen,
  ensureScreenPages,
  isImageKey,
};
