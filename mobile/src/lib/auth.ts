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
import { setAuthToken, AuthUser, getMe } from './api';
import { secureGet, secureSet, secureDelete, migrateToSecure } from './secureStore';

const TOKEN_KEY = 'sy.token';
const PREMIUM_KEY = 'sy.premium'; // entitlement — backup se restore hokar paywall bypass na ho
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
  // TOKEN → SecureStore (Keystore-encrypted, device-bound). Cloud backup me nahi
  // jaata, isliye reinstall/doosre device par restore hokar login nahi kar sakta.
  await secureSet(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  await syncLocalProfile(user);
}

export async function clearAuth() {
  // logout par is user ka local chat cache bhi hata do — agle user ko kabhi
  // pichle user ki chat na dikhe (DB me uski history surakshit rehti hai).
  const prev = await getStoredUser().catch(() => null);
  setAuthToken(null);
  await secureDelete(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
  if (prev?.id) await AsyncStorage.removeItem(`sy.chat.${prev.id}`).catch(() => {});
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
    await migrateToSecure([TOKEN_KEY, PREMIUM_KEY]); // purane plaintext token ko Keystore me le jao
    const token = await secureGet(TOKEN_KEY);
    if (token) { setAuthToken(token); return true; }
  } catch {}
  return false;
}

/** Is the signed-in user's onboarding actually finished (name + birth details)? */
export function isProfileComplete(user: AuthUser | null): boolean {
  const p = user?.profile;
  return !!(user?.name && p?.dob && p?.tob && (p?.place || (p?.lat != null && p?.lng != null)));
}

/**
 * Where the app should open on launch — resumes the onboarding at the right step so an
 * abandoned flow can't slip into Home as the placeholder "Friend" user, and the paywall
 * isn't bypassed by killing & reopening the app:
 *  - no token                                 → 'PhoneAuth' (log in)
 *  - token, not subscribed                    → 'Subscribe' (finish the paywall)
 *  - token, subscribed, profile incomplete    → 'BirthDetails' (finish setup)
 *  - token, subscribed, profile complete      → 'Main'
 */
export async function getStartRoute(): Promise<'LanguageSelect' | 'Subscribe' | 'BirthDetails' | 'Main'> {
  try {
    await migrateToSecure([TOKEN_KEY, PREMIUM_KEY]); // pehle launch par plaintext → Keystore
    const token = await secureGet(TOKEN_KEY);
    if (!token) return 'LanguageSelect'; // fresh: pick language → login → subscribe → …
    setAuthToken(token);

    // SESSION VALIDATION: sirf local token par bharosa mat karo. Account DB se delete
    // ho sakta hai, block ho sakta hai, ya doosre device par login se revoke ho sakta
    // hai — phir bhi app "logged in" khulta tha. Server se ek baar poocho.
    //   401 (AUTH_INVALID / SESSION_REVOKED) → session mar chuka hai → logout.
    //   network error (offline) → FAIL-OPEN: cached user se chalne do, warna offline
    //   user bina wajah logout ho jaayega.
    let fresh: AuthUser | null = null;
    const SESSION_CHECK_MS = 6000; // slow network par splash na atke
    try {
      const check = getMe();
      check.catch(() => {}); // race ke baad bhi unhandled rejection na ho
      const settled = await Promise.race([
        check.then((r) => r.user),
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), SESSION_CHECK_MS)),
      ]);
      if (settled) {
        fresh = settled;
        await updateStoredUser(fresh); // plan/profile bhi taaza ho jaata hai
      }
      // timeout hua → fail-open (cached se chalte hain). Agar wo call baad me 401 de,
      // to pehli hi API call par global handler force-logout kar dega.
    } catch (e: any) {
      if (e?.status === 401) {
        // account delete/blocked (AUTH_INVALID) ya doosre device par login (SESSION_REVOKED)
        await clearAuth();
        return 'LanguageSelect';
      }
      // offline / server down → cached data se aage badho
    }

    const [prem, stored] = await Promise.all([secureGet(PREMIUM_KEY), getStoredUser()]);
    const user = fresh || stored;
    const subscribed = prem === '1' || user?.plan === 'premium';
    if (!subscribed) return 'Subscribe';
    return isProfileComplete(user) ? 'Main' : 'BirthDetails';
  } catch {
    return 'LanguageSelect';
  }
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
