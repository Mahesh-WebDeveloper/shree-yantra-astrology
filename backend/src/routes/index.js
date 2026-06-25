const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { health } = require('../controllers/health.controller');
const { getSettings, updateSettings, updateAuthMethods, updateAiProvider } = require('../controllers/settings.controller');
const { createKundli } = require('../controllers/kundli.controller');
const { createVarga } = require('../controllers/varga.controller');
const { createDasha } = require('../controllers/dasha.controller');
const { createYoga } = require('../controllers/yoga.controller');
const { createChoghadiya } = require('../controllers/choghadiya.controller');
const { createSunrise } = require('../controllers/sunrise.controller');
const { createPanchang, listPanchangFestivals, searchPanchangFestivalDates, getPanchangFestivalDetail } = require('../controllers/panchang.controller');
const { createMatch } = require('../controllers/match.controller');
const { createGochar } = require('../controllers/gochar.controller');
const { createRemedies } = require('../controllers/remedies.controller');
const { createReading, createNameSuggestions } = require('../controllers/reading.controller');
const { createLifeTimeline } = require('../controllers/lifeTimeline.controller');
const { createTransitForecast } = require('../controllers/transitForecast.controller');
const { createBrihatKundli } = require('../controllers/brihatKundli.controller');
const horoscopeCtrl = require('../controllers/horoscope.controller');
const aiCtrl = require('../controllers/ai.controller');
const authCtrl = require('../controllers/auth.controller');
const profileCtrl = require('../controllers/profile.controller');
const adminCtrl = require('../controllers/admin.controller');
const libraryCtrl = require('../controllers/library.controller');
const plansCtrl = require('../controllers/plans.controller');
const notificationsCtrl = require('../controllers/notifications.controller');
const appConfigCtrl = require('../controllers/appConfig.controller');
const faqCtrl = require('../controllers/faq.controller');
const analyticsCtrl = require('../controllers/analytics.controller');
const screensCtrl = require('../controllers/screens.controller');
const mediaCtrl = require('../controllers/media.controller');
const locationCtrl = require('../controllers/location.controller');
const gitaCtrl = require('../controllers/gita.controller');
const ramayanCtrl = require('../controllers/ramayan.controller');
const rcmCtrl = require('../controllers/ramcharitmanas.controller');
const rigvedaCtrl = require('../controllers/rigveda.controller');
const vedaCtrl = require('../controllers/veda.controller');
const dailyCtrl = require('../controllers/daily.controller');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const { avatarUpload, contentImageUpload } = require('../middleware/upload');

const adminOnly = [requireAuth, requireAdmin];
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after a few minutes. · बहुत अधिक प्रयास — कृपया कुछ मिनट बाद पुनः प्रयास करें।' },
});

// stricter limiter for the paid AI / astrology generation endpoints (cost-abuse / billing-DoS guard)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again. · बहुत अधिक अनुरोध — कृपया थोड़ी देर बाद प्रयास करें।' },
});
router.use(['/ai', '/baby-names', '/name-ask', '/match', '/gochar', '/remedies', '/vedic-reading', '/life-timeline', '/transit-forecast', '/name-suggestions', '/brihat-kundli'], aiLimiter);

router.get('/health', health);

// dashboard toggle (free <-> paid + auth methods)
router.get('/settings', getSettings);
router.patch('/settings', adminOnly, updateSettings);
router.patch('/settings/auth-methods', adminOnly, updateAuthMethods);
router.patch('/settings/ai-provider', adminOnly, updateAiProvider);

// auth
router.get('/auth/config', authCtrl.config);
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.post('/auth/request-otp', authCtrl.requestOtp);
router.post('/auth/verify-otp', authCtrl.verifyOtp);
router.get('/auth/me', requireAuth, authCtrl.me);
router.post('/auth/set-password', requireAuth, authCtrl.setPassword);

// profile (protected)
router.get('/profile', requireAuth, profileCtrl.getProfile);
router.put('/profile', requireAuth, profileCtrl.updateProfile);
router.post('/profile/avatar', requireAuth, avatarUpload, profileCtrl.uploadAvatar);
router.delete('/profile/avatar', requireAuth, profileCtrl.removeAvatar);

// public dynamic content
router.get('/library', libraryCtrl.publicList);
router.get('/library/:id', libraryCtrl.publicGet);
router.get('/media', mediaCtrl.publicList);
router.get('/plans', plansCtrl.publicList);
router.get('/app-config', appConfigCtrl.publicGet);
router.get('/faq', faqCtrl.publicList);
router.get('/notifications', requireAuth, notificationsCtrl.publicList);
router.patch('/notifications/:id/read', requireAuth, notificationsCtrl.markRead);

// analytics (app se events aate hain — public)
router.post('/analytics/track', analyticsCtrl.track);

// location search for exact birth-place selection
const locationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 90,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many location searches. Please try again shortly. · बहुत अधिक खोज — कृपया थोड़ी देर बाद प्रयास करें।' },
});
router.get('/locations/search', locationLimiter, locationCtrl.search);
router.post('/locations/resolve', locationLimiter, locationCtrl.resolve);

// page-wise content (app real-time read karta hai)
router.get('/screens', screensCtrl.publicAll);
router.get('/screens/:page', screensCtrl.publicGet);

// Bhagavad Gita (public — library content)
router.get('/gita', gitaCtrl.list);
router.get('/gita/:chapter', gitaCtrl.getChapter);

// Valmiki Ramayana (public)
router.get('/ramayan', ramayanCtrl.kandas);
router.get('/ramayan/:kanda', ramayanCtrl.sargas);
router.get('/ramayan/:kanda/:sarga', ramayanCtrl.getSarga);

// Ramcharitmanas (Tulsidas — Hindi/Awadhi)
router.get('/ramcharitmanas', rcmCtrl.kandas);
router.get('/ramcharitmanas/:kanda', rcmCtrl.getKanda);

// Rigveda (public — Sanskrit + English; Hindi AI se)
router.get('/rigveda', rigvedaCtrl.mandalas);
router.get('/rigveda/:mandala', rigvedaCtrl.suktas);
router.get('/rigveda/:mandala/:sukta', rigvedaCtrl.getSukta);

// Generic Veda (Yajur/Sama/Atharva) — Sanskrit + English; Hindi AI se
router.get('/veda/:veda', vedaCtrl.books);
router.get('/veda/:veda/:book', vedaCtrl.sections);
router.get('/veda/:veda/:book/:section', vedaCtrl.getSection);

// Daily Spiritual Boost — roz naya shlok (date se rotate)
router.get('/daily-shloka', dailyCtrl.today);

// admin
router.post('/admin/login', adminLoginLimiter, adminCtrl.login);
router.get('/admin/stats', adminOnly, adminCtrl.stats);
router.post('/admin/uploads/image', adminOnly, contentImageUpload, adminCtrl.uploadImage);

router.get('/admin/users', adminOnly, adminCtrl.listUsers);
router.get('/admin/users/:id', adminOnly, adminCtrl.getUser);
router.patch('/admin/users/:id', adminOnly, adminCtrl.updateUser);
router.delete('/admin/users/:id', adminOnly, adminCtrl.deleteUser);

router.get('/admin/library', adminOnly, libraryCtrl.adminList);
router.post('/admin/library', adminOnly, contentImageUpload, libraryCtrl.create);
router.patch('/admin/library/reorder', adminOnly, libraryCtrl.reorder);
router.get('/admin/library/:id', adminOnly, libraryCtrl.adminGet);
router.patch('/admin/library/:id', adminOnly, contentImageUpload, libraryCtrl.update);
router.delete('/admin/library/:id', adminOnly, libraryCtrl.remove);

router.get('/admin/media', adminOnly, mediaCtrl.adminList);
router.post('/admin/media', adminOnly, contentImageUpload, mediaCtrl.create);
router.patch('/admin/media/reorder', adminOnly, mediaCtrl.reorder);
router.get('/admin/media/youtube/search', adminOnly, mediaCtrl.youtubeSearch);
router.get('/admin/media/:id', adminOnly, mediaCtrl.adminGet);
router.patch('/admin/media/:id', adminOnly, contentImageUpload, mediaCtrl.update);
router.delete('/admin/media/:id', adminOnly, mediaCtrl.remove);

router.get('/admin/plans', adminOnly, plansCtrl.adminList);
router.post('/admin/plans', adminOnly, plansCtrl.create);
router.get('/admin/plans/:id', adminOnly, plansCtrl.adminGet);
router.patch('/admin/plans/:id', adminOnly, plansCtrl.update);
router.delete('/admin/plans/:id', adminOnly, plansCtrl.remove);

router.get('/admin/notifications', adminOnly, notificationsCtrl.adminList);
router.post('/admin/notifications', adminOnly, notificationsCtrl.create);
router.patch('/admin/notifications/:id', adminOnly, notificationsCtrl.update);
router.post('/admin/notifications/:id/send', adminOnly, notificationsCtrl.send);
router.delete('/admin/notifications/:id', adminOnly, notificationsCtrl.remove);

router.get('/admin/app-config', adminOnly, appConfigCtrl.adminGet);
router.put('/admin/app-config', adminOnly, appConfigCtrl.update);

router.get('/admin/faq', adminOnly, faqCtrl.adminList);
router.post('/admin/faq', adminOnly, faqCtrl.create);
router.get('/admin/faq/:id', adminOnly, faqCtrl.adminGet);
router.patch('/admin/faq/:id', adminOnly, faqCtrl.update);
router.delete('/admin/faq/:id', adminOnly, faqCtrl.remove);

router.get('/admin/ai-cache', adminOnly, adminCtrl.listAiCache);
router.delete('/admin/ai-cache/:id', adminOnly, adminCtrl.deleteAiCache);

router.get('/admin/analytics', adminOnly, analyticsCtrl.stats);

router.get('/admin/screens', adminOnly, screensCtrl.adminList);
router.get('/admin/screens/:page', adminOnly, screensCtrl.adminGet);
router.put('/admin/screens/:page', adminOnly, screensCtrl.update);

// astrology
router.post('/kundli', createKundli);
router.post('/varga', createVarga);
router.post('/dasha', createDasha);
router.post('/yoga', createYoga);
router.post('/choghadiya', createChoghadiya);
router.post('/sunrise', createSunrise);
router.post('/panchang', createPanchang);
router.post('/panchang/festivals', listPanchangFestivals);
router.post('/panchang/festival-search', searchPanchangFestivalDates);
router.post('/panchang/festival-detail', getPanchangFestivalDetail);
router.post('/match', createMatch);
router.post('/gochar', createGochar);
router.post('/remedies', createRemedies);
router.post('/vedic-reading', createReading);
router.post('/name-suggestions', createNameSuggestions);
router.post('/life-timeline', createLifeTimeline);
router.post('/transit-forecast', createTransitForecast);
router.post('/brihat-kundli', createBrihatKundli);
router.get('/horoscope', horoscopeCtrl.publicList);
router.post('/horoscope/personalized', horoscopeCtrl.personalized);

// AI (Gemini) — VedAstro data + user info se rashifal/insights generate
router.post('/ai/daily-prediction', aiCtrl.dailyPrediction);
router.post('/ai/period-prediction', aiCtrl.periodPrediction);
router.post('/baby-names', aiCtrl.babyNames);
router.post('/name-ask', aiCtrl.nameAsk);
router.post('/ai/ask-astrologer', aiCtrl.askAstrologer);
router.post('/ai/insights', aiCtrl.insights);
router.post('/ai/choghadiya-message', aiCtrl.choghadiyaMessage);
router.post('/ai/muhurat', aiCtrl.muhurat);
router.post('/ai/rcm-explain', aiCtrl.rcmExplain);
router.post('/ai/gita-explain', aiCtrl.gitaExplain);
router.post('/ai/ramayan-explain', aiCtrl.ramayanExplain);
router.post('/ai/rigveda-explain', aiCtrl.rigvedaExplain);
router.post('/ai/veda-explain', aiCtrl.vedaExplain);
router.post('/ai/daily-shloka-explain', aiCtrl.dailyShlokaExplain);

module.exports = router;
