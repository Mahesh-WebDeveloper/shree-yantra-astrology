/**
 * App-wide dynamic config + page-wise content (admin dashboard se control).
 * Startup par /app-config + /screens load hote hain, AsyncStorage me cache
 * (offline fallback). Har screen `useScreen('home')` se apna content padhta hai.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAppConfig, getScreens, AppConfigData, ScreensMap } from '../lib/api';
import { useLang } from '../i18n/LanguageProvider';

const CFG_KEY = 'sy.appConfig';
const SCR_KEY = 'sy.screens';

const FALLBACK: AppConfigData = {
  onboardingSlides: [],
  homeBanners: [],
  support: { email: 'support@shreeyantra.app', phone: '' },
  branding: { appName: 'Shree Yantra', tagline: 'Astrology', logoUrl: '' },
  appVersion: '1.0.0',
  featureFlags: {},
};

interface CtxShape { config: AppConfigData; screens: ScreensMap; loading: boolean; }
const Ctx = createContext<CtxShape>({ config: FALLBACK, screens: {}, loading: true });

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();
  const [config, setConfig] = useState<AppConfigData>(FALLBACK);
  const [screens, setScreens] = useState<ScreensMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    const cfgKey = `${CFG_KEY}.${lang}`;
    const scrKey = `${SCR_KEY}.${lang}`;
    setLoading(true);
    // cache pehle (instant), phir network (fresh)
    AsyncStorage.multiGet([cfgKey, scrKey]).then((pairs) => {
      if (!on) return;
      const map = Object.fromEntries(pairs);
      try { if (map[cfgKey]) setConfig({ ...FALLBACK, ...JSON.parse(map[cfgKey]) }); } catch {}
      try { if (map[scrKey]) setScreens(JSON.parse(map[scrKey])); } catch {}
    });
    Promise.allSettled([getAppConfig(), getScreens()]).then(([cfgR, scrR]) => {
      if (!on) return;
      if (cfgR.status === 'fulfilled') {
        setConfig({ ...FALLBACK, ...cfgR.value.config });
        AsyncStorage.setItem(cfgKey, JSON.stringify(cfgR.value.config)).catch(() => {});
      }
      if (scrR.status === 'fulfilled') {
        setScreens(scrR.value.screens || {});
        AsyncStorage.setItem(scrKey, JSON.stringify(scrR.value.screens || {})).catch(() => {});
      }
      setLoading(false);
    });
    return () => { on = false; };
  }, [lang]);

  return <Ctx.Provider value={{ config, screens, loading }}>{children}</Ctx.Provider>;
}

export const useAppConfig = () => useContext(Ctx);

/** Ek page ka admin-managed content. `t('key', 'fallback')` helper deta hai. */
export function useScreen(page: string) {
  const { screens } = useContext(Ctx);
  const fields = screens[page] || {};
  return {
    fields,
    t: (key: string, fallback = '') => (fields[key] != null && fields[key] !== '' ? fields[key] : fallback),
    img: (key: string) => (fields[key] ? fields[key] : ''),
  };
}

/** Branding (logo/appName/tagline) — `branding` page se. */
export function useBranding() {
  const { config, screens } = useContext(Ctx);
  const b = screens['branding'] || {};
  const cfg = config.branding || { appName: 'Shree Yantra', tagline: 'Astrology', logoUrl: '' };
  return {
    appName: b.appName || cfg.appName || 'Shree Yantra',
    tagline: b.tagline || cfg.tagline || 'Astrology',
    logoImage: b.logoImage || cfg.logoUrl || '',
    splashTagline: b.splashTagline || '“Aligning your path with the cosmos”',
  };
}

export const useFeature = (flag: string, def = true) => {
  const { config } = useContext(Ctx);
  return config.featureFlags && flag in config.featureFlags ? !!config.featureFlags[flag] : def;
};
