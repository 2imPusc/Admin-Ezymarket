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
  Modal,
  Checkbox,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '@/services/recipe.service';
import { searchUnits } from '@/services/unit.service';
import { getTags, suggestTags } from '@/services/tag.service';

const { TextArea } = Input;
const { Option } = Select;

const RecipeFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [ingredientOptions, setIngredientOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [tagMap, setTagMap] = useState({}); // _id -> name

  const isEdit = !!id;

  const fetchIngredientSuggestions = async (value) => {
    if (!value?.trim()) {
      setIngredientOptions([]);
      return;
    }
    try {
      const suggestions = await recipeService.suggestIngredients(value.trim());
      setIngredientOptions(
        (suggestions || []).map((s) => ({
          value: s.name,
          label: s.name,
          ingredientId: s._id,
        }))
      );
    } catch {
      setIngredientOptions([]);
    }
  };

  const fetchUnitSuggestions = async (value) => {
    const q = value?.trim();
    if (!q) {
      setUnitOptions([]);
      return;
    }
    try {
      const units = await searchUnits(q);
      setUnitOptions(
        units.map((u) => ({
          value: u.name,
          label: `${u.name}${u.abbreviation ? ` (${u.abbreviation})` : ''}`,
          unitId: u._id,
          unitText: u.name, // dùng name làm unitText mặc định
        }))
      );
    } catch {
      setUnitOptions([]);
    }
  };

  const confirmSnapshotIfNeeded = async (ingredients = []) => {
    const noIngredientRef = ingredients.filter((i) => !i?.ingredientId);
    const noUnitRef = ingredients.filter((i) => !i?.unitId);
    if (noIngredientRef.length === 0 && noUnitRef.length === 0) return true;

    return await new Promise((resolve) => {
      Modal.confirm({
        title: 'Xác nhận lưu dữ liệu không tham chiếu',
        content: (
          <div>
            {noIngredientRef.length > 0 && (
              <div>• {noIngredientRef.length} nguyên liệu không gắn với cơ sở dữ liệu.</div>
            )}
            {noUnitRef.length > 0 && (
              <div>• {noUnitRef.length} đơn vị không gắn với cơ sở dữ liệu.</div>
            )}
            <div>
              Tiếp tục sẽ lưu tên/đơn vị dưới dạng văn bản (snapshot) thay vì tham chiếu đến DB.
            </div>
          </div>
        ),
        okText: 'Tôi chấp nhận',
        cancelText: 'Hủy',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
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

  // Điền dữ liệu vào form khi edit
  useEffect(() => {
    if (isEdit && recipe) {
      form.setFieldsValue({
        title: recipe.title,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        directions: recipe.directions || [],
        tags: recipe.tags || [],
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
    }
  }, [isEdit, recipe, form]);

  useEffect(() => {
    // Tải danh sách tag để hiển thị và map ID -> name
    (async () => {
      try {
        const res = await getTags();
        const list = res?.tags || [];
        setTagOptions(list.map((t) => ({ value: t.name, label: t.name })));
        setTagMap(Object.fromEntries(list.map((t) => [String(t._id), t.name])));
      } catch {
        setTagOptions([]);
        setTagMap({});
      }
    })();
  }, []);

  // Khi edit: điền tags thành mảng tên để FE luôn gửi string
  useEffect(() => {
    if (isEdit && recipe) {
      const toNames = (tags) =>
        (tags || [])
          .map((t) =>
            typeof t === 'string'
              ? (tagMap[t] || t) // nếu backend trả ObjectId dạng string
              : (t?.name || (t?._id ? tagMap[String(t._id)] : ''))
          )
          .filter(Boolean);

      form.setFieldsValue({
        title: recipe.title,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        directions: recipe.directions || [],
        tags: toNames(recipe.tags),
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
    }
  }, [isEdit, recipe, tagMap, form]);

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

  const onFinish = async (values) => {
    const accepted = await confirmSnapshotIfNeeded(values.ingredients || []);
    if (!accepted) return;

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
          ingredientId: ing.ingredientId || undefined,
          name: ing.name,
          quantity: Number(ing.quantity) || 0,
          unitId: ing.unitId || undefined,
          unitText: ing.unitText || '',
          note: ing.note || '',
          optional: Boolean(ing.optional),
        })) || [],
      tags: (values.tags || []).map((t) => String(t).trim()).filter(Boolean),
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

          <Form.Item label="Nguyên liệu (Ưu tiên chọn nguyên liệu/đơn vị từ danh sách hệ thống. Nếu không có, bạn có thể nhập tên/đơn vị mới)">
            <Form.List name="ingredients">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      style={{ display: 'flex', marginBottom: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}
                    >
                      {/* Ingredient name (AutoComplete) */}
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[{ required: true, message: 'Chọn hoặc nhập nguyên liệu' }]}
                        style={{ width: 220, marginBottom: 0 }}
                      >
                        <AutoComplete
                          placeholder="Chọn hoặc nhập nguyên liệu"
                          options={ingredientOptions}
                          onSearch={fetchIngredientSuggestions}
                          filterOption={false}
                          onSelect={(value, option) => {
                            const current = form.getFieldValue('ingredients') || [];
                            current[name] = {
                              ...current[name],
                              name: value,
                              ingredientId: option.ingredientId,
                            };
                            form.setFieldsValue({ ingredients: current });
                          }}
                          // Nếu người dùng chỉnh sửa text thủ công -> bỏ tham chiếu
                          onChange={(value) => {
                            const current = form.getFieldValue('ingredients') || [];
                            current[name] = {
                              ...current[name],
                              name: value,
                              ingredientId: undefined,
                            };
                            form.setFieldsValue({ ingredients: current });
                          }}
                        />
                      </Form.Item>

                      {/* Hidden ingredientId */}
                      <Form.Item name={[name, 'ingredientId']} noStyle>
                        <Input type="hidden" />
                      </Form.Item>

                      {/* Quantity */}
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true, message: 'Nhập số lượng' }]}
                        style={{ width: 110, marginBottom: 0 }}
                      >
                        <InputNumber min={0} placeholder="Số lượng" />
                      </Form.Item>

                      {/* Unit select (AutoComplete) */}
                      <Form.Item
                        {...restField}
                        name={[name, 'unitText']}
                        rules={[{ required: true, message: 'Nhập đơn vị' }]}
                        style={{ width: 220, marginBottom: 0 }}
                      >
                        <AutoComplete
                          placeholder="Chọn đơn vị (khuyến nghị)"
                          options={unitOptions}
                          onSearch={fetchUnitSuggestions}
                          filterOption={false}
                          onSelect={(value, option) => {
                            const current = form.getFieldValue('ingredients') || [];
                            current[name] = {
                              ...current[name],
                              unitText: option.unitText || value,
                              unitId: option.unitId,
                            };
                            form.setFieldsValue({ ingredients: current });
                          }}
                          // Nếu người dùng chỉnh sửa text thủ công -> bỏ tham chiếu
                          onChange={(value) => {
                            const current = form.getFieldValue('ingredients') || [];
                            current[name] = {
                              ...current[name],
                              unitText: value,
                              unitId: undefined,
                            };
                            form.setFieldsValue({ ingredients: current });
                          }}
                        />
                      </Form.Item>

                      {/* Hidden unitId */}
                      <Form.Item name={[name, 'unitId']} noStyle>
                        <Input type="hidden" />
                      </Form.Item>

                      {/* Note */}
                      <Form.Item
                        {...restField}
                        name={[name, 'note']}
                        style={{ width: 220, marginBottom: 0 }}
                      >
                        <Input placeholder="Ghi chú" />
                      </Form.Item>

                      {/* Optional checkbox */}
                      <Form.Item
                        {...restField}
                        name={[name, 'optional']}
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Checkbox>Optional</Checkbox>
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

          {/* Tags: luôn là mảng string */}
          <Form.Item label="Tags" name="tags">
            <Select
              mode="tags"
              placeholder="Nhập hoặc chọn tags (ví dụ: healthy, món chính)"
              style={{ width: '100%' }}
              showSearch
              filterOption={false}
              onSearch={fetchTagSuggestions}
              options={tagOptions}
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
