/**
 * Lightweight analytics — events batch karke backend ko bhejta hai.
 *
 * LOCATION: pehle DEVICE GPS (accurate, permission ke saath) — kyunki IP-geo
 * Indian mobile carriers (Jio/Airtel CGNAT) par galat hoti hai: pura IP block ek
 * hi sheher par map ho jaata hai (Jodhpur ka user "Hyderabad" dikhta tha).
 * Permission na mile to backend chup-chaap IP fallback use karta hai (approx).
 * Coords low-accuracy (city-level) hain aur 30 min cache hote hain — battery-safe.
 *
 * deviceId persistent (anonymous), sessionId per app-launch.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceCoords } from './deviceLocation';
import { trackAnalytics, AnalyticsEventIn } from './api';
import { getStoredUser } from './auth';

const DEVICE_KEY = 'sy.deviceId';
const GPS_TTL_MS = 30 * 60 * 1000; // refresh coords at most every 30 min

// Real app version from app.json (Expo config) — '1.0.0' fallback
let APP_VERSION = '1.0.0';
try {
  const appJson = require('../../app.json');
  APP_VERSION = appJson?.expo?.version || '1.0.0';
} catch (_) { /* keep fallback */ }
let deviceId: string | null = null;
const sessionId = `s-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let queue: AnalyticsEventIn[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let lastScreen = '';

async function getDeviceId(): Promise<string> {
  if (deviceId) return deviceId;
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `d-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    await AsyncStorage.setItem(DEVICE_KEY, id).catch(() => {});
  }
  deviceId = id;
  return id;
}

function getDeviceMeta(): { deviceBrand?: string; deviceModel?: string } {
  try {
    const c = (Platform as any).constants;
    if (!c) return {};
    const brand = c.Brand || c.Manufacturer;
    const model = c.Model;
    return {
      deviceBrand: brand ? String(brand) : undefined,
      deviceModel: model ? String(model) : undefined,
    };
  } catch (_) { return {}; }
}

async function flush() {
  timer = null;
  if (!queue.length) return;
  const events = queue;
  queue = [];
  try {
    const did = await getDeviceId();
    const u = await getStoredUser().catch(() => null);
    const meta = getDeviceMeta();
    const gps = await getDeviceCoords().catch(() => null);
    await trackAnalytics({
      deviceId: did,
      sessionId,
      userId: u ? u.id : null,
      platform: Platform.OS,
      osVersion: String(Platform.Version),
      appVersion: APP_VERSION,
      deviceBrand: meta.deviceBrand,
      deviceModel: meta.deviceModel,
      gps: gps || undefined,
      events,
    });
  } catch (_) { /* analytics best-effort — fail silent */ }
}

export function track(name: string, screen?: string, props?: any) {
  queue.push({ name, screen, props });
  if (!timer) timer = setTimeout(flush, 1500);
}

export function trackScreen(screen: string) {
  if (!screen || screen === lastScreen) return; // duplicate consecutive skip
  lastScreen = screen;
  track('screen_view', screen);
}

/** User action event (no screen attached) — alias of track. */
export function trackAction(name: string, props?: any) {
  track(name, undefined, props);
}

/** Search event — kind: 'location' | 'baby_names' | ... */
export function trackSearch(kind: string, query: string) {
  track('search', undefined, { kind, q: String(query).slice(0, 80) });
}

export function initAnalytics() {
  track('app_open');
}
