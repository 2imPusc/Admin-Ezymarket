import api from './api';

const sanitizeTags = (tags) => {
  return Array.from(
    new Set(
      (tags || [])
        .map((t) => (typeof t === 'string' ? t : (t?.name ?? String(t))))
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
};

export const recipeService = {
  // Lấy tất cả recipes (system + user recipes) - dùng search endpoint
  getRecipes: async (params) => {
    const { page = 1, pageSize = 20, search = '', tagId } = params;
    const response = await api.get('/recipes/search', {
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
    const response = await api.get('/recipes/system-recipes', {
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
    const res = await api.get(`/recipes/${id}`);
    return res.data;
  },

  createRecipe: async (data) => {
    const payload = { ...data, tags: sanitizeTags(data.tags) };
    const res = await api.post('/recipes', payload);
    return res.data;
  },

  updateRecipe: async (id, data) => {
    const payload = { ...data, tags: sanitizeTags(data.tags) };
    const res = await api.put(`/recipes/${id}`, payload);
    return res.data;
  },

  deleteRecipe: async (id) => {
    await apiClient.delete(`/recipes/${id}`);
  },

  suggestIngredients: async (q) => {
    if (!q?.trim()) return [];
    const res = await api.get('/ingredients/suggestions', {
      params: { q: q.trim(), limit: 10 },
    });
    return res.data?.ingredients || [];
  },
};
