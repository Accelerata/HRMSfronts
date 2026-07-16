/**
 * 薪资报表 API
 *
 * 按 API 文档 18.13-18.15：
 *   18.13 GET /salary/reports/trend        — 薪资月度趋势报表
 *   18.14 GET /salary/reports/dept-cost    — 部门成本分布报表
 *   18.15 GET /salary/reports/composition  — 薪资构成占比报表
 */

import { get } from '@/utils/request';

// ======================== 类型定义 ========================

/** 月度趋势数据项 */
export interface TrendItem {
  yearMonth: string;
  grossTotal: number;
  netTotal: number;
  employeeCount: number;
}

/** 部门成本数据项 */
export interface DeptCostItem {
  deptId: number;
  deptName: string;
  grossTotal: number;
  netTotal: number;
  employeeCount: number;
  percentage: number;
}

/** 薪资构成数据 */
export interface CompositionData {
  baseSalary: number;
  bonus: number;
  overtime: number;
  allowance: number;
  socialInsurance: number;
  housingFund: number;
  incomeTax: number;
}

// ======================== API 方法 ========================

/**
 * 薪资月度趋势报表
 * GET /api/v1/salary/reports/trend
 */
export async function getTrend(): Promise<TrendItem[]> {
  return get<TrendItem[]>('/salary/reports/trend');
}

/**
 * 部门成本分布报表
 * GET /api/v1/salary/reports/dept-cost?year=&month=
 */
export async function getDeptCost(year: number, month: number): Promise<DeptCostItem[]> {
  return get<DeptCostItem[]>('/salary/reports/dept-cost', { year, month });
}

/**
 * 薪资构成占比报表
 * GET /api/v1/salary/reports/composition?year=&month=
 */
export async function getComposition(
  year: number,
  month: number,
): Promise<CompositionData> {
  return get<CompositionData>('/salary/reports/composition', { year, month });
}
