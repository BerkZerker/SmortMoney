import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

interface CategoryData {
  name: string;
  iconName?: string | null;
}

interface CategoryFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (categoryData: CategoryData) => Promise<void>; // Make onSave async
  initialData?: CategoryData & { id?: string }; // Include optional id for context
  mode: 'add' | 'edit';
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isVisible,
  onClose,
  onSave,
  initialData,
  mode,
}) => {
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('');
  const [isSaving, setIsSaving] = useState(false); // Add saving state

  useEffect(() => {
    // Populate form when initialData changes (e.g., when opening for edit)
    if (isVisible && initialData) {
      setName(initialData.name || '');
      setIconName(initialData.iconName || '');
    } else if (isVisible && mode === 'add') {
      // Reset form when opening for add
      setName('');
      setIconName('');
    }
    // Reset saving state when modal visibility changes
    setIsSaving(false);
  }, [isVisible, initialData, mode]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Category name cannot be empty.');
      return;
    }
    setIsSaving(true); // Set saving state
    try {
      await onSave({ name: name.trim(), iconName: iconName.trim() || null });
      // onClose(); // Let the parent handle closing after successful save
    } catch (error) {
      // Error handling is likely done in the parent's onSave, but good to have a catch here
      console.error('Error saving category in modal:', error);
      Alert.alert('Error', `Failed to ${mode === 'add' ? 'add' : 'edit'} category.`);
      setIsSaving(false); // Reset saving state on error
    }
    // No finally block to reset isSaving, parent should close modal which resets it via useEffect
  };

  const handleCancel = () => {
    if (isSaving) return; // Prevent closing while saving
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel} // Allow closing via back button on Android
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{mode === 'add' ? 'Add New Category' : 'Edit Category'}</Text>

          <Text style={styles.label}>Name:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Groceries, Utilities"
            value={name}
            onChangeText={setName}
            editable={!isSaving} // Disable input while saving
          />

          <Text style={styles.label}>Icon Name (Optional):</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., shopping-cart, bolt"
            value={iconName}
            onChangeText={setIconName}
            editable={!isSaving} // Disable input while saving
          />

          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={handleCancel} color="#666" disabled={isSaving} />
            <Button
              title={isSaving ? 'Saving...' : 'Save'}
              onPress={handleSave}
              disabled={isSaving} // Disable button while saving
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim background
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 35,
    alignItems: 'stretch', // Stretch items like TextInput
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%', // Modal width
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out buttons
    marginTop: 20,
  },
});

export default CategoryFormModal;
