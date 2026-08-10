/**
 * Lightweight SEO audit — checks static files and route registry expectations.
 * Run: node scripts/seo-audit.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const issues = []
const warnings = []

function check(name, ok, detail) {
  if (!ok) issues.push(`[FAIL] ${name}: ${detail}`)
  else console.log(`[OK] ${name}`)
}

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8')
check('canonical in index.html', indexHtml.includes('rel="canonical"'), 'missing')
check('og:url in index.html', indexHtml.includes('og:url'), 'missing')
check('og:image in index.html', indexHtml.includes('og:image'), 'missing')

const robots = readFileSync(join(root, 'public', 'robots.txt'), 'utf8')
check('Sitemap in robots.txt', robots.includes('Sitemap:'), 'missing Sitemap line')

check('sitemap.xml exists', existsSync(join(root, 'public', 'sitemap.xml')), 'run npm run seo:sitemap')

const manifestRaw = readFileSync(join(root, 'public', 'site.webmanifest'), 'utf8').replace(/^\uFEFF/, '')
const manifest = JSON.parse(manifestRaw)
check('manifest name', manifest.name?.includes('Shree Yantra') && !manifest.short_name?.includes('Yantraa'), JSON.stringify(manifest))
check('manifest icons', Array.isArray(manifest.icons) && manifest.icons.length > 0, 'empty icons')

if (!existsSync(join(root, 'public', 'og-image.jpg'))) {
  warnings.push('[WARN] public/og-image.jpg missing — add 1200×630 branded image for social sharing')
}

console.log('\n--- Summary ---')
if (warnings.length) warnings.forEach((w) => console.log(w))
if (issues.length) {
  issues.forEach((i) => console.error(i))
  process.exit(1)
}
console.log('SEO audit passed.')
