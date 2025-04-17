import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Button, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Link } from 'expo-router'; // Use Link for navigation
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // Import icons
import { getCategories, deleteCategory, createCategory, updateCategory } from '../api/categoryService'; // Import all API functions
import CategoryFormModal from '../components/CategoryFormModal'; // Import the modal

// Define Category type (can be moved to shared types later)
interface Category {
  id: string;
  name: string;
  iconName?: string | null;
}

// Define CategoryData type for the form (without id)
interface CategoryData {
  name: string;
  iconName?: string | null;
}

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null); // For editing

  const fetchCategories = useCallback(async () => {
    if (!isLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError('Failed to fetch categories. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // --- Modal Handling ---
  const openAddModal = () => {
    setModalMode('add');
    setCurrentCategory(null);
    setIsModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setModalMode('edit');
    setCurrentCategory(category);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setCurrentCategory(null);
  };

  const handleSaveCategory = async (categoryData: CategoryData) => {
    try {
      if (modalMode === 'add') {
        await createCategory(categoryData);
        Alert.alert('Success', 'Category added successfully.');
      } else if (modalMode === 'edit' && currentCategory) {
        await updateCategory(currentCategory.id, categoryData);
        Alert.alert('Success', 'Category updated successfully.');
      }
      closeModal();
      fetchCategories();
    } catch (err) {
      Alert.alert('Error', `Failed to ${modalMode} category.`);
      console.error(`${modalMode} error:`, err);
      throw err;
    }
  };

  // --- Delete Handling ---
  const handleDeleteCategory = (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(id);
              fetchCategories();
              Alert.alert('Success', 'Category deleted successfully.');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete category.');
              console.error('Delete error:', err);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Categories</Text>

      <Button title="Add New Category" onPress={openAddModal} />

      {isLoading && categories.length === 0 && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!isLoading && !error && (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <MaterialCommunityIcons
                  name={item.iconName || 'shape-outline'} // Use provided icon or default
                  size={24}
                  color="#555" // Icon color
                  style={styles.icon}
                />
                <Text style={styles.categoryText}>{item.name}</Text>
              </View>
              <View style={styles.buttonGroup}>
                <Button title="Edit" onPress={() => openEditModal(item)} />
                <View style={styles.buttonSpacer} />
                <Button title="Delete" onPress={() => handleDeleteCategory(item.id)} color="red" />
              </View>
            </View>
          )}
          style={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No categories found. Add one!</Text>}
          refreshing={isLoading}
          onRefresh={fetchCategories}
        />
      )}

      <Link href="/(tabs)/explore" asChild>
         <Button title="Back to Explore" />
      </Link>

      <CategoryFormModal
        isVisible={isModalVisible}
        onClose={closeModal}
        onSave={handleSaveCategory}
        initialData={currentCategory ?? undefined}
        mode={modalMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  loader: {
    marginTop: 30,
  },
  list: {
    flex: 1,
    marginTop: 20,
  },
  categoryItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryInfo: { // Container for icon and text
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow this part to take available space
    marginRight: 10, // Space before buttons
  },
  icon: {
    marginRight: 10, // Space between icon and text
  },
  categoryText: {
    fontSize: 16,
    flexShrink: 1, // Allow text to shrink if needed
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSpacer: {
    width: 10,
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
  },
});
