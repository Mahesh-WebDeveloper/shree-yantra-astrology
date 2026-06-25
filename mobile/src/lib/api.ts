/**
 * Backend API client — RN app sirf isi layer se backend se baat karta hai.
 *
 * ⚠️ IMPORTANT (testing on phone): Expo Go phone par `localhost` PC ko reach NAHI karta.
 *    PC ka LAN IP daalo (yahan). Phone + PC same WiFi par hone chahiye.
 *    Agar connect na ho to Windows Firewall me Node/port 4000 (inbound) allow karo.
 *    Emulator: Android emulator ke liye 10.0.2.2 use karo.
 */
// Production: set EXPO_PUBLIC_API_URL (https) in the build env / app.config / EAS secrets.
// Dev fallback: LAN IP for Expo Go on a phone (localhost won't reach the PC from the device).
const DEV_API = 'http://192.168.0.234:4000';
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? DEV_API : '')).replace(/\/$/, '');

// every network call gets a hard timeout so a hung backend never spins a loader forever
const REQUEST_TIMEOUT_MS = 15000;
async function fetchT(url: string, options: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('Request timed out — please check your connection and try again.');
    throw e;
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
  sanskrit?: string;
  area: string;
  level: 'core' | 'advanced' | 'expert';
  why: string;
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
async function parseError(res: Response): Promise<string> {
  const txt = await res.text().catch(() => '');
  try { const j = JSON.parse(txt); if (j && j.error) return j.error; } catch {}
  return `Backend ${res.status}: ${txt.slice(0, 120)}`;
}

async function post<T>(path: string, body: any, method: 'POST' | 'PUT' | 'PATCH' = 'POST'): Promise<T> {
  const res = await fetchT(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetchT(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetchT(`${API_BASE}${path}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
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

// ── mobile + OTP (sabse simple login/register) ──
export interface OtpRequestResponse { sent: boolean; phone: string; devCode?: string }
export interface VerifyOtpResponse { token: string; user: AuthUser; isNew: boolean; profileComplete: boolean }
export const requestOtp = (phone: string) => post<OtpRequestResponse>('/api/auth/request-otp', { phone });
export const verifyOtp = (input: { phone: string; code: string; name?: string }) =>
  post<VerifyOtpResponse>('/api/auth/verify-otp', input);
// account linking — logged-in (OTP) user apne account par email+password add kare
export const setPasswordApi = (input: { email?: string; password: string }) =>
  post<{ user: AuthUser }>('/api/auth/set-password', input);
export const updateProfileApi = (input: { name?: string; interests?: string[]; profile?: AuthUser['profile'] }) =>
  post<{ user: AuthUser }>('/api/profile', input, 'PUT');

// ── birth-place search/resolve ──
export interface LocationSuggestion {
  id: string;
  provider: 'google' | 'nominatim' | 'manual' | string;
  placeId?: string;
  mainText: string;
  secondaryText?: string;
  description: string;
  lat?: number | null;
  lng?: number | null;
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
  const res = await fetch(`${API_BASE}/api/profile/avatar`, {
    method: 'POST',
    headers: { ...authHeaders() }, // Content-Type NAHI — fetch khud multipart boundary set karega
    body: form,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
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
  tithi: { num: number; name: string; hi?: string; paksha: string; pakshaHi?: string; endsAt?: AngaEnd };
  nakshatra: { num: number; name: string; hi?: string; pada: number; endsAt?: AngaEnd };
  yoga: { num: number; name: string; hi?: string; endsAt?: AngaEnd };
  karana: { name: string; hi?: string; isBhadra?: boolean; endsAt?: AngaEnd };
  masa?: { amanta: { en: string; hi: string }; purnimanta: { en: string; hi: string } } | null;
  ritu?: { en: string; hi: string } | null;
  ayana?: { en: string; hi: string } | null;
  samvat?: { vikram: number; shaka: number } | null;
  samvatsara?: string;
  bhadra?: boolean;
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
export const getPanchang = (input: { place?: string; lat?: number; lng?: number; date?: string; tz?: string }) =>
  post<PanchangResponse>('/api/panchang', input);
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
  post<AiAstrologerResponse>('/api/ai/ask-astrologer', { ...input, lang: apiLang });
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

// ── dynamic content (admin-managed) ──
export interface ContentChapter { _id?: string; title: string; order: number; content?: string; audioUrl?: string }
export interface ContentBook {
  _id: string; title: string; author?: string; coverImage?: string; category?: string;
  description?: string; language?: string; chapters?: ContentChapter[]; isPremium?: boolean; order?: number;
}
export const getLibrary = () => get<{ books: ContentBook[] }>(withLang('/api/library'));
export const getBook = (id: string) => get<{ book: ContentBook }>(withLang(`/api/library/${id}`));

export type MediaCategory = 'mantra' | 'spiritual_music' | 'bhajan';
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
export const getNotifications = () => get<{ notifications: AppNotification[] }>(withLang('/api/notifications'));
export const markNotificationRead = (id: string) => post<{ notification: AppNotification }>(`/api/notifications/${id}/read`, {}, 'PATCH');

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
export interface VedaSectionInfo { book: number; section: number; sectionName?: string; verseCount: number }
export interface VedaVerse { verse: number; sanskrit: string; transliteration?: string; english?: string; hindi?: string }
export interface VedaSectionFull { veda: string; book: number; bookName?: string; section: number; sectionName?: string; verseCount: number; verses: VedaVerse[] }
export const getVedaBooks = (veda: string) => get<{ veda: string; books: VedaBook[] }>(`/api/veda/${veda}`);
export const getVedaSections = (veda: string, book: number) => get<{ veda: string; book: number; sections: VedaSectionInfo[] }>(`/api/veda/${veda}/${book}`);
export const getVedaSection = (veda: string, book: number, section: number) => get<{ section: VedaSectionFull }>(`/api/veda/${veda}/${book}/${section}`);
export const getVedaExplanation = (veda: string, book: number, section: number, verse: number) =>
  post<VerseExplanation>('/api/ai/veda-explain', { veda, book, section, verse });

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
  platform?: string; osVersion?: string | number; appVersion?: string; events: AnalyticsEventIn[];
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
  verdict?: string; summary?: string; strengths?: string[]; cautions?: string[]; advice?: string; aiAssisted?: boolean;
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
  summary?: string; highlights?: { planet: string; text: string }[]; advice?: string; aiAssisted?: boolean;
}
export interface GocharResponse {
  date: string; ayanamsa: string; natalMoonSign?: string | null; natalAsc?: string | null;
  sadeSati: SadeSati; transits: TransitPlanet[]; explanation?: GocharExplanation | null;
}
export const getGochar = (input: KundliInput) => post<GocharResponse>('/api/gochar', { ...input, lang: apiLang });

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
export interface RemediesExplanation { summary?: string; gemWhy?: string; scriptureNote?: string; advice?: string; aiAssisted?: boolean; }
export interface RemediesResponse {
  ascendant?: string | null; moonSign?: string | null; sadeSati: SadeSati;
  remedies: { lifeGem: LifeGem | null; doshaRemedies: DoshaRemedy[]; planetMantras: PlanetMantra[] };
  explanation?: RemediesExplanation | null;
}
export const getRemedies = (input: KundliInput) => post<RemediesResponse>('/api/remedies', { ...input, lang: apiLang });

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
  explanation?: { summary?: string; advice?: string; aiAssisted?: boolean } | null;
  source?: string;
}
export const getVedicReading = (input: KundliInput) => post<VedicReadingResponse>('/api/vedic-reading', { ...input, lang: apiLang });

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
  origin?: string | null;
  gender?: string | null;
  pronunciation?: string | null;
  themes?: string[];
  letterCount?: number;
  numerology?: NameNumerology | null;
}
export interface NameCandidate {
  name: string; nameHi?: string | null; meaning?: string; origin?: string | null;
  suitable: boolean; reason: string;
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
  years: TransitYear[]; summary?: string | null; source?: string;
}
export const getTransitForecast = (input: KundliInput & { fromYear?: number; toYear?: number }) =>
  post<TransitForecastResponse>('/api/transit-forecast', { ...input, lang: apiLang });

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
export interface BrihatKundliResponse {
  generatedAt: string;
  reportType: string;
  title: BiText;
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
export const getBrihatKundli = (input: KundliInput) => post<BrihatKundliResponse>('/api/brihat-kundli', { ...input, lang: apiLang });

// ── endpoints ──
export const getKundli = (input: KundliInput) => post<KundliResponse>('/api/kundli', input);
export const getVargaCharts = (input: KundliInput & { charts?: string[] }) => post<VargaResponse>('/api/varga', input);
export const getDasha = (input: KundliInput) => post<DashaResponse>('/api/dasha', input);
export const getYoga = (input: KundliInput) => post<YogaResponse>('/api/yoga', input);
export const getSunTimes = (input: { place?: string; lat?: number; lng?: number; date?: string; tz?: string }) =>
  post<SunTimesResponse>('/api/sunrise', input);
export const getHealth = () => get<{ status: string; db: string }>('/api/health');
