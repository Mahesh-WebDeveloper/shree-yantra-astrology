/**
 * Backend API client — RN app sirf isi layer se backend se baat karta hai.
 *
 * ⚠️ IMPORTANT (testing on phone): Expo Go phone par `localhost` PC ko reach NAHI karta.
 *    PC ka LAN IP daalo (yahan). Phone + PC same WiFi par hone chahiye.
 *    Agar connect na ho to Windows Firewall me Node/port 4000 (inbound) allow karo.
 *    Emulator: Android emulator ke liye 10.0.2.2 use karo.
 */
import { beginNetworkActivity, type NetworkActivityMeta } from './networkActivity';

// Production: set EXPO_PUBLIC_API_URL (https) in the build env / app.config / EAS secrets.
// Dev fallback: LAN IP for Expo Go on a phone (localhost won't reach the PC from the device).
const DEV_API = 'http://192.168.0.234:4000';
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? DEV_API : '')).replace(/\/$/, '');

// every network call gets a hard timeout so a hung backend never spins a loader forever
// Default timeout for ALL API calls. VedAstro-backed endpoints + heavy days (many
// parallel calls / slow upstream) can take a while, so we keep this generous; the
// heaviest aggregators (Brihat, transit) override with even longer values below.
const REQUEST_TIMEOUT_MS = 30000;
// AI generation (with the provider fallback chain Gemini→Groq→OpenRouter, each retrying)
// routinely takes 30–90s. A 30s client timeout aborts while the server is still working —
// the server finishes and CACHES the result, so a manual retry then returns instantly,
// which looked like "network error, but retry works". Give AI/heavy endpoints a generous
// per-attempt timeout so the first attempt actually waits for the response.
const AI_TIMEOUT_MS = 120000;
const AI_PATH_RE = /\/api\/(ai\/|vedic-reading|brihat-kundli|match|gochar|remedies|life-timeline|transit-forecast|name-suggestions|baby-names|name-ask|numerology\/interpret|horoscope\/personalized|muhurat\/find|vastu\/ask)/;
function timeoutForPath(path: string, explicit?: number): number {
  const clean = path.split('?')[0];
  if (AI_PATH_RE.test(clean)) return Math.max(explicit ?? 0, AI_TIMEOUT_MS);
  return explicit ?? REQUEST_TIMEOUT_MS;
}

function activityForPath(path: string): NetworkActivityMeta | null {
  const clean = path.split('?')[0];
  if (clean.includes('/locations/search') || clean.includes('/locations/resolve')) return null;
  // primary:true = heavy, user-awaited initial load → full cosmic loader.
  // primary absent = background/secondary fetch → only a subtle non-blocking top bar.
  if (clean.includes('/brihat-kundli')) return { key: 'brihat', primary: true, titleEn: 'Generating Brihat Kundli', titleHi: 'बृहत कुंडली बन रही है', detailEn: 'Chart, dasha, varga and remedies are being assembled.', detailHi: 'कुंडली, दशा, वर्ग और उपाय जोड़े जा रहे हैं।' };
  if (clean.includes('/festival')) return { key: 'panchang', titleEn: 'Finding Festival Dates', titleHi: 'पर्व-तिथियाँ खोजी जा रही हैं', detailEn: 'Upcoming festival and vrat dates are being checked.', detailHi: 'आने वाले पर्व-व्रत की तिथियाँ जांची जा रही हैं।' };
  if (clean.includes('/kundli')) return { key: 'kundli', primary: true, titleEn: 'Calculating Kundli', titleHi: 'कुंडली की गणना हो रही है', detailEn: 'Precise planetary positions are loading.', detailHi: 'सटीक ग्रह-स्थिति लोड हो रही है।' };
  if (clean.includes('/varga')) return { key: 'varga', titleEn: 'Preparing Varga Charts', titleHi: 'वर्ग चार्ट तैयार हो रहे हैं', detailEn: 'Divisional charts are being calculated.', detailHi: 'विभागीय चार्ट की गणना हो रही है।' };
  if (clean.includes('/dasha') || clean.includes('/life-timeline')) return { key: 'dasha', titleEn: 'Computing Dasha Timeline', titleHi: 'दशा समयरेखा बन रही है', detailEn: 'Life periods are being mapped from the birth chart.', detailHi: 'जन्म कुंडली से जीवन कालखंड मिलाए जा रहे हैं।' };
  if (clean.includes('/gochar')) return { key: 'gochar', titleEn: 'Fetching Gochar', titleHi: 'गोचर लोड हो रहा है', detailEn: 'Current planetary transits are being checked.', detailHi: 'वर्तमान ग्रह गोचर जांचे जा रहे हैं।' };
  if (clean.includes('/transit-forecast')) return { key: 'forecast', primary: true, titleEn: 'Computing Year Forecast', titleHi: 'वार्षिक फल की गणना हो रही है', detailEn: 'Saturn and Jupiter transit years are being prepared.', detailHi: 'शनि और गुरु के गोचर वर्ष तैयार हो रहे हैं।' };
  if (clean.includes('/remedies')) return { key: 'remedies', primary: true, titleEn: 'Preparing Remedies', titleHi: 'उपाय तैयार हो रहे हैं', detailEn: 'Chart-based remedies are being prepared.', detailHi: 'कुंडली आधारित उपाय तैयार हो रहे हैं।' };
  if (clean.includes('/vedic-reading')) return { key: 'reading', primary: true, titleEn: 'Preparing Reading', titleHi: 'फलादेश तैयार हो रहा है', detailEn: 'Classical chart indications are being assembled.', detailHi: 'शास्त्रीय कुंडली संकेत जोड़े जा रहे हैं।' };
  if (clean.includes('/vastu/ask')) return { key: 'vastu', titleEn: 'Preparing Vastu Guidance', titleHi: 'वास्तु मार्गदर्शन तैयार हो रहा है', detailEn: 'Your layout and Vastu rule context are being explained clearly.', detailHi: 'आपके नक्शे और वास्तु नियमों को सरल उत्तर में बदला जा रहा है।' };
  if (clean.includes('/vastu')) return { key: 'vastu', primary: true, titleEn: 'Checking Vastu Layout', titleHi: 'वास्तु लेआउट जांचा जा रहा है', detailEn: 'Directions, rooms and suggested map are being prepared.', detailHi: 'दिशाएं, कमरे और सुझाया गया नक्शा तैयार हो रहा है।' };
  if (clean.includes('/panchang') || clean.includes('/muhurat')) return { key: 'panchang', primary: true, titleEn: 'Computing Panchang', titleHi: 'पंचांग की गणना हो रही है', detailEn: 'Local time, tithi and nakshatra are being checked.', detailHi: 'स्थानीय समय, तिथि और नक्षत्र जांचे जा रहे हैं।' };
  // daily / period rashifal = the screen's MAIN content (empty until it loads) → full loader
  if (clean.includes('/ai/daily-prediction') || clean.includes('/ai/period-prediction')) return { key: 'ai', primary: true, titleEn: 'Preparing Your Rashifal', titleHi: 'आपका राशिफल तैयार हो रहा है', detailEn: 'Reading your chart and today’s panchang.', detailHi: 'आपकी कुंडली और आज का पंचांग पढ़ा जा रहा है।' };
  // ask-astrologer / insights etc. = background (the screen shows its own inline loader)
  if (clean.includes('/ai') || clean.includes('/name-suggestions') || clean.includes('/horoscope/personalized')) return { key: 'ai', titleEn: 'Preparing AI Guidance', titleHi: 'AI मार्गदर्शन तैयार हो रहा है', detailEn: 'Your chart context is being converted into a clear answer.', detailHi: 'कुंडली संदर्भ को सरल उत्तर में बदला जा रहा है।' };
  if (clean.includes('/match')) return { key: 'match', primary: true, titleEn: 'Matching Kundlis', titleHi: 'कुंडली मिलान हो रहा है', detailEn: 'Compatibility factors are being checked.', detailHi: 'अनुकूलता के कारक जांचे जा रहे हैं।' };
  if (clean.includes('/auth')) return { key: 'auth', titleEn: 'Securing Session', titleHi: 'सत्र सुरक्षित हो रहा है', detailEn: 'Your login request is being verified.', detailHi: 'आपका लॉगिन अनुरोध सत्यापित हो रहा है।' };
  if (clean.includes('/profile')) return { key: 'profile', titleEn: 'Updating Profile', titleHi: 'प्रोफ़ाइल अपडेट हो रही है', detailEn: 'Your saved details are being synced.', detailHi: 'आपके सहेजे हुए विवरण सिंक हो रहे हैं।' };
  if (clean.includes('/content') || clean.includes('/library') || clean.includes('/audio') || clean.includes('/veda') || clean.includes('/gita') || clean.includes('/ramayan')) return { key: 'content', titleEn: 'Loading Sacred Content', titleHi: 'धार्मिक सामग्री लोड हो रही है', detailEn: 'Chapters and reading data are being prepared.', detailHi: 'अध्याय और पठन डेटा तैयार हो रहा है।' };
  return { key: 'generic', titleEn: 'Loading Data', titleHi: 'डेटा लोड हो रहा है', detailEn: 'Please wait while the app prepares this screen.', detailHi: 'स्क्रीन तैयार हो रही है, कृपया प्रतीक्षा करें।' };
}

function createApiError(message: string, retryable = false, status?: number): Error {
  const err = new Error(message) as Error & { retryable?: boolean; status?: number };
  err.retryable = retryable;
  if (status != null) err.status = status;
  return err;
}

function normalizeFetchError(e: any): Error {
  if (e?.name === 'AbortError') {
    return createApiError(apiLang === 'hi'
      ? 'अनुरोध समय सीमा से बाहर हो गया। नेटवर्क स्थिर है या नहीं जांचें और फिर प्रयास करें।'
      : 'Request timed out. Please check your connection and try again.', true);
  }
  const msg = String(e?.message || e || '');
  if (/Network request failed|Failed to fetch|NetworkError/i.test(msg)) {
    if (apiLang === 'hi') {
      return createApiError(__DEV__
        ? 'नेटवर्क अनुरोध विफल रहा। ऐप backend ' + (API_BASE || 'API server') + ' तक नहीं पहुंच पा रहा है। Backend running, same WiFi, firewall और EXPO_PUBLIC_API_URL जांचें।'
        : 'नेटवर्क अनुरोध विफल रहा। इंटरनेट कनेक्शन जांचें और फिर प्रयास करें।', true);
    }
    return createApiError(__DEV__
      ? 'Network request failed. The app cannot reach backend ' + (API_BASE || 'API server') + '. Check that the backend is running, the device is on the same WiFi, firewall allows the port, and EXPO_PUBLIC_API_URL is correct.'
      : 'Network request failed. Please check your internet connection and try again.', true);
  }
  return e instanceof Error ? e : createApiError(msg || (apiLang === 'hi' ? 'नेटवर्क अनुरोध विफल रहा।' : 'Network request failed'));
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const retryDelayMs = (attempt: number) => 900 + attempt * 900;
const isRetryableStatus = (status?: number) => status === 408 || status === 429 || (typeof status === 'number' && status >= 500);

function isRetryableError(e: any) {
  if (e?.retryable) return true;
  if (isRetryableStatus(e?.status)) return true;
  const msg = String(e?.message || e || '');
  return /timed out|Network request failed|Failed to fetch|NetworkError|temporarily unavailable|timeout|504|503|502|429|408/i.test(msg);
}

function retryCountForPath(path: string, method: string) {
  const clean = path.split('?')[0];
  if (clean.includes('/auth') || clean.includes('/profile/avatar')) return 0;
  if (clean.includes('/locations/search') || clean.includes('/locations/resolve')) return 0;
  if (clean.includes('/profile') && method !== 'GET') return 0;
  if (clean.includes('/api/ai/ask-astrologer')) return 0;
  const safeComputeEndpoints = [
    '/brihat-kundli', '/kundli', '/varga', '/dasha', '/life-timeline', '/gochar', '/transit-forecast',
    '/remedies', '/vedic-reading', '/panchang', '/muhurat', '/festival', '/ai', '/name-suggestions',
    '/horoscope/personalized', '/match', '/baby-names', '/name-ask', '/vastu',
  ];
  if (safeComputeEndpoints.some((endpoint) => clean.includes(endpoint))) return 1;
  return method === 'GET' ? 1 : 0;
}

async function requestJson<T>(path: string, makeRequest: () => Promise<Response>, retries: number): Promise<T> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await makeRequest();
      if (!res.ok) {
        const retryable = isRetryableStatus(res.status);
        if (retryable && attempt < retries) {
          await delay(retryDelayMs(attempt));
          continue;
        }
        const { message, code } = await parseErrorBody(res);
        // SESSION_REVOKED = doosre device par login | AUTH_INVALID = account delete/blocked
        // dono me is device ka session mar chuka hai → force logout
        if (res.status === 401 && (code === 'SESSION_REVOKED' || code === 'AUTH_INVALID')) onSessionRevoked?.();
        throw createApiError(message, retryable, res.status);
      }
      return await res.json();
    } catch (e: any) {
      lastError = e;
      if (attempt < retries && isRetryableError(e)) {
        await delay(retryDelayMs(attempt));
        continue;
      }
      throw e;
    }
  }
  throw lastError instanceof Error ? lastError : createApiError(apiLang === 'hi' ? 'अनुरोध पूरा नहीं हो पाया।' : 'Request could not be completed.');
}

async function fetchT(url: string, options: RequestInit = {}, timeoutMs: number = REQUEST_TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } catch (e: any) {
    throw normalizeFetchError(e);
  } finally {
    clearTimeout(id);
  }
}

// ── auth token (memory) — lib/auth.ts isse storage se sync karta hai ──
let authToken: string | null = null;
export function setAuthToken(t: string | null) { authToken = t; }
export function getAuthToken() { return authToken; }
function authHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

// current app language — LanguageProvider isse sync karta hai; AI calls me jaata hai
let apiLang: 'en' | 'hi' = 'en';
export function setApiLang(l: 'en' | 'hi') { apiLang = l; }
function withLang(path: string) {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}lang=${apiLang}`;
}

export interface KundliInput {
  lat?: number; // preferred for accurate calculations; place-only fallback backend geocode karega
  lng?: number;
  dob: string;  // DD-MM-YYYY
  tob: string;  // HH:MM (24h)
  tz: string;   // +05:30
  place?: string;
}

export interface ApiPlanet {
  planet: string;
  sign?: string;
  degreeInSign?: string;
  nirayanaLongitude?: string;
  nakshatra?: string;
  house?: string;
  navamsaSign?: string;
  isRetrograde?: string;
  isCombust?: string;
  error?: string;
}

export interface ApiDosha {
  name: string;
  present: boolean;
  detail: string;
  tag: string;
  source?: string; // 'VedAstro' (authoritative) ya 'computed'
}

export interface KundliInsight { title: string; text: string; }
export interface KundliResponse {
  cached: boolean;
  saved?: boolean;
  data: { ayanamsa: string; location: any; time: string; ascendant?: string; moonSign?: string; doshas?: ApiDosha[]; yogas?: YogaItem[]; insights?: KundliInsight[]; planets: ApiPlanet[] };
}

export interface VargaChart {
  code: string;
  name: string;
  nameHi?: string;
  sanskrit?: string;
  area: string;
  areaHi?: string;
  level: 'core' | 'advanced' | 'expert';
  why: string;
  whyHi?: string;
  ascendantSign?: string | null;
  planets: ApiPlanet[];
  calculation?: string;
}
export interface VargaResponse {
  cached: boolean;
  data: {
    ayanamsa?: string;
    location?: any;
    time?: string;
    ascendant?: string;
    moonSign?: string;
    charts: VargaChart[];
  };
}

// backend error body { error: "..." } ko readable message me badalta hai
async function parseErrorBody(res: Response): Promise<{ message: string; code?: string }> {
  const txt = await res.text().catch(() => '');
  try { const j = JSON.parse(txt); if (j && (j.error || j.message)) return { message: j.error || j.message, code: j.code }; } catch {}
  return { message: `Backend ${res.status}: ${txt.slice(0, 120)}` };
}

// SINGLE-DEVICE SESSION: when the backend reports our session was revoked (i.e. the
// account was logged in on another device), this global handler force-logs-out this
// device. Registered once in App.tsx (kept here to avoid an api→auth import cycle).
let onSessionRevoked: (() => void) | null = null;
export function setSessionRevokedHandler(fn: (() => void) | null) { onSessionRevoked = fn; }

async function post<T>(path: string, body: any, method: 'POST' | 'PUT' | 'PATCH' = 'POST', timeoutMs?: number): Promise<T> {
  const endActivity = beginNetworkActivity(activityForPath(path));
  try {
    return await requestJson<T>(path, () => fetchT(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }, timeoutForPath(path, timeoutMs)), retryCountForPath(path, method));
  } finally {
    endActivity();
  }
}

async function get<T>(path: string): Promise<T> {
  const endActivity = beginNetworkActivity(activityForPath(path));
  try {
    return await requestJson<T>(path, () => fetchT(`${API_BASE}${path}`, { headers: authHeaders() }), retryCountForPath(path, 'GET'));
  } finally {
    endActivity();
  }
}

async function del<T>(path: string): Promise<T> {
  const endActivity = beginNetworkActivity(activityForPath(path));
  try {
    return await requestJson<T>(path, () => fetchT(`${API_BASE}${path}`, { method: 'DELETE', headers: authHeaders() }), retryCountForPath(path, 'DELETE'));
  } finally {
    endActivity();
  }
}

export interface DashaRow {
  lord: string;
  start: string; // "00:00 18/06/2026 +05:30"
  end: string;
  durationText: string;
}
export interface DashaResponse {
  ayanamsa: string;
  dasha: DashaRow[];
}

export interface YogaItem { name: string; description: string; }
export interface YogaResponse { ayanamsa: string; yogas: YogaItem[]; }

export interface SunTimesResponse {
  date: string;
  place: string;
  sunrise: { h: number; m: number };
  sunset: { h: number; m: number };
}

// ── auth + profile ──
export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  providers: string[];
  interests: string[];
  profile: { dob?: string; tob?: string; tz?: string; place?: string; lat?: number; lng?: number; gender?: string; avatar?: string };
  plan: 'free' | 'premium';
  createdAt?: string;
}
export interface AuthResponse { token: string; user: AuthUser; }
export interface AuthMethods { password: boolean; otp: boolean; google: boolean; apple: boolean; }

export const getAuthConfig = () => get<{ authMethods: AuthMethods }>('/api/auth/config');
export const registerUser = (input: { name: string; email?: string; phone?: string; password: string; interests?: string[] }) =>
  post<AuthResponse>('/api/auth/register', input);
export const loginUser = (input: { identifier: string; password: string }) =>
  post<AuthResponse>('/api/auth/login', input);
export const getMe = () => get<{ user: AuthUser }>('/api/auth/me');
// user-initiated logout — clears the server-side session too (single-device)
export const logoutServer = () => post<{ ok: boolean }>('/api/auth/logout', {});

// ── mobile + OTP (sabse simple login/register) ──
export interface OtpRequestResponse { sent: boolean; phone: string; devCode?: string }
export interface VerifyOtpResponse { token: string; user: AuthUser; isNew: boolean; profileComplete: boolean }
export const requestOtp = (phone: string) => post<OtpRequestResponse>('/api/auth/request-otp', { phone });
export const verifyOtp = (input: { phone: string; code: string; name?: string }) =>
  post<VerifyOtpResponse>('/api/auth/verify-otp', input);
// Google Sign-In — send the Google ID token, backend verifies + returns our JWT (same shape as OTP)
export const googleLogin = (idToken: string) =>
  post<VerifyOtpResponse>('/api/auth/google', { idToken });
// account linking — logged-in (OTP) user apne account par email+password add kare
export const setPasswordApi = (input: { email?: string; password: string }) =>
  post<{ user: AuthUser }>('/api/auth/set-password', input);
export const updateProfileApi = (input: { name?: string; interests?: string[]; profile?: AuthUser['profile'] }) =>
  post<{ user: AuthUser }>('/api/profile', input, 'PUT');

// ── birth-place search/resolve ──
export interface LocationSuggestion {
  id: string;
  provider: 'google' | 'nominatim' | 'photon' | 'manual' | string;
  placeId?: string;
  mainText: string;
  secondaryText?: string;
  description: string;
  lat?: number | null;
  lng?: number | null;
  /** OSM place type when available (village, town, city, administrative…) */
  type?: string;
}
export const searchLocations = (input: { query: string; lang?: 'en' | 'hi'; country?: string; limit?: number }) => {
  const qs = new URLSearchParams();
  qs.set('q', input.query);
  if (input.lang) qs.set('lang', input.lang);
  if (input.country) qs.set('country', input.country);
  if (input.limit) qs.set('limit', String(input.limit));
  return get<{ items: LocationSuggestion[] }>(`/api/locations/search?${qs.toString()}`);
};
export const resolveLocation = (input: Partial<LocationSuggestion> & { query?: string; lang?: 'en' | 'hi'; country?: string }) =>
  post<{ item: LocationSuggestion }>('/api/locations/resolve', input);

// profile pic — server par relative path store hota hai; display ke liye full URL chahiye
export const avatarUrl = (p?: string | null) => (p ? (/^https?:\/\//i.test(p) ? p : `${API_BASE}${p}`) : null);
export const removeAvatarApi = () => del<{ user: AuthUser }>('/api/profile/avatar');
export async function uploadAvatar(uri: string): Promise<{ user: AuthUser; avatar: string }> {
  const name = uri.split('/').pop() || 'avatar.jpg';
  const ext = (name.split('.').pop() || 'jpg').toLowerCase();
  const type =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'heic' || ext === 'heif' ? 'image/heic' : 'image/jpeg';
  const form = new FormData();
  // RN FormData file shape
  form.append('avatar', { uri, name, type } as any);
  const endActivity = beginNetworkActivity(activityForPath('/api/profile/avatar'));
  try {
    const res = await fetch(`${API_BASE}/api/profile/avatar`, {
      method: 'POST',
      headers: { ...authHeaders() }, // Content-Type NAHI - fetch khud multipart boundary set karega
      body: form,
    });
    if (!res.ok) {
      const eb = await parseErrorBody(res);
      if (res.status === 401 && eb.code === 'SESSION_REVOKED') onSessionRevoked?.();
      throw new Error(eb.message);
    }
    return await res.json();
  } catch (e: any) {
    throw normalizeFetchError(e);
  } finally {
    endActivity();
  }
}

// ── daily panchang ──
export interface PanchangPeriod { name: string; note: string; start: string; end: string; }
export interface AngaEnd { hm: string; nextDay: boolean; }
export interface PanchangTimePart {
  raw?: string;
  hm12: string;
  hm24: string;
  hour?: number;
  minute?: number;
  second?: number;
  minutesFromMidnight: number;
}
export interface PanchangDuration {
  minutes: number;
  hours: number;
  remainingMinutes: number;
  text: string;
  hi: string;
}
export interface PanchangObservance {
  key: string;
  name: { en: string; hi: string };
  type: 'vrat' | 'festival' | 'caution' | string;
  importance: 'regular' | 'high' | 'major' | string;
  guidance: { en: string; hi: string };
}
export interface PanchangResponse {
  date: string;
  weekday: string;
  weekdayHi?: string;
  location: string;
  sunrise: string;
  sunset: string;
  moonrise?: string | null;
  moonset?: string | null;
  timings?: {
    sunrise: PanchangTimePart | null;
    sunset: PanchangTimePart | null;
    moonrise: PanchangTimePart | null;
    moonset: PanchangTimePart | null;
    midday: PanchangTimePart;
    daylight: PanchangDuration;
    night: PanchangDuration;
  };
  sun: { sign?: string; nakshatra?: string };
  moon: { sign?: string; nakshatra?: string };
  currentTime?: PanchangTimePart | null;
  isCurrent?: boolean;
  tithi: { num: number; name: string; hi?: string; paksha: string; pakshaHi?: string; endsAt?: AngaEnd };
  nakshatra: { num: number; name: string; hi?: string; pada: number; endsAt?: AngaEnd };
  yoga: { num: number; name: string; hi?: string; endsAt?: AngaEnd };
  karana: { name: string; hi?: string; isBhadra?: boolean; endsAt?: AngaEnd };
  sunriseTithi?: { num: number; name: string; hi?: string; paksha: string; pakshaHi?: string; endsAt?: AngaEnd } | null;
  sunriseNakshatra?: { num: number; name: string; hi?: string; pada: number; endsAt?: AngaEnd } | null;
  sunriseYoga?: { num: number; name: string; hi?: string; endsAt?: AngaEnd } | null;
  sunriseKarana?: { name: string; hi?: string; isBhadra?: boolean; endsAt?: AngaEnd } | null;
  masa?: { amanta: { en: string; hi: string }; purnimanta: { en: string; hi: string }; system?: 'amanta' | 'purnimanta' } | null;
  ritu?: { en: string; hi: string } | null;
  ayana?: { en: string; hi: string } | null;
  samvat?: { vikram: number; shaka: number } | null;
  samvatsara?: string;
  bhadra?: boolean;
  panchak?: {
    active: boolean;
    type: { key: string; en: string; hi: string; auspicious: boolean; effect: { en: string; hi: string } };
    startAt: number; endAt: number;
    startLabel: string; endLabel: string;
  } | null;
  observances?: PanchangObservance[];
  auspicious?: PanchangPeriod[];
  inauspicious: PanchangPeriod[];
  calculation?: {
    dayStartsAt?: string;
    ayanamsa?: string;
    fiveLimbs?: string;
    endTimes?: string;
    observanceRule?: string;
  };
  ayanamsa: string;
  source: string;
  provider?: 'local' | 'vedastro' | string; // dev hint: where the astronomy came from
}
const TITHI_EN = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima'];
const TITHI_HI = ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा'];
const pad2 = (n: number) => (n < 10 ? '0' : '') + n;
const parseTzOffset = (tz?: string) => {
  const m = String(tz || '+05:30').match(/([+-])(\d{1,2}):?(\d{2})/);
  if (!m) return 330;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3]));
};
const localNowForTz = (tz?: string) => {
  const shifted = new Date(Date.now() + parseTzOffset(tz) * 60000);
  return {
    dmy: `${pad2(shifted.getUTCDate())}/${pad2(shifted.getUTCMonth() + 1)}/${shifted.getUTCFullYear()}`,
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() + shifted.getUTCSeconds() / 60,
  };
};
const hmToMinutes = (hm?: string) => {
  const m = String(hm || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
};
const tithiFromNum = (num: number): PanchangResponse['tithi'] => {
  const n = ((Math.round(num) - 1) % 30 + 30) % 30 + 1;
  const paksha = n <= 15 ? 'Shukla' : 'Krishna';
  if (n === 30) return { num: n, name: 'Amavasya', hi: 'अमावस्या', paksha, pakshaHi: 'कृष्ण पक्ष' };
  const idx = (n - 1) % 15;
  return {
    num: n,
    name: TITHI_EN[idx],
    hi: TITHI_HI[idx],
    paksha,
    pakshaHi: paksha === 'Shukla' ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष',
  };
};
function normalizeActivePanchang(p: PanchangResponse, input: { date?: string; tz?: string }): PanchangResponse {
  if (!p?.tithi?.endsAt || p.isCurrent) return p;
  const now = localNowForTz(input.tz);
  const requestedDate = input.date || p.date || now.dmy;
  if (requestedDate !== now.dmy || p.tithi.endsAt.nextDay) return p;
  const endMin = hmToMinutes(p.tithi.endsAt.hm);
  if (endMin == null || now.minutes < endMin) return p;
  const sunriseTithi = p.sunriseTithi || { ...p.tithi };
  return {
    ...p,
    tithi: tithiFromNum((p.tithi.num || 0) + 1),
    sunriseTithi,
    currentTime: {
      hm12: '',
      hm24: `${pad2(Math.floor(now.minutes / 60))}:${pad2(Math.floor(now.minutes % 60))}`,
      minutesFromMidnight: now.minutes,
    },
    isCurrent: true,
    calculation: {
      ...(p.calculation || {}),
      fiveLimbs: 'Client-corrected active tithi from backend sunrise tithi end-time',
      observanceRule: 'sunrise tithi preserved separately; active tithi adjusted after end-time',
    },
  };
}
export const getPanchang = async (input: { place?: string; lat?: number; lng?: number; date?: string; tz?: string }) =>
  normalizeActivePanchang(await post<PanchangResponse>('/api/panchang', input), input);

// ── Shubh Muhurat (auspicious timing finder) ──
export interface MuhuratRequires { name: 'none' | 'optional' | 'required'; birth: 'none' | 'optional' | 'required'; couple: boolean }
export interface MuhuratCategory {
  key: string;
  name: { en: string; hi: string };
  emoji: string;
  art?: string;
  group: string;
  blurb: { en: string; hi: string };
  nameBased: boolean;
  why?: { en: string; hi: string };
  requires?: MuhuratRequires;
  bestLagna?: string[] | null;
}
export type Bi = { en: string; hi: string };
export interface MuhuratBreakdown { key: string; en: string; hi: string; pts: number; max: number; ok: boolean }
export interface MuhuratWindow { name?: string; start: string; end: string }
export interface MuhuratItem {
  date: string;
  dmy: string;
  weekday: string;
  weekdayHi?: string;
  tithi: { num: number; name: string; hi?: string; paksha: string; pakshaHi?: string };
  nakshatra: { num: number; name: string; hi?: string; pada: number };
  yoga?: { name: string; hi?: string } | null;
  karana?: { name: string; hi?: string } | null;
  moonSign?: Bi | null;
  score: number;
  rating: Bi;
  breakdown: MuhuratBreakdown[];
  chandra?: { house: number; label: Bi } | null;
  tara?: { en: string; hi: string; label: Bi } | null;
  time: { abhijit: MuhuratWindow | null; brahma?: MuhuratWindow | null; windows: MuhuratWindow[]; rahuKaal: { start: string; end: string } | null };
  flags: { rahuKaal: string; durmuhurat: string; bhadra: boolean; panchak: boolean; choghadiya: string | null };
  special?: Bi | null; // festival buy-day badge (Dhanteras / Pushya / Akshaya Tritiya)
  sunrise: string;
  sunset: string;
  ok?: boolean;        // false when a chosen `target` date is itself inauspicious
  reject?: Bi;         // reason the target date is not auspicious
}
export interface MuhuratResult {
  category: MuhuratCategory;
  method: Bi;
  nameRashi?: string | null;
  janmaNakshatra?: number | null;
  scanned: number;
  best: MuhuratItem | null;
  target?: MuhuratItem | null;   // the user's chosen date (scored even if not auspicious)
  items: MuhuratItem[];
}
export interface MuhuratBirthInput { date?: string; time?: string; place?: string; lat?: number; lng?: number; tz?: string }
export const getMuhuratCategories = () => get<{ items: MuhuratCategory[] }>('/api/muhurat/categories');
export const findMuhurat = (input: {
  category: string; date?: string; month?: number; year?: number; months?: number; targetDate?: string; toDate?: string;
  place?: string; lat?: number; lng?: number; tz?: string;
  nameRashi?: string | null; birth?: MuhuratBirthInput | null;
  nameRashi2?: string | null; birth2?: MuhuratBirthInput | null;
}) => post<MuhuratResult>('/api/muhurat/find', input);
export interface PanchangFestivalDay {
  date: string;
  weekday: string;
  weekdayHi?: string;
  tithi?: PanchangResponse['tithi'] | null;
  nakshatra?: PanchangResponse['nakshatra'] | null;
  masa?: PanchangResponse['masa'];
  sunrise?: string | null;
  sunset?: string | null;
  observances: PanchangObservance[];
  catalog?: {
    key: string;
    name: { en: string; hi: string };
    guidance?: { en: string; hi: string };
    why?: { en: string; hi: string };
    aarti?: { en: string; hi: string };
  };
}
export interface PanchangFestivalsResponse {
  from: string;
  days: number;
  location: string;
  items: PanchangFestivalDay[];
  errors?: { date: string; error: string }[];
}
export const getPanchangFestivals = (input: { place?: string; lat?: number; lng?: number; date?: string; tz?: string; days?: number }) =>
  post<PanchangFestivalsResponse>('/api/panchang/festivals', input);
export const searchPanchangFestivals = (input: { place?: string; lat?: number; lng?: number; date?: string; tz?: string; query: string; years?: number }) =>
  post<PanchangFestivalsResponse>('/api/panchang/festival-search', input);
// The whole festival/vrat catalog — bilingual names + aliases, NO dates and NO location.
// Fetched once and cached so the app can search it locally (instantly); the dates for the
// matches still come from the engine via searchPanchangFestivals.
export interface ObservanceCatalogItem {
  key: string;
  name: { en: string; hi: string };
  type: string;
  importance: string;
  aliases?: string[];
}
export const getObservanceCatalog = () => get<{ items: ObservanceCatalogItem[] }>('/api/panchang/observances');
export interface PanchangFestivalDetail {
  date: string;
  location: string;
  observance: PanchangObservance;
  title: string;
  panchang: {
    weekday?: string;
    tithi?: string;
    paksha?: string;
    nakshatra?: string;
    sunrise?: string;
    sunset?: string;
    moonrise?: string | null;
    moonset?: string | null;
  };
  recommendedMuhurat: { name: string; start: string; end: string; quality?: string; advice?: string; source?: string }[];
  avoidMuhurat: PanchangPeriod[];
  doList: string[];
  avoidList: string[];
  note?: string;
  ai?: { summary?: string; ritualSteps?: string[]; muhuratAdvice?: string; caution?: string } | null;
  aiError?: string | null;
  catalog?: {
    key: string;
    name: { en: string; hi: string };
    why?: { en: string; hi: string };
    samagri?: string[];
    steps?: string[];
    mantras?: { en: string; hi: string }[];
    aarti?: { en: string; hi: string };
    guidance?: { en: string; hi: string };
  };
}
export const getPanchangFestivalDetail = (input: {
  place?: string;
  lat?: number;
  lng?: number;
  date: string;
  tz?: string;
  key?: string;
  query?: string;
  lang?: 'en' | 'hi';
  ai?: boolean;
}) => post<PanchangFestivalDetail>('/api/panchang/festival-detail', input);

// ── AI (Gemini) — VedAstro data + user info se generate ──
export interface DailyPrediction {
  headline?: string;
  overall: string;
  detailedSummary?: string;
  panchangSummary?: string;
  transitSummary?: string;
  moods: { label: string; pct: number }[];
  areas: { title: string; text: string; score?: number; action?: string }[];
  timeWindows?: { label: string; time: string; quality?: 'good' | 'neutral' | 'caution'; advice?: string }[];
  remedies?: { title: string; body?: string; text?: string; timing?: string; tag?: string; mantra?: string; priority?: 'high' | 'medium' | 'low' }[];
  doList?: string[];
  avoidList?: string[];
  saralVivaran?: string;
  mantra?: { title?: string; text?: string; count?: string; bestTime?: string } | null;
  focus?: string[];
  aiQuestions?: string[];
  luckyColour: string;
  luckyNumber: string;
  luckyTime?: string;
  advice: string;
  confidence?: number;
  sourceNote?: string;
  generatedFor?: string;
  _fallback?: boolean; // true = AI could not generate; UI should show honest retry state, not fabricated text
  basis?: {
    moonSign?: string;
    ascendant?: string;
    dasha?: string;
    dashaPeriod?: DashaRow | null;
    yogas?: YogaItem[];
    activeDoshas?: { name: string; detail?: string; tag?: string }[];
    today?: {
      date?: string;
      weekday?: string;
      tithi?: string | { name?: string; paksha?: string };
      paksha?: string;
      nakshatra?: string | { name?: string; pada?: number };
      yoga?: string | { name?: string };
      karana?: string | { name?: string };
      transitMoon?: string;
      transitMoonNakshatra?: string;
      sun?: string | { sign?: string; nakshatra?: string };
      sunrise?: string;
      sunset?: string;
      inauspicious?: PanchangPeriod[];
      source?: string;
    };
    source?: string;
  };
  contextForChat?: Record<string, any>;
}
export const getDailyPrediction = (input: KundliInput & { name?: string }) =>
  post<DailyPrediction>('/api/ai/daily-prediction', { ...input, lang: apiLang });

// ── weekly / monthly / yearly rashifal ──
export type PredPeriod = 'week' | 'month' | 'year';
export interface PeriodArea { title: string; score: number; text: string; action?: string }
export interface PeriodHighlight { label: string; text: string }
export interface PeriodPhase { title: string; text: string }
export interface PeriodRemedy { title: string; body?: string; priority?: string }
export interface PeriodPrediction {
  period: PredPeriod;
  range: string;
  headline?: string;
  overall?: string;
  areas: PeriodArea[];
  phases?: PeriodPhase[];
  bestDays?: string[];
  majorDates?: string[];
  highlights?: PeriodHighlight[];
  remedies?: PeriodRemedy[];
  advice?: string;
  saralVivaran?: string;
  sourceNote?: string;
  aiAssisted?: boolean;
}
export const getPeriodPrediction = (input: KundliInput & { name?: string }, period: PredPeriod) =>
  post<PeriodPrediction>('/api/ai/period-prediction', { ...input, period, lang: apiLang });

export interface AiAstrologerResponse {
  question: string;
  answer: string;
  sections: { title: string; text: string }[];
  vedastroBasis: string[];
  remedies?: { title: string; body?: string; timing?: string; mantra?: string }[];
  followUpQuestions: string[];
  confidence?: number;
  sourceNote?: string;
  generatedFor?: string;
  basis?: DailyPrediction['basis'];
  contextForChat?: Record<string, any>;
}
export const askAiAstrologer = (input: KundliInput & { name?: string; question: string }) =>
  // 180s: this call computes the FULL kundli (chart + dasha timeline + live transits/Sade Sati + varga)
  // and the AI then writes a long dual-language (technical + simple) answer over a large context — so
  // give it very generous room to avoid any "request timed out" error on cold (uncached) questions.
  post<AiAstrologerResponse>('/api/ai/ask-astrologer', { ...input, lang: apiLang }, 'POST', 180000);

// ── User app-data sync (jaap counts, bookmarks, progress, samagri, prefs) ──
// Server source-of-truth; PUT partial patch bhejta hai aur server MERGE karke
// (jaap = MAX, baaki = last-write-wins) poora merged data wapas deta hai.
export interface UserDataDto {
  jaap: Record<string, { j: number; m: number; at: number }>;
  saved: Record<string, { on: boolean; at: number }>;
  progress: Record<string, { chapter: number; percent: number; at: number }>;
  samagri: Record<string, { items: number[]; at: number }>;
  prefs: Record<string, any>;
}
export const getUserData = () => get<{ data: UserDataDto }>('/api/me/data');
export const putUserData = (patch: Partial<UserDataDto>) =>
  post<{ data: UserDataDto }>('/api/me/data', patch, 'PUT');

// ── Astrologer chat history — DB me all-time; app 2 din local cache karta hai ──
export interface ChatTurnDto {
  id: string;
  question: string;
  response: AiAstrologerResponse | null;
  createdAt: string;
}
export const getChatHistory = (before?: string, limit = 30) =>
  get<{ turns: ChatTurnDto[]; hasMore: boolean }>(
    `/api/chat/history?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`
  );
export const clearChatHistory = () => del<{ ok: boolean; deleted: number }>('/api/chat/history');

export const getAiInsights = (input: KundliInput) =>
  post<{ insights: KundliInsight[] }>('/api/ai/insights', { ...input, lang: apiLang });
export const getChoghadiyaMessage = (input: KundliInput & { period: string; quality?: string }) =>
  post<{ message: string; period: string }>('/api/ai/choghadiya-message', { ...input, lang: apiLang });

// ── Muhurat finder: best Choghadiya window for an activity (AI, grounded on today's periods) ──
export interface MuhuratPeriodIn { name: string; time: string; nature: string }
export interface MuhuratPick { period: string; reason: string; aiAssisted?: boolean; source?: 'ai' | 'local' | string }
export const getMuhuratPick = (input: { activity: string; periods: MuhuratPeriodIn[] }) =>
  post<MuhuratPick>('/api/ai/muhurat', { ...input, lang: apiLang });

// ── Horoscope / Rashifal ──
export type HoroscopePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export interface HoroscopeArea { key: string; title: string; score: number; text: string }
export interface HoroscopeSign {
  key: string;
  name: string;
  hi?: string;
  displayName: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  lord: string;
  dates: string;
  score: number;
  headline: string;
  summary: string;
  plainSummary: string;
  areas: HoroscopeArea[];
  doList: string[];
  avoidList: string[];
  remedy: string;
  mantra?: { text: string; count: string };
  luckyColor: string;
  luckyNumber: number;
  confidence: number;
  basisBullets: string[];
}
export interface PublicHoroscopeResponse {
  period: HoroscopePeriod;
  date: string;
  location: string;
  signs: HoroscopeSign[];
  basis: any;
  sourceNote: string;
}
export const getHoroscope = (params?: { period?: HoroscopePeriod; date?: string; place?: string; lat?: number; lng?: number }) => {
  const qs = new URLSearchParams();
  if (params?.period) qs.set('period', params.period);
  if (params?.date) qs.set('date', params.date);
  if (params?.place) qs.set('place', params.place);
  if (params?.lat != null) qs.set('lat', String(params.lat));
  if (params?.lng != null) qs.set('lng', String(params.lng));
  const path = `/api/horoscope${qs.toString() ? `?${qs.toString()}` : ''}`;
  return get<PublicHoroscopeResponse>(withLang(path));
};
export const getPersonalizedHoroscope = (input: KundliInput & { name?: string }) =>
  post<{ type: 'personalized'; horoscope: DailyPrediction; sourceNote?: string }>('/api/horoscope/personalized', { ...input, lang: apiLang });

// AI-rich, period-scaled rashifal for ONE zodiac sign (12-rashi page period tabs).
export interface SignRashifalSection { heading: string; text: string; saral: string; }
export interface SignRashifal {
  sign: string; period: HoroscopePeriod; range: string; headline: string;
  sections: SignRashifalSection[];
  conclusion: { text: string; saral: string };
  aiAssisted?: boolean;
}
// yearly does a deep AI year-long analysis → can take a while; allow a long timeout.
export const getSignRashifal = (sign: string, period: HoroscopePeriod, transit?: { moonSign?: string; sunSign?: string }) =>
  post<SignRashifal>('/api/ai/sign-rashifal', { sign, period, lang: apiLang, moonTransit: transit?.moonSign, sunTransit: transit?.sunSign }, 'POST', 180000);

// ── dynamic content (admin-managed) ──
export interface ContentChapter { _id?: string; title: string; order: number; content?: string; audioUrl?: string }
export interface ContentBook {
  _id: string; title: string; author?: string; coverImage?: string; category?: string;
  description?: string; language?: string; chapters?: ContentChapter[]; isPremium?: boolean; order?: number;
}
export const getLibrary = () => get<{ books: ContentBook[] }>(withLang('/api/library'));
export const getBook = (id: string) => get<{ book: ContentBook }>(withLang(`/api/library/${id}`));

export type MediaCategory = 'mantra' | 'spiritual_music' | 'bhajan' | 'aarti';
export interface MediaItem {
  _id: string;
  title: string;
  subtitle?: string;
  artist?: string;
  category: MediaCategory;
  subCategory?: string;
  language?: string;
  sourceType: 'audio' | 'youtube' | 'external';
  audioUrl?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  thumbnailImage?: string;
  durationText?: string;
  sourceName?: string;
  sourceUrl?: string;
  licenseName?: string;
  licenseUrl?: string;
  attribution?: string;
  rightsNote?: string;
  tags?: string[];
  isPremium?: boolean;
  order?: number;
}
export const getMedia = (params?: { category?: MediaCategory; subCategory?: string; q?: string; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  if (params?.subCategory) qs.set('subCategory', params.subCategory);
  if (params?.q) qs.set('q', params.q);
  if (params?.limit) qs.set('limit', String(params.limit));
  const path = `/api/media${qs.toString() ? `?${qs.toString()}` : ''}`;
  return get<{ media: MediaItem[] }>(withLang(path));
};
// Ramayan Hindi audio katha (Audioboom) — full playlist
export const getRamayanAudio = () => getMedia({ subCategory: 'ramayan_audio', limit: 200 });

export interface Plan {
  _id: string; name: string; priceINR: number; durationDays: number;
  features: string[]; badge?: string; order?: number;
}
export const getPlans = () => get<{ plans: Plan[] }>(withLang('/api/plans'));

export interface AppNotification {
  _id: string; title: string; body: string; type: string; sentAt?: string; createdAt: string; read?: boolean;
}
export const getNotifications = () => get<{ notifications: AppNotification[]; unreadCount: number }>(withLang('/api/notifications'));
export const getUnreadCount = () => get<{ unreadCount: number }>('/api/notifications/unread-count');
export const markNotificationRead = (id: string) => post<{ notification: AppNotification }>(`/api/notifications/${id}/read`, {}, 'PATCH');
export const markAllNotificationsRead = () => post<{ ok: boolean; unreadCount: number }>('/api/notifications/read-all', {}, 'PATCH');
export const deleteNotification = (id: string) => del<{ ok: boolean; unreadCount: number }>(`/api/notifications/${id}`);
export const clearAllNotifications = () => del<{ ok: boolean; unreadCount: number }>('/api/notifications');
// register this device's Expo push token so the server can send push notifications
export const registerPushToken = (token: string) => post<{ ok: boolean }>('/api/notifications/register-token', { token, platform: 'android' });

export interface AppConfigData {
  onboardingSlides: { _id?: string; title: string; subtitle?: string; imageUrl?: string; order?: number; isActive?: boolean }[];
  homeBanners: { _id?: string; title: string; subtitle?: string; imageUrl?: string; link?: string; order?: number; isActive?: boolean }[];
  support: { email?: string; phone?: string };
  branding?: { appName?: string; tagline?: string; logoUrl?: string; primaryColor?: string; accentColor?: string };
  appVersion: string;
  featureFlags: Record<string, boolean>;
}
export const getAppConfig = () => get<{ config: AppConfigData }>(withLang('/api/app-config'));

export interface FaqEntry { _id: string; question: string; answer: string; category?: string }
export const getFaq = () => get<{ faq: FaqEntry[] }>(withLang('/api/faq'));

// page-wise content (admin se editable) — { home:{...}, dailyPrediction:{...}, ... }
export type ScreensMap = Record<string, Record<string, string>>;
export const getScreens = () => get<{ screens: ScreensMap }>(withLang('/api/screens'));

// ── Bhagavad Gita ──
export interface GitaVerse { verse: number; sanskrit: string; transliteration?: string; wordMeanings?: string; hindi?: string; english?: string }
export interface GitaChapterInfo {
  chapter: number; name: string; transliterated: string; meaning: string;
  translation?: string; summaryEn?: string; summaryHi?: string; versesCount: number;
}
export interface GitaChapterFull extends GitaChapterInfo { verses: GitaVerse[] }
export const getGitaChapters = () => get<{ chapters: GitaChapterInfo[] }>('/api/gita');
export const getGitaChapter = (n: number) => get<{ chapter: GitaChapterFull }>(`/api/gita/${n}`);

// ── Valmiki Ramayana (7 kanda → sarga → shlok) ──
export interface RamayanKanda { kanda: string; kandaOrder: number; sargas: number; shlokas: number }
export interface RamayanSargaInfo { kanda: string; sarga: number; shlokaCount: number; hindiReady?: boolean }
export interface RamayanShloka { shloka: string; sanskrit: string; transliteration?: string; wordMeanings?: string; english?: string; hindi?: string }
export interface RamayanSargaFull { kanda: string; kandaOrder: number; sarga: number; shlokaCount: number; shlokas: RamayanShloka[] }
export const getRamayanKandas = () => get<{ kandas: RamayanKanda[] }>('/api/ramayan');
export const getRamayanSargas = (kanda: number) => get<{ kanda: string; kandaOrder: number; sargas: RamayanSargaInfo[] }>(`/api/ramayan/${kanda}`);
export const getRamayanSarga = (kanda: number, sarga: number) => get<{ sarga: RamayanSargaFull }>(`/api/ramayan/${kanda}/${sarga}`);

// ── Ramcharitmanas (Tulsidas — Hindi/Awadhi) ──
export interface RcmKanda { kanda: string; kandaHindi: string; kandaOrder: number; verseCount: number }
export interface RcmVerse { number: string; type: string; text: string }
export interface RcmKandaFull extends RcmKanda { verses: RcmVerse[] }
export const getRcmKandas = () => get<{ kandas: RcmKanda[] }>('/api/ramcharitmanas');
export const getRcmKanda = (n: number) => get<{ kanda: RcmKandaFull }>(`/api/ramcharitmanas/${n}`);
// AI verse explanation — anuvad (Hindi arth) + katha (story-style) + seekh (lesson). Reusable across books.
export interface VerseExplanation { anuvad: string; katha: string; seekh: string; aiAssisted?: boolean }
export const getRcmExplanation = (kanda: number, number: string) =>
  post<VerseExplanation>('/api/ai/rcm-explain', { kanda, number });
export const getGitaExplanation = (chapter: number, verse: number) =>
  post<VerseExplanation>('/api/ai/gita-explain', { chapter, verse });
export const getRamayanExplanation = (kanda: number, sarga: number, shloka: string) =>
  post<VerseExplanation>('/api/ai/ramayan-explain', { kanda, sarga, shloka });

// ── Rigveda (Sanskrit + English; Hindi AI se) ──
export interface RigMandala { mandala: number; suktas: number; mantras: number }
export interface RigSuktaInfo { mandala: number; sukta: number; mantraCount: number }
export interface RigMantra { verse: number; sanskrit: string; transliteration?: string; english?: string; hindi?: string }
export interface RigSuktaFull { mandala: number; sukta: number; mantraCount: number; mantras: RigMantra[] }
export const getRigMandalas = () => get<{ mandalas: RigMandala[] }>('/api/rigveda');
export const getRigSuktas = (mandala: number) => get<{ mandala: number; suktas: RigSuktaInfo[] }>(`/api/rigveda/${mandala}`);
export const getRigSukta = (mandala: number, sukta: number) => get<{ sukta: RigSuktaFull }>(`/api/rigveda/${mandala}/${sukta}`);
export const getRigvedaExplanation = (mandala: number, sukta: number, verse: number) =>
  post<VerseExplanation>('/api/ai/rigveda-explain', { mandala, sukta, verse });

// ── Generic Veda (Yajurveda / Samaveda / Atharvaveda) ──
export interface VedaBook { book: number; bookName?: string; sections: number; verses: number }
/** Plain-language retelling of a chapter, written from its own shlokas — see the backend's
 *  generateShivaStories script. Absent on chapters (and texts) that don't have one. */
export interface VedaStory { hi?: string; en?: string }

export interface VedaSectionInfo { book: number; section: number; sectionName?: string; verseCount: number; storyTitle?: VedaStory }
export interface VedaVerse { verse: number; sanskrit: string; transliteration?: string; english?: string; hindi?: string }
export interface VedaSectionFull { veda: string; book: number; bookName?: string; section: number; sectionName?: string; verseCount: number; verses: VedaVerse[]; story?: VedaStory; storyTitle?: VedaStory }
export const getVedaBooks = (veda: string) => get<{ veda: string; books: VedaBook[] }>(`/api/veda/${veda}`);
export const getVedaSections = (veda: string, book: number) => get<{ veda: string; book: number; sections: VedaSectionInfo[] }>(`/api/veda/${veda}/${book}`);
export const getVedaSection = (veda: string, book: number, section: number) => get<{ section: VedaSectionFull }>(`/api/veda/${veda}/${book}/${section}`);
export const getVedaExplanation = (veda: string, book: number, section: number, verse: number, lang?: 'en' | 'hi') =>
  post<VerseExplanation>('/api/ai/veda-explain', { veda, book, section, verse, lang });

// ── Shubh Avsar — authentic Hindu occasion ritual guide (bilingual, AI, cached) ──
export interface OccasionMantra { sanskrit: string; transliteration: string; meaning: string; when: string; benefit: string; count: string }
export interface OccasionFaq { q: string; a: string }
export interface OccasionGuide {
  significance: string; muhurat: string;
  samagri: string[]; steps: string[]; mantras: OccasionMantra[];
  dos: string[]; donts: string[]; faqs: OccasionFaq[];
  regionalNote: string; disclaimer: string; aiAssisted?: boolean;
}
export const getOccasionGuide = (occasion: string, lang: 'en' | 'hi') =>
  post<OccasionGuide>('/api/ai/occasion-guide', { occasion, lang }, 'POST', 120000);
export const askOccasion = (occasion: string, question: string, lang: 'en' | 'hi') =>
  post<{ answer: string }>('/api/ai/occasion-ask', { occasion, question, lang }, 'POST', 120000);
// explain any ritual snippet in the simplest way, with an everyday example (cached by text)
export const explainSimple = (text: string, context: string, lang: 'en' | 'hi') =>
  post<{ explanation: string }>('/api/ai/explain-simple', { text, context, lang }, 'POST', 120000);

// ── Daily Spiritual Boost (roz naya shlok + AI explanation) ──
export interface DailyShloka {
  id: string; book: string; hindi: string; cover: string; refLabel: string;
  sanskrit: string; transliteration?: string; english?: string;
  nav?: { screen: string; params?: any };
}
export interface DailyShlokaExplain { anuvad: string; vyakhya: string; jeevanUpyog: string; seekh: string; aiAssisted?: boolean }
export const getDailyShloka = () => get<{ shloka: DailyShloka }>('/api/daily-shloka');
export const getDailyShlokaExplain = (id: string) =>
  post<DailyShlokaExplain>('/api/ai/daily-shloka-explain', { id });

// ── analytics ──
export interface AnalyticsEventIn { name: string; screen?: string; props?: any }
export const trackAnalytics = (body: {
  deviceId: string; sessionId: string; userId?: string | null;
  platform?: string; osVersion?: string | number; appVersion?: string;
  deviceBrand?: string; deviceModel?: string;
  // real device coords (permission granted) — backend reverse-geocodes these to the
  // true city; without them it falls back to (inaccurate) IP geolocation
  gps?: { lat: number; lng: number; accuracy?: number };
  events: AnalyticsEventIn[];
}) => post<{ ok: boolean; tracked: number }>('/api/analytics/track', body);

// ── Kundli Milan (Gun Milan / Ashtakoot) ──
export interface MatchPerson {
  name?: string; moonSign?: string | null; ascendant?: string | null;
  nakshatra?: number | null; nakshatraName?: string | null; pada?: number | null;
  rashi?: number | null; rashiName?: string | null; mangal?: boolean;
}
export interface MatchKoota {
  key: string; label: string; labelHi?: string; got: number; max: number;
  boy?: string; girl?: string; note?: string; noteHi?: string;
}
export interface MatchMilan {
  total: number; max: number; percent: number;
  verdict: 'excellent' | 'good' | 'average' | 'poor';
  kootas: MatchKoota[];
}
export interface MatchMangal {
  boy: boolean; girl: boolean; compatible: boolean;
  severity: 'none' | 'cancelled' | 'present'; note?: string; noteHi?: string;
}
export interface MatchExplanation {
  verdict?: string; summary?: string; strengths?: string[]; cautions?: string[]; advice?: string; saralVivaran?: string; aiAssisted?: boolean;
}
export interface MatchResponse {
  people: { boy: MatchPerson; girl: MatchPerson };
  milan: MatchMilan;
  mangal: MatchMangal;
  explanation?: MatchExplanation | null;
}
export const getKundliMatch = (boy: KundliInput & { name?: string }, girl: KundliInput & { name?: string }) =>
  post<MatchResponse>('/api/match', { boy, girl, lang: apiLang });

// ── Gochar (Transits) ──
export interface TransitPlanet {
  planet: string; sign: string; nakshatra?: string | null; isRetrograde?: string;
  houseFromMoon?: number | null; houseFromLagna?: number | null;
}
export interface SadeSati { active: boolean; dhaiya: boolean; phase?: string | null; phaseHi?: string | null; }
export interface GocharExplanation {
  summary?: string; highlights?: { planet: string; text: string }[]; advice?: string; saralVivaran?: string; aiAssisted?: boolean;
}
export interface GocharResponse {
  date: string; ayanamsa: string; natalMoonSign?: string | null; natalAsc?: string | null;
  sadeSati: SadeSati; transits: TransitPlanet[]; explanation?: GocharExplanation | null;
}
// Gochar = current transits across 9 planets + AI note → heavier; longer timeout.
export const getGochar = (input: KundliInput) => post<GocharResponse>('/api/gochar', { ...input, lang: apiLang }, 'POST', 30000);

// ── Remedies (Upaay) ──
export interface LifeGem {
  planet: string; gemstone: string; gemstoneHi?: string; metal?: string; metalHi?: string;
  finger?: string; fingerHi?: string; day?: string; dayHi?: string; mantra?: string; note?: string; noteHi?: string;
}
export interface DoshaRemedy {
  key: string; name: string; nameHi?: string; present: boolean;
  remedies: { title: string; titleHi?: string }[];
  mantra?: string; mantraHi?: string; deity?: string; deityHi?: string;
}
export interface PlanetMantra { planet: string; planetHi?: string; mantra: string; count?: number; forWhat?: string; forWhatHi?: string; }
export interface RemediesExplanation { summary?: string; gemWhy?: string; scriptureNote?: string; advice?: string; saralVivaran?: string; aiAssisted?: boolean; }
export interface RemediesResponse {
  ascendant?: string | null; moonSign?: string | null; sadeSati: SadeSati;
  remedies: { lifeGem: LifeGem | null; doshaRemedies: DoshaRemedy[]; planetMantras: PlanetMantra[] };
  explanation?: RemediesExplanation | null;
}
export const getRemedies = (input: KundliInput) => post<RemediesResponse>('/api/remedies', { ...input, lang: apiLang });

// ── Numerology (100% local deterministic math on the backend; interpret uses AI to explain only) ──
export interface NumBi { en: string; hi: string }
export interface NumBiList { en: string[]; hi: string[] }
export interface NumReduced { final: number; compound: number; isMaster: boolean; isKarmic: boolean }
export interface NumberMeaning { keywords: NumBiList; nature: NumBi; lifePath: NumBi; career: NumBiList; strength: NumBi; caution: NumBi }
export interface NumWithPlanet extends NumReduced { planet: NumBi | null; remedy?: NumBi | null; meaning?: NumberMeaning | null }
export interface LoShuArrow { key: string; en: string; hi: string }
export interface NumRelation { key: 'friend' | 'enemy' | 'neutral'; en: string; hi: string }
export interface NumerologyProfile {
  name: string; dob: string; system: string;
  mulank: NumWithPlanet; bhagyank: NumWithPlanet;
  namank: NumWithPlanet & { pythagorean: number };
  soulUrge: NumReduced; personality: NumReduced; personalYear: NumReduced & { meaning?: NumBi | null };
  loShu: { counts: Record<string, number>; positions: Record<string, [number, number]>; missing: number[]; presentArrows: LoShuArrow[]; missingArrows: LoShuArrow[] };
  coreCompatibility: { driverConductor: NumRelation; driverName: NumRelation; conductorName: NumRelation };
  lucky: { numbers: number[]; colors: NumBiList; days: NumBiList; gem: NumBi } | null;
  nameCorrection: { currentNamank: number; relationToDriver: NumRelation; relationToDestiny: NumRelation; isHarmonious: boolean; suggestedNameNumbers: number[]; note: NumBi } | null;
  disclaimer: NumBi;
}
export interface NumerologyReading {
  mulank?: { title?: string; meaning?: string; traits?: string[]; health?: string } | null;
  bhagyank?: { title?: string; meaning?: string; career?: string[] } | null;
  namank?: { title?: string; meaning?: string } | null;
  personalYear?: { title?: string; meaning?: string } | null;
  loShu?: { strengths?: string; gaps?: string; remedies?: string[] } | null;
  summary?: string; saralVivaran?: string; aiAssisted?: boolean;
}
export interface NumberCheck { userMulank: number; input: string; numberTotal: number; planet: NumBi | null; relation: NumRelation }

export const getNumerologyProfile = (input: { name?: string; dob: string }) =>
  post<{ profile: NumerologyProfile }>('/api/numerology/profile', input);
export const getNumerologyReading = (input: { name?: string; dob: string }) =>
  post<{ profile: NumerologyProfile; reading: NumerologyReading }>('/api/numerology/interpret', { ...input, lang: apiLang }, 'POST', 30000);
export const checkNumerologyNumber = (input: { number: string; mulank?: number; dob?: string }) =>
  post<NumberCheck>('/api/numerology/check-number', input);

// ── Traditional Vedic Reading (classical phala-kathan) ──
export interface BiText { en: string; hi: string }
export interface ReadingJanma {
  gana: BiText; yoni: BiText; nadi: BiText; varna: BiText;
  gandmool: { present: boolean; nakshatra?: string | null; note: BiText };
  lagnaSandhi: boolean;
}
export interface ReadingPrediction {
  key: string; category: string; title: BiText; text: BiText;
  source?: string; strength?: 'good' | 'caution' | 'neutral';
}
export interface BirthPanchang {
  tithi: { num: number; name: string; hi?: string; paksha: string; pakshaHi?: string };
  nakshatra: { num: number; name: string; hi?: string; pada: number };
  yoga: { num: number; name: string; hi?: string };
  karana: { name: string; hi?: string };
  masa?: { amanta: BiText; purnimanta: BiText } | null;
  samvat?: { vikram: number; shaka: number };
  samvatsara?: string;
}
export interface Naamakshar { syllable: string; nakshatra: string; pada: number; note: BiText }
export interface VedicReadingResponse {
  ascendant?: string | null; moonSign?: string | null; moonNakshatra?: number; moonPada?: number;
  janma: ReadingJanma;
  birthPanchang?: BirthPanchang | null;
  naamakshar?: Naamakshar | null;
  predictions: ReadingPrediction[];
  explanation?: { summary?: string; advice?: string; saralVivaran?: string; aiAssisted?: boolean } | null;
  source?: string;
}
export const getVedicReading = (input: KundliInput) => post<VedicReadingResponse>('/api/vedic-reading', { ...input, lang: apiLang });

// ── Vastu Shastra (rule-engine + grounded AI guide) ──
export type VastuDirectionKey = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'CENTER';
export type VastuRoomType =
  | 'mainEntrance' | 'kitchen' | 'masterBedroom' | 'bedroom' | 'pujaRoom' | 'toilet'
  | 'livingRoom' | 'studyRoom' | 'staircase' | 'overheadWaterTank' | 'undergroundWater' | 'cashLocker';
export interface VastuDirection { key: VastuDirectionKey; en: string; hi: string; element?: BiText | null }
export interface VastuSource { id: string; title: string; type: string; note: string; url?: string }
export interface VastuFinding {
  id: string;
  roomType: VastuRoomType;
  room: BiText;
  direction: VastuDirection;
  status: 'good' | 'ok' | 'problem' | 'neutral' | 'unknown';
  severity: 'positive' | 'low' | 'medium' | 'high';
  weight: number;
  score: number;
  title: BiText;
  finding: BiText;
  why: BiText;
  recommendation: BiText;
  remedy: BiText;
  sourceIds: string[];
  confidence: string;
}
export interface VastuPlanRoom {
  id: string; type: string; direction: VastuDirection; label: BiText;
  x: number; y: number; w: number; h: number; color: string; note?: string;
}
export interface VastuPlan {
  id: string;
  title: BiText;
  subtitle: BiText;
  viewBox: string;
  northAtTop: boolean;
  plot: { width: number; length: number; unit: string; area: number };
  facing: VastuDirection;
  entrance: { direction: VastuDirection; label: BiText; x1: number; y1: number; x2: number; y2: number };
  rooms: VastuPlanRoom[];
  notes: { title: BiText; text: BiText }[];
  correctionsForExisting: {
    roomType: VastuRoomType; room: BiText; current: VastuDirection; suggested: VastuDirection[]; text: BiText; nonDemolition: BiText;
  }[];
}
export interface VastuAnalysisResponse {
  generatedAt: string;
  version: string;
  input: { propertyType: string; facing: VastuDirectionKey; plot: { width: number; length: number; unit: string; area: number }; requirements: any };
  roomInputs: Record<string, { direction: VastuDirectionKey; size?: string | null; note?: string }>;
  summary: { score: number | null; band: string; title: BiText; text: BiText; auditedRooms: number; note: BiText };
  findings: VastuFinding[];
  priority: VastuFinding[];
  positives: VastuFinding[];
  suggestedPlan: VastuPlan;
  learn: { id: string; title: BiText; body: BiText }[];
  directions: VastuDirection[];
  sourcesUsed: VastuSource[];
  safety: { title: BiText; text: BiText; sourceId: string };
}
export interface VastuAskResponse {
  analysis: VastuAnalysisResponse;
  answer: string;
  sections: { title?: string; text?: string }[];
  remedies: string[];
  followUpQuestions: string[];
  confidence: number;
  sourceNote: string;
  aiAssisted: boolean;
}
export interface VastuAnalyzeInput {
  propertyType?: 'home' | 'flat' | 'shop' | 'office' | string;
  facing?: VastuDirectionKey | string;
  plot?: { width?: number | string; length?: number | string; unit?: string };
  rooms?: Partial<Record<VastuRoomType, VastuDirectionKey | string | { direction?: VastuDirectionKey | string; size?: string; note?: string }>>;
  requirements?: { bedrooms?: number; floors?: number; includePujaRoom?: boolean; includeStudy?: boolean };
  lang?: 'en' | 'hi';
}
export const analyzeVastu = (input: VastuAnalyzeInput) =>
  post<VastuAnalysisResponse>('/api/vastu/analyze', { ...input, lang: apiLang });
export const askVastu = (input: VastuAnalyzeInput & { question: string; analysis?: VastuAnalysisResponse }) =>
  post<VastuAskResponse>('/api/vastu/ask', { ...input, lang: apiLang }, 'POST', 60000);

// ── Life Timeline (Vimshottari Dasha — age-wise) ──
export interface DashaPeriodPhala { effect?: string; good?: string; caution?: string; remedy?: string }
export interface Antardasha { lord: string; fromAge: number; toAge: number; fromYear: number; toYear: number; current?: boolean }
export interface DashaPeriod {
  lord: string; years: number; fromAge: number; toAge: number; fromYear: number; toYear: number;
  partial?: boolean; current?: boolean; past?: boolean;
  house?: number | null; sign?: string | null; dignity?: string; nature?: 'favorable' | 'mixed' | 'challenging';
  phala?: DashaPeriodPhala | null;
  antardashas?: Antardasha[];
}
export interface LifeTimelineResponse {
  ascendant?: string | null; moonSign?: string | null;
  balance: { lord: string; totalYears: number; bhuktaYears: number; bhogyaYears: number };
  currentAge: number;
  periods: DashaPeriod[];
  saralVivaran?: string;
  source?: string;
}
export const getLifeTimeline = (input: KundliInput) => post<LifeTimelineResponse>('/api/life-timeline', { ...input, lang: apiLang });

// ── Name engine (industry-standard) — shared by explorer + chart Naamkaran ──
export interface NameNumerology {
  number: number; luckyNumber: number;
  planet: string; planetHi: string;
  color: string; colorHi: string;
  stone: string; stoneHi: string;
  metal: string; metalHi: string;
  day: string; dayHi: string;
  supporting?: number[];
}
export interface NameItem {
  name: string;
  nameHi?: string | null;
  meaning: string;
  meaningHi?: string | null;
  origin?: string | null;
  gender?: string | null;
  pronunciation?: string | null;
  themes?: string[];
  letterCount?: number;
  numerology?: NameNumerology | null;
}
export interface NameCandidate {
  name: string; nameHi?: string | null; meaning?: string; meaningHi?: string | null; origin?: string | null;
  suitable: boolean; reason: string; reasonHi?: string | null;
  alternatives?: string[]; alternativesIfNo?: string[];
  numerology?: NameNumerology | null;
}
// backward-compat alias
export type SuggestedName = NameItem;

export interface NameFilters {
  gender?: 'boy' | 'girl' | 'any' | string;
  startWith?: string | string[];
  letter?: string;
  words?: string;
  theme?: string;
  origin?: string;
  lengthPref?: 'short' | 'medium' | 'long' | '';
  count?: number;
}
export interface NameEngineResponse {
  mode?: string; startWith?: string | string[] | null; words?: string | null; gender?: string;
  names: NameItem[]; candidate?: NameCandidate | null; count?: number; aiAssisted?: boolean;
  source?: 'ai' | 'mixed' | 'local' | string; // where names came from (testing/transparency)
}
export const getBabyNames = (input: NameFilters) =>
  post<NameEngineResponse>('/api/baby-names', { ...input, lang: apiLang });

// ── Name Helper (Q&A grounded on the names a parent is considering) ──
export interface NameAskResponse {
  answer: string;
  suggestions?: NameItem[];
  aiAssisted?: boolean;
  source?: 'ai' | 'local' | string;
}
export const askNameQuestion = (input: { question: string; names?: (string | NameItem)[]; gender?: string }) =>
  post<NameAskResponse>('/api/name-ask', { ...input, lang: apiLang });

export interface NameSuggestionsResponse extends NameEngineResponse {
  naamakshar?: Naamakshar | null;
  moonSign?: string | null;
  syllable: string;
  nakshatra?: string;
  pada?: number;
  rashi?: string | null;
  rashiNote?: string;
  scope?: 'pada' | 'rashi' | string;
}
export const getNameSuggestions = (
  input: KundliInput & { gender?: string; candidate?: string; scope?: 'pada' | 'rashi'; origin?: string; theme?: string; lengthPref?: string },
) => post<NameSuggestionsResponse>('/api/name-suggestions', { ...input, lang: apiLang });

// backward-compat aliases for the old explorer shape
export type BabyName = NameItem;
export type BabyNamesResponse = NameEngineResponse;

// ── Year-by-year transit forecast (gochar) ──
export interface TransitPlanetYear { sign?: string | null; signHi?: string | null; houseFromMoon?: number | null; event?: string | null; eventHi?: string | null; kind?: 'good' | 'caution' | 'neutral' }
export interface TransitYear { year: number; current?: boolean; shani: TransitPlanetYear; guru: TransitPlanetYear; note?: string | null }
export interface TransitForecastResponse {
  moonSign?: string | null; fromYear: number; toYear: number; currentYear: number;
  years: TransitYear[]; summary?: string | null; saralVivaran?: string; source?: string;
}
// Saal-dar-saal gochar = 9 years × 2 planets + AI summary/notes → heavy; longer timeout.
export const getTransitForecast = (input: KundliInput & { fromYear?: number; toYear?: number }) =>
  post<TransitForecastResponse>('/api/transit-forecast', { ...input, lang: apiLang }, 'POST', 60000);

// ── Brihat Kundli (advanced report aggregator) ──
export interface BrihatSection {
  key: string;
  title: BiText;
  status: 'ready' | 'partial' | 'unavailable' | string;
  count?: number;
  source?: string | null;
}
export interface BrihatDomain {
  key: string;
  title: BiText;
  charts: string[];
  focus: string[];
  summary?: BiText | null;
  supportingPredictions?: ReadingPrediction[];
  timing?: { currentDashaLord?: string | null; currentDashaNature?: string | null; favorableYears?: number[] };
  confidence?: 'calculated' | 'needs-deeper-rules' | string;
}
export interface BrihatAvakhada {
  varna: BiText; vashya: BiText; yoni: BiText; gana: BiText; nadi: BiText;
  tatva: BiText; paya?: BiText | null;
  nakshatra: { name: string; pada: number | null; lord: BiText };
  rashi: { name: string; lord: BiText };
  lagna?: { name: string; lord: BiText } | null;
  dashaBalance?: string | null;
}
export interface BrihatAshtakavarga {
  bhinna: Record<string, { bindus: number[]; total: number }>;
  sarva: number[];
  sarvaTotal: number;
  signs: string[];
}
export interface NumberCard {
  number: number;
  planet: string; planetHi: string;
  color: string; colorHi: string;
  stone: string; stoneHi: string;
  metal: string; metalHi: string;
  day: string; dayHi: string;
  supporting: number[];
}
export interface BrihatNumerology { psychic: NumberCard; destiny: NumberCard; name?: NumberCard }
export interface CharaKaraka { key: string; en: string; hi: string; sig: string; planet: string; planetHi: string; sign: string; degree: number }
export interface BrihatJaimini {
  charaKarakas: CharaKaraka[];
  arudhaLagna?: { sign: string; signIdx: number; lord: string; lordHi: string } | null;
  scheme: string;
}
export interface VarshphalYear {
  year: number; age: number; munthaSign: string; munthaSignIdx: number;
  munthaLord: string; munthaLordHi: string; houseFromLagna: number;
  theme: BiText; kind: 'good' | 'neutral';
}
export interface BrihatVarshphal { years: VarshphalYear[]; note?: string }
export interface KpLord {
  planet: string; sign: string; nakshatra: string;
  signLord: string; signLordHi: string;
  starLord: string; starLordHi: string;
  subLord: string; subLordHi: string;
}
export interface BrihatKp { ascendant?: KpLord | null; planets: KpLord[] }
export interface ShadbalaPlanet {
  sthana: number; dig: number; kala: number; cheshta: number; naisargika: number; drik: number;
  total: number; rupas: number; required: number; strong: boolean; rank: number;
}
export interface BrihatShadbala { planets: Record<string, ShadbalaPlanet>; note?: string }
export interface LalKitabHouse { house: number; sign: string; planets: { en: string; hi: string }[] }
export interface BrihatLalKitab { lagna: string | null; houses: LalKitabHouse[] }
export interface BrihatKundliResponse {
  generatedAt: string;
  reportType: string;
  title: BiText;
  avakhada?: BrihatAvakhada | null;
  ashtakavarga?: BrihatAshtakavarga | null;
  numerology?: BrihatNumerology | null;
  jaimini?: BrihatJaimini | null;
  varshphal?: BrihatVarshphal | null;
  kp?: BrihatKp | null;
  shadbala?: BrihatShadbala | null;
  lalKitab?: BrihatLalKitab | null;
  summary: {
    ascendant?: string | null;
    moonSign?: string | null;
    sunSign?: string | null;
    moonNakshatra?: string | number | null;
    ayanamsa?: string | null;
    location?: any;
    time?: string | null;
    activeDasha?: any;
    yogasCount?: number;
    doshas?: ApiDosha[];
  };
  accuracy: { calculation: string; engine: string; requires: string[]; note: string };
  sections: BrihatSection[];
  domains: BrihatDomain[];
  data: {
    kundli?: KundliResponse | null;
    varga?: VargaResponse | null;
    dasha?: DashaResponse | null;
    yoga?: YogaResponse | null;
    reading?: VedicReadingResponse | null;
    timeline?: LifeTimelineResponse | null;
    remedies?: RemediesResponse | null;
    gochar?: GocharResponse | null;
    transitForecast?: TransitForecastResponse | null;
  };
  roadmap: { key: string; title: string; status: string }[];
  errors?: Record<string, string | null>;
}
// Brihat = heaviest aggregator (kundli + 8 sub-reports). Longer timeout so it never
// false-times-out while the backend assembles the full report.
export const getBrihatKundli = (input: KundliInput) => post<BrihatKundliResponse>('/api/brihat-kundli', { ...input, lang: apiLang }, 'POST', 60000);

// ── endpoints ──
export const getKundli = (input: KundliInput) => post<KundliResponse>('/api/kundli', input);
export const getVargaCharts = (input: KundliInput & { charts?: string[] }) => post<VargaResponse>('/api/varga', input);
export const getDasha = (input: KundliInput) => post<DashaResponse>('/api/dasha', input);
export const getYoga = (input: KundliInput) => post<YogaResponse>('/api/yoga', input);
export const getSunTimes = (input: { place?: string; lat?: number; lng?: number; date?: string; tz?: string }) =>
  post<SunTimesResponse>('/api/sunrise', input).then((r) => {
    // Kabhi NaN times UI tak mat jaane do — invalid ho to throw, callers ke .catch
    // fallbacks (demo constants) sambhal lete hai. (Server-side VedAstro hiccup me
    // {h:NaN} 200 ke saath aa sakta tha → screen par "NaN:NaN".)
    const ok = (t: { h: number; m: number } | undefined) => !!t && Number.isFinite(t.h) && Number.isFinite(t.m);
    if (!ok(r.sunrise) || !ok(r.sunset)) throw new Error('invalid sun times');
    return r;
  });
export const getHealth = () => get<{ status: string; db: string }>('/api/health');
