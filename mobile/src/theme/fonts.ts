import { useFonts as useExpoFonts } from 'expo-font';
import {
  Cinzel_400Regular,
  Cinzel_500Medium,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
  Cinzel_800ExtraBold,
} from '@expo-google-fonts/cinzel';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium_Italic,
} from '@expo-google-fonts/cormorant-garamond';

/**
 * Loads the exact font families used in the approved web design.
 * Returns [loaded, error] so the app can still start if a font fails to load
 * (otherwise the startup gate would hang on a black screen).
 */
export function useAppFonts(): [boolean, Error | null] {
  const [loaded, error] = useExpoFonts({
    Cinzel_400Regular,
    Cinzel_500Medium,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    Cinzel_800ExtraBold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansDevanagari_600SemiBold,
    NotoSansDevanagari_700Bold,
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium_Italic,
  });
  return [loaded, error ?? null];
}
