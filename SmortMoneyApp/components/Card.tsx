import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { ThemedText } from './ThemedText';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function Card({ children, title, style, contentStyle }: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {title && (
        <View style={[styles.titleContainer, { borderBottomColor: colors.border }]}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {title}
          </ThemedText>
        </View>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8, // Reduced border radius
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 6, // Reduced vertical margin
    // Using elevation only for Android to avoid web shadow warnings
    elevation: 2, // Reduced elevation
  },
  titleContainer: {
    paddingHorizontal: 12, // Reduced horizontal padding
    paddingTop: 8, // Reduced top padding
    paddingBottom: 6, // Reduced bottom padding
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 15, // Slightly smaller font size
  },
  content: {
    padding: 12, // Reduced padding
  },
});