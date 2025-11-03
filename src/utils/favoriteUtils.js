// src/utils/favoriteUtils.js
import recipeService from '../services/recipeService';

/**
 * Get favorite recipe IDs from localStorage
 * @returns {Array<string>} Array of recipe IDs
 */
export const getFavoriteIds = () => {
  try {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  } catch (error) {
    console.error('Error getting favorite IDs:', error);
    return [];
  }
};

/**
 * Check if a recipe is favorited
 * @param {string} recipeId - Recipe ID
 * @returns {boolean}
 */
export const isFavorited = (recipeId) => {
  const favorites = getFavoriteIds();
  return favorites.includes(recipeId);
};

/**
 * Toggle favorite status
 * @param {string} recipeId - Recipe ID
 * @returns {boolean} New favorited state
 */
export const toggleFavorite = (recipeId) => {
  const favorites = getFavoriteIds();
  const index = favorites.indexOf(recipeId);
  
  if (index > -1) {
    // Remove from favorites
    favorites.splice(index, 1);
  } else {
    // Add to favorites
    favorites.push(recipeId);
  }
  
  localStorage.setItem('favorites', JSON.stringify(favorites));
  
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent('favoriteUpdated', { 
    detail: { recipeId, isFavorited: index === -1 } 
  }));
  
  return index === -1;
};

/**
 * Get all favorite recipes with full details from API
 * @returns {Promise<Array>} Array of recipe objects
 */
export const getFavoriteRecipes = async () => {
  try {
    const favoriteIds = getFavoriteIds();
    
    if (favoriteIds.length === 0) {
      return [];
    }

    // Fetch recipe details from API
    const recipePromises = favoriteIds.map(async (id) => {
      try {
        const response = await recipeService.getRecipeById(id);
        if (response.success) {
          return response.data;
        }
        return null;
      } catch (err) {
        console.error(`Error fetching recipe ${id}:`, err);
        return null;
      }
    });

    const recipes = await Promise.all(recipePromises);
    return recipes.filter(r => r !== null);
  } catch (error) {
    console.error('Error getting favorite recipes:', error);
    return [];
  }
};

/**
 * Add recipe to favorites
 * @param {string} recipeId - Recipe ID
 * @returns {boolean} Success status
 */
export const addToFavorites = (recipeId) => {
  try {
    const favorites = getFavoriteIds();
    
    if (!favorites.includes(recipeId)) {
      favorites.push(recipeId);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      
      window.dispatchEvent(new CustomEvent('favoriteUpdated', { 
        detail: { recipeId, isFavorited: true } 
      }));
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
};

/**
 * Remove recipe from favorites
 * @param {string} recipeId - Recipe ID
 * @returns {boolean} Success status
 */
export const removeFromFavorites = (recipeId) => {
  try {
    const favorites = getFavoriteIds();
    const index = favorites.indexOf(recipeId);
    
    if (index > -1) {
      favorites.splice(index, 1);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      
      window.dispatchEvent(new CustomEvent('favoriteUpdated', { 
        detail: { recipeId, isFavorited: false } 
      }));
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return false;
  }
};

/**
 * Get favorite count
 * @returns {number} Number of favorites
 */
export const getFavoriteCount = () => {
  return getFavoriteIds().length;
};