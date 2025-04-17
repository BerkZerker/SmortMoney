import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Image, 
  Alert, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity,
  Text as RNText,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { uploadTransactionImage, updateTransactionCategory } from '../../api/transactions';
import { getCategories } from '../../api/categoryService';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Get screen dimensions for responsive layout
const { width } = Dimensions.get('window');
const containerPadding = 16;
const contentWidth = width - (containerPadding * 2);

// Define interfaces for type safety
interface CategoryType {
  id: string;
  name: string;
  iconName?: string | null;
}

interface TransactionType {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  categoryId: string | null;
  category?: CategoryType;
}

interface ApiError {
  message: string;
  data?: any;
  error?: string;
}

interface ApiResponse {
  message: string;
  transactions: TransactionType[];
  errors?: ApiError[];
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light']; // Added fallback for colorScheme

  // State to hold multiple images
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState<string | null>(null);
  // Store status per image or overall
  const [uploadStatus, setUploadStatus] = useState('');
  // Aggregate transactions from all uploads
  const [savedTransactions, setSavedTransactions] = useState<TransactionType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        Alert.alert("Error", "Could not load categories. Category editing may not work correctly.");
      }
    };
    fetchCategories();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Editing not usually needed for multiple
      quality: 1,
      allowsMultipleSelection: true, // Enable multiple selection
    });

    if (!result.canceled && result.assets) {
      setImages(result.assets); // Store the array of selected assets
      setUploadStatus('');
      setSavedTransactions([]);
    }
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      Alert.alert('No Images', 'Please select one or more images first.');
      return;
    }

    setIsLoading(true);
    setUploadStatus(`Uploading ${images.length} image(s)...`);
    let cumulativeTransactions: TransactionType[] = [];
    let cumulativeErrors: ApiError[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      setUploadStatus(`Uploading image ${i + 1} of ${images.length}...`);
      try {
        const responseData = await uploadTransactionImage(image) as ApiResponse;
        successCount++;
        if (responseData.transactions) {
          // Ensure category data is populated if available from upload response
          const transactionsWithCategory = responseData.transactions.map(t => ({
            ...t,
            category: categories.find(c => c.id === t.categoryId)
          }));
          cumulativeTransactions = [...cumulativeTransactions, ...transactionsWithCategory];
        }
        if (responseData.errors) {
          cumulativeErrors = [...cumulativeErrors, ...responseData.errors];
        }
      } catch (error: unknown) {
        failCount++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        cumulativeErrors.push({ message: `Failed to upload/process image ${i + 1}: ${message}` });
        console.error(`Error processing image ${i + 1}:`, error);
      }
    }

    // Update final status and transactions list
    let finalStatus = `Processed ${images.length} image(s). ${successCount} succeeded, ${failCount} failed.`;
    if (cumulativeErrors.length > 0) {
      finalStatus += ` ${cumulativeErrors.length} error(s) encountered.`;
      // Optionally log detailed errors here or show a summary
    }
    setUploadStatus(finalStatus);
    setSavedTransactions(cumulativeTransactions);
    setIsLoading(false);
  };

  // Category Change Handling
  const handleChangeCategory = (transaction: TransactionType) => {
    if (isUpdatingCategory) return; // Prevent multiple updates at once

    const categoryOptions: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }> = categories.map(cat => ({
      text: cat.name,
      onPress: () => updateCategory(transaction.id, cat.id),
    }));

    // Add "Uncategorized" option
    categoryOptions.push({
      text: 'Uncategorized',
      onPress: () => updateCategory(transaction.id, null),
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
      { cancelable: true }
    );
  };

  const updateCategory = async (transactionId: string, newCategoryId: string | null) => {
    setIsUpdatingCategory(transactionId);
    try {
      const updatedTransaction = await updateTransactionCategory(transactionId, newCategoryId) as TransactionType;

      // Update local state immediately for better UX
      setSavedTransactions(prevTransactions =>
        prevTransactions.map(t =>
          t.id === transactionId ? { ...t, categoryId: newCategoryId, category: updatedTransaction.category } : t
        )
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      Alert.alert('Update Failed', `Could not update category: ${message}`);
    } finally {
      setIsUpdatingCategory(null);
    }
  };

  // Helper to get category name
  const getCategoryName = useCallback((categoryId: string | null): string => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }, [categories]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>SmortMoney</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>Transaction Scanner</ThemedText>
        </View>

        {/* Image Selection Area */}
        {images.length === 0 ? (
          // Show upload prompt if no images selected
          <Card style={styles.uploadCard}>
            <View style={styles.uploadContainer}>
              <MaterialCommunityIcons
                name="receipt-text-outline" 
                size={48} 
                color={colors.primary} 
                style={styles.uploadIcon} 
              />
              <ThemedText style={styles.uploadText}>
                Upload transaction receipts or screenshots
              </ThemedText>
              <Button 
                title="Select Images" // Updated button text
                onPress={pickImage}
                variant="primary"
                leftIcon={<MaterialCommunityIcons name="image-multiple" size={18} color="#fff" />} // Updated icon
                style={styles.uploadButton}
              />
            </View>
          </Card>
        ) : (
          // Show selected images info and upload/clear buttons
          <Card style={styles.imageCard}>
             {/* Display count */}
             <ThemedText style={styles.selectedInfoText}>
               {images.length} image(s) selected.
             </ThemedText>
             {/* Optional: Add a ScrollView with Image thumbnails here */}
             {/* <ScrollView horizontal>
               {images.map(img => <Image key={img.uri} source={{uri: img.uri}} style={styles.thumbnail} />)}
             </ScrollView> */}
            <View style={styles.buttonContainer}>
              <Button
                title={`Upload ${images.length}`}
                onPress={handleUpload} 
                loading={isLoading}
                disabled={isLoading}
                variant="primary"
                leftIcon={<MaterialCommunityIcons name="cloud-upload" size={18} color="#fff" />}
              />
              <Button 
                title="Clear"
                onPress={() => {
                  setImages([]); // Clear the images array
                  setUploadStatus('');
                  setSavedTransactions([]);
                }}
                disabled={isLoading}
                variant="outline"
                style={{ marginLeft: 8 }}
              />
            </View>
          </Card>
        )}

        {/* Status Message */}
        {uploadStatus && (
          <View style={styles.statusContainer}>
            {isLoading && uploadStatus.startsWith('Uploading image') ? ( // Show spinner only during individual uploads
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons 
                name={uploadStatus.includes('failed') ? "alert-circle" : "check-circle"} 
                size={20} 
                color={uploadStatus.includes('failed') ? colors.error : colors.success} 
              />
            )}
            <ThemedText 
              style={[
                styles.statusText, 
                {color: uploadStatus.includes('failed') ? colors.error : colors.text}
              ]}
            >
              {uploadStatus}
            </ThemedText>
          </View>
        )}

        {/* Transactions List */}
        {savedTransactions.length > 0 && (
          <View style={styles.transactionsContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Processed Transactions
            </ThemedText>
            
            {savedTransactions.map((transaction) => (
              <Card key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.merchantName}>
                    {transaction.merchant}
                  </ThemedText>
                  <ThemedText style={styles.transactionDate}>
                    {formatDate(transaction.date)}
                  </ThemedText>
                </View>
                
                <View style={styles.transactionDetails}>
                  <View style={styles.amountContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.amountText}>
                      ${transaction.amount.toFixed(2)}
                    </ThemedText>
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => handleChangeCategory(transaction)}
                    disabled={isUpdatingCategory === transaction.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: colors.primary + '20' } // 20% opacity
                    ]}
                  >
                    {isUpdatingCategory === transaction.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <MaterialCommunityIcons 
                          name={transaction.category?.iconName || "tag-outline"} 
                          size={16} 
                          color={colors.primary} 
                          style={styles.categoryIcon}
                        />
                        <RNText style={[styles.categoryText, { color: colors.primary }]}>
                          {getCategoryName(transaction.categoryId)}
                        </RNText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

      </ScrollView>
      <StatusBar style="auto" />
    </ThemedView>
  );
}

// --- Styles (Restored and added new ones) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 10, // Reduced padding
    paddingBottom: 12,
    paddingTop: 12,
    maxWidth: '100%', // Use full width on mobile
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 8, // Reduced margin
    marginBottom: 8, // Reduced margin
  },
  title: {
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  uploadCard: {
    marginVertical: 12,
  },
  uploadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  uploadIcon: {
    marginBottom: 12,
  },
  uploadText: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  uploadButton: {
    minWidth: 150,
  },
  imageCard: {
    marginVertical: 12,
    padding: 15, // Added padding for consistency
  },
  selectedInfoText: {
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
    fontStyle: 'italic',
  },
  // Optional thumbnail style
  // thumbnail: {
  //   width: 60,
  //   height: 60,
  //   borderRadius: 4,
  //   marginRight: 8,
  //   marginBottom: 12,
  // },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10, // Added margin top
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    paddingHorizontal: 10, // Added padding
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    flexShrink: 1, // Allow text to wrap if needed
  },
  transactionsContainer: {
    marginTop: 12,
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 18, // Slightly larger section title
  },
  transactionCard: {
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  merchantName: {
    fontSize: 15,
  },
  transactionDate: {
    fontSize: 13,
    opacity: 0.6,
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    minHeight: 28,
    minWidth: 90, // Adjusted minWidth
    justifyContent: 'center', // Center content in chip
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
