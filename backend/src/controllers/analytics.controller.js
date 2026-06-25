const geoip = require('geoip-lite');
const asyncHandler = require('../middleware/asyncHandler');
const AnalyticsEvent = require('../models/AnalyticsEvent');

function clientIp(req) {
  const xf = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  let ip = xf || req.ip || (req.socket && req.socket.remoteAddress) || '';
  if (ip.startsWith('::ffff:')) ip = ip.slice(7); // IPv4-mapped IPv6
  return ip;
}

// POST /api/analytics/track  { deviceId, sessionId, userId?, platform, osVersion, appVersion, events:[{name, screen?, props?}] }
// Public (app se aata hai). req.user agar ho to wahi userId, warna body se.
exports.track = asyncHandler(async (req, res) => {
  const { deviceId, sessionId, platform, osVersion, appVersion, events } = req.body;
  if (!Array.isArray(events) || !events.length) return res.status(400).json({ error: 'events[] chahiye' });

  const ip = clientIp(req);
  const geo = geoip.lookup(ip) || null; // private/localhost IP par null
  const userId = (req.user && req.user._id) || req.body.userId || null;

  const base = {
    deviceId, sessionId, user: userId || undefined, platform, osVersion, appVersion,
    ip,
    country: geo ? geo.country : undefined,
    region: geo ? geo.region : undefined,
    city: geo ? geo.city : undefined,
    lat: geo && geo.ll ? geo.ll[0] : undefined,
    lng: geo && geo.ll ? geo.ll[1] : undefined,
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
