const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const routes = require('./routes');
const env = require('./config/env');
const { notFound, errorHandler, sanitizeResponses } = require('./middleware/errorHandler');
const paymentCtrl = require('./controllers/payment.controller');

const app = express();

// --- security + basics (industry standard middleware) ---
// crossOriginResourcePolicy: app (alag origin) se uploaded images load ho saken
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // HTTP-only deploy → drop "upgrade-insecure-requests" (it would force the admin panel's
  // same-origin asset/API requests to https, which isn't served → blank page).
  contentSecurityPolicy: { useDefaults: true, directives: { 'upgrade-insecure-requests': null } },
}));
const defaultCorsOrigins = [
  env.admin.origin,
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  // marketing website dev server (Vite picks 5174/5175 when 5173 is taken)
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://localhost:19006',
  'http://localhost:8081',
  'http://localhost:3000',
  // production website — its LiveProof section reads the panchang straight from here
  'https://shreeyantra.app',
  'https://www.shreeyantra.app',
];
const allowedOrigins = env.corsOrigins.length ? env.corsOrigins : defaultCorsOrigins;
const NETLIFY_ORIGIN_RE = /^https:\/\/([a-z0-9-]+--)?[a-z0-9-]+\.netlify\.app$/i;
// Temporary open CORS for marketing / preview deploys (Netlify, etc.).
// Set CORS_ALLOW_ALL=false later to restore the allow-list below.
const corsAllowAll = process.env.CORS_ALLOW_ALL !== 'false';
app.use(cors({
  origin(origin, cb) {
    if (corsAllowAll) return cb(null, true);
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    if (NETLIFY_ORIGIN_RE.test(origin)) return cb(null, true);
    return cb(Object.assign(new Error('CORS origin not allowed'), { status: 403 }));
  },
  credentials: true,
}));            // app/admin frontend yahan se baat karega

// Razorpay signs the exact raw bytes. This endpoint must be mounted before express.json().
app.post(
  '/api/payments/razorpay/webhook',
  rateLimit({ windowMs: 60 * 1000, max: 180, standardHeaders: true, legacyHeaders: false }),
  express.raw({ type: 'application/json', limit: '256kb' }),
  paymentCtrl.webhook
);
app.use(express.json({ limit: '1mb' }));    // JSON body parse (capped)
app.use(morgan(env.isProd ? 'combined' : 'dev'));     // request logging

// --- uploaded files (profile pics) static serve ---
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// abuse se bachao (per IP rate limit)
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 120 }));

// sanitize every {error} response (direct 4xx validation too) → professional bilingual
app.use('/api', sanitizeResponses);

// --- API routes ---
app.use('/api', routes);

// --- chhota admin dashboard (free/paid toggle) ---
app.use('/', express.static(path.join(__dirname, '..', 'public')));

// --- full Admin Panel (Vite/React SPA) served at /admin (BrowserRouter → deep-link fallback) ---
// static files are already served above via public/admin/*; this only catches client-side routes.
app.get(/^\/admin(\/.*)?$/, (req, res, next) => {
  if (req.path.startsWith('/admin/assets/')) return next(); // real asset → 404 if missing, don't mask
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

// --- 404 + error handler (sabse aakhir me) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
