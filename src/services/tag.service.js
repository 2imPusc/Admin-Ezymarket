import api from './api';

// Lấy danh sách tag (system + personal của user)
export const getTags = async () => {
  const res = await api.get('/tags');
  return res.data;
};

// Tạo tag mới (admin sẽ tạo system tag)
export const createTag = async (data) => {
  const res = await api.post('/tags', data);
  return res.data;
};

// Sửa tag (chỉ cho phép admin sửa system tag)
export const updateTag = async (id, data) => {
  const res = await api.put(`/tags/${id}`, data);
  return res.data;
};

// Xóa tag (chỉ cho phép admin xóa system tag)
export const deleteTag = async (id) => {
  const res = await api.delete(`/tags/${id}`);
  return res.data;
};
