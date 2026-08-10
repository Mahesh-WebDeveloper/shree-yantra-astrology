# SEO Implementation Log

**Date:** 2026-08-10  
**Domain:** https://shreeyantraastrology.com

## Code changes

### New files

| Path | Purpose |
|------|---------|
| `src/lib/seo/config.ts` | Site URL, OG defaults, env-based GA/GSC |
| `src/lib/seo/routeMeta.ts` | Per-route title, description, robots, sitemap flags |
| `src/lib/seo/schema.ts` | JSON-LD builders (WebSite, Organization, MobileApplication, Article, FAQ) |
| `src/components/seo/SeoHead.tsx` | Runtime meta + canonical + JSON-LD |
| `src/components/seo/GoogleAnalytics.tsx` | Optional GA4 loader |
| `src/providers/AppProviders.tsx` | QueryClient + AuthProvider |
| `src/routes/AppRoutes.tsx` | Full route table (50+ pages) |
| `src/pages/NotFoundPage.tsx` | Real 404 with noindex |
| `src/pages/AppLandingPage.tsx` | App SEO landing |
| `src/pages/ShreeYantraGuidePage.tsx` | Shree Yantra pillar content |
| `src/pages/AboutPage.tsx` | Trust / about |
| `src/pages/DisclaimerPage.tsx` | Astrology disclaimer |
| `scripts/generate-sitemap.mjs` | Build-time sitemap |
| `scripts/seo-audit.mjs` | Static SEO checks |
| `public/sitemap.xml` | Generated sitemap |
| `public/og-image.jpg` | Social share image (placeholder) |
| `docs/*.md` | SEO documentation |

### Modified files

| Path | Change |
|------|--------|
| `src/App.tsx` | Providers, SeoHead, AppRoutes |
| `src/pages/LegalPage.tsx` | `/terms` opens Terms tab |
| `src/components/site/DownloadCta.tsx` | Google Play primary CTA |
| `src/pages/HelpPage.tsx` | Play Store + `/app` link |
| `index.html` | Canonical, og:url, og:image, Play app meta |
| `public/robots.txt` | Sitemap line, disallow auth paths |
| `public/site.webmanifest` | Correct brand name + icon |
| `package.json` | `seo:sitemap`, `seo:audit`, pre-build sitemap |
| `.env.example` | SITE_URL, GA, GSC vars |

## Netlify configuration

No change required — existing SPA fallback remains last rule in `netlify.toml`.

## Environment variables (Netlify)

```env
VITE_SITE_URL=https://shreeyantraastrology.com
VITE_GA_MEASUREMENT_ID=G-XXXXXXXX
VITE_GSC_VERIFICATION=your-token
# Optional:
VITE_APK_DOWNLOAD_URL=
```

## Commands

```bash
cd website
npm run seo:sitemap   # regenerate sitemap.xml
npm run seo:audit     # static checks
npm run build         # sitemap + tsc + vite
```

## Validation checklist

- [x] Unique titles per major route (via routeMeta)
- [x] Canonical on all routes (SeoHead)
- [x] sitemap.xml + robots Sitemap
- [x] JSON-LD without fake reviews/ratings
- [x] noindex on auth/account routes
- [x] 404 page (not soft redirect)
- [ ] Live GSC URL inspection (requires deploy)
- [ ] Rich Results Test on production URLs

## Not implemented (by design)

- URL-prefix hreflang (`/en/`, `/hi/`)
- SSR / pre-rendering
- Mass Shree Yantra sub-pages without verified content
- Fake LocalBusiness schema
