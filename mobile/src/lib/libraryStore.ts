/**
 * Local persistence for the Divine Library — saved (bookmarked) items and
 * per-book reading progress. Module-level store + subscribe hook so the
 * Library screen and the Reader stay in sync without prop-drilling.
 *
 * This is the seam the future backend slots into: swap the AsyncStorage reads
 * for `GET /me/library/saved` and `GET /me/library/progress` and keep the same
 * shape. See the LibraryItem contract in data/library.ts.
 */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_KEY = 'sy.lib.saved';
const PROGRESS_KEY = 'sy.lib.progress';

export interface BookProgress { chapter: number; percent: number }

let saved: string[] = [];
let progress: Record<string, BookProgress> = {};
let hydrated = false;
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

async function hydrate() {
  try {
    const [s, p] = await Promise.all([AsyncStorage.getItem(SAVED_KEY), AsyncStorage.getItem(PROGRESS_KEY)]);
    if (s) saved = JSON.parse(s);
    if (p) progress = JSON.parse(p);
  } catch (_) { /* first run */ }
  hydrated = true;
  refreshSnapshot(); // IMPORTANT: warna getSnapshot stale (empty, hydrated:false) snapshot deta rahega
  emit();
}
hydrate();

/* ── snapshot (stable references so useSyncExternalStore doesn't loop) ── */
let snapshot = { saved, progress, hydrated };
function refreshSnapshot() { snapshot = { saved, progress, hydrated }; }
function getSnapshot() { return snapshot; }
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }

export function isSaved(id: string) { return saved.includes(id); }

export function toggleSaved(id: string) {
  saved = saved.includes(id) ? saved.filter((x) => x !== id) : [id, ...saved];
  AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved)).catch(() => {});
  refreshSnapshot(); emit();
}

export function setProgress(id: string, data: BookProgress) {
  progress = { ...progress, [id]: data };
  AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {});
  refreshSnapshot(); emit();
}

/** Reactive view of the saved set + progress map. */
export function useLibraryStore() {
  // re-emit a fresh snapshot whenever data changes
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return snap;
}

/** Convenience: live saved-state for one id. */
export function useSaved(id: string) {
  const { saved: s } = useLibraryStore();
  return s.includes(id);
}
