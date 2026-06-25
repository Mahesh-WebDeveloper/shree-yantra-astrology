/**
 * Language (English / Hindi) — app-wide. Choice AsyncStorage me persist hoti hai.
 * useT() se `t('key', 'fallback')`; useLang() se current lang + setLang toggle.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STRINGS, Lang } from './strings';
import { setApiLang } from '../lib/api';

const LANG_KEY = 'sy.lang';

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
}
const LanguageCtx = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (_k, f = '') => f });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((v) => {
      if (v === 'hi' || v === 'en') { setLangState(v); setApiLang(v); }
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setApiLang(l); // AI calls ko nayi language mil jaaye
    AsyncStorage.setItem(LANG_KEY, l).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, fallback = '') => {
      const entry = STRINGS[key];
      if (!entry) return fallback || key;
      return entry[lang] || entry.en || fallback || key;
    },
    [lang]
  );

  return <LanguageCtx.Provider value={{ lang, setLang, t }}>{children}</LanguageCtx.Provider>;
}

export const useLang = () => useContext(LanguageCtx);
export const useT = () => useContext(LanguageCtx).t;
