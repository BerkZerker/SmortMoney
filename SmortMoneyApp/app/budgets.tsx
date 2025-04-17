import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Button, FlatList, TextInput, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Link } from 'expo-router';
import { getBudgets, upsertBudget } from '../api/budgetService'; // Import budget API functions
import { getCategories } from '../api/categoryService'; // Import category API function
import { getTransactionSummary } from '../api/transactions'; // Import transaction summary function
import BudgetProgressBar from '../components/BudgetProgressBar'; // Import the progress bar component

// Define types (can be moved to shared types later)
interface Category {
  id: string;
  name: string;
  iconName?: string | null; // Keep consistent with Category screen
}
interface Budget {
  id: string; // Budget entry ID from DB
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}
// Combined type for display and editing state
interface DisplayBudget {
  categoryId: string;
  categoryName: string;
  budgetId?: string; // ID of the specific budget entry, if exists
  amount: string; // Use string for TextInput compatibility
  originalAmount: number; // Store original amount to detect changes
  totalSpent: number; // Add total spent for the category in this period
}

// Type for transaction summary API response item
interface SpendingSummaryItem {
  categoryId: string;
  totalSpent: number;
}

// Helper function to get month name
const getMonthName = (monthNumber: number): string => {
  const date = new Date();
  date.setMonth(monthNumber - 1); // Month is 0-indexed in Date object
  return date.toLocaleString('default', { month: 'long' });
};

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // State for saving indicator
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [spendingSummary, setSpendingSummary] = useState<SpendingSummaryItem[]>([]); // State for spending summary
  const [editableBudgets, setEditableBudgets] = useState<DisplayBudget[]>([]);

  // Fetch budgets, categories, and transaction summary
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all data concurrently
      const [fetchedBudgets, fetchedCategories, fetchedSummary] = await Promise.all([
        getBudgets(selectedMonth, selectedYear),
        getCategories(),
        getTransactionSummary(selectedMonth, selectedYear),
      ]);
      setBudgets(fetchedBudgets);
      setCategories(fetchedCategories);
      setSpendingSummary(fetchedSummary);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Refetch when month/year changes

  // Combine categories, budgets, and spending summary for display and editing state
  useEffect(() => {
    const combined = categories.map(cat => {
      const budget = budgets.find(b => b.categoryId === cat.id);
      const summary = spendingSummary.find(s => s.categoryId === cat.id);
      const budgetAmount = budget?.amount ?? 0;
      const spentAmount = summary?.totalSpent ?? 0;

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        budgetId: budget?.id,
        amount: budgetAmount.toString(), // TextInput value as string
        originalAmount: budgetAmount, // Store original numeric amount
        totalSpent: spentAmount, // Store total spent
      };
    });
    setEditableBudgets(combined);
  }, [categories, budgets, spendingSummary]);

  // --- Period Navigation ---
  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    // Data will refetch via useEffect on selectedMonth/Year change
  };

  // --- Budget Editing and Saving ---
  const handleAmountChange = (categoryId: string, newAmount: string) => {
    // Allow only numbers and one decimal point
    const sanitizedAmount = newAmount.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    if ((sanitizedAmount.match(/\./g) || []).length > 1) {
        return;
    }

    setEditableBudgets(prev =>
      prev.map(b =>
        b.categoryId === categoryId ? { ...b, amount: sanitizedAmount } : b
      )
    );
  };

  const handleSaveBudgets = async () => {
    setIsSaving(true);
    setError(null);
    const changes: Promise<any>[] = [];

    editableBudgets.forEach(item => {
      const newAmount = parseFloat(item.amount || '0'); // Default to 0 if empty or invalid
      // Check if amount actually changed
      if (newAmount !== item.originalAmount) {
        changes.push(
          upsertBudget({
            categoryId: item.categoryId,
            amount: newAmount,
            month: selectedMonth,
            year: selectedYear,
          })
        );
      }
    });

    if (changes.length === 0) {
      Alert.alert("No Changes", "No budget amounts were modified.");
      setIsSaving(false);
      return;
    }

    try {
      await Promise.all(changes);
      Alert.alert('Success', 'Budget changes saved successfully.');
      fetchData(); // Refetch data to update original amounts and budget IDs
    } catch (err) {
      setError('Failed to save budget changes. Please try again.');
      Alert.alert('Error', 'Failed to save some budget changes.');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Function to format month/year for display
  const formatPeriod = (month: number, year: number): string => {
    return `${getMonthName(month)} ${year}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Budgets</Text>

      {/* Month/Year selection controls */}
      <View style={styles.periodSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton} disabled={isLoading || isSaving}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.periodText}>{formatPeriod(selectedMonth, selectedYear)}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton} disabled={isLoading || isSaving}>
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {isLoading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!isLoading && !error && (
        <>
          <FlatList
            data={editableBudgets} // Use the editable list
            keyExtractor={(item) => item.categoryId}
            renderItem={({ item }) => (
              <View style={styles.budgetItem}>
                <View style={styles.budgetInfo}>
                  <Text style={styles.categoryText}>{item.categoryName}</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={item.amount}
                    onChangeText={(text) => handleAmountChange(item.categoryId, text)}
                    keyboardType="numeric"
                    placeholder="0.00"
                    editable={!isSaving}
                  />
                </View>
                <BudgetProgressBar
                  currentValue={item.totalSpent}
                  budgetValue={parseFloat(item.amount || '0')} // Use current input value for budget
                  height={8} // Slightly thinner bar
                />
              </View>
            )}
            style={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>No categories found. Add categories first.</Text>}
            ListFooterComponent={ // Add Save button below the list
              categories.length > 0 ? (
                <Button
                  title={isSaving ? "Saving..." : "Save Budget Changes"}
                  onPress={handleSaveBudgets}
                  disabled={isSaving || isLoading}
                />
              ) : null
            }
            ListFooterComponentStyle={styles.saveButtonContainer}
          />
        </>
      )}

      {/* Link back to the explore tab */}
      <View style={styles.footer}>
        <Link href="/(tabs)/explore" asChild>
           <Button title="Back to Explore" disabled={isSaving}/>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  arrowButton: {
    padding: 10,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  periodText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loader: {
    marginTop: 30,
    flex: 1, // Take remaining space when loading
    justifyContent: 'center',
  },
  list: {
    flex: 1, // Ensure list takes available space before footer
  },
  budgetItem: {
    backgroundColor: '#fff',
    paddingVertical: 12, // More vertical padding for the progress bar
    paddingHorizontal: 15,
    marginBottom: 10, // Increased space between items
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eee',
    // Removed flexDirection: 'row' - items will stack vertically now
  },
  budgetInfo: { // Container for category name and input
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Add space before the progress bar
  },
  categoryText: {
    fontSize: 16,
    flex: 1, // Allow category name to take space
    marginRight: 10,
  },
  amountInput: {
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    minWidth: 80, // Ensure input has some width
    textAlign: 'right',
  },
  saveButtonContainer: {
    marginTop: 15,
    marginBottom: 10, // Add space before the footer link
  },
  footer: {
    marginTop: 'auto', // Push footer to the bottom
    paddingTop: 10, // Add some space above the back button
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
    flex: 1, // Take remaining space when empty
  },
});
