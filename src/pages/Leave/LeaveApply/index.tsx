/**
 * 请假申请页面
 *
 * 按 spec: leave-management
 *   - 日期+时段选择器
 *   - 天数试算预览
 *   - 假期余额展示
 *   - 交接人选择
 *   - 草稿→提交→审批→取消 状态流转
 *
 * API:
 *   GET  /leave/days/calculate
 *   GET  /leave/balance/{employeeId}
 *   POST /leave/apply
 *   POST /leave/{id}/submit
 *   POST /leave/{id}/cancel
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Form, Select, DatePicker, Input, Button, Space, Descriptions, Statistic, Row, Col,
  message, Alert, Spin, Popconfirm, Tag,
} from 'antd';
import {
  PlusOutlined, SendOutlined, CalculatorOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import {
  calculateDays, getBalance, applyLeave, submitLeave, cancelLeave,
} from '@/services/leave';
import type { LeaveBalance } from '@/services/leave';
import { LEAVE_TYPE_MAP, LEAVE_APPLICATION_STATUS_MAP } from '@/utils/constants';
import { getStatusColor } from '@/utils/constants';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function LeaveApplyPage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const employeeId = currentUser?.employeeId;

  const [form] = Form.useForm();
  const [applying, setApplying] = useState(false);

  // 试算
  const [calculatingDays, setCalculatingDays] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState<number | null>(null);

  // 余额
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<number | undefined>();

  // 查询余额
  const fetchBalances = useCallback(async () => {
    if (!employeeId) return;
    setBalancesLoading(true);
    try {
      const list = await getBalance(employeeId, dayjs().year());
      setBalances(list);
    } catch {
      // handled by interceptor
    } finally {
      setBalancesLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // 当前选中类型的余额
  const currentBalance = balances.find((b) => b.leaveType === selectedLeaveType);

  // 天数试算
  const handleCalculate = async () => {
    try {
      const values = await form.validateFields(['startDate', 'endDate', 'startPeriod', 'endPeriod']);
      if (!values.startDate || !values.endDate) {
        message.warning('请选择日期范围');
        return;
      }
      setCalculatingDays(true);
      const days = await calculateDays({
        startDate: values.startDate.format('YYYY-MM-DD'),
        startPeriod: values.startPeriod ?? 0,
        endDate: values.endDate.format('YYYY-MM-DD'),
        endPeriod: values.endPeriod ?? 1,
      });
      setCalculatedDays(days);
    } catch (err: any) {
      if (err?.errorFields) return;
    } finally {
      setCalculatingDays(false);
    }
  };

  // 提交申请（草稿）
  const handleApply = async () => {
    try {
      const values = await form.validateFields();
      setApplying(true);

      // 检查余额
      if (currentBalance && calculatedDays !== null && calculatedDays > currentBalance.remainingDays) {
        message.warning(`${LEAVE_TYPE_MAP[values.leaveType] || ''}余额不足，剩余 ${currentBalance.remainingDays} 天`);
        setApplying(false);
        return;
      }

      const record = await applyLeave({
        leaveType: values.leaveType,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        startPeriod: values.startPeriod ?? 0,
        endPeriod: values.endPeriod ?? 1,
        reason: values.reason || '',
        handoverTo: values.handoverTo,
      });

      message.success('请假申请已创建（草稿）');
      form.resetFields();
      setCalculatedDays(null);
      fetchBalances();
    } catch (err: any) {
      if (err?.errorFields) return;
    } finally {
      setApplying(false);
    }
  };

  // 提交草稿
  const handleSubmit = async (id: number) => {
    try {
      await submitLeave(id);
      message.success('已提交审批');
      fetchBalances();
    } catch {
      // handled by interceptor
    }
  };

  // 取消申请
  const handleCancel = async (id: number) => {
    try {
      await cancelLeave(id);
      message.success('已取消申请');
      fetchBalances();
    } catch {
      // handled by interceptor
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={24}>
        {/* 左侧：申请表单 */}
        <Col xs={24} lg={16}>
          <Card title="请假申请">
            <Form
              form={form}
              layout="vertical"
              style={{ maxWidth: 560 }}
              initialValues={{ startPeriod: 0, endPeriod: 1 }}
            >
              <Form.Item
                name="leaveType"
                label="假期类型"
                rules={[{ required: true, message: '请选择假期类型' }]}
              >
                <Select
                  placeholder="选择假期类型"
                  onChange={(v) => setSelectedLeaveType(v)}
                  options={Object.entries(LEAVE_TYPE_MAP).map(([k, v]) => ({
                    value: Number(k),
                    label: v,
                  }))}
                />
              </Form.Item>

              <Space size="middle" align="start">
                <Form.Item
                  name="startDate"
                  label="开始日期"
                  rules={[{ required: true, message: '请选择' }]}
                >
                  <DatePicker />
                </Form.Item>
                <Form.Item name="startPeriod" label="时段" style={{ width: 80 }}>
                  <Select
                    options={[
                      { value: 0, label: '上午' },
                      { value: 1, label: '下午' },
                    ]}
                  />
                </Form.Item>
                <span style={{ marginTop: 36, color: '#999' }}>—</span>
                <Form.Item
                  name="endDate"
                  label="结束日期"
                  rules={[{ required: true, message: '请选择' }]}
                >
                  <DatePicker />
                </Form.Item>
                <Form.Item name="endPeriod" label="时段" style={{ width: 80 }}>
                  <Select
                    options={[
                      { value: 0, label: '上午' },
                      { value: 1, label: '下午' },
                    ]}
                  />
                </Form.Item>
              </Space>

              {/* 试算按钮 */}
              <Form.Item>
                <Button
                  icon={<CalculatorOutlined />}
                  onClick={handleCalculate}
                  loading={calculatingDays}
                  type="dashed"
                >
                  试算天数
                </Button>
                {calculatedDays !== null && (
                  <Tag color="blue" style={{ marginLeft: 12, fontSize: 14, padding: '4px 12px' }}>
                    预计 {calculatedDays} 天
                  </Tag>
                )}
              </Form.Item>

              {/* 余额不足预警 */}
              {currentBalance && calculatedDays !== null && calculatedDays > currentBalance.remainingDays && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={`${LEAVE_TYPE_MAP[selectedLeaveType!]}余额不足`}
                  description={`您需要 ${calculatedDays} 天，但剩余仅 ${currentBalance.remainingDays} 天（总计 ${currentBalance.totalDays} 天，已用 ${currentBalance.usedDays} 天）`}
                />
              )}

              <Form.Item name="reason" label="请假原因" rules={[{ required: true, message: '请输入原因' }]}>
                <TextArea rows={3} placeholder="请详细说明请假原因" maxLength={500} showCount />
              </Form.Item>

              <Form.Item name="handoverTo" label="工作交接人">
                <Select
                  showSearch
                  placeholder="输入员工ID选择交接人"
                  filterOption={false}
                  style={{ width: 240 }}
                  options={[]}
                  notFoundContent="输入员工ID搜索"
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleApply} loading={applying}>
                  保存草稿
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 右侧：假期余额 */}
        <Col xs={24} lg={8}>
          <Card title="我的假期余额" loading={balancesLoading}>
            {balances.length === 0 && !balancesLoading && (
              <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
                暂无假期余额数据
              </div>
            )}
            {balances.map((b) => (
              <Card
                key={b.leaveType}
                size="small"
                style={{ marginBottom: 12 }}
                type={b.remainingDays === 0 ? undefined : 'inner'}
              >
                <Statistic
                  title={b.leaveTypeName}
                  value={b.remainingDays}
                  suffix={`/ ${b.totalDays} 天`}
                  precision={1}
                  valueStyle={{
                    color: b.remainingDays <= 0 ? '#999' : b.remainingDays <= 3 ? '#faad14' : '#1677ff',
                    fontSize: 20,
                  }}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  已用: {b.usedDays} 天
                </div>
              </Card>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
