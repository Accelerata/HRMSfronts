/**
 * 薪资方案管理页面
 *
 * 按 spec: salary-plan
 *   - 方案列表页
 *   - 方案表单（+ 状态切换）
 *   - 方案工资项管理（子表 + 增删）
 *   - 方案适用范围管理（子表 + 新增）
 *
 * API: services/salary-plan.ts
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select, InputNumber,
  message, Popconfirm, Tabs, Drawer, Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined,
  AppstoreOutlined, NodeIndexOutlined, PlayCircleOutlined, PauseCircleOutlined,
} from '@ant-design/icons';
import {
  getList, getById, create, update, toggleStatus,
  getItems, addItem, deleteItem,
  getScopes, addScope,
} from '@/services/salary-plan';
import type {
  SalaryPlan, SalaryPlanItem, SalaryPlanScope,
} from '@/services/salary-plan';
import {
  SALARY_ITEM_TYPE_MAP, CALCULATION_RULE_MAP,
} from '@/utils/constants';
import dayjs from 'dayjs';

const { TextArea } = Input;

const ITEM_TYPE_OPTIONS = Object.entries(SALARY_ITEM_TYPE_MAP).map(([value, label]) => ({ value, label }));
const CALC_RULE_OPTIONS = Object.entries(CALCULATION_RULE_MAP).map(([value, label]) => ({ value, label }));
const SCOPE_TYPE_OPTIONS = [
  { value: 'DEPT', label: '部门' },
  { value: 'POSITION', label: '职位' },
  { value: 'GRADE', label: '职级' },
];

export default function SalaryPlansPage() {
  // ===== 方案列表 =====
  const [data, setData] = useState<SalaryPlan[]>([]);
  const [loading, setLoading] = useState(false);

  // ===== 方案表单 =====
  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SalaryPlan | null>(null);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planForm] = Form.useForm();

  // ===== 工资项/适用范围管理 Drawer =====
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailPlanId, setDetailPlanId] = useState<number | null>(null);
  const [detailPlanName, setDetailPlanName] = useState('');
  const [detailTab, setDetailTab] = useState('items');

  // ===== 工资项 =====
  const [items, setItems] = useState<SalaryPlanItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [itemForm] = Form.useForm();

  // ===== 适用范围 =====
  const [scopes, setScopes] = useState<SalaryPlanScope[]>([]);
  const [scopesLoading, setScopesLoading] = useState(false);
  const [scopeFormOpen, setScopeFormOpen] = useState(false);
  const [scopeSubmitting, setScopeSubmitting] = useState(false);
  const [scopeForm] = Form.useForm();

  // 加载方案列表
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getList();
      setData(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== 方案 CRUD =====
  const handleAdd = () => {
    setEditingPlan(null);
    planForm.resetFields();
    planForm.setFieldsValue({ status: 1 });
    setPlanFormOpen(true);
  };

  const handleEdit = (record: SalaryPlan) => {
    setEditingPlan(record);
    planForm.setFieldsValue({
      planName: record.planName,
      description: record.description,
    });
    setPlanFormOpen(true);
  };

  const handlePlanSubmit = async () => {
    try {
      const values = await planForm.validateFields();
      setPlanSubmitting(true);

      if (editingPlan) {
        await update(editingPlan.id, values);
        message.success('方案更新成功');
      } else {
        await create(values);
        message.success('方案创建成功');
      }
      setPlanFormOpen(false);
      fetchData();
    } catch {
      // validation or API error
    } finally {
      setPlanSubmitting(false);
    }
  };

  const handleToggleStatus = async (record: SalaryPlan) => {
    const newStatus = record.status === 1 ? 0 : 1;
    try {
      await toggleStatus(record.id, newStatus);
      message.success(newStatus === 1 ? '方案已启用' : '方案已禁用');
      fetchData();
    } catch { /* handled */ }
  };

  // ===== 工资项/适用范围管理 =====
  const handleOpenDetail = async (record: SalaryPlan) => {
    setDetailPlanId(record.id);
    setDetailPlanName(record.planName);
    setDetailDrawerOpen(true);
    setDetailTab('items');
    // 加载数据
    loadItems(record.id);
  };

  const loadItems = async (planId: number) => {
    setItemsLoading(true);
    try {
      const list = await getItems(planId);
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const loadScopes = async (planId: number) => {
    setScopesLoading(true);
    try {
      const list = await getScopes(planId);
      setScopes(list);
    } catch {
      setScopes([]);
    } finally {
      setScopesLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setDetailTab(key);
    if (detailPlanId) {
      if (key === 'items') loadItems(detailPlanId);
      else loadScopes(detailPlanId);
    }
  };

  // ===== 工资项操作 =====
  const handleAddItem = () => {
    itemForm.resetFields();
    itemForm.setFieldsValue({ calculationRule: 'FIXED', sortOrder: 99 });
    setItemFormOpen(true);
  };

  const handleItemSubmit = async () => {
    if (!detailPlanId) return;
    try {
      const values = await itemForm.validateFields();
      setItemSubmitting(true);
      await addItem(detailPlanId, values);
      message.success('工资项添加成功');
      setItemFormOpen(false);
      loadItems(detailPlanId);
    } catch {
      // validation or API error
    } finally {
      setItemSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!detailPlanId) return;
    try {
      await deleteItem(detailPlanId, id);
      message.success('工资项已删除');
      loadItems(detailPlanId);
    } catch { /* handled */ }
  };

  // ===== 适用范围操作 =====
  const handleAddScope = () => {
    scopeForm.resetFields();
    setScopeFormOpen(true);
  };

  const handleScopeSubmit = async () => {
    if (!detailPlanId) return;
    try {
      const values = await scopeForm.validateFields();
      setScopeSubmitting(true);
      await addScope(detailPlanId, values);
      message.success('适用范围添加成功');
      setScopeFormOpen(false);
      loadScopes(detailPlanId);
    } catch {
      // validation or API error
    } finally {
      setScopeSubmitting(false);
    }
  };

  // ===== 表格列 =====
  const planColumns: ColumnsType<SalaryPlan> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '方案名称', dataIndex: 'planName', width: 200, ellipsis: true },
    {
      title: '描述',
      dataIndex: 'description',
      width: 300,
      ellipsis: true,
      render: (v) => v || '--',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) =>
        v === 1 ? <Tag color="green">启用</Tag> : <Tag color="default">禁用</Tag>,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 170,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '--',
    },
    {
      title: '操作',
      width: 320,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={record.status === 1 ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleOpenDetail(record)}
          >
            工资项/范围
          </Button>
        </Space>
      ),
    },
  ];

  const itemColumns: ColumnsType<SalaryPlanItem> = [
    { title: '排序', dataIndex: 'sortOrder', width: 60, align: 'center' },
    { title: '工资项名称', dataIndex: 'itemName', width: 140 },
    {
      title: '类型',
      dataIndex: 'itemType',
      width: 100,
      render: (v) => <Tag>{SALARY_ITEM_TYPE_MAP[v] || v}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      align: 'right',
      render: (v) => `¥ ${(v || 0).toFixed(2)}`,
    },
    {
      title: '计算规则',
      dataIndex: 'calculationRule',
      width: 110,
      render: (v) => CALCULATION_RULE_MAP[v] || v,
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Popconfirm title="确认删除此工资项？" onConfirm={() => handleDeleteItem(record.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const scopeColumns: ColumnsType<SalaryPlanScope> = [
    { title: '范围类型', dataIndex: 'scopeType', width: 100, render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '范围ID', dataIndex: 'scopeId', width: 80 },
    { title: '范围名称', dataIndex: 'scopeName', width: 200 },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            薪资方案管理
          </>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增方案
          </Button>
        }
      >
        <Table<SalaryPlan>
          rowKey="id"
          columns={planColumns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* 方案表单弹窗 */}
      <Modal
        title={editingPlan ? '编辑薪资方案' : '新增薪资方案'}
        open={planFormOpen}
        onCancel={() => setPlanFormOpen(false)}
        onOk={handlePlanSubmit}
        confirmLoading={planSubmitting}
        destroyOnClose
      >
        <Form form={planForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="planName" label="方案名称" rules={[{ required: true, message: '请输入方案名称' }]}>
            <Input placeholder="如 标准薪资方案" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="方案说明（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 工资项/适用范围管理 Drawer */}
      <Drawer
        title={`${detailPlanName} — 工资项与适用范围`}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        width={800}
      >
        <Tabs
          activeKey={detailTab}
          onChange={handleTabChange}
          items={[
            {
              key: 'items',
              label: (
                <span><AppstoreOutlined /> 工资项</span>
              ),
              children: (
                <div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddItem}
                    style={{ marginBottom: 16 }}
                  >
                    添加工资项
                  </Button>
                  <Table<SalaryPlanItem>
                    rowKey="id"
                    columns={itemColumns}
                    dataSource={items}
                    loading={itemsLoading}
                    pagination={false}
                    size="small"
                  />
                </div>
              ),
            },
            {
              key: 'scopes',
              label: (
                <span><NodeIndexOutlined /> 适用范围</span>
              ),
              children: (
                <div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddScope}
                    style={{ marginBottom: 16 }}
                  >
                    添加适用范围
                  </Button>
                  <Table<SalaryPlanScope>
                    rowKey="id"
                    columns={scopeColumns}
                    dataSource={scopes}
                    loading={scopesLoading}
                    pagination={false}
                    size="small"
                  />
                </div>
              ),
            },
          ]}
        />
      </Drawer>

      {/* 工资项表单弹窗 */}
      <Modal
        title="添加工资项"
        open={itemFormOpen}
        onCancel={() => setItemFormOpen(false)}
        onOk={handleItemSubmit}
        confirmLoading={itemSubmitting}
        destroyOnClose
      >
        <Form form={itemForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="itemName" label="工资项名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如 餐补、交通补贴" />
          </Form.Item>
          <Form.Item name="itemType" label="工资项类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={ITEM_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="calculationRule" label="计算规则" rules={[{ required: true, message: '请选择计算规则' }]}>
            <Select options={CALC_RULE_OPTIONS} />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序号">
            <InputNumber min={0} max={999} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 适用范围表单弹窗 */}
      <Modal
        title="添加适用范围"
        open={scopeFormOpen}
        onCancel={() => setScopeFormOpen(false)}
        onOk={handleScopeSubmit}
        confirmLoading={scopeSubmitting}
        destroyOnClose
      >
        <Form form={scopeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="scopeType" label="范围类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={SCOPE_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="scopeId" label="范围ID" rules={[{ required: true, message: '请输入范围ID' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="部门/职位/职级ID" />
          </Form.Item>
          <Form.Item name="scopeName" label="范围名称" rules={[{ required: true, message: '请输入范围名称' }]}>
            <Input placeholder="如 技术部、P3" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
