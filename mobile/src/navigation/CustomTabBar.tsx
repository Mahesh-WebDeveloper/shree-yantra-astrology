import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs, RadialGradient, Stop, Ellipse, Circle,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/LanguageProvider';
import { fonts } from '../theme/tokens';
import { GradientText } from '../components/GradientText';
import { hTap } from '../lib/haptics';
import { usePlayer } from '../audio/PlayerProvider';
import {
  HomeIcon, ChoghadiyaIcon, KundliIcon, LibraryIcon, ProfileIcon, IconProps,
} from '../components/icons/NavIcons';

/** Height of the nav bar's content area ABOVE the safe-area inset. The docked
    NowPlayingBar sits exactly `insets.bottom + NAV_CONTENT_HEIGHT` from the screen
    bottom, so player + nav bar read as ONE continuous card. */
export const NAV_CONTENT_HEIGHT = 74;
/** Rounded top corners of the unified bottom card — owned by the nav bar when idle,
    handed to the docked NowPlayingBar while music plays. */
export const NAV_TOP_RADIUS = 20;

const ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  Home: HomeIcon,
  Choghadiya: ChoghadiyaIcon,
  Kundli: KundliIcon,
  Library: LibraryIcon,
  Profile: ProfileIcon,
};

/** Active-tab medallion: soft radial gold glow + a delicate gradient ring
    around the icon. Pure static SVG — only its wrapper's opacity animates. */
function Medallion({ dark }: { dark: boolean }) {
  return (
    <Svg width={52} height={44} viewBox="0 0 52 44">
      <Defs>
        <RadialGradient id="navGlow" cx="50%" cy="48%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={dark ? '#fce8a8' : '#e0a52e'} stopOpacity={dark ? 0.38 : 0.4} />
          <Stop offset="55%" stopColor="#e9b850" stopOpacity={0.11} />
          <Stop offset="82%" stopColor="#e9b850" stopOpacity={0} />
        </RadialGradient>
        <SvgLinearGradient id="navRing" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={dark ? '#fce8a8' : '#92400e'} stopOpacity={dark ? 0.55 : 0.45} />
          <Stop offset="100%" stopColor={dark ? '#c9962e' : '#92400e'} stopOpacity={dark ? 0.12 : 0.1} />
        </SvgLinearGradient>
      </Defs>
      <Ellipse cx={26} cy={21} rx={26} ry={21} fill="url(#navGlow)" />
      <Circle cx={26} cy={21} r={16.5} stroke="url(#navRing)" strokeWidth={1} fill="none" />
    </Svg>
  );
}

/** One tab. All motion lives in Reanimated worklets on the UI THREAD, so the glow and
    icon spring stay perfectly smooth even while the tab press mounts a heavy screen and
    blocks JS — which is exactly when the old JS-driven traveling indicator stuttered.
    (No traveling indicator here, ever: each tab's medallion/tick fades IN PLACE.) */
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
  const focus = useSharedValue(focused ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    focus.value = withSpring(focused ? 1 : 0, { damping: 14, stiffness: 180, mass: 0.6 });
  }, [focused, focus]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: focus.value }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(focus.value, [0, 1], [0, -3]) },
      { scale: interpolate(focus.value, [0, 1], [1, 1.12]) * interpolate(press.value, [0, 1], [1, 0.86]) },
    ],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(focus.value, [0, 1], [1, -1]) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { press.value = withTiming(1, { duration: 80 }); }}
      onPressOut={() => { press.value = withSpring(0, { damping: 12, stiffness: 240 }); }}
      hitSlop={4}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={styles.item}
    >
      <View style={styles.iconZone}>
        <Animated.View style={[styles.glowWrap, glowStyle]} pointerEvents="none">
          <Medallion dark={isDark} />
        </Animated.View>
        <Animated.View style={iconStyle}>
          <Icon
            color={focused ? activeColor : inactiveColor}
            size={26}
            fillOpacity={focused ? 0.2 : 0.1}
          />
        </Animated.View>
      </View>

      <Animated.View style={labelStyle}>
        {focused ? (
          <GradientText style={styles.label}>{label}</GradientText>
        ) : (
          <Text style={[styles.label, { color: inactiveColor }]} numberOfLines={1}>{label}</Text>
        )}
      </Animated.View>

      {/* baseline tick under the active tab — fades with the glow, no travel */}
      <Animated.View style={[styles.tickWrap, glowStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(233,184,80,0)', isDark ? '#f6d27a' : '#c9962e', 'rgba(233,184,80,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.tick}
        />
      </Animated.View>
    </Pressable>
  );
}

/** Bottom nav — an edge-to-edge card FLUSH with the screen bottom: square bottom
    corners, safe-area inset padded INSIDE, rounded top corners with a fading gold
    hairline along the top edge. When music plays the NowPlayingBar docks directly
    on top: it takes over the rounded corners + hairline while our top squares off
    (UI-thread timing on borderRadius/opacity), so the two read as one card. */
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.isDark;
  const t = useT();

  // usePlayer() is the COLD context (discrete events only, never position ticks),
  // so this re-renders only when a track starts/stops — cheap.
  const { track } = usePlayer();
  const docked = !!track;

  const dock = useSharedValue(docked ? 1 : 0);
  useEffect(() => {
    dock.value = withTiming(docked ? 1 : 0, { duration: 160 });
  }, [docked, dock]);

  // corner + hairline handoff — pure UI-thread, no layout work
  const cornerStyle = useAnimatedStyle(() => ({
    borderTopLeftRadius: interpolate(dock.value, [0, 1], [NAV_TOP_RADIUS, 0]),
    borderTopRightRadius: interpolate(dock.value, [0, 1], [NAV_TOP_RADIUS, 0]),
  }));
  const hairlineStyle = useAnimatedStyle(() => ({ opacity: 1 - dock.value }));

  return (
    <Animated.View
      style={[
        styles.host,
        {
          backgroundColor: isDark ? '#0a0912' : '#ffffff',
          paddingBottom: insets.bottom, // safe area lives INSIDE the bar → flush to the edge
        },
        cornerStyle,
      ]}
    >
      {/* gold top hairline + soft inner sheen — hidden while the player owns the top edge */}
      <Animated.View style={[styles.hairlineWrap, hairlineStyle]} pointerEvents="none">
        <LinearGradient
          colors={isDark
            ? ['rgba(252,232,168,0)', 'rgba(252,232,168,0.85)', 'rgba(233,184,80,0.55)', 'rgba(252,232,168,0)']
            : ['rgba(146,64,14,0)', 'rgba(146,64,14,0.55)', 'rgba(146,64,14,0.32)', 'rgba(146,64,14,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.hairline}
        />
        <LinearGradient
          colors={isDark
            ? ['rgba(233,184,80,0.09)', 'rgba(233,184,80,0)']
            : ['rgba(146,64,14,0.05)', 'rgba(146,64,14,0)']}
          style={styles.sheen}
        />
      </Animated.View>

      <View style={styles.row}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  /* edge-to-edge card, flush with the physical bottom: square bottom corners,
     rounded top corners (animated off while the player is docked above) */
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 14,
  },
  row: {
    flexDirection: 'row',
    height: NAV_CONTENT_HEIGHT,
    paddingHorizontal: 8,
    paddingTop: 2,
  },

  /* top-edge gold accent: 1.5px fading hairline + a whisper of gold sheen below it */
  hairlineWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 26 },
  hairline: { height: 1.5 },
  sheen: { flex: 1 },

  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconZone: { width: 48, height: 34, alignItems: 'center', justifyContent: 'center' },
  glowWrap: { position: 'absolute', top: -5, alignItems: 'center', justifyContent: 'center' },
  tickWrap: { position: 'absolute', bottom: 5, left: 0, right: 0, alignItems: 'center' },
  tick: { width: 32, height: 2.5, borderRadius: 2 },
  label: { fontSize: 9.5, lineHeight: 12, letterSpacing: 0.1, fontFamily: fonts.cinzel, fontWeight: '600' },
});
