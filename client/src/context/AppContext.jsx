import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const AppContext = createContext();

export function AppProvider({ children }) {
  // 1. Theme State (Default: 'light')
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('controltest_theme') || localStorage.getItem('testhub_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  // 2. Language State (Default: 'uz')
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('controltest_lang') || localStorage.getItem('testhub_lang');
    return saved === 'ru' ? 'ru' : 'uz';
  });

  // Apply theme to HTML root element
  useEffect(() => {
    localStorage.setItem('controltest_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  // Apply language to HTML attribute
  useEffect(() => {
    localStorage.setItem('controltest_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme === 'dark' ? 'dark' : 'light');
  };

  const setLang = (newLang) => {
    setLangState(newLang === 'ru' ? 'ru' : 'uz');
  };

  // Translation lookup helper
  const t = (path, replacements = {}) => {
    const keys = path.split('.');
    let cur = translations[lang] || translations.uz;
    for (const k of keys) {
      if (cur && cur[k] !== undefined) {
        cur = cur[k];
      } else {
        // Fallback to uz then ru
        let fallback = (translations.uz[keys[0]] && translations.uz[keys[0]][keys[1]]) ||
                       (translations.ru[keys[0]] && translations.ru[keys[0]][keys[1]]) ||
                       path;
        cur = fallback;
        break;
      }
    }

    if (typeof cur === 'string') {
      let res = cur;
      for (const [rk, rv] of Object.entries(replacements)) {
        res = res.replace(new RegExp(`\\{${rk}\\}`, 'g'), String(rv));
      }
      return res;
    }
    return cur || path;
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
        lang,
        setLang,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
