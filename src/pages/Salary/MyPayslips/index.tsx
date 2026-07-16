/**
 * 我的工资条页面
 *
 * 按 spec: salary-calc
 *   - 我的工资条列表页（员工视图）
 *   - 工资条详情 + 二次密码验证弹窗
 *
 * API: services/salary.ts
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Card, Table, Button, Space, Descriptions, Modal, Input, message, Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined, LockOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { getPayslips, getPayslipDetail } from '@/services/salary';
import type { Payslip, SalaryDetail } from '@/services/salary';
import dayjs from 'dayjs';

/** 格式化金额 */
function fmt(val: number | undefined | null): string {
  if (val == null) return '--';
  return val.toFixed(2);
}

/** 跟踪已验证过的 payslip recordId */
const verifiedSet = new Set<number>();

export default function MyPayslipsPage() {
  // ===== 列表 =====
  const [data, setData] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);

  // ===== 详情 =====
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<SalaryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPayslip, setCurrentPayslip] = useState<Payslip | null>(null);

  // ===== 密码验证 =====
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getPayslips();
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

  // 查看工资条详情
  const handleView = useCallback((record: Payslip) => {
    setCurrentPayslip(record);

    // 如果已验证过，直接获取详情
    if (verifiedSet.has(record.id)) {
      fetchDetail(record.id, undefined);
    } else {
      // 需要密码验证
      setPassword('');
      setPwdModalOpen(true);
    }
  }, []);

  // 获取详情
  const fetchDetail = async (recordId: number, pwd?: string) => {
    setDetailLoading(true);
    try {
      const result = await getPayslipDetail(recordId, pwd);
      setDetail(result);
      verifiedSet.add(recordId);
      setDetailOpen(true);
    } catch (err: any) {
      if (err?.message?.includes('密码')) {
        message.error('密码错误，请重试');
      }
      // other errors handled by interceptor
    } finally {
      setDetailLoading(false);
    }
  };

  // 密码验证
  const handleVerify = async () => {
    if (!password) {
      message.warning('请输入密码');
      return;
    }
    if (!currentPayslip) return;

    setVerifying(true);
    try {
      await getPayslipDetail(currentPayslip.id, password);
      verifiedSet.add(currentPayslip.id);
      setPwdModalOpen(false);
      // 验证成功后再次请求详情
      await fetchDetail(currentPayslip.id);
    } catch (err: any) {
      if (err?.message?.includes('密码')) {
        message.error('密码错误，请重试');
      }
    } finally {
      setVerifying(false);
    }
  };

  const columns: ColumnsType<Payslip> = [
    {
      title: '年份',
      dataIndex: 'year',
      width: 80,
    },
    {
      title: '月份',
      dataIndex: 'month',
      width: 80,
      render: (v: number) => `${v}月`,
    },
    {
      title: '姓名',
      dataIndex: 'employeeName',
      width: 100,
    },
    {
      title: '应发工资',
      dataIndex: 'grossPay',
      width: 130,
      align: 'right',
      render: (v: number) => `¥ ${fmt(v)}`,
    },
    {
      title: '实发工资',
      dataIndex: 'netPay',
      width: 130,
      align: 'right',
      render: (v: number) => <b style={{ color: '#1677ff' }}>¥ {fmt(v)}</b>,
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <>
            <FileTextOutlined style={{ marginRight: 8 }} />
            我的工资条
          </>
        }
        extra={
          <Button onClick={fetchData} loading={loading}>
            刷新
          </Button>
        }
      >
        <Table<Payslip>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      {/* 工资条详情 Modal */}
      <Modal
        title={
          detail
            ? `${detail.employeeName} — ${detail.year}年${detail.month}月 工资条`
            : '工资条详情'
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : detail ? (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="基本工资" span={1}>
              {fmt(detail.baseSalary)}
            </Descriptions.Item>
            <Descriptions.Item label="奖金合计" span={1}>
              {fmt(detail.bonusTotal)}
            </Descriptions.Item>
            <Descriptions.Item label="加班费" span={1}>
              {fmt(detail.overtimePay)}
            </Descriptions.Item>
            <Descriptions.Item label="考勤扣款" span={1}>
              <span style={{ color: detail.attendanceDeduction > 0 ? '#ff4d4f' : undefined }}>
                -{fmt(detail.attendanceDeduction)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="请假扣款" span={1}>
              <span style={{ color: detail.leaveDeduction > 0 ? '#ff4d4f' : undefined }}>
                -{fmt(detail.leaveDeduction)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="社保" span={1}>
              -{fmt(detail.socialInsurance)}
            </Descriptions.Item>
            <Descriptions.Item label="公积金" span={1}>
              -{fmt(detail.housingFund)}
            </Descriptions.Item>
            <Descriptions.Item label="应纳税所得额" span={1}>
              {fmt(detail.taxableIncome)}
            </Descriptions.Item>
            <Descriptions.Item label="个人所得税" span={1}>
              <span style={{ color: '#ff4d4f' }}>-{fmt(detail.incomeTax)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="应发工资" span={2}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{fmt(detail.grossPay)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="实发工资" span={2}>
              <span style={{ fontWeight: 700, fontSize: 18, color: '#1677ff' }}>
                {fmt(detail.netPay)}
              </span>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty description="暂无数据" />
        )}
      </Modal>

      {/* 密码验证弹窗 */}
      <Modal
        title={
          <>
            <LockOutlined style={{ marginRight: 8 }} />
            身份验证
          </>
        }
        open={pwdModalOpen}
        onCancel={() => setPwdModalOpen(false)}
        onOk={handleVerify}
        confirmLoading={verifying}
        okText="验证"
        cancelText="取消"
        destroyOnClose
      >
        <div style={{ margin: '16px 0' }}>
          <p style={{ color: '#666', marginBottom: 12 }}>
            工资条信息属于敏感数据，请输入您的登录密码以验证身份。
          </p>
          <Input.Password
            placeholder="请输入登录密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onPressEnter={handleVerify}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
