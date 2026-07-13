/**
 * Secure storage — SIRF sensitive cheezon ke liye (auth token, entitlement).
 *
 * KYUN: Android ka Auto-Backup (allowBackup=true) app ka AsyncStorage Google Drive
 * par backup kar deta hai, aur reinstall par wapas restore kar deta hai. Wo user ke
 * liye ACHHA hai (bookmarks, jaap counts, language bach jaate hain) — par auth token
 * kabhi cloud backup me nahi jana chahiye (OWASP MASVS MSTG-STORAGE-8).
 *
 * AsyncStorage sab keys ek hi SQLite file me rakhta hai, isliye us file me se sirf
 * token ko exclude karna possible nahi. Isliye token yahan aata hai:
 * expo-secure-store → Android Keystore se encrypted. Keystore ki key DEVICE-BOUND
 * hoti hai aur backup/transfer me nahi jaati — yaani token kisi doosre device par
 * restore hokar bhi kaam nahi kar sakta. Rooted-device/adb se padhna bhi mushkil.
 *
 * Fallback: agar SecureStore kisi device par fail kare, to AsyncStorage par gir jaate
 * hain — user logged-out na ho jaaye (availability > perfection).
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// SecureStore keys me '.' allowed nahi — 'sy.token' → 'sy_token'
const secureKey = (k: string) => k.replace(/\./g, '_');

export async function secureGet(key: string): Promise<string | null> {
  try {
    const v = await SecureStore.getItemAsync(secureKey(key));
    if (v != null) return v;
  } catch { /* SecureStore unavailable → fallback */ }
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(secureKey(key), value);
    // purani plaintext copy (agar thi) hata do — warna wahi backup me chali jaayegi
    await AsyncStorage.removeItem(key).catch(() => {});
    return;
  } catch { /* fallback below */ }
  try { await AsyncStorage.setItem(key, value); } catch { /* ignore */ }
}

export async function secureDelete(key: string): Promise<void> {
  try { await SecureStore.deleteItemAsync(secureKey(key)); } catch { /* ignore */ }
  try { await AsyncStorage.removeItem(key); } catch { /* ignore */ }
}

/**
 * MIGRATION — purane app me token AsyncStorage me plaintext pada tha. Naye app ke
 * pehle launch par use SecureStore me le jaao aur plaintext mita do. Isse pehle se
 * logged-in users logout NAHI honge, aur unka token backup se bhi nikal jaayega.
 * Idempotent — baar-baar chalane par kuch nahi bigadta.
 */
export async function migrateToSecure(keys: string[]): Promise<void> {
  for (const k of keys) {
    try {
      const sk = secureKey(k);
      const already = await SecureStore.getItemAsync(sk).catch(() => null);
      if (already != null) {
        await AsyncStorage.removeItem(k).catch(() => {}); // plaintext safai
        continue;
      }
      const legacy = await AsyncStorage.getItem(k).catch(() => null);
      if (legacy != null) {
        await SecureStore.setItemAsync(sk, legacy);
        await AsyncStorage.removeItem(k).catch(() => {});
      }
    } catch { /* is key ko chhod do — app chalta rahe */ }
  }
}
