import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useColorScheme, toggleColorScheme, setColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ThemeToggleProps {
  size?: number;
  style?: any;
}

export function ThemeToggle({ size = 24, style }: ThemeToggleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [currentTheme, setCurrentTheme] = useState(colorScheme);
  
  const handleToggleTheme = async () => {
    const newTheme = await toggleColorScheme();
    setCurrentTheme(newTheme);
    
    // Force reload the app to apply the theme change
    // This is a workaround since the theme state might not propagate immediately
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 100);
  };

  return (
    <TouchableOpacity 
      onPress={handleToggleTheme}
      style={[styles.container, style]}
      accessibilityLabel={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}
      accessibilityRole="button"
    >
      <View style={styles.toggleWrapper}>
        <MaterialCommunityIcons 
          name={colorScheme === 'dark' ? 'weather-night' : 'white-balance-sunny'} 
          size={size} 
          color={colors.text} 
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  toggleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});