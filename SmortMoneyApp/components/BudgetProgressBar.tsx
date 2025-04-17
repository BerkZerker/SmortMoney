import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

interface BudgetProgressBarProps {
  currentValue: number;
  budgetValue: number;
  barColor?: string;
  height?: number;
  showLabel?: boolean;
  labelPosition?: 'left' | 'right';
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  currentValue,
  budgetValue,
  barColor,
  height = 10,
  showLabel = true,
  labelPosition = 'right',
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  // Calculate progress percentage, capped at 100%
  const progress = budgetValue > 0 ? Math.min((currentValue / budgetValue) * 100, 100) : 0;
  const displayValue = budgetValue > 0 ? budgetValue : 0;

  // Determine color based on progress
  let actualBarColor = barColor || colors.good; // Default to good color (Electric Blue)
  if (currentValue > displayValue && displayValue > 0) {
    actualBarColor = colors.bad; // Red if over budget
  } else if (progress > 85) {
    actualBarColor = colors.warning; // Warning color if close to budget
  }

  return (
    <View style={styles.container}>
      {showLabel && labelPosition === 'left' && (
        <Text style={[styles.label, { color: colors.muted, textAlign: 'left' }]}>
          ${currentValue.toFixed(2)} / ${displayValue.toFixed(2)}
        </Text>
      )}
      
      <View style={[styles.track, { height, backgroundColor: colorScheme === 'dark' ? colors.border : colors.secondary + '40' }]}>
        <View
          style={[
            styles.bar,
            {
              width: `${progress}%`,
              backgroundColor: actualBarColor,
              height,
            },
          ]}
        />
      </View>
      
      {showLabel && labelPosition === 'right' && (
        <Text style={[styles.label, { color: colors.muted, textAlign: 'right' }]}>
          ${currentValue.toFixed(2)} / ${displayValue.toFixed(2)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  track: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    borderRadius: 6,
  },
  label: {
    fontSize: 12,
    marginVertical: 2,
  },
});

export default BudgetProgressBar;