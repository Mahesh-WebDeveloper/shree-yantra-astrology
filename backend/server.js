// Entry point — pehle DB connect, phir server start.
const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const Settings = require('./src/models/Settings');

// ── Production safety guards: refuse to boot with insecure defaults ──
if (env.isProd) {
  const weakJwt = !process.env.JWT_SECRET || /dev_secret|dev_only_change/i.test(env.jwtSecret) || env.jwtSecret.length < 24;
  if (weakJwt) { console.error('FATAL: set a strong JWT_SECRET (32+ chars) for production.'); process.exit(1); }
  if (!env.corsOrigins.length) { console.error('FATAL: set CORS_ORIGINS to your real admin/web origin(s) for production.'); process.exit(1); }
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
