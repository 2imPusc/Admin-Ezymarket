import apiClient from './api';

export const recipeService = {
  // Lấy tất cả recipes (system + user recipes) - dùng search endpoint
  getRecipes: async (params) => {
    const { page = 1, pageSize = 20, search = '', tagId } = params;
    const response = await apiClient.get('/recipes/search', {
      params: {
        q: search,
        tagId,
        page,
        limit: pageSize,
      },
    });
    return response.data;
  },

  // Lấy chỉ system recipes (admin recipes)
  getSystemRecipes: async (params) => {
    const { page = 1, pageSize = 20, search = '', tagId } = params;
    const response = await apiClient.get('/recipes/system-recipes', {
      params: {
        q: search,
        tagId,
        page,
        limit: pageSize,
      },
    });
    return response.data;
  },

  getRecipeById: async (id) => {
    const response = await apiClient.get(`/recipes/${id}`);
    return response.data;
  },

  createRecipe: async (data) => {
    const response = await apiClient.post('/recipes', data);
    return response.data;
  },

  updateRecipe: async (id, data) => {
    const response = await apiClient.put(`/recipes/${id}`, data);
    return response.data;
  },

  deleteRecipe: async (id) => {
    await apiClient.delete(`/recipes/${id}`);
  },
};
