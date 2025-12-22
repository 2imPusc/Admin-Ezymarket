import axios from 'axios'
import { message } from 'antd'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    } else if (error.response?.status === 403) {
      message.error('Bạn không có quyền truy cập.')
    } else if (error.response?.status === 500) {
      message.error('Lỗi server. Vui lòng thử lại sau.')
    }
    return Promise.reject(error)
  }
)

export default apiClient
