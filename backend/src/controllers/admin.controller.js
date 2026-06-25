const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../services/auth.service');
const AiCache = require('../models/AiCache');
const Kundli = require('../models/Kundli');
const User = require('../models/User');

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message) {
  return Object.assign(new Error(message), { status: 404 });
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePage(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function parseSort(sort, allowed, fallback = { createdAt: -1 }) {
  if (!sort) return fallback;
  const [field, dir = 'desc'] = String(sort).split(':');
  if (!allowed.includes(field)) return fallback;
  return { [field]: dir === 'asc' ? 1 : -1 };
}

function ensureObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest('Invalid id');
}

function publicUser(user) {
  const data = user.toPublic ? user.toPublic() : user;
  return {
    ...data,
    id: String(data.id || user._id),
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

exports.login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw badRequest('Valid email zaroori hai');
  if (!password) throw badRequest('Password zaroori hai');

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.passwordHash || user.role !== 'admin') {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  if (user.blocked) return res.status(401).json({ error: 'Admin account blocked hai' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid admin credentials' });

  user.lastLoginAt = new Date();
  await user.save();

  res.json({ token: auth.signToken(user), admin: publicUser(user) });
});

exports.stats = asyncHandler(async (req, res) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const chartStart = new Date(now);
  chartStart.setDate(now.getDate() - 13);
  chartStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    newUsersLast7Days,
    planRows,
    signupRows,
    providerRows,
    cachedKundliCount,
    aiCacheCount,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { createdAt: { $gte: chartStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $project: { providers: { $ifNull: ['$providers', []] } } },
      { $unwind: { path: '$providers', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$providers', 'none'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Kundli.countDocuments(),
    AiCache.countDocuments(),
  ]);

  const planCounts = planRows.reduce((acc, row) => {
    acc[row._id || 'free'] = row.count;
    return acc;
  }, {});

  const signupMap = signupRows.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});
  const signups = [];
  for (let i = 0; i < 14; i += 1) {
    const d = new Date(chartStart);
    d.setDate(chartStart.getDate() + i);
    const day = d.toISOString().slice(0, 10);
    signups.push({ date: day, count: signupMap[day] || 0 });
  }

  res.json({
    totalUsers,
    newUsersLast7Days,
    premiumUsers: planCounts.premium || 0,
    freeUsers: planCounts.free || 0,
    signups,
    providers: providerRows.map((row) => ({ provider: row._id || 'none', count: row.count })),
    cachedKundliCount,
    aiCacheCount,
  });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  if (['free', 'premium'].includes(req.query.plan)) filter.plan = req.query.plan;
  if (['user', 'admin'].includes(req.query.role)) filter.role = req.query.role;

  const sort = parseSort(req.query.sort, ['createdAt', 'updatedAt', 'name', 'email', 'plan', 'role', 'lastLoginAt']);
  const [items, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    users: items.map(publicUser),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

exports.getUser = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');
  res.json({ user: publicUser(user) });
});

exports.updateUser = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');

  const isSelf = String(user._id) === String(req.user._id);
  const { name, plan, role, blocked } = req.body;

  if (typeof name === 'string' && name.trim()) user.name = name.trim();
  if (plan !== undefined) {
    if (!['free', 'premium'].includes(plan)) throw badRequest('plan free ya premium hona chahiye');
    user.plan = plan;
  }
  if (role !== undefined) {
    if (!['user', 'admin'].includes(role)) throw badRequest('role user ya admin hona chahiye');
    if (isSelf && role !== 'admin') throw badRequest('Apna admin role remove nahi kar sakte');
    user.role = role;
  }
  if (blocked !== undefined) {
    if (typeof blocked !== 'boolean') throw badRequest('blocked boolean hona chahiye');
    if (isSelf && blocked) throw badRequest('Apne account ko block nahi kar sakte');
    user.blocked = blocked;
  }

  await user.save();
  res.json({ user: publicUser(user) });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  if (String(req.params.id) === String(req.user._id)) throw badRequest('Apna account delete nahi kar sakte');
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw notFound('User not found');
  res.json({ deleted: true, id: String(user._id) });
});

exports.uploadImage = asyncHandler(async (req, res) => {
  const file = req.files && ((req.files.image && req.files.image[0]) || (req.files.coverImage && req.files.coverImage[0]));
  if (!file) return res.status(400).json({ error: 'Koi image nahi mili (field name: image)' });
  res.status(201).json({ url: `/uploads/content/${file.filename}` });
});

exports.listAiCache = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter = {};
  if (req.query.type) filter.type = String(req.query.type);
  if (req.query.search) filter.cacheKey = new RegExp(escapeRegex(req.query.search), 'i');
  const [items, total] = await Promise.all([
    AiCache.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    AiCache.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

exports.deleteAiCache = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const deleted = await AiCache.findByIdAndDelete(req.params.id);
  if (!deleted) throw notFound('AI cache item not found');
  res.json({ deleted: true, id: String(deleted._id) });
});
