import apiClient from './api';

// Tìm kiếm đơn vị (server có phân trang)
export const searchUnits = async (q = '', type) => {
  const res = await apiClient.get('/units/search', {
    params: { q, type, page: 1, limit: 10 },
  });
  return res.data?.units || [];
};