/**
 * 调岗管理页面
 *
 * 按 spec: transfer
 *   - 调岗申请列表（ProTable + 状态筛选）
 *   - 调岗申请表单（自动填充原部门/职位）
 *   - 双审批状态展示（原部门+新部门）
 *
 * API: services/transfer.ts
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, message, Modal, Form, Select,
  DatePicker, Input, Row, Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, ReloadOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import * as transferService from '@/services/transfer';
import type { TransferApplication, TransferApproveParams } from '@/services/transfer';
import { getTree } from '@/services/dept';
import type { DeptNode } from '@/services/dept';
import { getList } from '@/services/position';
import type { Position } from '@/services/position';
import { getStatusColor } from '@/utils/constants';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function TransferListPage() {
  const currentUser = useUserStore((s) => s.currentUser);

  // 列表
  const [data, setData] = useState<TransferApplication[]>([]);
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
  const [approvalRole, setApprovalRole] = useState<'old' | 'new'>('old');
  const [approving, setApproving] = useState(false);
  const [approvalForm] = Form.useForm();

  // 选项
  const [depts, setDepts] = useState<DeptNode[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    getTree().then(setDepts).catch(() => {});
    getList().then(setPositions).catch(() => {});
  }, []);

  const flattenDepts = (nodes: DeptNode[], prefix = ''): { value: number; label: string }[] =>
    nodes.flatMap((n) => [
      { value: n.id, label: prefix + n.deptName },
      ...flattenDepts(n.children || [], prefix + '　'),
    ]);

  const canManage = currentUser?.roleCode === 'ROLE_ADMIN' || currentUser?.roleCode === 'ROLE_HR';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await transferService.getPage({ page, size: 10, status: statusFilter, keyword: keyword || undefined });
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
      await transferService.create({
        employeeId: values.employeeId,
        fromDeptId: values.fromDeptId,
        toDeptId: values.toDeptId,
        fromPositionId: values.fromPositionId,
        toPositionId: values.toPositionId,
        effectiveDate: values.effectiveDate.format('YYYY-MM-DD'),
        reason: values.reason || '',
      });
      message.success('调岗申请已提交');
      setFormOpen(false);
      form.resetFields();
      fetchData();
    } catch (err: any) { if (err?.errorFields) return; }
    finally { setSubmitting(false); }
  };

  // 审批
  const handleOpenApproval = (id: number, role: 'old' | 'new') => {
    setApprovingId(id);
    setApprovalRole(role);
    approvalForm.resetFields();
    setApprovalOpen(true);
  };

  const handleApprovalOk = async () => {
    try {
      const values = await approvalForm.validateFields();
      setApproving(true);
      const params: TransferApproveParams = {
        action: values.action,
        role: approvalRole,
        comment: values.comment || '',
      };
      await transferService.approve(approvingId!, params);
      message.success(values.action === 1 ? '已通过' : '已拒绝');
      setApprovalOpen(false);
      setApprovingId(null);
      fetchData();
    } catch (err: any) { if (err?.errorFields) return; }
    finally { setApproving(false); }
  };

  const columns: ColumnsType<TransferApplication> = [
    { title: '员工', dataIndex: 'employeeName', width: 90 },
    { title: '原部门', dataIndex: 'fromDeptName', width: 110, ellipsis: true },
    { title: '目标部门', dataIndex: 'toDeptName', width: 110, ellipsis: true },
    { title: '原职位', dataIndex: 'fromPositionName', width: 120, ellipsis: true },
    { title: '目标职位', dataIndex: 'toPositionName', width: 120, ellipsis: true },
    { title: '生效日期', dataIndex: 'effectiveDate', width: 110 },
    {
      title: '原部门审批', width: 110,
      render: (_, r) => {
        const s = r.oldDeptApprovalStatus;
        return <Tag color={s === 1 ? 'green' : s === 2 ? 'red' : 'default'}>{s === 1 ? '已通过' : s === 2 ? '已拒绝' : '待审批'}</Tag>;
      },
    },
    {
      title: '新部门审批', width: 110,
      render: (_, r) => {
        const s = r.newDeptApprovalStatus;
        return <Tag color={s === 1 ? 'green' : s === 2 ? 'red' : 'default'}>{s === 1 ? '已通过' : s === 2 ? '已拒绝' : '待审批'}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'createTime', width: 170 },
    {
      title: '操作', width: 200, fixed: 'right' as const,
      render: (_, record) => {
        const btnLoading = actionLoading === record.id;
        const needOld = record.oldDeptApprovalStatus === 0 && canManage;
        const needNew = record.newDeptApprovalStatus === 0 && canManage && record.oldDeptApprovalStatus === 1;
        return (
          <Space size="small">
            {needOld && (
              <Button type="link" size="small" icon={<CheckCircleOutlined />}
                onClick={() => handleOpenApproval(record.id, 'old')} loading={btnLoading}>
                原部门审批
              </Button>
            )}
            {needNew && (
              <Button type="link" size="small" icon={<CheckCircleOutlined />}
                onClick={() => handleOpenApproval(record.id, 'new')} loading={btnLoading}>
                新部门审批
              </Button>
            )}
            {!needOld && !needNew && <span style={{ color: '#999' }}>--</span>}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="调岗管理"
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
                发起调岗
              </Button>
            )}
          </Space>
        }
      >
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
          pagination={{ current: page, total, pageSize: 10, showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => setPage(p) }} scroll={{ x: 1200 }} />
      </Card>

      {/* ===== 调岗申请表单 ===== */}
      <Modal title="发起调岗" open={formOpen} onCancel={() => setFormOpen(false)}
        onOk={handleSubmit} confirmLoading={submitting} destroyOnClose width={640}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employeeId" label="员工ID" rules={[{ required: true, message: '请输入' }]}>
                <Input placeholder="输入员工ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="effectiveDate" label="生效日期" rules={[{ required: true, message: '请选择' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fromDeptId" label="原部门" rules={[{ required: true, message: '请选择' }]}>
                <Select showSearch placeholder="选择原部门" options={flattenDepts(depts)}
                  filterOption={(input, option) => (option?.label as string)?.includes(input)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="toDeptId" label="目标部门" rules={[{ required: true, message: '请选择' }]}>
                <Select showSearch placeholder="选择目标部门" options={flattenDepts(depts)}
                  filterOption={(input, option) => (option?.label as string)?.includes(input)} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fromPositionId" label="原职位" rules={[{ required: true, message: '请选择' }]}>
                <Select showSearch placeholder="选择原职位"
                  options={positions.map((p) => ({ value: p.id, label: p.positionName }))}
                  filterOption={(input, option) => (option?.label as string)?.includes(input)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="toPositionId" label="目标职位" rules={[{ required: true, message: '请选择' }]}>
                <Select showSearch placeholder="选择目标职位"
                  options={positions.map((p) => ({ value: p.id, label: p.positionName }))}
                  filterOption={(input, option) => (option?.label as string)?.includes(input)} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label="调岗原因" rules={[{ required: true, message: '请输入' }]}>
            <TextArea rows={3} placeholder="请说明调岗原因" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* ===== 双审批弹窗 ===== */}
      <Modal title={`调岗审批 - ${approvalRole === 'old' ? '原部门负责人' : '新部门负责人'}`}
        open={approvalOpen} onOk={handleApprovalOk} onCancel={() => setApprovalOpen(false)}
        confirmLoading={approving} destroyOnClose>
        <Form form={approvalForm} layout="vertical" style={{ marginTop: 16 }}
          initialValues={{ action: 1 }}>
          <Form.Item name="action" label="审批结果" rules={[{ required: true }]}>
            <Select options={[
              { value: 1, label: '通过' },
              { value: 2, label: '拒绝' },
            ]} />
          </Form.Item>
          <Form.Item name="comment" label="审批意见">
            <TextArea rows={3} placeholder="审批意见（可选）" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
