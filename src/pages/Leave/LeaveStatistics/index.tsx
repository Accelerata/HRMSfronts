/**
 * 请假统计页面
 *
 * 按 spec: leave-statistics
 *   - 个人请假统计：StatCard 展示各类假期天数
 *   - 部门请假率统计：请假人数/总人数 + 请假率
 *   - 请假类型分布 AntV 饼图
 *
 * API:
 *   GET /leave/stats/personal/{employeeId}
 *   GET /leave/stats/dept/{deptId}
 *   GET /leave/stats/type-distribution
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Space,
  Spin,
  Empty,
  Tabs,
  Tag,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  PieChartOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import {
  getPersonalLeaveStats,
  getDeptLeaveStats,
  getTypeDistribution,
} from '@/services/leave-statistics';
import type {
  PersonalLeaveStats,
  DeptLeaveStats,
  LeaveTypeDistribution,
} from '@/services/leave-statistics';
import { getTree } from '@/services/dept';
import type { DeptNode } from '@/services/dept';
import dayjs from 'dayjs';
import { Pie } from '@ant-design/charts';

export default function LeaveStatisticsPage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const [activeTab, setActiveTab] = useState('personal');

  // ---- 公共筛选 ----
  const now = dayjs();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = now.year() - 2 + i;
    return { value: y, label: `${y}年` };
  });
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`,
  }));

  // ---- 个人统计 ----
  const [personal, setPersonal] = useState<PersonalLeaveStats | null>(null);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalEmployeeId, setPersonalEmployeeId] = useState<number | undefined>(
    currentUser?.employeeId,
  );
  const [personalYear, setPersonalYear] = useState(now.year());
  const [personalMonth, setPersonalMonth] = useState(now.month() + 1);

  const fetchPersonal = useCallback(async () => {
    if (!personalEmployeeId) return;
    setPersonalLoading(true);
    try {
      const result = await getPersonalLeaveStats(personalEmployeeId, personalYear, personalMonth);
      setPersonal(result);
    } catch {
      setPersonal(null);
    } finally {
      setPersonalLoading(false);
    }
  }, [personalEmployeeId, personalYear, personalMonth]);

  // ---- 部门统计 ----
  const [depts, setDepts] = useState<DeptNode[]>([]);
  const [deptStats, setDeptStats] = useState<DeptLeaveStats | null>(null);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptId, setDeptId] = useState<number | undefined>();
  const [deptYear, setDeptYear] = useState(now.year());
  const [deptMonth, setDeptMonth] = useState(now.month() + 1);

  useEffect(() => {
    getTree().then(setDepts).catch(() => {});
  }, []);

  const flattenDepts = (nodes: DeptNode[], prefix = ''): { value: number; label: string }[] => {
    return nodes.flatMap((n) => [
      { value: n.id, label: prefix + n.deptName },
      ...flattenDepts(n.children || [], prefix + '　'),
    ]);
  };

  const fetchDept = useCallback(async () => {
    if (!deptId) return;
    setDeptLoading(true);
    try {
      const result = await getDeptLeaveStats(deptId, deptYear, deptMonth);
      setDeptStats(result);
    } catch {
      setDeptStats(null);
    } finally {
      setDeptLoading(false);
    }
  }, [deptId, deptYear, deptMonth]);

  // ---- 类型分布 ----
  const [distribution, setDistribution] = useState<LeaveTypeDistribution[]>([]);
  const [distLoading, setDistLoading] = useState(false);
  const [distYear, setDistYear] = useState(now.year());
  const [distMonth, setDistMonth] = useState(now.month() + 1);
  const [distDeptId, setDistDeptId] = useState<number | undefined>();

  const fetchDistribution = useCallback(async () => {
    setDistLoading(true);
    try {
      const result = await getTypeDistribution(distYear, distMonth, distDeptId);
      setDistribution(result);
    } catch {
      setDistribution([]);
    } finally {
      setDistLoading(false);
    }
  }, [distYear, distMonth, distDeptId]);

  // 饼图配置
  const pieConfig = {
    data: distribution.map((d) => ({
      type: d.leaveTypeName,
      value: d.totalDays,
    })),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      text: (d: { type: string; value: number }) => `${d.type}\n${d.value}天`,
      style: { fontSize: 12 },
    },
    legend: {
      color: { position: 'bottom' as const, layout: 'horizontal' as const },
    },
    statistic: {
      title: { content: '总天数', style: { fontSize: 14 } },
      content: {
        style: { fontSize: 20 },
        content: `${distribution.reduce((s, d) => s + d.totalDays, 0)}天`,
      },
    },
    height: 360,
    tooltip: { channel: 'y' as const, valueFormatter: (v: number) => `${v} 天` },
  };

  // ---- 渲染 ----

  /** 个人请假统计视图 */
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
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="请假总天数"
                  value={personal.totalLeaveDays}
                  precision={0.5}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>

            {/* 按类型细分 */}
            <Col span={6}>
              <Card size="small" style={{ borderTop: '2px solid #1677ff' }}>
                <Statistic
                  title="年假"
                  value={personal.annualLeaveDays}
                  precision={0.5}
                  suffix="天"
                  valueStyle={{ fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ borderTop: '2px solid #52c41a' }}>
                <Statistic
                  title="病假"
                  value={personal.sickLeaveDays}
                  precision={0.5}
                  suffix="天"
                  valueStyle={{ fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ borderTop: '2px solid #faad14' }}>
                <Statistic
                  title="事假"
                  value={personal.personalLeaveDays}
                  precision={0.5}
                  suffix="天"
                  valueStyle={{ fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ borderTop: '2px solid #999' }}>
                <Statistic
                  title="其他"
                  value={personal.otherLeaveDays}
                  precision={0.5}
                  suffix="天"
                  valueStyle={{ fontSize: 24 }}
                />
              </Card>
            </Col>
          </Row>
        ) : (
          <Empty description="请选择员工并点击查询" />
        )}
      </Spin>
    </div>
  );

  /** 部门请假率统计视图 */
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
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="部门总人数"
                  value={deptStats.totalEmployees}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="请假人数"
                  value={deptStats.leaveEmployeeCount}
                  prefix={<UserOutlined />}
                  valueStyle={{
                    color: deptStats.leaveEmployeeCount > 5 ? '#faad14' : '#52c41a',
                  }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="请假总天数"
                  value={deptStats.totalLeaveDays}
                  precision={0.5}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="请假率"
                  value={(deptStats.leaveRate * 100).toFixed(2)}
                  suffix="%"
                  prefix={<PercentageOutlined />}
                  valueStyle={{
                    color: deptStats.leaveRate > 0.05 ? '#ff4d4f' : deptStats.leaveRate > 0.02 ? '#faad14' : '#52c41a',
                  }}
                />
                <Tag
                  color={
                    deptStats.leaveRate > 0.05
                      ? 'red'
                      : deptStats.leaveRate > 0.02
                      ? 'orange'
                      : 'green'
                  }
                  style={{ marginTop: 8 }}
                >
                  {deptStats.leaveRate > 0.05 ? '偏高' : deptStats.leaveRate > 0.02 ? '正常' : '良好'}
                </Tag>
              </Card>
            </Col>
          </Row>
        ) : (
          <Empty description="请选择部门并点击查询" />
        )}
      </Spin>
    </div>
  );

  /** 请假类型分布视图 */
  const distributionView = (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <span>年份：</span>
        <Select value={distYear} onChange={setDistYear} options={yearOptions} />
        <span>月份：</span>
        <Select value={distMonth} onChange={setDistMonth} options={monthOptions} />
        <span>部门（可选）：</span>
        <Select
          showSearch
          allowClear
          value={distDeptId}
          onChange={(v) => setDistDeptId(v)}
          placeholder="全部部门"
          style={{ width: 200 }}
          options={flattenDepts(depts)}
          filterOption={(input, option) =>
            (option?.label as string)?.includes(input)
          }
        />
        <a onClick={fetchDistribution}>查询</a>
      </Space>

      <Spin spinning={distLoading}>
        {distribution.length > 0 ? (
          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <Card title="请假类型分布">
                <Pie {...pieConfig} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="明细">
                {distribution.map((d) => (
                  <div
                    key={d.leaveType}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <span>
                      <Tag>{d.leaveTypeName}</Tag>
                    </span>
                    <span style={{ fontSize: 13, color: '#666' }}>
                      <strong>{d.totalDays}</strong> 天 · {d.count} 人次
                    </span>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        ) : (
          <Empty description="请选择查询条件并点击查询" />
        )}
      </Spin>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <>
            <BarChartOutlined style={{ marginRight: 8 }} />
            请假统计
          </>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'personal', label: '个人统计', children: personalView },
            { key: 'dept', label: '部门统计', children: deptView },
            { key: 'distribution', label: '类型分布', children: distributionView },
          ]}
        />
      </Card>
    </div>
  );
}
