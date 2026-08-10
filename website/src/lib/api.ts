import { normalizeActivePanchang } from '@/lib/panchangNormalize'
import { correlationHeaders } from '@/lib/correlation'

export type ApiLang = 'en' | 'hi'

const REQUEST_TIMEOUT_MS = 30_000
const AI_TIMEOUT_MS = 120_000
const AI_PATH_RE =
  /\/api\/(ai\/|vedic-reading|brihat-kundli|match|remedies|numerology\/interpret|muhurat\/find|vastu\/ask|name-suggestions|baby-names)/

function timeoutForPath(path: string, explicit?: number): number {
  const clean = path.split('?')[0]
  if (explicit != null) return explicit
  return AI_PATH_RE.test(clean) ? AI_TIMEOUT_MS : REQUEST_TIMEOUT_MS
}

/** Production HTTPS hosts proxy /api via Netlify — use same-origin, not raw HTTP IP. */
export function resolveApiBase(): string {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    // Any HTTPS marketing host must use same-origin /api (Netlify proxy).
    if (protocol === 'https:' && hostname !== '168.144.185.66') {
      return ''
    }
  }
  // Production client bundles must not call the raw HTTP VPS (mixed content).
  if (import.meta.env.PROD) {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined
    if (envUrl && /^https:\/\//i.test(envUrl)) {
      return envUrl.replace(/\/$/, '')
    }
    return ''
  }
  const envUrl = import.meta.env.VITE_API_URL as string | undefined
  if (envUrl) return envUrl.replace(/\/$/, '')
  return 'http://168.144.185.66:4000'
}

/** Resolved at request time so Netlify cannot bake http://… into the bundle at build. */
export function getApiBase(): string {
  return resolveApiBase()
}

let apiLang: ApiLang = 'en'
export function setApiLang(l: ApiLang) {
  apiLang = l
}

function withLang(path: string) {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}lang=${apiLang}`
}

function createApiError(message: string, retryable = false, status?: number): Error {
  const err = new Error(message) as Error & { retryable?: boolean; status?: number }
  err.retryable = retryable
  if (status != null) err.status = status
  return err
}

async function parseErrorBody(res: Response): Promise<string> {
  const txt = await res.text().catch(() => '')
  try {
    const j = JSON.parse(txt) as { error?: string; message?: string }
    if (j?.error || j?.message) return j.error || j.message || txt
  } catch {
    /* ignore */
  }
  return `Backend ${res.status}: ${txt.slice(0, 120)}`
}

async function fetchT(url: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('abort')) {
      throw createApiError(
        apiLang === 'hi'
          ? 'अनुरोध समय सीमा से बाहर। कनेक्शन जांचें और पुनः प्रयास करें।'
          : 'Request timed out. Check your connection and try again.',
        true,
      )
    }
    throw createApiError(
      apiLang === 'hi'
        ? 'नेटवर्क अनुरोध विफल। इंटरनेट या API URL जांचें।'
        : 'Network request failed. Check your internet or VITE_API_URL.',
      true,
    )
  } finally {
    clearTimeout(id)
  }
}

async function requestJson<T>(makeRequest: () => Promise<Response>, retries = 1): Promise<T> {
  let last: unknown = null
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await makeRequest()
      if (!res.ok) {
        const retryable = res.status >= 500 || res.status === 429
        if (retryable && attempt < retries) {
          await new Promise((r) => setTimeout(r, 800 + attempt * 800))
          continue
        }
        throw createApiError(await parseErrorBody(res), retryable, res.status)
      }
      return (await res.json()) as T
    } catch (e) {
      last = e
      if (attempt < retries && e instanceof Error && (e as Error & { retryable?: boolean }).retryable) {
        await new Promise((r) => setTimeout(r, 800))
        continue
      }
      throw e
    }
  }
  throw last instanceof Error ? last : createApiError('Request failed')
}

// ── Auth — same as mobile: Bearer on every request; /api/ai/* requires login on server ──
const AUTH_STORAGE_KEY = 'sy-auth-token'
let authToken: string | null = null
export function setAuthToken(t: string | null) {
  authToken = t
  if (typeof localStorage === 'undefined') return
  try {
    if (t) localStorage.setItem(AUTH_STORAGE_KEY, t)
    else localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sy-auth-change'))
  }
}
export function getAuthToken() {
  return authToken
}
/** Call once on app boot so AI rashifal works after refresh (if user logged in before). */
export function initAuthFromStorage() {
  if (authToken || typeof localStorage === 'undefined') return
  try {
    const t = localStorage.getItem(AUTH_STORAGE_KEY)
    if (t) authToken = t
  } catch {
    /* ignore */
  }
}
function authHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {}
}

function apiHeaders(extra?: Record<string, string>): Record<string, string> {
  return { ...correlationHeaders(), ...authHeaders(), ...extra }
}

initAuthFromStorage()

async function get<T>(path: string) {
  return requestJson<T>(() =>
    fetchT(`${getApiBase()}${path}`, { headers: apiHeaders() }),
  )
}

async function post<T>(path: string, body: unknown, timeoutMs?: number) {
  const ms = timeoutForPath(path, timeoutMs)
  return requestJson<T>(() =>
    fetchT(
      `${getApiBase()}${path}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders() },
        body: JSON.stringify(body),
      },
      ms,
    ),
  )
}

async function patch<T>(path: string, body: unknown = {}) {
  return requestJson<T>(() =>
    fetchT(`${getApiBase()}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...apiHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

async function del<T>(path: string) {
  return requestJson<T>(() =>
    fetchT(`${getApiBase()}${path}`, {
      method: 'DELETE',
      headers: { ...authHeaders() },
    }),
  )
}

export interface PanchangTimePart {
  hm12?: string
  hm24?: string
  minutesFromMidnight?: number
}

export interface PanchangDuration {
  text?: string
  hi?: string
}

export interface PanchangPeriod {
  name: string
  start: string
  end: string
  quality?: string
  advice?: string
}

export interface PanchangObservance {
  key: string
  name: { en: string; hi: string }
  type: string
  importance?: string
  guidance?: { en: string; hi: string }
}

export interface PanchangAnga {
  num?: number
  name: string
  hi?: string
  paksha?: string
  pakshaHi?: string
  pada?: number
  endsAt?: { hm: string; nextDay: boolean }
}

export interface PanchangResponse {
  date: string
  weekday: string
  weekdayHi?: string
  location: string
  sunrise: string
  sunset: string
  moonrise?: string | null
  moonset?: string | null
  timings?: {
    sunrise?: PanchangTimePart | null
    sunset?: PanchangTimePart | null
    moonrise?: PanchangTimePart | null
    moonset?: PanchangTimePart | null
    midday?: PanchangTimePart | null
    daylight?: PanchangDuration | null
    night?: PanchangDuration | null
  }
  sun?: { sign?: string; nakshatra?: string }
  tithi: PanchangAnga & { num: number; paksha: string; pakshaHi?: string }
  nakshatra: PanchangAnga & { num: number; pada: number }
  yoga: PanchangAnga & { name: string; hi?: string }
  karana: PanchangAnga & { name: string; hi?: string; isBhadra?: boolean }
  sunriseTithi?: PanchangResponse['tithi'] | null
  sunriseNakshatra?: PanchangResponse['nakshatra'] | null
  sunriseYoga?: PanchangAnga | null
  sunriseKarana?: PanchangAnga | null
  masa?: {
    amanta: { en: string; hi: string }
    purnimanta: { en: string; hi: string }
    system?: 'amanta' | 'purnimanta'
  } | null
  ritu?: { en: string; hi: string } | null
  ayana?: { en: string; hi: string } | null
  observances?: PanchangObservance[]
  auspicious?: PanchangPeriod[]
  inauspicious: PanchangPeriod[]
  moon?: { sign?: string; nakshatra?: string }
  isCurrent?: boolean
  samvat?: { vikram: number; shaka: number }
  samvatsara?: string
  bhadra?: boolean
  panchak?: {
    active: boolean
    type: { en: string; hi: string; auspicious?: boolean; effect?: { en: string; hi: string } }
    startLabel: string
    endLabel: string
  } | null
  currentTime?: PanchangTimePart | null
  calculation?: Record<string, string | undefined>
  ayanamsa?: string
  source?: string
  provider?: 'local' | 'vedastro' | string
}

export interface DailyShloka {
  id: string
  book: string
  hindi: string
  cover: string
  refLabel: string
  sanskrit: string
  transliteration?: string
  english?: string
  nav?: { screen: string; params?: Record<string, unknown> }
}

export interface HoroscopeSign {
  key: string
  name: string
  hi?: string
  displayName: string
  element?: string
  lord?: string
  dates?: string
  score: number
  headline: string
  summary: string
  plainSummary?: string
  areas?: { key: string; title: string; score: number; text: string }[]
  doList?: string[]
  avoidList?: string[]
  remedy?: string
  mantra?: { text: string; count: string }
  luckyColor: string
  luckyNumber: number
  confidence?: number
  basisBullets?: string[]
}

export interface PublicHoroscopeResponse {
  period: string
  date: string
  location: string
  signs: HoroscopeSign[]
  basis?: { moon?: { sign?: string }; sun?: { sign?: string }; nakshatra?: { name?: string } }
  sourceNote: string
}

export interface Plan {
  _id: string
  name: string
  priceINR: number
  durationDays: number
  features: string[]
  badge?: string
}

export interface AppConfigData {
  homeBanners: { title: string; subtitle?: string; imageUrl?: string; isActive?: boolean; order?: number }[]
  branding?: { appName?: string; tagline?: string; logoUrl?: string }
  appVersion: string
  featureFlags?: Record<string, boolean | number | string>
}

export const getHealth = () => get<{ status: string; db: string }>('/api/health')
export const getPanchang = async (input: {
  place?: string
  lat?: number
  lng?: number
  date?: string
  tz?: string
}) => normalizeActivePanchang(await post<PanchangResponse>('/api/panchang', input), input)
export const getDailyShloka = () => get<{ shloka: DailyShloka }>('/api/daily-shloka')
export const getPlans = () => get<{ plans: Plan[] }>(withLang('/api/plans'))
export const getAppConfig = () => get<{ config: AppConfigData }>(withLang('/api/app-config'))

// ── Feature endpoints (parity with mobile app) ──

export type HoroscopePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface KundliInput {
  lat?: number
  lng?: number
  dob: string
  tob: string
  tz: string
  place?: string
}

export interface ApiPlanet {
  planet: string
  sign?: string
  degreeInSign?: string
  house?: string
  nakshatra?: string
  isRetrograde?: string
  isCombust?: string
}

export interface ApiDosha {
  name: string
  present: boolean
  detail: string
  tag: string
}

export interface KundliResponse {
  cached: boolean
  data: {
    ascendant?: string
    moonSign?: string
    doshas?: ApiDosha[]
    yogas?: YogaItem[]
    insights?: KundliInsight[]
    planets: ApiPlanet[]
    time?: string
  }
}

export interface KundliInsight {
  title: string
  text: string
}

export interface YogaItem {
  name: string
  description: string
}

export interface DashaRow {
  lord: string
  start: string
  end: string
  durationText: string
}

export interface DashaResponse {
  ayanamsa: string
  dasha: DashaRow[]
}

export interface YogaResponse {
  ayanamsa: string
  yogas: YogaItem[]
}

export interface VargaChart {
  code: string
  name: string
  nameHi?: string
  sanskrit?: string
  area: string
  areaHi?: string
  why?: string
  whyHi?: string
  ascendantSign?: string | null
  planets: ApiPlanet[]
}

export interface VargaResponse {
  data: { charts: VargaChart[] }
}

export interface DailyPrediction {
  headline?: string
  overall: string
  detailedSummary?: string
  panchangSummary?: string
  transitSummary?: string
  moods?: { label: string; pct: number }[]
  areas?: { title: string; text: string; score?: number; action?: string }[]
  timeWindows?: { label: string; time: string; quality?: 'good' | 'neutral' | 'caution' | string; advice?: string }[]
  remedies?: {
    title: string
    body?: string
    text?: string
    timing?: string
    tag?: string
    mantra?: string
    priority?: 'high' | 'medium' | 'low' | string
  }[]
  doList?: string[]
  avoidList?: string[]
  focus?: string[]
  aiQuestions?: string[]
  saralVivaran?: string
  mantra?: { title?: string; text?: string; count?: string; bestTime?: string } | null
  luckyColour: string
  luckyNumber: string
  luckyTime?: string
  advice?: string
  confidence?: number
  sourceNote?: string
  generatedFor?: string
  _fallback?: boolean
  basis?: {
    moonSign?: string
    ascendant?: string
    dasha?: string
    today?: {
      date?: string
      weekday?: string
      tithi?: string | { name?: string; hi?: string; paksha?: string }
      paksha?: string
      nakshatra?: string | { name?: string; hi?: string; pada?: number }
      yoga?: string | { name?: string; hi?: string }
      karana?: string | { name?: string; hi?: string }
      transitMoon?: string
      sunrise?: string
      inauspicious?: { name: string; start: string; end: string; note?: string }[]
    }
  }
}

export type PredPeriod = 'week' | 'month' | 'year'

export interface PeriodPrediction {
  period: PredPeriod
  range: string
  headline?: string
  overall?: string
  areas: { title: string; score: number; text: string; action?: string }[]
  phases?: { title: string; text: string }[]
  bestDays?: string[]
  majorDates?: string[]
  highlights?: { label: string; text: string }[]
  remedies?: { title: string; body?: string; priority?: string }[]
  advice?: string
  saralVivaran?: string
  sourceNote?: string
  aiAssisted?: boolean
}

export interface ChoghadiyaPeriod {
  name: string
  lord: string
  quality: string
  period: string
  start: string
  end: string
  isCurrent?: boolean
}

export interface ChoghadiyaResponse {
  date: string
  weekday: string
  sunrise: string
  sunset: string
  location: string
  current: ChoghadiyaPeriod | null
  periods: ChoghadiyaPeriod[]
}

export interface SignRashifalSection {
  heading: string
  text: string
  saral: string
}

export interface SignRashifal {
  sign: string
  period: HoroscopePeriod
  range: string
  headline: string
  sections: SignRashifalSection[]
  conclusion: { text: string; saral: string }
  aiAssisted?: boolean
}

export interface MatchPerson {
  name?: string
  moonSign?: string | null
  ascendant?: string | null
  nakshatraName?: string | null
  rashiName?: string | null
  mangal?: boolean
}

export interface MatchKoota {
  key: string
  label: string
  labelHi?: string
  got: number
  max: number
  boy?: string
  girl?: string
  note?: string
  noteHi?: string
}

export interface MatchMilan {
  total: number
  max: number
  percent: number
  verdict: 'excellent' | 'good' | 'average' | 'poor' | string
  kootas: MatchKoota[]
}

export interface MatchMangal {
  boy: boolean
  girl: boolean
  compatible: boolean
  severity: 'none' | 'cancelled' | 'present' | string
  note?: string
  noteHi?: string
}

export interface MatchExplanation {
  verdict?: string
  summary?: string
  strengths?: string[]
  cautions?: string[]
  advice?: string
  saralVivaran?: string
  aiAssisted?: boolean
}

export interface MatchResponse {
  people: { boy: MatchPerson; girl: MatchPerson }
  milan: MatchMilan
  mangal: MatchMangal
  explanation?: MatchExplanation | null
}

export interface MuhuratCategory {
  key: string
  name: { en: string; hi: string }
  emoji: string
  blurb: { en: string; hi: string }
}

export interface MuhuratItem {
  date: string
  dmy?: string
  weekday: string
  weekdayHi?: string
  score: number
  rating: { en: string; hi: string }
  sunrise: string
  sunset: string
  time: {
    abhijit: { start: string; end: string } | null
    windows?: { start: string; end: string; name?: string }[]
    rahuKaal?: { start: string; end: string } | null
  }
  tithi?: { name: string; hi?: string }
  nakshatra?: { name: string; hi?: string }
  ok?: boolean
  reject?: { en: string; hi: string }
}

export interface MuhuratBirthInput {
  date?: string
  time?: string
  place?: string
  lat?: number
  lng?: number
  tz?: string
}

export interface MuhuratResult {
  category: MuhuratCategory
  scanned: number
  best: MuhuratItem | null
  target?: MuhuratItem | null
  items: MuhuratItem[]
  nameRashi?: string | null
}

export interface NumerologyProfile {
  name: string
  dob: string
  system?: string
  mulank: { final: number; planet: { en: string; hi: string } | null }
  bhagyank: { final: number; planet: { en: string; hi: string } | null }
  namank: { final: number; pythagorean: number; planet?: { en: string; hi: string } | null }
  soulUrge?: { final: number }
  personality?: { final: number }
  personalYear?: { final: number; meaning?: { en?: string; hi?: string } | null }
  loShu?: {
    counts: Record<string, number>
    missing: number[]
    presentArrows?: { key: string; label: { en: string; hi: string } }[]
    missingArrows?: { key: string; label: { en: string; hi: string } }[]
  }
  coreCompatibility?: {
    driverConductor?: { relation: string; label?: { en: string; hi: string } }
    driverName?: { relation: string; label?: { en: string; hi: string } }
    conductorName?: { relation: string; label?: { en: string; hi: string } }
  }
  lucky: {
    numbers: number[]
    colors: { en: string[]; hi: string[] }
    days: { en: string[]; hi: string[] }
    gem?: { en: string; hi: string }
  } | null
  nameCorrection?: {
    isHarmonious: boolean
    suggestedNameNumbers: number[]
    note?: { en: string; hi: string }
  } | null
}

export interface NumerologyReading {
  summary?: string
  saralVivaran?: string
  mulank?: { title?: string; meaning?: string; traits?: string[] }
  bhagyank?: { title?: string; meaning?: string; career?: string[] }
  namank?: { title?: string; meaning?: string }
  personalYear?: { title?: string; meaning?: string }
  loShu?: { strengths?: string; gaps?: string; remedies?: string[] }
  aiAssisted?: boolean
}

export interface LifeGem {
  planet: string
  gemstone: string
  gemstoneHi?: string
  metal?: string
  metalHi?: string
  finger?: string
  fingerHi?: string
  day?: string
  dayHi?: string
  mantra?: string
  note?: string
  noteHi?: string
}

export interface DoshaRemedyItem {
  key: string
  name: string
  nameHi?: string
  present: boolean
  remedies: { title: string; titleHi?: string }[]
  mantra?: string
  mantraHi?: string
  deity?: string
  deityHi?: string
}

export interface PlanetMantra {
  planet: string
  planetHi?: string
  mantra: string
  count?: number
  forWhat?: string
  forWhatHi?: string
}

export interface RemediesExplanation {
  summary?: string
  gemWhy?: string
  scriptureNote?: string
  advice?: string
  saralVivaran?: string
  aiAssisted?: boolean
}

export interface RemediesResponse {
  ascendant?: string | null
  moonSign?: string | null
  sadeSati?: { active: boolean; dhaiya: boolean; phase?: string | null; phaseHi?: string | null }
  remedies: {
    lifeGem: LifeGem | null
    doshaRemedies: DoshaRemedyItem[]
    planetMantras: PlanetMantra[]
  }
  explanation?: RemediesExplanation | null
}

export interface BiText {
  en: string
  hi: string
}

export interface VedicReadingResponse {
  ascendant?: string | null
  moonSign?: string | null
  moonNakshatra?: number
  moonPada?: number
  janma?: {
    gana: BiText
    yoni: BiText
    nadi: BiText
    varna: BiText
    gandmool: { present: boolean; nakshatra?: string | null; note: BiText }
    lagnaSandhi?: boolean
  }
  birthPanchang?: {
    tithi: { name: string; hi?: string; paksha: string }
    nakshatra: { name: string; hi?: string; pada: number }
    yoga: { name: string; hi?: string }
    karana: { name: string; hi?: string }
  } | null
  naamakshar?: { syllable: string; nakshatra: string; pada: number; note: BiText } | null
  predictions: {
    key?: string
    category?: string
    source?: string
    title: { en: string; hi: string }
    text: { en: string; hi: string }
    strength?: string
  }[]
  explanation?: { summary?: string; advice?: string; saralVivaran?: string; aiAssisted?: boolean } | null
  source?: string
}

export interface BrihatSection {
  key: string
  title: BiText
  status: string
  count?: number
  source?: string | null
}

export interface BrihatDomain {
  key: string
  title: BiText
  summary?: BiText | null
  confidence?: string
  charts?: string[]
  focus?: string[]
  timing?: { currentDashaLord?: string; favorableYears?: number[] }
}

export interface BrihatKundliResponse {
  generatedAt?: string
  reportType?: string
  title: BiText
  summary: {
    ascendant?: string | null
    moonSign?: string | null
    sunSign?: string | null
    activeDasha?: { lord?: string } | null
    doshas?: ApiDosha[]
  }
  accuracy?: { calculation?: string; engine?: string; requires?: string[]; note?: string }
  sections: BrihatSection[]
  domains: BrihatDomain[]
  roadmap?: { key: string; title: string; status: string }[]
  errors?: Record<string, string | null>
}

export interface VastuAnalysisResponse {
  summary: { score: number | null; band: string; title: { en: string; hi: string }; text: { en: string; hi: string } }
  findings: { title: { en: string; hi: string }; status: string; recommendation: { en: string; hi: string } }[]
  priority: { title: { en: string; hi: string }; recommendation: { en: string; hi: string } }[]
}

export interface NameItem {
  name: string
  nameHi?: string | null
  meaning: string
  meaningHi?: string | null
  gender?: string | null
}

export interface NameEngineResponse {
  names: NameItem[]
  candidate?: { name: string; suitable: boolean; reason: string } | null
}

export interface NameSuggestionsResponse extends NameEngineResponse {
  syllable: string
  nakshatra?: string
  moonSign?: string | null
}

export const getChoghadiya = (input: { place?: string; lat?: number; lng?: number; tz?: string }) =>
  post<ChoghadiyaResponse>('/api/choghadiya', input)

export const getKundli = (input: KundliInput) => post<KundliResponse>('/api/kundli', input)

export const getKundliMatch = (boy: KundliInput & { name?: string }, girl: KundliInput & { name?: string }) =>
  post<MatchResponse>('/api/match', { boy, girl, lang: apiLang })

export const getHoroscopePeriod = (params?: {
  period?: HoroscopePeriod
  date?: string
  place?: string
  lat?: number
  lng?: number
}) => {
  const qs = new URLSearchParams()
  if (params?.period) qs.set('period', params.period)
  if (params?.date) qs.set('date', params.date)
  if (params?.place) qs.set('place', params.place)
  if (params?.lat != null) qs.set('lat', String(params.lat))
  if (params?.lng != null) qs.set('lng', String(params.lng))
  const path = `/api/horoscope${qs.toString() ? `?${qs.toString()}` : ''}`
  return get<PublicHoroscopeResponse>(withLang(path))
}

/** Alias used on home — same as getHoroscopePeriod */
export const getHoroscope = getHoroscopePeriod

export const getSignRashifal = (
  sign: string,
  period: HoroscopePeriod,
  transit?: { moonSign?: string; sunSign?: string },
) =>
  post<SignRashifal>(
    '/api/ai/sign-rashifal',
    { sign, period, lang: apiLang, moonTransit: transit?.moonSign, sunTransit: transit?.sunSign },
    180_000,
  )

export const getDailyPrediction = (input: KundliInput & { name?: string }) =>
  post<DailyPrediction>('/api/ai/daily-prediction', { ...input, lang: apiLang })

export const getPeriodPrediction = (input: KundliInput & { name?: string }, period: PredPeriod) =>
  post<PeriodPrediction>('/api/ai/period-prediction', { ...input, period, lang: apiLang })

export const getPersonalizedHoroscope = (input: KundliInput & { name?: string }) =>
  post<{ type: 'personalized'; horoscope: DailyPrediction; sourceNote?: string }>(
    '/api/horoscope/personalized',
    { ...input, lang: apiLang },
  )

export const getVargaCharts = (input: KundliInput) => post<VargaResponse>('/api/varga', input)

export const getDasha = (input: KundliInput) => post<DashaResponse>('/api/dasha', input)

export const getYoga = (input: KundliInput) => post<YogaResponse>('/api/yoga', input)

export interface GocharExplanation {
  summary?: string
  highlights?: { planet: string; text: string }[]
  advice?: string
  saralVivaran?: string
  aiAssisted?: boolean
}

export interface GocharResponse {
  date: string
  ayanamsa?: string
  natalMoonSign?: string | null
  natalAsc?: string | null
  sadeSati: { active: boolean; dhaiya: boolean; phase?: string | null; phaseHi?: string | null }
  transits: { planet: string; sign: string; houseFromMoon?: number | null; isRetrograde?: string }[]
  explanation?: GocharExplanation | null
}

export const getGochar = (input: KundliInput) => post<GocharResponse>('/api/gochar', { ...input, lang: apiLang })

export interface DashaPeriodPhala {
  effect?: string
  good?: string
  caution?: string
  remedy?: string
}

export interface Antardasha {
  lord: string
  fromAge: number
  toAge: number
  fromYear: number
  toYear: number
  current?: boolean
}

export interface DashaPeriod {
  lord: string
  years: number
  fromAge: number
  toAge: number
  fromYear: number
  toYear: number
  partial?: boolean
  current?: boolean
  past?: boolean
  house?: number | null
  sign?: string | null
  dignity?: string
  nature?: 'favorable' | 'mixed' | 'challenging'
  phala?: DashaPeriodPhala | null
  antardashas?: Antardasha[]
}

export interface LifeTimelineResponse {
  ascendant?: string | null
  moonSign?: string | null
  currentAge: number
  balance: { lord: string; totalYears: number; bhuktaYears: number; bhogyaYears: number }
  periods: DashaPeriod[]
  saralVivaran?: string
  source?: string
}

export const getLifeTimeline = (input: KundliInput) =>
  post<LifeTimelineResponse>('/api/life-timeline', { ...input, lang: apiLang })

export interface TransitPlanetYear {
  sign?: string | null
  signHi?: string | null
  houseFromMoon?: number | null
  event?: string | null
  eventHi?: string | null
  kind?: 'good' | 'caution' | 'neutral'
}

export interface TransitYear {
  year: number
  current?: boolean
  shani: TransitPlanetYear
  guru: TransitPlanetYear
  note?: string | null
}

export interface TransitForecastResponse {
  moonSign?: string | null
  fromYear: number
  toYear: number
  currentYear?: number
  years: TransitYear[]
  summary?: string | null
  saralVivaran?: string
  source?: string
}

export const getTransitForecast = (input: KundliInput & { fromYear?: number; toYear?: number }) =>
  post<TransitForecastResponse>('/api/transit-forecast', { ...input, lang: apiLang }, 60_000)

export const getMuhuratCategories = () => get<{ items: MuhuratCategory[] }>('/api/muhurat/categories')

export const findMuhurat = (input: {
  category: string
  date?: string
  month?: number
  year?: number
  months?: number
  targetDate?: string
  toDate?: string
  place?: string
  lat?: number
  lng?: number
  tz?: string
  nameRashi?: string | null
  birth?: MuhuratBirthInput | null
  birth2?: MuhuratBirthInput | null
}) => post<MuhuratResult>('/api/muhurat/find', input)

export const getNumerologyProfile = (input: { name?: string; dob: string }) =>
  post<{ profile: NumerologyProfile }>('/api/numerology/profile', input)

export const getNumerologyReading = (input: { name?: string; dob: string }) =>
  post<{ profile: NumerologyProfile; reading: NumerologyReading }>('/api/numerology/interpret', {
    ...input,
    lang: apiLang,
  })

export const getRemedies = (input: KundliInput) => post<RemediesResponse>('/api/remedies', { ...input, lang: apiLang })

export const getVedicReading = (input: KundliInput) =>
  post<VedicReadingResponse>('/api/vedic-reading', { ...input, lang: apiLang })

export const getBrihatKundli = (input: KundliInput) =>
  post<BrihatKundliResponse>('/api/brihat-kundli', { ...input, lang: apiLang }, 60_000)

export const analyzeVastu = (input: {
  propertyType?: string
  facing?: string
  rooms?: Record<string, string>
}) => post<VastuAnalysisResponse>('/api/vastu/analyze', { ...input, lang: apiLang })

export const getBabyNames = (input: { gender?: string; startWith?: string; theme?: string; count?: number }) =>
  post<NameEngineResponse>('/api/baby-names', { ...input, lang: apiLang })

export const getNameSuggestions = (input: KundliInput & { gender?: string }) =>
  post<NameSuggestionsResponse>('/api/name-suggestions', { ...input, lang: apiLang })

async function getAuth<T>(path: string) {
  return requestJson<T>(() =>
    fetchT(`${getApiBase()}${path}`, { headers: apiHeaders() }),
  )
}

async function postAuth<T>(path: string, body: unknown, timeoutMs?: number) {
  const ms = timeoutForPath(path, timeoutMs)
  return requestJson<T>(() =>
    fetchT(
      `${getApiBase()}${path}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders() },
        body: JSON.stringify(body),
      },
      ms,
    ),
  )
}

async function putAuth<T>(path: string, body: unknown) {
  return requestJson<T>(() =>
    fetchT(`${getApiBase()}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...apiHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export interface AuthUser {
  id: string
  name: string
  email: string | null
  phone: string | null
  profile?: { dob?: string; tob?: string; tz?: string; place?: string; lat?: number; lng?: number }
  plan?: string
}

export const loginUser = (input: { identifier: string; password: string }) =>
  post<{ token: string; user: AuthUser }>('/api/auth/login', input)

export interface OtpRequestResponse { sent: boolean; phone: string; devCode?: string }
export interface VerifyOtpResponse {
  token: string
  user: AuthUser
  isNew: boolean
  profileComplete: boolean
}

/** Same as mobile — +91XXXXXXXXXX */
export const requestOtp = (phone: string) => post<OtpRequestResponse>('/api/auth/request-otp', { phone })

export const verifyOtp = (input: { phone: string; code: string; name?: string }) =>
  post<VerifyOtpResponse>('/api/auth/verify-otp', input)

export const logoutServer = () => postAuth<{ ok: boolean }>('/api/auth/logout', {})

export const getMe = () => getAuth<{ user: AuthUser }>('/api/auth/me')

export const updateProfileApi = (input: { name?: string; profile?: AuthUser['profile'] }) =>
  putAuth<{ user: AuthUser }>('/api/profile', input)

// ── AI (app parity) ──
export interface AiAstrologerResponse {
  question: string
  answer: string
  sections: { title: string; text: string }[]
  followUpQuestions: string[]
  sourceNote?: string
  confidence?: number
}

export const askAiAstrologer = (input: KundliInput & { name?: string; question: string }) =>
  post<AiAstrologerResponse>('/api/ai/ask-astrologer', { ...input, lang: apiLang })

export const getAiInsights = (input: KundliInput) =>
  post<{ insights: KundliInsight[] }>('/api/ai/insights', { ...input, lang: apiLang })

export const getChoghadiyaMessage = (input: KundliInput & { period: string; quality?: string }) =>
  post<{ message: string }>('/api/ai/choghadiya-message', { ...input, lang: apiLang })

export interface MuhuratPeriodIn { name: string; time: string; nature: string }
export interface MuhuratPick { period: string; reason: string; aiAssisted?: boolean; source?: string }
export const getMuhuratPick = (input: { activity: string; periods: MuhuratPeriodIn[] }) =>
  post<MuhuratPick>('/api/ai/muhurat', { ...input, lang: apiLang })

export const askVastu = (input: {
  propertyType?: string
  facing?: string
  rooms?: Record<string, string>
  question: string
}) => post<{ answer: string; remedies: string[]; aiAssisted?: boolean }>('/api/vastu/ask', { ...input, lang: apiLang }, 60_000)

export const askNameQuestion = (input: { question: string; names?: string[]; gender?: string }) =>
  post<{ answer: string; suggestions?: NameItem[] }>('/api/name-ask', { ...input, lang: apiLang })

export const getDailyShlokaExplain = (id: string) =>
  post<{ explanation?: string; saral?: string; text?: string }>('/api/ai/daily-shloka-explain', { id, lang: apiLang })

export interface SunTimesResponse {
  date: string
  place: string
  sunrise: { h: number; m: number }
  sunset: { h: number; m: number }
}

export const getSunTimes = (input: { place?: string; lat?: number; lng?: number; date?: string; tz?: string }) =>
  post<SunTimesResponse>('/api/sunrise', input)

export interface LocationSuggestion {
  place: string
  lat: number
  lng: number
  label?: string
}

export const searchLocations = (input: { query: string; limit?: number }) => {
  const qs = new URLSearchParams()
  qs.set('query', input.query)
  if (input.limit) qs.set('limit', String(input.limit))
  qs.set('lang', apiLang)
  return get<{ items: LocationSuggestion[] }>(`/api/locations/search?${qs}`)
}

export const resolveLocation = (input: { query: string }) =>
  post<LocationSuggestion>('/api/locations/resolve', { ...input, lang: apiLang })

// ── Panchang extras ──
export interface PanchangFestivalDay {
  date: string
  weekday: string
  weekdayHi?: string
  tithi?: PanchangResponse['tithi'] | null
  observances: PanchangObservance[]
}

export const getPanchangFestivals = (input: {
  place?: string
  lat?: number
  lng?: number
  date?: string
  tz?: string
  days?: number
}) => post<{ items: PanchangFestivalDay[] }>('/api/panchang/festivals', input)

export interface ObservanceCatalogItem {
  key: string
  name: { en: string; hi: string }
  type: string
  importance: string
  aliases?: string[]
}

export const getObservanceCatalog = () => get<{ items: ObservanceCatalogItem[] }>('/api/panchang/observances')

export const searchPanchangFestivals = (input: {
  place?: string
  lat?: number
  lng?: number
  date?: string
  tz?: string
  query: string
  years?: number
}) => post<{ items: PanchangFestivalDay[] }>('/api/panchang/festival-search', input)

export interface PanchangFestivalDetail {
  date: string
  location: string
  observance: PanchangObservance
  title: string
  panchang: {
    weekday?: string
    tithi?: string
    paksha?: string
    nakshatra?: string
    sunrise?: string
    sunset?: string
  }
  recommendedMuhurat: { name: string; start: string; end: string; advice?: string }[]
  doList: string[]
  avoidList: string[]
  note?: string
  ai?: { summary?: string; ritualSteps?: string[]; muhuratAdvice?: string } | null
  aiError?: string | null
  catalog?: {
    key: string
    name: { en: string; hi: string }
    why?: { en: string; hi: string }
    samagri?: string[]
    steps?: string[]
    mantras?: { en: string; hi: string }[]
    aarti?: { en: string; hi: string }
    guidance?: { en: string; hi: string }
  }
}

export const getPanchangFestivalDetail = (input: {
  place?: string
  lat?: number
  lng?: number
  date: string
  tz?: string
  key?: string
  lang?: ApiLang
  ai?: boolean
}) => post<PanchangFestivalDetail>('/api/panchang/festival-detail', { ...input, lang: input.lang ?? apiLang })

// ── Content library ──
export interface ContentChapter {
  _id?: string
  title: string
  order: number
  content?: string
}

export interface ContentBook {
  _id: string
  title: string
  author?: string
  coverImage?: string
  description?: string
  chapters?: ContentChapter[]
}

export const getLibrary = () => get<{ books: ContentBook[] }>(withLang('/api/library'))
export const getBook = (id: string) => get<{ book: ContentBook }>(withLang(`/api/library/${id}`))

export interface GitaChapterInfo {
  number: number
  name: string
  nameHi?: string
  verses: number
}

export interface GitaChapterFull {
  number: number
  name: string
  nameHi?: string
  verses: { number: number; sanskrit: string; transliteration?: string; hindi?: string; english?: string }[]
}

export const getGitaChapters = () => get<{ chapters: GitaChapterInfo[] }>(withLang('/api/gita'))
export const getGitaChapter = (n: number) => get<{ chapter: GitaChapterFull }>(withLang(`/api/gita/${n}`))

export const getGitaExplanation = (chapter: number, verse: number) =>
  post<{ explanation?: string; anuvad?: string; katha?: string; seekh?: string }>('/api/ai/gita-explain', {
    chapter,
    verse,
    lang: apiLang,
  })

export interface OccasionMantra {
  sanskrit: string
  transliteration?: string
  meaning: string
  when?: string
  benefit?: string
  count?: string
}

export interface OccasionGuide {
  significance: string
  muhurat: string
  samagri: string[]
  steps: string[]
  mantras: OccasionMantra[]
  dos: string[]
  donts: string[]
  faqs: { q: string; a: string }[]
  regionalNote?: string
  disclaimer?: string
  aiAssisted?: boolean
}

export const getOccasionGuide = (occasion: string) =>
  post<OccasionGuide>('/api/ai/occasion-guide', { occasion, lang: apiLang }, 120_000)

export const askOccasion = (occasion: string, question: string) =>
  post<{ answer: string }>('/api/ai/occasion-ask', { occasion, question, lang: apiLang }, 120_000)

export interface RamayanKanda {
  kanda: string
  kandaOrder: number
  sargas: number
  shlokas: number
}

export interface RamayanSargaInfo {
  kanda: string
  sarga: number
  shlokaCount: number
  hindiReady?: boolean
}

export interface RamayanShloka {
  shloka: string
  sanskrit: string
  transliteration?: string
  wordMeanings?: string
  english?: string
  hindi?: string
}

export interface RamayanSargaFull {
  kanda: string
  kandaOrder: number
  sarga: number
  shlokaCount: number
  shlokas: RamayanShloka[]
}

export const getRamayanKandas = () => get<{ kandas: RamayanKanda[] }>(withLang('/api/ramayan'))
export const getRamayanSargas = (kanda: number) =>
  get<{ kanda: string; kandaOrder: number; sargas: RamayanSargaInfo[] }>(withLang(`/api/ramayan/${kanda}`))
export const getRamayanSarga = (kanda: number, sarga: number) =>
  get<{ sarga: RamayanSargaFull }>(withLang(`/api/ramayan/${kanda}/${sarga}`))

export const getRamayanExplanation = (kanda: number, sarga: number, shloka: string) =>
  post<{ anuvad?: string; katha?: string; seekh?: string }>('/api/ai/ramayan-explain', {
    kanda,
    sarga,
    shloka,
    lang: apiLang,
  })

export interface RcmKanda {
  kanda: string
  kandaHindi: string
  kandaOrder: number
  verseCount: number
}

export interface RcmVerse {
  number: string
  type: string
  text: string
}

export interface RcmKandaFull extends RcmKanda {
  verses: RcmVerse[]
}

export const getRcmKandas = () => get<{ kandas: RcmKanda[] }>(withLang('/api/ramcharitmanas'))
export const getRcmKanda = (n: number) => get<{ kanda: RcmKandaFull }>(withLang(`/api/ramcharitmanas/${n}`))
export const getRcmExplanation = (kanda: number, number: string) =>
  post<{ anuvad?: string; katha?: string; seekh?: string }>('/api/ai/rcm-explain', { kanda, number, lang: apiLang })

export interface FaqEntry {
  q: string
  a: string
  qHi?: string
  aHi?: string
}

export const getFaq = () => get<{ faq: FaqEntry[] }>(withLang('/api/faq'))

export const getMedia = (params?: { category?: string; subCategory?: string; limit?: number }) => {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.subCategory) qs.set('subCategory', params.subCategory)
  if (params?.limit) qs.set('limit', String(params.limit))
  return get<{ items: { _id: string; title: string; subtitle?: string; audioUrl?: string }[] }>(
    withLang(`/api/media?${qs}`),
  )
}

// ── Rigveda ──
export interface RigMandala {
  mandala: number
  suktas: number
  mantras: number
}
export interface RigSuktaInfo {
  mandala: number
  sukta: number
  mantraCount: number
}
export interface RigMantra {
  verse: number
  sanskrit: string
  transliteration?: string
  english?: string
  hindi?: string
}
export interface RigSuktaFull {
  mandala: number
  sukta: number
  mantraCount: number
  mantras: RigMantra[]
}
export const getRigMandalas = () => get<{ mandalas: RigMandala[] }>(withLang('/api/rigveda'))
export const getRigSuktas = (mandala: number) =>
  get<{ mandala: number; suktas: RigSuktaInfo[] }>(withLang(`/api/rigveda/${mandala}`))
export const getRigSukta = (mandala: number, sukta: number) =>
  get<{ sukta: RigSuktaFull }>(withLang(`/api/rigveda/${mandala}/${sukta}`))
export const getRigvedaExplanation = (mandala: number, sukta: number, verse: number) =>
  post<{ anuvad?: string; katha?: string; seekh?: string; explanation?: string }>('/api/ai/rigveda-explain', {
    mandala,
    sukta,
    verse,
    lang: apiLang,
  })

// ── Generic Veda / Purana / Chalisa ──
export interface VedaBook {
  book: number
  bookName?: string
  sections: number
  verses: number
}
export interface VedaStory {
  hi?: string
  en?: string
}
export interface VedaSectionInfo {
  book: number
  section: number
  sectionName?: string
  verseCount: number
  storyTitle?: VedaStory
}
export interface VedaVerse {
  verse: number
  sanskrit: string
  transliteration?: string
  english?: string
  hindi?: string
}
export interface VedaSectionFull {
  veda: string
  book: number
  bookName?: string
  section: number
  sectionName?: string
  verseCount: number
  verses: VedaVerse[]
  story?: VedaStory
  storyTitle?: VedaStory
}
export const getVedaBooks = (veda: string) =>
  get<{ veda: string; books: VedaBook[] }>(withLang(`/api/veda/${veda}`))
export const getVedaSections = (veda: string, book: number) =>
  get<{ veda: string; book: number; sections: VedaSectionInfo[] }>(withLang(`/api/veda/${veda}/${book}`))
export const getVedaSection = (veda: string, book: number, section: number) =>
  get<{ section: VedaSectionFull }>(withLang(`/api/veda/${veda}/${book}/${section}`))
export const getVedaExplanation = (veda: string, book: number, section: number, verse: number) =>
  post<{ anuvad?: string; katha?: string; seekh?: string; explanation?: string }>('/api/ai/veda-explain', {
    veda,
    book,
    section,
    verse,
    lang: apiLang,
  })

// ── Notifications (auth required) ──
export interface AppNotification {
  _id: string
  title: string
  body: string
  type: string
  sentAt?: string
  createdAt: string
  read?: boolean
}
export const getNotifications = () =>
  get<{ notifications: AppNotification[]; unreadCount: number }>(withLang('/api/notifications'))
export const markNotificationRead = (id: string) =>
  patch<{ notification: AppNotification }>(`/api/notifications/${id}/read`, {})
export const markAllNotificationsRead = () =>
  patch<{ ok: boolean; unreadCount: number }>('/api/notifications/read-all', {})
export const deleteNotification = (id: string) =>
  del<{ ok: boolean; unreadCount: number }>(`/api/notifications/${id}`)
export const clearAllNotifications = () =>
  del<{ ok: boolean; unreadCount: number }>('/api/notifications')


