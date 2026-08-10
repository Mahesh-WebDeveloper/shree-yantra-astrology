import { APP_FEATURES } from '@/data/appFeatures'

export type PageSeo = {
  /** Route pattern, e.g. `/kundli` or `/gita/:n` */
  path: string
  title: string
  description: string
  /** Include in sitemap.xml */
  sitemap?: boolean
  /** `index` (default) or `noindex` */
  robots?: 'index' | 'noindex'
  priority?: number
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  /** Open Graph type override */
  ogType?: 'website' | 'article'
  /** Breadcrumb labels for structured data */
  breadcrumbs?: { name: string; path: string }[]
}

const NOINDEX_ACCOUNT = new Set([
  '/sign-in',
  '/onboarding/birth',
  '/profile',
  '/notifications',
  '/plans',
  '/manage-subscription',
  '/subscribe',
  '/payment',
  '/billing-options',
  '/daily-prediction',
  '/predictions',
  '/kundli-explore',
  '/example-kundli',
])

function featureMeta(route: string, title: string, description: string, extra?: Partial<PageSeo>): PageSeo {
  return {
    path: route,
    title: `${title} | Shree Yantra Astrology`,
    description,
    sitemap: !NOINDEX_ACCOUNT.has(route),
    robots: NOINDEX_ACCOUNT.has(route) ? 'noindex' : 'index',
    priority: route === '/' ? 1 : 0.7,
    changefreq: route === '/' ? 'weekly' : 'monthly',
    ...extra,
  }
}

/** Static SEO registry — English meta for crawlers; on-page copy remains bilingual via LangProvider. */
export const PAGE_SEO: PageSeo[] = [
  featureMeta(
    '/',
    'Shree Yantra — Vedic Astrology App for Kundli, Panchang & Rashifal',
    'Download Shree Yantra Astrology — a Hindi-English Vedic astrology app with personalised Kundli, location-based Panchang, Rashifal, Muhurat, Kundli Milan, Numerology and a spiritual library.',
    { priority: 1, changefreq: 'weekly' },
  ),
  featureMeta(
    '/app',
    'Shree Yantra Astrology App — Features & Download',
    'Explore the Shree Yantra Astrology Android app: Janam Kundli, Rashifal, Panchang, Choghadiya, Muhurat, AI Vedic guidance, Gita, Ramayan, Aarti, Mantra and more. Available on Google Play.',
    { priority: 0.95, breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'App', path: '/app' }] },
  ),
  featureMeta(
    '/shree-yantra',
    'Shree Yantra Guide — Meaning, Benefits, Puja, Placement & Meditation',
    'Complete guide to Shree Yantra (Sri Yantra / Sri Chakra): meaning, symbolism, traditional worship, puja vidhi, placement, mantra, meditation and common questions — with responsible spiritual context.',
    {
      priority: 0.95,
      ogType: 'article',
      breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Shree Yantra Guide', path: '/shree-yantra' }],
    },
  ),
  featureMeta(
    '/about',
    'About Shree Yantra Astrology',
    'Learn about Shree Yantra Astrology — our mission, editorial approach, and how we present Vedic astrology and spiritual content responsibly.',
    { priority: 0.6, breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }] },
  ),
  featureMeta(
    '/disclaimer',
    'Astrology & Spiritual Content Disclaimer',
    'Important disclaimer: Vedic astrology and spiritual guidance on Shree Yantra Astrology are traditional beliefs and informational guidance — not guaranteed outcomes or professional advice.',
    { priority: 0.5, robots: 'index', breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Disclaimer', path: '/disclaimer' }] },
  ),
  featureMeta(
    '/help',
    'Help & FAQ — Shree Yantra Astrology',
    'Answers to common questions about the Shree Yantra Astrology app, downloads, Kundli, Panchang and support contact.',
    { priority: 0.65 },
  ),
  featureMeta(
    '/legal',
    'Privacy Policy & Terms — Shree Yantra Astrology',
    'Privacy policy and terms of service for Shree Yantra Astrology app and website.',
    { priority: 0.4, changefreq: 'yearly' },
  ),
  featureMeta('/privacy', 'Privacy Policy — Shree Yantra Astrology', 'How Shree Yantra Astrology collects, uses and protects your personal data.', {
    priority: 0.4,
    changefreq: 'yearly',
  }),
  featureMeta('/terms', 'Terms of Service — Shree Yantra Astrology', 'Terms of service for using Shree Yantra Astrology app and website.', {
    priority: 0.4,
    changefreq: 'yearly',
  }),
  featureMeta('/privacy-security', 'Privacy & Security — Shree Yantra Astrology', 'Privacy and security information for Shree Yantra Astrology.', {
    priority: 0.3,
    robots: 'noindex',
    sitemap: false,
  }),
  featureMeta(
    '/services',
    'All Vedic Astrology App Services',
    'Browse every Shree Yantra Astrology feature: Kundli, Rashifal, Panchang, Muhurat, library, numerology, vastu and more.',
    { priority: 0.85 },
  ),
  featureMeta(
    '/kundli',
    'Janam Kundli & Birth Chart Online',
    'Create and explore your Janam Kundli with graha positions, divisional charts, dasha, yogas and doshas — powered by Lahiri ayanamsa.',
    { priority: 0.9 },
  ),
  featureMeta('/kundli-learn', 'Learn Kundli — Vedic Birth Chart Basics', 'Learn how to read a Janam Kundli: houses, grahas, rashis, nakshatras and divisional charts in plain language.'),
  featureMeta('/kundli-match', 'Kundli Milan — 36 Guna Match Making', 'Compare two birth charts with Ashtakoot Kundli Milan — 36 guna scoring with Mangal Dosha context.'),
  featureMeta('/rashifal', 'Rashifal — Daily Horoscope for 12 Rashis', 'Read daily, weekly and monthly Rashifal for all 12 Vedic zodiac signs.'),
  featureMeta('/my-rashifal', 'My Personal Rashifal', 'Personalised Rashifal based on your Janam Kundli.', { robots: 'noindex', sitemap: false }),
  featureMeta('/panchang', 'Panchang — Tithi, Nakshatra, Yoga & Festivals', 'Location-aware Hindu Panchang with tithi, nakshatra, yoga, karana, sunrise, sunset and festivals for your city.'),
  featureMeta('/choghadiya', 'Choghadiya — Auspicious Time for Daily Work', 'Day and night Choghadiya muhurat tables based on local sunrise and sunset.'),
  featureMeta('/muhurat', 'Shubh Muhurat Finder', 'Find auspicious muhurat windows for marriage, griha pravesh, vehicle purchase and other occasions.'),
  featureMeta('/numerology', 'Numerology — Mulank, Bhagyank & Name Number', 'Explore Ank Jyotish: mulank, bhagyank and name number guidance from your birth date and name.', { robots: 'noindex', sitemap: false }),
  featureMeta('/vastu', 'Vastu Shastra Audit & Home Guidance', 'Vastu review tools with zoning maps and practical guidance for your home.', { robots: 'noindex', sitemap: false }),
  featureMeta('/vastu-learn', 'Learn Vastu Shastra Basics', 'Educational guide to Vastu directions, zones and common home practices.'),
  featureMeta('/baby-names', 'Nakshatra Baby Names — Naamkaran', 'Nakshatra-based baby name suggestions for Naamkaran.', { robots: 'noindex', sitemap: false }),
  featureMeta('/remedies', 'Vedic Astrology Remedies', 'Chart-based gemstone, mantra and upaya suggestions — traditional guidance, not guaranteed results.', { robots: 'noindex', sitemap: false }),
  featureMeta('/vedic-reading', 'Vedic Phaladesh Reading', 'Traditional Vedic birth analysis with panchang context.', { robots: 'noindex', sitemap: false }),
  featureMeta('/brihat-kundli', 'Brihat Kundli PDF Report', 'Detailed Brihat Kundli report export.', { robots: 'noindex', sitemap: false }),
  featureMeta('/janam-patri', 'Janam Patri & Naamkaran Report', 'Janam Patri PDF with naamkaran suggestions.', { robots: 'noindex', sitemap: false }),
  featureMeta('/gochar', 'Gochar — Planetary Transits', 'Current and upcoming graha gochar from your birth chart.', { robots: 'noindex', sitemap: false }),
  featureMeta('/life-timeline', 'Vimshottari Dasha Timeline', 'Life timeline with Vimshottari dasha periods.', { robots: 'noindex', sitemap: false }),
  featureMeta('/transit-forecast', 'Yearly Transit Forecast', 'Year-by-year Saturn, Jupiter and dasha transit forecast.', { robots: 'noindex', sitemap: false }),
  featureMeta('/ai-astrologer', 'AI Vedic Astrologer', 'Ask questions grounded in your birth chart — AI explains Jyotish in simpler Hindi or English.', { robots: 'noindex', sitemap: false }),
  featureMeta('/library', 'Divine Library — Gita, Ramayan, Vedas & Devotion', 'Read and listen to Bhagavad Gita, Ramayan, Vedas, Puranas, Aarti, Mantra and Stotra collections.'),
  featureMeta('/daily-shloka', 'Daily Shloka', 'Today\'s Sanskrit shloka with meaning — refreshed daily.'),
  featureMeta('/gita', 'Bhagavad Gita — 18 Chapters', 'Read Bhagavad Gita chapter by chapter with Sanskrit, transliteration and meaning.'),
  featureMeta('/ramayan', 'Ramayana — Valmiki Ramayan', 'Read Valmiki Ramayana kanda and sarga by sarga.'),
  featureMeta('/ramcharitmanas', 'Ramcharitmanas — Tulsidas', 'Read Ramcharitmanas kanda by kanda with chaupai.'),
  featureMeta('/aarti-sangrah', 'Aarti Sangrah — Hindu Aarti Collection', 'Collection of popular Hindu aartis with lyrics for daily puja.'),
  featureMeta('/stotra-sangrah', 'Stotra Sangrah', 'Devotional stotras for daily recitation.'),
  featureMeta('/mantra-sangrah', 'Mantra Sangrah', 'Sacred mantra collection with audio where available.'),
  featureMeta('/occasions', 'Shubh Avsar — Hindu Festivals & Occasions', 'Festival dates, significance and muhurat context.'),
  featureMeta('/vedas', 'Vedas & Mahapuranas Hub', 'Explore Rigveda, Yajurveda, Samaveda, Atharvaveda and Puranic texts.'),
  featureMeta('/rigveda', 'Rigveda — Mandala & Sukta Reading', 'Read Rigveda mandalas and suktas online.'),
  featureMeta('/hanuman-chalisa', 'Hanuman Chalisa', 'Read and recite Hanuman Chalisa with lyrics.'),
  featureMeta('/sign-in', 'Sign In', 'Sign in to Shree Yantra Astrology.', { robots: 'noindex', sitemap: false }),
  featureMeta('/onboarding/birth', 'Birth Details Setup', 'Add birth details for Kundli calculations.', { robots: 'noindex', sitemap: false }),
  featureMeta('/profile', 'My Profile', 'Manage your Shree Yantra Astrology profile.', { robots: 'noindex', sitemap: false }),
  featureMeta('/notifications', 'Notifications', 'Notification preferences.', { robots: 'noindex', sitemap: false }),
  featureMeta('/plans', 'Plans & Premium', 'Subscription plans for Shree Yantra Astrology.', { robots: 'noindex', sitemap: false }),
]

/** Dynamic patterns for nested content routes (sitemap lists parent only). */
export const DYNAMIC_SEO_PATTERNS: PageSeo[] = [
  {
    path: '/gita/:n',
    title: 'Bhagavad Gita Chapter | Shree Yantra Astrology',
    description: 'Read a Bhagavad Gita chapter with Sanskrit verses and meaning.',
    robots: 'index',
    sitemap: false,
  },
  {
    path: '/aarti/:id',
    title: 'Aarti | Shree Yantra Astrology',
    description: 'Read Hindu aarti lyrics for daily worship.',
    robots: 'index',
    sitemap: false,
  },
  {
    path: '/mantra/:id',
    title: 'Mantra | Shree Yantra Astrology',
    description: 'Sacred mantra with transliteration and meaning.',
    robots: 'index',
    sitemap: false,
  },
  {
    path: '/stotra/:id',
    title: 'Stotra | Shree Yantra Astrology',
    description: 'Devotional stotra for daily recitation.',
    robots: 'index',
    sitemap: false,
  },
]

/** Fallback meta from appFeatures for routes not explicitly listed. */
function metaFromFeatures(): PageSeo[] {
  const listed = new Set(PAGE_SEO.map((p) => p.path))
  return APP_FEATURES.filter((f) => !listed.has(f.route) && f.route !== '/').map((f) =>
    featureMeta(f.route, f.en, `Explore ${f.en} in Shree Yantra Astrology — Vedic astrology and spiritual tools in Hindi and English.`),
  )
}

const ALL_STATIC = [...PAGE_SEO, ...metaFromFeatures()]

function matchPattern(pathname: string, pattern: string): boolean {
  const pathParts = pathname.split('/').filter(Boolean)
  const patternParts = pattern.split('/').filter(Boolean)
  if (pathParts.length !== patternParts.length) return false
  return patternParts.every((part, i) => part.startsWith(':') || part === pathParts[i])
}

export function getSeoForPath(pathname: string): PageSeo {
  const path = pathname.split('?')[0] || '/'
  const exact = ALL_STATIC.find((p) => p.path === path)
  if (exact) return exact

  for (const dyn of DYNAMIC_SEO_PATTERNS) {
    if (matchPattern(path, dyn.path)) return dyn
  }

  return {
    path,
    title: 'Page Not Found | Shree Yantra Astrology',
    description: 'The page you requested could not be found on Shree Yantra Astrology.',
    robots: 'noindex',
    sitemap: false,
  }
}

export function getSitemapEntries(): { loc: string; priority: number; changefreq: PageSeo['changefreq'] }[] {
  return ALL_STATIC.filter((p) => p.sitemap !== false && p.robots !== 'noindex').map((p) => ({
    loc: p.path,
    priority: p.priority ?? 0.5,
    changefreq: p.changefreq ?? 'monthly',
  }))
}
