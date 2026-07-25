/** Real mobile app screenshots — single source of truth for the showcase. */

export type ScreenCrop = {
  /** Percent cropped from top (Android status bar). */
  top: number
  /** Percent cropped from bottom (Android system nav only — app tab bar stays). */
  bottom: number
  /** Scale inside frame to hide crop edges. */
  scale?: number
  objectPosition?: string
}

export type AppScreenId =
  | 'home'
  | 'home_services'
  | 'choghadiya'
  | 'kundli'
  | 'kundli_hub'
  | 'panchang'
  | 'rashifal'
  | 'ai'
  | 'muhurat'
  | 'muhurat_result'
  | 'milan'
  | 'gita'
  | 'gita_chapter'
  | 'library'
  | 'vedic_reading'
  | 'transit'
  | 'numerology'

export type AppScreen = {
  id: AppScreenId
  src: string
  alt: { en: string; hi: string }
  crop: ScreenCrop
}

import home from '@/assets/showcase/Screenshot_20260724_153758.jpg'
import homeServices from '@/assets/showcase/Screenshot_20260724_153806.jpg'
import choghadiya from '@/assets/showcase/Screenshot_20260724_153843.jpg'
import kundli from '@/assets/showcase/Screenshot_20260724_153915.jpg'
import kundliHub from '@/assets/showcase/Screenshot_20260724_153922.jpg'
import panchang from '@/assets/showcase/Screenshot_20260724_154050.jpg'
import rashifal from '@/assets/showcase/Screenshot_20260724_154058.jpg'
import ai from '@/assets/showcase/Screenshot_20260724_154106.jpg'
import muhurat from '@/assets/showcase/Screenshot_20260724_154134.jpg'
import muhuratResult from '@/assets/showcase/Screenshot_20260724_154147.jpg'
import milan from '@/assets/showcase/Screenshot_20260724_154124.jpg'
import gita from '@/assets/showcase/Screenshot_20260724_153949.jpg'
import gitaChapter from '@/assets/showcase/Screenshot_20260724_154006.jpg'
import library from '@/assets/showcase/Screenshot_20260724_154821.jpg'
import vedicReading from '@/assets/showcase/Screenshot_20260724_161015.jpg'
import transit from '@/assets/showcase/Screenshot_20260724_160935.jpg'
import numerology from '@/assets/showcase/Screenshot_20260724_154217.jpg'

/** Tab-bar screens: crop Android status bar + system nav; keep app tab bar. */
const TAB_CROP: ScreenCrop = { top: 3.8, bottom: 5.2, scale: 1 }
/** Inner screens (no bottom tabs): smaller bottom crop. */
const INNER_CROP: ScreenCrop = { top: 3.8, bottom: 4.2, scale: 1 }

export const APP_SCREENS: Record<AppScreenId, AppScreen> = {
  home: {
    id: 'home',
    src: home,
    alt: { en: 'Shree Yantraa home screen with daily panchang and rashifal', hi: 'श्री यंत्रा होम — पंचांग और राशिफल' },
    crop: TAB_CROP,
  },
  home_services: {
    id: 'home_services',
    src: homeServices,
    alt: { en: 'App service cards — kundli, rashifal and AI astrologer', hi: 'ऐप सेवा कार्ड — कुंडली, राशिफल, AI' },
    crop: TAB_CROP,
  },
  choghadiya: {
    id: 'choghadiya',
    src: choghadiya,
    alt: { en: 'Choghadiya — auspicious time for daily activities', hi: 'चौघड़िया — दैनिक शुभ समय' },
    crop: TAB_CROP,
  },
  kundli: {
    id: 'kundli',
    src: kundli,
    alt: { en: 'Birth kundli chart with North, South and East styles', hi: 'जन्म कुंडली — उत्तर, दक्षिण, पूर्व शैली' },
    crop: { top: 3.8, bottom: 4.5, scale: 1, objectPosition: '50% 48%' },
  },
  kundli_hub: {
    id: 'kundli_hub',
    src: kundliHub,
    alt: { en: 'Kundli services — milan, gochar, dasha and reports', hi: 'कुंडली सेवाएँ — मिलान, गोचर, दशा' },
    crop: TAB_CROP,
  },
  panchang: {
    id: 'panchang',
    src: panchang,
    alt: { en: 'Daily panchang with tithi, nakshatra and sunrise', hi: 'दैनिक पंचांग — तिथि, नक्षत्र, सूर्योदय' },
    crop: INNER_CROP,
  },
  rashifal: {
    id: 'rashifal',
    src: rashifal,
    alt: { en: 'Personal rashifal with daily, weekly and monthly tabs', hi: 'व्यक्तिगत राशिफल — दैनिक, साप्ताहिक' },
    crop: INNER_CROP,
  },
  ai: {
    id: 'ai',
    src: ai,
    alt: { en: 'AI Vedic astrologer — ask questions from your chart', hi: 'AI वैदिक ज्योतिषी — कुंडली से पूछें' },
    crop: INNER_CROP,
  },
  muhurat: {
    id: 'muhurat',
    src: muhurat,
    alt: { en: 'Shubh muhurat finder for marriage, home and vehicle', hi: 'शुभ मुहूर्त — विवाह, गृह, वाहन' },
    crop: INNER_CROP,
  },
  muhurat_result: {
    id: 'muhurat_result',
    src: muhuratResult,
    alt: { en: 'Muhurat result with score and auspicious time window', hi: 'मुहूर्त परिणाम — स्कोर और शुभ समय' },
    crop: INNER_CROP,
  },
  milan: {
    id: 'milan',
    src: milan,
    alt: { en: '36-guna kundli milan for marriage compatibility', hi: '36 गुण कुंडली मिलान' },
    crop: INNER_CROP,
  },
  gita: {
    id: 'gita',
    src: gita,
    alt: { en: 'Bhagavad Gita — 18 chapters, 700 verses', hi: 'भगवद्गीता — 18 अध्याय, 700 श्लोक' },
    crop: INNER_CROP,
  },
  gita_chapter: {
    id: 'gita_chapter',
    src: gitaChapter,
    alt: { en: 'Gita chapter reader with Sanskrit and Hindi meaning', hi: 'गीता अध्याय — संस्कृत और हिंदी अर्थ' },
    crop: INNER_CROP,
  },
  library: {
    id: 'library',
    src: library,
    alt: { en: 'Divine library — aarti sangrah with audio', hi: 'दिव्य पुस्तकालय — आरती संग्रह' },
    crop: TAB_CROP,
  },
  vedic_reading: {
    id: 'vedic_reading',
    src: vedicReading,
    alt: { en: 'Vedic phaladesh — traditional birth analysis', hi: 'वैदिक फलादेश — पारंपरिक जन्म विश्लेषण' },
    crop: INNER_CROP,
  },
  transit: {
    id: 'transit',
    src: transit,
    alt: { en: 'Year-by-year transit forecast timeline', hi: 'साल-दर-साल गोचर समयरेखा' },
    crop: INNER_CROP,
  },
  numerology: {
    id: 'numerology',
    src: numerology,
    alt: { en: 'Numerology — mulank, bhagyank and name number', hi: 'अंकशास्त्र — मूलांक, भाग्यांक' },
    crop: INNER_CROP,
  },
}

/** Screens shown in the sticky scroll tour (order matters). */
export const SCROLL_SHOWCASE_SCREENS: AppScreenId[] = [
  'home',
  'kundli',
  'rashifal',
  'panchang',
  'choghadiya',
  'ai',
  'muhurat_result',
  'library',
]

export function getScreen(id: AppScreenId): AppScreen {
  return APP_SCREENS[id]
}
