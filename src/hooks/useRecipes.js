import { useState, useEffect, useCallback } from 'react';
import recipeService from '../services/recipeService';

/**
 * Custom hook for fetching recipes
 * @param {Object} params - Query parameters
 * @returns {Object} - { recipes, loading, error, pagination, refetch }
 */
export function useRecipes(params = {}) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await recipeService.getRecipes(params);

      // apiClient used to return response.data directly; after change it returns full axios response.
      // Normalize possible shapes: { data: { success, data, pagination, message } } or { success, data }
      const payload = res?.data ?? res;

      if (payload?.success === false) {
        setError(payload.message || 'Failed to fetch recipes');
        setRecipes([]);
        setPagination(null);
      } else if (Array.isArray(payload?.data)) {
        setRecipes(payload.data || []);
        setPagination(payload.pagination || null);
      } else if (Array.isArray(res)) {
        // some endpoints might return array directly
        setRecipes(res || []);
        setPagination(null);
      } else {
        // unknown shape but try to extract — ensure recipes is always an array
        const extracted = payload?.data ?? payload ?? [];
        setRecipes(Array.isArray(extracted) ? extracted : (extracted ? [extracted] : []));
        setPagination(payload?.pagination ?? null);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching recipes');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return {
    recipes,
    loading,
    error,
    pagination,
    refetch: fetchRecipes,
  };
}

/**
 * Custom hook for fetching a single recipe
 * @param {string} id - Recipe ID
 * @returns {Object} - { recipe, loading, error, refetch }
 */
export function useRecipe(id) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecipe = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await recipeService.getRecipeById(id);
      const payload = res?.data ?? res;

      if (payload?.success === false) {
        setError(payload.message || 'Failed to fetch recipe');
        setRecipe(null);
      } else if (payload?.data) {
        setRecipe(payload.data);
      } else {
        setRecipe(payload ?? null);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching recipe');
      setRecipe(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  return {
    recipe,
    loading,
    error,
    refetch: fetchRecipe,
  };
}
