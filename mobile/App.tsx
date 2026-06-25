import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { useAppFonts } from './src/theme/fonts';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppDrawerHost } from './src/navigation/AppDrawerHost';
import { navigationRef } from './src/navigation/navigationRef';
import { PlayerProvider } from './src/audio/PlayerProvider';
import { NowPlayingBar } from './src/audio/NowPlayingBar';
import { FullPlayer } from './src/audio/FullPlayer';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { DialogProvider } from './src/components/DialogProvider';
import { AppConfigProvider } from './src/context/AppConfigProvider';
import { LanguageProvider } from './src/i18n/LanguageProvider';
import { initAnalytics, trackScreen } from './src/lib/analytics';

SplashScreen.preventAutoHideAsync().catch(() => {});

const TAB_ROUTE_NAMES = new Set(['Home', 'Choghadiya', 'Kundli', 'Library', 'Profile', 'Main']);

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent' },
};

function Root() {
  const { theme, ready } = useTheme();
  const [fontsLoaded, fontError] = useAppFonts();
  const [routeName, setRouteName] = useState<string | undefined>();

  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const showApp = ready && (fontsLoaded || !!fontError || waited);

  useEffect(() => {
    if (showApp) SplashScreen.hideAsync().catch(() => {});
  }, [showApp]);

  if (!showApp) {
    return <View style={{ flex: 1, backgroundColor: theme.bgDeep }} />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => {
        initAnalytics();
        const r = navigationRef.getCurrentRoute();
        setRouteName(r?.name);
        if (r) trackScreen(r.name);
      }}
      onStateChange={() => {
        const r = navigationRef.getCurrentRoute();
        setRouteName(r?.name);
        if (r) trackScreen(r.name);
      }}
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <LanguageProvider>
      <AppConfigProvider>
        <DialogProvider>
          <PlayerProvider>
            <RootNavigator />
            <NowPlayingBar hasBottomNav={TAB_ROUTE_NAMES.has(routeName || '')} />
            {/* full-screen player (tap the mini-bar) — above content, below the drawer */}
            <FullPlayer />
            {/* custom side drawer — overlays everything, opened via openAppDrawer() */}
            <AppDrawerHost />
          </PlayerProvider>
        </DialogProvider>
      </AppConfigProvider>
      </LanguageProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <Root />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
