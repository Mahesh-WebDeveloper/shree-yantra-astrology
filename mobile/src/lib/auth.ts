/**
 * Auth session — token + user ko AsyncStorage me persist karta hai aur
 * api client ke Authorization header se sync rakhta hai.
 *
 * App start par bootstrapAuth() call karo → token storage se load hokar
 * api ko mil jaata hai (protected calls chalti rehti hain).
 *
 * Register/Login success par saveAuth(token,user) — ye sy.profile bhi seed
 * karta hai taaki kundli/panchang/choghadiya screens birth details utha sakein.
 */
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, AuthUser } from './api';

const TOKEN_KEY = 'sy.token';
const USER_KEY = 'sy.user';
const PROFILE_KEY = 'sy.profile'; // birth.ts isi se padhta hai

// server user.profile (dob 'DD-MM-YYYY') → sy.profile shape (dob 'YYYY-MM-DD')
function syncLocalProfile(user: AuthUser) {
  const p = user.profile || {};
  if (!p.dob || !p.tob || (!p.place && (p.lat == null || p.lng == null))) return; // adhura profile → skip (default use hoga)
  const [d, mo, y] = String(p.dob).split('-');
  const iso = y && mo && d ? `${y}-${mo}-${d}` : p.dob;
  const local = { name: user.name, dob: iso, tob: p.tob, place: p.place || `${p.lat},${p.lng}`, gender: p.gender, lat: p.lat, lng: p.lng };
  return AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(local)).catch(() => {});
}

export async function saveAuth(token: string, user: AuthUser) {
  setAuthToken(token);
  await AsyncStorage.multiSet([[TOKEN_KEY, token], [USER_KEY, JSON.stringify(user)]]);
  await syncLocalProfile(user);
}

export async function clearAuth() {
  setAuthToken(null);
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** App start par token storage se load karke api client ko de do. */
export async function bootstrapAuth(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) { setAuthToken(token); return true; }
  } catch {}
  return false;
}

/** Stored user me partial merge karke wapas save (profile bhi deep-merge). */
export async function updateStoredUser(patch: Partial<AuthUser>): Promise<AuthUser | null> {
  const cur = await getStoredUser();
  if (!cur) return null;
  const next: AuthUser = {
    ...cur,
    ...patch,
    profile: { ...(cur.profile || {}), ...(patch.profile || {}) },
  };
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
  return next;
}

/** Screen me current logged-in user — focus par refresh hota hai. */
export function useCurrentUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);
  useFocusEffect(
    useCallback(() => {
      let on = true;
      getStoredUser().then((u) => { if (on) setUser(u); });
      return () => { on = false; };
    }, [])
  );
  return user;
}
