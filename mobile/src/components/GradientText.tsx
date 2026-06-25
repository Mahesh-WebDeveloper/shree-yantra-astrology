import React from 'react';
import { Text, TextStyle, StyleProp, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  /** override gradient colours; defaults to the theme heading gradient */
  colors?: [string, string, string];
}

/**
 * Gold clipped-text headings — the RN equivalent of the web app's
 * `background-clip: text` gold gradient titles (Cinzel/Playfair).
 */
export function GradientText({ children, style, colors }: Props) {
  const { theme } = useTheme();
  const grad = colors ?? theme.headingGradient;
  return (
    <MaskedView
      maskElement={
        <Text style={[{ backgroundColor: 'transparent' }, style]}>{children}</Text>
      }
    >
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        {/* invisible text reserves the exact layout box */}
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
