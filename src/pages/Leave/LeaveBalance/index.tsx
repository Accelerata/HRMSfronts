/**
 * 假期余额页面
 *
 * 按 spec: leave-management
 *   - 余额卡片组（7 种假期类型：年假/调休/事假/病假/婚假/产假/丧假）
 *   - 年假初始化表单（HR/Admin）
 *
 * API:
 *   GET  /leave/balance/{employeeId}
 *   POST /leave/balance/annual/init
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Statistic, Button, Form, InputNumber, DatePicker, Select, message,
  Empty, Spin, Space, Divider,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import { getBalance, initAnnualBalance } from '@/services/leave';
import type { LeaveBalance } from '@/services/leave';

export default function LeaveBalancePage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const myEmployeeId = currentUser?.employeeId;

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(myEmployeeId);

  const [initForm] = Form.useForm();
  const [initLoading, setInitLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    const empId = selectedEmployeeId || myEmployeeId;
    if (!empId) return;
    setLoading(true);
    try {
      const list = await getBalance(empId, new Date().getFullYear());
      setBalances(list);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, myEmployeeId]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // 年假初始化
  const handleInitAnnual = async () => {
    try {
      const values = await initForm.validateFields();
      setInitLoading(true);
      await initAnnualBalance(
        values.employeeId,
        values.entryDate.format('YYYY-MM-DD'),
        values.year || new Date().getFullYear(),
      );
      message.success('年假余额初始化成功');
      initForm.resetFields();
    } catch (err: any) {
      if (err?.errorFields) return;
    } finally {
      setInitLoading(false);
    }
  };

  const isAdminOrHR = currentUser?.roleCode === 'ROLE_ADMIN' || currentUser?.roleCode === 'ROLE_HR';

  // 余额颜色：区分不同状态
  const getValueColor = (remaining: number) => {
    if (remaining <= 0) return '#999';
    if (remaining <= 3) return '#faad14';
    return '#1677ff';
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 员工选择器（HR/Admin可按需查询他人余额） */}
      {isAdminOrHR && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space>
            <span>查询员工假期余额：</span>
            <Select
              showSearch
              placeholder="输入员工ID"
              value={selectedEmployeeId}
              onChange={(v) => setSelectedEmployeeId(v)}
              style={{ width: 200 }}
              filterOption={false}
              options={selectedEmployeeId ? [{ value: selectedEmployeeId, label: `员工ID: ${selectedEmployeeId}` }] : []}
              notFoundContent="请输入员工ID"
              allowClear
              onClear={() => setSelectedEmployeeId(myEmployeeId)}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchBalances} loading={loading}>
              查询
            </Button>
          </Space>
        </Card>
      )}

      {/* 余额卡片组 */}
      <Card title="假期余额" loading={loading}>
        {balances.length === 0 && !loading ? (
          <Empty description="暂无假期余额数据" />
        ) : (
          <Row gutter={[16, 16]}>
            {balances.map((b) => (
              <Col xs={24} sm={12} md={8} lg={6} key={b.leaveType}>
                <Card
                  size="small"
                  hoverable
                  style={{
                    borderTop: `3px solid ${getValueColor(b.remainingDays)}`,
                  }}
                >
                  <Statistic
                    title={b.leaveTypeName}
                    value={b.remainingDays}
                    precision={0.5}
                    suffix="天"
                    valueStyle={{ color: getValueColor(b.remainingDays), fontSize: 28 }}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    总计 {b.totalDays} 天 · 已用 {b.usedDays} 天
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* 年假初始化（HR/Admin 可见） */}
      {isAdminOrHR && (
        <>
          <Divider />
          <Card title="年假初始化" size="small" style={{ maxWidth: 480 }}>
            <Form
              form={initForm}
              layout="vertical"
              initialValues={{ year: new Date().getFullYear() }}
            >
              <Form.Item
                name="employeeId"
                label="员工ID"
                rules={[{ required: true, message: '请输入员工ID' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} placeholder="输入员工ID" />
              </Form.Item>

              <Form.Item
                name="entryDate"
                label="入职日期"
                rules={[{ required: true, message: '请选择入职日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="year" label="年度">
                <InputNumber style={{ width: '100%' }} min={2020} max={2099} />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleInitAnnual}
                  loading={initLoading}
                >
                  初始化年假
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </>
      )}
    </div>
  );
}
