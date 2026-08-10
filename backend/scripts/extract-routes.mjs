import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesPath = path.join(__dirname, '../src/routes/index.js');
const s = fs.readFileSync(routesPath, 'utf8');
const re = /router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]\s*,\s*([^;]+);/g;
const rows = [];
let m;
while ((m = re.exec(s))) {
  const handlers = m[3].split(',').map((x) => x.trim());
  const last = handlers[handlers.length - 1].replace(/\)$/, '');
  const auth = handlers.some((h) =>
    /requireAuth|adminOnly|optionalAuth|requirePremium|paymentLimiter|aiLimiter|locationLimiter|adminLoginLimiter/.test(h),
  );
  const admin = handlers.some((h) => /adminOnly|requireAdmin/.test(h));
  rows.push({ method: m[1].toUpperCase(), route: `/api${m[2]}`, handler: last, auth: auth || admin });
}
console.log(JSON.stringify(rows, null, 2));
