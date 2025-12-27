import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  Tag as AntTag,
  message,
  Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  batchDeleteUnits,
  getUnitStats,
} from '@/services/unit.service';

const UNIT_TYPES = [
  { label: 'weight', value: 'weight' },
  { label: 'volume', value: 'volume' },
  { label: 'count', value: 'count' },
  { label: 'length', value: 'length' },
  { label: 'area', value: 'area' },
  { label: 'other', value: 'other' },
];

const columnsDef = (onEdit, onDelete) => [
  { title: 'Tên', dataIndex: 'name', key: 'name' },
  { title: 'Viết tắt', dataIndex: 'abbreviation', key: 'abbreviation' },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: (t) => <AntTag>{t}</AntTag>,
  },
  {
    title: 'Tạo lúc',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
  },
  {
    title: 'Hành động',
    key: 'actions',
    width: 160,
    render: (_, r) => (
      <Space>
        <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(r)}>
          Sửa
        </Button>
        <Button danger icon={<DeleteOutlined />} size="small" onClick={() => onDelete(r)}>
          Xóa
        </Button>
      </Space>
    ),
  },
];

const UnitListPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [q, setQ] = useState('');
  const [type, setType] = useState(undefined);
  const [sort, setSort] = useState('name');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // create | edit
  const [current, setCurrent] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const h = setTimeout(() => setQ(searchTerm.trim()), 400);
    return () => clearTimeout(h);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ['units', page, limit, q, type, sort],
    queryFn: () => searchUnits(q, type, page, limit, sort),
    keepPreviousData: true,
  });

  const { data: stats } = useQuery({
    queryKey: ['unit-stats'],
    queryFn: getUnitStats,
  });

  const list = useMemo(() => data?.units || [], [data]);

  const createMut = useMutation({
    mutationFn: (payload) => createUnit(payload),
    onSuccess: () => {
      message.success('Tạo unit thành công');
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit-stats'] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Lỗi tạo unit';
      message.error(msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => updateUnit(id, payload),
    onSuccess: () => {
      message.success('Cập nhật unit thành công');
      setModalOpen(false);
      setCurrent(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Lỗi cập nhật unit';
      message.error(msg);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteUnit(id),
    onSuccess: () => {
      message.success('Đã xóa unit');
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit-stats'] });
    },
    onError: () => {
      message.error('Lỗi xóa unit');
    },
  });

  const batchDeleteMut = useMutation({
    mutationFn: (ids) => batchDeleteUnits(ids),
    onSuccess: (res) => {
      message.success(res?.message || 'Đã xóa nhiều đơn vị');
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit-stats'] });
    },
    onError: (err) => {
      const data = err?.response?.data;
      if (data?.usage) {
        message.error(
          `Không thể xóa do đang được dùng. Recipes: ${data.usage.recipes}, FridgeItems: ${data.usage.fridgeItems}, MealPlans: ${data.usage.mealPlans}`
        );
      } else {
        message.error(data?.message || 'Lỗi xóa hàng loạt');
      }
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
      abbreviation: record.abbreviation,
      type: record.type,
    });
    setModalOpen(true);
  };

  const onDelete = (record) => {
    Modal.confirm({
      title: `Xóa đơn vị "${record.name}"?`,
      content: 'Hành động này không thể hoàn tác.',
      okType: 'danger',
      onOk: () => deleteMut.mutate(record._id),
    });
  };

  const onBatchDelete = () => {
    if (!selectedRowKeys.length) return;
    Modal.confirm({
      title: `Xóa ${selectedRowKeys.length} đơn vị?`,
      okType: 'danger',
      onOk: () => batchDeleteMut.mutate(selectedRowKeys),
    });
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      name: String(values.name || '').trim(),
      abbreviation: String(values.abbreviation || '').trim(),
      type: values.type,
    };
    if (modalType === 'create') {
      createMut.mutate(payload);
    } else if (current?._id) {
      updateMut.mutate({ id: current._id, payload });
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setQ('');
    setType(undefined);
    setSort('name');
    setPage(1);
    setLimit(20);
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
        <h1 style={{ margin: 0, marginBottom: 16 }}>Quản lý đơn vị</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm đơn vị
        </Button>
      </div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Tìm theo tên/viết tắt..."
          allowClear
          style={{ width: 300 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={(v) => {
            setSearchTerm(v);
            setQ(v.trim());
          }}
        />
        <Select
          allowClear
          placeholder="Type"
          style={{ width: 200 }}
          value={type}
          options={UNIT_TYPES}
          onChange={(v) => {
            setType(v || undefined);
            setPage(1);
          }}
          getPopupContainer={() => document.body}
          dropdownMatchSelectWidth={false}
        />
        <Select
          value={sort}
          onChange={setSort}
          style={{ width: 220 }}
          options={[
            { value: 'name', label: 'Tên A→Z' },
            { value: '-name', label: 'Tên Z→A' },
            { value: 'type', label: 'Type A→Z' },
            { value: '-type', label: 'Type Z→A' },
            { value: 'createdAt', label: 'Cũ nhất' },
            { value: '-createdAt', label: 'Mới nhất' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={resetFilters}>
          Reset
        </Button>
      </Space>

      {stats && (
        <Card size="small" style={{ marginBottom: 12 }}>
          <Space wrap>
            <span>Tổng: {stats.total || 0}</span>
            {stats.byType &&
              Object.entries(stats.byType).map(([k, v]) => (
                <AntTag key={k} color="blue">
                  {k}: {v}
                </AntTag>
              ))}
          </Space>
        </Card>
      )}

      <Table
        columns={columnsDef(openEdit, onDelete)}
        dataSource={list}
        rowKey="_id"
        loading={isLoading}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.pagination?.total || 0,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setLimit(ps);
          },
        }}
      />

      <Modal
        open={modalOpen}
        title={modalType === 'create' ? 'Thêm đơn vị' : `Sửa đơn vị: ${current?.name || ''}`}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        okButtonProps={{ loading: createMut.isPending || updateMut.isPending }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Tên" name="name" rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input placeholder="ví dụ: gram, kilogram..." />
          </Form.Item>
          <Form.Item
            label="Viết tắt"
            name="abbreviation"
            rules={[{ required: true, message: 'Nhập viết tắt' }]}
          >
            <Input placeholder="ví dụ: g, kg..." />
          </Form.Item>
          <Form.Item label="Type" name="type" rules={[{ required: true, message: 'Chọn type' }]}>
            <Select
              options={UNIT_TYPES}
              getPopupContainer={() => document.body}
              dropdownMatchSelectWidth={false}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UnitListPage;
