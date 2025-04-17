import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity 
} from 'react-native';
import { router } from 'expo-router';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { 
  getCategories, 
  deleteCategory, 
  createCategory, 
  updateCategory 
} from '../api/categoryService';
import CategoryFormModal from '../components/CategoryFormModal';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

// Define Category type
interface Category {
  id: string;
  name: string;
  iconName?: string | null;
}

// Define CategoryData type for the form
interface CategoryData {
  name: string;
  iconName?: string | null;
}

export default function CategoriesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

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

  // Modal Handling
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

  // Delete Handling
  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${name}"?`,
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
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Categories</ThemedText>
      </View>
      
      <View style={styles.actionContainer}>
        <Button
          title="Add New Category"
          onPress={openAddModal}
          variant="primary"
          leftIcon={<MaterialCommunityIcons name="plus" size={18} color="#fff" />}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Loading categories...</ThemedText>
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
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <MaterialCommunityIcons
                    name={item.iconName || "shape-outline"}
                    size={24}
                    color={colors.primary}
                    style={styles.categoryIcon}
                  />
                  <ThemedText type="defaultSemiBold" style={styles.categoryName}>
                    {item.name}
                  </ThemedText>
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity 
                    onPress={() => openEditModal(item)}
                    style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
                  >
                    <MaterialCommunityIcons 
                      name="pencil" 
                      size={20} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeleteCategory(item.id, item.name)}
                    style={[styles.actionButton, { backgroundColor: colors.error + '10' }]}
                  >
                    <MaterialCommunityIcons 
                      name="delete" 
                      size={20} 
                      color={colors.error} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={(
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="tag-plus" 
                size={48} 
                color={colors.muted} 
              />
              <ThemedText style={styles.emptyText}>
                No categories found. Add your first category!
              </ThemedText>
            </View>
          )}
          refreshing={isLoading}
          onRefresh={fetchCategories}
        />
      )}

      {/* Bottom navigation button */}
      <View style={styles.footer}>
        <Button
          title="Back to Home"
          onPress={() => router.push('/(tabs)')}
          variant="outline"
          fullWidth
        />
      </View>

      <CategoryFormModal
        isVisible={isModalVisible}
        onClose={closeModal}
        onSave={handleSaveCategory}
        initialData={currentCategory || undefined}
        mode={modalMode}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  actionContainer: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  categoryCard: {
    marginBottom: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
  },
});