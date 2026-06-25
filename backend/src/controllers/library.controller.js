const mongoose = require('mongoose');

const asyncHandler = require('../middleware/asyncHandler');
const Book = require('../models/Book');
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

function getUploadedCover(req) {
  return req.files && ((req.files.coverImage && req.files.coverImage[0]) || (req.files.image && req.files.image[0]));
}

function normalizeChapters(value) {
  const chapters = parseJsonMaybe(value, []);
  if (!Array.isArray(chapters)) return [];
  return chapters
    .map((chapter, index) => ({
      title: String(chapter.title || '').trim(),
      translations: normalizeTranslations(chapter.translations, {
        en: { title: chapter.title || '', content: chapter.content || '' },
        hi: { title: '', content: '' },
      }),
      order: toNumber(chapter.order, index),
      content: String(chapter.content || ''),
      audioUrl: String(chapter.audioUrl || '').trim(),
    }))
    .filter((chapter) => chapter.title || chapter.translations.en.title || chapter.translations.hi.title);
}

function applyBookPayload(book, body, req) {
  if (body.title !== undefined) {
    const title = String(body.title || '').trim();
    if (!title) throw badRequest('Title zaroori hai');
    book.title = title;
  }
  if (body.author !== undefined) book.author = String(body.author || '').trim();
  if (body.translations !== undefined) {
    book.translations = normalizeTranslations(body.translations, {
      en: {
        title: book.title || '',
        author: book.author || '',
        category: book.category || '',
        description: book.description || '',
      },
      hi: {},
    });
    book.markModified('translations');
  }
  if (!book.title && book.translations && book.translations.en && book.translations.en.title) {
    book.title = String(book.translations.en.title).trim();
  }
  if (body.coverImage !== undefined) book.coverImage = String(body.coverImage || '').trim();
  const uploaded = getUploadedCover(req);
  if (uploaded) book.coverImage = `/uploads/content/${uploaded.filename}`;
  if (body.category !== undefined) book.category = String(body.category || '').trim() || 'General';
  if (body.description !== undefined) book.description = String(body.description || '').trim();
  if (body.language !== undefined) book.language = String(body.language || '').trim() || 'en';
  if (body.chapters !== undefined) book.chapters = normalizeChapters(body.chapters);
  if (body.isPremium !== undefined) book.isPremium = toBool(body.isPremium, book.isPremium);
  if (body.published !== undefined) book.published = toBool(body.published, book.published);
  if (body.order !== undefined) book.order = toNumber(body.order, book.order);
}

function localizeChapter(chapter, lang) {
  return {
    ...chapter,
    title: i18nValue(chapter, 'title', lang),
    content: i18nValue(chapter, 'content', lang),
  };
}

function localizeBook(book, lang) {
  return {
    ...book,
    title: i18nValue(book, 'title', lang),
    author: i18nValue(book, 'author', lang),
    category: i18nValue(book, 'category', lang),
    description: i18nValue(book, 'description', lang),
    chapters: (book.chapters || []).map((chapter) => localizeChapter(chapter, lang)),
  };
}

exports.publicList = asyncHandler(async (req, res) => {
  const filter = { published: true };
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.language) filter.language = String(req.query.language);
  const lang = langFromReq(req);
  const books = await Book.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  res.json({ books: books.map((book) => localizeBook(book, lang)) });
});

exports.publicGet = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const lang = langFromReq(req);
  const book = await Book.findOne({ _id: req.params.id, published: true }).lean();
  if (!book) throw notFound('Book not found');
  res.json({ book: localizeBook(book, lang) });
});

exports.adminList = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.published === 'true') filter.published = true;
  if (req.query.published === 'false') filter.published = false;
  if (req.query.search) filter.title = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const books = await Book.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  res.json({ books });
});

exports.adminGet = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const book = await Book.findById(req.params.id);
  if (!book) throw notFound('Book not found');
  res.json({ book });
});

exports.create = asyncHandler(async (req, res) => {
  const book = new Book();
  applyBookPayload(book, req.body, req);
  if (!book.title) throw badRequest('Title zaroori hai');
  await book.save();
  res.status(201).json({ book });
});

exports.update = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const book = await Book.findById(req.params.id);
  if (!book) throw notFound('Book not found');
  applyBookPayload(book, req.body, req);
  await book.save();
  res.json({ book });
});

exports.remove = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) throw notFound('Book not found');
  res.json({ deleted: true, id: String(book._id) });
});

exports.reorder = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) throw badRequest('items array zaroori hai');
  const ops = items.map((item, index) => {
    const id = item.id || item._id;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest('Invalid book id in reorder');
    return {
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: toNumber(item.order, index) } },
      },
    };
  });
  await Book.bulkWrite(ops);
  const books = await Book.find().sort({ order: 1, createdAt: -1 }).lean();
  res.json({ books });
});
