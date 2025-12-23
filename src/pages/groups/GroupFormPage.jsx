import { useState } from 'react';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Popconfirm,
  Space,
  Avatar,
  Tag,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '@/services/group.service';
import { userService } from '@/services/user.service';
import {
  ArrowLeftOutlined,
  EditOutlined,
  UserAddOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

export const GroupFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupService.getGroupById(id),
    enabled: !!id,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users', userSearch],
    queryFn: () => userService.getUsers({ search: userSearch, pageSize: 50 }),
    enabled: isAddMemberModalOpen,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => groupService.updateGroup(id, data),
    onSuccess: () => {
      message.success('Cập nhật nhóm thành công!');
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Cập nhật nhóm thất bại!');
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }) => groupService.addMember(groupId, userId),
    onSuccess: () => {
      message.success('Thêm thành viên thành công!');
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      setIsAddMemberModalOpen(false);
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Thêm thành viên thất bại!');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }) => groupService.removeMember(groupId, userId),
    onSuccess: () => {
      message.success('Xóa thành viên thành công!');
      queryClient.invalidateQueries({ queryKey: ['group', id] });
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Xóa thành viên thất bại!');
    },
  });

  const handleEditGroup = () => {
    form.setFieldsValue({
      name: group.name,
      description: group.description,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateGroup = (values) => {
    updateMutation.mutate({ id, data: values });
  };

  const handleAddMember = (values) => {
    addMemberMutation.mutate({ groupId: id, userId: values.userId });
  };

  const handleRemoveMember = (userId) => {
    removeMemberMutation.mutate({ groupId: id, userId });
  };

  const memberColumns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar, record) => (
        <Avatar src={avatar} size={40}>
          {record.userName?.[0]?.toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: 'Tên người dùng',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '-',
    },
    {
      title: 'Vai trò',
      key: 'role',
      width: 120,
      render: (_, record) =>
        record._id === group?.owner?._id ? (
          <Tag color="gold">Chủ sở hữu</Tag>
        ) : (
          <Tag>Thành viên</Tag>
        ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) =>
        record._id !== group?.owner?._id ? (
          <Popconfirm
            title="Xóa thành viên khỏi nhóm?"
            description="Bạn có chắc chắn muốn xóa thành viên này?"
            onConfirm={() => handleRemoveMember(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!group) {
    return <div>Không tìm thấy nhóm</div>;
  }

  // Filter out users who are already members
  const availableUsers = usersData?.data?.filter(
    (user) => !group.members?.some((member) => member._id === user.id)
  );

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/groups')}>
          Quay lại
        </Button>
      </Space>

      <h1 style={{ marginBottom: 24 }}>Chi tiết nhóm</h1>

      <Card
        title="Thông tin nhóm"
        extra={
          <Button type="primary" icon={<EditOutlined />} onClick={handleEditGroup}>
            Chỉnh sửa
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Tên nhóm" span={2}>
            {group.name}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            {group.description}
          </Descriptions.Item>
          <Descriptions.Item label="Chủ sở hữu">
            <Space>
              {group.owner?.avatar && (
                <Avatar src={group.owner.avatar}>{group.owner.userName?.[0]}</Avatar>
              )}
              <span>{group.owner?.userName || group.owner?.email}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Số thành viên">
            <Tag color="blue">{group.members?.length || 0}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {new Date(group.createdAt).toLocaleString('vi-VN')}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lần cuối">
            {new Date(group.updatedAt).toLocaleString('vi-VN')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="Danh sách thành viên"
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setIsAddMemberModalOpen(true)}
          >
            Thêm thành viên
          </Button>
        }
      >
        <Table
          columns={memberColumns}
          dataSource={group.members || []}
          rowKey="_id"
          pagination={false}
          loading={removeMemberMutation.isPending}
        />
      </Card>

      {/* Edit Group Modal */}
      <Modal
        title="Chỉnh sửa thông tin nhóm"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateGroup}>
          <Form.Item
            label="Tên nhóm"
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên nhóm!' },
              { min: 3, message: 'Tên nhóm phải có ít nhất 3 ký tự!' },
            ]}
          >
            <Input placeholder="Nhập tên nhóm" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <TextArea rows={4} placeholder="Nhập mô tả nhóm" maxLength={500} showCount />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                Cập nhật
              </Button>
              <Button onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        title="Thêm thành viên vào nhóm"
        open={isAddMemberModalOpen}
        onCancel={() => setIsAddMemberModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleAddMember}>
          <Form.Item
            label="Chọn người dùng"
            name="userId"
            rules={[{ required: true, message: 'Vui lòng chọn người dùng!' }]}
          >
            <Select
              showSearch
              placeholder="Tìm kiếm và chọn người dùng"
              onSearch={setUserSearch}
              filterOption={false}
              loading={false}
            >
              {availableUsers?.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  <Space>
                    {user.avatar && <Avatar size={24} src={user.avatar} />}
                    <span>
                      {user.userName} ({user.email})
                    </span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={addMemberMutation.isPending}>
                Thêm
              </Button>
              <Button onClick={() => setIsAddMemberModalOpen(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
