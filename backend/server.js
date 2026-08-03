// Entry point — pehle DB connect, phir server start.
const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const Settings = require('./src/models/Settings');

// ── Production safety guards: refuse to boot with insecure defaults ──
if (env.isProd) {
  const weakJwt = !process.env.JWT_SECRET || /dev_secret|dev_only_change/i.test(env.jwtSecret) || env.jwtSecret.length < 24;
  if (weakJwt) { console.error('FATAL: set a strong JWT_SECRET (32+ chars) for production.'); process.exit(1); }
  if (!env.corsOrigins.length) {
    console.warn('WARN: CORS_ORIGINS is empty — permissive CORS is ON (set CORS_ALLOW_ALL=false to use allow-list only).');
  }
  if (env.payments.enabled) {
    const missingPaymentConfig = !env.payments.razorpayKeyId
      || !env.payments.razorpayKeySecret
      || !env.payments.razorpayPlanId
      || !env.payments.razorpayWebhookSecret;
    if (missingPaymentConfig) {
      console.error('FATAL: Razorpay payments are enabled but required payment environment variables are missing.');
      process.exit(1);
    }
    if (env.payments.razorpayKeyId.startsWith('rzp_test_')) {
      console.error('FATAL: Test Razorpay keys cannot be used with NODE_ENV=production.');
      process.exit(1);
    }
  } else {
    console.warn('WARN: PAYMENTS_ENABLED is not true; new paid subscriptions cannot be created.');
  }
  if (env.corsOrigins.includes('*')) { console.error('FATAL: CORS_ORIGINS must not contain "*" in production (credentials are enabled).'); process.exit(1); }
  // the admin panel exposes all user PII + delete — reject a default/weak admin password
  const ap = process.env.ADMIN_PASSWORD || '';
  if (!ap || ap.length < 10 || /^admin|^password|12345/i.test(ap)) {
    console.error('FATAL: set a strong ADMIN_PASSWORD (10+ chars, not a default) for production.');
    process.exit(1);
  }
}

// process-level safety nets — log instead of silently dying
process.on('unhandledRejection', (reason) => console.error('⚠️ unhandledRejection:', reason));
process.on('uncaughtException', (err) => console.error('💥 uncaughtException:', err));

(async () => {
  try {
    await connectDB();
    await Settings.getGlobal(); // singleton settings ko startup par hi seed kar do (race avoid)
    const server = app.listen(env.port, () => {
      console.log(`🚀 Server:    http://localhost:${env.port}`);
      console.log(`🛠  Dashboard: http://localhost:${env.port}/dashboard.html`);
      console.log(`❤️  Health:    http://localhost:${env.port}/api/health`);
    });
    const shutdown = (sig) => { console.log(`\n${sig} received — shutting down…`); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 8000); };
    ['SIGTERM', 'SIGINT'].forEach((s) => process.on(s, () => shutdown(s)));
  } catch (e) {
    console.error('Startup failed:', e.message);
    process.exit(1);
  }
})();
