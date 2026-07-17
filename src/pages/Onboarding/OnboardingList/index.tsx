/**
 * 入职管理页面
 *
 * 按 spec: onboarding
 *   - ProTable 分页列表 + 状态筛选 + 关键词搜索
 *   - 入职申请表单（提交 / 保存草稿两种模式）
 *   - 详情抽屉 + 完整状态流转操作
 *   - 审批操作（ApprovalModal）
 *   - 确认到岗 / 更新入职日期 / 放弃入职
 *
 * API: services/onboarding.ts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Table, Button, Space, Tag, message, Drawer, Descriptions, Form,
  Select, Input, InputNumber, DatePicker, Row, Col, Popconfirm, Modal,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, ReloadOutlined, FileTextOutlined, CheckCircleOutlined,
  CloseCircleOutlined, EditOutlined, DeleteOutlined, RollbackOutlined,
  StopOutlined, CalendarOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import * as onboardingService from '@/services/onboarding';
import type { OnboardingApplication, OnboardingParams } from '@/services/onboarding';
import ApprovalModal from '@/components/ApprovalModal';
import SensitiveText from '@/components/SensitiveText';
import { ONBOARDING_STATUS_MAP, GENDER_MAP, ENTRY_TYPE_MAP } from '@/utils/constants';
import { getStatusColor } from '@/utils/constants';
import { getTree } from '@/services/dept';
import type { DeptNode } from '@/services/dept';
import { getList } from '@/services/position';
import type { Position } from '@/services/position';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function OnboardingListPage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const [form] = Form.useForm();

  // 列表
  const [data, setData] = useState<OnboardingApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<number | undefined>();
  const [keyword, setKeyword] = useState('');

  // 表单弹窗
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 详情抽屉
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OnboardingApplication | null>(null);

  // 审批弹窗
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);

  // 更新入职日期弹窗
  const [entryDateOpen, setEntryDateOpen] = useState(false);
  const [entryDateRecord, setEntryDateRecord] = useState<OnboardingApplication | null>(null);
  const [entryDateValue, setEntryDateValue] = useState<dayjs.Dayjs | null>(null);
  const [entryDateSaving, setEntryDateSaving] = useState(false);

  // 部门/职位选项
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

  // 查询列表
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await onboardingService.getPage({ page, size: 10, status: statusFilter, keyword: keyword || undefined });
      setData(result.list || result.records || []);
      setTotal(result.total);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, keyword]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 状态筛选
  const statusOptions = Object.entries(ONBOARDING_STATUS_MAP).map(([k, v]) => ({
    value: Number(k),
    label: v,
  }));

  // 打开表单弹窗
  const handleOpenForm = () => {
    form.resetFields();
    form.setFieldsValue({ probationMonths: 3, probationSalaryRatio: 0.8, entryType: 1, employmentType: 1 });
    setFormOpen(true);
  };

  // 提交/保存草稿
  const handleSubmit = async (isDraft: boolean) => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const params: OnboardingParams = {
        realName: values.realName,
        phone: values.phone,
        email: values.email,
        idCard: values.idCard,
        targetDeptId: values.targetDeptId,
        targetPositionId: values.targetPositionId,
        offerSalary: values.offerSalary,
        probationMonths: values.probationMonths ?? 3,
        probationSalaryRatio: values.probationSalaryRatio,
        entryDate: values.entryDate.format('YYYY-MM-DD'),
        gender: values.gender,
        grade: values.grade,
        reportTo: values.reportTo,
        workLocation: values.workLocation,
        entryType: values.entryType,
        employmentType: values.employmentType,
        bankAccount: values.bankAccount,
        bankName: values.bankName,
      };

      if (isDraft) {
        await onboardingService.draft(params);
        message.success('草稿已保存');
      } else {
        await onboardingService.create(params);
        message.success('入职申请已提交');
      }
      setFormOpen(false);
      form.resetFields();
      fetchData();
    } catch (err: any) {
      if (err?.errorFields) return;
    } finally {
      setSubmitting(false);
    }
  };

  // 查看详情
  const handleViewDetail = async (record: OnboardingApplication) => {
    setSelectedRecord(record);
    setDetailOpen(true);
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
      await onboardingService.approve(approvingId, values);
      message.success(values.action === 1 ? '已通过' : '已拒绝');
      setApprovalOpen(false);
      setApprovingId(null);
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setApproving(false);
    }
  };

  // 通用操作
  const doAction = async (id: number, action: () => Promise<void>, successMsg: string) => {
    setActionLoading(id);
    try {
      await action();
      message.success(successMsg);
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setActionLoading(null);
    }
  };

  // 更新入职日期
  const handleOpenEntryDate = (record: OnboardingApplication) => {
    setEntryDateRecord(record);
    setEntryDateValue(record.entryDate ? dayjs(record.entryDate) : null);
    setEntryDateOpen(true);
  };

  const handleSaveEntryDate = async () => {
    if (!entryDateRecord || !entryDateValue) return;
    setEntryDateSaving(true);
    try {
      await onboardingService.updateEntryDate(entryDateRecord.id, {
        entryDate: entryDateValue.format('YYYY-MM-DD'),
      });
      message.success('入职日期已更新');
      setEntryDateOpen(false);
      setEntryDateRecord(null);
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setEntryDateSaving(false);
    }
  };

  const canManage = currentUser?.roleCode === 'ROLE_ADMIN' || currentUser?.roleCode === 'ROLE_HR';

  const columns: ColumnsType<OnboardingApplication> = [
    { title: '姓名', dataIndex: 'realName', width: 90 },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
      ellipsis: true,
      render: (v: string) => <SensitiveText text={v} type="phone" />,
    },
    { title: '邮箱', dataIndex: 'email', width: 180, ellipsis: true },
    { title: '目标部门', dataIndex: 'targetDeptName', width: 110, ellipsis: true },
    { title: '目标职位', dataIndex: 'targetPositionName', width: 130, ellipsis: true },
    {
      title: '薪资',
      dataIndex: 'offerSalary',
      width: 100,
      render: (v: number) => v ? `¥${v.toLocaleString()}` : '--',
    },
    {
      title: '入职日期',
      dataIndex: 'entryDate',
      width: 110,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: number) => <Tag color={getStatusColor(v)}>{ONBOARDING_STATUS_MAP[v] || v}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 170,
    },
    {
      title: '操作',
      width: 260,
      fixed: 'right' as const,
      render: (_, record) => {
        const btnLoading = actionLoading === record.id;
        return (
          <Space size="small" wrap>
            <Button type="link" size="small" icon={<FileTextOutlined />}
              onClick={() => handleViewDetail(record)}>详情</Button>

            {/* 草稿 → 可编辑/删除/撤回 */}
            {record.status === 0 && canManage && (
              <>
                <Button type="link" size="small" icon={<EditOutlined />}
                  onClick={() => handleOpenForm()}>编辑</Button>
                <Popconfirm title="确定删除此草稿？" onConfirm={() =>
                  doAction(record.id, () => onboardingService.remove(record.id), '已删除')}>
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}
                    loading={btnLoading}>删除</Button>
                </Popconfirm>
              </>
            )}

            {/* 审批中 → 可撤回 + 审批 */}
            {record.status === 1 && canManage && (
              <>
                <Popconfirm title="确定撤回此申请？" onConfirm={() =>
                  doAction(record.id, () => onboardingService.withdraw(record.id), '已撤回')}>
                  <Button type="link" size="small" icon={<RollbackOutlined />}
                    loading={btnLoading}>撤回</Button>
                </Popconfirm>
                <Button type="link" size="small" icon={<CheckCircleOutlined />}
                  onClick={() => handleOpenApproval(record.id)}>审批</Button>
              </>
            )}

            {/* 已通过/待入职 → 确认到岗 + 更新日期 + 放弃入职 */}
            {record.status === 2 && canManage && (
              <>
                <Popconfirm title="确认该员工已到岗？系统将自动生成工号。" onConfirm={() =>
                  doAction(record.id, () => onboardingService.confirmArrival(record.id), '已确认到岗')}>
                  <Button type="link" size="small" icon={<CheckCircleOutlined />}
                    loading={btnLoading}>确认到岗</Button>
                </Popconfirm>
                <Button type="link" size="small" icon={<CalendarOutlined />}
                  onClick={() => handleOpenEntryDate(record)}>改日期</Button>
                <Popconfirm title="确定放弃入职？此操作不可逆。" onConfirm={() =>
                  doAction(record.id, () => onboardingService.abandon(record.id), '已放弃入职')}>
                  <Button type="link" size="small" danger icon={<StopOutlined />}
                    loading={btnLoading}>放弃入职</Button>
                </Popconfirm>
              </>
            )}

            {/* 已入职 / 已拒绝 / 已撤回 / 已放弃 → 无操作 */}
            {[3, 4, 5, 6].includes(record.status) && (
              <span style={{ color: '#999' }}>--</span>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="入职管理"
        extra={
          <Space>
            <Select allowClear placeholder="状态筛选" style={{ width: 120 }}
              value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={statusOptions} />
            <Input.Search placeholder="搜索姓名/手机号" style={{ width: 200 }}
              value={keyword} onChange={(e) => setKeyword(e.target.value)}
              onSearch={() => { setPage(1); fetchData(); }} />
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新</Button>
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenForm}>
                新增入职
              </Button>
            )}
          </Space>
        }
      >
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
          pagination={{ current: page, total, pageSize: 10, showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => setPage(p) }}
          scroll={{ x: 1300 }} />
      </Card>

      {/* ===== 入职申请表单弹窗 ===== */}
      <Modal title="入职申请" open={formOpen} onCancel={() => setFormOpen(false)}
        width={720} footer={
          <Space>
            <Button onClick={() => setFormOpen(false)}>取消</Button>
            <Button onClick={() => handleSubmit(true)} loading={submitting}>保存草稿</Button>
            <Button type="primary" onClick={() => handleSubmit(false)} loading={submitting}>提交申请</Button>
          </Space>
        } destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入' }]}>
                <Input placeholder="真实姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入' }]}>
                <Input placeholder="手机号码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入' }, { type: 'email' }]}>
                <Input placeholder="电子邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="idCard" label="身份证号">
                <Input placeholder="18位身份证号" maxLength={18} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="gender" label="性别">
                <Select placeholder="选择性别" options={Object.entries(GENDER_MAP).map(([k, v]) => ({ value: Number(k), label: v }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="grade" label="职级">
                <Input placeholder="如 P2" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="entryDate" label="入职日期" rules={[{ required: true, message: '请选择' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="targetDeptId" label="目标部门" rules={[{ required: true, message: '请选择' }]}>
                <Select showSearch placeholder="选择部门" options={flattenDepts(depts)}
                  filterOption={(input, option) => (option?.label as string)?.includes(input)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetPositionId" label="目标职位" rules={[{ required: true, message: '请选择' }]}>
                <Select showSearch placeholder="选择职位"
                  options={positions.map((p) => ({ value: p.id, label: p.positionName }))}
                  filterOption={(input, option) => (option?.label as string)?.includes(input)} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="offerSalary" label="薪资" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="月薪" prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="probationMonths" label="试用月数">
                <InputNumber style={{ width: '100%' }} min={0} max={12} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="probationSalaryRatio" label="试用期薪资比例">
                <InputNumber style={{ width: '100%' }} min={0} max={1} step={0.05} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="reportTo" label="汇报上级">
                <InputNumber style={{ width: '100%' }} min={1} placeholder="员工ID" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="workLocation" label="工作地点">
                <Input placeholder="如 北京" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="entryType" label="入职类型">
                <Select options={Object.entries(ENTRY_TYPE_MAP).map(([k, v]) => ({ value: Number(k), label: v }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bankAccount" label="银行账号">
                <Input placeholder="银行卡号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankName" label="银行名称">
                <Input placeholder="如 招商银行" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ===== 详情抽屉 ===== */}
      <Drawer title="入职详情" open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedRecord(null); }}
        width={560}>
        {selectedRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="姓名">{selectedRecord.realName}</Descriptions.Item>
            <Descriptions.Item label="手机号">
              <SensitiveText text={selectedRecord.phone} type="phone" />
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">{selectedRecord.email}</Descriptions.Item>
            <Descriptions.Item label="身份证号">
              <SensitiveText text={selectedRecord.idCard} type="idCard" />
            </Descriptions.Item>
            <Descriptions.Item label="目标部门">{selectedRecord.targetDeptName || '--'}</Descriptions.Item>
            <Descriptions.Item label="目标职位">{selectedRecord.targetPositionName || '--'}</Descriptions.Item>
            <Descriptions.Item label="薪资">¥{selectedRecord.offerSalary?.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="入职日期">{selectedRecord.entryDate}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(selectedRecord.status)}>{ONBOARDING_STATUS_MAP[selectedRecord.status]}</Tag>
            </Descriptions.Item>
            {selectedRecord.employeeNo && (
              <Descriptions.Item label="工号">{selectedRecord.employeeNo}</Descriptions.Item>
            )}
            <Descriptions.Item label="创建时间">{selectedRecord.createTime}</Descriptions.Item>
            {selectedRecord.approverComment && (
              <Descriptions.Item label="审批意见">{selectedRecord.approverComment}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>

      {/* ===== 审批弹窗 ===== */}
      <ApprovalModal open={approvalOpen} title="入职审批" showReturn={false}
        onOk={handleApprovalOk}
        onCancel={() => { setApprovalOpen(false); setApprovingId(null); }}
        loading={approving} />

      {/* ===== 更新入职日期弹窗 ===== */}
      <Modal title="更新入职日期" open={entryDateOpen}
        onOk={handleSaveEntryDate} onCancel={() => setEntryDateOpen(false)}
        confirmLoading={entryDateSaving} destroyOnClose>
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>员工：{entryDateRecord?.realName}</div>
          <DatePicker value={entryDateValue} onChange={setEntryDateValue}
            style={{ width: '100%' }} />
        </div>
      </Modal>
    </div>
  );
}
