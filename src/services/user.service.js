import apiClient from './api'

export const userService = {
  getUsers: async (params) => {
    const response = await apiClient.get('/admin/users', {
      params,
    })
    return response.data
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/admin/users/${id}`)
    return response.data.data
  },

  createUser: async (data) => {
    const response = await apiClient.post('/admin/users', data)
    return response.data.data
  },

  updateUser: async (id, data) => {
    const response = await apiClient.put(`/admin/users/${id}`, data)
    return response.data.data
  },

  deleteUser: async (id) => {
    await apiClient.delete(`/user/${id}`)
  },
}
