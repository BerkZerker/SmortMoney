import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Image, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadTransactionImage, updateTransactionCategory } from '../../api/transactions';
import { getCategories } from '../../api/categoryService'; // Import category service

// Define interfaces for better type safety
interface CategoryType { // Define Category type
  id: string;
  name: string;
  iconName?: string | null;
}
interface TransactionType {
  id: string;
  merchant: string;
  amount: number;
  date: string; // Keep as string from JSON, convert for display
  categoryId: string | null;
  category?: CategoryType; // Include full category object after update
}

interface ApiError {
  message: string;
  data?: any; // Optional data related to the error
  error?: string; // Optional error message string
}

interface ApiResponse {
  message: string;
  transactions: TransactionType[]; // Now expects an array
  errors?: ApiError[]; // Optional array of errors
}

// Renamed component to match filename convention (optional but good practice)
export default function HomeScreen() {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null); // Explicitly type state
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState<string | null>(null); // Track which transaction's category is being updated
  const [uploadStatus, setUploadStatus] = useState(''); // To show success/error messages
  const [savedTransactions, setSavedTransactions] = useState<TransactionType[]>([]); // State to hold array of transactions
  const [categories, setCategories] = useState<CategoryType[]>([]); // State for categories

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Optionally show an error message to the user
        Alert.alert("Error", "Could not load categories. Category editing may not work correctly.");
      }
    };
    fetchCategories();
  }, []);


  // No need for explicit permission request on Web, handled by browser
  // On mobile, permissions are typically requested when launching the picker
  // but it's good practice to ensure they are granted.

  const pickImage = async () => {
    // Request permissions first (important for iOS and Android standalone apps)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Launch the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only allow images
      allowsEditing: false, // Optional: allow editing
      quality: 1, // 1 means high quality
      // base64: true, // No longer needed if using blob upload
    });

    if (!result.canceled) {
      if (result.assets && result.assets.length > 0) {
        setImage(result.assets[0]); // Store the selected asset object
        setUploadStatus(''); // Clear previous status messages
        setSavedTransactions([]); // Clear previous transaction data
        console.log('Image selected, URI:', result.assets[0].uri);
      }
    }
  };

  const handleUpload = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    setIsLoading(true);
    setUploadStatus('Uploading and analyzing...');
    setSavedTransactions([]); // Clear previous results

    try {
      const responseData = await uploadTransactionImage(image) as ApiResponse;

      let statusMessage = responseData.message || 'Processing complete.';
      if (responseData.errors && responseData.errors.length > 0) {
        statusMessage += ` Encountered ${responseData.errors.length} error(s).`;
        console.error("Errors during processing:", responseData.errors);
      }

      setUploadStatus(statusMessage);
      // Ensure category data is populated if available from upload response
      const transactionsWithCategory = responseData.transactions?.map(t => ({
        ...t,
        category: categories.find(c => c.id === t.categoryId)
      })) || [];
      setSavedTransactions(transactionsWithCategory);

    } catch (error: unknown) {
      if (error instanceof Error) {
        setUploadStatus(`Upload failed: ${error.message}`);
      } else {
        setUploadStatus('Upload failed: An unknown error occurred.');
      }
      setSavedTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Category Change Handling ---
  const handleChangeCategory = (transaction: TransactionType) => {
    if (isUpdatingCategory) return; // Prevent multiple updates at once

    // Explicitly type the array for Alert buttons
    const categoryOptions: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }> = categories.map(cat => ({
      text: cat.name,
      onPress: () => updateCategory(transaction.id, cat.id),
    }));

    // Add "Uncategorized" option
    categoryOptions.push({
      text: 'Uncategorized',
      onPress: () => updateCategory(transaction.id, null), // Pass null for uncategorized
    });

    // Add Cancel button
    categoryOptions.push({
      text: 'Cancel',
      style: 'cancel',
    });

    Alert.alert(
      'Change Category',
      `Select a new category for "${transaction.merchant}"`,
      categoryOptions,
      { cancelable: true } // Allow dismissing by tapping outside on Android
    );
  };

  const updateCategory = async (transactionId: string, newCategoryId: string | null) => {
    setIsUpdatingCategory(transactionId); // Set loading state for this specific transaction
    try {
      // Explicitly cast the result to TransactionType
      const updatedTransaction = await updateTransactionCategory(transactionId, newCategoryId) as TransactionType;

      // Update local state immediately for better UX
      setSavedTransactions(prevTransactions =>
        prevTransactions.map(t =>
          t.id === transactionId ? { ...t, categoryId: newCategoryId, category: updatedTransaction.category } : t
        )
      );
      // Optionally show a success toast/message
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      Alert.alert('Update Failed', `Could not update category: ${message}`);
    } finally {
      setIsUpdatingCategory(null); // Clear loading state
    }
  };

  // Helper to get category name
  const getCategoryName = useCallback((categoryId: string | null): string => {
    if (!categoryId) return 'N/A';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }, [categories]);
  // --- End Category Change Handling ---


  return (
    // Wrap content in ScrollView
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>SmortMoney Transaction Upload</Text>

      {/* Button to pick image */}
      {!image && <Button title="Pick Transaction Screenshot" onPress={pickImage} />}

      {/* Display selected image and upload button */}
      {image && (
        <View style={styles.imageContainer}>
          <Text>Selected Image:</Text>
          <Image source={{ uri: image.uri }} style={styles.image} />
          <View style={styles.buttonContainer}>
            <Button title="Upload Image" onPress={handleUpload} disabled={isLoading} />
            <Button title="Clear Selection" onPress={() => { setImage(null); setUploadStatus(''); setSavedTransactions([]); }} disabled={isLoading} color="#aaa" />
          </View>
        </View>
      )}

      {/* Loading indicator */}
      {isLoading && <ActivityIndicator size="large" color="#10B981" style={styles.status} />}

      {/* Status Message */}
      {uploadStatus && <Text style={[styles.status, uploadStatus.includes('failed') && styles.errorText]}>{uploadStatus}</Text>}

      {/* Display Saved Transaction Details */}
      {savedTransactions.length > 0 && (
        <View style={styles.resultsListContainer}>
          <Text style={styles.resultTitle}>Saved Transactions:</Text>
          {savedTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.resultContainer}>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Merchant:</Text>
                <Text style={styles.transactionValue}>{transaction.merchant}</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Amount:</Text>
                <Text style={styles.transactionValue}>${transaction.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Date:</Text>
                <Text style={styles.transactionValue}>{new Date(transaction.date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Category:</Text>
                <TouchableOpacity
                  onPress={() => handleChangeCategory(transaction)}
                  disabled={isUpdatingCategory === transaction.id} // Disable while updating this specific one
                  style={styles.categoryTouchable}
                >
                  {isUpdatingCategory === transaction.id ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : (
                    <Text style={styles.categoryText}>
                      {getCategoryName(transaction.categoryId)}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <StatusBar style="auto" />
    </ScrollView> // End ScrollView
  );
}

// Re-using the styles from App.js
const styles = StyleSheet.create({
  container: {
    // flex: 1, // Remove flex: 1 for ScrollView content container
    backgroundColor: '#f0f0f0', // Light gray background
    alignItems: 'center',
    paddingBottom: 40, // Add padding at the bottom for scroll space
    paddingTop: 60, // Add padding top
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22, // Slightly larger title
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333', // Darker title color
    textAlign: 'center',
  },
  imageContainer: {
    marginVertical: 20, // Use vertical margin
    alignItems: 'center',
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%', // Wider button container
    marginTop: 20, // More space above buttons
  },
  button: { // Base button style
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100, // Minimum width
  },
  uploadButton: { // Specific style for upload button
    backgroundColor: '#10B981', // Use theme color
  },
  clearButton: { // Specific style for clear button
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  clearButtonText: {
    color: '#333', // Darker text for clear button
  },
  buttonDisabled: { // Style for disabled buttons
    opacity: 0.5,
  },
  image: {
    width: '90%', // Responsive width
    maxHeight: 350, // Limit the maximum height
    resizeMode: 'contain', // Show the whole image
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff', // White background for image area
  },
  status: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
  },
  resultContainer: { // Card style for each transaction
    backgroundColor: '#fff', // White background for the card
    borderRadius: 8,
    padding: 15,
    marginBottom: 12, // Space between cards
    shadowColor: '#000', // Shadow for depth
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2, // Elevation for Android shadow
  },
  resultsListContainer: { // Style for the container of all results
    marginTop: 20,
    width: '95%', // Slightly wider container
    alignSelf: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10, // Increased margin
    color: '#10B981', // Emerald Green
    textAlign: 'left', // Align left
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5, // Space between rows
    alignItems: 'center', // Align items vertically
  },
  transactionLabel: {
    fontWeight: '600', // Slightly bolder label
    color: '#555',
    marginRight: 5,
  },
  transactionValue: {
    color: '#333',
    flexShrink: 1, // Allow value to shrink if needed
    textAlign: 'right',
  },
  categoryTouchable: {
    paddingVertical: 2, // Add padding for easier touch
    paddingHorizontal: 5,
    borderRadius: 4,
    backgroundColor: '#e0f2f1', // Light teal background
    minWidth: 80, // Give it some minimum width
    alignItems: 'center', // Center activity indicator
    justifyContent: 'center', // Center vertically too
    minHeight: 24, // Ensure minimum height for ActivityIndicator
  },
  categoryText: {
    color: '#047857', // Darker teal text
    fontWeight: '500',
    textAlign: 'right',
  }
});
