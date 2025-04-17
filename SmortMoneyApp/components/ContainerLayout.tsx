import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ViewStyle, ScrollViewProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ContainerLayoutProps extends ScrollViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  noScroll?: boolean;
}

// Get screen dimensions for responsive layout
const { width } = Dimensions.get('window');

export function ContainerLayout({ 
  children, 
  style, 
  contentContainerStyle,
  noScroll = false,
  ...rest 
}: ContainerLayoutProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  if (noScroll) {
    return (
      <View 
        style={[
          styles.container, 
          { backgroundColor: colors.background },
          style
        ]}
      >
        <View style={[styles.contentContainer, contentContainerStyle]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '100%',
    maxWidth: 600, // Limit content width for better readability
    alignSelf: 'center', // Center content on wider screens
  },
});
