import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeName, themes } from './tokens';

const STORE_KEY = 'sy.theme';
// bump this to force every install back to the dark default once (clears any
// stale 'light' preference saved during testing)
const DEFAULT_DARK_MIGRATION = 'sy.theme.defaultDark.v1';

interface ThemeCtx {
  theme: Theme;
  name: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
  ready: boolean;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Dark is the client-approved default (matches the web app).
  const [name, setName] = useState<ThemeName>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const migrated = await AsyncStorage.getItem(DEFAULT_DARK_MIGRATION);
        if (!migrated) {
          // one-time: enforce dark as the default, clearing any stale preference
          setName('dark');
          await AsyncStorage.setItem(STORE_KEY, 'dark');
          await AsyncStorage.setItem(DEFAULT_DARK_MIGRATION, '1');
        } else {
          const saved = await AsyncStorage.getItem(STORE_KEY);
          if (saved === 'light' || saved === 'dark') setName(saved);
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setName(t);
    AsyncStorage.setItem(STORE_KEY, t).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setName((prev) => {
      const next: ThemeName = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({ theme: themes[name], name, setTheme, toggleTheme, ready }),
    [name, ready, setTheme, toggleTheme]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
