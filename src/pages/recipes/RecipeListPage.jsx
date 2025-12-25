import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Space, Tag, Input, message, Modal, Image, Select, DatePicker } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { recipeService } from '@/services/recipe.service';
import { suggestTags } from '@/services/tag.service';
import dayjs from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;

export const RecipeListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [tagName, setTagName] = useState('');      // lọc theo tên tag (FE)
  const [tagOptions, setTagOptions] = useState([]);
  const [createdRange, setCreatedRange] = useState([]);
  const [sort, setSort] = useState('createdAt_desc');

  useEffect(() => {
    const h = setTimeout(() => setSearch(searchTerm.trim()), 400);
    return () => clearTimeout(h);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ['system-recipes', page, pageSize, search],
    queryFn: () => recipeService.getSystemRecipes({ page, pageSize, search }),
    keepPreviousData: true,
  });

  const fetchTagSuggestions = async (value) => {
    const q = value?.trim();
    if (!q) return setTagOptions([]);
    try {
      const list = await suggestTags(q);
      setTagOptions(list.map((t) => ({ value: t.name, label: t.name })));
    } catch { setTagOptions([]); }
  };

  // Lọc + sort FE trên data.recipes hiện tại
  const viewRecipes = useMemo(() => {
    let items = (data?.recipes || []).slice();
    // Tag name contains (case-insensitive)
    if (tagName) {
      const re = new RegExp(tagName, 'i');
      items = items.filter(r =>
        (r.tags || []).some(t => {
          if (!t) return false;
          const name = typeof t === 'string' ? t : (t.name || '');
          return re.test(name);
        })
      );
    }
    // CreatedAt range
    if (createdRange?.length === 2 && createdRange[0] && createdRange[1]) {
      const start = createdRange[0].startOf('day').valueOf();
      const end = createdRange[1].endOf('day').valueOf();
      items = items.filter(r => {
        const ts = r.createdAt ? new Date(r.createdAt).getTime() : 0;
        return ts >= start && ts <= end;
      });
    }
    // Sort
    items.sort((a, b) => {
      if (sort === 'title_asc') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'title_desc') return (b.title || '').localeCompare(a.title || '');
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sort === 'createdAt_asc' ? ta - tb : tb - ta;
    });
    return items;
  }, [data, tagName, createdRange, sort]);

  const deleteMutation = useMutation({
    mutationFn: recipeService.deleteRecipe,
    onSuccess: () => {
      message.success('Xóa công thức thành công!');
      queryClient.invalidateQueries({ queryKey: ['system-recipes'] });
    },
    onError: () => {
      message.error('Xóa công thức thất bại!');
    },
  });

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa công thức hệ thống này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (imageUrl) =>
        imageUrl ? (
          <Image src={imageUrl} width={60} height={60} style={{ objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
            }}
          >
            No Image
          </div>
        ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: 250,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags) => (
        <>
          {tags && tags.length > 0
            ? tags.slice(0, 3).map((tag) => (
                <Tag key={tag._id} style={{ marginBottom: 4 }}>
                  {tag.name}
                </Tag>
              ))
            : '-'}
        </>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 150,
      render: (_, record) => (
        <div>
          <div>Chuẩn bị: {record.prepTime || 0} phút</div>
          <div>Nấu: {record.cookTime || 0} phút</div>
        </div>
      ),
    },
    {
      title: 'Khẩu phần',
      dataIndex: 'servings',
      key: 'servings',
      width: 120,
      render: (servings) => servings || 'N/A',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/recipes/${record._id}`)}
          >
            Xem
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const resetFilters = () => {
    setSearchTerm('');
    setSearch('');
    setTagName('');
    setTagOptions([]);
    setCreatedRange([]);
    setSort('createdAt_desc');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Quản lý công thức</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/recipes/new')}>
          Thêm công thức
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Search
          placeholder="Tìm kiếm công thức hệ thống..."
          allowClear
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={(val) => { setSearchTerm(val); setSearch(val.trim()); }}
          style={{ width: 320 }}
          prefix={<SearchOutlined />}
        />
        <Select
          allowClear
          showSearch
          placeholder="Lọc theo Tag"
          value={tagName || undefined}
          options={tagOptions}
          onSearch={fetchTagSuggestions}
          onChange={(v) => setTagName(v || '')}
          style={{ width: 220 }}
          filterOption={false}
          getPopupContainer={() => document.body}
          dropdownMatchSelectWidth={false}
        />
        <DatePicker.RangePicker
          allowClear
          value={createdRange}
          onChange={(v) => setCreatedRange(v || [])}
        />
        <Select
          value={sort}
          onChange={setSort}
          style={{ width: 200 }}
          options={[
            { value: 'createdAt_desc', label: 'Mới nhất' },
            { value: 'createdAt_asc', label: 'Cũ nhất' },
            { value: 'title_asc', label: 'Tiêu đề A→Z' },
            { value: 'title_desc', label: 'Tiêu đề Z→A' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={resetFilters}>Reset</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={viewRecipes}
        rowKey="_id"
        loading={isLoading}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          total: data?.pagination?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} công thức hệ thống`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </div>
  );
};
