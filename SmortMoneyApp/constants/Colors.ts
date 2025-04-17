/**
 * Colors for SmortMoney app in light and dark modes
 */

// Brand colors
const primary = '#10B981'; // Emerald Green
const secondary = '#A7F3D0'; // Sage Green
const accent = '#3B82F6'; // Electric Blue
const warning = '#f59e0b'; // Amber
const error = '#ef4444'; // Red
const success = '#22c55e'; // Green

// Neutral colors
const lightNeutral = '#f5f5f5'; // Light Neutral Gray for light mode
const darkNeutral = '#2d2d2d'; // Dark Neutral Gray for dark mode

export const Colors = {
  light: {
    text: '#2d2d2d', // Dark gray text
    background: lightNeutral, // Light neutral gray background
    surface: '#FFFFFF', // White
    card: '#FFFFFF', // White
    border: '#E5E7EB', // Light border
    input: '#F9FAFB', // Very light gray input
    inputBorder: '#D1D5DB', // Medium gray input border
    tint: primary,
    muted: '#9CA3AF', // Gray-400
    icon: '#6B7280', // Gray-500
    tabIconDefault: '#6B7280', // Gray-500
    tabIconSelected: primary,
    
    // Branded colors
    primary,
    secondary,
    accent,
    warning,
    error,
    success,
    
    // Visualization specific
    good: accent, // Electric Blue
    bad: error, // Red
  },
  dark: {
    text: '#f5f5f5', // Almost white
    background: darkNeutral, // Dark neutral gray
    surface: '#3d3d3d', // Neutral gray surface
    card: '#3d3d3d', // Neutral gray card
    border: '#4B5563', // Gray-600
    input: '#1F2937', // Gray-800
    inputBorder: '#6B7280', // Gray-500
    tint: primary,
    muted: '#9CA3AF', // Gray-400
    icon: '#D1D5DB', // Gray-300
    tabIconDefault: '#D1D5DB', // Gray-300
    tabIconSelected: primary,
    
    // Branded colors
    primary,
    secondary,
    accent,
    warning,
    error,
    success,
    
    // Visualization specific
    good: accent, // Electric Blue
    bad: error, // Red
  },
};