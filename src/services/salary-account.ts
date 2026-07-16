/**
 * 薪资账套 API
 *
 * 按 API 文档 19.1-19.5：
 *   19.1 GET  /salary/accounts/{employeeId}          — 查询员工薪资账套
 *   19.2 GET  /salary/accounts/{employeeId}/history  — 查询薪资变更历史
 *   19.3 POST /salary/accounts                        — 创建薪资账套
 *   19.4 PUT  /salary/accounts/{id}/adjust            — 调整薪资
 *   19.5 PUT  /salary/accounts/{id}/deactivate        — 停用薪资账套
 */

import { get, post, put } from '@/utils/request';

// ======================== 类型定义 ========================

/** 薪资账套 */
export interface SalaryAccount {
  id: number;
  employeeId: number;
  employeeName?: string;
  employeeNo?: string;
  deptName?: string;
  planId: number;
  planName?: string;
  baseSalary: number;
  pensionBase: number;
  medicalBase: number;
  housingFundBase: number;
  housingFundRatio: number;
  status: number;
  effectiveDate?: string;
  createTime?: string;
  updateTime?: string;
}

/** 薪资变更历史记录 */
export interface SalaryAdjustmentHistory {
  id: number;
  accountId: number;
  employeeName?: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  reason?: string;
  operatorName?: string;
  createTime: string;
}

/** 创建/调整薪资账套参数 */
export interface SalaryAccountFormParams {
  employeeId: number;
  planId: number;
  baseSalary: number;
  pensionBase: number;
  medicalBase: number;
  housingFundBase: number;
  housingFundRatio: number;
  status?: number;
}

// ======================== API 方法 ========================

/**
 * 查询员工薪资账套
 * GET /api/v1/salary/accounts/{employeeId}
 */
export async function getAccount(employeeId: number): Promise<SalaryAccount> {
  return get<SalaryAccount>(`/salary/accounts/${employeeId}`);
}

/**
 * 查询薪资变更历史
 * GET /api/v1/salary/accounts/{employeeId}/history
 */
export async function getHistory(employeeId: number): Promise<SalaryAdjustmentHistory[]> {
  return get<SalaryAdjustmentHistory[]>(`/salary/accounts/${employeeId}/history`);
}

/**
 * 创建薪资账套
 * POST /api/v1/salary/accounts
 */
export async function create(params: SalaryAccountFormParams): Promise<SalaryAccount> {
  return post<SalaryAccount>('/salary/accounts', params as Record<string, any>);
}

/**
 * 调整薪资
 * PUT /api/v1/salary/accounts/{id}/adjust
 */
export async function adjust(
  id: number,
  params: Partial<SalaryAccountFormParams>,
): Promise<void> {
  return put<void>(`/salary/accounts/${id}/adjust`, params as Record<string, any>);
}

/**
 * 停用薪资账套
 * PUT /api/v1/salary/accounts/{id}/deactivate
 */
export async function deactivate(id: number): Promise<void> {
  return put<void>(`/salary/accounts/${id}/deactivate`);
}
