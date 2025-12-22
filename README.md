# Admin EzyMarket

Ứng dụng quản trị hệ thống EzyMarket để quản lý người dùng và công thức nấu ăn.

## Công nghệ sử dụng

- **React 18** - Thư viện UI
- **JavaScript (ES6+)** - Ngôn ngữ lập trình
- **Vite** - Build tool
- **Ant Design** - Thư viện UI components
- **React Router** - Routing
- **React Query** - Data fetching và caching
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Day.js** - Date formatting

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd Admin-Ezymarket
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

4. Cập nhật URL API trong file `.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Chạy ứng dụng

### Development mode:
```bash
npm run dev
```

Ứng dụng sẽ chạy tại [http://localhost:3000](http://localhost:3000)

### Build production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

### Format code:
```bash
npm run format
```

### Lint code:
```bash
npm run lint
```

## Cấu trúc thư mục

```
src/
├── components/          # Các component dùng chung
│   └── ProtectedRoute.jsx
├── layouts/            # Layout components
│   ├── AuthLayout.jsx
│   └── MainLayout.jsx
├── pages/              # Các trang
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── dashboard/
│   │   └── DashboardPage.jsx
│   ├── users/
│   │   ├── UserListPage.jsx
│   │   └── UserFormPage.jsx
│   └── recipes/
│       ├── RecipeListPage.jsx
│       └── RecipeFormPage.jsx
├── services/           # API services
│   ├── api.js
│   ├── auth.service.js
│   ├── user.service.js
│   └── recipe.service.js
├── store/              # Global state
│   └── authStore.js
├── App.jsx             # Root component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Tính năng chính

### 1. Xác thực
- Đăng nhập
- Đăng xuất
- Protected routes
- Token-based authentication

### 2. Quản lý người dùng
- Danh sách người dùng với phân trang
- Tìm kiếm và lọc người dùng
- Thêm/sửa/xóa người dùng
- Quản lý trạng thái người dùng

### 3. Quản lý công thức
- Danh sách công thức với phân trang
- Tìm kiếm và lọc công thức
- Thêm/sửa/xóa công thức
- Quản lý nguyên liệu và các bước nấu
- Upload hình ảnh

### 4. Dashboard
- Thống kê tổng quan
- Số liệu người dùng
- Số liệu công thức

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Users
- `GET /api/users` - Lấy danh sách người dùng
- `GET /api/users/:id` - Lấy thông tin người dùng
- `POST /api/users` - Tạo người dùng mới
- `PUT /api/users/:id` - Cập nhật người dùng
- `DELETE /api/users/:id` - Xóa người dùng
- `PATCH /api/users/:id/status` - Cập nhật trạng thái

### Recipes
- `GET /api/recipes` - Lấy danh sách công thức
- `GET /api/recipes/:id` - Lấy thông tin công thức
- `POST /api/recipes` - Tạo công thức mới
- `PUT /api/recipes/:id` - Cập nhật công thức
- `DELETE /api/recipes/:id` - Xóa công thức
- `PATCH /api/recipes/:id/status` - Cập nhật trạng thái

## Hướng dẫn phát triển

### Thêm một trang mới

1. Tạo component page trong thư mục `src/pages/`
2. Thêm route trong `src/App.tsx`
3. Thêm menu item trong `src/layouts/MainLayout.tsx` (nếu cần)

### Thêm một service mới

1. Tạo file service trong `src/services/`
2. Import và sử dụng `apiClient` từ `src/services/api.ts`
3. Define các function cho API calls

### Thêm TypeScript types

1. Thêm iJSDoc cho type hints (tùy chọn)

1. Sử dụng JSDoc comments để thêm type hints
2. Ví dụ: `/** @type {string} */`

Nếu gặp vấn đề, vui lòng tạo issue trên repository hoặc liên hệ team phát triển.

## License

MIT
