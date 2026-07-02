export type NetworkActivityKey =
  | 'generic'
  | 'kundli'
  | 'brihat'
  | 'varga'
  | 'dasha'
  | 'gochar'
  | 'reading'
  | 'remedies'
  | 'panchang'
  | 'ai'
  | 'auth'
  | 'content'
  | 'profile'
  | 'match'
  | 'forecast'
  | 'vastu'
  | 'location';

export interface NetworkActivityMeta {
  key: NetworkActivityKey;
  titleEn: string;
  titleHi: string;
  detailEn?: string;
  detailHi?: string;
  /** true = heavy initial/awaited load → full cosmic loader. false/absent = background
   *  fetch → only a subtle non-blocking top bar (never blocks scroll). */
  primary?: boolean;
}

export interface NetworkActivityItem extends NetworkActivityMeta {
  id: number;
  startedAt: number;
}

export interface NetworkActivitySnapshot {
  active: boolean;
  count: number;
  /** any in-flight request that warrants the full-screen cosmic loader */
  primaryActive: boolean;
  items: NetworkActivityItem[];
  latest: NetworkActivityItem | null;
}

type Listener = (snapshot: NetworkActivitySnapshot) => void;

const listeners = new Set<Listener>();
const items = new Map<number, NetworkActivityItem>();
let nextId = 1;
// On navigation we hide requests that were ALREADY running for a while (the previous
// screen's). A request started within ~600ms of the nav is the NEW screen's own fetch
// (React Navigation runs the child's effect before onStateChange), so it keeps showing.
let staleBeforeTs = 0;

function snapshot(): NetworkActivitySnapshot {
  const list = Array.from(items.values()).filter((i) => i.startedAt >= staleBeforeTs).sort((a, b) => a.startedAt - b.startedAt);
  return {
    active: list.length > 0,
    count: list.length,
    primaryActive: list.some((i) => i.primary),
    items: list,
    latest: list.length ? list[list.length - 1] : null,
  };
}

function emit() {
  const s = snapshot();
  listeners.forEach((listener) => listener(s));
}

export function subscribeNetworkActivity(listener: Listener) {
  listeners.add(listener);
  listener(snapshot());
  return () => {
    listeners.delete(listener);
  };
}

/** On navigation: hide loaders for requests that were already running (the previous screen),
 *  but KEEP showing any fetch that started within the last ~600ms — that's the new screen's
 *  own load (its effect runs just before this). Time-based → robust against the effect-order
 *  race that an id threshold would lose to. */
export function markActivityStale() {
  staleBeforeTs = Date.now() - 600;
  emit();
}

/** Hard clear — kept for safety; markActivityStale is preferred on navigation. */
export function resetNetworkActivity() {
  if (items.size === 0) return;
  items.clear();
  emit();
}

export function beginNetworkActivity(meta: NetworkActivityMeta | null | undefined) {
  if (!meta) return () => {};
  const id = nextId++;
  let ended = false;
  items.set(id, { ...meta, id, startedAt: Date.now() });
  emit();
  return () => {
    if (ended) return;
    ended = true;
    items.delete(id);
    emit();
  };
}
