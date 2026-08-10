# SEO Baseline Audit — Shree Yantra Astrology Website

**Domain:** https://shreeyantraastrology.com  
**Audit date:** 2026-08-10  
**Stack:** React 19 + Vite 8 + TypeScript SPA, React Router 7, Tailwind 4, Netlify deploy

---

## A. Current architecture

| Item | Finding |
|------|---------|
| Framework | Vite SPA (not Next.js) — client-side routing with Netlify `/* → index.html` fallback |
| Routes (before) | Only `/`, `/legal`, `/privacy`, `/terms`, `/help`; all other URLs redirected home |
| Routes (after) | 50+ feature routes restored; SEO landing pages at `/app`, `/shree-yantra`, `/about`, `/disclaimer`; proper 404 |
| i18n | Client-side EN/HI toggle via `LangProvider` + `localStorage` — no `/en/`/`/hi/` URL split yet |
| Backend | Same-origin `/api/*` proxy to VPS via `netlify.toml` |
| Content | 55+ page components existed but were orphaned from router |

## B. Current SEO implementation (post-fix)

- Per-route titles, descriptions, canonical, Open Graph, Twitter cards via `SeoHead`
- `robots.txt` with `Sitemap:` directive
- Auto-generated `sitemap.xml` (30 indexable URLs)
- JSON-LD: WebSite, Organization, WebPage, MobileApplication (+ Article/FAQ on pillar pages)
- Google Play app-id meta; GA4 + GSC verification via env vars
- `noindex` on account/auth/checkout alias routes

## C. Critical problems (resolved)

1. ~~No sitemap~~ → generated at build time  
2. ~~No canonical / og:url / og:image~~ → added  
3. ~~All feature URLs 302/redirect to home~~ → routes wired  
4. ~~`/terms` showed Privacy tab by default~~ → pathname-aware LegalPage  
5. ~~Catch-all hid 404s~~ → dedicated NotFoundPage with `noindex`  
6. ~~Download CTA pointed to mailto/APK only~~ → Google Play primary  

## D. High-impact opportunities (remaining)

- Add dedicated 1200×630 branded `og-image.jpg` (placeholder copied from hero asset)
- URL-based hreflang (`/en/`, `/hi/`) with content parity — requires migration plan
- Pre-render or SSR for key landing pages (optional; improves crawler certainty)
- Search Console + GA4 live configuration with env vars in Netlify
- Expert reviewer name on About / pillar content
- Verify scriptural citations before publishing expanded Shree Yantra content

## E. Medium-impact opportunities

- Expand Shree Yantra cluster (`/shree-yantra/meaning/`, etc.) only when each page has unique depth
- Internal linking from home footer to pillar + top services
- Image WebP conversion for showcase assets
- Core Web Vitals measurement in production (Search Console + PageSpeed)
- Blog/content hub when editorial capacity exists

## F. Low-impact improvements

- Breadcrumb UI matching JSON-LD on content pages
- `lastmod` per-page from git or CMS
- hreflang x-default when bilingual URLs exist
- Structured data for individual Gita chapters (only if visible FAQ/Q&A blocks added)

## G. Things that should NOT be changed

- Existing home page design, animations, Three.js hero, brand gold theme
- Backend API contracts and payment flows
- Fabricated reviews, ratings, download counts, or scriptural quotes
- Mass creation of thin keyword pages

## H. Information required from you

- [ ] GA4 measurement ID → `VITE_GA_MEASUREMENT_ID`
- [ ] Search Console verification token → `VITE_GSC_VERIFICATION`
- [ ] Named astrology/spiritual content reviewer for E-E-A-T
- [ ] Verified app version for schema `softwareVersion`
- [ ] Final branded OG image (1200×630)
- [ ] Decision on URL-based Hindi/English architecture

## I. Safely implemented automatically

- SEO component layer, sitemap, robots, manifest fix, route wiring, pillar pages, docs, audit scripts
