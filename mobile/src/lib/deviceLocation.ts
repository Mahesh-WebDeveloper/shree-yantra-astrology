/**
 * Device ki CURRENT location — ek hi jagah, poore app ke liye.
 *
 * KYUN ZAROORI: Panchang aur Choghadiya user ke ABHI ke sheher par depend karte hain
 * (sunrise/sunset se tithi, nakshatra aur choghadiya ke timings bante hain). Pehle ye
 * JANM-STHAAN use karte the — Jodhpur me paida hua banda Delhi me baitha ho to usko
 * galat sunrise/tithi dikhta tha. Janm-sthaan sirf KUNDLI ke liye hai.
 *
 * Permission ek hi baar maangi jaati hai (app start par, analytics ke saath). Mana kar
 * diya to sab kuch pehle jaisa chalta hai — profile ke place par fallback.
 *
 * Battery-safe: Accuracy.Low (city-level kaafi hai), pehle last-known position (instant,
 * zero battery), coords 30 min cache. Sab kuch fail-silent.
 */
import * as Location from 'expo-location';

export type Coords = { lat: number; lng: number; accuracy?: number };

const TTL_MS = 30 * 60 * 1000; // 30 min

let cache: Coords | null = null;
let cacheAt = 0;
let denied = false; // mana kar diya → dobara mat pucho
let asked = false;
let cityCache: string | null = null;

/** Current coords (permission mile to). Na mile → null → caller fallback kare. */
export async function getDeviceCoords(): Promise<Coords | null> {
  if (denied) return null;
  if (cache && Date.now() - cacheAt < TTL_MS) return cache; // fresh enough
  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      if (asked) { denied = true; return null; } // pehle hi pooch chuke, mana kar diya
      asked = true;
      ({ status } = await Location.requestForegroundPermissionsAsync());
      if (status !== 'granted') { denied = true; return null; }
    }
    // last-known pehle (instant, zero battery); na mile to ek low-accuracy fix
    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: TTL_MS })) ||
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    if (!pos?.coords) return null;
    cache = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : undefined,
    };
    cacheAt = Date.now();
    return cache;
  } catch {
    return null; // location services off / koi bhi error → fallback
  }
}

/** Sheher ka naam (dikhane ke liye) — on-device reverse geocode, network ke bina bhi chal jaata hai. */
export async function getDeviceCity(): Promise<string | null> {
  if (cityCache) return cityCache;
  const c = await getDeviceCoords();
  if (!c) return null;
  try {
    const [p] = await Location.reverseGeocodeAsync({ latitude: c.lat, longitude: c.lng });
    const name = p?.city || p?.subregion || p?.district || p?.region || null;
    if (name) cityCache = name;
    return cityCache;
  } catch {
    return null;
  }
}

/** Panchang/Choghadiya ke liye ready location: GPS mile to coords, warna diya hua place. */
export async function locationForPanchang(fallbackPlace: string): Promise<{ lat?: number; lng?: number; place?: string; city: string; fromGps: boolean }> {
  const c = await getDeviceCoords();
  if (!c) return { place: fallbackPlace, city: fallbackPlace, fromGps: false };
  const city = (await getDeviceCity()) || fallbackPlace;
  return { lat: c.lat, lng: c.lng, city, fromGps: true };
}
