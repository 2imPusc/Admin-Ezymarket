import api from './api';

export const getUnits = async (params = {}) => {
  const res = await api.get('/units', { params });
  return res.data;
};

export const searchUnits = async (q = '', type, page = 1, limit = 20, sort = 'name') => {
  const res = await api.get('/units/search', { params: { q, type, page, limit, sort } });
  return res.data;
};

export const createUnit = async (data) => {
  const res = await api.post('/units', data);
  return res.data;
};

export const updateUnit = async (id, data) => {
  const res = await api.put(`/units/${id}`, data);
  return res.data;
};

export const deleteUnit = async (id) => {
  const res = await api.delete(`/units/${id}`);
  return res.data;
};

export const batchDeleteUnits = async (ids = []) => {
  const res = await api.post('/units/batch-delete', { ids });
  return res.data;
};

export const getUnitStats = async () => {
  const res = await api.get('/units/stats');
  return res.data;
};

export const getUnitsByType = async (type) => {
  const res = await api.get(`/units/type/${type}`);
  return res.data;
};

export const getUnitById = async (id) => {
  const res = await api.get(`/units/${id}`);
  return res.data;
};