import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Modal, Platform } from 'react-native'; // Removed Dimensions as it wasn't used here
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ContainerLayout } from '@/components/ContainerLayout'; // Assuming this component exists and provides necessary layout
import { getAllTransactions, updateTransaction as apiUpdateTransaction, deleteTransaction as apiDeleteTransaction } from '@/api/transactions';
import { getCategories } from '@/api/categoryService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// --- Define Types Locally ---
interface Category {
  id: string;
  name: string;
  iconName?: string | null;
}

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  description?: string | null;
  categoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TransactionWithCategory extends Transaction {
  category?: Category | null;
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
    categoryId: null as string | null,
    description: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const colorScheme = useColorScheme(); // Get color scheme once
  const colors = Colors[colorScheme ?? 'light']; // Get colors once

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedTransactions, fetchedCategories] = await Promise.all([
        getAllTransactions(),
        getCategories()
      ]);
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
      amount: transaction.amount.toString(),
      date: new Date(transaction.date),
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
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleInputChange('date', selectedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

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
      setLoading(true);
      const updatedData = {
        ...editFormData,
        amount: amountNumber,
        date: editFormData.date.toISOString(),
      };
      await apiUpdateTransaction(selectedTransaction.id, updatedData);
      closeEditModal();
      await fetchData(); // Refresh the list after update
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
            setLoading(true); // Show loading indicator immediately
            try {
              await apiDeleteTransaction(transactionId);
              // Update local state immediately for better UX
              setTransactions(currentTransactions =>
                currentTransactions.filter(t => t.id !== transactionId)
              );
              Alert.alert('Success', 'Transaction deleted successfully.');
            } catch (err: any) {
              console.error("Error deleting transaction:", err);
              setError(err.message || 'Failed to delete transaction');
              Alert.alert('Error', 'Could not delete transaction.');
              // Optionally refresh data if delete failed to ensure consistency
              // await fetchData();
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Add clear transactions handler
  const handleClearAllTransactions = async () => {
    Alert.alert(
      'Confirm Clear All',
      'Are you sure you want to delete ALL transactions? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Import the clearAllTransactions function
              const { clearAllTransactions } = await import('@/api/clearTransactions');
              
              // Call the API
              await clearAllTransactions();
              
              // Clear the local state
              setTransactions([]);
              
              Alert.alert('Success', 'All transactions have been deleted');
            } catch (err: any) {
              console.error("Error clearing transactions:", err);
              setError(err.message || 'Failed to clear transactions');
              Alert.alert('Error', 'Could not clear transactions.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Pre-define colors once at component level to avoid hooks in render functions
  const renderTransactionItem = ({ item }: { item: TransactionWithCategory }) => {
    // Use the colors from the parent component
    // This avoids calling hooks inside the render function
    return (
    <Card style={styles.card}>
      <View style={styles.transactionRow}>
        <View style={styles.transactionDetails}>
          <ThemedText style={styles.merchant}>{item.merchant}</ThemedText>
          <ThemedText style={[styles.date, { color: colors.muted }]}>{new Date(item.date).toLocaleDateString()}</ThemedText>
          <ThemedText style={[styles.category, { color: colors.text }]}>
            Category: {item.category?.name || 'Uncategorized'}
          </ThemedText>
          {item.description && <ThemedText style={[styles.description, { color: colors.muted }]}>Desc: {item.description}</ThemedText>}
        </View>
        <View style={styles.transactionAmountContainer}>
            <ThemedText style={styles.amount}>${item.amount.toFixed(2)}</ThemedText>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <Button title="Edit" onPress={() => openEditModal(item)} style={styles.actionButton} />
        <Button title="Delete" onPress={() => handleDeleteTransaction(item.id)} style={StyleSheet.flatten([styles.actionButton, styles.deleteButton])} textStyle={styles.deleteButtonText} />
      </View>
    </Card>
  );
  };

  // --- Conditional Rendering for Loading/Error States ---
  if (loading && transactions.length === 0) {
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

  // --- Main Return Block (Using ContainerLayout as root) ---
  return (
    // Changed root element to ContainerLayout for consistency
    <ContainerLayout style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <ThemedText type="title" style={styles.title}>All Transactions</ThemedText>
        <Button 
          title="Clear All" 
          onPress={handleClearAllTransactions} 
          variant="danger"
          size="small"
          style={styles.clearButton}
        />
      </View>
      {/* Show inline loader during updates/deletes */}
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
        {/* Using ThemedView for modal background/content styling */}
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
                    onValueChange={(itemValue: string | null) => handleInputChange('categoryId', itemValue)}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
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
              <Button title="Save Changes" onPress={handleUpdateTransaction} style={StyleSheet.flatten([styles.modalButton, styles.saveButton])} />
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ContainerLayout> // Ensure this matches the opening tag
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10, // Reduced padding for better space usage
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Reduced margin
    width: '100%',
  },
  title: {
    flex: 1,
  },
  clearButton: {
    minWidth: 100,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 16, // Added horizontal padding
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center', // Center error text
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    // Color will be handled by ThemedText
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    marginBottom: 8, // Reduced margin
    padding: 10, // Reduced padding
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6, // Reduced margin
  },
  transactionDetails: {
    flex: 1,
    marginRight: 10,
  },
  transactionAmountContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  merchant: {
    fontWeight: 'bold',
    fontSize: 15, // Slightly smaller font
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 15, // Slightly smaller font
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  category: {
    fontSize: 13, // Smaller font
    color: '#444',
    marginTop: 2, // Reduced margin
  },
  description: {
    fontSize: 12, // Smaller font
    color: '#555',
    fontStyle: 'italic',
    marginTop: 2, // Reduced margin
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6, // Reduced margin
    borderTopWidth: 1,
    borderTopColor: '#eee', // Using static color since the colors variable is not accessible here
    paddingTop: 6, // Reduced padding
  },
  actionButton: {
    marginLeft: 6, // Reduced margin
    paddingVertical: 3, // Reduced padding
    paddingHorizontal: 8, // Reduced padding
    minWidth: 50, // Reduced width
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  deleteButtonText: {
      color: '#fff',
  },
  inlineLoader: {
    position: 'absolute', // Position loader nicely
    top: 60, // Adjust as needed
    alignSelf: 'center',
    zIndex: 10, // Ensure it's above list content
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '95%', // Increased width percentage
    maxWidth: 600, // Increased max width
    padding: 15, // Reduced padding
    borderRadius: 8, // Reduced border radius
    alignItems: 'stretch',
  },
  modalTitle: {
    marginBottom: 12, // Reduced margin
    textAlign: 'center',
  },
  input: {
    marginBottom: 10, // Reduced margin
  },
  datePickerContainer: {
    marginBottom: 10, // Reduced margin
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    // Color will be handled by ThemedText
  },
  dateDisplay: {
    borderWidth: 1,
    borderColor: '#ccc', // Using static color since the colors variable is not accessible here
    padding: 10,
    borderRadius: 5,
  },
  pickerContainer: {
    marginBottom: 10, // Reduced margin
    borderWidth: 1,
    borderColor: '#ccc', // Using static color since the colors variable is not accessible here
    borderRadius: 4, // Reduced border radius
  },
  picker: {
     width: '100%',
  },
  pickerItem: {
     // Platform-specific styling might be needed
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
});
