/**
 * 请假审批页面（审批人视图）
 *
 * 按 spec: leave-management — 待审批请假列表 + ApprovalModal
 *
 * API:
 *   GET  /approval/todo?businessType=1
 *   POST /leave/{id}/approve
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Space, Tag, message } from 'antd';
import { CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { get } from '@/utils/request';
import type { PageResult } from '@/utils/request';
import { approveLeave } from '@/services/leave';
import type { LeaveApplication } from '@/services/leave';
import ApprovalModal from '@/components/ApprovalModal';
import { LEAVE_TYPE_MAP, LEAVE_APPLICATION_STATUS_MAP } from '@/utils/constants';
import { getStatusColor } from '@/utils/constants';

type ApprovalItem = LeaveApplication;

export default function LeaveApprovalPage() {
  const [data, setData] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<ApprovalItem | null>(null);
  const [approving, setApproving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await get<PageResult<ApprovalItem>>('/approval/todo', {
        businessType: 1, // 请假申请
        page,
        size: 20,
      });
      setData(result.list || []);
      setTotal(result.total);
    } catch {
      // 审批接口可能未就绪，静默处理
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenApproval = (record: ApprovalItem) => {
    setApprovingRecord(record);
    setApprovalModalOpen(true);
  };

  const handleApprovalOk = async (values: { action: number; comment: string }) => {
    if (!approvingRecord) return;
    setApproving(true);
    try {
      await approveLeave(approvingRecord.id, {
        action: values.action,
        comment: values.comment,
      });
      const actionLabels: Record<number, string> = { 1: '已通过', 2: '已拒绝', 3: '已退回' };
      message.success(actionLabels[values.action] || '操作成功');
      setApprovalModalOpen(false);
      setApprovingRecord(null);
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setApproving(false);
    }
  };

  const columns: ColumnsType<ApprovalItem> = [
    {
      title: '申请人',
      dataIndex: 'employeeName',
      width: 100,
    },
    {
      title: '假期类型',
      dataIndex: 'leaveType',
      width: 90,
      render: (v: number) => LEAVE_TYPE_MAP[v] || '--',
    },
    {
      title: '日期范围',
      width: 200,
      render: (_, record) => `${record.startDate} ~ ${record.endDate}`,
    },
    {
      title: '天数',
      dataIndex: 'days',
      width: 70,
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      ellipsis: true,
      width: 200,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 170,
    },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => handleOpenApproval(record)}
        >
          审批
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="请假审批"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => setPage(p),
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      <ApprovalModal
        open={approvalModalOpen}
        title="请假审批"
        showReturn
        onOk={handleApprovalOk}
        onCancel={() => {
          setApprovalModalOpen(false);
          setApprovingRecord(null);
        }}
        loading={approving}
      />
    </div>
  );
}
