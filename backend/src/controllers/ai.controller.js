const asyncHandler = require('../middleware/asyncHandler');
const ai = require('../services/ai.service');
const Ramcharitmanas = require('../models/Ramcharitmanas');
const GitaChapter = require('../models/GitaChapter');
const RamayanSarga = require('../models/RamayanSarga');
const RigVeda = require('../models/RigVeda');
const VedaText = require('../models/VedaText');
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
exports.askAstrologer = asyncHandler(async (req, res) => {
  if (!needBirth(req.body)) return res.status(400).json({ error: 'Chahiye: dob, tob, tz, aur (place YA lat+lng)' });
  if (!String(req.body.question || '').trim()) return res.status(400).json({ error: 'Question chahiye' });
  res.json(await ai.askAstrologer(req.body));
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
  res.json(await ai.generateVedaExplanation({
    veda, book, section, verse, sanskrit: m.sanskrit, english: m.english,
  }));
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
