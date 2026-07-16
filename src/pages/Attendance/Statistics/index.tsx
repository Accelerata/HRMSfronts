/**
 * 考勤统计页面
 *
 * 按 spec: attendance-statistics — StatCard + AntV Gauge 出勤率仪表盘
 * API: GET /attendance-statistics/personal, GET /attendance-statistics/dept
 */

import { useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Space,
  Spin,
  Empty,
  Tag,
  Tabs,
} from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import {
  getPersonalStats,
  getDeptStats,
} from '@/services/attendance-statistics';
import type { PersonalStatistics, DeptStatistics } from '@/services/attendance-statistics';
import { getTree } from '@/services/dept';
import type { DeptNode } from '@/services/dept';
import { useEffect } from 'react';
import { Gauge } from '@ant-design/charts';
import dayjs, { Dayjs } from 'dayjs';

/** 出勤率仪表盘配置 */
function gaugeConfig(rate: number, title: string) {
  const percent = Math.round(rate * 100);
  return {
    percent,
    range: {
      color: ['#ff4d4f', '#faad14', '#52c41a'],
      ticks: [0, 1 / 3, 2 / 3, 1],
    },
    indicator: false as const,
    statistic: {
      title: {
        content: title,
        style: { fontSize: '14px', color: '#666' },
      },
      content: {
        style: { fontSize: '36px', fontWeight: 600 },
        content: `${percent}%`,
      },
    },
    width: 240,
    height: 240,
  };
}

export default function AttendanceStatisticsPage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const [activeTab, setActiveTab] = useState('personal');

  // 个人统计
  const [personal, setPersonal] = useState<PersonalStatistics | null>(null);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalEmployeeId, setPersonalEmployeeId] = useState<number | undefined>(
    currentUser?.employeeId,
  );
  const [personalYear, setPersonalYear] = useState(dayjs().year());
  const [personalMonth, setPersonalMonth] = useState(dayjs().month() + 1);

  // 部门统计
  const [depts, setDepts] = useState<DeptNode[]>([]);
  const [deptStats, setDeptStats] = useState<DeptStatistics | null>(null);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptId, setDeptId] = useState<number | undefined>();
  const [deptYear, setDeptYear] = useState(dayjs().year());
  const [deptMonth, setDeptMonth] = useState(dayjs().month() + 1);

  // 加载部门列表
  useEffect(() => {
    getTree().then(setDepts).catch(() => {});
  }, []);

  // 扁平化部门树为 Select options
  const flattenDepts = (nodes: DeptNode[], prefix = ''): { value: number; label: string }[] => {
    return nodes.flatMap((n) => [
      { value: n.id, label: prefix + n.deptName },
      ...flattenDepts(n.children || [], prefix + '　'),
    ]);
  };

  // 个人统计
  const fetchPersonal = useCallback(async () => {
    if (!personalEmployeeId) return;
    setPersonalLoading(true);
    try {
      const result = await getPersonalStats(personalEmployeeId, personalYear, personalMonth);
      setPersonal(result);
    } catch {
      setPersonal(null);
    } finally {
      setPersonalLoading(false);
    }
  }, [personalEmployeeId, personalYear, personalMonth]);

  // 部门统计
  const fetchDept = useCallback(async () => {
    if (!deptId) return;
    setDeptLoading(true);
    try {
      const result = await getDeptStats(deptId, deptYear, deptMonth);
      setDeptStats(result);
    } catch {
      setDeptStats(null);
    } finally {
      setDeptLoading(false);
    }
  }, [deptId, deptYear, deptMonth]);

  // 年份选项
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = dayjs().year() - 2 + i;
    return { value: y, label: `${y}年` };
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`,
  }));

  // -------- 个人统计视图 --------
  const personalView = (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <span>员工：</span>
        <Select
          showSearch
          value={personalEmployeeId}
          onChange={(v) => setPersonalEmployeeId(v)}
          placeholder="请选择员工"
          style={{ width: 200 }}
          options={[]}
        />
        <Select value={personalYear} onChange={setPersonalYear} options={yearOptions} />
        <Select value={personalMonth} onChange={setPersonalMonth} options={monthOptions} />
        <a onClick={fetchPersonal}>查询</a>
      </Space>

      <Spin spinning={personalLoading}>
        {personal ? (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="应出勤天数"
                    value={personal.totalWorkDays}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="正常天数"
                    value={personal.normalDays}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="迟到天数"
                    value={personal.lateDays}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: personal.lateDays > 0 ? '#faad14' : '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="早退天数"
                    value={personal.earlyDays}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: personal.earlyDays > 0 ? '#faad14' : '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="旷工半天数"
                    value={personal.absentHalfDays}
                    valueStyle={{ color: personal.absentHalfDays > 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="缺卡天数"
                    value={personal.missingPunchDays}
                    valueStyle={{ color: personal.missingPunchDays > 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="出勤率" style={{ textAlign: 'center' }}>
                  <Gauge {...gaugeConfig(personal.attendanceRate, '个人出勤率')} />
                  <Tag
                    color={
                      personal.attendanceRate >= 0.9
                        ? 'green'
                        : personal.attendanceRate >= 0.8
                        ? 'orange'
                        : 'red'
                    }
                    style={{ marginTop: 8, fontSize: 14 }}
                  >
                    {personal.attendanceRate >= 0.9 ? '良好' : personal.attendanceRate >= 0.8 ? '一般' : '需关注'}
                  </Tag>
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          <Empty description="请选择员工并点击查询" />
        )}
      </Spin>
    </div>
  );

  // -------- 部门统计视图 --------
  const deptView = (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <span>部门：</span>
        <Select
          showSearch
          value={deptId}
          onChange={(v) => setDeptId(v)}
          placeholder="请选择部门"
          style={{ width: 250 }}
          options={flattenDepts(depts)}
          filterOption={(input, option) =>
            (option?.label as string)?.includes(input)
          }
        />
        <Select value={deptYear} onChange={setDeptYear} options={yearOptions} />
        <Select value={deptMonth} onChange={setDeptMonth} options={monthOptions} />
        <a onClick={fetchDept}>查询</a>
      </Space>

      <Spin spinning={deptLoading}>
        {deptStats ? (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总人数"
                    value={deptStats.totalEmployees}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="打卡人数"
                    value={deptStats.recordedEmployeeCount}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="正常总天数"
                    value={deptStats.normalDays}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="迟到总天数"
                    value={deptStats.lateDays}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: deptStats.lateDays > 0 ? '#faad14' : '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="早退总天数"
                    value={deptStats.earlyDays}
                    valueStyle={{ color: deptStats.earlyDays > 0 ? '#faad14' : '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="旷工半天总数"
                    value={deptStats.absentHalfDays}
                    valueStyle={{ color: deptStats.absentHalfDays > 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="缺卡总天数"
                    value={deptStats.missingPunchDays}
                    valueStyle={{ color: deptStats.missingPunchDays > 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card title="部门出勤率" style={{ textAlign: 'center' }}>
                  <Gauge {...gaugeConfig(deptStats.deptAttendanceRate, '部门出勤率')} />
                  <Tag
                    color={
                      deptStats.deptAttendanceRate >= 0.9
                        ? 'green'
                        : deptStats.deptAttendanceRate >= 0.8
                        ? 'orange'
                        : 'red'
                    }
                    style={{ marginTop: 8, fontSize: 14 }}
                  >
                    {deptStats.deptAttendanceRate >= 0.9 ? '良好' : deptStats.deptAttendanceRate >= 0.8 ? '一般' : '需关注'}
                  </Tag>
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          <Empty description="请选择部门并点击查询" />
        )}
      </Spin>
    </div>
  );

  return (
    <Card
      title={
        <>
          <PieChartOutlined style={{ marginRight: 8 }} />
          考勤统计
        </>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'personal', label: '个人统计', children: personalView },
          { key: 'dept', label: '部门统计', children: deptView },
        ]}
      />
    </Card>
  );
}
