/**
 * Lightweight analytics — events batch karke backend ko bhejta hai.
 * Location backend IP se nikalta hai (GPS permission nahi chahiye).
 * deviceId persistent (anonymous), sessionId per app-launch.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackAnalytics, AnalyticsEventIn } from './api';
import { getStoredUser } from './auth';

const DEVICE_KEY = 'sy.deviceId';
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

async function flush() {
  timer = null;
  if (!queue.length) return;
  const events = queue;
  queue = [];
  try {
    const did = await getDeviceId();
    const u = await getStoredUser().catch(() => null);
    await trackAnalytics({
      deviceId: did,
      sessionId,
      userId: u ? u.id : null,
      platform: Platform.OS,
      osVersion: String(Platform.Version),
      appVersion: '1.0.0',
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

export function initAnalytics() {
  track('app_open');
}
