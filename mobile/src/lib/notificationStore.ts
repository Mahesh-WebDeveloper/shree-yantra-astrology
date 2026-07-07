/**
 * notificationStore — app-wide LIVE unread notification count.
 *
 * The header bell badge and the Notifications screen both read this, so the count updates
 * everywhere without a page refresh: a push arriving bumps it, opening/reading/clearing
 * adjusts it, and refreshUnread() re-syncs the truth from the server.
 */
import { useSyncExternalStore } from 'react';
import { getUnreadCount, getAuthToken } from './api';

let unread = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const getSnapshot = () => unread;

export function getUnread() { return unread; }

export function setUnread(n: number) {
  const v = Math.max(0, Math.floor(n) || 0);
  if (v === unread) return;
  unread = v;
  emit();
}

/** Optimistic +/- (e.g. a push arrived, or a single item was read). */
export function bumpUnread(delta: number) { setUnread(unread + delta); }

/** Reactive hook — the bell badge re-renders whenever the count changes. */
export function useUnreadCount(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

let inflight = false;
/** Re-sync the count from the server (call on app start, screen focus, push received). */
export async function refreshUnread() {
  if (!getAuthToken()) { setUnread(0); return; }
  if (inflight) return;
  inflight = true;
  try {
    const r = await getUnreadCount();
    setUnread(r.unreadCount || 0);
  } catch {
    /* offline — keep last known count */
  } finally {
    inflight = false;
  }
}
