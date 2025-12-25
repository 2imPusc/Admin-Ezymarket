import api from './api';

// Lấy danh sách tag (system + personal của user)
export const getTags = async () => {
  const res = await api.get('/recipe-tags');
  return res.data;
};

// Tạo tag mới (admin sẽ tạo system tag)
export const createTag = async (data) => {
  const res = await api.post('/recipe-tags', data);
  return res.data;
};

// Sửa tag (chỉ cho phép admin sửa system tag)
export const updateTag = async (id, data) => {
  const res = await api.put(`/recipe-tags/${id}`, data);
  return res.data;
};

// Xóa tag (chỉ cho phép admin xóa system tag)
export const deleteTag = async (id) => {
  const res = await api.delete(`/recipe-tags/${id}`);
  return res.data;
};

// Gợi ý tag theo từ khóa
export const suggestTags = async (q) => {
  const res = await api.get('/recipe-tags/suggest', { params: { q } });
  return res.data || [];
};