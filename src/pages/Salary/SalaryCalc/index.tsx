/**
 * 薪资核算页面
 *
 * 按 spec: salary-calc
 *   - 单人薪资核算：选择员工→选择年月→点击"核算"→展示薪资明细
 *   - 批量薪资核算：选择年月→选择部门(可选)→点击"批量核算"→展示处理人数
 *
 * API: services/salary.ts
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Card, Row, Col, Select, Button, Descriptions, Statistic, message, Spin, Space,
  DatePicker, Divider, Tag, Alert,
} from 'antd';
import {
  CalculatorOutlined, TeamOutlined, DollarOutlined,
  PercentageOutlined, BankOutlined,
} from '@ant-design/icons';
import { calculate, batchCalc } from '@/services/salary';
import type { SalaryDetail } from '@/services/salary';
import { getList as getEmployeeList } from '@/services/employee';
import type { Employee } from '@/services/employee';
import { getTree as getDeptTree } from '@/services/dept';
import type { DeptNode } from '@/services/dept';
import dayjs, { Dayjs } from 'dayjs';

/** 将数字格式化为货币显示 */
function formatMoney(val: number | undefined | null): string {
  if (val === undefined || val === null) return '--';
  return `¥ ${val.toFixed(2)}`;
}

export default function SalaryCalcPage() {
  // ===== 单人核算 =====
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>();
  const [calcYear, setCalcYear] = useState(dayjs().year());
  const [calcMonth, setCalcMonth] = useState(dayjs().month() + 1);
  const [calculating, setCalculating] = useState(false);
  const [salaryDetail, setSalaryDetail] = useState<SalaryDetail | null>(null);

  // ===== 批量核算 =====
  const [depts, setDepts] = useState<DeptNode[]>([]);
  const [batchYear, setBatchYear] = useState(dayjs().year());
  const [batchMonth, setBatchMonth] = useState(dayjs().month() + 1);
  const [batchDeptId, setBatchDeptId] = useState<number | undefined | null>(undefined);
  const [batchCalcing, setBatchCalcing] = useState(false);
  const [batchResult, setBatchResult] = useState<number | null>(null);

  // 加载员工列表
  useEffect(() => {
    setEmpLoading(true);
    getEmployeeList({ page: 1, size: 9999 })
      .then((res) => {
        const list = res.records || res.list || [];
        setEmployees(list);
      })
      .catch(() => {})
      .finally(() => setEmpLoading(false));
  }, []);

  // 加载部门树
  useEffect(() => {
    getDeptTree()
      .then(setDepts)
      .catch(() => {});
  }, []);

  // 单人核算
  const handleSingleCalc = useCallback(async () => {
    if (!selectedEmployeeId) {
      message.warning('请先选择员工');
      return;
    }
    setCalculating(true);
    setSalaryDetail(null);
    try {
      const result = await calculate(selectedEmployeeId, calcYear, calcMonth);
      setSalaryDetail(result);
      message.success('核算完成');
    } catch {
      // error handled by interceptor
    } finally {
      setCalculating(false);
    }
  }, [selectedEmployeeId, calcYear, calcMonth]);

  // 批量核算
  const handleBatchCalc = useCallback(async () => {
    setBatchCalcing(true);
    setBatchResult(null);
    try {
      const count = await batchCalc(batchYear, batchMonth, batchDeptId ?? null);
      setBatchResult(count);
      message.success(`批量核算完成，共处理 ${count} 人`);
    } catch {
      // error handled by interceptor
    } finally {
      setBatchCalcing(false);
    }
  }, [batchYear, batchMonth, batchDeptId]);

  // 扁平化部门（用于 Select options）
  const flattenDepts = (nodes: DeptNode[], prefix = ''): { value: number; label: string }[] => {
    let result: { value: number; label: string }[] = [];
    for (const node of nodes) {
      result.push({ value: node.id, label: prefix + node.deptName });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenDepts(node.children, prefix + '　'));
      }
    }
    return result;
  };

  const yearOptions = Array.from({ length: 3 }, (_, i) => {
    const y = dayjs().year() - 1 + i;
    return { value: y, label: `${y}年` };
  });
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`,
  }));

  return (
    <div style={{ padding: 24 }}>
      {/* ===== 单人薪资核算 ===== */}
      <Card
        title={
          <>
            <CalculatorOutlined style={{ marginRight: 8 }} />
            单人薪资核算
          </>
        }
        style={{ marginBottom: 24 }}
      >
        <Space wrap size="middle" style={{ marginBottom: 16 }}>
          <Select
            showSearch
            placeholder="选择员工"
            loading={empLoading}
            value={selectedEmployeeId}
            onChange={setSelectedEmployeeId}
            style={{ width: 240 }}
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            options={employees.map((e) => ({
              value: e.id,
              label: `${e.name} (${e.employeeNo})`,
            }))}
          />
          <Select
            value={calcYear}
            onChange={setCalcYear}
            style={{ width: 100 }}
            options={yearOptions}
          />
          <Select
            value={calcMonth}
            onChange={setCalcMonth}
            style={{ width: 90 }}
            options={monthOptions}
          />
          <Button
            type="primary"
            icon={<CalculatorOutlined />}
            loading={calculating}
            onClick={handleSingleCalc}
            disabled={!selectedEmployeeId}
          >
            核算
          </Button>
        </Space>

        {calculating && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin tip="正在核算..." />
          </div>
        )}

        {salaryDetail && !calculating && (
          <div>
            <Descriptions
              title={`${salaryDetail.employeeName} — ${salaryDetail.year}年${salaryDetail.month}月薪资明细`}
              bordered
              column={{ xs: 1, sm: 2, md: 3 }}
              size="small"
            >
              <Descriptions.Item label="基本工资">
                {formatMoney(salaryDetail.baseSalary)}
              </Descriptions.Item>
              <Descriptions.Item label="考勤扣款">
                <span style={{ color: salaryDetail.attendanceDeduction > 0 ? '#ff4d4f' : undefined }}>
                  {formatMoney(salaryDetail.attendanceDeduction)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="请假扣款">
                <span style={{ color: salaryDetail.leaveDeduction > 0 ? '#ff4d4f' : undefined }}>
                  {formatMoney(salaryDetail.leaveDeduction)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="加班费">
                {formatMoney(salaryDetail.overtimePay)}
              </Descriptions.Item>
              <Descriptions.Item label="奖金合计">
                {formatMoney(salaryDetail.bonusTotal)}
              </Descriptions.Item>
              <Descriptions.Item label="社保">
                {formatMoney(salaryDetail.socialInsurance)}
              </Descriptions.Item>
              <Descriptions.Item label="公积金">
                {formatMoney(salaryDetail.housingFund)}
              </Descriptions.Item>
              <Descriptions.Item label="应纳税所得额">
                {formatMoney(salaryDetail.taxableIncome)}
              </Descriptions.Item>
              <Descriptions.Item label="个人所得税">
                {formatMoney(salaryDetail.incomeTax)}
              </Descriptions.Item>
              <Descriptions.Item label="应发工资">
                <span style={{ fontWeight: 600, fontSize: 15 }}>
                  {formatMoney(salaryDetail.grossPay)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="实发工资">
                <span style={{ fontWeight: 700, fontSize: 16, color: '#1677ff' }}>
                  {formatMoney(salaryDetail.netPay)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Card>

      {/* ===== 批量薪资核算 ===== */}
      <Card
        title={
          <>
            <TeamOutlined style={{ marginRight: 8 }} />
            批量薪资核算
          </>
        }
      >
        <Space wrap size="middle" style={{ marginBottom: 16 }}>
          <Select
            value={batchYear}
            onChange={setBatchYear}
            style={{ width: 100 }}
            options={yearOptions}
          />
          <Select
            value={batchMonth}
            onChange={setBatchMonth}
            style={{ width: 90 }}
            options={monthOptions}
          />
          <Select
            allowClear
            placeholder="全部部门"
            value={batchDeptId}
            onChange={(v) => setBatchDeptId(v ?? null)}
            style={{ width: 200 }}
            options={flattenDepts(depts)}
          />
          <Button
            type="primary"
            icon={<TeamOutlined />}
            loading={batchCalcing}
            onClick={handleBatchCalc}
          >
            批量核算
          </Button>
        </Space>

        {batchResult !== null && (
          <Alert
            type="success"
            showIcon
            message={`批量核算完成，共处理 ${batchResult} 名员工`}
            closable
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    </div>
  );
}
