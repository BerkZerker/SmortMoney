import axios from 'axios';

// TODO: Replace with your actual backend URL
const API_URL = 'http://localhost:3000/api/categories'; // Assuming backend runs on port 3000

// Fetch all categories
export const getCategories = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// Create a new category
export const createCategory = async (categoryData) => {
  try {
    const response = await axios.post(API_URL, categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Update an existing category
export const updateCategory = async (id, categoryData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    throw error;
  }
};

// Delete a category
export const deleteCategory = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data; // Usually an empty object or success message
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    throw error;
  }
};
