/**
 * Design tokens ported from the approved web prototype. The light theme keeps
 * the same hue family but is contrast-tuned for native rendering.
 */

export type ThemeName = 'dark' | 'light';

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
} as const;

export const fonts = {
  // Loaded via @expo-google-fonts in fonts.ts — exact families from the web app
  cinzelRegular: 'Cinzel_400Regular',
  cinzelMed: 'Cinzel_500Medium',
  cinzel: 'Cinzel_700Bold',
  cinzelSemi: 'Cinzel_600SemiBold',
  cinzelXBold: 'Cinzel_800ExtraBold',
  playfair: 'PlayfairDisplay_600SemiBold',
  playfairBold: 'PlayfairDisplay_700Bold',
  inter: 'Inter_400Regular',
  interMed: 'Inter_500Medium',
  interSemi: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
  devanagari: 'NotoSansDevanagari_600SemiBold',
  devanagariBold: 'NotoSansDevanagari_700Bold',
  // Cormorant Garamond — the italic serif used for splash/subscribe taglines
  cormorant: 'CormorantGaramond_500Medium_Italic',
  cormorantR: 'CormorantGaramond_400Regular',
} as const;

export interface Theme {
  name: ThemeName;
  isDark: boolean;
  // Core gold ramp
  gold1: string;
  gold2: string;
  gold3: string;
  gold4: string;
  goldSoft: string;
  goldText: string; // readable gold for body-level gold text
  goldDim: string;
  // Backgrounds & surfaces
  bgDeep: string;
  bgMid: string;
  bgGradient: [string, string, string]; // page backdrop top→bottom
  cardBg: string;
  cardBg2: string;
  cardBorder: string;
  // Text
  text: string;
  textSoft: string;
  textMuted: string;
  // Accents (Vedic)
  blue: string;
  green: string;
  saffron: string;
  red: string;
  purple: string;
  // Heading gradient (gold clipped-text) top→mid→bottom
  headingGradient: [string, string, string];
  // Gold CTA button gradient
  buttonGradient: [string, string, string];
  buttonInk: string;
  // Misc
  line: string;
  ripple: string;
  navInactive: string;
}

export const darkTheme: Theme = {
  name: 'dark',
  isDark: true,
  gold1: '#f6d27a',
  gold2: '#e9b850',
  gold3: '#c9962e',
  gold4: '#8a6418',
  goldSoft: '#fce8a8',
  goldText: '#e6c277',
  goldDim: '#b89a5b',
  bgDeep: '#000000',
  bgMid: '#000000',
  bgGradient: ['#000000', '#000000', '#000000'],
  cardBg: '#000000',
  cardBg2: '#000000',
  cardBorder: 'rgba(201,150,46,0.30)',
  text: '#f3e7c4',
  textSoft: '#d8cba8',
  textMuted: '#9c916f',
  blue: '#4499ff',
  green: '#32cd32',
  saffron: '#ff9900',
  red: '#ff4444',
  purple: '#a07bdc',
  headingGradient: ['#fce8a8', '#e9b850', '#b87f1a'],
  buttonGradient: ['#fce8a8', '#e9b850', '#b87f1a'],
  buttonInk: '#2a1c00',
  line: 'rgba(201,150,46,0.22)',
  ripple: 'rgba(252,232,168,0.20)',
  navInactive: '#8a7a55',
};

export const lightTheme: Theme = {
  name: 'light',
  isDark: false,
  gold1: '#8f5e0f',
  gold2: '#b77919',
  gold3: '#745016',
  gold4: '#6f4b10',
  goldSoft: '#f5e6b8',
  goldText: '#8f5e0f',
  goldDim: '#674f23',
  bgDeep: '#fff8ea',
  bgMid: '#f8ecd7',
  bgGradient: ['#fffaf0', '#fff6e4', '#fff2dd'],
  cardBg: '#ffffff',
  cardBg2: '#fffdf7',
  cardBorder: 'rgba(151,93,12,0.42)',
  text: '#2c2113',
  textSoft: '#4d3f23',
  textMuted: '#5f4d2d',
  blue: '#2a5da8',
  green: '#1f8f4f',
  saffron: '#cf6a1f',
  red: '#c0392b',
  purple: '#7a4fb0',
  headingGradient: ['#6a460c', '#b07e1c', '#7a510e'],
  buttonGradient: ['#f4dfa1', '#d7a23b', '#a86f12'],
  buttonInk: '#2b2113',
  line: 'rgba(151,93,12,0.42)',
  ripple: 'rgba(151,93,12,0.20)',
  navInactive: '#5c4420',
};

export const themes: Record<ThemeName, Theme> = {
  dark: darkTheme,
  light: lightTheme,
};
