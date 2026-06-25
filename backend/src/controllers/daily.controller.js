const asyncHandler = require('../middleware/asyncHandler');
const POOL = require('../data/dailyShlokas');
const GitaChapter = require('../models/GitaChapter');
const RigVeda = require('../models/RigVeda');
const VedaText = require('../models/VedaText');

const BOOK_META = {
  gita: { book: 'Bhagavad Gita', hindi: 'श्रीमद्\nभगवद्गीता', cover: 'purple' },
  rigveda: { book: 'Rigveda', hindi: 'ऋग्वेद', cover: 'gold' },
  yajurveda: { book: 'Yajurveda', hindi: 'यजुर्वेद', cover: 'rose' },
  samaveda: { book: 'Samaveda', hindi: 'सामवेद', cover: 'green' },
  atharvaveda: { book: 'Atharvaveda', hindi: 'अथर्ववेद', cover: 'purple' },
  mahabharata: { book: 'Mahabharata', hindi: 'महाभारत', cover: 'blue' },
};

// Resolve a pool entry -> full shloka (Sanskrit + English) from the DB + nav target.
async function resolve(entry) {
  if (!entry) return null;
  if (entry.source === 'gita') {
    const ch = await GitaChapter.findOne({ chapter: entry.chapter }, { verses: 1, name: 1, transliterated: 1 }).lean();
    const v = ch && (ch.verses || []).find((x) => Number(x.verse) === entry.verse);
    if (!v) return null;
    return {
      ...BOOK_META.gita, id: entry.id, refLabel: `Bhagavad Gita ${entry.chapter}.${entry.verse}`,
      sanskrit: v.sanskrit, transliteration: v.transliteration, english: v.english,
      nav: { screen: 'GitaChapter', params: { chapter: entry.chapter } },
    };
  }
  if (entry.source === 'rigveda') {
    const doc = await RigVeda.findOne({ mandala: entry.mandala, sukta: entry.sukta }, { mantras: 1 }).lean();
    const v = doc && (doc.mantras || []).find((x) => Number(x.verse) === entry.verse);
    if (!v) return null;
    return {
      ...BOOK_META.rigveda, id: entry.id, refLabel: `Rigveda ${entry.mandala}.${entry.sukta}.${entry.verse}`,
      sanskrit: v.sanskrit, transliteration: v.transliteration, english: v.english,
      nav: { screen: 'RigvedaSukta', params: { mandala: entry.mandala, sukta: entry.sukta } },
    };
  }
  if (entry.source === 'veda') {
    const doc = await VedaText.findOne({ veda: entry.veda, book: entry.book, section: entry.section }, { verses: 1 }).lean();
    const v = doc && (doc.verses || []).find((x) => Number(x.verse) === entry.verse);
    if (!v) return null;
    const meta = BOOK_META[entry.veda] || { book: entry.veda, hindi: entry.veda, cover: 'gold' };
    return {
      ...meta, id: entry.id, refLabel: `${meta.book} ${entry.book}.${entry.section}.${entry.verse}`,
      sanskrit: v.sanskrit, transliteration: v.transliteration, english: v.english,
      nav: { screen: 'VedaVerse', params: { veda: entry.veda, book: entry.book, section: entry.section } },
    };
  }
  return null;
}

// day-of-year index (deterministic daily rotation)
function dayIndex(d = new Date()) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start;
  return Math.floor(diff / 86400000);
}

// GET /api/daily-shloka  (?date=YYYY-MM-DD optional, ?offset=N to peek ahead)
exports.today = asyncHandler(async (req, res) => {
  const offset = Number(req.query.offset) || 0;
  let di = dayIndex(req.query.date ? new Date(req.query.date) : new Date()) + offset;
  // try the day's entry; if it doesn't resolve, walk forward until one does
  for (let i = 0; i < POOL.length; i++) {
    const entry = POOL[((di + i) % POOL.length + POOL.length) % POOL.length];
    const out = await resolve(entry);
    if (out) return res.json({ shloka: out });
  }
  res.status(404).json({ error: 'Koi shloka resolve nahi hua' });
});

exports.resolveById = async (id) => resolve(POOL.find((e) => e.id === id));
