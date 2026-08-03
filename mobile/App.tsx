import React, { useEffect, useRef, useState } from 'react';
import { View, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { useAppFonts } from './src/theme/fonts';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppDrawerHost } from './src/navigation/AppDrawerHost';
import { navigationRef, resetTo } from './src/navigation/navigationRef';
import { PlayerProvider } from './src/audio/PlayerProvider';
import { NowPlayingBar } from './src/audio/NowPlayingBar';
import { FullPlayer } from './src/audio/FullPlayer';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { DialogProvider } from './src/components/DialogProvider';
import { CosmicLoadingOverlay } from './src/components/CosmicLoadingOverlay';
import { markActivityStale } from './src/lib/networkActivity';
import { AppConfigProvider } from './src/context/AppConfigProvider';
import { LanguageProvider } from './src/i18n/LanguageProvider';
import { initAnalytics, trackScreen } from './src/lib/analytics';
import { addTapListener, addReceivedListener, registerForPush } from './src/lib/notifications';
import { getAuthToken, setSessionRevokedHandler, setSubscriptionRequiredHandler } from './src/lib/api';
import { clearAuth } from './src/lib/auth';
import { refreshUnread, bumpUnread } from './src/lib/notificationStore';

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
  const lastRouteRef = useRef<string | undefined>(undefined);

  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const showApp = ready && (fontsLoaded || !!fontError || waited);

  useEffect(() => {
    if (showApp) SplashScreen.hideAsync().catch(() => {});
  }, [showApp]);

  // SINGLE-DEVICE SESSION: if the backend revokes this session (account signed in on
  // another device), force-logout to the login screen with a clear message. Debounced
  // so a burst of concurrent 401s only triggers one logout.
  useEffect(() => {
    let firing = false;
    setSessionRevokedHandler(() => {
      if (firing) return;
      firing = true;
      clearAuth().catch(() => {}).finally(() => {
        resetTo('PhoneAuth');
        Alert.alert(
          'सत्र समाप्त · Session ended',
          'आपका अकाउंट किसी दूसरे डिवाइस पर लॉगिन हुआ है। सुरक्षा के लिए इस डिवाइस से लॉगआउट कर दिया गया है।\n\nYour account was signed in on another device, so you have been logged out here for security.',
        );
        setTimeout(() => { firing = false; }, 3000);
      });
    });
    return () => setSessionRevokedHandler(null);
  }, []);

  // Backend entitlement is authoritative. If a paid request returns 402, move the
  // user back to the subscription screen instead of trusting stale local state.
  useEffect(() => {
    let firing = false;
    setSubscriptionRequiredHandler(() => {
      if (firing) return;
      firing = true;
      resetTo('Subscribe');
      Alert.alert(
        'सदस्यता आवश्यक · Subscription required',
        'इस सुविधा का उपयोग करने के लिए सक्रिय सदस्यता आवश्यक है।\n\nAn active subscription is required to use this feature.',
      );
      setTimeout(() => { firing = false; }, 2500);
    });
    return () => setSubscriptionRequiredHandler(null);
  }, []);

  // Notifications: deep-link when the user taps one, and (if already logged in) register the
  // push token with the backend. Fresh logins register from PhoneAuth after saveAuth.
  useEffect(() => {
    const unsub = addTapListener((screen, params) => {
      try { (navigationRef as any)?.navigate(screen, params); } catch {}
      refreshUnread(); // opening one may change the count
    });
    // a push arriving while the app is open bumps the live badge instantly
    const unsubRecv = addReceivedListener(() => bumpUnread(1));
    const t = setTimeout(() => { if (getAuthToken()) { registerForPush(); refreshUnread(); } }, 1500);
    return () => { unsub(); unsubRecv(); clearTimeout(t); };
  }, []);

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
        // moved to a different screen → clear any loader still in flight from the previous
        // screen, so e.g. the "Calculating Kundli" loader never shows on the Choghadiya page.
        if (r?.name && r.name !== lastRouteRef.current) {
          lastRouteRef.current = r.name;
          markActivityStale();
        }
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
            <CosmicLoadingOverlay />
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
