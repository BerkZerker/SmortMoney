import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

type ColorScheme = 'light' | 'dark';
const STORAGE_KEY = 'theme_preference';

/**
 * Custom hook for theme management with persistence in web
 */
export function useColorScheme() {
  const deviceColorScheme = useRNColorScheme() as ColorScheme;
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
  const [hasHydrated, setHasHydrated] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = () => {
      try {
        const savedTheme = localStorage.getItem(STORAGE_KEY) as ColorScheme;
        if (savedTheme) {
          setColorScheme(savedTheme);
        } else {
          setColorScheme(deviceColorScheme || 'light');
        }
      } catch (e) {
        console.error('Failed to load theme preference:', e);
        setColorScheme(deviceColorScheme || 'light');
      } finally {
        setHasHydrated(true);
      }
    };

    loadTheme();
  }, [deviceColorScheme]);

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}

export async function toggleColorScheme(): Promise<ColorScheme> {
  try {
    const currentTheme = localStorage.getItem(STORAGE_KEY) as ColorScheme;
    const newTheme: ColorScheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, newTheme);
    return newTheme;
  } catch (e) {
    console.error('Failed to toggle theme:', e);
    return 'light';
  }
}

export async function setColorScheme(theme: ColorScheme): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    console.error('Failed to set theme:', e);
  }
}