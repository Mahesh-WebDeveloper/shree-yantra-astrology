/**
 * Generates public/sitemap.xml from route SEO registry.
 * Run: node scripts/generate-sitemap.mjs
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SITE_URL = (process.env.VITE_SITE_URL || 'https://shreeyantraastrology.com').replace(/\/$/, '')

/** Keep in sync with src/lib/seo/routeMeta.ts indexable paths */
const PATHS = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/app', priority: '0.95', changefreq: 'monthly' },
  { loc: '/shree-yantra', priority: '0.95', changefreq: 'monthly' },
  { loc: '/about', priority: '0.6', changefreq: 'yearly' },
  { loc: '/disclaimer', priority: '0.5', changefreq: 'yearly' },
  { loc: '/help', priority: '0.65', changefreq: 'monthly' },
  { loc: '/legal', priority: '0.4', changefreq: 'yearly' },
  { loc: '/privacy', priority: '0.4', changefreq: 'yearly' },
  { loc: '/terms', priority: '0.4', changefreq: 'yearly' },
  { loc: '/services', priority: '0.85', changefreq: 'monthly' },
  { loc: '/kundli', priority: '0.9', changefreq: 'monthly' },
  { loc: '/kundli-learn', priority: '0.75', changefreq: 'monthly' },
  { loc: '/kundli-match', priority: '0.8', changefreq: 'monthly' },
  { loc: '/rashifal', priority: '0.85', changefreq: 'daily' },
  { loc: '/panchang', priority: '0.9', changefreq: 'daily' },
  { loc: '/choghadiya', priority: '0.85', changefreq: 'daily' },
  { loc: '/muhurat', priority: '0.8', changefreq: 'weekly' },
  { loc: '/vastu-learn', priority: '0.7', changefreq: 'monthly' },
  { loc: '/library', priority: '0.85', changefreq: 'weekly' },
  { loc: '/daily-shloka', priority: '0.75', changefreq: 'daily' },
  { loc: '/gita', priority: '0.85', changefreq: 'monthly' },
  { loc: '/ramayan', priority: '0.8', changefreq: 'monthly' },
  { loc: '/ramcharitmanas', priority: '0.8', changefreq: 'monthly' },
  { loc: '/aarti-sangrah', priority: '0.75', changefreq: 'monthly' },
  { loc: '/stotra-sangrah', priority: '0.75', changefreq: 'monthly' },
  { loc: '/mantra-sangrah', priority: '0.75', changefreq: 'monthly' },
  { loc: '/occasions', priority: '0.7', changefreq: 'weekly' },
  { loc: '/vedas', priority: '0.8', changefreq: 'monthly' },
  { loc: '/rigveda', priority: '0.75', changefreq: 'monthly' },
  { loc: '/hanuman-chalisa', priority: '0.75', changefreq: 'monthly' },
]

const lastmod = new Date().toISOString().slice(0, 10)

const urls = PATHS.map(
  (p) => `  <url>
    <loc>${SITE_URL}${p.loc === '/' ? '' : p.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
).join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

const out = join(__dirname, '..', 'public', 'sitemap.xml')
writeFileSync(out, xml, 'utf8')
console.log(`Wrote ${out} (${PATHS.length} URLs)`)
