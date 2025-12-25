import { Table, Button, Space, Tag as AntTag, Input, Modal, message, Select, Segmented } from 'antd';
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { getTags, createTag, updateTag, deleteTag } from '@/services/tag.service';

const isSystemTag = (tag) => tag.creatorId === null || tag.creatorId === undefined;

export const TagListPage = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'edit'
  const [currentTag, setCurrentTag] = useState(null);
  const [tagName, setTagName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('name_asc');

  useEffect(() => {
    const h = setTimeout(() => setSearch(searchTerm.trim()), 400);
    return () => clearTimeout(h);
  }, [searchTerm]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await getTags();
      setTags(res.tags || []);
    } catch (err) {
      message.error('Không thể tải danh sách tag.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const openCreateModal = () => {
    setModalType('create');
    setTagName('');
    setModalVisible(true);
    setCurrentTag(null);
  };

  const openEditModal = (tag) => {
    setModalType('edit');
    setTagName(tag.name);
    setCurrentTag(tag);
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    if (!tagName.trim()) return;
    setActionLoading(true);
    try {
      if (modalType === 'create') {
        await createTag({ name: tagName });
        message.success('Tạo tag thành công!');
      } else if (modalType === 'edit' && currentTag) {
        await updateTag(currentTag._id, { name: tagName });
        message.success('Cập nhật tag thành công!');
      }
      setModalVisible(false);
      fetchTags();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Thao tác thất bại.');
    }
    setActionLoading(false);
  };

  const handleDelete = (tag) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa tag "${tag.name}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        setActionLoading(true);
        try {
          await deleteTag(tag._id);
          message.success('Xóa tag thành công!');
          fetchTags();
        } catch (err) {
          message.error(err?.response?.data?.message || 'Xóa tag thất bại.');
        }
        setActionLoading(false);
      },
    });
  };

  const columns = [
    {
      title: 'Tên tag',
      dataIndex: 'name',
      key: 'name',
      render: (name, tag) => (
        <Space>
          <AntTag color={isSystemTag(tag) ? 'geekblue' : 'default'}>{name}</AntTag>
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'creatorId',
      key: 'type',
      align: 'center',
      render: (creatorId) => (
        <AntTag color={creatorId === null || creatorId === undefined ? 'red' : 'blue'}>
          {creatorId === null || creatorId === undefined ? 'System' : 'Personal'}
        </AntTag>
      ),
    },
    {
      title: 'Người tạo',
      dataIndex: 'creatorId',
      key: 'creator',
      align: 'center',
      render: (creatorId) =>
        creatorId === null || creatorId === undefined ? <i>Admin</i> : creatorId,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (date ? new Date(date).toLocaleString() : ''),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      render: (_, tag) =>
        isSystemTag(tag) ? (
          <Space size="small">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => openEditModal(tag)}
              disabled={actionLoading}
            >
              Sửa
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(tag)}
              disabled={actionLoading}
            >
              Xóa
            </Button>
          </Space>
        ) : (
          <span style={{ color: '#888' }}>-</span>
        ),
    },
  ];

  const viewTags = useMemo(() => {
    let list = tags.slice();
    if (typeFilter === 'system') list = list.filter(isSystemTag);
    else if (typeFilter === 'personal') list = list.filter(t => !isSystemTag(t));
    if (search) {
      const re = new RegExp(search, 'i');
      list = list.filter(t => re.test(t.name || ''));
    }
    list.sort((a, b) => {
      if (sort === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sort === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sort === 'createdAt_asc' ? ta - tb : tb - ta;
    });
    return list;
  }, [tags, typeFilter, search, sort]);

  const resetFilters = () => {
    setSearchTerm(''); setSearch('');
    setTypeFilter('all');
    setSort('name_asc');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, marginBottom: 16 }}>Quản lý Tag</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Thêm tag
        </Button>
      </div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Segmented value={typeFilter} onChange={setTypeFilter} options={[
          { label: 'All', value: 'all' },
          { label: 'System', value: 'system' },
          { label: 'Personal', value: 'personal' },
        ]} />
        <Input.Search
          placeholder="Tìm tag..."
          allowClear
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={(val) => { setSearchTerm(val); setSearch(val.trim()); }}
          style={{ width: 280 }}
        />
        <Select
          value={sort}
          onChange={setSort}
          style={{ width: 200 }}
          options={[
            { value: 'name_asc', label: 'Tên A→Z' },
            { value: 'name_desc', label: 'Tên Z→A' },
            { value: 'createdAt_desc', label: 'Mới nhất' },
            { value: 'createdAt_asc', label: 'Cũ nhất' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={resetFilters}>Reset</Button>
      </Space>

      <Table columns={columns} dataSource={viewTags} rowKey="_id" loading={loading} pagination={false} />

      <Modal
        title={modalType === 'create' ? 'Thêm tag hệ thống' : 'Sửa tag hệ thống'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={actionLoading}
        okText={modalType === 'create' ? 'Thêm' : 'Lưu'}
        cancelText="Hủy"
      >
        <Input
          placeholder="Tên tag hệ thống"
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          disabled={actionLoading}
          maxLength={50}
        />
      </Modal>
    </div>
  );
};

export default TagListPage;
