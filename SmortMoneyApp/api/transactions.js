// Define the base URL for your backend API
// Replace with your actual backend URL if different or using environment variables
const API_BASE_URL = 'http://localhost:3000/api'; // Standardized to port 3000

/**
 * Uploads a transaction screenshot to the backend for analysis.
 * @param {object} imageAsset - The image asset object from expo-image-picker (containing uri, base64, etc.)
 * @returns {Promise<object>} - The response data from the backend (including the saved transaction).
 * @throws {Error} - Throws an error if the upload or analysis fails.
 */
export const uploadTransactionImage = async (imageAsset) => {
  const apiUrl = `${API_BASE_URL}/transactions/upload`;

  // Create FormData object
  const formData = new FormData();

  // Determine the filename and type
  const uriParts = imageAsset.uri.split('/');
  const fileName = uriParts[uriParts.length - 1];
  let fileType = '';
  const uriExtensionMatch = fileName.match(/\.(\w+)$/);
  if (uriExtensionMatch) {
    const extension = uriExtensionMatch[1].toLowerCase();
    if (extension === 'jpg' || extension === 'jpeg') {
      fileType = 'image/jpeg';
    } else if (extension === 'png') {
      fileType = 'image/png';
    } else if (extension === 'gif') {
      fileType = 'image/gif';
    } else {
      // Fallback or default type if needed
      fileType = `image/${extension}`;
    }
  } else {
    // Default if no extension found (might need adjustment)
    fileType = 'image/jpeg';
  }

  // --- Fetch the image data as a blob ---
  // This is often necessary for web environments when working with file URIs
  const responseBlob = await fetch(imageAsset.uri);
  const blob = await responseBlob.blob();
  // --- End fetch blob ---

  // Append the blob data to FormData
  // The key 'screenshot' must match upload.single('screenshot') in the backend route
  formData.append('screenshot', blob, fileName); // Use the blob directly

  console.log('Uploading image to:', apiUrl);
  // console.log('FormData:', formData); // Be careful logging FormData, might be large

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      // Let fetch set the Content-Type header automatically for FormData,
      // including the boundary parameter.
      headers: {
         // 'Content-Type': 'multipart/form-data', // REMOVED
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle specific error messages from backend if available
      const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
      console.error('Upload failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('Upload successful:', responseData);
    return responseData; // Contains { message: '...', transaction: {...} }

  } catch (error) {
    console.error('Error uploading image:', error);
    // Re-throw the error to be caught by the calling component
    throw error;
  }
};

/**
 * Fetches all transactions from the backend, sorted by date descending.
 * @returns {Promise<Array<object>>} - An array of transaction objects.
 * @throws {Error} - Throws an error if fetching fails.
 */
export const getAllTransactions = async () => {
  const apiUrl = `${API_BASE_URL}/transactions`;
  console.log(`Fetching all transactions from ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
      console.error('Fetch all transactions failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('All transactions fetched successfully:', responseData.length);
    return responseData; // Should be an array of transaction objects

  } catch (error) {
    console.error('Error fetching all transactions:', error);
    throw error;
  }
};

/**
 * Updates a specific transaction with the provided data.
 * @param {string} transactionId - The ID of the transaction to update.
 * @param {object} transactionData - The data to update (merchant, amount, date, categoryId, description).
 * @returns {Promise<object>} - The updated transaction object from the backend.
 * @throws {Error} - Throws an error if the update fails.
 */
export const updateTransaction = async (transactionId, transactionData) => {
  const apiUrl = `${API_BASE_URL}/transactions/${transactionId}`;
  console.log(`Updating transaction ${transactionId} via ${apiUrl}`);
  console.log('Update data:', transactionData);

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData), // Send full update data
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
      console.error('Update transaction failed:', errorMessage, responseData);
      throw new Error(errorMessage);
    }

    console.log('Transaction updated successfully:', responseData);
    return responseData; // Contains the updated transaction object

  } catch (error) {
    console.error(`Error updating transaction ${transactionId}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific transaction.
 * @param {string} transactionId - The ID of the transaction to delete.
 * @returns {Promise<void>} - Resolves when deletion is successful.
 * @throws {Error} - Throws an error if the deletion fails.
 */
export const deleteTransaction = async (transactionId) => {
  const apiUrl = `${API_BASE_URL}/transactions/${transactionId}`;
  console.log(`Deleting transaction ${transactionId} via ${apiUrl}`);

  try {
    // Simple delay implementation without setTimeout
    await new Promise(resolve => {
      const delayTime = 300;
      const startTime = Date.now();
      
      // Create a basic polling mechanism 
      function poll() {
        if (Date.now() - startTime >= delayTime) {
          resolve();
        } else {
          // Use requestAnimationFrame if available, otherwise use a setInterval-like approach
          if (typeof window !== 'undefined' && window.requestAnimationFrame) {
            window.requestAnimationFrame(poll);
          } else {
            // Fallback for Node.js environments
            setImmediate ? setImmediate(poll) : resolve();
          }
        }
      }
      
      poll();
    });
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // DELETE requests often return 204 No Content on success, which has no body
    if (!response.ok && response.status !== 204) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      // Try to parse error message if body exists
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        // Ignore if body is not JSON or empty
      }
      console.error('Delete transaction failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log(`Transaction ${transactionId} deleted successfully.`);
    return true; // Return success indicator

  } catch (error) {
    console.error(`Error deleting transaction ${transactionId}:`, error);
    throw error;
  }
};

/**
 * Fetches the transaction summary (total spent per category) for a given month and year.
 * @param {number} month - The month (1-12).
 * @param {number} year - The year.
 * @returns {Promise<Array<{categoryId: string, totalSpent: number}>>} - An array of objects containing categoryId and totalSpent.
 * @throws {Error} - Throws an error if fetching the summary fails.
 */
export const getTransactionSummary = async (month, year) => {
  const apiUrl = `${API_BASE_URL}/transactions/summary`;

  console.log(`Fetching transaction summary for ${year}-${month} from ${apiUrl}`);

  try {
    const response = await fetch(`${apiUrl}?month=${month}&year=${year}`, { // Send month/year as query params
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
      console.error('Fetch summary failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('Transaction summary fetched successfully:', responseData);
    return responseData; // Should be an array like [{categoryId: '...', totalSpent: ...}]

  } catch (error) {
    console.error(`Error fetching transaction summary for ${year}-${month}:`, error);
    throw error;
  }
};

/**
 * Updates the category of a specific transaction.
 * @param {string} transactionId - The ID of the transaction to update.
 * @param {string | null} categoryId - The new category ID (or null to remove category).
 * @returns {Promise<{id: string, merchant: string, amount: number, date: string, categoryId: string | null, category?: {id: string, name: string, iconName?: string | null}}>} - The updated transaction object from the backend, including the nested category.
 * @throws {Error} - Throws an error if the update fails.
 */
export const updateTransactionCategory = async (transactionId, categoryId) => {
  const apiUrl = `${API_BASE_URL}/transactions/${transactionId}`;

  console.log(`Updating transaction ${transactionId} category to ${categoryId} via ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryId: categoryId }), // Send categoryId in the body
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
      console.error('Update failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('Transaction category updated successfully:', responseData);
    return responseData; // Contains the updated transaction object

  } catch (error) {
    console.error(`Error updating category for transaction ${transactionId}:`, error);
    throw error;
  }
};
