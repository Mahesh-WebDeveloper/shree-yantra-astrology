const mongoose = require('mongoose');

const asyncHandler = require('../middleware/asyncHandler');
const FaqItem = require('../models/FaqItem');
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

function applyPayload(item, body) {
  if (body.question !== undefined) {
    const question = String(body.question || '').trim();
    if (!question) throw badRequest('Question zaroori hai');
    item.question = question;
  }
  if (body.answer !== undefined) {
    const answer = String(body.answer || '').trim();
    if (!answer) throw badRequest('Answer zaroori hai');
    item.answer = answer;
  }
  if (body.translations !== undefined) {
    item.translations = normalizeTranslations(body.translations, {
      en: { question: item.question || '', answer: item.answer || '', category: item.category || '' },
      hi: {},
    });
    item.markModified('translations');
  }
  if (!item.question && item.translations && item.translations.en && item.translations.en.question) {
    item.question = String(item.translations.en.question).trim();
  }
  if (!item.answer && item.translations && item.translations.en && item.translations.en.answer) {
    item.answer = String(item.translations.en.answer).trim();
  }
  if (body.category !== undefined) item.category = String(body.category || '').trim() || 'General';
  if (body.order !== undefined) item.order = toNumber(body.order, item.order);
  if (body.published !== undefined) item.published = toBool(body.published, item.published);
}

function localizeFaq(item, lang) {
  return {
    ...item,
    question: i18nValue(item, 'question', lang),
    answer: i18nValue(item, 'answer', lang),
    category: i18nValue(item, 'category', lang),
  };
}

exports.publicList = asyncHandler(async (req, res) => {
  const filter = { published: true };
  if (req.query.category) filter.category = String(req.query.category);
  const lang = langFromReq(req);
  const faq = await FaqItem.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  res.json({ faq: faq.map((item) => localizeFaq(item, lang)) });
});

exports.adminList = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.published === 'true') filter.published = true;
  if (req.query.published === 'false') filter.published = false;
  const faq = await FaqItem.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  res.json({ faq });
});

exports.adminGet = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const item = await FaqItem.findById(req.params.id);
  if (!item) throw notFound('FAQ item not found');
  res.json({ faqItem: item });
});

exports.create = asyncHandler(async (req, res) => {
  const item = new FaqItem();
  applyPayload(item, req.body);
  if (!item.question) throw badRequest('Question zaroori hai');
  if (!item.answer) throw badRequest('Answer zaroori hai');
  await item.save();
  res.status(201).json({ faqItem: item });
});

exports.update = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const item = await FaqItem.findById(req.params.id);
  if (!item) throw notFound('FAQ item not found');
  applyPayload(item, req.body);
  await item.save();
  res.json({ faqItem: item });
});

exports.remove = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const item = await FaqItem.findByIdAndDelete(req.params.id);
  if (!item) throw notFound('FAQ item not found');
  res.json({ deleted: true, id: String(item._id) });
});
