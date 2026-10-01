import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Lang, Theme } from '@/lib/store';

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  t: (ar: string, en: string) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('mlr-lang');
    return saved === 'en' ? 'en' : 'ar';
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('mlr-theme-v2');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('mlr-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('mlr-theme-v2', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const value: AppContextValue = {
    lang,
    setLang: setLangState,
    theme,
    setTheme: setThemeState,
    t: (ar, en) => (lang === 'ar' ? ar : en),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
