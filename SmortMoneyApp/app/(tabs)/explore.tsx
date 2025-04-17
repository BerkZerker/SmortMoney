import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  Dimensions, 
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { router } from 'expo-router';
import { PieChart, BarChart } from 'react-native-chart-kit';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { getTransactionSummary } from '../../api/transactions';
import { getCategories } from '../../api/categoryService';
import { getBudgets } from '../../api/budgetService';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Get screen dimensions for responsive layout
const { width } = Dimensions.get('window');
const containerPadding = 16;
const contentWidth = width - (containerPadding * 2);
const chartWidth = Math.min(contentWidth, 500);

// Define types locally or import if shared
interface Category {
  id: string;
  name: string;
}

interface SpendingSummaryItem {
  categoryId: string;
  totalSpent: number;
}

interface PieChartData {
  name: string;
  population: number; // Corresponds to totalSpent
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

interface BarChartData {
  labels: string[];
  datasets: [
    { data: number[]; colors: ((opacity: number) => string)[] }, // Spent
    { data: number[]; colors: ((opacity: number) => string)[] }  // Budgeted
  ];
  legend: ["Spent", "Budgeted"];
}

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Fetch summary, categories, and budgets
      const [summary, categories, budgets] = await Promise.all([
        getTransactionSummary(currentMonth, currentYear),
        getCategories(),
        getBudgets(currentMonth, currentYear),
      ]);

      // Generate colors for pie chart
      const chartColors = [
        colors.primary,
        colors.accent,
        colors.secondary,
        '#6366F1', // Indigo
        '#EC4899', // Pink
        '#8B5CF6', // Purple
        '#14B8A6', // Teal
        '#F59E0B', // Amber
        '#6B7280', // Gray
      ];

      // --- Process data for PieChart ---
      const processedPieData = summary
        .map((item: SpendingSummaryItem, index: number) => {
          const category = categories.find((cat: Category) => cat.id === item.categoryId);
          if (!category || item.totalSpent <= 0) {
            return null; // Skip items with no category or zero/negative spending
          }
          return {
            name: category.name,
            population: item.totalSpent,
            color: chartColors[index % chartColors.length],
            legendFontColor: colors.text,
            legendFontSize: 12,
          };
        })
        .filter((item: PieChartData | null): item is PieChartData => item !== null);

      setPieChartData(processedPieData);

      // --- Process data for BarChart ---
      const categoryMap = new Map(categories.map((cat: Category) => [cat.id, cat.name]));
      const budgetMap = new Map(budgets.map((b: Budget) => [b.categoryId, b.amount]));
      const summaryMap = new Map(summary.map((s: SpendingSummaryItem) => [s.categoryId, s.totalSpent]));

      const labels: string[] = [];
      const spentData: number[] = [];
      const budgetData: number[] = [];
      const spentColors: ((opacity: number) => string)[] = [];
      const budgetColors: ((opacity: number) => string)[] = [];

      categories.forEach((cat: Category) => {
        // Ensure these are treated as numbers
        const spent = Number(summaryMap.get(cat.id) || 0);
        const budget = Number(budgetMap.get(cat.id) || 0);

        // Include category in bar chart only if there's spending or a budget > 0
        if (spent > 0 || budget > 0) {
          // Limit category name length for better display
          const displayName = cat.name.length > 6 
            ? cat.name.substring(0, 5) + '...' 
            : cat.name;
            
          labels.push(displayName);
          spentData.push(spent);
          budgetData.push(budget);
          
          // Color spent bar red if over budget, otherwise blue
          spentColors.push(
            spent > budget && budget > 0 
              ? () => colors.bad 
              : () => colors.good
          );
          
          // Budget bar color
          budgetColors.push(() => colors.secondary);
        }
      });

      if (labels.length > 0) {
        setBarChartData({
          labels: labels,
          datasets: [
            { data: spentData, colors: spentColors },
            { data: budgetData, colors: budgetColors }
          ],
          legend: ["Spent", "Budgeted"]
        });
      } else {
        setBarChartData(null); // No data to display
      }

    } catch (err) {
      console.error("Failed to fetch chart data:", err);
      setError("Could not load spending data.");
    } finally {
      setIsLoading(false);
    }
  }, [colorScheme]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.text + (opacity * 255).toString(16).substring(0, 2),
    labelColor: (opacity = 1) => colors.text + (opacity * 255).toString(16).substring(0, 2),
    style: {
      borderRadius: 12,
    },
    barPercentage: 0.6,
    propsForLabels: {
      fontSize: 10,
    },
    withCustomBarColorFromData: true,
    flatColor: true,
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>Reports</ThemedText>
          </View>

          {/* Refresh Button */}
          <View style={styles.refreshContainer}>
            <TouchableOpacity 
              style={[styles.refreshButton, { borderColor: colors.border }]} 
              onPress={fetchChartData}
              disabled={isLoading}
            >
              <MaterialCommunityIcons 
                name="refresh" 
                size={16} 
                color={colors.primary}
                style={isLoading ? styles.rotating : undefined}
              />
              <ThemedText style={styles.refreshText}>
                {isLoading ? "Refreshing..." : "Refresh Data"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Spending Chart Section */}
          <Card style={styles.chartCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Current Month Spending
            </ThemedText>
            
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={styles.loadingText}>Loading charts...</ThemedText>
              </View>
            )}
            
            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons 
                  name="alert-circle-outline" 
                  size={24} 
                  color={colors.error} 
                />
                <ThemedText style={[styles.errorText, {color: colors.error}]}>
                  {error}
                </ThemedText>
              </View>
            )}
            
            {!isLoading && !error && pieChartData.length > 0 && (
              <View style={styles.chartWrapper}>
                <PieChart
                  data={pieChartData}
                  width={chartWidth}
                  height={180}
                  chartConfig={chartConfig}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"15"}
                  absolute
                />
              </View>
            )}
            
            {!isLoading && !error && pieChartData.length === 0 && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons 
                  name="chart-pie" 
                  size={40} 
                  color={colors.muted} 
                />
                <ThemedText style={styles.emptyText}>
                  No spending data available for this month.
                </ThemedText>
              </View>
            )}
          </Card>

          {/* Budget vs Spending Chart Section */}
          <Card style={styles.chartCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Budget vs. Spending
            </ThemedText>
            
            {!isLoading && !error && barChartData && barChartData.labels.length > 0 && (
              <View style={styles.chartWrapper}>
                <BarChart
                  style={styles.barChart}
                  data={barChartData}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  verticalLabelRotation={45}
                  showBarTops={false}
                  fromZero={true}
                  withInnerLines={false}
                  showValuesOnTopOfBars={true}
                  yAxisLabel="$"
                  yAxisSuffix=""
                />
              </View>
            )}
            
            {!isLoading && !error && (!barChartData || barChartData.labels.length === 0) && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons 
                  name="chart-bar" 
                  size={40} 
                  color={colors.muted} 
                />
                <ThemedText style={styles.emptyText}>
                  No budget or spending data available.
                </ThemedText>
              </View>
            )}
          </Card>

          {/* Management Buttons */}
          <View style={styles.buttonsContainer}>
            <Button
              title="Manage Budgets"
              onPress={() => router.push('/budgets')}
              variant="primary"
              leftIcon={<MaterialCommunityIcons name="currency-usd" size={18} color="#fff" />}
              style={styles.button}
            />
            <Button
              title="Manage Categories"
              onPress={() => router.push('/categories')}
              variant="outline"
              leftIcon={<MaterialCommunityIcons name="tag-multiple" size={18} color={colors.primary} />}
              style={[styles.button, {marginTop: 12}]}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: containerPadding,
    paddingBottom: 20,
  },
  contentWrapper: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
  },
  refreshContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  refreshText: {
    fontSize: 13,
    marginLeft: 6,
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  chartCard: {
    marginBottom: 16,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  chartWrapper: {
    alignItems: 'center',
  },
  barChart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
  buttonsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    alignSelf: 'center',
    minWidth: 200,
  },
});