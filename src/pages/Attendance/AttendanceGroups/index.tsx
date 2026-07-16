/**
 * 考勤组管理页
 *
 * 按 spec: attendance-punch — ProTable + CRUD 弹窗
 * API: GET/POST/PUT/DELETE /attendance/groups
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, message, Form, Input, Select, InputNumber, TimePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from '@/services/attendance';
import type { AttendanceGroup } from '@/services/attendance';
import { ATTENDANCE_GROUP_TYPE_MAP } from '@/utils/constants';
import dayjs from 'dayjs';

const GROUP_TYPE_OPTIONS = [
  { value: 1, label: '固定班' },
  { value: 2, label: '弹性班' },
  { value: 3, label: '排班制' },
];

export default function AttendanceGroupsPage() {
  const [data, setData] = useState<AttendanceGroup[]>([]);
  const [loading, setLoading] = useState(false);

  // 表单弹窗
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AttendanceGroup | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getGroups();
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

  const handleAdd = () => {
    setEditingGroup(null);
    form.resetFields();
    form.setFieldsValue({
      groupType: 1,
      status: 1,
      lateThresholdMinutes: 15,
      earlyThresholdMinutes: 15,
      absentHalfDayThreshold: 120,
    });
    setFormOpen(true);
  };

  const handleEdit = (record: AttendanceGroup) => {
    setEditingGroup(record);
    form.setFieldsValue({
      ...record,
      startTime: record.startTime ? dayjs(record.startTime, 'HH:mm:ss') : undefined,
      endTime: record.endTime ? dayjs(record.endTime, 'HH:mm:ss') : undefined,
      lunchBreakStart: record.lunchBreakStart ? dayjs(record.lunchBreakStart, 'HH:mm:ss') : undefined,
      lunchBreakEnd: record.lunchBreakEnd ? dayjs(record.lunchBreakEnd, 'HH:mm:ss') : undefined,
    });
    setFormOpen(true);
  };

  const handleDelete = (record: AttendanceGroup) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除考勤组「${record.groupName}」吗？`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteGroup(record.id);
          message.success('删除成功');
          fetchData();
        } catch {
          // handled
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // Convert dayjs time objects to HH:mm:ss strings
      const params: any = { ...values };
      if (values.startTime) params.startTime = values.startTime.format('HH:mm:ss');
      if (values.endTime) params.endTime = values.endTime.format('HH:mm:ss');
      if (values.lunchBreakStart) params.lunchBreakStart = values.lunchBreakStart.format('HH:mm:ss');
      if (values.lunchBreakEnd) params.lunchBreakEnd = values.lunchBreakEnd.format('HH:mm:ss');

      if (editingGroup) {
        await updateGroup(editingGroup.id, params);
        message.success('考勤组更新成功');
      } else {
        await createGroup(params);
        message.success('考勤组创建成功');
      }
      setFormOpen(false);
      fetchData();
    } catch {
      // validation or API error
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<AttendanceGroup> = [
    {
      title: '名称',
      dataIndex: 'groupName',
      width: 180,
    },
    {
      title: '考勤类型',
      dataIndex: 'groupType',
      width: 100,
      render: (type: number) => (
        <Tag color={type === 1 ? 'blue' : type === 2 ? 'green' : 'orange'}>
          {ATTENDANCE_GROUP_TYPE_MAP[type] || type}
        </Tag>
      ),
    },
    {
      title: '上班时间',
      dataIndex: 'startTime',
      width: 100,
    },
    {
      title: '下班时间',
      dataIndex: 'endTime',
      width: 100,
    },
    {
      title: '弹性窗口(分)',
      dataIndex: 'flexThreshold',
      width: 110,
      render: (v) => v ?? '--',
    },
    {
      title: '迟到阈值(分)',
      dataIndex: 'lateThresholdMinutes',
      width: 110,
      render: (v) => v ?? '--',
    },
    {
      title: '早退阈值(分)',
      dataIndex: 'earlyThresholdMinutes',
      width: 110,
      render: (v) => v ?? '--',
    },
    {
      title: '午休时间',
      width: 150,
      render: (_, record) =>
        record.lunchBreakStart && record.lunchBreakEnd
          ? `${record.lunchBreakStart} - ${record.lunchBreakEnd}`
          : '--',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) =>
        v === 1 ? <Tag color="green">启用</Tag> : <Tag color="default">禁用</Tag>,
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <>
            <TeamOutlined style={{ marginRight: 8 }} />
            考勤组管理
          </>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增考勤组
          </Button>
        }
      >
        <Table<AttendanceGroup>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* 表单弹窗 */}
      <Modal
        title={editingGroup ? '编辑考勤组' : '新增考勤组'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="groupName" label="考勤组名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如 固定班制-标准" />
          </Form.Item>

          <Form.Item name="groupType" label="考勤类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={GROUP_TYPE_OPTIONS} />
          </Form.Item>

          <Space size="middle">
            <Form.Item name="startTime" label="上班时间" rules={[{ required: true, message: '请选择' }]}>
              <TimePicker format="HH:mm:ss" />
            </Form.Item>
            <Form.Item name="endTime" label="下班时间" rules={[{ required: true, message: '请选择' }]}>
              <TimePicker format="HH:mm:ss" />
            </Form.Item>
          </Space>

          <Form.Item name="flexThreshold" label="弹性窗口（分钟）" tooltip="允许弹性上下班的浮动时间">
            <InputNumber min={0} max={120} style={{ width: '100%' }} placeholder="默认 30" />
          </Form.Item>

          <Space size="middle">
            <Form.Item name="lateThresholdMinutes" label="迟到阈值（分钟）">
              <InputNumber min={0} max={60} />
            </Form.Item>
            <Form.Item name="earlyThresholdMinutes" label="早退阈值（分钟）">
              <InputNumber min={0} max={60} />
            </Form.Item>
            <Form.Item name="absentHalfDayThreshold" label="旷工半天阈值（分钟）">
              <InputNumber min={0} max={240} />
            </Form.Item>
          </Space>

          <Space size="middle">
            <Form.Item name="lunchBreakStart" label="午休开始">
              <TimePicker format="HH:mm:ss" />
            </Form.Item>
            <Form.Item name="lunchBreakEnd" label="午休结束">
              <TimePicker format="HH:mm:ss" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
}
