/**
 * 薪资账套管理页面
 *
 * 按 spec: salary-account
 *   - 薪资账套查看页（选择员工 → 查看账套）
 *   - 薪资账套创建/调整表单
 *   - 薪资变更历史时间线
 *   - 停用操作
 *
 * API: services/salary-account.ts
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Card, Select, Button, Descriptions, Modal, Form, InputNumber, message, Timeline,
  Space, Popconfirm, Spin, Empty, Tag, Tabs,
} from 'antd';
import {
  SearchOutlined, EditOutlined, PlusOutlined, StopOutlined,
  HistoryOutlined, AccountBookOutlined,
} from '@ant-design/icons';
import {
  getAccount, getHistory, create, adjust, deactivate,
} from '@/services/salary-account';
import type { SalaryAccount, SalaryAdjustmentHistory } from '@/services/salary-account';
import { getList as getEmployeeList } from '@/services/employee';
import type { Employee } from '@/services/employee';
import { getList as getPlanList } from '@/services/salary-plan';
import type { SalaryPlan } from '@/services/salary-plan';
import dayjs from 'dayjs';

/** 格式化金额 */
function fmt(val: number | undefined | null): string {
  if (val == null) return '--';
  return `¥ ${val.toFixed(2)}`;
}

export default function SalaryAccountsPage() {
  // ===== 选择员工 =====
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>();

  // ===== 账套 =====
  const [account, setAccount] = useState<SalaryAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  // ===== 变更历史 =====
  const [history, setHistory] = useState<SalaryAdjustmentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ===== 表单弹窗 =====
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'adjust'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [plans, setPlans] = useState<SalaryPlan[]>([]);

  // 加载员工
  useEffect(() => {
    setEmpLoading(true);
    getEmployeeList({ page: 1, size: 9999 })
      .then((res) => setEmployees(res.records || res.list || []))
      .catch(() => {})
      .finally(() => setEmpLoading(false));
  }, []);

  // 加载方案列表
  useEffect(() => {
    getPlanList()
      .then(setPlans)
      .catch(() => {});
  }, []);

  // 查询账套
  const handleSearch = useCallback(async () => {
    if (!selectedEmployeeId) {
      message.warning('请选择员工');
      return;
    }
    setAccountLoading(true);
    try {
      const acc = await getAccount(selectedEmployeeId);
      setAccount(acc);
    } catch {
      setAccount(null);
    } finally {
      setAccountLoading(false);
    }
  }, [selectedEmployeeId]);

  // 查询变更历史
  const handleViewHistory = useCallback(async () => {
    if (!selectedEmployeeId) return;
    setHistoryLoading(true);
    try {
      const h = await getHistory(selectedEmployeeId);
      setHistory(h);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedEmployeeId]);

  // 打开创建表单
  const handleCreate = () => {
    if (!selectedEmployeeId) {
      message.warning('请先查询员工');
      return;
    }
    setFormMode('create');
    form.resetFields();
    form.setFieldsValue({
      employeeId: selectedEmployeeId,
      planId: plans[0]?.id,
      housingFundRatio: 12,
      status: 1,
    });
    setFormOpen(true);
  };

  // 打开调整表单
  const handleAdjustForm = () => {
    if (!account) return;
    setFormMode('adjust');
    form.setFieldsValue({
      employeeId: account.employeeId,
      planId: account.planId,
      baseSalary: account.baseSalary,
      pensionBase: account.pensionBase,
      medicalBase: account.medicalBase,
      housingFundBase: account.housingFundBase,
      housingFundRatio: account.housingFundRatio,
    });
    setFormOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (formMode === 'create') {
        await create(values);
        message.success('薪资账套创建成功');
      } else {
        if (!account) return;
        await adjust(account.id, values);
        message.success('薪资调整成功');
      }
      setFormOpen(false);
      handleSearch();
    } catch {
      // validation or API error
    } finally {
      setSubmitting(false);
    }
  };

  // 停用
  const handleDeactivate = async () => {
    if (!account) return;
    try {
      await deactivate(account.id);
      message.success('薪资账套已停用');
      handleSearch();
    } catch { /* handled */ }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 员工选择 */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap size="middle">
          <Select
            showSearch
            placeholder="选择员工"
            loading={empLoading}
            value={selectedEmployeeId}
            onChange={setSelectedEmployeeId}
            style={{ width: 240 }}
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            options={employees.map((e) => ({
              value: e.id,
              label: `${e.name} (${e.employeeNo})`,
            }))}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={accountLoading}>
            查询账套
          </Button>
        </Space>
      </Card>

      {/* 账套详情 */}
      {accountLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : account ? (
        <Card
          title={
            <>
              <AccountBookOutlined style={{ marginRight: 8 }} />
              {account.employeeName || `员工 ${account.employeeId}`} — 薪资账套
            </>
          }
          extra={
            <Space>
              <Button icon={<EditOutlined />} onClick={handleAdjustForm}>调整薪资</Button>
              <Button icon={<HistoryOutlined />} onClick={handleViewHistory} loading={historyLoading}>
                变更历史
              </Button>
              {account.status === 1 && (
                <Popconfirm title="确认停用该薪资账套？" onConfirm={handleDeactivate}>
                  <Button danger icon={<StopOutlined />}>停用</Button>
                </Popconfirm>
              )}
            </Space>
          }
        >
          <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
            <Descriptions.Item label="方案">
              {account.planName || `方案 ${account.planId}`}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={account.status === 1 ? 'green' : 'default'}>
                {account.status === 1 ? '启用' : '停用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="生效日期">
              {account.effectiveDate ? dayjs(account.effectiveDate).format('YYYY-MM-DD') : '--'}
            </Descriptions.Item>
            <Descriptions.Item label="基本工资">{fmt(account.baseSalary)}</Descriptions.Item>
            <Descriptions.Item label="养老基数">{fmt(account.pensionBase)}</Descriptions.Item>
            <Descriptions.Item label="医疗基数">{fmt(account.medicalBase)}</Descriptions.Item>
            <Descriptions.Item label="公积金基数">{fmt(account.housingFundBase)}</Descriptions.Item>
            <Descriptions.Item label="公积金比例">{account.housingFundRatio}%</Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {account.updateTime ? dayjs(account.updateTime).format('YYYY-MM-DD HH:mm:ss') : '--'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ) : (
        <Card>
          <Empty description="请选择员工后查询账套" />
        </Card>
      )}

      {/* 变更历史 */}
      {history.length > 0 && (
        <Card title={<><HistoryOutlined style={{ marginRight: 8 }} />薪资变更历史</>} style={{ marginTop: 24 }}>
          <Timeline
            items={history.map((h) => ({
              children: (
                <div key={h.id}>
                  <div style={{ fontWeight: 500 }}>
                    {h.fieldName}: <span style={{ color: '#ff4d4f', textDecoration: 'line-through' }}>{h.oldValue}</span>
                    {' → '}
                    <span style={{ color: '#52c41a', fontWeight: 600 }}>{h.newValue}</span>
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    {dayjs(h.createTime).format('YYYY-MM-DD HH:mm:ss')}
                    {h.operatorName && ` · ${h.operatorName}`}
                    {h.reason && ` · ${h.reason}`}
                  </div>
                </div>
              ),
            }))}
          />
        </Card>
      )}

      {/* 表单弹窗 */}
      <Modal
        title={formMode === 'create' ? '创建薪资账套' : '调整薪资'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {formMode === 'create' && (
            <>
              <Form.Item name="employeeId" label="员工ID" hidden>
                <InputNumber />
              </Form.Item>
              <Form.Item name="planId" label="薪资方案" rules={[{ required: true, message: '请选择方案' }]}>
                <Select
                  options={plans.map((p) => ({ value: p.id, label: p.planName }))}
                  placeholder="选择薪资方案"
                />
              </Form.Item>
            </>
          )}
          <Form.Item name="baseSalary" label="基本工资" rules={[{ required: true, message: '请输入基本工资' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" placeholder="如 25000.00" />
          </Form.Item>
          <Form.Item name="pensionBase" label="养老基数" rules={[{ required: true, message: '请输入养老基数' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="medicalBase" label="医疗基数" rules={[{ required: true, message: '请输入医疗基数' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="housingFundBase" label="公积金基数" rules={[{ required: true, message: '请输入公积金基数' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="housingFundRatio" label="公积金比例 (%)" rules={[{ required: true, message: '请输入公积金比例' }]}>
            <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} placeholder="如 12" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
