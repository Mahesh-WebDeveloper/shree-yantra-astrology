const mongoose = require('mongoose');

const asyncHandler = require('../middleware/asyncHandler');
const env = require('../config/env');
const MediaItem = require('../models/MediaItem');
const { i18nArray, i18nValue, langFromReq, normalizeTranslations } = require('../utils/localize');

const CATEGORIES = ['mantra', 'spiritual_music', 'bhajan'];
const SOURCE_TYPES = ['audio', 'youtube', 'external'];

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

function cleanTags(value) {
  const raw = parseJsonMaybe(value, value);
  const arr = Array.isArray(raw) ? raw : String(raw || '').split(',');
  return [...new Set(arr.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))];
}

function youtubeIdFromUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^[a-zA-Z0-9_-]{8,}$/.test(text) && !text.includes('/')) return text;
  const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}

function youtubeUrlFromId(id) {
  return id ? `https://www.youtube.com/watch?v=${id}` : '';
}

function applyPayload(item, body, file) {
  if (body.title !== undefined) {
    const title = String(body.title || '').trim();
    if (!title) throw badRequest('Title zaroori hai');
    item.title = title;
  }
  if (body.subtitle !== undefined) item.subtitle = String(body.subtitle || '').trim();
  if (body.artist !== undefined) item.artist = String(body.artist || '').trim();
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) throw badRequest('Invalid media category');
    item.category = body.category;
  }
  if (body.subCategory !== undefined) item.subCategory = String(body.subCategory || '').trim().toLowerCase();
  if (body.language !== undefined) item.language = String(body.language || '').trim() || 'hi';
  if (body.sourceType !== undefined) {
    if (!SOURCE_TYPES.includes(body.sourceType)) throw badRequest('Invalid source type');
    item.sourceType = body.sourceType;
  }
  if (body.audioUrl !== undefined) item.audioUrl = String(body.audioUrl || '').trim();
  if (body.youtubeVideoId !== undefined || body.youtubeUrl !== undefined) {
    const id = youtubeIdFromUrl(body.youtubeVideoId || body.youtubeUrl);
    item.youtubeVideoId = id;
    item.youtubeUrl = id ? youtubeUrlFromId(id) : String(body.youtubeUrl || '').trim();
  }
  if (body.thumbnailImage !== undefined) item.thumbnailImage = String(body.thumbnailImage || '').trim();
  if (file) item.thumbnailImage = `/uploads/content/${file.filename}`;
  if (body.durationText !== undefined) item.durationText = String(body.durationText || '').trim();
  if (body.sourceName !== undefined) item.sourceName = String(body.sourceName || '').trim();
  if (body.sourceUrl !== undefined) item.sourceUrl = String(body.sourceUrl || '').trim();
  if (body.licenseName !== undefined) item.licenseName = String(body.licenseName || '').trim();
  if (body.licenseUrl !== undefined) item.licenseUrl = String(body.licenseUrl || '').trim();
  if (body.attribution !== undefined) item.attribution = String(body.attribution || '').trim();
  if (body.rightsNote !== undefined) item.rightsNote = String(body.rightsNote || '').trim();
  if (body.tags !== undefined) item.tags = cleanTags(body.tags);
  if (body.translations !== undefined) {
    item.translations = normalizeTranslations(body.translations, {
      en: {
        title: item.title || '',
        subtitle: item.subtitle || '',
        artist: item.artist || '',
        tags: item.tags || [],
      },
      hi: { tags: [] },
    });
    item.markModified('translations');
  }
  if (!item.title && item.translations && item.translations.en && item.translations.en.title) {
    item.title = String(item.translations.en.title).trim();
  }
  if (body.isPremium !== undefined) item.isPremium = toBool(body.isPremium, item.isPremium);
  if (body.published !== undefined) item.published = toBool(body.published, item.published);
  if (body.order !== undefined) item.order = toNumber(body.order, item.order);

  if (item.sourceType === 'youtube' && item.youtubeVideoId && !item.youtubeUrl) {
    item.youtubeUrl = youtubeUrlFromId(item.youtubeVideoId);
  }
}

function localizeMedia(item, lang) {
  return {
    ...item,
    title: i18nValue(item, 'title', lang),
    subtitle: i18nValue(item, 'subtitle', lang),
    artist: i18nValue(item, 'artist', lang),
    tags: i18nArray(item, 'tags', lang, item.tags || []),
  };
}

exports.publicList = asyncHandler(async (req, res) => {
  const filter = { published: true };
  if (CATEGORIES.includes(req.query.category)) filter.category = req.query.category;
  if (req.query.subCategory) filter.subCategory = String(req.query.subCategory).trim().toLowerCase();
  if (req.query.q) {
    filter.$text = { $search: String(req.query.q).slice(0, 80) };
  }
  const limit = Math.min(Math.max(Number(req.query.limit) || 80, 1), 500);
  const lang = langFromReq(req);
  const items = await MediaItem.find(filter).sort({ order: 1, createdAt: -1 }).limit(limit).lean();
  res.json({ media: items.map((item) => localizeMedia(item, lang)) });
});

exports.adminList = asyncHandler(async (req, res) => {
  const filter = {};
  if (CATEGORIES.includes(req.query.category)) filter.category = req.query.category;
  if (req.query.subCategory) filter.subCategory = String(req.query.subCategory).trim().toLowerCase();
  if (req.query.published === 'true') filter.published = true;
  if (req.query.published === 'false') filter.published = false;
  if (req.query.search) filter.$text = { $search: String(req.query.search).slice(0, 80) };
  const media = await MediaItem.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  res.json({ media });
});

exports.adminGet = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const item = await MediaItem.findById(req.params.id);
  if (!item) throw notFound('Media item not found');
  res.json({ mediaItem: item });
});

exports.create = asyncHandler(async (req, res) => {
  const item = new MediaItem();
  applyPayload(item, req.body, req.files && req.files.image && req.files.image[0]);
  if (!item.title) throw badRequest('Title zaroori hai');
  if (!item.category) throw badRequest('Category zaroori hai');
  if (item.sourceType === 'youtube' && !item.youtubeVideoId && !item.youtubeUrl) throw badRequest('YouTube video zaroori hai');
  if (item.sourceType === 'audio' && !item.audioUrl) throw badRequest('Audio URL zaroori hai');
  await item.save();
  res.status(201).json({ mediaItem: item });
});

exports.update = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const item = await MediaItem.findById(req.params.id);
  if (!item) throw notFound('Media item not found');
  applyPayload(item, req.body, req.files && req.files.image && req.files.image[0]);
  await item.save();
  res.json({ mediaItem: item });
});

exports.remove = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const item = await MediaItem.findByIdAndDelete(req.params.id);
  if (!item) throw notFound('Media item not found');
  res.json({ deleted: true, id: String(item._id) });
});

exports.reorder = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) throw badRequest('items array zaroori hai');
  await Promise.all(items.map((entry) => {
    ensureObjectId(entry.id);
    return MediaItem.findByIdAndUpdate(entry.id, { order: toNumber(entry.order, 0) });
  }));
  res.json({ updated: true });
});

exports.youtubeSearch = asyncHandler(async (req, res) => {
  if (!env.youtube.apiKey) {
    return res.status(400).json({ error: 'YOUTUBE_API_KEY backend .env me set nahi hai' });
  }
  const q = String(req.query.q || '').trim();
  if (q.length < 2) throw badRequest('Search query zaroori hai');
  const category = CATEGORIES.includes(req.query.category) ? req.query.category : 'spiritual_music';
  const safeQuery = `${q} ${category === 'bhajan' ? 'bhajan devotional' : category === 'mantra' ? 'mantra chanting' : 'spiritual music'}`;
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('safeSearch', 'strict');
  url.searchParams.set('maxResults', String(Math.min(Math.max(Number(req.query.limit) || 8, 1), 20)));
  url.searchParams.set('q', safeQuery);
  url.searchParams.set('key', env.youtube.apiKey);
  if (env.youtube.regionCode) url.searchParams.set('regionCode', env.youtube.regionCode);

  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return res.status(response.status).json({ error: data.error && data.error.message ? data.error.message : 'YouTube search failed' });
  }

  const results = (data.items || []).map((item) => {
    const videoId = item.id && item.id.videoId;
    const snippet = item.snippet || {};
    const thumbnails = snippet.thumbnails || {};
    return {
      title: snippet.title || '',
      subtitle: snippet.channelTitle || '',
      artist: snippet.channelTitle || '',
      category,
      sourceType: 'youtube',
      youtubeVideoId: videoId,
      youtubeUrl: youtubeUrlFromId(videoId),
      thumbnailImage: (thumbnails.high && thumbnails.high.url) || (thumbnails.medium && thumbnails.medium.url) || (thumbnails.default && thumbnails.default.url) || '',
      publishedAt: snippet.publishedAt,
    };
  }).filter((item) => item.youtubeVideoId);

  res.json({ results });
});
