const mongoose = require('mongoose');

const asyncHandler = require('../middleware/asyncHandler');
const Notification = require('../models/Notification');
const { i18nValue, langFromReq, normalizeTranslations } = require('../utils/localize');

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message) {
  return Object.assign(new Error(message), { status: 404 });
}

function ensureObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest('Invalid id');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePage(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function applyPayload(notification, body, user) {
  if (body.title !== undefined) {
    const title = String(body.title || '').trim();
    if (!title) throw badRequest('Title zaroori hai');
    notification.title = title;
  }
  if (body.body !== undefined) {
    const text = String(body.body || '').trim();
    if (!text) throw badRequest('Body zaroori hai');
    notification.body = text;
  }
  if (body.translations !== undefined) {
    notification.translations = normalizeTranslations(body.translations, {
      en: { title: notification.title || '', body: notification.body || '' },
      hi: {},
    });
    notification.markModified('translations');
  }
  if (!notification.title && notification.translations && notification.translations.en && notification.translations.en.title) {
    notification.title = String(notification.translations.en.title).trim();
  }
  if (!notification.body && notification.translations && notification.translations.en && notification.translations.en.body) {
    notification.body = String(notification.translations.en.body).trim();
  }
  if (body.type !== undefined) {
    if (!['promo', 'account', 'prediction'].includes(body.type)) throw badRequest('Invalid notification type');
    notification.type = body.type;
  }
  if (body.audience !== undefined) {
    if (!['all', 'premium', 'free', 'user'].includes(body.audience)) throw badRequest('Invalid audience');
    notification.audience = body.audience;
  }
  if (body.targetUserId !== undefined && body.targetUserId !== '') {
    ensureObjectId(body.targetUserId);
    notification.targetUserId = body.targetUserId;
  }
  if (body.targetUserId === '') notification.targetUserId = undefined;
  if (notification.audience === 'user' && !notification.targetUserId) throw badRequest('targetUserId zaroori hai');
  if (notification.audience !== 'user') notification.targetUserId = undefined;
  if (body.scheduledAt !== undefined) {
    notification.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : undefined;
    if (notification.scheduledAt && Number.isNaN(notification.scheduledAt.getTime())) throw badRequest('Invalid scheduledAt');
  }
  if (!notification.createdBy && user) notification.createdBy = user._id;
}

function recipientFilter(user) {
  return {
    sentAt: { $ne: null, $lte: new Date() },
    $or: [
      { audience: 'all' },
      { audience: user.plan === 'premium' ? 'premium' : 'free' },
      { audience: 'user', targetUserId: user._id },
    ],
  };
}

function withReadState(notification, userId) {
  const read = (notification.readBy || []).find((r) => String(r.user) === String(userId));
  return {
    ...notification,
    read: !!read,
    readAt: read ? read.readAt : null,
  };
}

function localizeNotification(notification, lang) {
  return {
    ...notification,
    title: i18nValue(notification, 'title', lang),
    body: i18nValue(notification, 'body', lang),
  };
}

exports.publicList = asyncHandler(async (req, res) => {
  const lang = langFromReq(req);
  const notifications = await Notification.find(recipientFilter(req.user))
    .sort({ sentAt: -1, createdAt: -1 })
    .limit(100)
    .lean();
  res.json({ notifications: notifications.map((n) => withReadState(localizeNotification(n, lang), req.user._id)) });
});

exports.markRead = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const notification = await Notification.findOne({ _id: req.params.id, ...recipientFilter(req.user) });
  if (!notification) throw notFound('Notification not found');
  const already = notification.readBy.some((r) => String(r.user) === String(req.user._id));
  if (!already) {
    notification.readBy.push({ user: req.user._id, readAt: new Date() });
    await notification.save();
  }
  res.json({ notification: withReadState(localizeNotification(notification.toObject(), langFromReq(req)), req.user._id) });
});

exports.adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.audience) filter.audience = req.query.audience;
  if (req.query.sent === 'true') filter.sentAt = { $ne: null };
  if (req.query.sent === 'false') filter.sentAt = null;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ title: rx }, { body: rx }];
  }
  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);
  res.json({ notifications: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

exports.create = asyncHandler(async (req, res) => {
  const notification = new Notification();
  applyPayload(notification, req.body, req.user);
  if (!notification.title) throw badRequest('Title zaroori hai');
  if (!notification.body) throw badRequest('Body zaroori hai');
  if (req.body.sendNow === true || req.body.sendNow === 'true') notification.sentAt = new Date();
  await notification.save();
  res.status(201).json({ notification });
});

exports.update = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw notFound('Notification not found');
  applyPayload(notification, req.body, req.user);
  await notification.save();
  res.json({ notification });
});

exports.send = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw notFound('Notification not found');
  notification.sentAt = new Date();
  await notification.save();
  res.json({ notification });
});

exports.remove = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const notification = await Notification.findByIdAndDelete(req.params.id);
  if (!notification) throw notFound('Notification not found');
  res.json({ deleted: true, id: String(notification._id) });
});
