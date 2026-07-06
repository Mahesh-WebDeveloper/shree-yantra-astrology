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

const PROJECT_ID = '9b966b0c-f9bf-404f-a82b-c7566494b28b'; // from app.json extra.eas.projectId
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

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#e9b850',
  }).catch(() => {});
}

export async function requestPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  } catch { return false; }
}

/** Fetch the Expo push token and register it with the backend (for server-sent push). */
export async function registerForPush(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null; // emulators can't get a real push token
    await ensureAndroidChannel();
    if (!(await requestPermission())) return null;
    const res = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    const token = res?.data || null;
    if (token) await registerPushToken(token).catch(() => {});
    return token;
  } catch {
    return null; // FCM not set up yet on Android → skip; local notifications still work
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

/** Deep-link when the user TAPS a notification. Returns an unsubscribe fn. */
export function addTapListener(onScreen: (screen: string, params?: any) => void) {
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const data = resp.notification.request.content.data as any;
    if (data?.screen) onScreen(data.screen, data.params);
  });
  return () => sub.remove();
}
