/**
 * notifications.ts — device notifications for the app.
 *
 * TWO kinds:
 *  • LOCAL  — scheduled on the phone itself (daily rashifal reminder). Works fully offline,
 *             no server / no Firebase needed.
 *  • PUSH   — the Expo push token is fetched + sent to our backend so the server can push
 *             (festival alerts, admin broadcasts). Delivery on Android needs FCM configured
 *             in the build (google-services.json); until then this fails silently and LOCAL
 *             notifications keep working.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPushToken } from './api';

const DAILY_KEY = 'sy.dailyReminder';
const DAILY_ID = 'daily-rashifal';

// how a notification shows while the app is in the FOREGROUND
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Industry standard: separate channels (categories) so the user can control each type in the
// system settings. Each keeps the brand gold light + a gentle vibration.
const CHANNELS: { id: string; name: string; importance: number }[] = [
  { id: 'default', name: 'General', importance: 4 },              // HIGH
  { id: 'daily', name: 'Daily Rashifal', importance: 4 },         // HIGH
  { id: 'panchang', name: 'Festivals & Panchang', importance: 4 },// HIGH
  { id: 'offers', name: 'Offers & Updates', importance: 3 },      // DEFAULT
  { id: 'account', name: 'Account & Billing', importance: 3 },    // DEFAULT
];

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  for (const c of CHANNELS) {
    await Notifications.setNotificationChannelAsync(c.id, {
      name: c.name,
      importance: c.importance,
      vibrationPattern: [0, 220, 180, 220],
      lightColor: '#e9b850',
    }).catch(() => {});
  }
}

export async function requestPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  } catch { return false; }
}

/** Fetch the native FCM device token and register it with the backend (server sends via FCM). */
export async function registerForPush(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null; // emulators can't get a real push token
    await ensureAndroidChannel();
    if (!(await requestPermission())) return null;
    const res = await Notifications.getDevicePushTokenAsync(); // native FCM token on Android
    const token = res && typeof res.data === 'string' ? res.data : null;
    if (token) await registerPushToken(token).catch(() => {});
    return token;
  } catch {
    return null; // FCM not ready yet → skip; local notifications still work
  }
}

export type DailyReminder = { on: boolean; hour: number; minute: number };

export async function getDailyReminder(): Promise<DailyReminder> {
  try {
    const r = await AsyncStorage.getItem(DAILY_KEY);
    return r ? JSON.parse(r) : { on: false, hour: 8, minute: 0 };
  } catch { return { on: false, hour: 8, minute: 0 }; }
}

/** Turn the daily "आज का राशिफल" reminder on/off at a chosen time (local, offline). */
export async function setDailyReminder(on: boolean, hour = 8, minute = 0): Promise<boolean> {
  await AsyncStorage.setItem(DAILY_KEY, JSON.stringify({ on, hour, minute })).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  if (!on) return true;
  await ensureAndroidChannel();
  if (!(await requestPermission())) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: '🌅 आज का राशिफल तैयार है',
      body: 'आपका आज का व्यक्तिगत राशिफल देखें — शुभ रंग, अंक और समय के साथ।',
      data: { screen: 'DailyPrediction' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'default' },
  });
  return true;
}

/** Fire a sample notification a few seconds from now so the user can verify it works. */
export async function sendTestNotification(): Promise<boolean> {
  await ensureAndroidChannel();
  if (!(await requestPermission())) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Shree Yantra',
      body: 'सूचनाएँ चालू हैं ✨ — अब आपको राशिफल, मुहूर्त और पर्व की जानकारी समय पर मिलेगी।',
      data: { screen: 'Notifications' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: 'default' },
  });
  return true;
}

/** Deep-link when the user TAPS a notification. Returns an unsubscribe fn. */
export function addTapListener(onScreen: (screen: string, params?: any) => void) {
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const data = resp.notification.request.content.data as any;
    if (data?.screen) onScreen(data.screen, data.params);
  });
  return () => sub.remove();
}
