import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark';
const STORAGE_KEY = '@theme_preference';

export function useColorScheme(): ColorScheme {
  const deviceColorScheme = useDeviceColorScheme() as ColorScheme;
  const [colorScheme, setColorScheme] = useState<ColorScheme>(deviceColorScheme || 'light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    async function loadThemePreference() {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedTheme !== null) {
          setColorScheme(savedTheme as ColorScheme);
        } else {
          setColorScheme(deviceColorScheme || 'light');
        }
      } catch (e) {
        console.error('Failed to load theme preference:', e);
      } finally {
        setIsLoaded(true);
      }
    }
    
    loadThemePreference();
  }, [deviceColorScheme]);

  return colorScheme;
}

export async function toggleColorScheme(): Promise<ColorScheme> {
  try {
    const currentTheme = await AsyncStorage.getItem(STORAGE_KEY) as ColorScheme | null;
    const newTheme: ColorScheme = currentTheme === 'dark' ? 'light' : 'dark';
    await AsyncStorage.setItem(STORAGE_KEY, newTheme);
    return newTheme;
  } catch (e) {
    console.error('Failed to toggle theme:', e);
    return 'light';
  }
}

export async function setColorScheme(theme: ColorScheme): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    console.error('Failed to set theme:', e);
  }
}