import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Image,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Spin,
  Select,              // <-- thêm Select
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '@/services/recipe.service';
import { getTags, suggestTags } from '@/services/tag.service';
import { EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export const RecipeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [tagMap, setTagMap] = useState({});
  const [tagOptions, setTagOptions] = useState([]); // <-- options cho suggest

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipeService.getRecipeById(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => recipeService.updateRecipe(id, data),
    onSuccess: () => {
      message.success('Cập nhật công thức thành công!');
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      setEditModalOpen(false);
    },
    onError: () => {
      message.error('Cập nhật công thức thất bại!');
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getTags();
        const list = res?.tags || [];
        setTagMap(Object.fromEntries(list.map((t) => [String(t._id), t.name])));
      } catch {
        setTagMap({});
      }
    })();
  }, []);

  const fetchTagSuggestions = async (value) => {
    const q = value?.trim();
    if (!q) return setTagOptions([]);
    try {
      const list = await suggestTags(q);
      setTagOptions(list.map((t) => ({ value: t.name, label: t.name })));
    } catch {
      setTagOptions([]);
    }
  };

  const toTagNames = (tags) =>
    (tags || [])
      .map((t) =>
        typeof t === 'string'
          ? (tagMap[t] || t)
          : (t?.name || (t?._id ? tagMap[String(t._id)] : ''))
      )
      .filter(Boolean);

  const handleEdit = () => {
    if (!recipe) return;
    form.setFieldsValue({
      title: recipe.title,
      description: recipe.description,
      imageUrl: recipe.imageUrl,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      directions: recipe.directions || [],
      tags: toTagNames(recipe.tags), // <-- mảng tên tag
      ingredients: (recipe.ingredients || []).map((ing) => ({
        ingredientId: ing.ingredientId || undefined,
        name: ing.name || '',
        quantity: ing.quantity ?? 0,
        unitId: ing.unitId || undefined,
        unitText: ing.unitText || '',
        note: ing.note || '',
        optional: Boolean(ing.optional),
      })),
    });
    setEditModalOpen(true);
  };

  const handleUpdate = (values) => {
    const formattedValues = {
      ...values,
      // values.tags đã là mảng string từ Select mode="tags", chỉ cần trim và lọc
      tags: Array.from(
        new Set((values.tags || []).map((t) => String(t).trim()).filter(Boolean))
      ),
      // giữ nguyên logic khác của bạn, hoặc chuyển sang cấu trúc ingredients/directions chuẩn nếu cần
      ingredients: values.ingredients,
      directions: values.directions,
    };
    updateMutation.mutate({ id, data: formattedValues });
  };

  if (isLoading) {
    return <Spin size="large" style={{ margin: 50 }} />;
  }

  if (!recipe) {
    return <div>Không tìm thấy công thức</div>;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/recipes')}>
          Quay lại
        </Button>
      </Space>
      <h1 style={{ marginBottom: 24 }}>Chi tiết công thức</h1>
      <Card
        title={recipe.title}
        extra={
          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
            Chỉnh sửa
          </Button>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Hình ảnh" span={2}>
            {recipe.imageUrl ? (
              <Image src={recipe.imageUrl} width={120} />
            ) : (
              <span>Không có hình ảnh</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            {recipe.description}
          </Descriptions.Item>
          <Descriptions.Item label="Tags" span={2}>
            {recipe.tags && recipe.tags.length > 0
              ? recipe.tags.map((tag) => <Tag key={tag._id}>{tag.name}</Tag>)
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Khẩu phần">{recipe.servings || '-'}</Descriptions.Item>
          <Descriptions.Item label="Chuẩn bị">
            {recipe.prepTime ? `${recipe.prepTime} phút` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Nấu">
            {recipe.cookTime ? `${recipe.cookTime} phút` : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title="Chỉnh sửa công thức"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[{ required: true, message: 'Nhập tiêu đề!' }]}
          >
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: 'Nhập mô tả!' }]}
          >
            {' '}
            <TextArea rows={3} />{' '}
          </Form.Item>
          <Form.Item label="Hình ảnh (URL)" name="imageUrl">
            {' '}
            <Input />{' '}
          </Form.Item>
          <Form.Item label="Khẩu phần" name="servings">
            {' '}
            <Input type="number" min={1} />{' '}
          </Form.Item>
          <Form.Item label="Chuẩn bị (phút)" name="prepTime">
            {' '}
            <Input type="number" min={0} />{' '}
          </Form.Item>
          <Form.Item label="Nấu (phút)" name="cookTime">
            {' '}
            <Input type="number" min={0} />{' '}
          </Form.Item>
          {/* Tags: dùng Select mode="tags" để suggest đúng */}
          <Form.Item label="Tags" name="tags">
            <Select
              mode="tags"
              placeholder="Nhập hoặc chọn tags (ví dụ: healthy, món chính)"
              style={{ width: '100%' }}
              showSearch
              filterOption={false}
              onSearch={fetchTagSuggestions}
              options={tagOptions}
              // tùy chọn: tách theo dấu phẩy nếu muốn
              // tokenSeparators={[',']}
            />
          </Form.Item>
          <Form.Item label="Nguyên liệu (mỗi dòng 1 nguyên liệu)" name="ingredients">
            <TextArea rows={3} placeholder="ví dụ: 200g thịt bò\n1 củ hành tây" />
          </Form.Item>
          <Form.Item label="Các bước (mỗi dòng 1 bước)" name="directions">
            <TextArea rows={3} placeholder="ví dụ: Bước 1: Thái thịt bò\nBước 2: Ướp gia vị" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                Cập nhật
              </Button>
              <Button onClick={() => setEditModalOpen(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
