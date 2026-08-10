/**
 * Generates docs/OBSERVABILITY-API-INVENTORY.md from backend routes.
 * Run: node backend/scripts/generate-api-inventory.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesPath = path.join(__dirname, '../src/routes/index.js');
const outPath = path.join(__dirname, '../../docs/OBSERVABILITY-API-INVENTORY.md');

const CONTROLLER_MAP = {
  health: 'health.controller',
  getSettings: 'settings.controller',
  updateSettings: 'settings.controller',
  updateAuthMethods: 'settings.controller',
  updateAiProvider: 'settings.controller',
  'authCtrl.config': 'auth.controller',
  'authCtrl.register': 'auth.controller',
  'authCtrl.login': 'auth.controller',
  'authCtrl.requestOtp': 'auth.controller',
  'authCtrl.verifyOtp': 'auth.controller',
  'authCtrl.google': 'auth.controller',
  'authCtrl.me': 'auth.controller',
  'authCtrl.logout': 'auth.controller',
  'authCtrl.setPassword': 'auth.controller',
  'paymentCtrl.config': 'payment.controller',
  'paymentCtrl.createSubscription': 'payment.controller',
  'paymentCtrl.verify': 'payment.controller',
  'paymentCtrl.status': 'payment.controller',
  'paymentCtrl.cancel': 'payment.controller',
  'profileCtrl.getProfile': 'profile.controller',
  'profileCtrl.updateProfile': 'profile.controller',
  'profileCtrl.uploadAvatar': 'profile.controller',
  'profileCtrl.removeAvatar': 'profile.controller',
  'libraryCtrl.publicList': 'library.controller',
  'libraryCtrl.publicGet': 'library.controller',
  'mediaCtrl.publicList': 'media.controller',
  'plansCtrl.publicList': 'plans.controller',
  'appConfigCtrl.publicGet': 'appConfig.controller',
  'faqCtrl.publicList': 'faq.controller',
  'notificationsCtrl.publicList': 'notifications.controller',
  'notificationsCtrl.unreadCount': 'notifications.controller',
  'notificationsCtrl.registerToken': 'notifications.controller',
  'notificationsCtrl.markAllRead': 'notifications.controller',
  'notificationsCtrl.markRead': 'notifications.controller',
  'notificationsCtrl.hideOne': 'notifications.controller',
  'notificationsCtrl.clearAll': 'notifications.controller',
  'analyticsCtrl.track': 'analytics.controller',
  'locationCtrl.search': 'location.controller',
  'locationCtrl.resolve': 'location.controller',
  'screensCtrl.publicAll': 'screens.controller',
  'screensCtrl.publicGet': 'screens.controller',
  createKundli: 'kundli.controller',
  createVarga: 'varga.controller',
  createDasha: 'dasha.controller',
  createYoga: 'yoga.controller',
  createChoghadiya: 'choghadiya.controller',
  createSunrise: 'sunrise.controller',
  createPanchang: 'panchang.controller',
  listObservanceCatalog: 'panchang.controller',
  listPanchangFestivals: 'panchang.controller',
  searchPanchangFestivalDates: 'panchang.controller',
  getPanchangFestivalDetail: 'panchang.controller',
  'muhuratCtrl.listCategories': 'muhurat.controller',
  'muhuratCtrl.find': 'muhurat.controller',
  createMatch: 'match.controller',
  createGochar: 'gochar.controller',
  createRemedies: 'remedies.controller',
  createReading: 'reading.controller',
  createNameSuggestions: 'reading.controller',
  createLifeTimeline: 'lifeTimeline.controller',
  createTransitForecast: 'transitForecast.controller',
  createBrihatKundli: 'brihatKundli.controller',
  'numerologyCtrl.profile': 'numerology.controller',
  'numerologyCtrl.interpret': 'numerology.controller',
  'numerologyCtrl.checkNumber': 'numerology.controller',
  'horoscopeCtrl.publicList': 'horoscope.controller',
  'horoscopeCtrl.personalized': 'horoscope.controller',
  'vastuCtrl.analyze': 'vastu.controller',
  'vastuCtrl.ask': 'vastu.controller',
  'aiCtrl.dailyPrediction': 'ai.controller',
  'aiCtrl.periodPrediction': 'ai.controller',
  'aiCtrl.signRashifal': 'ai.controller',
  'aiCtrl.babyNames': 'ai.controller',
  'aiCtrl.nameAsk': 'ai.controller',
  'aiCtrl.askAstrologer': 'ai.controller',
  'userDataCtrl.getData': 'userData.controller',
  'userDataCtrl.putData': 'userData.controller',
  'aiCtrl.chatHistory': 'ai.controller',
  'aiCtrl.clearChatHistory': 'ai.controller',
  'aiCtrl.insights': 'ai.controller',
  'aiCtrl.choghadiyaMessage': 'ai.controller',
  'aiCtrl.muhurat': 'ai.controller',
  'aiCtrl.rcmExplain': 'ai.controller',
  'aiCtrl.gitaExplain': 'ai.controller',
  'aiCtrl.ramayanExplain': 'ai.controller',
  'aiCtrl.rigvedaExplain': 'ai.controller',
  'aiCtrl.vedaExplain': 'ai.controller',
  'aiCtrl.dailyShlokaExplain': 'ai.controller',
  'aiCtrl.occasionGuide': 'ai.controller',
  'aiCtrl.occasionAsk': 'ai.controller',
  'aiCtrl.explainSimple': 'ai.controller',
  'observabilityCtrl.overview': 'observability.controller',
  'observabilityCtrl.listErrors': 'observability.controller',
  'observabilityCtrl.getError': 'observability.controller',
  'observabilityCtrl.updateError': 'observability.controller',
  'observabilityCtrl.apiStats': 'observability.controller',
  'observabilityCtrl.searchLogs': 'observability.controller',
  'observabilityCtrl.traceByRequestId': 'observability.controller',
  'serverMetricsCtrl.get': 'serverMetrics.controller',
};

function inferMeta(route, handler, auth) {
  const r = route.toLowerCase();
  const h = handler.toLowerCase();
  let authRequired = auth ? 'Yes (JWT)' : 'No';
  if (h.includes('adminonly') || r.includes('/admin/')) authRequired = 'Yes (Admin JWT)';
  if (h.includes('optionalauth')) authRequired = 'Optional JWT';

  let userData = 'None';
  if (authRequired.includes('JWT')) userData = 'user_id from token';
  if (r.includes('/profile') || r.includes('/auth/') || r.includes('/me/')) userData = 'PII: phone, name, birth profile';
  if (r.includes('/kundli') || r.includes('/panchang') || r.includes('/numerology')) userData = 'Birth data (DOB, TOB, place)';

  let external = 'None';
  if (r.includes('/ai/') || h.includes('aictrl')) external = 'Gemini / Groq / OpenRouter / ofox.ai';
  if (r.includes('/kundli') || r.includes('/panchang') || r.includes('/dasha') || r.includes('/varga')) external = 'VedAstro API + local ephemeris fallback';
  if (r.includes('/locations')) external = 'Google Places / geo resolution';
  if (r.includes('/payments')) external = 'Razorpay';
  if (r.includes('/notifications')) external = 'FCM push (Expo)';
  if (r.includes('/media') && r.includes('youtube')) external = 'YouTube Data API';

  const db = r.includes('/admin/') || auth ? 'MongoDB' : r.includes('/gita') || r.includes('/ramayan') || r.includes('/veda') ? 'MongoDB (content)' : auth ? 'MongoDB' : 'Optional MongoDB';
  const redis = 'None (not used)';
  const expected = h.includes('login') || r.includes('/auth/') ? '200 / 400 / 401 / 429' : r.includes('/admin/') ? '200 / 401 / 403 / 404' : '200 / 400 / 500';
  const errors = 'Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500';

  return { authRequired, userData, external, db, redis, expected, errors };
}

const s = fs.readFileSync(routesPath, 'utf8');
const re = /router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]\s*,\s*([^;]+);/g;
const rows = [];
let m;
while ((m = re.exec(s))) {
  const handlers = m[3].split(',').map((x) => x.trim());
  const last = handlers[handlers.length - 1].replace(/\)$/, '');
  const auth = handlers.some((h) =>
    /requireAuth|adminOnly|optionalAuth|requirePremium/.test(h),
  );
  const meta = inferMeta(m[2], handlers.join(' '), auth);
  rows.push({
    method: m[1].toUpperCase(),
    route: `/api${m[2]}`,
    controller: CONTROLLER_MAP[last] || last,
    service: last.replace(/Ctrl\.\w+$/, '.service').replace(/^create/, '').replace(/^get|^list|^update|^delete/, ''),
    handler: last,
    ...meta,
  });
}

let md = `# Observability API Inventory

> Auto-generated from \`backend/src/routes/index.js\`. Regenerate: \`node backend/scripts/generate-api-inventory.mjs\`

**Total endpoints:** ${rows.length}  
**Base path:** \`/api\`  
**Database:** MongoDB (Mongoose) — no Redis in this project  
**Generated:** ${new Date().toISOString().slice(0, 10)}

## Legend

| Column | Meaning |
|--------|---------|
| METHOD | HTTP verb |
| ROUTE | Full API path |
| CONTROLLER | Express controller module |
| AUTH | JWT / Admin / Optional |
| USER DATA | Categories of PII touched (never logged in full) |
| EXTERNAL | Third-party dependencies |
| DB | MongoDB collections accessed |
| STATUS | Typical HTTP outcomes |
| ERRORS | Common failure modes |

---

`;

const sections = {
  'Health & Settings': (r) => r.route.includes('/health') || r.route.includes('/settings'),
  'Authentication': (r) => r.route.includes('/auth'),
  'Payments': (r) => r.route.includes('/payments'),
  'Profile': (r) => r.route.includes('/profile'),
  'Public Content': (r) => ['/library', '/media', '/plans', '/app-config', '/faq', '/screens', '/gita', '/ramayan', '/ramcharitmanas', '/rigveda', '/veda/', '/daily-shloka'].some((p) => r.route.includes(p)),
  'Notifications': (r) => r.route.includes('/notifications'),
  'Analytics': (r) => r.route.includes('/analytics'),
  'Locations': (r) => r.route.includes('/locations'),
  'Astrology Core': (r) => ['/kundli', '/varga', '/dasha', '/yoga', '/choghadiya', '/sunrise', '/panchang', '/muhurat', '/match', '/gochar', '/remedies', '/horoscope', '/numerology', '/vastu'].some((p) => r.route.includes(p)),
  'AI & Premium': (r) => r.route.includes('/ai/') || ['/vedic-reading', '/life-timeline', '/transit-forecast', '/brihat-kundli', '/baby-names', '/name-ask', '/name-suggestions'].some((p) => r.route.includes(p)),
  'User Data & Chat': (r) => r.route.includes('/me/data') || r.route.includes('/chat/'),
  'Admin': (r) => r.route.includes('/admin/'),
};

for (const [name, filter] of Object.entries(sections)) {
  const group = rows.filter(filter);
  if (!group.length) continue;
  md += `\n## ${name} (${group.length})\n\n`;
  md += '| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |\n';
  md += '|--------|-------|------------|------|-----------|----------|----|--------|--------|\n';
  for (const r of group) {
    md += `| ${r.method} | \`${r.route}\` | ${r.controller} | ${r.authRequired} | ${r.userData} | ${r.external} | ${r.db} | ${r.expected} | ${r.errors} |\n`;
  }
}

const covered = new Set();
for (const filter of Object.values(sections)) rows.filter(filter).forEach((r) => covered.add(r.route));
const uncategorized = rows.filter((r) => !covered.has(r.route));
if (uncategorized.length) {
  md += `\n## Other (${uncategorized.length})\n\n`;
  md += '| METHOD | ROUTE | CONTROLLER | AUTH |\n|--------|-------|------------|------|\n';
  for (const r of uncategorized) {
    md += `| ${r.method} | \`${r.route}\` | ${r.controller} | ${r.authRequired} |\n`;
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md);
console.log(`Wrote ${rows.length} endpoints to ${outPath}`);
