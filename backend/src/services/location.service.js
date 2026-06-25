const dns = require('node:dns');
const env = require('../config/env');
const ApiUsageCounter = require('../models/ApiUsageCounter');
const { fetchT } = require('../utils/httpFetch');

dns.setDefaultResultOrder('ipv4first');

const DEFAULT_COUNTRY = env.maps.defaultCountry || 'in';
const GOOGLE_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const GOOGLE_PLACE_URL = 'https://places.googleapis.com/v1/places';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'ShreeYantraApp/1.0 (birth-location-search)';

const SEARCH_CACHE = new Map();
const RESOLVE_CACHE = new Map();
let lastNominatimAt = 0;

const GOOGLE_SKUS = {
  autocomplete: {
    name: 'places_autocomplete',
    dailyLimit: () => env.maps.googleAutocompleteDailyLimit,
    monthlyLimit: () => env.maps.googleAutocompleteMonthlyLimit,
  },
  details: {
    name: 'place_details_essentials',
    dailyLimit: () => env.maps.googlePlaceDetailsDailyLimit,
    monthlyLimit: () => env.maps.googlePlaceDetailsMonthlyLimit,
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clean = (v) => String(v || '').trim();
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function countryCode(country) {
  return clean(country || DEFAULT_COUNTRY).slice(0, 2).toLowerCase() || DEFAULT_COUNTRY;
}

function langCode(lang) {
  const l = clean(lang).toLowerCase();
  return l.startsWith('hi') ? 'hi' : 'en';
}

function cacheKey(parts) {
  return parts.map((p) => clean(p).toLowerCase()).join('|');
}

function googleEnabled() {
  return !!(env.maps.googleEnabled && env.maps.googleApiKey);
}

function dateKey(period) {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return period === 'month' ? `${y}-${m}` : `${y}-${m}-${day}`;
}

async function reserveCounter(sku, period, key, limit) {
  if (!Number.isFinite(limit) || limit <= 0) return false;
  const filter = { provider: 'google_maps', sku, period, key };
  const doc = await ApiUsageCounter.findOneAndUpdate(
    filter,
    { $setOnInsert: filter },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (!doc || doc.count >= limit) return false;
  const updated = await ApiUsageCounter.findOneAndUpdate(
    { _id: doc._id, count: { $lt: limit } },
    { $inc: { count: 1 } },
    { new: true }
  );
  return !!updated;
}

async function releaseCounter(sku, period, key) {
  await ApiUsageCounter.updateOne(
    { provider: 'google_maps', sku, period, key, count: { $gt: 0 } },
    { $inc: { count: -1 } }
  ).catch(() => {});
}

async function reserveGoogleQuota(kind) {
  if (!googleEnabled()) return false;
  const sku = GOOGLE_SKUS[kind];
  if (!sku) return false;
  const monthKey = dateKey('month');
  const dayKey = dateKey('day');
  try {
    const monthlyOk = await reserveCounter(sku.name, 'month', monthKey, sku.monthlyLimit());
    if (!monthlyOk) return false;
    const dailyOk = await reserveCounter(sku.name, 'day', dayKey, sku.dailyLimit());
    if (!dailyOk) {
      await releaseCounter(sku.name, 'month', monthKey);
      return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}

async function fetchJson(url, options = {}) {
  const res = await fetchT(url, options, 12000);
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) {}
  if (!res.ok) {
    const msg = json?.error?.message || json?.error || text || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return json;
}

function addressPart(address, keys) {
  for (const key of keys) {
    if (address && address[key]) return address[key];
  }
  return '';
}

function compactAddress(address) {
  const parts = [
    addressPart(address, ['village', 'town', 'city', 'hamlet', 'suburb', 'neighbourhood']),
    addressPart(address, ['county', 'state_district', 'district']),
    addressPart(address, ['state']),
    addressPart(address, ['country']),
  ].filter(Boolean);
  return Array.from(new Set(parts)).join(', ');
}

function normalizeNominatimPlace(item) {
  const address = item.address || {};
  const mainText = item.name || addressPart(address, ['village', 'town', 'city', 'hamlet', 'suburb', 'neighbourhood', 'county', 'state']) || item.display_name;
  const secondaryText = compactAddress(address) || item.display_name;
  return {
    id: `nominatim:${item.place_id}`,
    provider: 'nominatim',
    placeId: String(item.place_id || item.osm_id || ''),
    mainText,
    secondaryText,
    description: item.display_name || [mainText, secondaryText].filter(Boolean).join(', '),
    lat: num(item.lat),
    lng: num(item.lon),
  };
}

async function callNominatim(params) {
  const now = Date.now();
  const waitMs = Math.max(0, 1100 - (now - lastNominatimAt));
  if (waitMs) await sleep(waitMs);
  lastNominatimAt = Date.now();

  const qs = new URLSearchParams(params);
  return fetchJson(`${NOMINATIM_URL}?${qs.toString()}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
}

async function searchNominatim({ query, lang, country, limit }) {
  const cc = countryCode(country);
  const key = cacheKey(['nominatim-search', cc, langCode(lang), limit, query]);
  if (SEARCH_CACHE.has(key)) return SEARCH_CACHE.get(key);

  const arr = await callNominatim({
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(Math.min(Math.max(Number(limit) || 6, 1), 8)),
    countrycodes: cc,
    q: query,
    'accept-language': langCode(lang),
  });
  const out = Array.isArray(arr) ? arr.map(normalizeNominatimPlace).filter((x) => x.lat != null && x.lng != null) : [];
  SEARCH_CACHE.set(key, out);
  return out;
}

function normalizeGoogleSuggestion(s) {
  const p = s.placePrediction;
  if (!p) return null;
  const mainText = p.structuredFormat?.mainText?.text || p.text?.text || '';
  const secondaryText = p.structuredFormat?.secondaryText?.text || '';
  const description = p.text?.text || [mainText, secondaryText].filter(Boolean).join(', ');
  return {
    id: `google:${p.placeId}`,
    provider: 'google',
    placeId: p.placeId,
    mainText,
    secondaryText,
    description,
  };
}

async function searchGoogle({ query, lang, country, limit }) {
  if (!googleEnabled()) return null;
  const cc = countryCode(country);
  const key = cacheKey(['google-search', cc, langCode(lang), limit, query]);
  if (SEARCH_CACHE.has(key)) return SEARCH_CACHE.get(key);
  if (!(await reserveGoogleQuota('autocomplete'))) return null;

  const body = {
    input: query,
    includedRegionCodes: [cc],
    languageCode: langCode(lang),
    regionCode: cc,
  };
  try {
    const json = await fetchJson(GOOGLE_AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.maps.googleApiKey,
        'X-Goog-FieldMask': [
          'suggestions.placePrediction.placeId',
          'suggestions.placePrediction.text.text',
          'suggestions.placePrediction.structuredFormat.mainText.text',
          'suggestions.placePrediction.structuredFormat.secondaryText.text',
        ].join(','),
      },
      body: JSON.stringify(body),
    });
    const out = (json?.suggestions || [])
      .map(normalizeGoogleSuggestion)
      .filter(Boolean)
      .slice(0, Math.min(Math.max(Number(limit) || 6, 1), 8));
    SEARCH_CACHE.set(key, out);
    return out;
  } catch (e) {
    // Google disabled / quota / network → caller falls back to free Nominatim
    console.warn('[location] Google autocomplete failed, falling back to Nominatim:', e.message);
    return null;
  }
}

async function getGooglePlaceDetails(placeId, lang) {
  if (!googleEnabled() || !placeId) return null;
  const key = cacheKey(['google-details', langCode(lang), placeId]);
  if (RESOLVE_CACHE.has(key)) return RESOLVE_CACHE.get(key);
  if (!(await reserveGoogleQuota('details'))) return null;

  try {
    const json = await fetchJson(`${GOOGLE_PLACE_URL}/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': env.maps.googleApiKey,
        'X-Goog-FieldMask': 'id,formattedAddress,location,addressComponents',
        'Accept-Language': langCode(lang),
      },
    });
    const out = {
      id: `google:${json.id || placeId}`,
      provider: 'google',
      placeId: json.id || placeId,
      mainText: json.formattedAddress || '',
      secondaryText: json.formattedAddress || '',
      description: json.formattedAddress || '',
      lat: num(json.location?.latitude),
      lng: num(json.location?.longitude),
    };
    RESOLVE_CACHE.set(key, out);
    return out;
  } catch (e) {
    console.warn('[location] Google place details failed, falling back to Nominatim:', e.message);
    return null;
  }
}

async function searchLocations({ query, lang = 'en', country = DEFAULT_COUNTRY, limit = 6 }) {
  const q = clean(query);
  if (q.length < 3) return [];
  if (googleEnabled()) {
    const google = await searchGoogle({ query: q, lang, country, limit });
    if (google && google.length) return google;
  }
  return searchNominatim({ query: q, lang, country, limit });
}

async function resolveLocation({ provider, placeId, query, description, lat, lng, lang = 'en', country = DEFAULT_COUNTRY }) {
  const directLat = num(lat);
  const directLng = num(lng);
  if (directLat != null && directLng != null) {
    const label = clean(description || query || 'Selected place');
    return {
      id: provider && placeId ? `${provider}:${placeId}` : `manual:${directLat},${directLng}`,
      provider: provider || 'manual',
      placeId: placeId || undefined,
      mainText: label,
      secondaryText: '',
      description: label,
      lat: directLat,
      lng: directLng,
    };
  }

  if (provider === 'google' && placeId) {
    const details = await getGooglePlaceDetails(placeId, lang);
    if (details?.lat != null && details?.lng != null) return details;
  }

  const q = clean(query || description);
  if (!q) throw Object.assign(new Error('Location query chahiye'), { status: 400 });

  if (googleEnabled()) {
    const suggestions = await searchGoogle({ query: q, lang, country, limit: 1 });
    const first = suggestions && suggestions[0];
    if (first?.placeId) {
      const details = await getGooglePlaceDetails(first.placeId, lang);
      if (details?.lat != null && details?.lng != null) return details;
    }
  }

  const nominatim = await searchNominatim({ query: q, lang, country, limit: 1 });
  if (nominatim[0]) return nominatim[0];
  throw Object.assign(new Error(`Place nahi mila: ${q}`), { status: 404 });
}

module.exports = { searchLocations, resolveLocation };
