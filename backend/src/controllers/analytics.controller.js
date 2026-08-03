const geoip = require('geoip-lite');
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { reverseGeocode } = require('../services/location.service');

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // "online now" = any event in the last 2 minutes
const ERROR_EVENT_NAMES = ['ai_error', 'api_error', 'load_failed', 'app_error', 'app_crash'];

function clientIp(req) {
  const xf = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  let ip = xf || req.ip || (req.socket && req.socket.remoteAddress) || '';
  if (ip.startsWith('::ffff:')) ip = ip.slice(7); // IPv4-mapped IPv6
  return ip;
}

// POST /api/analytics/track  { deviceId, sessionId, userId?, platform, osVersion, appVersion, events:[{name, screen?, props?}] }
// Public (app se aata hai). req.user agar ho to wahi userId, warna body se.
exports.track = asyncHandler(async (req, res) => {
  const { deviceId, sessionId, platform, osVersion, appVersion, deviceBrand, deviceModel, events, gps } = req.body;
  if (!Array.isArray(events) || !events.length) return res.status(400).json({ error: 'events[] chahiye' });

  const ip = clientIp(req);
  const userId = (req.user && req.user._id) || req.body.userId || null;

  // LOCATION: prefer real device GPS (accurate). IP-geo is only a fallback — on Indian
  // mobile carriers (Jio/Airtel CGNAT) a whole IP block maps to one city, so IP city is
  // frequently wrong (e.g. a Jodhpur user showing as Hyderabad).
  let loc = { locSource: undefined, country: undefined, region: undefined, city: undefined, lat: undefined, lng: undefined, accuracy: undefined };
  const hasGps = gps && Number.isFinite(Number(gps.lat)) && Number.isFinite(Number(gps.lng));
  if (hasGps) {
    const place = await reverseGeocode(gps.lat, gps.lng).catch(() => null);
    loc = {
      locSource: 'gps',
      lat: Number(gps.lat),
      lng: Number(gps.lng),
      accuracy: Number.isFinite(Number(gps.accuracy)) ? Number(gps.accuracy) : undefined,
      city: place ? place.city : undefined,
      region: place ? place.region : undefined,
      country: place ? place.country : undefined,
    };
  } else {
    const geo = geoip.lookup(ip) || null; // private/localhost IP par null
    if (geo) {
      loc = {
        locSource: 'ip',
        country: geo.country, region: geo.region, city: geo.city,
        lat: geo.ll ? geo.ll[0] : undefined,
        lng: geo.ll ? geo.ll[1] : undefined,
        accuracy: undefined,
      };
    }
  }

  const base = {
    deviceId, sessionId, user: userId || undefined, platform, osVersion, appVersion,
    deviceBrand, deviceModel,
    ip,
    ...loc,
  };
  const docs = events.slice(0, 50).map((e) => ({
    ...base,
    name: String(e.name || 'event'),
    screen: e.screen,
    props: e.props,
  }));
  await AnalyticsEvent.insertMany(docs, { ordered: false }).catch(() => {});
  res.json({ ok: true, tracked: docs.length });
});

// GET /api/admin/analytics  (admin)
exports.stats = asyncHandler(async (req, res) => {
  const now = new Date();
  const since = (days) => new Date(now.getTime() - days * 86400000);
  const day = since(1), week = since(7), month = since(30);

  const distinct = async (field, from) => (await AnalyticsEvent.distinct(field, { createdAt: { $gte: from }, [field]: { $ne: null } })).length;

  const [
    totalEvents, eventsToday, events7d,
    devToday, dev7d, dev30d,
    usersToday, users7d,
    perDay, topScreens, platforms, countries, cities, recent,
  ] = await Promise.all([
    AnalyticsEvent.countDocuments({}),
    AnalyticsEvent.countDocuments({ createdAt: { $gte: day } }),
    AnalyticsEvent.countDocuments({ createdAt: { $gte: week } }),
    distinct('deviceId', day), distinct('deviceId', week), distinct('deviceId', month),
    distinct('user', day), distinct('user', week),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: since(13) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, devices: { $addToSet: '$deviceId' } } },
      { $project: { date: '$_id', _id: 0, count: 1, devices: { $size: '$devices' } } },
      { $sort: { date: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { name: 'screen_view', screen: { $ne: null } } },
      { $group: { _id: '$screen', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
      { $project: { screen: '$_id', _id: 0, count: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { platform: { $ne: null } } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $project: { platform: '$_id', _id: 0, count: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { country: { $ne: null } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
      { $project: { country: '$_id', _id: 0, count: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { city: { $nin: [null, ''] } } },
      { $group: { _id: { city: '$city', country: '$country' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
      { $project: { city: '$_id.city', country: '$_id.country', _id: 0, count: 1 } },
    ]),
    AnalyticsEvent.find({}).sort({ createdAt: -1 }).limit(20)
      .select('name screen platform city country createdAt deviceId').lean(),
  ]);

  res.json({
    totals: { totalEvents, eventsToday, events7d },
    activeDevices: { today: devToday, last7Days: dev7d, last30Days: dev30d },
    activeUsers: { today: usersToday, last7Days: users7d },
    perDay, topScreens, platforms, countries, cities, recent,
  });
});

/* ═══════════════ PER-USER ACTIVITY (admin User-Activity dashboard) ═══════════════ */

// GET /api/admin/activity/overview  (admin) — KPI strip for User Activity dashboard
exports.activityOverview = asyncHandler(async (req, res) => {
  const now = Date.now();
  const day = new Date(now - 86400000);
  const week = new Date(now - 7 * 86400000);
  const onlineCut = new Date(now - ONLINE_WINDOW_MS);

  const [
    onlineUserIds, onlineDevices, aiAsksToday, aiAsks7d,
    errorsToday, errors7d, chatTurnsTotal, usersWithErrors7d, usersWithAi,
  ] = await Promise.all([
    AnalyticsEvent.distinct('user', { user: { $ne: null }, createdAt: { $gte: onlineCut } }),
    AnalyticsEvent.distinct('deviceId', { createdAt: { $gte: onlineCut } }),
    AnalyticsEvent.countDocuments({ name: 'ai_ask', createdAt: { $gte: day } }),
    AnalyticsEvent.countDocuments({ name: 'ai_ask', createdAt: { $gte: week } }),
    AnalyticsEvent.countDocuments({ name: { $in: ERROR_EVENT_NAMES }, createdAt: { $gte: day } }),
    AnalyticsEvent.countDocuments({ name: { $in: ERROR_EVENT_NAMES }, createdAt: { $gte: week } }),
    ChatMessage.countDocuments({}),
    AnalyticsEvent.distinct('user', { user: { $ne: null }, name: { $in: ERROR_EVENT_NAMES }, createdAt: { $gte: week } }),
    ChatMessage.distinct('user'),
  ]);

  res.json({
    onlineUsers: onlineUserIds.length,
    onlineDevices: onlineDevices.length,
    aiAsksToday,
    aiAsks7d,
    errorsToday,
    errors7d,
    chatTurnsTotal,
    usersWithErrors7d: usersWithErrors7d.length,
    usersWithAiChat: usersWithAi.length,
  });
});

// GET /api/admin/activity/users?q=&page=&limit=&sort=&plan=&online=&hasErrors=&hasAi=  (admin)
exports.activityUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(5, Number(req.query.limit) || 20));
  const q = String(req.query.q || '').trim();
  const sortKey = String(req.query.sort || 'lastSeen');
  const planFilter = String(req.query.plan || '').trim();
  const onlineOnly = req.query.online === '1' || req.query.online === 'true';
  const hasErrors = req.query.hasErrors === '1' || req.query.hasErrors === 'true';
  const hasAi = req.query.hasAi === '1' || req.query.hasAi === 'true';

  let userFilter = null;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const ids = await User.find({ $or: [{ name: rx }, { phone: rx }, { email: rx }] }).select('_id').lean();
    userFilter = ids.map((u) => u._id);
    if (!userFilter.length) return res.json({ users: [], total: 0, page, onlineNow: 0 });
  }

  const onlineCut = Date.now() - ONLINE_WINDOW_MS;
  const match = { user: userFilter ? { $in: userFilter } : { $ne: null } };

  const sortMap = {
    lastSeen: { lastSeen: -1 },
    events: { events: -1 },
    sessions: { sessions: -1 },
    errors: { errorEvents: -1, lastSeen: -1 },
    ai: { aiTurns: -1, lastSeen: -1 },
  };
  const sortStage = sortMap[sortKey] || sortMap.lastSeen;

  const pipeline = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $group: {
      _id: '$user',
      lastSeen: { $first: '$createdAt' },
      lastScreen: { $first: '$screen' },
      lastEvent: { $first: '$name' },
      platform: { $first: '$platform' },
      osVersion: { $first: '$osVersion' },
      appVersion: { $first: '$appVersion' },
      deviceBrand: { $first: '$deviceBrand' },
      deviceModel: { $first: '$deviceModel' },
      city: { $first: '$city' },
      country: { $first: '$country' },
      locSource: { $first: '$locSource' },
      events: { $sum: 1 },
      errorEvents: { $sum: { $cond: [{ $in: ['$name', ERROR_EVENT_NAMES] }, 1, 0] } },
      aiEvents: { $sum: { $cond: [{ $eq: ['$name', 'ai_ask'] }, 1, 0] } },
      sessions: { $addToSet: '$sessionId' },
      devices: { $addToSet: '$deviceId' },
    } },
    { $lookup: {
      from: 'chatmessages',
      let: { uid: '$_id' },
      pipeline: [{ $match: { $expr: { $eq: ['$user', '$$uid'] } } }, { $count: 'n' }],
      as: 'chatMeta',
    } },
    { $addFields: {
      aiTurns: { $ifNull: [{ $arrayElemAt: ['$chatMeta.n', 0] }, 0] },
      sessions: { $size: '$sessions' },
      devices: { $size: '$devices' },
    } },
    { $project: { chatMeta: 0 } },
  ];

  if (onlineOnly) pipeline.push({ $match: { lastSeen: { $gte: new Date(onlineCut) } } });
  if (hasErrors) pipeline.push({ $match: { errorEvents: { $gt: 0 } } });
  if (hasAi) pipeline.push({ $match: { $or: [{ aiTurns: { $gt: 0 } }, { aiEvents: { $gt: 0 } }] } });

  if (planFilter === 'free' || planFilter === 'premium') {
    pipeline.push(
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDoc' } },
      { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
      { $match: { 'userDoc.plan': planFilter } },
    );
  }

  pipeline.push(
    { $sort: sortStage },
    { $facet: {
      total: [{ $count: 'n' }],
      page: [{ $skip: (page - 1) * limit }, { $limit: limit }],
    } },
  );

  const rows = await AnalyticsEvent.aggregate(pipeline);
  const total = (rows[0] && rows[0].total[0] && rows[0].total[0].n) || 0;
  const items = (rows[0] && rows[0].page) || [];

  const users = await User.find({ _id: { $in: items.map((r) => r._id) } })
    .select('name phone email plan blocked createdAt lastLoginAt profile.avatar').lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));

  const out = items.map((r) => {
    const u = byId.get(String(r._id));
    const gone = !u;
    const uu = u || {};
    return {
      id: r._id,
      name: gone ? 'Deleted user' : (uu.name || 'Unknown'),
      deleted: gone,
      phone: uu.phone || null,
      email: uu.email || null,
      plan: uu.plan || 'free',
      blocked: !!uu.blocked,
      avatar: (uu.profile && uu.profile.avatar) || null,
      joinedAt: uu.createdAt || null,
      online: new Date(r.lastSeen).getTime() > onlineCut,
      lastSeen: r.lastSeen,
      lastScreen: r.lastScreen || null,
      lastEvent: r.lastEvent || null,
      device: [r.deviceBrand, r.deviceModel].filter(Boolean).join(' ') || null,
      platform: r.platform || null,
      osVersion: r.osVersion || null,
      appVersion: r.appVersion || null,
      city: r.city || null,
      country: r.country || null,
      locSource: r.locSource || null,
      events: r.events,
      sessions: r.sessions,
      devices: r.devices,
      errorEvents: r.errorEvents || 0,
      aiEvents: r.aiEvents || 0,
      aiTurns: r.aiTurns || 0,
    };
  });

  const onlineNow = (await AnalyticsEvent.distinct('user', { user: { $ne: null }, createdAt: { $gte: new Date(onlineCut) } })).length;
  res.json({ users: out, total, page, onlineNow });
});

// GET /api/admin/activity/user/:id?before=  (admin)
// One user's complete picture: profile, usage summary, devices, locations,
// top screens, daily activity (14d) and a paginated raw event timeline.
exports.activityUser = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid user id' });
  const uid = new mongoose.Types.ObjectId(id);
  const before = req.query.before ? new Date(String(req.query.before)) : null;

  const [user, summary, devices, locations, topScreens, perDay, timeline, aiTurnCount, errorTimeline, recentAi, lastAiTurn] = await Promise.all([
    User.findById(uid).select('name phone email plan blocked createdAt lastLoginAt interests profile.avatar profile.place').lean(),
    AnalyticsEvent.aggregate([
      { $match: { user: uid } },
      { $group: { _id: null, events: { $sum: 1 }, sessions: { $addToSet: '$sessionId' }, firstSeen: { $min: '$createdAt' }, lastSeen: { $max: '$createdAt' }, errorEvents: { $sum: { $cond: [{ $in: ['$name', ERROR_EVENT_NAMES] }, 1, 0] } }, aiEvents: { $sum: { $cond: [{ $eq: ['$name', 'ai_ask'] }, 1, 0] } } } },
      { $project: { _id: 0, events: 1, sessions: { $size: '$sessions' }, firstSeen: 1, lastSeen: 1, errorEvents: 1, aiEvents: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { user: uid } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$deviceId', platform: { $first: '$platform' }, osVersion: { $first: '$osVersion' }, appVersion: { $first: '$appVersion' }, deviceBrand: { $first: '$deviceBrand' }, deviceModel: { $first: '$deviceModel' }, lastSeen: { $first: '$createdAt' }, events: { $sum: 1 } } },
      { $sort: { lastSeen: -1 } }, { $limit: 10 },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { user: uid, city: { $nin: [null, ''] } } },
      { $group: { _id: { city: '$city', region: '$region', country: '$country', locSource: '$locSource' }, count: { $sum: 1 }, lastSeen: { $max: '$createdAt' } } },
      { $sort: { lastSeen: -1 } }, { $limit: 8 },
      { $project: { _id: 0, city: '$_id.city', region: '$_id.region', country: '$_id.country', locSource: '$_id.locSource', count: 1, lastSeen: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { user: uid, name: 'screen_view', screen: { $ne: null } } },
      { $group: { _id: '$screen', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
      { $project: { screen: '$_id', _id: 0, count: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { user: uid, createdAt: { $gte: new Date(Date.now() - 13 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $project: { date: '$_id', _id: 0, count: 1 } },
      { $sort: { date: 1 } },
    ]),
    AnalyticsEvent.find({ user: uid, ...(before && !isNaN(before.getTime()) ? { createdAt: { $lt: before } } : {}) })
      .sort({ createdAt: -1 }).limit(60)
      .select('name screen props platform city country deviceBrand deviceModel sessionId createdAt').lean(),
    ChatMessage.countDocuments({ user: uid }),
    AnalyticsEvent.find({ user: uid, name: { $in: ERROR_EVENT_NAMES } })
      .sort({ createdAt: -1 }).limit(40)
      .select('name screen props platform appVersion createdAt').lean(),
    ChatMessage.find({ user: uid }).sort({ createdAt: -1 }).limit(5)
      .select('question response error lang createdAt').lean(),
    ChatMessage.findOne({ user: uid }).sort({ createdAt: -1 }).select('question createdAt').lean(),
  ]);

  const s = summary[0] || { events: 0, sessions: 0, firstSeen: null, lastSeen: null, errorEvents: 0, aiEvents: 0 };
  const ai = { turns: aiTurnCount || 0, lastAt: lastAiTurn?.createdAt || null, lastQuestion: lastAiTurn?.question || null };

  // Account delete ho chuka hai par events abhi bhi hain → 404 mat do (dashboard
  // "Could not load" dikhata tha). Activity dikhao, user ko "Deleted user" mark karo.
  // Sirf tab 404 jab na user ho aur na hi koi activity.
  if (!user && !s.events) return res.status(404).json({ error: 'User nahi mila' });

  const userOut = user
    ? { id: user._id, name: user.name, deleted: false, phone: user.phone || null, email: user.email || null, plan: user.plan, blocked: !!user.blocked, joinedAt: user.createdAt, lastLoginAt: user.lastLoginAt || null, interests: user.interests || [], avatar: (user.profile && user.profile.avatar) || null, place: (user.profile && user.profile.place) || null }
    : { id: uid, name: 'Deleted user', deleted: true, phone: null, email: null, plan: 'free', blocked: false, joinedAt: null, lastLoginAt: null, interests: [], avatar: null, place: null };

  res.json({
    user: userOut,
    summary: { ...s, online: s.lastSeen ? new Date(s.lastSeen).getTime() > Date.now() - ONLINE_WINDOW_MS : false },
    ai: { turns: ai.turns || 0, lastAt: ai.lastAt || null, lastQuestion: ai.lastQuestion || null, analyticsAsks: s.aiEvents || 0 },
    errors: errorTimeline,
    recentAi: recentAi.map((r) => ({
      id: String(r._id),
      question: r.question,
      response: r.response || null,
      error: r.error || null,
      lang: r.lang || 'en',
      createdAt: r.createdAt,
    })),
    devices: devices.map((d) => ({ deviceId: d._id, device: [d.deviceBrand, d.deviceModel].filter(Boolean).join(' ') || null, platform: d.platform, osVersion: d.osVersion, appVersion: d.appVersion, lastSeen: d.lastSeen, events: d.events })),
    locations, topScreens, perDay, timeline,
  });
});

// GET /api/admin/activity/issues?q=&page=&limit=&type=&since=  (admin) — global error/issue feed
exports.activityIssues = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(80, Math.max(10, Number(req.query.limit) || 30));
  const q = String(req.query.q || '').trim();
  const type = String(req.query.type || '').trim();
  const since = req.query.since ? new Date(String(req.query.since)) : new Date(Date.now() - 7 * 86400000);

  const filter = {
    name: type && ERROR_EVENT_NAMES.includes(type) ? type : { $in: ERROR_EVENT_NAMES },
    createdAt: { $gte: isNaN(since.getTime()) ? new Date(Date.now() - 7 * 86400000) : since },
  };

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const ids = await User.find({ $or: [{ name: rx }, { phone: rx }, { email: rx }] }).select('_id').lean();
    const userIds = ids.map((u) => u._id);
    if (!userIds.length) return res.json({ issues: [], total: 0, page });
    filter.user = { $in: userIds };
  }

  const [total, issues] = await Promise.all([
    AnalyticsEvent.countDocuments(filter),
    AnalyticsEvent.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .select('name screen props user platform appVersion city country deviceBrand deviceModel createdAt').lean(),
  ]);

  const users = await User.find({ _id: { $in: issues.map((e) => e.user).filter(Boolean) } }).select('name plan phone email').lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));

  res.json({
    issues: issues.map((e) => {
      const u = e.user ? byId.get(String(e.user)) : null;
      return {
        _id: e._id,
        name: e.name,
        screen: e.screen || null,
        props: e.props || null,
        platform: e.platform || null,
        appVersion: e.appVersion || null,
        city: e.city || null,
        country: e.country || null,
        device: [e.deviceBrand, e.deviceModel].filter(Boolean).join(' ') || null,
        createdAt: e.createdAt,
        userId: e.user ? String(e.user) : null,
        userName: u ? u.name : null,
        userPlan: u ? u.plan : null,
        userPhone: u ? u.phone : null,
      };
    }),
    total,
    page,
  });
});

// GET /api/admin/activity/user/:id/ai-chat?before=&limit=&q=  (admin) — full AI Q&A history
exports.activityUserAiChat = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid user id' });
  const uid = new mongoose.Types.ObjectId(id);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
  const before = req.query.before ? new Date(String(req.query.before)) : null;
  const match = { user: uid };
  if (before && !isNaN(before.getTime())) match.createdAt = { $lt: before };
  const text = String(req.query.q || '').trim();
  if (text) {
    const rx = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    match.$or = [{ question: rx }, { 'response.answer': rx }, { error: rx }];
  }

  const rows = await ChatMessage.find(match).sort({ createdAt: -1 }).limit(limit + 1).lean();
  const hasMore = rows.length > limit;
  const turns = (hasMore ? rows.slice(0, limit) : rows).map((r) => ({
    id: String(r._id),
    question: r.question,
    response: r.response || null,
    error: r.error || null,
    lang: r.lang || 'en',
    createdAt: r.createdAt,
  }));
  res.json({ turns, hasMore });
});

// GET /api/admin/activity/live?since=  (admin) — real-time feed for the dashboard.
// Poll this every few seconds with the newest timestamp you have; returns only newer events.
exports.activityLive = asyncHandler(async (req, res) => {
  const since = req.query.since ? new Date(String(req.query.since)) : new Date(Date.now() - 5 * 60 * 1000);
  const cut = new Date(Date.now() - ONLINE_WINDOW_MS);
  const [events, onlineUserIds, onlineDevices] = await Promise.all([
    AnalyticsEvent.find({ createdAt: { $gt: isNaN(since.getTime()) ? new Date(Date.now() - 5 * 60 * 1000) : since } })
      .sort({ createdAt: -1 }).limit(60)
      .select('name screen props user deviceId platform city country deviceBrand deviceModel createdAt').lean(),
    AnalyticsEvent.distinct('user', { user: { $ne: null }, createdAt: { $gte: cut } }),
    AnalyticsEvent.distinct('deviceId', { createdAt: { $gte: cut } }),
  ]);
  const users = await User.find({ _id: { $in: events.map((e) => e.user).filter(Boolean) } }).select('name plan').lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  res.json({
    now: new Date(),
    onlineUsers: onlineUserIds.length,
    onlineDevices: onlineDevices.length,
    events: events.map((e) => {
      const u = e.user ? byId.get(String(e.user)) : null;
      return { ...e, userName: u ? u.name : null, userPlan: u ? u.plan : null };
    }),
  });
});
