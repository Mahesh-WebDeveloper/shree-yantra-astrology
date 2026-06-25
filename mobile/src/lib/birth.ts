/**
 * Saved profile (sy.profile from EditProfile) se kundli ke liye birth-details banata hai.
 * EditProfile saves: { name, dob: 'YYYY-MM-DD', tob: 'HH:MM' ya 'HH:MM AM/PM', place: '...' }
 * VedAstro chahiye: dob 'DD-MM-YYYY', tob 24h 'HH:MM'. Place backend geocode karega.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KundliInput } from './api';
import { getStoredUser } from './auth';

const PROFILE_KEY = 'sy.profile';

// "06:42", "6:42 AM", "06:42 PM" → 24h "HH:MM"
function to24h(tob: string): string | null {
  const m = String(tob).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2];
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  if (h < 0 || h > 23) return null;
  return `${h < 10 ? '0' : ''}${h}:${min}`;
}

export interface BirthDetails extends KundliInput {
  name?: string;
}

/** sy.profile (YYYY-MM-DD) se birth details. */
async function fromLocalProfile(): Promise<BirthDetails | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p.dob || !p.tob || !p.place) return null;
    const [y, mo, d] = String(p.dob).split('-');
    if (!y || !mo || !d) return null;
    const tob = to24h(p.tob);
    if (!tob) return null;
    return { dob: `${d}-${mo}-${y}`, tob, tz: p.tz || '+05:30', place: p.place, name: p.name, lat: p.lat, lng: p.lng };
  } catch {
    return null;
  }
}

/** Logged-in user ke server profile (dob 'DD-MM-YYYY') se birth details. */
async function fromStoredUser(): Promise<BirthDetails | null> {
  try {
    const u = await getStoredUser();
    const p = u?.profile;
    if (!p || !p.dob || !p.tob) return null;
    if (!p.place && (p.lat == null || p.lng == null)) return null; // place ya coords chahiye
    const tob = to24h(p.tob);
    if (!tob) return null;
    // server dob already 'DD-MM-YYYY'; safety ke liye agar 'YYYY-MM-DD' aaya to flip
    let dob = String(p.dob);
    const parts = dob.split('-');
    if (parts[0] && parts[0].length === 4) dob = `${parts[2]}-${parts[1]}-${parts[0]}`;
    return { dob, tob, tz: p.tz || '+05:30', place: p.place, lat: p.lat, lng: p.lng, name: u?.name };
  } catch {
    return null;
  }
}

/**
 * Birth details for kundli/predictions. Pehle local sy.profile, warna logged-in user ka
 * server profile. Dono na ho to null (caller testing-default use karega).
 */
export async function birthFromProfile(): Promise<BirthDetails | null> {
  return (await fromLocalProfile()) || (await fromStoredUser());
}
