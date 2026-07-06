/**
 * premiumStore — tiny app-wide premium flag (placeholder / demo unlock).
 *
 * There is no real payment gateway yet, so "subscribing" (Payment success) just flips this
 * persisted flag on, and the buried Cancel flips it off. The whole app presents as a premium
 * product; this only decides whether the member badge shows PREMIUM vs a subtle "Go Premium"
 * prompt. Combine with the backend user.plan via isPremiumNow().
 */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sy.premium';
let premium = false;
const listeners = new Set<() => void>();

// hydrate once at startup
AsyncStorage.getItem(KEY).then((v) => {
  if (v === '1' && !premium) { premium = true; listeners.forEach((l) => l()); }
}).catch(() => {});

function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }

export function getPremium() { return premium; }
export function setPremium(v: boolean) {
  if (premium === v) return;
  premium = v;
  AsyncStorage.setItem(KEY, v ? '1' : '0').catch(() => {});
  listeners.forEach((l) => l());
}

/** Reactive hook — re-renders when the local premium flag changes. */
export function usePremium(): boolean {
  return useSyncExternalStore(subscribe, getPremium, getPremium);
}

/** True if the user is premium either from the backend plan or the local demo unlock. */
export function isPremiumNow(userPlan?: string | null) {
  return userPlan === 'premium' || premium;
}
