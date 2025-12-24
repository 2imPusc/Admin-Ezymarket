import { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  message,
  Spin,
  InputNumber,
  Space,
  AutoComplete,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '@/services/recipe.service';

const { TextArea } = Input;
const { Option } = Select;

const RecipeFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [ingredientOptions, setIngredientOptions] = useState([]);

  const isEdit = !!id;

  const fetchIngredientSuggestions = async (value) => {
    if (!value?.trim()) {
      setIngredientOptions([]);
      return;
    }

    try {
      const suggestions = await recipeService.suggestIngredients(value.trim());

      // Bảo vệ: luôn đảm bảo là array
      if (!Array.isArray(suggestions)) {
        setIngredientOptions([]);
        return;
      }

      setIngredientOptions(
        suggestions.map((s) => ({
          value: s.name,
          label: s.name,
          ingredientId: s._id,
        }))
      );
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setIngredientOptions([]);
    }
  };

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
      const formData = {
        ...recipe,
        imageUrl: recipe.imageUrl || '',
        tags: recipe.tags?.map((tag) => tag.name) || [],
        directions: recipe.directions || [],
        ingredients:
          recipe.ingredients?.map((ing) => ({
            ingredientId: ing.ingredientId?._id || '', // Thêm ingredientId từ data backend
            name: ing.ingredientId?.name || ing.name || '', // Ưu tiên name từ Ingredient
            quantity: ing.quantity || 0,
            unitText: ing.unitText || '',
            note: ing.note || '',
          })) || [],
      };
      form.setFieldsValue(formData);
    }
  }, [recipe, form]);

  const onFinish = (values) => {
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
          ingredientId: ing.ingredientId || undefined, // Gửi ingredientId nếu có
          name: ing.name,
          quantity: Number(ing.quantity) || 0,
          unitText: ing.unitText || '',
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

          <Form.Item label="Nguyên liệu (Ingredients)">
            <Form.List name="ingredients">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      style={{ display: 'flex', marginBottom: 8, alignItems: 'flex-start' }}
                    >
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[{ required: true, message: 'Chọn hoặc nhập nguyên liệu' }]}
                        style={{ flex: 1, marginBottom: 0, minWidth: 150 }}
                      >
                        <AutoComplete
                          placeholder="Chọn hoặc nhập nguyên liệu"
                          options={ingredientOptions}
                          onSearch={fetchIngredientSuggestions}
                          filterOption={false}
                          onSelect={(value, option) => {
                            // Lưu ingredientId và name vào form
                            const currentIngredients = form.getFieldValue('ingredients');
                            currentIngredients[name] = {
                              ...currentIngredients[name],
                              name: value,
                              ingredientId: option.ingredientId,
                            };
                            form.setFieldsValue({ ingredients: currentIngredients });
                          }}
                        />
                      </Form.Item>
                      {/* Hidden field để lưu ingredientId */}
                      <Form.Item name={[name, 'ingredientId']} noStyle>
                        <Input type="hidden" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true, message: 'Nhập số lượng' }]}
                        style={{ width: 100, marginBottom: 0 }}
                      >
                        <InputNumber min={0} placeholder="Số lượng" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'unitText']}
                        rules={[{ required: true, message: 'Nhập đơn vị' }]}
                        style={{ width: 150, marginBottom: 0 }}
                      >
                        <Input placeholder="Đơn vị (gram, muỗng...)" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'note']}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder="Ghi chú" />
                      </Form.Item>
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{ marginTop: 8, color: 'red' }}
                      />
                    </Space>
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

export default RecipeFormPage;
