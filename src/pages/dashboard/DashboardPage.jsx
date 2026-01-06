import React, { useMemo, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Space, Divider, Select, Button } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  AppleOutlined,
  AppstoreOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/user.service';
import { recipeService } from '../../services/recipe.service';
import * as ingredientService from '../../services/ingredient.service';
import { getUnitStats } from '../../services/unit.service';
import { groupService } from '../../services/group.service';

export const DashboardPage = () => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];

  const usersQ = useQuery({
    queryKey: ['admin-users', 'all'],
    queryFn: () => userService.getUsers({ page: 1, pageSize: 1000 }),
  });
  const recipesQ = useQuery({
    queryKey: ['recipes', 1, 1000],
    queryFn: () => recipeService.getRecipes({ page: 1, pageSize: 1000, search: '' }),
    keepPreviousData: true,
  });
  const systemRecipesQ = useQuery({
    queryKey: ['system-recipes', 1, 1000],
    queryFn: () => recipeService.getSystemRecipes({ page: 1, pageSize: 1000, search: '' }),
    keepPreviousData: true,
  });
  const ingredientsQ = useQuery({
    queryKey: ['ingredients', 1, 1000],
    queryFn: () => ingredientService.getIngredients({ page: 1, limit: 1000 }),
    keepPreviousData: true,
  });
  const groupsQ = useQuery({
    queryKey: ['admin-groups', 'all'],
    queryFn: () => groupService.getGroups({ page: 1, pageSize: 1000 }),
  });
  const unitsStatsQ = useQuery({
    queryKey: ['unit-stats'],
    queryFn: () => getUnitStats(),
  });

  const loading = usersQ.isLoading || recipesQ.isLoading || ingredientsQ.isLoading || unitsStatsQ.isLoading || systemRecipesQ.isLoading || groupsQ.isLoading;

  const totalUsers = usersQ.data?.pagination?.total ?? usersQ.data?.total ?? usersQ.data?.count ?? 0;
  const totalRecipes = recipesQ.data?.total ?? recipesQ.data?.pagination?.total ?? (recipesQ.data?.recipes?.length ?? 0);
  const totalSystemRecipes = systemRecipesQ.data?.total ?? systemRecipesQ.data?.pagination?.total ?? (systemRecipesQ.data?.recipes?.length ?? 0);
  const totalIngredients = ingredientsQ.data?.pagination?.total ?? ingredientsQ.data?.total ?? (ingredientsQ.data?.ingredients?.length ?? 0);
  const unitStats = unitsStatsQ.data ?? {};

  // helper to extract first array found in API response
  const extractList = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    const arr = Object.values(res).find((v) => Array.isArray(v));
    return arr || [];
  };

  const recipeItems = useMemo(() => {
    return extractList(recipesQ.data) || [];
  }, [recipesQ.data]);

  const userItems = useMemo(() => extractList(usersQ.data) || [], [usersQ.data]);
  const groupItems = useMemo(() => extractList(groupsQ.data) || [], [groupsQ.data]);

  const [daysRange, setDaysRange] = useState(30); // last N days for time-series
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('createdAt_desc');
  const [scope, setScope] = useState('System'); // 'System' | 'All'

  const aggregateByDay = (items, dateField = 'createdAt', range = daysRange) => {
    const map = {};
    (items || []).forEach((r) => {
      const d = r?.[dateField];
      if (!d) return;
      const day = dayjs(d).format('YYYY-MM-DD');
      map[day] = (map[day] || 0) + 1;
    });
    const days = Array.from({ length: range }).map((_, i) => dayjs().subtract(range - 1 - i, 'day').format('YYYY-MM-DD'));
    return days.map((d) => ({ date: d, count: map[d] || 0 }));
  };

  const usersByDay = useMemo(() => aggregateByDay(userItems, 'createdAt', daysRange), [userItems, daysRange]);
  const groupsByDay = useMemo(() => aggregateByDay(groupItems, 'createdAt', daysRange), [groupItems, daysRange]);
  const recipesByDay = useMemo(() => aggregateByDay(recipeItems, 'createdAt', daysRange), [recipeItems, daysRange]);

  const recipeSourcePie = useMemo(() => {
    const sys = (systemRecipesQ.data?.recipes || []).length || totalSystemRecipes || 0;
    const all = (recipesQ.data?.recipes || []).length || totalRecipes || 0;
    const personal = Math.max(0, all - sys);
    return [
      { name: 'System', value: sys },
      { name: 'Personal', value: personal },
    ];
  }, [systemRecipesQ.data, recipesQ.data, totalSystemRecipes, totalRecipes]);

  const ingredientsByCategory = useMemo(() => {
    const list = ingredientsQ.data?.ingredients || [];
    const map = {};
    list.forEach((it) => {
      const c = it.foodCategory || 'Uncategorized';
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).slice(0, 8);
  }, [ingredientsQ.data]);

  const unitsByType = useMemo(() => {
    const byType = unitStats.byType || unitStats || {};
    return Object.keys(byType).map((k) => ({ name: k, value: byType[k] }));
  }, [unitStats]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { usersQ.refetch(); recipesQ.refetch(); ingredientsQ.refetch(); unitsStatsQ.refetch(); systemRecipesQ.refetch(); groupsQ.refetch(); }} />
        </Space>
      </div>

      {/* Days range selector placed immediately above the line charts */}
      <Row style={{ marginBottom: 12 }}>
        <Col xs={24} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Select
            value={daysRange}
            onChange={(v) => setDaysRange(v)}
            options={[
              { value: 7, label: 'Last 7 days' },
              { value: 14, label: 'Last 14 days' },
              { value: 30, label: 'Last 30 days' },
              { value: 90, label: 'Last 90 days' },
            ]}
            style={{ width: 160 }}
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card title="Người dùng mới">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={usersByDay}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#1890ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card title="Nhóm mới">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={groupsByDay}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#52c41a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Công thức mới được tạo">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={recipesByDay}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#faad14" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Tổng người dùng" value={totalUsers} prefix={<UserOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Tổng công thức" value={totalRecipes} prefix={<BookOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Tổng nguyên liệu" value={totalIngredients} prefix={<AppleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Tổng đơn vị" value={unitStats.total ?? Object.values(unitStats).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)} prefix={<AppstoreOutlined />} />
            </Card>
          </Col>

          <Col xs={24} lg={6}>
            <Card title="Nguồn công thức">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={recipeSourcePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {recipeSourcePie.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={6}>
            <Card title="Đơn vị theo type">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={unitsByType}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#52c41a" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Nguyên liệu theo category">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={ingredientsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {ingredientsByCategory.map((entry, idx) => (
                      <Cell key={`c-${idx}`} fill={colors[idx % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card>
              <h3 style={{ marginBottom: 12 }}>Quick insights</h3>
              <Space size="large">
                <div>
                  <div style={{ fontSize: 14, color: '#888' }}>System recipes</div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{totalSystemRecipes}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#888' }}>Personal recipes</div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{Math.max(0, totalRecipes - totalSystemRecipes)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#888' }}>Top ingredient categories</div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{(ingredientsByCategory[0]?.name) ?? '—'}</div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};