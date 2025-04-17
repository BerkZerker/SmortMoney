import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Button, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { PieChart, BarChart } from 'react-native-chart-kit'; // Import BarChart

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
// Assuming api functions are correctly located relative to the app root
import { getTransactionSummary } from '../../api/transactions';
import { getCategories } from '../../api/categoryService';
import { getBudgets } from '../../api/budgetService'; // Import budget service

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
interface Budget { // Add Budget type if not already defined/imported
    id: string;
    categoryId: string;
    amount: number;
    month: number;
    year: number;
}
interface BarChartData { // Type for the BarChart data structure
  labels: string[];
  datasets: [
    { data: number[]; colors: ((opacity: number) => string)[] }, // Spent
    { data: number[]; colors: ((opacity: number) => string)[] }  // Budgeted
  ];
  legend: ["Spent", "Budgeted"]; // Add legend
}


// Function to generate random colors for the chart
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const screenWidth = Dimensions.get("window").width;

export default function ExploreScreen() {
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
        getBudgets(currentMonth, currentYear), // Fetch budgets for the period
      ]);

      // --- Process data for PieChart ---
      const processedPieData = summary
        .map((item: SpendingSummaryItem) => { // Add type for item
          const category = categories.find((cat: Category) => cat.id === item.categoryId); // Add type for cat
          if (!category || item.totalSpent <= 0) {
            return null; // Skip items with no category or zero/negative spending
          }
          return {
            name: category.name,
            population: item.totalSpent,
            color: getRandomColor(), // Assign a random color
            legendFontColor: '#7F7F7F',
            legendFontSize: 14,
          };
        })
        // Explicitly type item here, although the predicate should suffice
        .filter((item: PieChartData | null): item is PieChartData => item !== null);

      if (processedPieData.length === 0) {
         // Don't set error if just empty, show info text instead
         // setError("No spending data available for the current month.");
      }
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
              labels.push(cat.name.substring(0, 5) + (cat.name.length > 5 ? '...' : '')); // Abbreviate labels
              spentData.push(spent);
              budgetData.push(budget);
              // Color spent bar red if over budget, otherwise green
              spentColors.push(spent > budget && budget > 0 ? () => `rgba(244, 67, 54, 1)` : () => `rgba(76, 175, 80, 1)`);
              // Budget bar color (e.g., blue)
              budgetColors.push(() => `rgba(33, 150, 243, 1)`);
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
      setError("Could not load spending summary.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const pieChartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Base color function (not directly used by pie)
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: { // Example props if needed elsewhere
      r: "6",
      strokeWidth: "2",
      stroke: "#ffa726"
    }
  };

  // Specific config for BarChart to handle multiple datasets and custom colors
  const barChartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0, // Show whole numbers for amounts
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Default color
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.7, // Adjust bar width
    propsForLabels: { // Smaller font size for labels if needed
        fontSize: "10",
    },
    // Use `withCustomBarColorFromData` to apply colors per bar based on dataset index
    withCustomBarColorFromData: true,
    flatColor: false, // Required for withCustomBarColorFromData
  };


  return (
    // Use ScrollView in case content overflows on smaller screens
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Explore & Insights</ThemedText>

        {/* --- Spending Chart Section --- */}
        <View style={styles.chartSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Current Month Spending</ThemedText>
          {isLoading && <ActivityIndicator size="large" color="#007bff" style={styles.loadingIndicator}/>}
          {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
          {!isLoading && !error && pieChartData.length > 0 && (
            <PieChart
              data={pieChartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={pieChartConfig}
              accessor={"population"} // Key to extract value from data item
              backgroundColor={"transparent"}
              paddingLeft={"15"} // Adjust padding as needed
              // center={[10, 0]} // Optional: Adjust center position
              absolute // Show absolute values instead of percentages
              style={styles.chartStyle}
            />
          )}
          {/* Show info text if not loading, no error, and no pie data */}
          {!isLoading && !error && pieChartData.length === 0 && (
             <ThemedText style={styles.infoText}>No spending data for pie chart.</ThemedText>
          )}
        </View>

        {/* --- Budget vs Spending Chart Section --- */}
        <View style={styles.chartSection}>
           <ThemedText type="subtitle" style={styles.sectionTitle}>Budget vs. Spending</ThemedText>
           {isLoading && <ActivityIndicator size="large" color="#007bff" style={styles.loadingIndicator}/>}
           {/* Don't show general error here again, handled above */}
           {!isLoading && !error && barChartData && barChartData.labels.length > 0 && (
             <BarChart
               style={styles.chartStyle}
               data={barChartData}
               width={screenWidth - 40}
               height={250}
               chartConfig={barChartConfig}
               verticalLabelRotation={30}
               showBarTops={false}
               fromZero={true}
               withInnerLines={false}
               showValuesOnTopOfBars={true}
               yAxisLabel="$" // Add required prop
               yAxisSuffix="" // Add required prop
             />
           )}
           {/* Show info text if not loading, no error, and no bar data */}
           {!isLoading && !error && (!barChartData || barChartData.labels.length === 0) && (
              <ThemedText style={styles.infoText}>No budget or spending data for bar chart.</ThemedText>
           )}
        </View>


        {/* --- Management Links Section --- */}
        <View style={styles.managementSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Management</ThemedText>
          <View style={styles.linkContainer}>
            <Link href="/categories" asChild>
              <Button title="Manage Categories" />
            </Link>
          </View>
          <View style={styles.linkContainer}>
            <Link href="/budgets" asChild>
              <Button title="Manage Budgets" />
            </Link>
          </View>
        </View>

      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1, // Ensure ScrollView content can grow
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  title: {
    marginBottom: 25,
    textAlign: 'center',
  },
  chartSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  loadingIndicator: { // Style for loading indicators within sections
      marginVertical: 20,
  },
  managementSection: {
    marginTop: 10, // Reduced space above management links
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#444',
  },
  linkContainer: {
    marginBottom: 15,
    width: '80%',
    alignSelf: 'center',
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  infoText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  }
});
