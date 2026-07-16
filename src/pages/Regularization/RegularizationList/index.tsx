/**
 * 转正管理页面
 *
 * 按 spec: regularization
 *   - 转正申请列表（ProTable + 状态筛选）
 *   - 转正申请表单（自动填充试用期结束日期）
 *   - 转正审批（3种结果类型：通过/延长/辞退）
 *   - 即将到期提醒列表
 *
 * API: services/regularization.ts
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, message, Modal, Form, Select,
  DatePicker, InputNumber, Input, Radio, Row, Col, Tabs,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, ReloadOutlined, CheckCircleOutlined, WarningOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import * as regularizationService from '@/services/regularization';
import type {
  RegularizationApplication,
  RegularizationApproveParams,
  ExpiringEmployee,
} from '@/services/regularization';
import { REGULARIZATION_RESULT_TYPE_MAP } from '@/utils/constants';
import { getStatusColor } from '@/utils/constants';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function RegularizationListPage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const [activeTab, setActiveTab] = useState('list');

  // 列表
  const [data, setData] = useState<RegularizationApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<number | undefined>();
  const [keyword, setKeyword] = useState('');

  // 申请表单
  const [formOpen, setFormOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 审批弹窗
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);
  const [approvalForm] = Form.useForm();

  // 即将到期
  const [expiringList, setExpiringList] = useState<ExpiringEmployee[]>([]);
  const [expiringLoading, setExpiringLoading] = useState(false);
  const [expiringDays, setExpiringDays] = useState(7);

  const canManage = currentUser?.roleCode === 'ROLE_ADMIN' || currentUser?.roleCode === 'ROLE_HR';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await regularizationService.getPage({ page, size: 10, status: statusFilter, keyword: keyword || undefined });
      setData(result.list || result.records || []);
      setTotal(result.total);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [page, statusFilter, keyword]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchExpiring = useCallback(async () => {
    setExpiringLoading(true);
    try {
      const result = await regularizationService.getExpiring(expiringDays);
      setExpiringList(result);
    } catch { setExpiringList([]); }
    finally { setExpiringLoading(false); }
  }, [expiringDays]);

  useEffect(() => {
    if (activeTab === 'expiring') fetchExpiring();
  }, [activeTab, fetchExpiring]);

  // 提交申请
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await regularizationService.create({
        employeeId: values.employeeId,
        probationEndDate: values.probationEndDate?.format('YYYY-MM-DD'),
        applyDate: values.applyDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
      });
      message.success('转正申请已提交');
      setFormOpen(false);
      form.resetFields();
      fetchData();
    } catch (err: any) { if (err?.errorFields) return; }
    finally { setSubmitting(false); }
  };

  // 审批
  const handleOpenApproval = (id: number) => {
    setApprovingId(id);
    approvalForm.resetFields();
    approvalForm.setFieldsValue({ resultType: 1 });
    setApprovalOpen(true);
  };

  const handleApprovalOk = async () => {
    try {
      const values = await approvalForm.validateFields();
      setApproving(true);
      const params: RegularizationApproveParams = {
        action: 1,
        resultType: values.resultType,
        comment: values.comment || '',
      };
      if (values.resultType === 2) params.extendedMonths = values.extendedMonths;
      await regularizationService.approve(approvingId!, params);
      const resultLabels: Record<number, string> = { 1: '通过转正', 2: '延长试用', 3: '不通过辞退' };
      message.success(`审批完成: ${resultLabels[values.resultType]}`);
      setApprovalOpen(false);
      setApprovingId(null);
      fetchData();
    } catch (err: any) { if (err?.errorFields) return; }
    finally { setApproving(false); }
  };

  const columns: ColumnsType<RegularizationApplication> = [
    { title: '员工', dataIndex: 'employeeName', width: 90 },
    { title: '部门', dataIndex: 'deptName', width: 110, ellipsis: true },
    { title: '职位', dataIndex: 'positionName', width: 120, ellipsis: true },
    { title: '入职日期', dataIndex: 'entryDate', width: 110 },
    { title: '试用期结束', dataIndex: 'probationEndDate', width: 110 },
    { title: '申请日期', dataIndex: 'applyDate', width: 110 },
    {
      title: '审批结果', width: 100,
      render: (_, r) => r.resultType ? (
        <Tag color={r.resultType === 1 ? 'green' : r.resultType === 2 ? 'orange' : 'red'}>
          {REGULARIZATION_RESULT_TYPE_MAP[r.resultType]}
        </Tag>
      ) : '--',
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v: number) => <Tag color={getStatusColor(v)}>{v === 0 ? '草稿' : v === 1 ? '审批中' : v === 2 ? '已通过' : v === 3 ? '已拒绝' : v}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createTime', width: 170 },
    {
      title: '操作', width: 120, fixed: 'right' as const,
      render: (_, record) => (
        <Space>
          {record.status === 1 && canManage && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />}
              onClick={() => handleOpenApproval(record.id)}>审批</Button>
          )}
          {(record.status !== 1) && <span style={{ color: '#999' }}>--</span>}
        </Space>
      ),
    },
  ];

  const expiringColumns: ColumnsType<ExpiringEmployee> = [
    { title: '员工', dataIndex: 'employeeName', width: 90 },
    { title: '部门', dataIndex: 'deptName', width: 120 },
    { title: '入职日期', dataIndex: 'entryDate', width: 110 },
    { title: '试用期结束', dataIndex: 'probationEndDate', width: 110 },
    {
      title: '剩余天数', dataIndex: 'daysUntilExpire', width: 100,
      render: (v: number) => <Tag color={v <= 3 ? 'red' : v <= 7 ? 'orange' : 'blue'}>{v} 天</Tag>,
      sorter: (a, b) => a.daysUntilExpire - b.daysUntilExpire,
    },
    {
      title: '操作', width: 100,
      render: (_, record) => canManage && (
        <Button type="link" size="small" icon={<PlusOutlined />}
          onClick={() => {
            form.setFieldsValue({
              employeeId: record.employeeId,
              probationEndDate: record.probationEndDate ? dayjs(record.probationEndDate) : null,
              applyDate: dayjs(),
            });
            setFormOpen(true);
          }}>发起转正</Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="转正管理">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'list',
            label: '转正申请列表',
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Select allowClear placeholder="状态筛选" style={{ width: 120 }}
                    value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }}
                    options={[{ value: 1, label: '审批中' }, { value: 2, label: '已通过' }, { value: 3, label: '已拒绝' }]} />
                  <Input.Search placeholder="搜索员工姓名" style={{ width: 200 }} allowClear
                    onSearch={(v) => { setKeyword(v); setPage(1); }} />
                  <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
                  {canManage && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setFormOpen(true); }}>
                      发起转正
                    </Button>
                  )}
                </Space>
                <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
                  pagination={{ current: page, total, pageSize: 10, showTotal: (t) => `共 ${t} 条`,
                    onChange: (p) => setPage(p) }} scroll={{ x: 1000 }} />
              </>
            ),
          },
          {
            key: 'expiring',
            label: (
              <span><WarningOutlined style={{ color: '#faad14', marginRight: 4 }} />即将到期</span>
            ),
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <span>未来</span>
                  <InputNumber min={1} max={90} value={expiringDays}
                    onChange={(v) => setExpiringDays(v ?? 7)} />
                  <span>天内到期</span>
                  <Button icon={<ReloadOutlined />} onClick={fetchExpiring}>刷新</Button>
                </Space>
                <Table rowKey="employeeId" columns={expiringColumns} dataSource={expiringList}
                  loading={expiringLoading} pagination={false} scroll={{ x: 700 }} />
              </>
            ),
          },
        ]} />
      </Card>

      {/* ===== 转正申请表单 ===== */}
      <Modal title="发起转正" open={formOpen} onCancel={() => setFormOpen(false)}
        onOk={handleSubmit} confirmLoading={submitting} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}
          initialValues={{ applyDate: dayjs() }}>
          <Form.Item name="employeeId" label="员工ID" rules={[{ required: true, message: '请输入' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="输入员工ID" />
          </Form.Item>
          <Form.Item name="probationEndDate" label="试用期结束日期" rules={[{ required: true, message: '请选择' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="applyDate" label="申请日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ===== 转正审批弹窗（3种结果类型） ===== */}
      <Modal title="转正审批" open={approvalOpen}
        onOk={handleApprovalOk} onCancel={() => setApprovalOpen(false)}
        confirmLoading={approving} destroyOnClose>
        <Form form={approvalForm} layout="vertical" style={{ marginTop: 16 }}
          initialValues={{ resultType: 1 }}>
          <Form.Item name="resultType" label="审批结果" rules={[{ required: true }]}>
            <Radio.Group>
              <Space direction="vertical">
                <Radio value={1}>
                  <span style={{ color: '#52c41a' }}>通过转正</span> — 员工状态变更为正式
                </Radio>
                <Radio value={2}>
                  <span style={{ color: '#faad14' }}>延长试用</span> — 需填写延长月数
                </Radio>
                <Radio value={3}>
                  <span style={{ color: '#ff4d4f' }}>不通过辞退</span>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.resultType !== cur.resultType}>
            {({ getFieldValue }) =>
              getFieldValue('resultType') === 2 ? (
                <Form.Item name="extendedMonths" label="延长月数"
                  rules={[{ required: true, message: '请输入' }]}>
                  <InputNumber min={1} max={12} style={{ width: '100%' }} placeholder="延长试用月数" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="comment" label="审批意见">
            <TextArea rows={3} placeholder="审批意见（可选）" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
