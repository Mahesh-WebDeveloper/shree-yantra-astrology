const asyncHandler = require('../middleware/asyncHandler');
const VedaText = require('../models/VedaText');

// GET /api/veda/:veda — books summary (section + verse counts)
exports.books = asyncHandler(async (req, res) => {
  const veda = String(req.params.veda);
  const rows = await VedaText.aggregate([
    { $match: { veda } },
    { $group: { _id: '$book', sections: { $sum: 1 }, verses: { $sum: '$verseCount' }, bookName: { $first: '$bookName' } } },
    { $sort: { _id: 1 } },
  ]);
  const books = rows.map((r) => ({ book: r._id, bookName: r.bookName, sections: r.sections, verses: r.verses }));
  res.json({ veda, books });
});

// GET /api/veda/:veda/:book — us book ke saare sections (verses ke bina)
exports.sections = asyncHandler(async (req, res) => {
  const veda = String(req.params.veda);
  const book = Number(req.params.book);
  const sections = await VedaText.find({ veda, book }, { verses: 0 }).sort({ section: 1 }).lean();
  res.json({ veda, book, sections });
});

// GET /api/veda/:veda/:book/:section — ek section + uske verses
exports.getSection = asyncHandler(async (req, res) => {
  const veda = String(req.params.veda);
  const book = Number(req.params.book);
  const section = Number(req.params.section);
  const doc = await VedaText.findOne({ veda, book, section }).lean();
  if (!doc) return res.status(404).json({ error: 'Section nahi mila' });
  res.json({ section: doc });
});
