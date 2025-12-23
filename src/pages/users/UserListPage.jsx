import React, { useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, message, Modal } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/user.service';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

export const UserListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, pageSize, search, roleFilter],
    queryFn: () => userService.getUsers({ page, pageSize, search, role: roleFilter }),
  });

  console.log('User data:', data);

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      message.success('Xóa người dùng thành công!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('Xóa người dùng thất bại!');
    },
  });

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa người dùng này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns = [
    {
      title: 'Tên người dùng',
      dataIndex: 'userName',
      key: 'userName',
      width: 180, // Điều chỉnh độ rộng cột (pixel hoặc %)
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 250, // Email thường dài hơn
      ellipsis: true, // Tự động cắt text dài và hiển thị "..."
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      align: 'center', // Căn giữa nội dung
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
        </Tag>
      ),
    },
    {
      title: 'Email đã xác thực',
      dataIndex: 'emailVerified',
      key: 'emailVerified',
      width: 150,
      align: 'center',
      render: (verified) => (
        <Tag color={verified ? 'green' : 'orange'}>
          {verified ? 'Đã xác thực' : 'Chưa xác thực'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 180,
      align: 'center',
      fixed: 'right', // Cố định cột bên phải khi scroll ngang
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/users/${record.id}`)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0 }}>Quản lý người dùng</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/users/new')}>
          Thêm người dùng
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="Tìm kiếm theo email hoặc tên..."
          allowClear
          onSearch={setSearch}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="Lọc theo vai trò"
          allowClear
          style={{ width: 200 }}
          onChange={setRoleFilter}
        >
          <Option value="admin">Quản trị viên</Option>
          <Option value="user">Người dùng</Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} người dùng`,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
      />
    </div>
  );
};
