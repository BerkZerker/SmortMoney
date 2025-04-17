// Define the base URL for your backend API
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Deletes all transactions from the database
 * @returns {Promise<{success: boolean, message: string}>} - Success message
 * @throws {Error} - Throws an error if the operation fails
 */
export const clearAllTransactions = async () => {
  const apiUrl = `${API_BASE_URL}/transactions/clear`;
  console.log(`Clearing all transactions via ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Handle response
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore if body is not JSON or empty
      }
      console.error('Clear transactions failed:', errorMessage);
      throw new Error(errorMessage);
    }

    // Parse response data if available
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      // Handle empty response for 204 status
      responseData = { 
        success: true, 
        message: 'All transactions cleared successfully' 
      };
    }

    console.log('All transactions cleared successfully');
    return responseData;
  } catch (error) {
    console.error(`Error clearing transactions:`, error);
    throw error;
  }
};
