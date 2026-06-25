import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import { CosmicBackground } from './CosmicBackground';
import { KeyboardAwareScroll } from './KeyboardAwareScroll';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** extra bottom padding so content clears the tab bar */
  tabPadding?: boolean;
}

/** Page wrapper: theme nebula backdrop + safe area + optional scroll. */
export function Screen({ children, scroll = true, contentStyle, tabPadding = true }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const padded = [
    { paddingTop: insets.top + space[2], paddingHorizontal: 18, width: '100%' as const, maxWidth: 480, alignSelf: 'center' as const },
    tabPadding && { paddingBottom: 118 + insets.bottom },
    contentStyle,
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.bgDeep }]}>
      <CosmicBackground />
      {scroll ? (
        <KeyboardAwareScroll
          contentContainerStyle={padded}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
          overScrollMode="never"
          decelerationRate="fast"
          removeClippedSubviews={false}
        >
          {children}
        </KeyboardAwareScroll>
      ) : (
        <View style={[styles.flex, padded]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, flex: { flex: 1 } });
