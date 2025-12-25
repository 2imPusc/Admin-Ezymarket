import React, { useState } from 'react';
import { Layout, Menu, theme, Avatar, Dropdown, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  BookOutlined,
  DashboardOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  TagsOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

const { Header, Sider, Content } = Layout;

export const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
      danger: true,
    },
  ];

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/'),
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Người dùng',
      onClick: () => navigate('/users'),
    },
    {
      key: '/groups',
      icon: <TeamOutlined />,
      label: 'Nhóm',
      onClick: () => navigate('/groups'),
    },
    { 
      key: '/ingredients', 
      icon: <AppstoreOutlined />, 
      label: 'Nguyên liệu', 
      onClick: () => navigate('/ingredients') 
    },
    {
      key: '/recipes',
      icon: <BookOutlined />,
      label: 'Công thức',
      onClick: () => navigate('/recipes'),
    },
    {
      key: '/tags',
      icon: <TagsOutlined />,
      label: 'Tag',
      onClick: () => navigate('/tags'),
    },
  ];

  // Tìm menu item phù hợp dựa trên pathname
  const getSelectedKey = () => {
    const path = location.pathname;

    // Kiểm tra các routes cụ thể trước (dài hơn)
    if (path.startsWith('/users')) return '/users';
    if (path.startsWith('/groups')) return '/groups';
    if (path.startsWith('/ingredients')) return '/ingredients';
    if (path.startsWith('/recipes')) return '/recipes';
    if (path.startsWith('/tags')) return '/tags';

    // Mặc định là dashboard
    return '/';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'EZ' : 'EzyMarket'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{ border: 'none' }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => setCollapsed(!collapsed),
            style: { fontSize: 18 },
          })}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar src={user?.avatar} icon={<UserOutlined />} />
              <span>{user?.email}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
