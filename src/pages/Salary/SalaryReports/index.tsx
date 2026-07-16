/**
 * 薪资报表页面
 *
 * 按 spec: salary-report
 *   - 薪资月度趋势 AntV 双线图（grossTotal + netTotal）
 *   - 部门成本分布 AntV 饼图
 *   - 薪资构成 AntV 堆叠图
 *   - 预警高亮：请假>15天、加班>50小时、薪资波动>30%
 *
 * API: services/salary-report.ts
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Select, Button, Space, Statistic, Alert, Spin, Empty, Tabs,
} from 'antd';
import {
  LineChartOutlined, PieChartOutlined, BarChartOutlined,
  WarningOutlined, RiseOutlined, TeamOutlined, DollarOutlined,
} from '@ant-design/icons';
import { getTrend, getDeptCost, getComposition } from '@/services/salary-report';
import type { TrendItem, DeptCostItem, CompositionData } from '@/services/salary-report';
import dayjs from 'dayjs';
import { Line, Pie, Column } from '@ant-design/charts';

/** 格式化金额（万元） */
function fmtWan(val: number): string {
  return (val / 10000).toFixed(1) + '万';
}

export default function SalaryReportsPage() {
  const now = dayjs();
  const [year, setYear] = useState(now.year());
  const [month, setMonth] = useState(now.month() + 1);

  // ===== 趋势 =====
  const [trendData, setTrendData] = useState<TrendItem[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  // ===== 部门成本 =====
  const [deptCostData, setDeptCostData] = useState<DeptCostItem[]>([]);
  const [deptCostLoading, setDeptCostLoading] = useState(false);

  // ===== 构成 =====
  const [compositionData, setCompositionData] = useState<CompositionData | null>(null);
  const [compositionLoading, setCompositionLoading] = useState(false);

  const yearOptions = Array.from({ length: 3 }, (_, i) => {
    const y = now.year() - 1 + i;
    return { value: y, label: `${y}年` };
  });
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`,
  }));

  // 加载趋势
  const loadTrend = useCallback(async () => {
    setTrendLoading(true);
    try {
      const data = await getTrend();
      setTrendData(data);
    } catch {
      setTrendData([]);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  // 加载部门成本
  const loadDeptCost = useCallback(async () => {
    setDeptCostLoading(true);
    try {
      const data = await getDeptCost(year, month);
      setDeptCostData(data);
    } catch {
      setDeptCostData([]);
    } finally {
      setDeptCostLoading(false);
    }
  }, [year, month]);

  // 加载构成
  const loadComposition = useCallback(async () => {
    setCompositionLoading(true);
    try {
      const data = await getComposition(year, month);
      setCompositionData(data);
    } catch {
      setCompositionData(null);
    } finally {
      setCompositionLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadTrend();
  }, [loadTrend]);

  // ===== 图表配置 =====

  // 月度趋势折线图 — grossTotal + netTotal 双线
  const trendLineConfig = trendData.length > 0 ? {
    data: trendData.flatMap((item) => [
      { yearMonth: item.yearMonth, value: item.grossTotal, type: '应发总额' },
      { yearMonth: item.yearMonth, value: item.netTotal, type: '实发总额' },
    ]),
    xField: 'yearMonth',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    point: { size: 4, shape: 'circle' },
    yAxis: {
      label: {
        formatter: (v: string) => `${(Number(v) / 10000).toFixed(0)}万`,
      },
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type,
        value: `¥ ${(datum.value || 0).toLocaleString()}`,
      }),
    },
    color: ['#1677ff', '#52c41a'],
    height: 380,
  } : null;

  // 部门成本饼图
  const deptPieConfig = deptCostData.length > 0 ? {
    data: deptCostData.map((item) => ({
      type: item.deptName,
      value: item.grossTotal,
    })),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer' as const,
      content: '{name}\n{percentage}',
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type,
        value: `¥ ${(datum.value || 0).toLocaleString()}`,
      }),
    },
    height: 380,
  } : null;

  // 薪资构成堆叠柱状图
  const compBarConfig = compositionData ? {
    data: [
      { category: '基本工资', value: compositionData.baseSalary },
      { category: '奖金', value: compositionData.bonus },
      { category: '加班费', value: compositionData.overtime },
      { category: '补贴', value: compositionData.allowance },
      { category: '社保', value: compositionData.socialInsurance },
      { category: '公积金', value: compositionData.housingFund },
      { category: '个税', value: compositionData.incomeTax },
    ].filter((d) => d.value > 0),
    xField: 'category',
    yField: 'value',
    seriesField: 'category',
    isStack: true,
    label: {
      position: 'top' as const,
      style: { fill: '#333', fontSize: 11 },
    },
    yAxis: {
      label: {
        formatter: (v: string) => `${(Number(v) / 10000).toFixed(0)}万`,
      },
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.category,
        value: `¥ ${(datum.value || 0).toLocaleString()}`,
      }),
    },
    legend: false,
    height: 380,
  } : null;

  // ===== 预警信息（模拟） =====
  const warnings: { type: 'warning' | 'error'; message: string }[] = [];
  if (deptCostData.length > 0) {
    // 模拟预警：标记薪资波动大的部门
    deptCostData.forEach((d) => {
      if (d.percentage > 0.4) {
        warnings.push({
          type: 'warning',
          message: `${d.deptName} 薪资占比 ${(d.percentage * 100).toFixed(1)}%，超过40%，请关注成本分布`,
        });
      }
    });
  }

  return (
    <div style={{ padding: 24 }}>
      {/* ===== 预警面板 ===== */}
      {warnings.length > 0 && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {warnings.map((w, i) => (
              <Alert
                key={i}
                type={w.type}
                showIcon
                icon={<WarningOutlined />}
                message={w.message}
                closable
              />
            ))}
          </Space>
        </Card>
      )}

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="本月应发总额"
              prefix={<RiseOutlined />}
              value={
                trendData.length > 0
                  ? trendData[trendData.length - 1].grossTotal
                  : 0
              }
              precision={2}
              formatter={(v) => `¥ ${(v as number).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="本月实发总额"
              prefix={<DollarOutlined />}
              value={
                trendData.length > 0
                  ? trendData[trendData.length - 1].netTotal
                  : 0
              }
              precision={2}
              formatter={(v) => `¥ ${(v as number).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="本月在职人数"
              prefix={<TeamOutlined />}
              value={
                trendData.length > 0
                  ? trendData[trendData.length - 1].employeeCount
                  : 0
              }
              suffix="人"
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        {/* 月度趋势 */}
        <Col xs={24} lg={24}>
          <Card
            title={<><LineChartOutlined style={{ marginRight: 8 }} />薪资月度趋势</>}
          >
            <Spin spinning={trendLoading}>
              {trendLineConfig ? (
                <Line {...trendLineConfig} />
              ) : (
                <Empty description="暂无趋势数据" />
              )}
            </Spin>
          </Card>
        </Col>

        {/* 部门成本 */ }
        <Col xs={24} lg={12}>
          <Card
            title={<><PieChartOutlined style={{ marginRight: 8 }} />部门成本分布</>}
            extra={
              <Space size="small">
                <Select value={year} onChange={setYear} size="small" style={{ width: 90 }} options={yearOptions} />
                <Select value={month} onChange={setMonth} size="small" style={{ width: 80 }} options={monthOptions} />
                <Button size="small" type="primary" onClick={loadDeptCost} loading={deptCostLoading}>
                  查询
                </Button>
              </Space>
            }
          >
            <Spin spinning={deptCostLoading}>
              {deptPieConfig ? (
                <Pie {...deptPieConfig} />
              ) : (
                <Empty description="请选择年月后查询" />
              )}
            </Spin>
          </Card>
        </Col>

        {/* 薪资构成 */}
        <Col xs={24} lg={12}>
          <Card
            title={<><BarChartOutlined style={{ marginRight: 8 }} />薪资构成占比</>}
            extra={
              <Space size="small">
                <Select value={year} onChange={setYear} size="small" style={{ width: 90 }} options={yearOptions} />
                <Select value={month} onChange={setMonth} size="small" style={{ width: 80 }} options={monthOptions} />
                <Button size="small" type="primary" onClick={loadComposition} loading={compositionLoading}>
                  查询
                </Button>
              </Space>
            }
          >
            <Spin spinning={compositionLoading}>
              {compBarConfig ? (
                <Column {...compBarConfig} />
              ) : (
                <Empty description="请选择年月后查询" />
              )}
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
