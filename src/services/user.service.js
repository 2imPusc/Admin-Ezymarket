import apiClient from './api'

export const userService = {
  getUsers: async (params) => {
    const response = await apiClient.get('/admin/users', {
      params,
    })
    return response.data
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`)
    return response.data.data
  },

  createUser: async (data) => {
    const response = await apiClient.post('/users', data)
    return response.data.data
  },

  updateUser: async (id, data) => {
    const response = await apiClient.put(`/users/${id}`, data)
    return response.data.data
  },

  deleteUser: async (id) => {
    await apiClient.delete(`/users/${id}`)
  },

  updateUserStatus: async (id, status) => {
    const response = await apiClient.patch(`/users/${id}/status`, { status })
    return response.data.data
  },
}
