/**
 * Divine Library — saved (bookmarked) items + per-book reading progress.
 *
 * Ab yeh SERVER-BACKED hai (wahi "future backend seam" jiska yahan zikr tha): source
 * of truth `userDataSync` hai, jo local mirror rakhta hai aur /api/me/data se sync
 * karta hai. Isliye user kisi bhi phone par login kare — bookmarks aur reading
 * progress wapas mil jaate hain. Android Auto-Backup ke bharose nahi rehna padta.
 *
 * Internal shape ab Last-Write-Wins hai ({ id: { on, at } }) taaki "un-bookmark" bhi
 * doosre device tak sahi pahunche (sirf array rakhte to deletion kho jaati). UI ko
 * wahi purana API milta hai — isSaved / toggleSaved / setProgress / useSaved.
 */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getUserDataSnapshot, subscribeUserData, updateUserData, hydrateUserData,
} from './userDataSync';

const LEGACY_SAVED = 'sy.lib.saved';
const LEGACY_PROGRESS = 'sy.lib.progress';
const MIGRATED = 'sy.lib.migrated';

export interface BookProgress { chapter: number; percent: number }

/* ── one-time migration: purana local data → sync store (kuch kho na jaaye) ── */
async function migrateLegacy() {
  try {
    if (await AsyncStorage.getItem(MIGRATED)) return;
    const [s, p] = await Promise.all([
      AsyncStorage.getItem(LEGACY_SAVED),
      AsyncStorage.getItem(LEGACY_PROGRESS),
    ]);
    const patch: any = {};
    if (s) {
      const ids: string[] = JSON.parse(s);
      if (Array.isArray(ids) && ids.length) {
        patch.saved = {};
        // at = 1 → purana data bacha rahega, par koi bhi naya badlaav isse jeet jaayega
        ids.forEach((id) => { patch.saved[id] = { on: true, at: 1 }; });
      }
    }
    if (p) {
      const map = JSON.parse(p);
      if (map && typeof map === 'object') {
        patch.progress = {};
        Object.entries(map).forEach(([id, v]: any) => {
          patch.progress[id] = { chapter: Number(v?.chapter) || 0, percent: Number(v?.percent) || 0, at: 1 };
        });
      }
    }
    if (Object.keys(patch).length) updateUserData(patch);
    await AsyncStorage.setItem(MIGRATED, '1');
  } catch { /* migration best-effort */ }
}

// local mirror hydrate karo, phir purana data usme le aao
hydrateUserData().then(migrateLegacy);

/* ── derived view (stable snapshot so useSyncExternalStore doesn't loop) ── */
let snapshot: { saved: string[]; progress: Record<string, BookProgress>; hydrated: boolean } = {
  saved: [], progress: {}, hydrated: false,
};

function rebuild() {
  const d = getUserDataSnapshot();
  const saved = Object.entries(d.saved)
    .filter(([, v]) => v && v.on)
    .sort((a, b) => (b[1].at || 0) - (a[1].at || 0)) // newest bookmark pehle
    .map(([id]) => id);
  const progress: Record<string, BookProgress> = {};
  Object.entries(d.progress).forEach(([id, v]) => {
    progress[id] = { chapter: Number(v?.chapter) || 0, percent: Number(v?.percent) || 0 };
  });
  snapshot = { saved, progress, hydrated: true };
}
rebuild();
subscribeUserData(rebuild);

function subscribe(cb: () => void) { return subscribeUserData(cb); }
function getSnapshot() { return snapshot; }

export function isSaved(id: string) { return snapshot.saved.includes(id); }

export function toggleSaved(id: string) {
  const on = !isSaved(id);
  // on:false bhi likhte hain (tombstone) — warna un-bookmark doosre device tak nahi pahunchta
  updateUserData({ saved: { [id]: { on, at: Date.now() } } });
}

export function setProgress(id: string, data: BookProgress) {
  updateUserData({ progress: { [id]: { chapter: data.chapter, percent: data.percent, at: Date.now() } } });
}

/** Reactive view of the saved set + progress map. */
export function useLibraryStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Convenience: live saved-state for one id. */
export function useSaved(id: string) {
  const { saved } = useLibraryStore();
  return saved.includes(id);
}
