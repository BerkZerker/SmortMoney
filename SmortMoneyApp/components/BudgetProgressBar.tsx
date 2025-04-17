import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BudgetProgressBarProps {
  currentValue: number;
  budgetValue: number;
  barColor?: string; // Optional color for the progress bar
  height?: number; // Optional height for the bar
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  currentValue,
  budgetValue,
  barColor = '#4caf50', // Default to green
  height = 10, // Default height
}) => {
  // Ensure budgetValue is not zero to avoid division by zero
  // Calculate progress percentage, capped at 100%
  const progress = budgetValue > 0 ? Math.min((currentValue / budgetValue) * 100, 100) : 0;
  const displayValue = budgetValue > 0 ? budgetValue : 0; // Display 0 if budget is 0 or less

  // Determine color based on progress (e.g., turn red if over budget)
  let actualBarColor = barColor;
  if (currentValue > displayValue && displayValue > 0) {
    actualBarColor = '#f44336'; // Red if over budget
  } else if (progress > 85) {
    actualBarColor = '#ff9800'; // Orange if close to budget
  }

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height: height }]}>
        <View
          style={[
            styles.bar,
            {
              width: `${progress}%`,
              backgroundColor: actualBarColor,
              height: height,
            },
          ]}
        />
      </View>
      <Text style={styles.label}>
        ${currentValue.toFixed(2)} / ${displayValue.toFixed(2)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 10, // Add some space below the progress bar
  },
  track: {
    backgroundColor: '#e0e0e0', // Light grey background track
    borderRadius: 5,
    overflow: 'hidden', // Ensure the bar stays within the rounded corners
  },
  bar: {
    borderRadius: 5,
    // Transition effect would be nice but requires Animated API or Reanimated
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right', // Align text to the right
  },
});

export default BudgetProgressBar;
