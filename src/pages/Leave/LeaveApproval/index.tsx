/**
 * 请假审批页面（审批人视图）
 *
 * 按 spec: leave-management — 待审批请假列表 + ApprovalModal
 *
 * API:
 *   GET  /approvals/todo          — 审批工作台待办（按 businessType=1 筛选请假）
 *   POST /leave/{id}/approve      — 审批请假申请
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, message } from 'antd';
import { CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { get } from '@/utils/request';
import { approveLeave } from '@/services/leave';
import ApprovalModal from '@/components/ApprovalModal';

/** 审批待办记录（按 API 17.1 approvals/todo 响应结构） */
interface ApprovalTodoItem {
  recordId: number;
  businessType: number;
  businessTypeName: string;
  businessId: number;
  applicantName: string;
  applicantDept: string;
  applicationTime: string;
  deadline?: string;
  summary: string;
}

export default function LeaveApprovalPage() {
  const [data, setData] = useState<ApprovalTodoItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<ApprovalTodoItem | null>(null);
  const [approving, setApproving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await get<ApprovalTodoItem[]>('/approvals/todo');
      // 筛选请假相关的待办 (businessType=1)
      const leaveItems = (result || []).filter((item) => item.businessType === 1);
      setData(leaveItems);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenApproval = (record: ApprovalTodoItem) => {
    setApprovingRecord(record);
    setApprovalModalOpen(true);
  };

  const handleApprovalOk = async (values: { action: number; comment: string }) => {
    if (!approvingRecord) return;
    setApproving(true);
    try {
      await approveLeave(approvingRecord.businessId, {
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

  const columns: ColumnsType<ApprovalTodoItem> = [
    {
      title: '申请人',
      dataIndex: 'applicantName',
      width: 100,
    },
    {
      title: '部门',
      dataIndex: 'applicantDept',
      width: 120,
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      ellipsis: true,
    },
    {
      title: '申请时间',
      dataIndex: 'applicationTime',
      width: 170,
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
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
          rowKey="recordId"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 800 }}
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
