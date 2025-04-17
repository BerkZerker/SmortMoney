import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Modal, Platform, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ContainerLayout } from '@/components/ContainerLayout';
// Correct API function names and import path for categories
import { getAllTransactions, updateTransaction as apiUpdateTransaction, deleteTransaction as apiDeleteTransaction } from '@/api/transactions'; // We will create/update these functions
import { getCategories } from '@/api/categoryService'; // Corrected function name
// Remove incorrect Prisma import
// import { Category, Transaction } from '@prisma/client';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// --- Define Types Locally ---
// Based on Prisma schema and expected API response
interface Category {
  id: string;
  name: string;
  iconName?: string | null; // Assuming iconName is optional
  // Add other fields if necessary
}

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string; // API likely returns date as ISO string
  description?: string | null;
  categoryId?: string | null;
  createdAt: string; // Assuming these exist from Prisma
  updatedAt: string; // Assuming these exist from Prisma
}

// Interface combining Transaction with optional Category object
interface TransactionWithCategory extends Transaction {
  category?: Category | null; // The nested category object
}
// --- End Type Definitions ---


export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCategory | null>(null);
  const [editFormData, setEditFormData] = useState({
    merchant: '',
    amount: '',
    date: new Date(),
    categoryId: null as string | null, // Initialize as null
    description: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedTransactions, fetchedCategories] = await Promise.all([
        getAllTransactions(), // Needs to be implemented in api/transactions.js
        getCategories()       // Corrected function call
      ]);
      // Ensure fetchedTransactions conforms to TransactionWithCategory[]
      // Add type assertion or mapping if necessary, assuming API returns correct structure for now
      setTransactions(fetchedTransactions as TransactionWithCategory[]);
      setCategories(fetchedCategories);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || 'Failed to fetch data');
      Alert.alert('Error', 'Could not load transaction data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEditModal = (transaction: TransactionWithCategory) => {
    setSelectedTransaction(transaction);
    setEditFormData({
      merchant: transaction.merchant,
      amount: transaction.amount.toString(), // Convert amount to string for input
      date: new Date(transaction.date), // Ensure date is a Date object
      // Provide fallback to null if categoryId is undefined
      categoryId: transaction.categoryId ?? null,
      description: transaction.description || '',
    });
    setIsEditModalVisible(true);
  };

  const closeEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedTransaction(null);
  };

  const handleInputChange = (name: keyof typeof editFormData, value: string | Date | null) => {
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS until dismissed
    if (selectedDate) {
      handleInputChange('date', selectedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

    // Basic validation
    if (!editFormData.merchant || !editFormData.amount || !editFormData.date) {
        Alert.alert('Validation Error', 'Merchant, Amount, and Date are required.');
        return;
    }
    const amountNumber = parseFloat(editFormData.amount);
    if (isNaN(amountNumber)) {
        Alert.alert('Validation Error', 'Amount must be a valid number.');
        return;
    }

    try {
      setLoading(true); // Indicate loading state during update
      const updatedData = {
        ...editFormData,
        amount: amountNumber, // Send amount as number
        date: editFormData.date.toISOString(), // Send date as ISO string
        // categoryId can be null
      };
      await apiUpdateTransaction(selectedTransaction.id, updatedData);
      closeEditModal();
      await fetchData(); // Refresh the list
      Alert.alert('Success', 'Transaction updated successfully.');
    } catch (err: any) {
      console.error("Error updating transaction:", err);
      setError(err.message || 'Failed to update transaction');
      Alert.alert('Error', 'Could not update transaction.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true); // Indicate loading state during delete
              // Add a small delay to show loading indicator before executing delete
              await new Promise(resolve => setTimeout(resolve, 300));
              await apiDeleteTransaction(transactionId);
              
              // Update local state by filtering out the deleted transaction
              setTransactions(currentTransactions => 
                currentTransactions.filter(t => t.id !== transactionId)
              );
              
              Alert.alert('Success', 'Transaction deleted successfully.');
            } catch (err: any) {
              console.error("Error deleting transaction:", err);
              setError(err.message || 'Failed to delete transaction');
              Alert.alert('Error', 'Could not delete transaction.');
              await fetchData(); // Refresh the list if delete failed
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderTransactionItem = ({ item }: { item: TransactionWithCategory }) => (
    <Card style={styles.card}>
      <View style={styles.transactionRow}>
        <View style={styles.transactionDetails}>
          <ThemedText style={styles.merchant}>{item.merchant}</ThemedText>
          <ThemedText style={styles.date}>{new Date(item.date).toLocaleDateString()}</ThemedText>
          <ThemedText style={styles.category}>
            Category: {item.category?.name || 'Uncategorized'}
          </ThemedText>
          {item.description && <ThemedText style={styles.description}>Desc: {item.description}</ThemedText>}
        </View>
        <View style={styles.transactionAmountContainer}>
            <ThemedText style={styles.amount}>${item.amount.toFixed(2)}</ThemedText>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <Button title="Edit" onPress={() => openEditModal(item)} style={styles.actionButton} />
        {/* Corrected style usage for Delete button */}
        <Button title="Delete" onPress={() => handleDeleteTransaction(item.id)} style={StyleSheet.flatten([styles.actionButton, styles.deleteButton])} textStyle={styles.deleteButtonText} />
      </View>
    </Card>
  );

  if (loading && transactions.length === 0) { // Show loading indicator only on initial load
    return (
      <ContainerLayout style={styles.container} contentContainerStyle={styles.centeredContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText>Loading transactions...</ThemedText>
      </ContainerLayout>
    );
  }

  if (error) {
    return (
      <ContainerLayout style={styles.container} contentContainerStyle={styles.centeredContent}>
        <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
        <Button title="Retry" onPress={fetchData} />
      </ContainerLayout>
    );
  }

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <ContainerLayout style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ThemedText type="title" style={styles.title}>All Transactions</ThemedText>
      {loading && <ActivityIndicator style={styles.inlineLoader} color={colors.primary} />}
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<ThemedText style={styles.emptyText}>No transactions found.</ThemedText>}
      />

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Edit Transaction</ThemedText>

            <Input
              label="Merchant"
              value={editFormData.merchant}
              onChangeText={(text) => handleInputChange('merchant', text)}
              placeholder="Enter merchant name"
              style={styles.input}
            />
            <Input
              label="Amount"
              value={editFormData.amount}
              onChangeText={(text) => handleInputChange('amount', text)}
              placeholder="Enter amount"
              keyboardType="numeric"
              style={styles.input}
            />

            {/* Date Picker */}
            <View style={styles.datePickerContainer}>
                <ThemedText style={styles.label}>Date</ThemedText>
                <TouchableOpacity onPress={showDatepicker} style={styles.dateDisplay}>
                    <ThemedText>{editFormData.date.toLocaleDateString()}</ThemedText>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                    testID="dateTimePicker"
                    value={editFormData.date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    />
                )}
            </View>

            {/* Category Picker */}
             <View style={styles.pickerContainer}>
                <ThemedText style={styles.label}>Category</ThemedText>
                <Picker
                    selectedValue={editFormData.categoryId}
                    // Explicitly type itemValue
                    onValueChange={(itemValue: string | null) => handleInputChange('categoryId', itemValue)}
                    style={styles.picker} // Apply styles for the picker itself if needed
                    itemStyle={styles.pickerItem} // Style for individual items
                >
                    <Picker.Item label="-- Uncategorized --" value={null} />
                    {categories.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                    ))}
                </Picker>
            </View>

            <Input
              label="Description (Optional)"
              value={editFormData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Enter description"
              style={styles.input}
              multiline
            />

            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={closeEditModal} style={styles.modalButton} />
              {/* Corrected style usage for Save button */}
              <Button title="Save Changes" onPress={handleUpdateTransaction} style={StyleSheet.flatten([styles.modalButton, styles.saveButton])} />
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    marginBottom: 15,
    padding: 15,
    // Add other card styling as needed from your Card component or define here
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  transactionDetails: {
    flex: 1, // Take available space
    marginRight: 10,
  },
  transactionAmountContainer: {
    justifyContent: 'center', // Center amount vertically if needed
    alignItems: 'flex-end',
  },
  merchant: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 16,
    // Consider color coding amount (e.g., green for income, red for expense if applicable)
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  category: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align buttons to the right
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  actionButton: {
    marginLeft: 10,
    paddingVertical: 5, // Smaller padding for action buttons
    paddingHorizontal: 12,
    minWidth: 60, // Ensure buttons have a minimum width
  },
  deleteButton: {
    backgroundColor: '#dc3545', // Red color for delete
  },
  deleteButtonText: {
      color: '#fff', // White text for delete button
  },
  inlineLoader: {
    marginVertical: 10,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    // Use ThemedView's background color or define one
    // backgroundColor: 'white', // Example, adjust based on theme
    alignItems: 'stretch', // Stretch items like inputs
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15, // Add spacing below inputs
  },
  datePickerContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666', // Adjust color as needed
  },
  dateDisplay: {
    borderWidth: 1,
    borderColor: '#ccc', // Adjust border color
    padding: 10,
    borderRadius: 5,
    // backgroundColor: '#f8f8f8', // Adjust background
  },
  pickerContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    // backgroundColor: '#f8f8f8', // Match date display or input style
  },
  picker: {
     // Height might be needed on Android, adjust as necessary
     // height: 50, // Example
     width: '100%', // Take full width
  },
  pickerItem: {
      // Style individual picker items if needed (e.g., font size)
      // Note: Styling options might be limited depending on OS
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out buttons
    marginTop: 20,
  },
  modalButton: {
    flex: 1, // Make buttons take equal space
    marginHorizontal: 5, // Add space between buttons
  },
  saveButton: {
    backgroundColor: '#28a745', // Green color for save
  },
});
