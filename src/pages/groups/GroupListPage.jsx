import { useState } from 'react';
import { Table, Button, Input, Space, Popconfirm, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '@/services/group.service';

const { Search } = Input;

export const GroupListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['groups', pagination.current, pagination.pageSize, search],
    queryFn: () =>
      groupService.getGroups({
        page: pagination.current,
        pageSize: pagination.pageSize,
        search,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: groupService.deleteGroup,
    onSuccess: () => {
      message.success('Xóa nhóm thành công!');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: () => {
      message.error('Xóa nhóm thất bại!');
    },
  });

  const columns = [
    {
      title: 'Tên nhóm',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Chủ sở hữu',
      dataIndex: ['owner', 'userName'],
      key: 'owner',
      width: 150,
      render: (text, record) => (
        <Space>
          {record.owner?.avatar && (
            <img
              src={record.owner.avatar}
              alt="avatar"
              style={{ width: 24, height: 24, borderRadius: '50%' }}
            />
          )}
          <span>{text || record.owner?.email}</span>
        </Space>
      ),
    },
    {
      title: 'Số thành viên',
      dataIndex: 'memberCount',
      key: 'memberCount',
      width: 120,
      align: 'center',
      render: (count) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/groups/${record.id}`)}
          >
            Chi tiết
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa nhóm này?"
            description="Thao tác này không thể hoàn tác!"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleTableChange = (newPagination) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPagination({ ...pagination, current: 1 });
  };

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
        <h1>Quản lý nhóm</h1>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="Tìm kiếm theo tên nhóm"
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading || deleteMutation.isPending}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} nhóm`,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};
