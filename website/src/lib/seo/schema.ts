import {
  ANDROID_PACKAGE,
  CONTACT_EMAIL,
  DEFAULT_OG_IMAGE,
  PLAY_STORE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
} from '@/lib/seo/config'
import type { PageSeo } from '@/lib/seo/routeMeta'

type JsonLd = Record<string, unknown>

export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_TAGLINE,
    inLanguage: ['en', 'hi'],
    publisher: organizationSchema(),
  }
}

export function organizationSchema(): JsonLd {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    email: CONTACT_EMAIL,
    logo: absoluteUrl('/favicon.svg'),
  }
}

export function mobileApplicationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: SITE_NAME,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Free download with optional in-app subscription. Pricing shown in app.',
    },
    downloadUrl: PLAY_STORE_URL,
    installUrl: PLAY_STORE_URL,
    softwareVersion: '[APP_VERSION — verify from Play Console]',
    image: DEFAULT_OG_IMAGE,
    description:
      'A Hindi-English Vedic astrology mobile app with personalised Kundli, location-based Panchang, Rashifal, Choghadiya, Muhurat, Kundli Milan, Vastu, Numerology and a spiritual library.',
    inLanguage: ['en', 'hi'],
    featureList: [
      'Janam Kundli and divisional charts',
      'Rashifal and Panchang',
      'Choghadiya and Muhurat',
      'Kundli Milan',
      'Vastu and Numerology',
      'Sacred text reading and audio',
      'AI-assisted explanations using chart, dasha and transit context',
    ],
    author: organizationSchema(),
    ...(ANDROID_PACKAGE ? { identifier: ANDROID_PACKAGE } : {}),
  }
}

export function webPageSchema(seo: PageSeo, pathname: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: seo.title.replace(/\s*\|\s*Shree Yantra Astrology$/, ''),
    description: seo.description,
    url: absoluteUrl(pathname),
    isPartOf: { '@type': 'WebSite', url: SITE_URL, name: SITE_NAME },
    inLanguage: 'en',
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function faqPageSchema(faqs: { question: string; answer: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function articleSchema(opts: {
  headline: string
  description: string
  pathname: string
  datePublished?: string
  dateModified?: string
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    url: absoluteUrl(opts.pathname),
    image: DEFAULT_OG_IMAGE,
    author: organizationSchema(),
    publisher: {
      ...organizationSchema(),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/favicon.svg'),
      },
    },
    datePublished: opts.datePublished || '[DATE — verify]',
    dateModified: opts.dateModified || opts.datePublished || '[DATE — verify]',
    inLanguage: 'en',
  }
}

export function combineSchemas(...schemas: JsonLd[]): string {
  const graph = schemas.filter(Boolean)
  if (graph.length === 1) return JSON.stringify(graph[0])
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
}
