// ...existing code...
import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag as AntTag, Input, Modal, message } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { getTags, createTag, updateTag, deleteTag } from '../../services/tag.service';

const isSystemTag = (tag) => tag.creatorId === null || tag.creatorId === undefined;

export const TagListPage = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'edit'
  const [currentTag, setCurrentTag] = useState(null);
  const [tagName, setTagName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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
        <h1 style={{ margin: 0 }}>Quản lý Tag</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Thêm tag hệ thống
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tags}
        rowKey="_id"
        loading={loading}
        pagination={false}
      />

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
