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

// ── Photon (photon.komoot.io) — free OSM typeahead, typo-tolerant, returns coords.
// Best source for tiny Indian villages / tehsils. Each suggestion already carries
// lat/lng so picking it is instant and free (no extra details call).
const INDIA_BBOX = '68.0,6.0,97.5,37.5'; // minLon,minLat,maxLon,maxLat
const INDIA_CENTER = { lat: '22.6', lon: '79.0' };

// rank settlements first (city > town > village > hamlet > locality), admin areas after
function photonRank(p) {
  const v = clean(p.osm_value).toLowerCase();
  const placeOrder = { city: 0, town: 1, municipality: 1, village: 2, hamlet: 3, suburb: 3, quarter: 3, locality: 4, isolated_dwelling: 5 };
  if (p.osm_key === 'place') return placeOrder[v] != null ? placeOrder[v] : 6;
  if (p.osm_key === 'boundary' && v === 'administrative') return 7; // district / state / tehsil
  return 9;
}

function normalizePhotonFeature(f) {
  const p = (f && f.properties) || {};
  const coords = (f && f.geometry && f.geometry.coordinates) || [];
  const lng = num(coords[0]);
  const lat = num(coords[1]);
  if (lat == null || lng == null) return null;
  const cc = clean(p.countrycode).toUpperCase();
  if (cc && cc !== 'IN') return null;               // India only
  if (!cc && clean(p.country) && clean(p.country) !== 'India') return null;
  const name = clean(p.name || p.city || p.county || p.locality);
  if (!name) return null;
  const areaParts = [
    p.city && p.city !== name ? p.city : '',
    p.district || p.county || '',
    p.state || '',
    p.country || 'India',
  ].map(clean).filter(Boolean);
  const secondaryText = Array.from(new Set(areaParts)).join(', ');
  const out = {
    id: `photon:${clean(p.osm_type)}:${p.osm_id != null ? p.osm_id : `${lat},${lng}`}`,
    provider: 'photon',
    placeId: String(p.osm_id || ''),
    mainText: name,
    secondaryText,
    description: [name, secondaryText].filter(Boolean).join(', '),
    lat,
    lng,
    type: clean(p.osm_value || p.type),
  };
  Object.defineProperty(out, '_rank', { value: photonRank(p), enumerable: false });
  return out;
}

async function callPhoton(query, limit) {
  const qs = new URLSearchParams({
    q: query,
    limit: String(Math.min(Math.max(Number(limit) || 8, 1), 12)),
    lang: 'en',
    lat: INDIA_CENTER.lat,
    lon: INDIA_CENTER.lon,
    bbox: INDIA_BBOX,
  });
  return fetchJson(`${env.maps.photonUrl}?${qs.toString()}`, { headers: { 'User-Agent': USER_AGENT } });
}

async function searchPhoton({ query, lang, country, limit }) {
  if (!env.maps.photonEnabled) return [];
  const key = cacheKey(['photon-search', countryCode(country), langCode(lang), limit, query]);
  if (SEARCH_CACHE.has(key)) return SEARCH_CACHE.get(key);
  let json = null;
  try {
    json = await callPhoton(query, limit);
  } catch (e) {
    console.warn('[location] Photon failed:', e.message);
    return [];
  }
  let out = (json && Array.isArray(json.features) ? json.features : [])
    .map(normalizePhotonFeature)
    .filter(Boolean);
  out.sort((a, b) => (a._rank - b._rank)); // settlements first
  out = out.slice(0, 10);
  SEARCH_CACHE.set(key, out);
  return out;
}

// merge several suggestion lists, dedupe by name + first area token, and prefer the
// entry that already has coordinates (so picking it is free + instant).
function dedupeKey(s) {
  const main = clean(s.mainText).toLowerCase();
  const area = clean(s.secondaryText).toLowerCase().split(',')[0].trim();
  return `${main}|${area}`;
}
function mergeSuggestions(lists, limit) {
  const map = new Map();
  const order = [];
  for (const list of lists) {
    for (const s of (list || [])) {
      const k = dedupeKey(s);
      const existing = map.get(k);
      if (!existing) { map.set(k, s); order.push(k); }
      else if ((existing.lat == null || existing.lng == null) && s.lat != null && s.lng != null) { map.set(k, s); }
    }
  }
  return order.map((k) => map.get(k)).slice(0, Math.min(Math.max(Number(limit) || 6, 1), 10));
}

// light auto-correct used only when nothing was found: collapse repeated letters
// ("aagolai" → "agolai", "khannna" → "khana"). Applied as a fallback query so it
// never harms a query that already returned results.
function correctedQuery(q) {
  const c = clean(q).replace(/([a-zA-Zऀ-ॿ])\1+/g, '$1');
  return c && c.toLowerCase() !== clean(q).toLowerCase() ? c : '';
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

  // 1) Google (primary when enabled + quota left) — best ranking for towns/cities.
  let google = [];
  if (googleEnabled()) {
    const g = await searchGoogle({ query: q, lang, country, limit });
    if (g && g.length) google = g;
  }

  // 2) Photon (free OSM typeahead) — ALWAYS, so tiny villages/tehsils surface even
  //    when Google misses them, and so picks come pre-locked with coordinates.
  const photon = await searchPhoton({ query: q, lang, country, limit });

  // 2b) Auto-correct: if the query has doubled letters ("aagolai" → "agolai"), also
  //     fetch the corrected spelling so the intended village still appears.
  const fixed = correctedQuery(q);
  const photonFixed = fixed ? await searchPhoton({ query: fixed, lang, country, limit }) : [];

  // Google first (ranking), then Photon (villages), then corrected matches; duplicates
  // are deduped and upgraded to the coord-locked entry.
  const merged = mergeSuggestions([google, photon, photonFixed], limit);
  if (merged.length) return merged;

  // 3) Nominatim — deepest fallback (original, then corrected spelling).
  const nominatim = await searchNominatim({ query: q, lang, country, limit });
  if (nominatim.length) return nominatim;
  if (fixed) return searchNominatim({ query: fixed, lang, country, limit });
  return [];
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

  const photon = await searchPhoton({ query: q, lang, country, limit: 1 });
  if (photon[0] && photon[0].lat != null && photon[0].lng != null) return photon[0];

  const nominatim = await searchNominatim({ query: q, lang, country, limit: 1 });
  if (nominatim[0]) return nominatim[0];

  const fixed = correctedQuery(q);
  if (fixed) {
    const ph2 = await searchPhoton({ query: fixed, lang, country, limit: 1 });
    if (ph2[0] && ph2[0].lat != null && ph2[0].lng != null) return ph2[0];
    const nm2 = await searchNominatim({ query: fixed, lang, country, limit: 1 });
    if (nm2[0]) return nm2[0];
  }
  throw Object.assign(new Error(`Place nahi mila: ${q}`), { status: 404 });
}

module.exports = { searchLocations, resolveLocation };
