/**
 * User app-data sync — jaap counts, bookmarks, reading progress, samagri checklists.
 *
 * KYUN: pehle ye sab SIRF phone par tha (Android Auto-Backup ke bharose). Backup 24
 * ghante me ek baar chalta hai, 2 mahine baad delete ho jaata hai, doosre phone par
 * sync nahi karta, aur user band kar sakta hai. Ab SERVER asli ghar hai — kisi bhi
 * phone par login karo, aapki saari mala/bookmark wapas.
 *
 * MERGE (conflict-free, offline-safe — do phone se ek saath use karo to bhi data safe):
 *   jaap  → count ka MAX liya jaata hai (mala kabhi peeche nahi jaati)
 *   baaki → per-item Last-Write-Wins (`at` timestamp se)
 * Yahi rule server par bhi hai, isliye dono taraf same nateeja aata hai.
 *
 * Local hamesha turant likhta hai (UI kabhi wait nahi karta); server push debounced
 * hai aur fail ho jaaye to chup-chaap chhod deta hai — agli baar phir sync ho jaayega.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserData, putUserData, UserDataDto } from './api';
import { getAuthToken } from './api';

export type JaapEntry = { j: number; m: number; at: number };
export type SavedEntry = { on: boolean; at: number };
export type ProgressEntry = { chapter: number; percent: number; at: number };
export type SamagriEntry = { items: number[]; at: number };

export interface UserData {
  jaap: Record<string, JaapEntry>;
  saved: Record<string, SavedEntry>;
  progress: Record<string, ProgressEntry>;
  samagri: Record<string, SamagriEntry>;
  prefs: Record<string, any>;
}

const EMPTY: UserData = { jaap: {}, saved: {}, progress: {}, samagri: {}, prefs: {} };
const LOCAL_KEY = 'sy.userdata';       // local mirror (offline source of truth)
const PUSH_DEBOUNCE_MS = 2500;

const num = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const obj = (v: any) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const newer = (a: any, b: any) => num(b?.at) > num(a?.at);

/* ── merge (server ke rules ke bilkul same) ─────────────────────────── */
export function mergeUserData(base: UserData, incoming: Partial<UserData>): UserData {
  const out: UserData = {
    jaap: { ...base.jaap }, saved: { ...base.saved },
    progress: { ...base.progress }, samagri: { ...base.samagri },
    prefs: { ...base.prefs },
  };
  for (const [id, c] of Object.entries(obj(incoming.jaap))) {
    const s = out.jaap[id];
    out.jaap[id] = {
      j: Math.max(num(s?.j), num((c as any).j)),   // MAX — count kabhi ghatega nahi
      m: newer(s, c) ? num((c as any).m, 1) : num(s?.m, num((c as any).m, 1)),
      at: Math.max(num(s?.at), num((c as any).at)),
    };
  }
  for (const [id, c] of Object.entries(obj(incoming.saved))) {
    if (newer(out.saved[id], c)) out.saved[id] = { on: !!(c as any).on, at: num((c as any).at) };
  }
  for (const [id, c] of Object.entries(obj(incoming.progress))) {
    if (newer(out.progress[id], c)) out.progress[id] = { chapter: num((c as any).chapter), percent: num((c as any).percent), at: num((c as any).at) };
  }
  for (const [id, c] of Object.entries(obj(incoming.samagri))) {
    if (newer(out.samagri[id], c)) out.samagri[id] = { items: Array.isArray((c as any).items) ? (c as any).items.map(Number) : [], at: num((c as any).at) };
  }
  if (newer(out.prefs, incoming.prefs)) out.prefs = { ...obj(incoming.prefs) };
  return out;
}

/* ── local mirror ────────────────────────────────────────────────────── */
let data: UserData = { ...EMPTY };
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function subscribeUserData(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
export function getUserDataSnapshot(): UserData { return data; }
export function isUserDataHydrated() { return hydrated; }

async function persistLocal() {
  try { await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

/** App start par — local mirror load (turant, network ke bina). */
export async function hydrateUserData(): Promise<UserData> {
  if (hydrated) return data;
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (raw) data = { ...EMPTY, ...JSON.parse(raw) };
  } catch { /* first run */ }
  hydrated = true;
  emit();
  return data;
}

/* ── push (debounced) ────────────────────────────────────────────────── */
let pending: Partial<UserData> = {};
let timer: ReturnType<typeof setTimeout> | null = null;

function stagePatch(patch: Partial<UserData>) {
  for (const k of ['jaap', 'saved', 'progress', 'samagri'] as const) {
    if (patch[k]) pending[k] = { ...(pending[k] as any), ...(patch[k] as any) };
  }
  if (patch.prefs) pending.prefs = { ...obj(pending.prefs), ...patch.prefs };
}

async function flushPush() {
  timer = null;
  const patch = pending;
  pending = {};
  if (!Object.keys(patch).length) return;
  if (!getAuthToken()) return; // guest — sirf local
  try {
    const r = await putUserData(patch);
    // server merged copy wapas deta hai → local ko usse align kar do
    data = mergeUserData(data, r.data as any);
    await persistLocal();
    emit();
  } catch {
    // offline/fail → patch wapas queue me daalo, agli baar chala jaayega
    stagePatch(patch);
  }
}

/**
 * Local change → turant local me likho + server push queue karo.
 * UI kabhi network ka wait nahi karta.
 */
export function updateUserData(patch: Partial<UserData>) {
  data = mergeUserData(data, patch);
  persistLocal();
  emit();
  stagePatch(patch);
  if (timer) clearTimeout(timer);
  timer = setTimeout(flushPush, PUSH_DEBOUNCE_MS);
}

/**
 * Login ke baad / app start par — server se pull karke merge.
 * Local jo kuch naya hai wo bhi push ho jaata hai (do-tarfa sync).
 */
export async function syncUserData(): Promise<UserData> {
  await hydrateUserData();
  if (!getAuthToken()) return data;
  try {
    const r = await getUserData();
    data = mergeUserData(data, r.data as any);
    await persistLocal();
    emit();
    // local ka jo server par nahi hai wo bhej do (pehli baar / offline ke baad)
    stagePatch(data);
    if (timer) clearTimeout(timer);
    timer = setTimeout(flushPush, 400);
  } catch { /* offline → local se chalta rahega */ }
  return data;
}

/** Logout par local mirror saaf (agle user ko pichle ka data na dikhe). */
export async function clearUserData() {
  data = { ...EMPTY };
  pending = {};
  if (timer) { clearTimeout(timer); timer = null; }
  try { await AsyncStorage.removeItem(LOCAL_KEY); } catch { /* ignore */ }
  emit();
}

export type { UserDataDto };
