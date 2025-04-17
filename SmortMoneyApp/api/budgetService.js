import axios from 'axios';

// TODO: Replace with your actual backend URL
const API_URL = 'http://localhost:3000/api/budgets'; // Assuming backend runs on port 3000

// Fetch budgets, optionally filtering by month and year
export const getBudgets = async (month, year) => {
  try {
    // Backend expects month (1-12) and year
    const response = await axios.get(API_URL, {
      params: { month, year },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching budgets for ${year}-${month}:`, error);
    throw error;
  }
};

// Create or update a budget (upsert logic might be handled backend-side)
// The backend route likely handles finding by categoryId, month, year and updating or creating.
export const upsertBudget = async (budgetData) => {
  // budgetData should contain: categoryId, amount, month, year
  try {
    // Using POST, assuming the backend handles upsert logic on this endpoint
    // Alternatively, could be PUT if the backend expects an ID or specific update path
    const response = await axios.post(API_URL, budgetData);
    return response.data;
  } catch (error) {
    console.error('Error creating/updating budget:', error);
    throw error;
  }
};

// Delete a budget (might need specific ID or combination of category/month/year)
// Assuming deletion requires the budget's specific ID for now.
// Adjust if backend uses category/month/year for deletion.
export const deleteBudget = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting budget ${id}:`, error);
    throw error;
  }
};

// --- Alternative Delete (if backend uses category/month/year) ---
/*
export const deleteBudgetByDetails = async (categoryId, month, year) => {
  try {
    // Example: DELETE /api/budgets?categoryId=...&month=...&year=...
    const response = await axios.delete(API_URL, {
      params: { categoryId, month, year },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting budget for category ${categoryId}, ${year}-${month}:`, error);
    throw error;
  }
};
*/
