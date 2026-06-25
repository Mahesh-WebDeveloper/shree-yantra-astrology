const asyncHandler = require('../middleware/asyncHandler');
const GitaChapter = require('../models/GitaChapter');

// GET /api/gita — chapters list (verses ke bina, lightweight)
exports.list = asyncHandler(async (req, res) => {
  const chapters = await GitaChapter.find({}, { verses: 0 }).sort({ chapter: 1 }).lean();
  res.json({ chapters });
});

// GET /api/gita/:chapter — ek chapter + uske saare verses
exports.getChapter = asyncHandler(async (req, res) => {
  const n = Number(req.params.chapter);
  const chapter = await GitaChapter.findOne({ chapter: n }).lean();
  if (!chapter) return res.status(404).json({ error: 'Adhyay nahi mila' });
  res.json({ chapter });
});
