import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthLayout } from './layouts/AuthLayout';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import IngredientListPage from './pages/ingredients/IngredientListPage';
import { UserListPage } from './pages/users/UserListPage';
import { UserFormPage } from './pages/users/UserFormPage';
import { RecipeListPage } from './pages/recipes/RecipeListPage';
import RecipeFormPage from './pages/recipes/RecipeFormPage';
import { GroupListPage } from './pages/groups/GroupListPage';
import { GroupFormPage } from './pages/groups/GroupFormPage';
import { TagListPage } from './pages/tags/TagListPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <BrowserRouter>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/users" element={<UserListPage />} />
              <Route path="/users/new" element={<UserFormPage />} />
              <Route path="/users/:id" element={<UserFormPage />} />
              <Route path="/ingredients" element={<IngredientListPage />} />
              <Route path="/recipes" element={<RecipeListPage />} />
              <Route path="/recipes/new" element={<RecipeFormPage />} />
              <Route path="/recipes/:id" element={<RecipeFormPage />} />
              <Route path="/groups" element={<GroupListPage />} />
              <Route path="/groups/:id" element={<GroupFormPage />} />
              <Route path="/tags" element={<TagListPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
