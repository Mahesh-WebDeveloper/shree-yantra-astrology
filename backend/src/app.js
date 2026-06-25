const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const routes = require('./routes');
const env = require('./config/env');
const { notFound, errorHandler, sanitizeResponses } = require('./middleware/errorHandler');

const app = express();

// --- security + basics (industry standard middleware) ---
// crossOriginResourcePolicy: app (alag origin) se uploaded images load ho saken
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const defaultCorsOrigins = [
  env.admin.origin,
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://localhost:19006',
  'http://localhost:8081',
  'http://localhost:3000',
];
const allowedOrigins = env.corsOrigins.length ? env.corsOrigins : defaultCorsOrigins;
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(Object.assign(new Error('CORS origin not allowed'), { status: 403 }));
  },
  credentials: true,
}));            // app/admin frontend yahan se baat karega
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

// --- 404 + error handler (sabse aakhir me) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
