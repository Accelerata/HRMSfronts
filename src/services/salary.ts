/**
 * 薪资管理 API
 *
 * 按 API 文档 18.1-18.15：
 *   18.1  POST /salary/calculate/{employeeId}     — 单人薪资核算
 *   18.2  POST /salary/batch-calculate             — 批量薪资核算
 *   18.3  GET  /salary/batches                     — 薪资批次列表
 *   18.4  GET  /salary/batches/{id}/records        — 批次薪资记录
 *   18.5  POST /salary/batches/{id}/submit         — 提交薪资批次
 *   18.6  POST /salary/batches/{id}/approve        — 审批薪资批次
 *   18.7  POST /salary/batches/{id}/pay            — 批次发放确认
 *   18.8  POST /salary/batches/{id}/archive        — 批次归档
 *   18.9  GET  /salary/records                     — 查询薪资记录
 *   18.10 GET  /salary/records/yearly              — 年度薪资记录
 *   18.11 GET  /salary/payslips                    — 我的工资条列表
 *   18.12 GET  /salary/payslips/{recordId}         — 工资条详情
 */

import { get, post } from '@/utils/request';
import type { PageResult } from '@/utils/request';

// ======================== 类型定义 ========================

/** 薪资核算明细 */
export interface SalaryDetail {
  employeeId: number;
  employeeName: string;
  year: number;
  month: number;
  baseSalary: number;
  attendanceDeduction: number;
  leaveDeduction: number;
  overtimePay: number;
  bonusTotal: number;
  socialInsurance: number;
  housingFund: number;
  taxableIncome: number;
  incomeTax: number;
  grossPay: number;
  netPay: number;
}

/** 薪资批次 */
export interface SalaryBatch {
  id: number;
  year: number;
  month: number;
  batchName?: string;
  status: string;
  employeeCount?: number;
  totalGross?: number;
  totalNet?: number;
  createTime?: string;
  updateTime?: string;
}

/** 薪资记录 */
export interface SalaryRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeNo?: string;
  deptName?: string;
  year: number;
  month: number;
  baseSalary: number;
  attendanceDeduction: number;
  leaveDeduction: number;
  overtimePay: number;
  bonusTotal: number;
  socialInsurance: number;
  housingFund: number;
  taxableIncome: number;
  incomeTax: number;
  grossPay: number;
  netPay: number;
  batchId?: number;
  status?: string;
}

/** 年度薪资记录项 */
export interface YearlySalaryItem {
  yearMonth: string;
  netPay: number;
  grossPay: number;
}

/** 工资条 */
export interface Payslip {
  id: number;
  employeeId: number;
  employeeName: string;
  year: number;
  month: number;
  netPay: number;
  grossPay: number;
  status?: string;
}

// ======================== API 方法 ========================

/**
 * 单人薪资核算
 * POST /api/v1/salary/calculate/{employeeId}?year=&month=
 */
export async function calculate(
  employeeId: number,
  year: number,
  month: number,
): Promise<SalaryDetail> {
  return post<SalaryDetail>(`/salary/calculate/${employeeId}`, undefined, { year, month });
}

/**
 * 批量薪资核算
 * POST /api/v1/salary/batch-calculate
 */
export async function batchCalc(
  year: number,
  month: number,
  deptId?: number | null,
): Promise<number> {
  return post<number>('/salary/batch-calculate', { year, month, deptId: deptId ?? null });
}

/**
 * 薪资批次列表
 * GET /api/v1/salary/batches
 */
export async function getBatches(): Promise<SalaryBatch[]> {
  return get<SalaryBatch[]>('/salary/batches');
}

/**
 * 批次薪资记录
 * GET /api/v1/salary/batches/{id}/records
 */
export async function getBatchRecords(id: number): Promise<PageResult<SalaryRecord>> {
  return get<PageResult<SalaryRecord>>(`/salary/batches/${id}/records`);
}

/**
 * 提交薪资批次
 * POST /api/v1/salary/batches/{id}/submit
 */
export async function submitBatch(id: number): Promise<void> {
  return post<void>(`/salary/batches/${id}/submit`);
}

/**
 * 审批薪资批次
 * POST /api/v1/salary/batches/{id}/approve
 */
export async function approveBatch(
  id: number,
  action: number,
  comment?: string,
): Promise<void> {
  return post<void>(`/salary/batches/${id}/approve`, { action, comment });
}

/**
 * 批次发放确认
 * POST /api/v1/salary/batches/{id}/pay
 */
export async function payBatch(id: number): Promise<void> {
  return post<void>(`/salary/batches/${id}/pay`);
}

/**
 * 批次归档
 * POST /api/v1/salary/batches/{id}/archive
 */
export async function archiveBatch(id: number): Promise<void> {
  return post<void>(`/salary/batches/${id}/archive`);
}

/**
 * 查询薪资记录
 * GET /api/v1/salary/records?employeeId=&year=&month=
 */
export async function getRecords(params: {
  employeeId?: number;
  year: number;
  month: number;
  page?: number;
  size?: number;
}): Promise<PageResult<SalaryRecord>> {
  return get<PageResult<SalaryRecord>>('/salary/records', params as Record<string, any>);
}

/**
 * 年度薪资记录
 * GET /api/v1/salary/records/yearly?employeeId=&year=
 */
export async function getYearly(
  employeeId: number,
  year: number,
): Promise<YearlySalaryItem[]> {
  return get<YearlySalaryItem[]>('/salary/records/yearly', { employeeId, year });
}

/**
 * 我的工资条列表
 * GET /api/v1/salary/payslips
 */
export async function getPayslips(): Promise<Payslip[]> {
  return get<Payslip[]>('/salary/payslips');
}

/**
 * 工资条详情
 * GET /api/v1/salary/payslips/{recordId}?password=
 */
export async function getPayslipDetail(
  recordId: number,
  password?: string,
): Promise<SalaryDetail> {
  const params: Record<string, any> = {};
  if (password) params.password = password;
  return get<SalaryDetail>(`/salary/payslips/${recordId}`, params);
}
