/**
 * 补卡管理页面
 *
 * 按 spec: supplementary-card
 *   Tab 1 — 申请补卡（表单）
 *   Tab 2 — 我的补卡记录（状态标签）
 *   Tab 3 — 补卡审批（审批人视图 + ApprovalModal）
 *
 * API:
 *   POST /supplementary-card/apply
 *   POST /supplementary-card/{id}/approve
 *   GET  /supplementary-card/my
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Tabs, Form, DatePicker, Select, Input, Button, Table, Space, message, Modal, Tag,
} from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUserStore } from '@/models/user';
import {
  apply, approve, getMy,
} from '@/services/supplementary-card';
import type { SupplementaryCardRecord } from '@/services/supplementary-card';
import { get } from '@/utils/request';
import type { PageResult } from '@/utils/request';
import ApprovalModal from '@/components/ApprovalModal';
import {
  SUPPLEMENTARY_CARD_STATUS_MAP,
  CARD_TYPE_MAP,
} from '@/utils/constants';
import { getStatusColor } from '@/utils/constants';
import dayjs from 'dayjs';

const { TextArea } = Input;

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

export default function SupplementaryCardPage() {
  const currentUser = useUserStore((s) => s.currentUser);

  // ---------- Tab 1: 申请补卡 ----------
  const [applyForm] = Form.useForm();
  const [applying, setApplying] = useState(false);

  // ---------- Tab 2: 我的补卡记录 ----------
  const [myRecords, setMyRecords] = useState<SupplementaryCardRecord[]>([]);
  const [myLoading, setMyLoading] = useState(false);

  // ---------- Tab 3: 审批 ----------
  const [approvalList, setApprovalList] = useState<ApprovalTodoItem[]>([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<ApprovalTodoItem | null>(null);
  const [approving, setApproving] = useState(false);

  // ---------- Tab 1: 提交补卡申请 ----------
  const handleApply = async () => {
    try {
      const values = await applyForm.validateFields();
      setApplying(true);
      const record = await apply({
        attendanceDate: values.attendanceDate.format('YYYY-MM-DD'),
        cardType: values.cardType,
        supplementTime: values.supplementTime.format('HH:mm:ss'),
        reason: values.reason,
      });
      message.success('补卡申请已提交');
      applyForm.resetFields();
      // 刷新记录
      fetchMyRecords();
    } catch (err: any) {
      if (err?.errorFields) return; // 表单校验错误
    } finally {
      setApplying(false);
    }
  };

  // ---------- Tab 2: 查询我的记录 ----------
  const fetchMyRecords = useCallback(async () => {
    setMyLoading(true);
    try {
      const result = await getMy({ page: 1, size: 50 });
      setMyRecords(result.list || []);
    } catch {
      // handled by interceptor
    } finally {
      setMyLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRecords();
  }, [fetchMyRecords]);

  // ---------- Tab 3: 查询待审批列表 ----------
  const fetchApprovalList = useCallback(async () => {
    setApprovalLoading(true);
    try {
      const result = await get<ApprovalTodoItem[]>('/approvals/todo');
      // 筛选补卡相关的待办 (businessType=6)
      const suppCards = (result || []).filter((item) => item.businessType === 6);
      setApprovalList(suppCards);
    } catch {
      setApprovalList([]);
    } finally {
      setApprovalLoading(false);
    }
  }, []);

  // ---------- Tab 3: 审批操作 ----------
  const handleOpenApproval = (record: ApprovalTodoItem) => {
    setApprovingRecord(record);
    setApprovalModalOpen(true);
  };

  const handleApprovalOk = async (values: { action: number; comment: string }) => {
    if (!approvingRecord) return;
    setApproving(true);
    try {
      await approve(approvingRecord.businessId, {
        action: values.action,
        comment: values.comment,
      });
      message.success(values.action === 1 ? '已通过' : '已拒绝');
      setApprovalModalOpen(false);
      setApprovingRecord(null);
      fetchApprovalList();
    } catch {
      // handled by interceptor
    } finally {
      setApproving(false);
    }
  };

  // ---------- 列定义 ----------

  /** 我的记录列 */
  const myColumns: ColumnsType<SupplementaryCardRecord> = [
    {
      title: '日期',
      dataIndex: 'attendanceDate',
      width: 120,
    },
    {
      title: '打卡类型',
      dataIndex: 'cardType',
      width: 100,
      render: (v: number) => CARD_TYPE_MAP[v] || '--',
    },
    {
      title: '补充时间',
      dataIndex: 'supplementTime',
      width: 110,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: number) => (
        <Tag color={getStatusColor(v)}>{SUPPLEMENTARY_CARD_STATUS_MAP[v] || v}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
    },
  ];

  /** 审批列表列 */
  const approvalColumns: ColumnsType<ApprovalTodoItem> = [
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
      width: 180,
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      width: 180,
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleOpenApproval(record)}
          >
            审批
          </Button>
        </Space>
      ),
    },
  ];

  // ---------- Tab 项目 ----------
  const tabItems = [
    {
      key: 'apply',
      label: '申请补卡',
      children: (
        <Card size="small">
          <Form
            form={applyForm}
            layout="vertical"
            style={{ maxWidth: 480 }}
            initialValues={{ cardType: 1 }}
          >
            <Form.Item
              name="attendanceDate"
              label="补卡日期"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="cardType"
              label="打卡类型"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 1, label: '上班卡' },
                  { value: 2, label: '下班卡' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="supplementTime"
              label="补充时间"
              rules={[{ required: true, message: '请选择时间' }]}
            >
              <DatePicker.TimePicker format="HH:mm:ss" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="reason"
              label="补卡原因"
              rules={[{ required: true, message: '请输入补卡原因' }, { max: 500 }]}
            >
              <TextArea rows={3} placeholder="请详细说明补卡原因" maxLength={500} showCount />
            </Form.Item>

            <Form.Item>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleApply} loading={applying}>
                提交申请
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'my',
      label: '我的补卡记录',
      children: (
        <Table
          rowKey="id"
          columns={myColumns}
          dataSource={myRecords}
          loading={myLoading}
          pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 700 }}
        />
      ),
    },
  ];

  // 审批人可见第三个 Tab
  const currentRole = currentUser?.roleCode;
  const canApprove = currentRole === 'ROLE_ADMIN' || currentRole === 'ROLE_HR' || currentRole === 'ROLE_MANAGER';
  if (canApprove) {
    tabItems.push({
      key: 'approval',
      label: '补卡审批',
      children: (
        <Table
          rowKey="id"
          columns={approvalColumns}
          dataSource={approvalList}
          loading={approvalLoading}
          pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 700 }}
        />
      ),
    });
  }

  return (
    <div style={{ padding: 24 }}>
      <Tabs
        defaultActiveKey="apply"
        items={tabItems}
        onChange={(key) => {
          if (key === 'approval') fetchApprovalList();
          if (key === 'my') fetchMyRecords();
        }}
      />

      <ApprovalModal
        open={approvalModalOpen}
        title="补卡审批"
        showReturn={false}
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
