/**
 * 薪资批次管理页面
 *
 * 按 spec: salary-calc
 *   - 批次列表 + 状态流操作按钮（提交/审批/发放/归档）
 *   - 批次薪资记录查看（Drawer）
 *
 * API: services/salary.ts
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, message, Drawer, Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined, SendOutlined,
  DollarOutlined, FolderOutlined, EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import {
  getBatches, getBatchRecords, submitBatch, approveBatch, payBatch, archiveBatch,
} from '@/services/salary';
import type { SalaryBatch, SalaryRecord } from '@/services/salary';
import { SALARY_BATCH_STATUS_MAP, getStatusColor, APPROVAL_ACTION } from '@/utils/constants';
import ApprovalModal, { type ApprovalFormValues } from '@/components/ApprovalModal';
import dayjs from 'dayjs';

/** 格式化金额 */
function fmt(val: number | undefined | null): string {
  if (val == null) return '--';
  return val.toFixed(2);
}

export default function SalaryBatchesPage() {
  // ===== 批次列表 =====
  const [data, setData] = useState<SalaryBatch[]>([]);
  const [loading, setLoading] = useState(false);

  // ===== 批次记录 Drawer =====
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<SalaryBatch | null>(null);

  // ===== 审批弹窗 =====
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvingBatch, setApprovingBatch] = useState<SalaryBatch | null>(null);
  const [approving, setApproving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getBatches();
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

  // 查看批次记录
  const handleViewRecords = useCallback(async (record: SalaryBatch) => {
    setSelectedBatch(record);
    setRecordsOpen(true);
    setRecordsLoading(true);
    try {
      const result = await getBatchRecords(record.id);
      setRecords(result.records || result.list || []);
    } catch {
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  // 提交
  const handleSubmit = useCallback(async (id: number) => {
    try {
      await submitBatch(id);
      message.success('批次已提交审批');
      fetchData();
    } catch { /* handled */ }
  }, [fetchData]);

  // 发放
  const handlePay = useCallback(async (id: number) => {
    Modal.confirm({
      title: '确认发放',
      content: '确定要发放该批次的薪资吗？发放后将不可撤回。',
      okText: '确认发放',
      cancelText: '取消',
      onOk: async () => {
        try {
          await payBatch(id);
          message.success('薪资已发放');
          fetchData();
        } catch { /* handled */ }
      },
    });
  }, [fetchData]);

  // 归档
  const handleArchive = useCallback(async (id: number) => {
    try {
      await archiveBatch(id);
      message.success('批次已归档');
      fetchData();
    } catch { /* handled */ }
  }, [fetchData]);

  // 打开审批弹窗
  const handleOpenApproval = useCallback((record: SalaryBatch) => {
    setApprovingBatch(record);
    setApprovalOpen(true);
  }, []);

  // 提交审批
  const handleApprovalSubmit = useCallback(async (values: ApprovalFormValues) => {
    if (!approvingBatch) return;
    setApproving(true);
    try {
      await approveBatch(approvingBatch.id, values.action, values.comment);
      message.success(values.action === APPROVAL_ACTION.APPROVE ? '审批通过' : '已拒绝');
      setApprovalOpen(false);
      setApprovingBatch(null);
      fetchData();
    } catch {
      // handled
    } finally {
      setApproving(false);
    }
  }, [approvingBatch, fetchData]);

  // 操作按钮
  const renderActions = (record: SalaryBatch) => {
    const actions: React.ReactNode[] = [];

    if (record.status === 'DRAFT') {
      actions.push(
        <Popconfirm
          key="submit"
          title="确认提交该批次进行审批？"
          onConfirm={() => handleSubmit(record.id)}
        >
          <Button type="link" size="small" icon={<SendOutlined />}>
            提交
          </Button>
        </Popconfirm>,
      );
    }

    if (record.status === 'PENDING_APPROVAL') {
      actions.push(
        <Button
          key="approve"
          type="link"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => handleOpenApproval(record)}
        >
          审批
        </Button>,
      );
    }

    if (record.status === 'APPROVED') {
      actions.push(
        <Button
          key="pay"
          type="link"
          size="small"
          icon={<DollarOutlined />}
          style={{ color: '#52c41a' }}
          onClick={() => handlePay(record.id)}
        >
          发放
        </Button>,
      );
    }

    if (record.status === 'PAID') {
      actions.push(
        <Popconfirm
          key="archive"
          title="确认归档该批次？"
          onConfirm={() => handleArchive(record.id)}
        >
          <Button type="link" size="small" icon={<FolderOutlined />}>
            归档
          </Button>
        </Popconfirm>,
      );
    }

    actions.push(
      <Button
        key="view"
        type="link"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => handleViewRecords(record)}
      >
        记录
      </Button>,
    );

    return <Space size={0}>{actions}</Space>;
  };

  const columns: ColumnsType<SalaryBatch> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '批次名称',
      dataIndex: 'batchName',
      width: 200,
      ellipsis: true,
      render: (v: string | undefined, record) => v || `${record.year}年${record.month}月薪资批次`,
    },
    {
      title: '年月',
      width: 100,
      render: (_, record) => `${record.year}-${String(record.month).padStart(2, '0')}`,
    },
    {
      title: '人数',
      dataIndex: 'employeeCount',
      width: 80,
      align: 'center',
    },
    {
      title: '应发合计',
      dataIndex: 'totalGross',
      width: 130,
      align: 'right',
      render: (v: number | undefined) => (v != null ? `¥ ${fmt(v)}` : '--'),
    },
    {
      title: '实发合计',
      dataIndex: 'totalNet',
      width: 130,
      align: 'right',
      render: (v: number | undefined) => (v != null ? `¥ ${fmt(v)}` : '--'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{SALARY_BATCH_STATUS_MAP[status] || status}</Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 170,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '--',
    },
    {
      title: '操作',
      width: 280,
      fixed: 'right',
      render: (_, record) => renderActions(record),
    },
  ];

  // 批次记录表格列
  const recordColumns: ColumnsType<SalaryRecord> = [
    { title: '工号', dataIndex: 'employeeNo', width: 110 },
    { title: '姓名', dataIndex: 'employeeName', width: 100 },
    { title: '部门', dataIndex: 'deptName', width: 120 },
    { title: '基本工资', dataIndex: 'baseSalary', width: 110, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '考勤扣款', dataIndex: 'attendanceDeduction', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '请假扣款', dataIndex: 'leaveDeduction', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '加班费', dataIndex: 'overtimePay', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '社保', dataIndex: 'socialInsurance', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '公积金', dataIndex: 'housingFund', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '个税', dataIndex: 'incomeTax', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '实发', dataIndex: 'netPay', width: 110, align: 'right', render: (v) => <b>¥ {fmt(v)}</b> },
  ];

  return (
    <>
      <Card
        title={
          <>
            <FileTextOutlined style={{ marginRight: 8 }} />
            薪资批次管理
          </>
        }
        extra={
          <Button onClick={fetchData} loading={loading}>
            刷新
          </Button>
        }
      >
        <Table<SalaryBatch>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* 批次记录 Drawer */}
      <Drawer
        title={
          selectedBatch
            ? `${selectedBatch.year}年${selectedBatch.month}月 — 批次薪资记录`
            : '批次薪资记录'
        }
        open={recordsOpen}
        onClose={() => setRecordsOpen(false)}
        width={1000}
      >
        <Table<SalaryRecord>
          rowKey="id"
          columns={recordColumns}
          dataSource={records}
          loading={recordsLoading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Drawer>

      {/* 审批弹窗 */}
      <ApprovalModal
        open={approvalOpen}
        loading={approving}
        onOk={handleApprovalSubmit}
        onCancel={() => {
          setApprovalOpen(false);
          setApprovingBatch(null);
        }}
      />
    </>
  );
}
