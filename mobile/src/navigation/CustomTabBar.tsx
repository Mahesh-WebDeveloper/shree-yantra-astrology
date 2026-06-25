import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/LanguageProvider';
import { fonts } from '../theme/tokens';
import { GradientText } from '../components/GradientText';
import { hTap } from '../lib/haptics';
import {
  HomeIcon, ChoghadiyaIcon, KundliIcon, LibraryIcon, ProfileIcon, IconProps,
} from '../components/icons/NavIcons';

const ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  Home: HomeIcon,
  Choghadiya: ChoghadiyaIcon,
  Kundli: KundliIcon,
  Library: LibraryIcon,
  Profile: ProfileIcon,
};

/** Soft radial glow halo behind the active icon — exact port of the web
    `.sy-bottom-nav__item::after` (borderless warm gold radial). */
function GlowPill({ dark }: { dark: boolean }) {
  return (
    <Svg width={48} height={38} viewBox="0 0 48 38">
      <Defs>
        <RadialGradient id="navGlow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={dark ? '#fce8a8' : '#e0a52e'} stopOpacity={dark ? 0.32 : 0.4} />
          <Stop offset="55%" stopColor="#e9b850" stopOpacity={0.10} />
          <Stop offset="78%" stopColor="#e9b850" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={24} cy={19} rx={24} ry={19} fill="url(#navGlow)" />
    </Svg>
  );
}

/** One tab — animates glow + icon lift smoothly when focus changes
    (mirrors the web's 220–340ms cubic-bezier transitions). */
function TabItem({
  focused, label, Icon, onPress, isDark, activeColor, inactiveColor,
}: {
  focused: boolean;
  label: string;
  Icon: (p: IconProps) => React.ReactElement;
  onPress: () => void;
  isDark: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 260,
      easing: Easing.bezier(0.2, 0.7, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [focused, anim]);

  const lift = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      android_ripple={{ color: isDark ? 'rgba(252,232,168,0.12)' : 'rgba(151,93,12,0.12)', borderless: false }}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={styles.item}
    >
      {({ pressed }) => (
        <>
          <View style={styles.iconZone}>
            {/* glow fades in/out instead of popping */}
            <Animated.View style={[styles.glowWrap, { opacity: anim }]} pointerEvents="none">
              <GlowPill dark={isDark} />
            </Animated.View>
            <Animated.View style={{ transform: [{ translateY: lift }, { scale }] }}>
              <View style={{ transform: [{ scale: pressed ? 0.88 : 1 }] }}>
                <Icon
                  color={focused ? activeColor : inactiveColor}
                  size={26}
                  fillOpacity={focused ? 0.18 : 0.1}
                />
              </View>
            </Animated.View>
          </View>

          {focused ? (
            <GradientText style={styles.label}>{label}</GradientText>
          ) : (
            <Text style={[styles.label, { color: inactiveColor }]} numberOfLines={1}>{label}</Text>
          )}
        </>
      )}
    </Pressable>
  );
}

/** Bottom nav — the web `.sy-bottom-nav` reimagined as a floating pill:
    rounded dark-glass bar hovering above the home indicator, gold hairline
    ring, soft radial glow + smooth lift/scale on the active icon,
    Cinzel labels (gold-gradient when active). */
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.isDark;
  const t = useT();

  /* scrim colours — fade scrolling content into a solid base so nothing shows
     through the gaps around/below the floating pill */
  const scrim = isDark
    ? (['rgba(0,0,0,0)', '#000000', '#000000'] as const)
    : (['rgba(255,248,234,0)', '#fff8ea', '#fff8ea'] as const);

  return (
    <View style={styles.host} pointerEvents="box-none">
      {/* solid fade behind + below the pill */}
      <LinearGradient
        colors={scrim}
        locations={[0, 0.22, 1]}
        style={[styles.scrim, { height: insets.bottom + 112 }]}
        pointerEvents="none"
      />

      <View
        style={[
          styles.bar,
          {
            bottom: insets.bottom + 10,
            backgroundColor: isDark ? 'rgba(8,7,15,0.98)' : 'rgba(255,253,247,0.99)',
            borderColor: isDark ? 'rgba(201,150,46,0.38)' : theme.cardBorder,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = (options.tabBarLabel as string) ?? t(`tab.${route.name.toLowerCase()}`, route.name);
          const Icon = ICONS[route.name] ?? HomeIcon;

          const onPress = () => {
            hTap();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TabItem
              key={route.key}
              focused={focused}
              label={label}
              Icon={Icon}
              onPress={onPress}
              isDark={isDark}
              activeColor={isDark ? '#f6d27a' : theme.gold1}
              inactiveColor={isDark ? 'rgba(214,176,92,0.92)' : theme.navInactive}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* full-bleed host pinned to the screen bottom — only the pill captures touches */
  host: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  /* solid scrim that fades content out behind / below the floating pill */
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0 },

  /* Floating pill — rounded on all corners, gold hairline ring, deep shadow */
  bar: {
    flexDirection: 'row',
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 28,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 5, paddingBottom: 4, borderRadius: 22, overflow: 'hidden' },
  iconZone: { width: 48, height: 34, alignItems: 'center', justifyContent: 'center' },
  glowWrap: { position: 'absolute', top: -2, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 9.5, letterSpacing: 0.1, fontFamily: fonts.cinzel, fontWeight: '600' },
});
