import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // Determine button styles based on variant
  const getButtonStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? colors.muted : colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? colors.muted : colors.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? colors.muted : colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: disabled ? colors.muted : colors.error,
        };
      default:
        return {
          backgroundColor: disabled ? colors.muted : colors.primary,
        };
    }
  };

  // Determine text styles based on variant
  const getTextStyles = (): TextStyle => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return {
          color: disabled ? colors.muted : colors.primary,
        };
      case 'secondary':
        return {
          color: variant === 'secondary' ? colors.text : '#ffffff',
        };
      default:
        return {
          color: '#ffffff',
        };
    }
  };

  // Determine size styles
  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderRadius: 4,
        };
      case 'large':
        return {
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 8,
        };
      default:
        return {
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: 6,
        };
    }
  };

  // Determine text size
  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return { fontSize: 13 };
      case 'large':
        return { fontSize: 16 };
      default:
        return { fontSize: 15 };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getButtonStyles(),
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size={size === 'small' ? 'small' : 'small'} 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#ffffff'} 
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text style={[
            styles.text, 
            getTextStyles(), 
            getTextSizeStyle(),
            textStyle
          ]}>
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});