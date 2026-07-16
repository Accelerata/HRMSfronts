/**
 * 离职管理页面
 *
 * 按 spec: resignation
 *   - 离职申请列表（ProTable + 状态筛选）
 *   - 离职申请表单（离职类型/交接人/交接说明）
 *   - 离职审批操作（ApprovalModal）
 *
 * API: services/resignation.ts
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, message, Modal, Form, Select,
  DatePicker, Input, InputNumber, Row, Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, ReloadOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import * as resignationService from '@/services/resignation';
import type { ResignationApplication } from '@/services/resignation';
import ApprovalModal from '@/components/ApprovalModal';
import { RESIGNATION_TYPE_MAP } from '@/utils/constants';
import { getStatusColor } from '@/utils/constants';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function ResignationListPage() {
  const currentUser = useUserStore((s) => s.currentUser);

  // 列表
  const [data, setData] = useState<ResignationApplication[]>([]);
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

  const canManage = currentUser?.roleCode === 'ROLE_ADMIN' || currentUser?.roleCode === 'ROLE_HR';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await resignationService.getPage({ page, size: 10, status: statusFilter, keyword: keyword || undefined });
      setData(result.list || result.records || []);
      setTotal(result.total);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [page, statusFilter, keyword]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 提交申请
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await resignationService.create({
        employeeId: values.employeeId,
        resignationDate: values.resignationDate.format('YYYY-MM-DD'),
        resignationType: values.resignationType,
        reason: values.reason || '',
        handoverTo: values.handoverTo,
        handoverNotes: values.handoverNotes,
      });
      message.success('离职申请已提交');
      setFormOpen(false);
      form.resetFields();
      fetchData();
    } catch (err: any) { if (err?.errorFields) return; }
    finally { setSubmitting(false); }
  };

  // 审批
  const handleOpenApproval = (id: number) => {
    setApprovingId(id);
    setApprovalOpen(true);
  };

  const handleApprovalOk = async (values: { action: number; comment: string }) => {
    if (!approvingId) return;
    setApproving(true);
    try {
      await resignationService.approve(approvingId, values);
      message.success(values.action === 1 ? '已通过' : '已拒绝');
      setApprovalOpen(false);
      setApprovingId(null);
      fetchData();
    } catch { }
    finally { setApproving(false); }
  };

  const columns: ColumnsType<ResignationApplication> = [
    { title: '员工', dataIndex: 'employeeName', width: 90 },
    { title: '部门', dataIndex: 'deptName', width: 110, ellipsis: true },
    { title: '职位', dataIndex: 'positionName', width: 120, ellipsis: true },
    {
      title: '离职类型', dataIndex: 'resignationType', width: 100,
      render: (v: number) => RESIGNATION_TYPE_MAP[v] || '--',
    },
    { title: '离职日期', dataIndex: 'resignationDate', width: 110 },
    { title: '原因', dataIndex: 'reason', width: 180, ellipsis: true },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v: number) => <Tag color={getStatusColor(v)}>{v === 0 ? '草稿' : v === 1 ? '审批中' : v === 2 ? '已通过' : v === 3 ? '已拒绝' : v}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createTime', width: 170 },
    {
      title: '操作', width: 100, fixed: 'right' as const,
      render: (_, record) => (
        <Space>
          {record.status === 1 && canManage && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />}
              onClick={() => handleOpenApproval(record.id)}>审批</Button>
          )}
          {record.status !== 1 && <span style={{ color: '#999' }}>--</span>}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="离职管理"
        extra={
          <Space>
            <Select allowClear placeholder="状态筛选" style={{ width: 120 }}
              value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[{ value: 1, label: '审批中' }, { value: 2, label: '已通过' }, { value: 3, label: '已拒绝' }]} />
            <Input.Search placeholder="搜索员工姓名" style={{ width: 200 }} allowClear
              onSearch={(v) => { setKeyword(v); setPage(1); }} />
            <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setFormOpen(true); }}>
                发起离职
              </Button>
            )}
          </Space>
        }
      >
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
          pagination={{ current: page, total, pageSize: 10, showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => setPage(p) }} scroll={{ x: 1000 }} />
      </Card>

      {/* ===== 离职申请表单 ===== */}
      <Modal title="发起离职" open={formOpen} onCancel={() => setFormOpen(false)}
        onOk={handleSubmit} confirmLoading={submitting} destroyOnClose width={560}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}
          initialValues={{ resignationType: 1 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employeeId" label="员工ID" rules={[{ required: true, message: '请输入' }]}>
                <Input placeholder="输入员工ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="resignationDate" label="离职日期" rules={[{ required: true, message: '请选择' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="resignationType" label="离职类型" rules={[{ required: true }]}>
            <Select options={Object.entries(RESIGNATION_TYPE_MAP).map(([k, v]) => ({ value: Number(k), label: v }))} />
          </Form.Item>
          <Form.Item name="reason" label="离职原因" rules={[{ required: true, message: '请输入' }]}>
            <TextArea rows={3} placeholder="请说明离职原因" maxLength={500} showCount />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="handoverTo" label="工作交接人">
                <InputNumber style={{ width: '100%' }} min={1} placeholder="输入员工ID" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="handoverNotes" label="交接说明">
            <TextArea rows={2} placeholder="工作交接说明（可选）" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* ===== 审批弹窗 ===== */}
      <ApprovalModal open={approvalOpen} title="离职审批" showReturn={false}
        onOk={handleApprovalOk}
        onCancel={() => { setApprovalOpen(false); setApprovingId(null); }}
        loading={approving} />
    </div>
  );
}
