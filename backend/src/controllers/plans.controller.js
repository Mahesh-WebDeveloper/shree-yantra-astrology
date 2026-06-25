const mongoose = require('mongoose');

const asyncHandler = require('../middleware/asyncHandler');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { i18nArray, i18nValue, langFromReq, normalizeTranslations } = require('../utils/localize');

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message) {
  return Object.assign(new Error(message), { status: 404 });
}

function ensureObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest('Invalid id');
}

function parseJsonMaybe(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function toBool(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

function toNumber(value, fallback) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function applyPlanPayload(plan, body) {
  if (body.name !== undefined) {
    const name = String(body.name || '').trim();
    if (!name) throw badRequest('Name zaroori hai');
    plan.name = name;
  }
  if (body.priceINR !== undefined) plan.priceINR = Math.max(toNumber(body.priceINR, plan.priceINR), 0);
  if (body.durationDays !== undefined) {
    const days = Math.max(toNumber(body.durationDays, plan.durationDays), 1);
    plan.durationDays = days;
  }
  if (body.features !== undefined) {
    const features = parseJsonMaybe(body.features, []);
    plan.features = Array.isArray(features) ? features.map((f) => String(f).trim()).filter(Boolean) : [];
  }
  if (body.translations !== undefined) {
    plan.translations = normalizeTranslations(body.translations, {
      en: { name: plan.name || '', badge: plan.badge || '', features: plan.features || [] },
      hi: { features: [] },
    });
    plan.markModified('translations');
  }
  if (!plan.name && plan.translations && plan.translations.en && plan.translations.en.name) {
    plan.name = String(plan.translations.en.name).trim();
  }
  if (body.badge !== undefined) plan.badge = String(body.badge || '').trim();
  if (body.isActive !== undefined) plan.isActive = toBool(body.isActive, plan.isActive);
  if (body.order !== undefined) plan.order = toNumber(body.order, plan.order);
}

function localizePlan(plan, lang) {
  return {
    ...plan,
    name: i18nValue(plan, 'name', lang),
    badge: i18nValue(plan, 'badge', lang),
    features: i18nArray(plan, 'features', lang, []),
  };
}

exports.publicList = asyncHandler(async (req, res) => {
  const lang = langFromReq(req);
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ order: 1, priceINR: 1 }).lean();
  res.json({ plans: plans.map((plan) => localizePlan(plan, lang)) });
});

exports.adminList = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find().sort({ order: 1, priceINR: 1 }).lean();
  res.json({ plans });
});

exports.adminGet = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const plan = await SubscriptionPlan.findById(req.params.id);
  if (!plan) throw notFound('Plan not found');
  res.json({ plan });
});

exports.create = asyncHandler(async (req, res) => {
  const plan = new SubscriptionPlan();
  applyPlanPayload(plan, req.body);
  if (!plan.name) throw badRequest('Name zaroori hai');
  if (!plan.durationDays) throw badRequest('durationDays zaroori hai');
  await plan.save();
  res.status(201).json({ plan });
});

exports.update = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const plan = await SubscriptionPlan.findById(req.params.id);
  if (!plan) throw notFound('Plan not found');
  applyPlanPayload(plan, req.body);
  await plan.save();
  res.json({ plan });
});

exports.remove = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
  if (!plan) throw notFound('Plan not found');
  res.json({ deleted: true, id: String(plan._id) });
});
