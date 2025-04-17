import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TextInput, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert,
  Dimensions
} from 'react-native';
import { Link, router } from 'expo-router';
import { getBudgets, upsertBudget } from '../api/budgetService';
import { getCategories } from '../api/categoryService';
import { getTransactionSummary } from '../api/transactions';
import BudgetProgressBar from '../components/BudgetProgressBar';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Get screen dimensions for responsive layout
const { width } = Dimensions.get('window');
const containerPadding = 16;
const contentWidth = width - (containerPadding * 2);

// Define types
interface Category {
  id: string;
  name: string;
  iconName?: string | null;
}

interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

interface DisplayBudget {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string | null;
  budgetId?: string;
  amount: string;
  originalAmount: number;
  totalSpent: number;
}

interface SpendingSummaryItem {
  categoryId: string;
  totalSpent: number;
}

// Helper function to get month name
const getMonthName = (monthNumber: number): string => {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString('default', { month: 'long' });
};

export default function BudgetsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [spendingSummary, setSpendingSummary] = useState<SpendingSummaryItem[]>([]);
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
  }, [fetchData]);

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
        categoryIcon: cat.iconName,
        budgetId: budget?.id,
        amount: budgetAmount.toString(),
        originalAmount: budgetAmount,
        totalSpent: spentAmount,
      };
    });
    setEditableBudgets(combined);
  }, [categories, budgets, spendingSummary]);

  // Period Navigation
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
  };

  // Budget Editing and Saving
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
      const newAmount = parseFloat(item.amount || '0');
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
      fetchData();
    } catch (err) {
      setError('Failed to save budget changes. Please try again.');
      Alert.alert('Error', 'Failed to save some budget changes.');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Function to format month/year for display
  const formatPeriod = (): string => {
    return `${getMonthName(selectedMonth)} ${selectedYear}`;
  };
  
  // Calculate spending totals
  const totalBudgeted = editableBudgets.reduce(
    (sum, budget) => sum + parseFloat(budget.amount || '0'), 
    0
  );
  
  const totalSpent = editableBudgets.reduce(
    (sum, budget) => sum + budget.totalSpent, 
    0
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Budgets</ThemedText>
        </View>
        
        <Card style={styles.summaryCard}>
          <View style={styles.periodSelector}>
            <TouchableOpacity 
              onPress={() => changeMonth(-1)} 
              disabled={isLoading || isSaving}
              style={styles.arrowButton}
            >
              <MaterialCommunityIcons 
                name="chevron-left" 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>
            
            <ThemedText type="defaultSemiBold" style={styles.periodText}>
              {formatPeriod()}
            </ThemedText>
            
            <TouchableOpacity 
              onPress={() => changeMonth(1)} 
              disabled={isLoading || isSaving}
              style={styles.arrowButton}
            >
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.totalContainer}>
            <View style={styles.totalItem}>
              <ThemedText style={styles.totalLabel}>Total Budgeted</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.totalAmount}>
                ${totalBudgeted.toFixed(2)}
              </ThemedText>
            </View>
            
            <View style={styles.totalDivider} />
            
            <View style={styles.totalItem}>
              <ThemedText style={styles.totalLabel}>Total Spent</ThemedText>
              <ThemedText 
                type="defaultSemiBold" 
                style={[
                  styles.totalAmount, 
                  {color: totalSpent > totalBudgeted ? colors.bad : colors.text}
                ]}
              >
                ${totalSpent.toFixed(2)}
              </ThemedText>
            </View>
          </View>
          
          <BudgetProgressBar
            currentValue={totalSpent}
            budgetValue={totalBudgeted}
            height={10}
            showLabel={true}
            labelPosition="right"
            barColor={totalSpent > totalBudgeted ? colors.bad : colors.good}
          />
        </Card>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Loading budgets...</ThemedText>
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

        {!isLoading && !error && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Category Budgets
            </ThemedText>
            
            <FlatList
              data={editableBudgets}
              keyExtractor={(item) => item.categoryId}
              renderItem={({ item }) => (
                <Card style={styles.budgetItemCard}>
                  <View style={styles.categoryContainer}>
                    <View style={styles.categoryInfo}>
                      <MaterialCommunityIcons 
                        name={item.categoryIcon || "shape-outline"} 
                        size={22} 
                        color={colors.primary} 
                        style={styles.categoryIcon} 
                      />
                      <ThemedText style={styles.categoryText}>
                        {item.categoryName}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.amountInputContainer}>
                      <ThemedText style={styles.currencySymbol}>$</ThemedText>
                      <TextInput
                        style={[
                          styles.amountInput,
                          {
                            color: colors.text,
                            borderColor: colors.border,
                            backgroundColor: colors.input
                          }
                        ]}
                        value={item.amount}
                        onChangeText={(text) => handleAmountChange(item.categoryId, text)}
                        keyboardType="numeric"
                        placeholder="0.00"
                        editable={!isSaving}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.spendingContainer}>
                    <ThemedText style={styles.spentText}>
                      Spent: ${item.totalSpent.toFixed(2)}
                    </ThemedText>
                    
                    <ThemedText 
                      style={[
                        styles.remainingText,
                        {
                          color: item.totalSpent > parseFloat(item.amount || '0') 
                            ? colors.bad 
                            : item.totalSpent > parseFloat(item.amount || '0') * 0.85 
                              ? colors.warning 
                              : colors.success
                        }
                      ]}
                    >
                      {item.totalSpent > parseFloat(item.amount || '0') 
                        ? `Over by $${(item.totalSpent - parseFloat(item.amount || '0')).toFixed(2)}` 
                        : `Remaining: $${(parseFloat(item.amount || '0') - item.totalSpent).toFixed(2)}`
                      }
                    </ThemedText>
                  </View>
                  
                  <BudgetProgressBar
                    currentValue={item.totalSpent}
                    budgetValue={parseFloat(item.amount || '0')}
                    height={6}
                    showLabel={false}
                    barColor={
                      item.totalSpent > parseFloat(item.amount || '0')
                        ? colors.bad
                        : colors.good
                    }
                  />
                </Card>
              )}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={(
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons 
                    name="tag-plus" 
                    size={48} 
                    color={colors.muted} 
                  />
                  <ThemedText style={styles.emptyText}>
                    No categories found. Add categories first.
                  </ThemedText>
                  <Button
                    title="Add Categories"
                    onPress={() => router.push('/categories')}
                    variant="primary"
                    style={styles.addCategoryButton}
                  />
                </View>
              )}
            />
            
            {categories.length > 0 && (
              <View style={styles.buttonsContainer}>
                <Button
                  title={isSaving ? "Saving..." : "Save Budget Changes"}
                  onPress={handleSaveBudgets}
                  disabled={isSaving || isLoading}
                  loading={isSaving}
                  variant="primary"
                  fullWidth
                />
              </View>
            )}
          </>
        )}

        {/* Bottom navigation button */}
        <View style={styles.footer}>
          <Button
            title="Back to Home"
            onPress={() => router.push('/(tabs)')}
            variant="outline"
            disabled={isSaving}
            fullWidth
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: containerPadding,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    marginBottom: 6,
  },
  summaryCard: {
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  arrowButton: {
    padding: 6,
  },
  periodText: {
    fontSize: 16,
    marginHorizontal: 14,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e1e1e1',
  },
  totalLabel: {
    fontSize: 13,
    marginBottom: 4,
    opacity: 0.7,
  },
  totalAmount: {
    fontSize: 18,
  },
  sectionTitle: {
    marginVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  budgetItemCard: {
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    fontSize: 15,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    marginRight: 4,
    fontSize: 15,
  },
  amountInput: {
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 76,
    textAlign: 'right',
  },
  spendingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  spentText: {
    fontSize: 13,
    opacity: 0.7,
  },
  remainingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonsContainer: {
    marginVertical: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
  addCategoryButton: {
    minWidth: 150,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 12,
  },
});