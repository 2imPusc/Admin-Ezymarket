import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';

const { Option } = Select;

export const UserFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const isEdit = !!id;

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(id),
    enabled: isEdit,
  });

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      message.success('Thêm người dùng thành công!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
    onError: () => {
      message.error('Thêm người dùng thất bại!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.updateUser(id, data),
    onSuccess: () => {
      message.success('Cập nhật người dùng thành công!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
    onError: () => {
      message.error('Cập nhật người dùng thất bại!');
    },
  });

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        email: user.email,
        userName: user.userName,
        role: user.role,
        phone: user.phone,
      });
    }
  }, [user, form]);

  const onFinish = (values) => {
    if (isEdit) {
      updateMutation.mutate({ id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}</h1>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input placeholder="Nhập email" disabled={isEdit} />
          </Form.Item>

          <Form.Item
            label="Tên người dùng"
            name="userName"
            rules={[{ required: true, message: 'Vui lòng nhập tên người dùng!' }]}
          >
            <Input placeholder="Nhập tên người dùng" />
          </Form.Item>

          <Form.Item label="Số điện thoại" name="phone">
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          {!isEdit && (
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          )}

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select placeholder="Chọn vai trò">
              <Option value="user">Người dùng</Option>
              <Option value="admin">Quản trị viên</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              style={{ marginRight: 8 }}
            >
              {isEdit ? 'Cập nhật' : 'Thêm'}
            </Button>
            <Button onClick={() => navigate('/users')}>Hủy</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
