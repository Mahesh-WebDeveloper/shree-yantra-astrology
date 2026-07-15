import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate,
} from 'react-native-reanimated';
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

/** Soft radial glow halo behind the active icon. */
function GlowPill({ dark }: { dark: boolean }) {
  return (
    <Svg width={52} height={40} viewBox="0 0 52 40">
      <Defs>
        <RadialGradient id="navGlow" cx="50%" cy="48%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={dark ? '#fce8a8' : '#e0a52e'} stopOpacity={dark ? 0.38 : 0.42} />
          <Stop offset="55%" stopColor="#e9b850" stopOpacity={0.11} />
          <Stop offset="80%" stopColor="#e9b850" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={26} cy={19} rx={26} ry={19} fill="url(#navGlow)" />
    </Svg>
  );
}

/** One tab. All motion lives in Reanimated worklets on the UI THREAD, so the glow and
    icon spring stay perfectly smooth even while the tab press mounts a heavy screen and
    blocks JS — which is exactly when the old JS-driven traveling indicator stuttered. */
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
          <GlowPill dark={isDark} />
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

/** Bottom nav — floating dark-glass pill with a gold-gradient hairline ring.
    No traveling background: each tab's glow/tick fades in place on the UI thread. */
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.isDark;
  const t = useT();

  /* scrim colours — fade scrolling content into a solid base so nothing shows
     through the gaps around/below the floating pill */
  const scrim = isDark
    ? (['rgba(0,0,0,0)', '#000000', '#000000'] as const)
    : (['rgba(255,255,255,0)', '#ffffff', '#ffffff'] as const);

  return (
    <View style={styles.host} pointerEvents="box-none">
      {/* solid fade behind + below the pill */}
      <LinearGradient
        colors={scrim}
        locations={[0, 0.22, 1]}
        style={[styles.scrim, { height: insets.bottom + 112 }]}
        pointerEvents="none"
      />

      {/* gold-gradient hairline ring: 1px gradient frame around the dark pill */}
      <LinearGradient
        colors={isDark
          ? ['rgba(252,232,168,0.55)', 'rgba(201,150,46,0.35)', 'rgba(120,84,20,0.45)']
          : ['rgba(201,150,46,0.5)', 'rgba(176,115,22,0.28)', 'rgba(201,150,46,0.5)']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.ring, { bottom: insets.bottom + 10 }]}
      >
        <View style={[styles.bar, { backgroundColor: isDark ? 'rgba(8,7,15,0.98)' : '#ffffff' }]}>
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
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  /* full-bleed host pinned to the screen bottom — only the pill captures touches */
  host: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  /* solid scrim that fades content out behind / below the floating pill */
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0 },

  /* gradient hairline frame — 1px of gold gradient all around the pill */
  ring: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 28,
    padding: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  /* Floating pill — sits inside the gradient ring */
  bar: {
    flexDirection: 'row',
    borderRadius: 27,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },

  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 5, paddingBottom: 6, borderRadius: 22 },
  iconZone: { width: 48, height: 34, alignItems: 'center', justifyContent: 'center' },
  glowWrap: { position: 'absolute', top: -3, alignItems: 'center', justifyContent: 'center' },
  tickWrap: { position: 'absolute', bottom: 1, left: 0, right: 0, alignItems: 'center' },
  tick: { width: 30, height: 2.5, borderRadius: 2 },
  label: { fontSize: 9.5, letterSpacing: 0.1, fontFamily: fonts.cinzel, fontWeight: '600' },
});
