import * as Haptics from 'expo-haptics';

/* Thin, crash-safe wrappers around expo-haptics.
   Every call is fire-and-forget and swallows errors (some devices/emulators
   have no haptic motor), so UI code can call these freely. */

export const hTap = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
export const hPress = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); };
export const hSelect = () => { Haptics.selectionAsync().catch(() => {}); };
export const hSuccess = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };
export const hError = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}); };
