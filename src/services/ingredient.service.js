import api from './api';

export const getIngredients = async (params = {}) => {
  const res = await api.get('/ingredients', { params });
  return res.data;
};

export const createIngredient = async (data) => {
  const res = await api.post('/ingredients', data);
  return res.data;
};

export const updateIngredient = async (id, data) => {
  const res = await api.put(`/ingredients/${id}`, data);
  return res.data;
};

export const deleteIngredient = async (id) => {
  const res = await api.delete(`/ingredients/${id}`);
  return res.data;
};

export const getCategories = async () => {
  const res = await api.get('/ingredients/categories');
  return res.data;
};

export const suggestIngredients = async (q, scope = 'system') => {
  if (!q?.trim()) return [];
  const res = await api.get('/ingredients/suggestions', { params: { q: q.trim(), limit: 10, scope } });
  return res.data || [];
};