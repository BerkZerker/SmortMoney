import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, ViewStyle, ScrollViewProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ContainerLayoutProps extends ScrollViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  noScroll?: boolean;
}

export function ContainerLayout({ 
  children, 
  style, 
  contentContainerStyle,
  noScroll = false,
  ...rest 
}: ContainerLayoutProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions(); // Get current window width dynamically
  
  // Calculate responsive maxWidth based on screen size
  const responsiveMaxWidth = width > 1200 ? 1100 : width > 800 ? 900 : '100%';

  if (noScroll) {
    return (
      <View 
        style={[
          styles.container, 
          { backgroundColor: colors.background },
          style
        ]}
      >
        <View style={[
          styles.contentContainer, 
          { maxWidth: responsiveMaxWidth },
          contentContainerStyle
        ]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }, style]}
      contentContainerStyle={[
        styles.contentContainer, 
        { maxWidth: responsiveMaxWidth },
        contentContainerStyle
      ]}
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
    paddingHorizontal: 12, // Reduced horizontal padding
    paddingVertical: 12, // Reduced vertical padding
    width: '100%',
    alignSelf: 'center', // Center content on wider screens
    // maxWidth is now set dynamically in the component
  },
});