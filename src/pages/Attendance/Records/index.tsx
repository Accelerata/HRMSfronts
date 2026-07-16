/**
 * 打卡记录页
 *
 * 按 spec: attendance-punch — 月度日历视图或列表，状态颜色标记
 * API: GET /attendance/records/{employeeId}
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, DatePicker, Space, Table, Tag, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CalendarOutlined } from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import { getRecords } from '@/services/attendance';
import type { AttendanceRecord } from '@/services/attendance';
import { ATTENDANCE_DAY_STATUS_MAP } from '@/utils/constants';
import dayjs, { Dayjs } from 'dayjs';

const STATUS_COLOR_MAP: Record<string, string> = {
  NORMAL: 'green',
  LATE: 'orange',
  EARLY: 'orange',
  ABSENT: 'red',
  MISSING: 'red',
  LEAVE: 'blue',
  WEEKEND: 'default',
  FUTURE: 'default',
};

export default function AttendanceRecordsPage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const employeeId = currentUser?.employeeId;

  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());

  const fetchRecords = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const year = selectedMonth.year();
      const month = selectedMonth.month() + 1;
      const daysInMonth = selectedMonth.daysInMonth();
      const result = await getRecords(employeeId, 1, daysInMonth);
      setRecords(result.list || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, selectedMonth]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: '日期',
      dataIndex: 'punchDate',
      width: 120,
      render: (date: string) => (
        <span>{date} {dayjs(date).format('ddd')}</span>
      ),
    },
    {
      title: '上班打卡',
      dataIndex: 'punchInTime',
      width: 120,
      render: (v) => v || <span style={{ color: '#ccc' }}>缺卡</span>,
    },
    {
      title: '下班打卡',
      dataIndex: 'punchOutTime',
      width: 120,
      render: (v) => v || <span style={{ color: '#ccc' }}>缺卡</span>,
    },
    {
      title: '迟到分钟',
      dataIndex: 'lateMinutes',
      width: 100,
      render: (v: number) =>
        v > 0 ? <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{v}</span> : '0',
    },
    {
      title: '早退分钟',
      dataIndex: 'earlyMinutes',
      width: 100,
      render: (v: number | undefined) =>
        v ? <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{v}</span> : '0',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_COLOR_MAP[status] || 'default'}>
          {ATTENDANCE_DAY_STATUS_MAP[status] || status}
        </Tag>
      ),
    },
  ];

  // 统计
  const stats = {
    normal: records.filter((r) => r.status === 'NORMAL').length,
    late: records.filter((r) => r.status === 'LATE').length,
    early: records.filter((r) => r.status === 'EARLY').length,
    absent: records.filter((r) => r.status === 'ABSENT').length,
    missing: records.filter((r) => r.status === 'MISSING' && !r.punchInTime && !r.punchOutTime).length,
  };

  return (
    <Card
      title={
        <>
          <CalendarOutlined style={{ marginRight: 8 }} />
          打卡记录
        </>
      }
      extra={
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(d) => setSelectedMonth(d || dayjs())}
          allowClear={false}
        />
      }
    >
      {/* 月度概览 */}
      <div style={{ marginBottom: 16 }}>
        <Space size="large">
          <span>正常 <Tag color="green">{stats.normal}</Tag></span>
          <span>迟到 <Tag color="orange">{stats.late}</Tag></span>
          <span>早退 <Tag color="orange">{stats.early}</Tag></span>
          <span>旷工 <Tag color="red">{stats.absent}</Tag></span>
          <span>缺卡 <Tag color="red">{stats.missing}</Tag></span>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Table<AttendanceRecord>
          rowKey="id"
          columns={columns}
          dataSource={records}
          pagination={false}
          size="small"
          scroll={{ y: 480 }}
        />
      </Spin>
    </Card>
  );
}
