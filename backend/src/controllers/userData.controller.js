// User app-data sync — jaap counts, bookmarks, reading progress, samagri checklists,
// prefs. Server source-of-truth hai; phone offline chalta rehta hai aur online aate hi
// merge ho jaata hai. Merge conflict-free hai (LWW + max-counter), isliye do phone se
// ek saath use karne par bhi data kharab nahi hota.
const asyncHandler = require('../middleware/asyncHandler');
const UserData = require('../models/UserData');

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

/** Newer `at` jeetega. Barabar ho to server wala rakhte hain (stable). */
const newer = (a, b) => num(b && b.at) > num(a && a.at);

/* ── per-type merge rules ─────────────────────────────────────────────── */

// jaap: count kabhi kam na ho → j = MAX(server, client). Baaki fields newer se.
function mergeJaap(server, client) {
  const out = { ...obj(server) };
  for (const [id, c] of Object.entries(obj(client))) {
    if (!c || typeof c !== 'object') continue;
    const s = obj(out[id]);
    const isNewer = newer(s, c);
    out[id] = {
      // MAX — do device par jaap kiya to dono ka zyada wala bachega, ghatega kabhi nahi
      j: Math.max(num(s.j), num(c.j)),
      m: isNewer ? num(c.m, 1) : num(s.m, num(c.m, 1)),
      at: Math.max(num(s.at), num(c.at)),
    };
  }
  return out;
}

// saved / progress / samagri: per-item Last-Write-Wins
function mergeLww(server, client, pick) {
  const out = { ...obj(server) };
  for (const [id, c] of Object.entries(obj(client))) {
    if (!c || typeof c !== 'object') continue;
    if (newer(out[id], c)) out[id] = pick(c);
  }
  return out;
}

const pickSaved = (c) => ({ on: !!c.on, at: num(c.at) });
const pickProgress = (c) => ({ chapter: num(c.chapter), percent: num(c.percent), at: num(c.at) });
const pickSamagri = (c) => ({
  items: Array.isArray(c.items) ? c.items.map((n) => num(n)).slice(0, 200) : [],
  at: num(c.at),
});

const EMPTY = { jaap: {}, saved: {}, progress: {}, samagri: {}, prefs: {} };
const shape = (d) => (d
  ? { jaap: obj(d.jaap), saved: obj(d.saved), progress: obj(d.progress), samagri: obj(d.samagri), prefs: obj(d.prefs), updatedAt: d.updatedAt }
  : { ...EMPTY });

// GET /api/me/data — poora app-data (login ke baad pull karo)
exports.getData = asyncHandler(async (req, res) => {
  const doc = await UserData.findOne({ user: req.user._id }).lean();
  res.json({ data: shape(doc) });
});

// PUT /api/me/data — partial patch bhejo; server MERGE karta hai (replace NAHI)
// aur merge ke baad ka poora data wapas deta hai, taaki phone turant sync ho jaaye.
exports.putData = asyncHandler(async (req, res) => {
  const body = obj(req.body);
  const doc = (await UserData.findOne({ user: req.user._id })) || new UserData({ user: req.user._id });

  if (body.jaap) { doc.jaap = mergeJaap(doc.jaap, body.jaap); doc.markModified('jaap'); }
  if (body.saved) { doc.saved = mergeLww(doc.saved, body.saved, pickSaved); doc.markModified('saved'); }
  if (body.progress) { doc.progress = mergeLww(doc.progress, body.progress, pickProgress); doc.markModified('progress'); }
  if (body.samagri) { doc.samagri = mergeLww(doc.samagri, body.samagri, pickSamagri); doc.markModified('samagri'); }
  if (body.prefs && newer(doc.prefs, body.prefs)) { doc.prefs = { ...obj(body.prefs), at: num(body.prefs.at) }; doc.markModified('prefs'); }

  await doc.save();
  res.json({ data: shape(doc.toObject()) });
});
