import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts } from '../theme/tokens';

/**
 * Reader preferences for long-form rashifal text — font-size step + bold-body.
 * Persisted as JSON in AsyncStorage under `sy.rashifal.reading` and cached in
 * module scope so re-entering the screen never flashes the default size.
 *
 * Only READING text consumes this (overall, detailed summary, area texts,
 * remedy bodies, lists…) — headings, pills and labels stay fixed.
 */
const KEY = 'sy.rashifal.reading';

export type ReadingScale = 0.9 | 1 | 1.15;
export const READING_SCALES: readonly ReadingScale[] = [0.9, 1, 1.15] as const;

export interface ReadingPrefs {
  scale: ReadingScale;
  bold: boolean;
}

const DEFAULTS: ReadingPrefs = { scale: 1, bold: false };

// session cache — survives screen remounts, avoids a size "pop" on re-entry
let cached: ReadingPrefs | null = null;

export function useReadingPrefs() {
  const [prefs, setPrefs] = useState<ReadingPrefs>(cached ?? DEFAULTS);
  const ref = useRef(prefs);
  ref.current = prefs;

  useEffect(() => {
    if (cached) return; // already hydrated this session
    let on = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!on || !raw) return;
        try {
          const p = JSON.parse(raw);
          const scale = (READING_SCALES as readonly number[]).includes(p?.scale)
            ? (p.scale as ReadingScale)
            : DEFAULTS.scale;
          const next: ReadingPrefs = { scale, bold: !!p?.bold };
          cached = next;
          setPrefs(next);
        } catch (_) {
          // corrupted JSON → keep defaults
        }
      })
      .catch(() => {
        // storage unavailable → keep defaults
      });
    return () => { on = false; };
  }, []);

  const persist = useCallback((next: ReadingPrefs) => {
    cached = next;
    setPrefs(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setScale = useCallback((scale: ReadingScale) => persist({ ...ref.current, scale }), [persist]);
  const setBold = useCallback((bold: boolean) => persist({ ...ref.current, bold }), [persist]);

  return { scale: prefs.scale, bold: prefs.bold, setScale, setBold };
}

/**
 * Style fragment for reading text — size and line-height scale together,
 * weight follows the bold-body toggle (regular ↔ medium).
 */
export const readingStyle = (scale: number, bold: boolean, size: number, lineHeight: number) => ({
  fontSize: size * scale,
  lineHeight: lineHeight * scale,
  fontFamily: bold ? fonts.interMed : fonts.inter,
});
