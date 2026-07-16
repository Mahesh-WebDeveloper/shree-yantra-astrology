const asyncHandler = require('../middleware/asyncHandler');
const ai = require('../services/ai.service');
const Ramcharitmanas = require('../models/Ramcharitmanas');
const GitaChapter = require('../models/GitaChapter');
const RamayanSarga = require('../models/RamayanSarga');
const RigVeda = require('../models/RigVeda');
const VedaText = require('../models/VedaText');
const ChatMessage = require('../models/ChatMessage');
const daily = require('./daily.controller');

const needBirth = (b) => b && b.dob && b.tob && b.tz && (b.place != null || (b.lat != null && b.lng != null));

// POST /api/ai/daily-prediction  { dob, tob, tz, place|lat+lng, name? }
exports.dailyPrediction = asyncHandler(async (req, res) => {
  if (!needBirth(req.body)) return res.status(400).json({ error: 'Chahiye: dob, tob, tz, aur (place YA lat+lng)' });
  res.json(await ai.generateDailyPrediction(req.body));
});

// POST /api/ai/period-prediction  { dob, tob, tz, place|lat+lng, name?, period:'week'|'month'|'year' }
exports.periodPrediction = asyncHandler(async (req, res) => {
  if (!needBirth(req.body)) return res.status(400).json({ error: 'Chahiye: dob, tob, tz, aur (place YA lat+lng)' });
  res.json(await ai.generatePeriodPrediction(req.body, req.body.period));
});

// POST /api/ai/sign-rashifal  { sign, period:'daily'|'weekly'|'monthly'|'yearly', lang?, moonTransit?, sunTransit? }
// AI-rich, period-scaled horoscope for ONE zodiac sign (12-rashi page) — sections + saral + conclusion.
const VALID_SIGNS = new Set(['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']);
exports.signRashifal = asyncHandler(async (req, res) => {
  const { sign } = req.body;
  if (!VALID_SIGNS.has(String(sign))) return res.status(400).json({ error: 'Valid English sign name required (Aries..Pisces)' });
  res.json(await ai.generateSignRashifal(req.body));
});

// POST /api/baby-names  { startWith?|letter?, words?, theme?, origin?, lengthPref?, count?, gender?, lang? }
// general name explorer (no chart needed). At least one of startWith/letter/words/theme/origin required.
exports.babyNames = asyncHandler(async (req, res) => {
  const { letter, startWith, words, theme, origin, lengthPref, count, gender, lang } = req.body;
  const has = (v) => Array.isArray(v) ? v.length > 0 : !!String(v || '').trim();
  if (!has(startWith) && !has(letter) && !has(words) && !has(theme) && !has(origin)) {
    return res.status(400).json({ error: 'Chahiye: startWith/letter, words, theme YA origin me se koi ek' });
  }
  res.json(await ai.generateBabyNames({ letter, startWith, words, theme, origin, lengthPref, count, gender, lang }));
});

// POST /api/name-ask  { question, names?: (string|{name})[], gender?, lang? } — name Q&A helper
exports.nameAsk = asyncHandler(async (req, res) => {
  const { question, names, gender, lang } = req.body;
  if (!String(question || '').trim()) return res.status(400).json({ error: 'Chahiye: question' });
  res.json(await ai.answerNameQuestion({ question, names, gender, lang }));
});

// POST /api/ai/ask-astrologer  { dob, tob, tz, place|lat+lng, name?, question }
// optionalAuth lagta hai: jawab sabko milta hai, par logged-in user ka turn
// history me permanently save ho jaata hai.
exports.askAstrologer = asyncHandler(async (req, res) => {
  if (!needBirth(req.body)) return res.status(400).json({ error: 'Chahiye: dob, tob, tz, aur (place YA lat+lng)' });
  const question = String(req.body.question || '').trim();
  if (!question) return res.status(400).json({ error: 'Question chahiye' });

  const response = await ai.askAstrologer(req.body);

  // save history — best-effort, jawab kabhi block/fail na ho
  if (req.user) {
    ChatMessage.create({ user: req.user._id, question, response, lang: req.body.lang || 'en' }).catch(() => {});
  }
  res.json(response);
});

/* ── Astrologer chat history (protected) ──────────────────────────────────
 * DB me poora all-time record. App pichle 2 din local cache karta hai (turant
 * dikhne ke liye); usse purana yahan se `before` cursor se load hota hai.
 */
// GET /api/chat/history?before=<ISO>&limit=&q=  → newest-first
// `q` (optional) = case-insensitive text search on the question OR the stored
// answer; same auth/user scoping + `before` cursor. q absent = old behaviour.
exports.chatHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 30));
  const before = req.query.before ? new Date(String(req.query.before)) : null;
  const q = { user: req.user._id };
  if (before && !isNaN(before.getTime())) q.createdAt = { $lt: before };
  const text = String(req.query.q || '').trim();
  if (text) {
    const rx = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escaped → literal match, never a regex injection
    q.$or = [{ question: rx }, { 'response.answer': rx }];
  }

  const rows = await ChatMessage.find(q).sort({ createdAt: -1 }).limit(limit + 1).lean();
  const hasMore = rows.length > limit;
  const turns = (hasMore ? rows.slice(0, limit) : rows).map((r) => ({
    id: String(r._id),
    question: r.question,
    response: r.response || null,
    createdAt: r.createdAt,
  }));
  res.json({ turns, hasMore });
});

// DELETE /api/chat/history  → user apni poori chat history mita sakta hai
exports.clearChatHistory = asyncHandler(async (req, res) => {
  const r = await ChatMessage.deleteMany({ user: req.user._id });
  res.json({ ok: true, deleted: r.deletedCount || 0 });
});

// POST /api/ai/insights  { dob, tob, tz, place|lat+lng }
exports.insights = asyncHandler(async (req, res) => {
  if (!needBirth(req.body)) return res.status(400).json({ error: 'Chahiye: dob, tob, tz, aur (place YA lat+lng)' });
  res.json({ insights: await ai.generateInsights(req.body) });
});

// POST /api/ai/choghadiya-message  { dob, tob, tz, place|lat+lng, period, quality }
exports.choghadiyaMessage = asyncHandler(async (req, res) => {
  const { period, quality } = req.body;
  if (!needBirth(req.body) || !period) return res.status(400).json({ error: 'Chahiye: birth details + period' });
  res.json(await ai.generateChoghadiyaMessage(req.body, { period, quality }));
});

// POST /api/ai/muhurat  { activity, periods:[{name,time,nature}], lang } — best Choghadiya window for an activity
exports.muhurat = asyncHandler(async (req, res) => {
  const { activity, periods, lang } = req.body;
  if (!String(activity || '').trim()) return res.status(400).json({ error: 'Chahiye: activity' });
  res.json(await ai.generateMuhuratPick({ activity, periods, lang }));
});

// POST /api/ai/rcm-explain  { kanda, number } — Ramcharitmanas chand ka Hindi anuvad + bhavarth
exports.rcmExplain = asyncHandler(async (req, res) => {
  const kandaOrder = Number(req.body.kanda);
  const number = String(req.body.number || '');
  if (!kandaOrder || !number) return res.status(400).json({ error: 'Chahiye: kanda aur number' });
  const doc = await Ramcharitmanas.findOne({ kandaOrder }, { kandaHindi: 1, verses: 1 }).lean();
  if (!doc) return res.status(404).json({ error: 'Kand nahi mila' });
  const v = (doc.verses || []).find((x) => String(x.number) === number);
  if (!v) return res.status(404).json({ error: 'Chand nahi mila' });
  res.json(await ai.generateRcmExplanation({
    kandaOrder, kandaHindi: doc.kandaHindi, number, type: v.type, text: v.text,
  }));
});

// POST /api/ai/gita-explain  { chapter, verse } — Gita shlok ka Hindi anuvad + katha + seekh
exports.gitaExplain = asyncHandler(async (req, res) => {
  const chapter = Number(req.body.chapter);
  const verse = Number(req.body.verse);
  if (!chapter || !verse) return res.status(400).json({ error: 'Chahiye: chapter aur verse' });
  const ch = await GitaChapter.findOne({ chapter }, { name: 1, verses: 1 }).lean();
  if (!ch) return res.status(404).json({ error: 'Adhyay nahi mila' });
  const v = (ch.verses || []).find((x) => Number(x.verse) === verse);
  if (!v) return res.status(404).json({ error: 'Shlok nahi mila' });
  res.json(await ai.generateGitaExplanation({
    chapter, verse, chapterName: ch.name, sanskrit: v.sanskrit, english: v.english,
  }));
});

// POST /api/ai/ramayan-explain  { kanda, sarga, shloka } — Valmiki shlok ka Hindi anuvad + katha + seekh
exports.ramayanExplain = asyncHandler(async (req, res) => {
  const kandaOrder = Number(req.body.kanda);
  const sarga = Number(req.body.sarga);
  const shloka = String(req.body.shloka || '');
  if (!kandaOrder || !sarga || !shloka) return res.status(400).json({ error: 'Chahiye: kanda, sarga aur shloka' });
  const doc = await RamayanSarga.findOne({ kandaOrder, sarga }, { kanda: 1, shlokas: 1 }).lean();
  if (!doc) return res.status(404).json({ error: 'Sarga nahi mila' });
  const s = (doc.shlokas || []).find((x) => String(x.shloka) === shloka);
  if (!s) return res.status(404).json({ error: 'Shlok nahi mila' });
  res.json(await ai.generateRamayanExplanation({
    kandaOrder, kandaName: doc.kanda, sarga, shloka, sanskrit: s.sanskrit, english: s.english,
  }));
});

// POST /api/ai/rigveda-explain  { mandala, sukta, verse } — Rigveda mantra ka Hindi anuvad + katha + seekh
exports.rigvedaExplain = asyncHandler(async (req, res) => {
  const mandala = Number(req.body.mandala);
  const sukta = Number(req.body.sukta);
  const verse = Number(req.body.verse);
  if (!mandala || !sukta || !verse) return res.status(400).json({ error: 'Chahiye: mandala, sukta aur verse' });
  const doc = await RigVeda.findOne({ mandala, sukta }, { mantras: 1 }).lean();
  if (!doc) return res.status(404).json({ error: 'Sukta nahi mila' });
  const m = (doc.mantras || []).find((x) => Number(x.verse) === verse);
  if (!m) return res.status(404).json({ error: 'Mantra nahi mila' });
  res.json(await ai.generateRigvedaExplanation({
    mandala, sukta, verse, sanskrit: m.sanskrit, english: m.english,
  }));
});

// POST /api/ai/veda-explain  { veda, book, section, verse } — Yajur/Sama/Atharva mantra ka Hindi anuvad + katha + seekh
exports.vedaExplain = asyncHandler(async (req, res) => {
  const veda = String(req.body.veda || '');
  const book = Number(req.body.book);
  const section = Number(req.body.section);
  const verse = Number(req.body.verse);
  // NOTE: verse 0 valid hai (Mahabharata ka mangala shlok shloka=0) — isliye isFinite check, !verse nahi
  if (!veda || !Number.isFinite(book) || !Number.isFinite(section) || !Number.isFinite(verse))
    return res.status(400).json({ error: 'Chahiye: veda, book, section, verse' });
  const doc = await VedaText.findOne({ veda, book, section }, { verses: 1 }).lean();
  if (!doc) return res.status(404).json({ error: 'Section nahi mila' });
  const m = (doc.verses || []).find((x) => Number(x.verse) === verse);
  if (!m) return res.status(404).json({ error: 'Mantra nahi mila' });
  const lang = req.body.lang === 'en' ? 'en' : 'hi';
  res.json(await ai.generateVedaExplanation({
    veda, book, section, verse, sanskrit: m.sanskrit, english: m.english, lang,
  }));
});

// POST /api/ai/occasion-guide  { occasion, lang } — full authentic ritual guide for a Shubh Avsar
exports.occasionGuide = asyncHandler(async (req, res) => {
  const occasion = String(req.body.occasion || '');
  const lang = req.body.lang === 'en' ? 'en' : 'hi';
  if (!occasion) return res.status(400).json({ error: 'Chahiye: occasion' });
  try {
    res.json(await ai.generateOccasionGuide({ occasion, lang }));
  } catch (e) {
    if (e && e.status === 400) return res.status(400).json({ error: 'Invalid occasion' });
    throw e;
  }
});

// POST /api/ai/occasion-ask  { occasion, question, lang } — AI ritual assistant Q&A
exports.occasionAsk = asyncHandler(async (req, res) => {
  const occasion = String(req.body.occasion || '');
  const question = String(req.body.question || '').trim();
  const lang = req.body.lang === 'en' ? 'en' : 'hi';
  if (!occasion || !question) return res.status(400).json({ error: 'Chahiye: occasion, question' });
  res.json(await ai.answerOccasionQuestion({ occasion, question, lang }));
});

// POST /api/ai/explain-simple  { text, context, lang } — explain any ritual snippet simply with an example
exports.explainSimple = asyncHandler(async (req, res) => {
  const text = String(req.body.text || '').trim();
  const context = String(req.body.context || '').slice(0, 120);
  const lang = req.body.lang === 'en' ? 'en' : 'hi';
  if (!text) return res.status(400).json({ error: 'Chahiye: text' });
  res.json(await ai.generateSimpleExplain({ text, context, lang }));
});

// POST /api/ai/daily-shloka-explain  { id } — daily shlok ka complete jeevan-upyogi explanation
exports.dailyShlokaExplain = asyncHandler(async (req, res) => {
  const id = String(req.body.id || '');
  if (!id) return res.status(400).json({ error: 'Chahiye: id' });
  const s = await daily.resolveById(id);
  if (!s) return res.status(404).json({ error: 'Shloka nahi mila' });
  res.json(await ai.generateDailyShlokaExplain({
    id, book: s.book, refLabel: s.refLabel, sanskrit: s.sanskrit, english: s.english,
  }));
});
