import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, message, Modal, Image } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { recipeService } from '@/services/recipe.service';

const { Search } = Input;

export const RecipeListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState(''); // nội dung người dùng đang gõ
  const [search, setSearch] = useState('');         // giá trị gửi lên API (debounced)

  // Admin chỉ xem và quản lý recipes hệ thống
  const { data, isLoading } = useQuery({
    queryKey: ['system-recipes', page, pageSize, search],
    queryFn: () => recipeService.getSystemRecipes({ page, pageSize, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: recipeService.deleteRecipe,
    onSuccess: () => {
      message.success('Xóa công thức thành công!');
      queryClient.invalidateQueries({ queryKey: ['system-recipes'] });
    },
    onError: () => {
      message.error('Xóa công thức thất bại!');
    },
  });

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa công thức hệ thống này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (imageUrl) =>
        imageUrl ? (
          <Image src={imageUrl} width={60} height={60} style={{ objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
            }}
          >
            No Image
          </div>
        ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: 250,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags) => (
        <>
          {tags && tags.length > 0
            ? tags.slice(0, 3).map((tag) => (
                <Tag key={tag._id} style={{ marginBottom: 4 }}>
                  {tag.name}
                </Tag>
              ))
            : '-'}
        </>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 150,
      render: (_, record) => (
        <div>
          <div>Chuẩn bị: {record.prepTime || 0} phút</div>
          <div>Nấu: {record.cookTime || 0} phút</div>
        </div>
      ),
    },
    {
      title: 'Khẩu phần',
      dataIndex: 'servings',
      key: 'servings',
      width: 120,
      render: (servings) => servings || 'N/A',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/recipes/${record._id}`)}
          >
            Xem
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    const h = setTimeout(() => setSearch(searchTerm.trim()), 400); // debounce 400ms
    return () => clearTimeout(h);
  }, [searchTerm]);

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
        <h1 style={{ margin: 0 }}>Quản lý công thức hệ thống</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/recipes/new')}>
          Thêm công thức hệ thống
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="Tìm kiếm công thức hệ thống..."
          allowClear
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}      // gõ là tìm (debounced)
          onSearch={(val) => {                                 // Enter/nhấn nút -> tìm ngay
            setSearchTerm(val);
            setSearch(val.trim());
          }}
          style={{ width: 400 }}
          prefix={<SearchOutlined />}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={data?.recipes || []}
        rowKey="_id"
        loading={isLoading}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.pagination?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} công thức hệ thống`,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
      />
    </div>
  );
};
