import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { TopBar } from './TopBar';
import { CosmicBackground } from './CosmicBackground';
import { KeyboardAwareScroll } from './KeyboardAwareScroll';

interface Props {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  onRight?: () => void;
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Stack-screen scaffold: nebula backdrop + TopBar + scrollable body. */
export function Page({ title, onBack, right, onRight, children, scroll = true, contentStyle }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const padded = [styles.content, { paddingBottom: insets.bottom + 28 }, contentStyle];

  return (
    <View style={[styles.fill, { backgroundColor: theme.bgDeep }]}>
      <CosmicBackground />
      <TopBar title={title} onBack={onBack} right={right} onRight={onRight} />
      {scroll ? (
        <KeyboardAwareScroll contentContainerStyle={padded} showsVerticalScrollIndicator={false}>
          {children}
        </KeyboardAwareScroll>
      ) : (
        <View style={[styles.fill, padded]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
});
