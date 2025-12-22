import React, { useState } from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth.service'

export const LoginPage = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()

  const from = location.state?.from?.pathname || '/'

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = await authService.login(values)
      console.log('Login data:', data)

      // Backend trả về: { user: {...}, token: "...", refreshToken: "..." }
      const user = data.user
      const token = data.token

      if (!token || !user) {
        console.error('Thiếu token hoặc user trong response:', data)
        message.error('Đăng nhập thất bại: Dữ liệu không hợp lệ')
        return
      }

      setAuth(user, token)
      message.success('Đăng nhập thành công!')
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Login error:', error)
      message.error(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      style={{
        width: 400,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', margin: 0 }}>EzyMarket Admin</h1>
        <p style={{ color: '#666', marginTop: 8 }}>Đăng nhập vào hệ thống quản trị</p>
      </div>
      <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Email không hợp lệ!' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="Email" />
        </Form.Item>

        <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
