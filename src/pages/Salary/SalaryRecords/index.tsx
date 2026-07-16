/**
 * 薪资记录查询页面
 *
 * 按 spec: salary-calc
 *   - 薪资记录查询（员工筛选 + 年月筛选）
 *   - 年度薪资记录 AntV 折线图（netPay 趋势）
 *
 * API: services/salary.ts
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Card, Table, Select, Space, Button, message, Row, Col, Empty, Spin, Tabs,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined, LineChartOutlined, TableOutlined,
} from '@ant-design/icons';
import { getRecords, getYearly } from '@/services/salary';
import type { SalaryRecord, YearlySalaryItem } from '@/services/salary';
import { getList as getEmployeeList } from '@/services/employee';
import type { Employee } from '@/services/employee';
import dayjs from 'dayjs';
import { Line } from '@ant-design/charts';

/** 格式化金额 */
function fmt(val: number | undefined | null): string {
  if (val == null) return '--';
  return val.toFixed(2);
}

export default function SalaryRecordsPage() {
  // ===== 查询条件 =====
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | undefined>();
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);

  // ===== 记录列表 =====
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // ===== 年度图表 =====
  const [yearlyData, setYearlyData] = useState<YearlySalaryItem[]>([]);
  const [yearlyLoading, setYearlyLoading] = useState(false);
  const [chartEmployeeId, setChartEmployeeId] = useState<number | undefined>();
  const [chartYear, setChartYear] = useState(dayjs().year());

  // ===== Tab =====
  const [activeTab, setActiveTab] = useState('records');

  // 加载员工列表
  useEffect(() => {
    setEmpLoading(true);
    getEmployeeList({ page: 1, size: 9999 })
      .then((res) => {
        setEmployees(res.records || res.list || []);
      })
      .catch(() => {})
      .finally(() => setEmpLoading(false));
  }, []);

  const yearOptions = Array.from({ length: 3 }, (_, i) => {
    const y = dayjs().year() - 1 + i;
    return { value: y, label: `${y}年` };
  });
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`,
  }));

  // 查询薪资记录
  const handleSearch = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const result = await getRecords({ employeeId, year, month, page: 1, size: 100 });
      setRecords(result.records || result.list || []);
      setTotal(result.total);
    } catch {
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, [employeeId, year, month]);

  // 查询年度薪资
  const handleYearlySearch = useCallback(async () => {
    if (!chartEmployeeId) {
      message.warning('请先选择员工');
      return;
    }
    setYearlyLoading(true);
    try {
      const data = await getYearly(chartEmployeeId, chartYear);
      setYearlyData(data);
    } catch {
      setYearlyData([]);
    } finally {
      setYearlyLoading(false);
    }
  }, [chartEmployeeId, chartYear]);

  const columns: ColumnsType<SalaryRecord> = [
    { title: '工号', dataIndex: 'employeeNo', width: 110 },
    { title: '姓名', dataIndex: 'employeeName', width: 100 },
    { title: '部门', dataIndex: 'deptName', width: 120 },
    { title: '年月', width: 80, render: (_, r) => `${r.year}-${String(r.month).padStart(2, '0')}` },
    { title: '基本工资', dataIndex: 'baseSalary', width: 110, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '考勤扣款', dataIndex: 'attendanceDeduction', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '请假扣款', dataIndex: 'leaveDeduction', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '加班费', dataIndex: 'overtimePay', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '奖金', dataIndex: 'bonusTotal', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '社保', dataIndex: 'socialInsurance', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '公积金', dataIndex: 'housingFund', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '个税', dataIndex: 'incomeTax', width: 100, align: 'right', render: (v) => `¥ ${fmt(v)}` },
    { title: '应发', dataIndex: 'grossPay', width: 110, align: 'right', render: (v) => <span style={{ fontWeight: 600 }}>¥ {fmt(v)}</span> },
    { title: '实发', dataIndex: 'netPay', width: 110, align: 'right', render: (v) => <b style={{ color: '#1677ff' }}>¥ {fmt(v)}</b> },
  ];

  // 年度趋势折线图配置
  const lineConfig = yearlyData.length > 0 ? {
    data: yearlyData.map((item) => ({
      month: item.yearMonth,
      netPay: item.netPay,
      grossPay: item.grossPay,
    })),
    xField: 'month',
    yField: 'netPay',
    seriesField: 'type',
    smooth: true,
    point: { size: 5, shape: 'circle' },
    label: {
      style: { fill: '#333', fontSize: 12 },
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type === 'grossPay' ? '应发' : '实发',
        value: `¥ ${(datum.netPay || datum.grossPay || 0).toFixed(2)}`,
      }),
    },
    yAxis: {
      label: {
        formatter: (v: string) => `¥ ${(Number(v) / 10000).toFixed(1)}万`,
      },
    },
    color: ['#52c41a', '#1677ff'],
    height: 400,
  } : null;

  return (
    <div style={{ padding: 24 }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'records',
            label: (
              <span>
                <TableOutlined /> 薪资记录查询
              </span>
            ),
            children: (
              <Card>
                <Space wrap size="middle" style={{ marginBottom: 16 }}>
                  <Select
                    allowClear
                    showSearch
                    placeholder="选择员工"
                    loading={empLoading}
                    value={employeeId}
                    onChange={setEmployeeId}
                    style={{ width: 220 }}
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    options={employees.map((e) => ({
                      value: e.id,
                      label: `${e.name} (${e.employeeNo})`,
                    }))}
                  />
                  <Select value={year} onChange={setYear} style={{ width: 100 }} options={yearOptions} />
                  <Select value={month} onChange={setMonth} style={{ width: 90 }} options={monthOptions} />
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={recordsLoading}>
                    查询
                  </Button>
                </Space>

                <Table<SalaryRecord>
                  rowKey="id"
                  columns={columns}
                  dataSource={records}
                  loading={recordsLoading}
                  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
                  scroll={{ x: 1600 }}
                  size="small"
                />
              </Card>
            ),
          },
          {
            key: 'yearly',
            label: (
              <span>
                <LineChartOutlined /> 年度薪资趋势
              </span>
            ),
            children: (
              <Card>
                <Space wrap size="middle" style={{ marginBottom: 16 }}>
                  <Select
                    showSearch
                    placeholder="选择员工"
                    loading={empLoading}
                    value={chartEmployeeId}
                    onChange={setChartEmployeeId}
                    style={{ width: 220 }}
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    options={employees.map((e) => ({
                      value: e.id,
                      label: `${e.name} (${e.employeeNo})`,
                    }))}
                  />
                  <Select value={chartYear} onChange={setChartYear} style={{ width: 100 }} options={yearOptions} />
                  <Button type="primary" icon={<LineChartOutlined />} onClick={handleYearlySearch} loading={yearlyLoading}>
                    查询
                  </Button>
                </Space>

                <Spin spinning={yearlyLoading}>
                  {yearlyData.length > 0 ? (
                    <Line {...lineConfig} />
                  ) : (
                    <Empty description="请选择员工后查询年度薪资趋势" />
                  )}
                </Spin>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
