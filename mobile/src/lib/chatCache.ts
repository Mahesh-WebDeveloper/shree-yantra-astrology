/**
 * Astrologer chat history — local cache.
 *
 * Server (DB) me poori history HAMESHA rehti hai (all-time). Yeh cache sirf
 * SPEED ke liye hai: app khulte hi pichle 2 din ki chat turant dikh jaati hai
 * (bina network wait ke), phir background me server se fresh history aakar
 * usko replace kar deti hai. 2 din se purane turns cache se hat jaate hain —
 * wo "पुरानी चैट देखें" par server se load hote hain.
 *
 * Per-user key: alag users ki chat kabhi mix na ho.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AiAstrologerResponse } from './api';

export const CACHE_DAYS = 2;
const CACHE_MS = CACHE_DAYS * 24 * 60 * 60 * 1000;
const MAX_CACHED = 40; // safety cap — cache chhota aur tez rahe

export interface CachedTurn {
  id: string;
  question: string;
  response?: AiAstrologerResponse | null;
  error?: string;
  createdAt: string; // ISO
}

const keyFor = (userId?: string | null) => `sy.chat.${userId || 'guest'}`;

/** 2 din se purane (aur cap se zyada) turns hata do. */
function prune(turns: CachedTurn[]): CachedTurn[] {
  const cut = Date.now() - CACHE_MS;
  return turns
    .filter((t) => {
      const at = new Date(t.createdAt).getTime();
      return Number.isFinite(at) && at >= cut;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // newest first
    .slice(0, MAX_CACHED);
}

/** App khulte hi turant dikhane ke liye — pichle 2 din ki chat. */
export async function loadCachedChat(userId?: string | null): Promise<CachedTurn[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? prune(parsed) : [];
  } catch {
    return [];
  }
}

/** Har naye jawab/history-refresh ke baad cache update (sirf 2 din rakhta hai). */
export async function saveCachedChat(userId: string | null | undefined, turns: CachedTurn[]): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(prune(turns)));
  } catch {
    /* cache best-effort — kabhi crash na kare */
  }
}

/** Logout / "clear chat" par local cache bhi saaf. */
export async function clearCachedChat(userId?: string | null): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(userId));
  } catch {
    /* ignore */
  }
}
