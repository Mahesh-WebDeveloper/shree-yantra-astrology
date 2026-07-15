import React, { useEffect, useRef, useState } from 'react';
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

/** Soft radial glow that rides INSIDE the travelling indicator. */
function GlowPill({ dark }: { dark: boolean }) {
  return (
    <Svg width={56} height={44} viewBox="0 0 56 44">
      <Defs>
        <RadialGradient id="navGlow" cx="50%" cy="46%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={dark ? '#fce8a8' : '#e0a52e'} stopOpacity={dark ? 0.4 : 0.42} />
          <Stop offset="55%" stopColor="#e9b850" stopOpacity={0.12} />
          <Stop offset="80%" stopColor="#e9b850" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={28} cy={20} rx={28} ry={20} fill="url(#navGlow)" />
    </Svg>
  );
}

/** One tab — icon springs up/scales when focused; the shared indicator slides in behind it. */
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
    // spring, not timing — the icon should feel like it lands, not arrives on schedule
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      speed: 16,
      bounciness: 7,
      useNativeDriver: true,
    }).start();
  }, [focused, anim]);

  const lift = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const labelLift = anim.interpolate({ inputRange: [0, 1], outputRange: [1, -1] });

  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={styles.item}
    >
      {({ pressed }) => (
        <>
          <View style={styles.iconZone}>
            <Animated.View style={{ transform: [{ translateY: lift }, { scale }] }}>
              <View style={{ transform: [{ scale: pressed ? 0.86 : 1 }] }}>
                <Icon
                  color={focused ? activeColor : inactiveColor}
                  size={26}
                  fillOpacity={focused ? 0.2 : 0.1}
                />
              </View>
            </Animated.View>
          </View>

          <Animated.View style={{ transform: [{ translateY: labelLift }] }}>
            {focused ? (
              <GradientText style={styles.label}>{label}</GradientText>
            ) : (
              <Text style={[styles.label, { color: inactiveColor }]} numberOfLines={1}>{label}</Text>
            )}
          </Animated.View>
        </>
      )}
    </Pressable>
  );
}

/** Bottom nav — floating dark-glass pill with a gold-gradient hairline ring and a
    SLIDING indicator: one soft gold glow + baseline tick that physically travels
    between tabs on a spring, instead of five glows fading independently. */
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.isDark;
  const t = useT();

  const count = state.routes.length;
  const [innerW, setInnerW] = useState(0);          // bar width minus horizontal padding
  const itemW = innerW > 0 ? innerW / count : 0;

  // travelling indicator — springs to the active tab's slot
  const slide = useRef(new Animated.Value(state.index)).current;
  useEffect(() => {
    Animated.spring(slide, { toValue: state.index, speed: 14, bounciness: 8, useNativeDriver: true }).start();
  }, [state.index, slide]);
  const translateX = slide.interpolate({
    inputRange: [0, Math.max(count - 1, 1)],
    outputRange: [0, Math.max(itemW * (count - 1), 1)],
  });

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
        <View
          style={[styles.bar, { backgroundColor: isDark ? 'rgba(8,7,15,0.98)' : '#ffffff' }]}
          onLayout={(e) => setInnerW(e.nativeEvent.layout.width - styles.bar.paddingHorizontal * 2)}
        >
          {/* the travelling glow + baseline tick (behind the items) */}
          {itemW > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[styles.indicator, { width: itemW, transform: [{ translateX }] }]}
            >
              <View style={styles.indicatorGlow}>
                <GlowPill dark={isDark} />
              </View>
              <LinearGradient
                colors={['rgba(233,184,80,0)', isDark ? '#f6d27a' : theme.gold1, 'rgba(233,184,80,0)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.indicatorTick}
              />
            </Animated.View>
          )}

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
    overflow: 'hidden',        // clips the sliding indicator at the rounded ends
  },
  /* travelling indicator — one slot wide, glow centred on the icon zone */
  indicator: { position: 'absolute', top: 0, bottom: 0, left: 8, alignItems: 'center', justifyContent: 'flex-start' },
  indicatorGlow: { marginTop: 2, alignItems: 'center' },
  indicatorTick: { position: 'absolute', bottom: 2, width: 34, height: 2.5, borderRadius: 2 },

  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 5, paddingBottom: 6, borderRadius: 22 },
  iconZone: { width: 48, height: 34, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 9.5, letterSpacing: 0.1, fontFamily: fonts.cinzel, fontWeight: '600' },
});
