import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

export const AuthLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  );
};
