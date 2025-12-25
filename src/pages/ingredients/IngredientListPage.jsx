import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Select, InputNumber, Tag as AntTag, message, Segmented } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getIngredients, createIngredient, updateIngredient, deleteIngredient, getCategories } from '@/services/ingredient.service';

const isSystemIngredient = (ing) => ing.creatorId === null || ing.creatorId === undefined;

const columnsDef = (onEdit, onDelete) => [
  { title: 'Tên', dataIndex: 'name', key: 'name' },
  { title: 'Category', dataIndex: 'foodCategory', key: 'foodCategory' },
  { title: 'Hạn mặc định (ngày)', dataIndex: 'defaultExpireDays', key: 'defaultExpireDays', width: 140 },
  {
    title: 'Nguồn',
    key: 'source',
    width: 120,
    render: (_, r) => (isSystemIngredient(r) ? <AntTag color="geekblue">System</AntTag> : <AntTag>Personal</AntTag>),
  },
  {
    title: 'Tạo lúc',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
  },
  {
    title: 'Hành động',
    key: 'actions',
    width: 160,
    render: (_, record) => (
      <Space>
        <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(record)} disabled={!isSystemIngredient(record)}>
          Sửa
        </Button>
        <Button danger icon={<DeleteOutlined />} size="small" onClick={() => onDelete(record)} disabled={!isSystemIngredient(record)}>
          Xóa
        </Button>
      </Space>
    ),
  },
];

const IngredientListPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [scope, setScope] = useState('System'); // System | All
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // create | edit
  const [current, setCurrent] = useState(null);
  const [form] = Form.useForm();
  const [categoryOptions, setCategoryOptions] = useState([]);

  const { data: categoriesRes } = useQuery({
    queryKey: ['ingredient-categories'],
    queryFn: getCategories,
  });

  useEffect(() => {
    const list = categoriesRes?.categories || [];
    setCategoryOptions(list.map((c) => ({ label: c, value: c })));
  }, [categoriesRes]);

  useEffect(() => {
    const h = setTimeout(() => setSearch(searchTerm.trim()), 350);
    return () => clearTimeout(h);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ['ingredients', page, pageSize, search, category, scope],
    queryFn: () =>
      getIngredients({
        page,
        limit: pageSize,
        search,
        category,
        scope: scope === 'System' ? 'system' : 'all', // chuyển sang all để BE trả mọi personal (admin)
      }),
    keepPreviousData: true,
  });

  const list = useMemo(() => data?.ingredients || [], [data]);

  const pagination = data?.pagination || { total: list.length, page, pageSize };

  const createMut = useMutation({
    mutationFn: (payload) => createIngredient(payload),
    onSuccess: () => {
      message.success('Tạo thành công');
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Lỗi tạo ingredient';
      message.error(msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => updateIngredient(id, payload),
    onSuccess: () => {
      message.success('Cập nhật thành công');
      setModalOpen(false);
      setCurrent(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Lỗi cập nhật ingredient';
      message.error(msg);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteIngredient(id),
    onSuccess: () => {
      message.success('Đã xóa');
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Lỗi xóa ingredient';
      message.error(msg);
    },
  });

  const openCreate = () => {
    setModalType('create');
    setCurrent(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setModalType('edit');
    setCurrent(record);
    form.setFieldsValue({
      name: record.name,
      foodCategory: record.foodCategory,
      imageURL: record.imageURL || '',
      defaultExpireDays: record.defaultExpireDays || undefined,
    });
    setModalOpen(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: `Xóa "${record.name}"?`,
      content: 'Hành động này không thể hoàn tác.',
      okType: 'danger',
      onOk: () => deleteMut.mutate(record._id),
    });
  };

  const onCategoryChange = (val) => {
    // tự động set defaultExpireDays theo category (nếu có)
    const found = categoriesRes?.defaults?.[val];
    if (found && !current) {
      const cur = form.getFieldsValue();
      if (!cur.defaultExpireDays) {
        form.setFieldsValue({ defaultExpireDays: found });
      }
    }
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      name: String(values.name || '').trim(),
      foodCategory: values.foodCategory,
      imageURL: values.imageURL || '',
      defaultExpireDays: Number(values.defaultExpireDays) || undefined,
    };
    if (modalType === 'create') {
      // admin tạo system ingredient (backend sẽ đặt creatorId=null)
      createMut.mutate(payload);
    } else if (current?._id) {
      updateMut.mutate({ id: current._id, payload });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Segmented
            value={scope}
            onChange={setScope}
            options={['System', 'All']}
          />
          <Input.Search
            placeholder="Tìm theo tên..."
            allowClear
            style={{ width: 280 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={(v) => { setSearchTerm(v); setSearch(v.trim()); }}
          />
          <Select
            allowClear
            placeholder="Lọc theo category"
            style={{ width: 200 }}
            value={category || undefined}
            options={categoryOptions}
            onChange={(v) => { setCategory(v || ''); setPage(1); }}
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm Ingredient hệ thống</Button>
      </div>

      <Table
        columns={columnsDef(openEdit, handleDelete)}
        dataSource={list}
        rowKey="_id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: pagination.total || 0,
          showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Modal
        open={modalOpen}
        title={modalType === 'create' ? 'Thêm Ingredient hệ thống' : `Sửa Ingredient: ${current?.name || ''}`}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        okButtonProps={{ loading: createMut.isPending || updateMut.isPending }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Tên" name="name" rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input placeholder="Ví dụ: salad, muối, thịt bò..." />
          </Form.Item>
          <Form.Item label="Category" name="foodCategory" rules={[{ required: true, message: 'Chọn category' }]}>
            <Select
              placeholder="Chọn category"
              options={categoryOptions}
              onChange={onCategoryChange}
            />
          </Form.Item>
          <Form.Item label="Hình ảnh (URL)" name="imageURL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="Hạn sử dụng mặc định (ngày)" name="defaultExpireDays" rules={[{ type: 'number', min: 1, message: '>= 1' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IngredientListPage;