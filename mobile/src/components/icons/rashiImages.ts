import { ImageSourcePropType } from 'react-native';

// 12 illustrated rashi (zodiac) icons — used across rashifal & daily prediction screens.
export type RashiKey =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export const RASHI_IMAGES: Record<RashiKey, ImageSourcePropType> = {
  aries: require('../../../assets/rashi/aries.png'),
  taurus: require('../../../assets/rashi/taurus.png'),
  gemini: require('../../../assets/rashi/gemini.png'),
  cancer: require('../../../assets/rashi/cancer.png'),
  leo: require('../../../assets/rashi/leo.png'),
  virgo: require('../../../assets/rashi/virgo.png'),
  libra: require('../../../assets/rashi/libra.png'),
  scorpio: require('../../../assets/rashi/scorpio.png'),
  sagittarius: require('../../../assets/rashi/sagittarius.png'),
  capricorn: require('../../../assets/rashi/capricorn.png'),
  aquarius: require('../../../assets/rashi/aquarius.png'),
  pisces: require('../../../assets/rashi/pisces.png'),
};

// English + romanized-Hindi aliases (full forms — no bare "vrish" so taurus/scorpio never collide)
const ALIASES: Record<RashiKey, string[]> = {
  aries: ['aries', 'mesha', 'mesh'],
  taurus: ['taurus', 'vrishabha', 'vrishabh', 'vrushabh', 'vrisabha'],
  gemini: ['gemini', 'mithuna', 'mithun'],
  cancer: ['cancer', 'karka', 'kark'],
  leo: ['leo', 'simha', 'singh'],
  virgo: ['virgo', 'kanya'],
  libra: ['libra', 'tula'],
  scorpio: ['scorpio', 'vrischika', 'vrishchika', 'vrishchik', 'vrushchik'],
  sagittarius: ['sagittarius', 'dhanu', 'dhanus'],
  capricorn: ['capricorn', 'makara', 'makar'],
  aquarius: ['aquarius', 'kumbha', 'kumbh'],
  pisces: ['pisces', 'meena', 'meen'],
};

export function rashiKeyFrom(sign?: string | null): RashiKey | null {
  const compact = String(sign || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!compact) return null;
  for (const key of Object.keys(ALIASES) as RashiKey[]) {
    if (ALIASES[key].some((a) => compact.includes(a))) return key;
  }
  return null;
}

/** Image source for any sign name (English / romanized Hindi); null if unrecognised. */
export function rashiImage(sign?: string | null): ImageSourcePropType | null {
  const key = rashiKeyFrom(sign);
  return key ? RASHI_IMAGES[key] : null;
}
