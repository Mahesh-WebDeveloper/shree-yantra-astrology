/**
 * nameShortlist — favourites/shortlist for the Name feature, persisted locally.
 * The seam a backend ("my saved names" sync) can slot into later.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NameItem } from './api';

const KEY = 'sy.nameShortlist.v1';

let cache: NameItem[] | null = null;
const listeners = new Set<(items: NameItem[]) => void>();

const emit = () => { const s = cache || []; listeners.forEach((l) => l(s)); };

export async function loadShortlist(): Promise<NameItem[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : [];
  } catch { cache = []; }
  return cache!;
}

const persist = () => { AsyncStorage.setItem(KEY, JSON.stringify(cache || [])).catch(() => {}); };

export function isShortlisted(name: string): boolean {
  return !!(cache || []).find((n) => n.name.toLowerCase() === name.toLowerCase());
}

export async function toggleShortlist(item: NameItem): Promise<boolean> {
  await loadShortlist();
  const i = cache!.findIndex((n) => n.name.toLowerCase() === item.name.toLowerCase());
  let added: boolean;
  if (i >= 0) { cache!.splice(i, 1); added = false; }
  else { cache!.unshift(item); added = true; }
  persist(); emit();
  return added;
}

export async function removeShortlist(name: string): Promise<void> {
  await loadShortlist();
  cache = cache!.filter((n) => n.name.toLowerCase() !== name.toLowerCase());
  persist(); emit();
}

export function subscribeShortlist(fn: (items: NameItem[]) => void): () => void {
  listeners.add(fn);
  if (cache) fn(cache);
  return () => listeners.delete(fn);
}
