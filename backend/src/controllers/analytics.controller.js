const geoip = require('geoip-lite');
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const User = require('../models/User');
const { reverseGeocode } = require('../services/location.service');

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // "online now" = any event in the last 2 minutes

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

// GET /api/admin/activity/users?q=&page=&limit=  (admin)
// Every signed-in user with live rollup: online-now, last seen, last device/location,
// event + session counts. Sorted by most-recently-active.
exports.activityUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(5, Number(req.query.limit) || 20));
  const q = String(req.query.q || '').trim();

  // optional search → resolve matching user ids first
  let userFilter = null;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const ids = await User.find({ $or: [{ name: rx }, { phone: rx }, { email: rx }] }).select('_id').lean();
    userFilter = ids.map((u) => u._id);
    if (!userFilter.length) return res.json({ users: [], total: 0, page, onlineNow: 0 });
  }

  const match = { user: userFilter ? { $in: userFilter } : { $ne: null } };
  const rows = await AnalyticsEvent.aggregate([
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
      sessions: { $addToSet: '$sessionId' },
      devices: { $addToSet: '$deviceId' },
    } },
    { $project: { lastSeen: 1, lastScreen: 1, lastEvent: 1, platform: 1, osVersion: 1, appVersion: 1, deviceBrand: 1, deviceModel: 1, city: 1, country: 1, locSource: 1, events: 1, sessions: { $size: '$sessions' }, devices: { $size: '$devices' } } },
    { $sort: { lastSeen: -1 } },
    { $facet: {
      total: [{ $count: 'n' }],
      page: [{ $skip: (page - 1) * limit }, { $limit: limit }],
    } },
  ]);
  const total = (rows[0] && rows[0].total[0] && rows[0].total[0].n) || 0;
  const items = (rows[0] && rows[0].page) || [];

  // hydrate user identity + plan
  const users = await User.find({ _id: { $in: items.map((r) => r._id) } })
    .select('name phone email plan blocked createdAt lastLoginAt profile.avatar').lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  const onlineCut = Date.now() - ONLINE_WINDOW_MS;

  const out = items.map((r) => {
    const u = byId.get(String(r._id)) || {};
    return {
      id: r._id,
      name: u.name || 'Unknown',
      phone: u.phone || null,
      email: u.email || null,
      plan: u.plan || 'free',
      blocked: !!u.blocked,
      avatar: (u.profile && u.profile.avatar) || null,
      joinedAt: u.createdAt || null,
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

  const [user, summary, devices, locations, topScreens, perDay, timeline] = await Promise.all([
    User.findById(uid).select('name phone email plan blocked createdAt lastLoginAt interests profile.avatar profile.place').lean(),
    AnalyticsEvent.aggregate([
      { $match: { user: uid } },
      { $group: { _id: null, events: { $sum: 1 }, sessions: { $addToSet: '$sessionId' }, firstSeen: { $min: '$createdAt' }, lastSeen: { $max: '$createdAt' } } },
      { $project: { _id: 0, events: 1, sessions: { $size: '$sessions' }, firstSeen: 1, lastSeen: 1 } },
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
  ]);

  if (!user) return res.status(404).json({ error: 'User nahi mila' });
  const s = summary[0] || { events: 0, sessions: 0, firstSeen: null, lastSeen: null };
  res.json({
    user: { id: user._id, name: user.name, phone: user.phone || null, email: user.email || null, plan: user.plan, blocked: !!user.blocked, joinedAt: user.createdAt, lastLoginAt: user.lastLoginAt || null, interests: user.interests || [], avatar: (user.profile && user.profile.avatar) || null, place: (user.profile && user.profile.place) || null },
    summary: { ...s, online: s.lastSeen ? new Date(s.lastSeen).getTime() > Date.now() - ONLINE_WINDOW_MS : false },
    devices: devices.map((d) => ({ deviceId: d._id, device: [d.deviceBrand, d.deviceModel].filter(Boolean).join(' ') || null, platform: d.platform, osVersion: d.osVersion, appVersion: d.appVersion, lastSeen: d.lastSeen, events: d.events })),
    locations, topScreens, perDay, timeline,
  });
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
