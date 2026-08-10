import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ANDROID_PACKAGE,
  DEFAULT_OG_IMAGE,
  GSC_VERIFICATION,
  SITE_NAME,
  absoluteUrl,
} from '@/lib/seo/config'
import { getSeoForPath } from '@/lib/seo/routeMeta'
import { FAQ_ITEMS } from '@/data/brandShowcase'
import {
  articleSchema,
  breadcrumbSchema,
  combineSchemas,
  faqPageSchema,
  mobileApplicationSchema,
  webPageSchema,
  websiteSchema,
} from '@/lib/seo/schema'

export type SeoOverride = {
  title?: string
  description?: string
  robots?: 'index' | 'noindex'
  ogType?: 'website' | 'article'
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  breadcrumbs?: { name: string; path: string }[]
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`
  let el = document.head.querySelector(selector) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(id: string, json: string) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = json
}

export function SeoHead({ override }: { override?: SeoOverride }) {
  const { pathname } = useLocation()
  const base = useMemo(() => getSeoForPath(pathname), [pathname])
  const seo = { ...base, ...override }

  useEffect(() => {
    const canonical = absoluteUrl(pathname)
    const robots = seo.robots === 'noindex' ? 'noindex, follow' : 'index, follow'
    const ogType = seo.ogType ?? 'website'

    document.title = seo.title
    upsertMeta('name', 'description', seo.description)
    upsertMeta('name', 'robots', robots)
    upsertMeta('property', 'og:type', ogType)
    upsertMeta('property', 'og:title', seo.title)
    upsertMeta('property', 'og:description', seo.description)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:image', DEFAULT_OG_IMAGE)
    upsertMeta('property', 'og:locale', 'en_IN')
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', seo.title)
    upsertMeta('name', 'twitter:description', seo.description)
    upsertMeta('name', 'twitter:image', DEFAULT_OG_IMAGE)
    upsertLink('canonical', canonical)

    if (GSC_VERIFICATION) {
      upsertMeta('name', 'google-site-verification', GSC_VERIFICATION)
    }

    if (ANDROID_PACKAGE) {
      upsertMeta('name', 'google-play-app', `app-id=${ANDROID_PACKAGE}`)
    }

    const schemas = [websiteSchema(), mobileApplicationSchema(), webPageSchema(seo, pathname)]
    if (seo.breadcrumbs?.length) {
      schemas.push(breadcrumbSchema(seo.breadcrumbs))
    }
    if (pathname === '/app') {
      schemas.push(
        faqPageSchema(
          FAQ_ITEMS.slice(0, 6).map((item) => ({ question: item.q.en, answer: item.a.en })),
        ),
      )
    }
    if (pathname === '/shree-yantra') {
      schemas.push(
        articleSchema({
          headline: 'Ultimate Guide to Shree Yantra — Meaning, Benefits, Puja & Placement',
          description: seo.description,
          pathname: '/shree-yantra',
          datePublished: '2026-08-10',
          dateModified: '2026-08-10',
        }),
        faqPageSchema([
          {
            question: 'What is Shree Yantra?',
            answer:
              'Shree Yantra is a sacred geometric diagram used for meditation and worship in Hindu and Tantric traditions — not a substitute for professional advice.',
          },
          {
            question: 'Is Shree Yantra the same as Sri Chakra?',
            answer:
              'In many contexts both refer to closely related sacred geometry with interlocking triangles around a central bindu.',
          },
        ]),
      )
    }
    if (override?.jsonLd) {
      const extra = Array.isArray(override.jsonLd) ? override.jsonLd : [override.jsonLd]
      schemas.push(...extra)
    }
    upsertJsonLd('sy-seo-jsonld', combineSchemas(...schemas))
  }, [pathname, seo, override])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
