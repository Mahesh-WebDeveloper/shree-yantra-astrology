# SEO Quality Checklist

Use before each production deploy and monthly thereafter.

## Technical

- [x] HTTPS (Netlify)
- [x] Canonical per route (`SeoHead`)
- [x] `sitemap.xml` (run `npm run seo:sitemap`)
- [x] `robots.txt` + Sitemap URL
- [x] Real 404 page (`noindex`)
- [x] Clean URLs (no hash-only primary content)
- [x] Mobile responsive (existing design)
- [x] JS rendering — content in DOM after load (SPA)
- [ ] Production URL inspection in GSC

## On-page

- [x] Unique titles (route registry)
- [x] Unique meta descriptions
- [x] Single H1 per page (verify new pages manually)
- [x] Open Graph + Twitter cards
- [ ] Alt text audit on new images (ongoing)
- [ ] Internal links on home footer to `/app`, `/shree-yantra` (recommended)

## Structured data

- [x] WebSite + Organization + MobileApplication
- [x] WebPage per route
- [x] Article + FAQ on `/shree-yantra`
- [x] FAQ on `/app`
- [x] No fake reviews/ratings/prices
- [ ] Rich Results Test on production

## International

- [x] `html lang` updates with toggle
- [ ] URL-based hreflang (future)
- [ ] Natural Hindi page copy at dedicated URLs (future)

## Performance

- [ ] LCP < 2.5s (measure in field)
- [ ] INP < 200ms
- [ ] CLS < 0.1
- [ ] Image WebP for large showcase assets
- [ ] Font loading review (preconnect present)

## Accessibility

- [x] Semantic landmarks on new pages (`main`, `article`, `nav`)
- [ ] Focus states on new interactive elements
- [ ] Color contrast spot check

## Trust (E-E-A-T)

- [x] About, Disclaimer, Legal, Contact email
- [ ] Named author/reviewer
- [x] Responsible astrology wording (no guarantees)
- [ ] Editorial policy sign-off

## Analytics

- [ ] `VITE_GA_MEASUREMENT_ID` in Netlify
- [ ] GSC property verified
- [ ] Download click events (`app_download_click`)

## Automation

```bash
npm run seo:audit
npm run build
```

Fix any `[FAIL]` before deploy.
