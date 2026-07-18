import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
  /** rendered FIXED above the scroll (e.g. BrandHeader) so it stays put while content scrolls */
  header?: React.ReactNode;
}

/** Page wrapper: theme nebula backdrop + safe area + optional scroll + fixed header. */
export function Screen({ children, scroll = true, contentStyle, tabPadding = true, header }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Tab par WAPAS aane par page top se dikhe (freezeOnBlur scroll position bachaa
  // leta tha — Library aadhi scroll karke Home ja kar lautne par wahi se khulta tha).
  const scrollRef = useRef<ScrollView>(null);
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const padded = [
    // when a fixed header is present it occupies the safe-area top, so the scroll body
    // only needs a small gap (no double insets.top padding).
    { paddingTop: header ? space[2] : insets.top + space[2], paddingHorizontal: 18, width: '100%' as const, maxWidth: 480, alignSelf: 'center' as const },
    tabPadding && { paddingBottom: 118 + insets.bottom },
    contentStyle,
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.bgDeep }]}>
      <CosmicBackground />
      {header ? <View style={{ zIndex: 20 }}>{header}</View> : null}
      {scroll ? (
        <KeyboardAwareScroll
          ref={scrollRef}
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
