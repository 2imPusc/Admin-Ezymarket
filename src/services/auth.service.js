import apiClient from './api'

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post('/admin/login', credentials)
    // Backend trả về: { user, token, refreshToken }
    return response.data
  },

  logout: async () => {
    await apiClient.post('/user/logout')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/user/me')
    return response.data.data
  },
}
