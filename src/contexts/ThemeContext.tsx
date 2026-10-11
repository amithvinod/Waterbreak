import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppSettings } from '../types';
import { getSettings, saveSettings } from '../storage/db';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  readingTheme: 'light' | 'dark' | 'sepia';
  setTheme: (theme: ThemeMode) => void;
  setReadingTheme: (theme: 'light' | 'dark' | 'sepia') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  readingTheme: 'light',
  setTheme: () => {},
  setReadingTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [readingTheme, setReadingThemeState] = useState<'light' | 'dark' | 'sepia'>('light');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  const resolveTheme = useCallback((mode: ThemeMode): ResolvedTheme => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }, []);

  useEffect(() => {
    getSettings().then((settings) => {
      setThemeState(settings.theme);
      setReadingThemeState(settings.readingTheme);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);

    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#f8fafc');
    }
  }, [theme, resolveTheme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = resolveTheme('system');
      setResolvedTheme(resolved);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolved);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, resolveTheme]);

  const setTheme = useCallback(async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      const settings = await getSettings();
      await saveSettings({ ...settings, theme: newTheme });
    } catch (e) {
      console.error('Failed to save theme setting', e);
    }
  }, []);

  const setReadingTheme = useCallback(async (newTheme: 'light' | 'dark' | 'sepia') => {
    setReadingThemeState(newTheme);
    try {
      const settings = await getSettings();
      await saveSettings({ ...settings, readingTheme: newTheme });
    } catch (e) {
      console.error('Failed to save reading theme', e);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, readingTheme, setTheme, setReadingTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
