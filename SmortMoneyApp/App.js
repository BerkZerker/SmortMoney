import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadTransactionImage } from './api/transactions'; // Import the API function

export default function App() {
  const [image, setImage] = useState(null); // Stores the selected image asset object
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // To show success/error messages
  const [savedTransaction, setSavedTransaction] = useState(null); // To display saved data

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
      // aspect: [4, 3], // Optional: aspect ratio for editing
      quality: 1, // 1 means high quality
      base64: true, // Include base64 data for sending to backend
    });

    // console.log(result); // For debugging

    if (!result.canceled) {
      // The result object contains assets array in SDK 48+
      if (result.assets && result.assets.length > 0) {
        setImage(result.assets[0]); // Store the selected asset object
        setUploadStatus(''); // Clear previous status messages
        setSavedTransaction(null); // Clear previous transaction data
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
    setSavedTransaction(null);

    try {
      const responseData = await uploadTransactionImage(image);
      setUploadStatus(responseData.message || 'Upload successful!');
      setSavedTransaction(responseData.transaction); // Store the returned transaction
      // Optionally clear the image after successful upload
      // setImage(null);
    } catch (error) {
      setUploadStatus(`Upload failed: ${error.message}`);
      setSavedTransaction(null);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <View style={styles.container}>
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
            <Button title="Clear Selection" onPress={() => { setImage(null); setUploadStatus(''); setSavedTransaction(null); }} disabled={isLoading} color="#aaa" />
          </View>
        </View>
      )}

      {/* Loading indicator */}
      {isLoading && <ActivityIndicator size="large" color="#10B981" style={styles.status} />}

      {/* Status Message */}
      {uploadStatus && <Text style={[styles.status, uploadStatus.includes('failed') && styles.errorText]}>{uploadStatus}</Text>}

      {/* Display Saved Transaction Details */}
      {savedTransaction && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Saved Transaction:</Text>
          <Text>Merchant: {savedTransaction.merchant}</Text>
          <Text>Amount: {savedTransaction.amount}</Text>
          <Text>Date: {new Date(savedTransaction.date).toLocaleDateString()}</Text>
          <Text>Category ID: {savedTransaction.categoryId || 'N/A'}</Text>
          {/* TODO: Fetch and display category name based on ID */}
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Light gray background
    alignItems: 'center',
    // justifyContent: 'center', // Adjust alignment
    paddingTop: 60, // Add padding top
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30, // Increased margin
    color: '#10B981', // Emerald Green
  },
  imageContainer: {
    marginVertical: 20, // Use vertical margin
    alignItems: 'center',
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 15,
  },
  image: {
    width: '90%', // Responsive width
    aspectRatio: 1, // Keep it square or adjust as needed
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
  resultContainer: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#A7F3D0', // Sage Green border
    borderRadius: 8,
    backgroundColor: '#fff',
    width: '90%',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#10B981', // Emerald Green
  }
});
