import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@workout/color-scheme';

type ColorScheme = 'light' | 'dark';

interface ColorSchemeContextValue {
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
  setColorScheme: (s: ColorScheme) => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('dark');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark') setColorSchemeState(v);
      })
      .catch(() => {});
  }, []);

  const persist = useCallback((s: ColorScheme) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, s).catch(() => {});
    }, 100);
  }, []);

  const setColorScheme = useCallback(
    (s: ColorScheme) => {
      setColorSchemeState(s);
      persist(s);
    },
    [persist],
  );

  const toggleColorScheme = useCallback(() => {
    setColorSchemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      persist(next);
      return next;
    });
  }, [persist]);

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, toggleColorScheme, setColorScheme }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorSchemeContext() {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx) throw new Error('useColorSchemeContext must be used within ColorSchemeProvider');
  return ctx;
}
