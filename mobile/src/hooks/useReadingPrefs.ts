import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts } from '../theme/tokens';

/**
 * Reader preferences for long-form rashifal text — font-size step + font-weight step.
 * Persisted as JSON in AsyncStorage under `sy.rashifal.reading` and cached in
 * module scope so re-entering the screen never flashes the default size.
 *
 * Only READING text consumes this (overall, detailed summary, area texts,
 * remedy bodies, lists…) — headings, pills and labels stay fixed.
 */
const KEY = 'sy.rashifal.reading';

export type ReadingScale = 0.9 | 1 | 1.15;
export const READING_SCALES: readonly ReadingScale[] = [0.9, 1, 1.15] as const;

/** 0 = regular, 1 = medium, 2 = semibold — A−/A+ jaisa hi weight−/weight+ */
export type ReadingWeight = 0 | 1 | 2;
export const READING_WEIGHTS: readonly ReadingWeight[] = [0, 1, 2] as const;
const WEIGHT_FONTS = [fonts.inter, fonts.interMed, fonts.interSemi] as const;

export interface ReadingPrefs {
  scale: ReadingScale;
  weight: ReadingWeight;
}

const DEFAULTS: ReadingPrefs = { scale: 1, weight: 0 };

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
          // migration: purana {bold:boolean} → weight (bold tha to medium)
          const weight = (READING_WEIGHTS as readonly number[]).includes(p?.weight)
            ? (p.weight as ReadingWeight)
            : (p?.bold ? 1 : DEFAULTS.weight);
          const next: ReadingPrefs = { scale, weight };
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
  const setWeight = useCallback((weight: ReadingWeight) => persist({ ...ref.current, weight }), [persist]);

  // A− / A+ — bounds par chup-chaap ruk jaata hai
  const stepScale = useCallback((dir: 1 | -1) => {
    const i = READING_SCALES.indexOf(ref.current.scale);
    const nx = READING_SCALES[Math.min(READING_SCALES.length - 1, Math.max(0, i + dir))];
    if (nx !== ref.current.scale) persist({ ...ref.current, scale: nx });
  }, [persist]);
  // weight− / weight+
  const stepWeight = useCallback((dir: 1 | -1) => {
    const nx = Math.min(2, Math.max(0, ref.current.weight + dir)) as ReadingWeight;
    if (nx !== ref.current.weight) persist({ ...ref.current, weight: nx });
  }, [persist]);

  return {
    scale: prefs.scale,
    weight: prefs.weight,
    /** compat: purane call-sites ke liye — weight>0 = bold jaisa */
    bold: prefs.weight > 0,
    setScale,
    setWeight,
    stepScale,
    stepWeight,
  };
}

/**
 * Style fragment for reading text — size and line-height scale together,
 * weight follows the weight step (regular / medium / semibold).
 * `boldOrWeight` boolean bhi leta hai (purane call-sites) — true = medium.
 */
export const readingStyle = (scale: number, boldOrWeight: boolean | number, size: number, lineHeight: number) => {
  const w = typeof boldOrWeight === 'number' ? Math.min(2, Math.max(0, boldOrWeight)) : (boldOrWeight ? 1 : 0);
  return {
    fontSize: size * scale,
    lineHeight: lineHeight * scale,
    fontFamily: WEIGHT_FONTS[w],
  };
};
