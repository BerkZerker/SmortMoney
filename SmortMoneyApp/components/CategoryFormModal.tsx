import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { ThemedText } from './ThemedText';
import { Button } from './Button';
import { Input } from './Input';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define available icons for categories
const AVAILABLE_ICONS = [
  'food', 'food-apple', 'silverware-fork-knife', 'coffee', 'beer',
  'shopping', 'cart', 'tag', 'cash', 'credit-card',
  'home', 'home-city', 'lightbulb', 'water', 'gas-station',
  'cellphone', 'television', 'laptop', 'router-wireless',
  'bus', 'car', 'airplane', 'train', 'taxi',
  'heart-pulse', 'medical-bag', 'pill', 'hospital-box',
  'school', 'book-open-variant', 'pencil', 'notebook',
  'gamepad-variant', 'movie', 'music', 'palette', 'basketball',
  'briefcase', 'account-tie', 'hammer-wrench', 'tools',
  'gift', 'cake-variant', 'ticket', 'emoticon-happy',
  'shape-outline', 'star', 'check-circle'
];

// Data interface
interface CategoryData {
  name: string;
  iconName?: string | null;
}

// Props interface
interface CategoryFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (categoryData: CategoryData) => Promise<void>;
  initialData?: CategoryData & { id?: string };
  mode: 'add' | 'edit';
}

export default function CategoryFormModal({
  isVisible,
  onClose,
  onSave,
  initialData,
  mode
}: CategoryFormModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [name, setName] = useState('');
  const [iconName, setIconName] = useState<string | null>('shape-outline');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isVisible) {
      setName(initialData?.name || '');
      setIconName(initialData?.iconName || 'shape-outline');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isVisible, initialData]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        iconName
      });
      handleClose();
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const toggleIconPicker = () => {
    setShowIconPicker(prev => !prev);
  };

  const selectIcon = (icon: string) => {
    setIconName(icon);
    setShowIconPicker(false);
  };

  // Icon picker component
  const IconPicker = () => (
    <View style={[styles.iconPickerContainer, { backgroundColor: colors.card }]}>
      <View style={styles.iconPickerHeader}>
        <ThemedText type="defaultSemiBold">Select an Icon</ThemedText>
        <TouchableOpacity onPress={toggleIconPicker}>
          <MaterialCommunityIcons name="close" size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={AVAILABLE_ICONS}
        keyExtractor={(item) => item}
        numColumns={6}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.iconItem,
              iconName === item && { 
                backgroundColor: colors.primary + '20',
                borderColor: colors.primary 
              }
            ]}
            onPress={() => selectIcon(item)}
          >
            <MaterialCommunityIcons name={item} size={28} color={colors.primary} />
          </TouchableOpacity>
        )}
        style={styles.iconGrid}
      />
    </View>
  );

  // Main modal content
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View 
            style={[
              styles.modalContainer, 
              { 
                backgroundColor: colors.card,
                borderColor: colors.border
              }
            ]}
          >
            <View style={styles.header}>
              <ThemedText type="subtitle">
                {mode === 'add' ? 'Add New Category' : 'Edit Category'}
              </ThemedText>
              <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                <MaterialCommunityIcons name="close" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              <View style={styles.formContent}>
                <Input
                  label="Category Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter category name"
                  autoCapitalize="words"
                  error={error || undefined}
                  editable={!isSubmitting}
                />
                
                <View style={styles.iconSelector}>
                  <ThemedText style={styles.iconLabel}>Category Icon</ThemedText>
                  <TouchableOpacity 
                    style={[
                      styles.selectedIconContainer,
                      { 
                        borderColor: colors.border,
                        backgroundColor: colors.input
                      }
                    ]} 
                    onPress={toggleIconPicker}
                  >
                    <MaterialCommunityIcons 
                      name={iconName || 'shape-outline'} 
                      size={28} 
                      color={colors.primary} 
                    />
                    <ThemedText style={styles.changeIconText}>
                      {iconName ? 'Change Icon' : 'Select Icon'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {showIconPicker && <IconPicker />}
                
                <View style={styles.buttonContainer}>
                  <Button
                    title="Cancel"
                    onPress={handleClose}
                    disabled={isSubmitting}
                    variant="outline"
                    style={styles.cancelButton}
                  />
                  <Button
                    title={isSubmitting ? 'Saving...' : 'Save Category'}
                    onPress={handleSave}
                    disabled={isSubmitting || !name.trim()}
                    loading={isSubmitting}
                    variant="primary"
                    style={styles.saveButton}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  iconSelector: {
    marginBottom: 16,
  },
  iconLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  changeIconText: {
    marginLeft: 12,
  },
  iconPickerContainer: {
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  iconPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  iconGrid: {
    padding: 8,
    maxHeight: 240,
  },
  iconItem: {
    width: '16.666%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
});