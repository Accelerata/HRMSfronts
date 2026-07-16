/**
 * 我的请假记录页面（员工视图）
 *
 * 按 spec: leave-management — 分页请假记录列表 + 状态标签 + 操作按钮
 *
 * API:
 *   GET  /leave/applications/{employeeId}
 *   POST /leave/{id}/submit
 *   POST /leave/{id}/cancel
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Popconfirm, message, Drawer,
  Descriptions, List, Typography, Empty,
} from 'antd';
import {
  SendOutlined, CloseCircleOutlined, ReloadOutlined,
  FileTextOutlined, DownloadOutlined, PaperClipOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUserStore } from '@/models/user';
import { getApplications, submitLeave, cancelLeave } from '@/services/leave';
import type { LeaveApplication } from '@/services/leave';
import { getAttachments } from '@/services/leave-attachment';
import type { LeaveAttachment } from '@/services/leave-attachment';
import { LEAVE_TYPE_MAP, LEAVE_APPLICATION_STATUS_MAP } from '@/utils/constants';
import { getStatusColor } from '@/utils/constants';
import dayjs from 'dayjs';

export default function MyLeavesPage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const employeeId = currentUser?.employeeId;

  const [data, setData] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // 详情抽屉 & 附件
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LeaveApplication | null>(null);
  const [attachments, setAttachments] = useState<LeaveAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const result = await getApplications(employeeId, page, 20);
      setData(result.list || []);
      setTotal(result.total);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [employeeId, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 提交草稿
  const handleSubmit = async (id: number) => {
    setActionLoading(id);
    try {
      await submitLeave(id);
      message.success('已提交审批');
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setActionLoading(null);
    }
  };

  // 取消申请
  const handleCancel = async (id: number) => {
    setActionLoading(id);
    try {
      await cancelLeave(id);
      message.success('已取消');
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setActionLoading(null);
    }
  };

  // 查看详情 & 附件
  const handleViewDetail = async (record: LeaveApplication) => {
    setSelectedRecord(record);
    setDetailOpen(true);
    setAttachmentsLoading(true);
    try {
      const list = await getAttachments(record.id);
      setAttachments(list);
    } catch {
      setAttachments([]);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const periodLabel = (p: number) => (p === 0 ? '上午' : '下午');

  const columns: ColumnsType<LeaveApplication> = [
    {
      title: '假期类型',
      dataIndex: 'leaveType',
      width: 90,
      render: (v: number) => LEAVE_TYPE_MAP[v] || '--',
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      width: 110,
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      width: 110,
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
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: number) => (
        <Tag color={getStatusColor(v)}>{LEAVE_APPLICATION_STATUS_MAP[v] || v}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 170,
    },
    {
      title: '操作',
      width: 210,
      render: (_, record) => {
        const btnLoading = actionLoading === record.id;
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              详情
            </Button>
            {record.status === 0 && (
              <>
                <Button
                  type="link"
                  size="small"
                  icon={<SendOutlined />}
                  onClick={() => handleSubmit(record.id)}
                  loading={btnLoading}
                >
                  提交
                </Button>
                <Popconfirm
                  title="确定要取消此申请吗？"
                  onConfirm={() => handleCancel(record.id)}
                >
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<CloseCircleOutlined />}
                    loading={btnLoading}
                  >
                    取消
                  </Button>
                </Popconfirm>
              </>
            )}
            {record.status === 1 && (
              <Popconfirm
                title="确定要取消此申请吗？"
                onConfirm={() => handleCancel(record.id)}
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={btnLoading}
                >
                  取消申请
                </Button>
              </Popconfirm>
            )}
            {(record.status === 2 || record.status === 3 || record.status === 4) && (
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
        title="我的请假记录"
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

      {/* 详情抽屉（含附件列表与下载） */}
      <Drawer
        title="请假详情"
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedRecord(null);
          setAttachments([]);
        }}
        width={520}
      >
        {selectedRecord && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="假期类型">
                {LEAVE_TYPE_MAP[selectedRecord.leaveType] || '--'}
              </Descriptions.Item>
              <Descriptions.Item label="开始日期">
                {selectedRecord.startDate} {periodLabel(selectedRecord.startPeriod)}
              </Descriptions.Item>
              <Descriptions.Item label="结束日期">
                {selectedRecord.endDate} {periodLabel(selectedRecord.endPeriod)}
              </Descriptions.Item>
              <Descriptions.Item label="天数">
                <strong>{selectedRecord.days}</strong> 天
              </Descriptions.Item>
              <Descriptions.Item label="原因">
                {selectedRecord.reason}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedRecord.status)}>
                  {LEAVE_APPLICATION_STATUS_MAP[selectedRecord.status] || selectedRecord.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedRecord.createTime}
              </Descriptions.Item>
              {selectedRecord.approverComment && (
                <Descriptions.Item label="审批意见">
                  {selectedRecord.approverComment}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* 附件列表 */}
            <Card
              title={
                <>
                  <PaperClipOutlined style={{ marginRight: 8 }} />
                  附件材料
                </>
              }
              size="small"
              loading={attachmentsLoading}
            >
              {attachments.length === 0 ? (
                <Empty description="暂无附件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <List
                  dataSource={attachments}
                  renderItem={(att) => (
                    <List.Item
                      actions={[
                        <Button
                          key="download"
                          type="link"
                          icon={<DownloadOutlined />}
                          href={att.fileUrl}
                          target="_blank"
                        >
                          下载
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<PaperClipOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
                        title={
                          <Typography.Text ellipsis style={{ maxWidth: 320 }}>
                            {att.fileName}
                          </Typography.Text>
                        }
                        description={
                          <span style={{ fontSize: 12, color: '#999' }}>
                            {Math.round(att.fileSize / 1024)} KB · {att.uploadTime}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </>
        )}
      </Drawer>
    </div>
  );
}
