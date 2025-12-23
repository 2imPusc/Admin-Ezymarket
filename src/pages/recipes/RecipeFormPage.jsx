import { useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Spin, InputNumber, Space } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '@/services/recipe.service';

const { TextArea } = Input;
const { Option } = Select;

export const RecipeFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const isEdit = !!id;

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipeService.getRecipeById(id),
    enabled: isEdit,
  });

  const createMutation = useMutation({
    mutationFn: recipeService.createRecipe,
    onSuccess: () => {
      message.success('Thêm công thức hệ thống thành công!');
      queryClient.invalidateQueries({ queryKey: ['system-recipes'] });
      navigate('/recipes');
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Thêm công thức thất bại!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => recipeService.updateRecipe(id, data),
    onSuccess: () => {
      message.success('Cập nhật công thức hệ thống thành công!');
      queryClient.invalidateQueries({ queryKey: ['system-recipes'] });
      navigate('/recipes');
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Cập nhật công thức thất bại!');
    },
  });

  useEffect(() => {
    if (recipe) {
      // Transform backend data to form format
      const formData = {
        ...recipe,
        imageUrl: recipe.imageUrl || '',
        tags: recipe.tags?.map((tag) => tag.name) || [],
        directions: recipe.directions || [],
        ingredients:
          recipe.ingredients?.map((ing) => ({
            name: ing.ingredientId?.name || '',
            quantity: ing.quantity || 0,
            unit: ing.unitText || '',
            note: ing.note || '',
          })) || [],
      };
      form.setFieldsValue(formData);
    }
  }, [recipe, form]);

  const onFinish = (values) => {
    // Transform form data to backend format
    const payload = {
      title: values.title,
      description: values.description,
      imageUrl: values.imageUrl || '',
      prepTime: values.prepTime || 0,
      cookTime: values.cookTime || 0,
      servings: values.servings || 1,
      directions: values.directions || [],
      ingredients:
        values.ingredients?.map((ing) => ({
          name: ing.name,
          quantity: Number(ing.quantity) || 0,
          unit: ing.unit || '',
          note: ing.note || '',
          optional: false,
        })) || [],
      tags: values.tags || [],
    };

    if (isEdit) {
      updateMutation.mutate({ id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>
        {isEdit ? 'Chỉnh sửa công thức hệ thống' : 'Thêm công thức hệ thống'}
      </h1>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Ví dụ: Bò Lúc Lắc" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <TextArea rows={4} placeholder="Mô tả chi tiết về công thức" />
          </Form.Item>

          <Form.Item label="URL Hình ảnh" name="imageUrl">
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          <Space style={{ width: '100%' }} direction="horizontal">
            <Form.Item label="Thời gian chuẩn bị (phút)" name="prepTime">
              <InputNumber min={0} placeholder="15" style={{ width: 150 }} />
            </Form.Item>

            <Form.Item label="Thời gian nấu (phút)" name="cookTime">
              <InputNumber min={0} placeholder="30" style={{ width: 150 }} />
            </Form.Item>

            <Form.Item label="Số khẩu phần" name="servings">
              <InputNumber min={1} placeholder="4" style={{ width: 150 }} />
            </Form.Item>
          </Space>

          <Form.Item label="Nguyên liệu" required>
            <Form.List name="ingredients">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card key={key} size="small" style={{ marginBottom: 8 }}>
                      <Space style={{ display: 'flex', width: '100%' }} align="start">
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          rules={[{ required: true, message: 'Tên nguyên liệu là bắt buộc' }]}
                          style={{ flex: 1, marginBottom: 0 }}
                        >
                          <Input placeholder="Tên nguyên liệu" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          style={{ width: 100, marginBottom: 0 }}
                        >
                          <InputNumber placeholder="Số lượng" style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'unit']}
                          style={{ width: 100, marginBottom: 0 }}
                        >
                          <Input placeholder="Đơn vị" />
                        </Form.Item>
                        <MinusCircleOutlined
                          onClick={() => remove(name)}
                          style={{ marginTop: 8, color: 'red' }}
                        />
                      </Space>
                      <Form.Item
                        {...restField}
                        name={[name, 'note']}
                        style={{ marginTop: 8, marginBottom: 0 }}
                      >
                        <Input placeholder="Ghi chú (không bắt buộc)" />
                      </Form.Item>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Thêm nguyên liệu
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item label="Các bước thực hiện (Directions)">
            <Form.List name="directions">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      style={{ display: 'flex', marginBottom: 8, alignItems: 'flex-start' }}
                      align="start"
                    >
                      <span style={{ marginTop: 8, fontWeight: 'bold' }}>Bước {name + 1}:</span>
                      <Form.Item
                        {...restField}
                        name={name}
                        rules={[{ required: true, message: 'Nhập mô tả bước' }]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <TextArea rows={2} placeholder="Mô tả bước thực hiện" />
                      </Form.Item>
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{ marginTop: 8, color: 'red' }}
                      />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Thêm bước thực hiện
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item label="Tags" name="tags">
            <Select
              mode="tags"
              placeholder="Nhập tags và nhấn Enter (ví dụ: món chính, thịt bò)"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              style={{ marginRight: 8 }}
            >
              {isEdit ? 'Cập nhật' : 'Thêm'}
            </Button>
            <Button onClick={() => navigate('/recipes')}>Hủy</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
