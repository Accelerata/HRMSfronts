/**
 * 打卡签到页面
 *
 * 按 spec: attendance-punch — 打卡按钮、当前时间大屏展示、今日打卡状态
 * API: POST /attendance/punch-in, POST /attendance/punch-out
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Select, Space, Descriptions, Tag, message, Spin } from 'antd';
import { ClockCircleOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import { getGroups, punchIn, punchOut, getRecords } from '@/services/attendance';
import type { AttendanceGroup } from '@/services/attendance';
import type { AttendanceRecord } from '@/services/attendance';
import { ATTENDANCE_GROUP_TYPE_MAP } from '@/utils/constants';
import dayjs from 'dayjs';

export default function PunchPage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const employeeId = currentUser?.employeeId;

  // 当前时间
  const [now, setNow] = useState(dayjs());

  // 考勤组
  const [groups, setGroups] = useState<AttendanceGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>();
  const [groupsLoading, setGroupsLoading] = useState(false);

  // 今日打卡记录
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);

  // 打卡中
  const [punching, setPunching] = useState(false);

  // 每秒更新时间
  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 加载考勤组列表
  useEffect(() => {
    setGroupsLoading(true);
    getGroups()
      .then((list) => {
        setGroups(list);
        if (list.length > 0) setSelectedGroupId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setGroupsLoading(false));
  }, []);

  // 查询今日打卡记录
  const fetchTodayRecord = useCallback(async () => {
    if (!employeeId || !selectedGroupId) return;
    setRecordLoading(true);
    try {
      const result = await getRecords(employeeId, 1, 31);
      const today = dayjs().format('YYYY-MM-DD');
      const todayRec = result.list?.find((r) => r.punchDate === today);
      setTodayRecord(todayRec || null);
    } catch {
      setTodayRecord(null);
    } finally {
      setRecordLoading(false);
    }
  }, [employeeId, selectedGroupId]);

  useEffect(() => {
    fetchTodayRecord();
  }, [fetchTodayRecord]);

  // 上班打卡
  const handlePunchIn = async () => {
    if (!employeeId || !selectedGroupId) {
      message.warning('请先选择考勤组');
      return;
    }
    setPunching(true);
    try {
      const result = await punchIn({
        employeeId,
        groupId: selectedGroupId,
        punchTime: dayjs().format('HH:mm:ss'),
      });
      setTodayRecord(result);
      message.success(`打卡成功！${result.lateMinutes > 0 ? `迟到 ${result.lateMinutes} 分钟` : '状态：正常'}`);
    } catch {
      // error handled by interceptor
    } finally {
      setPunching(false);
    }
  };

  // 下班打卡
  const handlePunchOut = async () => {
    if (!employeeId || !selectedGroupId) {
      message.warning('请先选择考勤组');
      return;
    }
    setPunching(true);
    try {
      const result = await punchOut({
        employeeId,
        groupId: selectedGroupId,
        punchTime: dayjs().format('HH:mm:ss'),
      });
      setTodayRecord(result);
      message.success('下班打卡成功！');
    } catch {
      // error handled by interceptor
    } finally {
      setPunching(false);
    }
  };

  // 打卡状态标签
  const statusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      NORMAL: { color: 'green', text: '正常' },
      LATE: { color: 'orange', text: '迟到' },
      EARLY: { color: 'orange', text: '早退' },
      ABSENT: { color: 'red', text: '旷工' },
      MISSING: { color: 'red', text: '缺卡' },
    };
    const info = map[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const hasPunchedIn = todayRecord?.punchInTime;
  const hasPunchedOut = todayRecord?.punchOutTime;

  return (
    <div style={{ padding: 24 }}>
      {/* 当前时间大屏 */}
      <Card
        style={{ textAlign: 'center', marginBottom: 24 }}
        bodyStyle={{ padding: '48px 24px' }}
      >
        <ClockCircleOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
        <div style={{ fontSize: 64, fontFamily: 'monospace', fontWeight: 700, lineHeight: 1.2 }}>
          {now.format('HH:mm:ss')}
        </div>
        <div style={{ fontSize: 20, color: '#666', marginTop: 8 }}>
          {now.format('YYYY-MM-DD dddd')}
        </div>
      </Card>

      {/* 考勤组选择 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <span>考勤组：</span>
          {groupsLoading ? (
            <Spin size="small" />
          ) : (
            <Select
              value={selectedGroupId}
              onChange={(v) => setSelectedGroupId(v)}
              style={{ width: 240 }}
              options={groups.map((g) => ({
                value: g.id,
                label: `${g.groupName} (${ATTENDANCE_GROUP_TYPE_MAP[g.groupType] || '--'})`,
              }))}
            />
          )}
        </Space>
      </Card>

      {/* 打卡按钮区 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48 }}>
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              onClick={handlePunchIn}
              loading={punching}
              disabled={!!hasPunchedIn || !selectedGroupId}
              style={{ width: 160, height: 64, fontSize: 18 }}
            >
              上班打卡
            </Button>
            <div style={{ marginTop: 8, color: '#999' }}>
              {hasPunchedIn ? todayRecord?.punchInTime : '尚未打卡'}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<LogoutOutlined />}
              onClick={handlePunchOut}
              loading={punching}
              disabled={!hasPunchedIn || !!hasPunchedOut || !selectedGroupId}
              style={{ width: 160, height: 64, fontSize: 18, background: '#52c41a', borderColor: '#52c41a' }}
            >
              下班打卡
            </Button>
            <div style={{ marginTop: 8, color: '#999' }}>
              {hasPunchedOut ? todayRecord?.punchOutTime : '尚未打卡'}
            </div>
          </div>
        </div>
      </Card>

      {/* 今日打卡详情 */}
      <Card title="今日打卡状态" loading={recordLoading}>
        {todayRecord ? (
          <Descriptions column={3} bordered size="small">
            <Descriptions.Item label="打卡日期">{todayRecord.punchDate}</Descriptions.Item>
            <Descriptions.Item label="上班时间">{todayRecord.punchInTime || '--'}</Descriptions.Item>
            <Descriptions.Item label="下班时间">{todayRecord.punchOutTime || '--'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {statusTag(todayRecord.status)}
            </Descriptions.Item>
            <Descriptions.Item label="迟到(分钟)">
              {todayRecord.lateMinutes > 0 ? (
                <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{todayRecord.lateMinutes}</span>
              ) : '0'}
            </Descriptions.Item>
            <Descriptions.Item label="早退(分钟)">
              {(todayRecord.earlyMinutes ?? 0) > 0 ? (
                <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{todayRecord.earlyMinutes}</span>
              ) : '0'}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
            暂无今日打卡记录
          </div>
        )}
      </Card>
    </div>
  );
}
