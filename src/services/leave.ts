/**
 * 请假管理 API
 *
 * 按 API 文档 9.1-9.8：
 *   9.1 GET  /leave/days/calculate              — 天数试算预览
 *   9.2 GET  /leave/balance/{employeeId}        — 查询员工假期余额
 *   9.3 POST /leave/balance/annual/init         — 初始化年假余额
 *   9.4 POST /leave/apply                       — 创建请假申请（草稿）
 *   9.5 POST /leave/{id}/submit                 — 提交请假申请
 *   9.6 POST /leave/{id}/approve                — 审批请假申请
 *   9.7 POST /leave/{id}/cancel                 — 取消请假申请
 *   9.8 GET  /leave/applications/{employeeId}   — 查询员工请假记录
 */

import { get, post } from '@/utils/request';
import type { PageResult } from '@/utils/request';

/** 请假申请记录 */
export interface LeaveApplication {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveType: number; // 1=年假, 2=调休, 3=事假, 4=病假, 5=婚假, 6=产假, 7=丧假
  startDate: string;
  endDate: string;
  startPeriod: number; // 0=上午, 1=下午
  endPeriod: number; // 0=上午, 1=下午
  days: number;
  reason: string;
  handoverTo?: number;
  handoverToName?: string;
  status: number; // 0=草稿, 1=审批中, 2=已通过, 3=已拒绝, 4=已取消
  approverComment?: string;
  approveTime?: string;
  createTime: string;
}

/** 假期余额 */
export interface LeaveBalance {
  id: number;
  employeeId: number;
  leaveType: number;
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  year: number;
}

/** 天数试算参数 */
export interface DaysCalculateParams {
  startDate: string;
  startPeriod: number; // 0=上午, 1=下午
  endDate: string;
  endPeriod: number; // 0=上午, 1=下午
}

/** 请假申请参数 */
export interface LeaveApplyParams {
  leaveType: number;
  startDate: string;
  endDate: string;
  startPeriod: number;
  endPeriod: number;
  reason: string;
  handoverTo?: number;
  employeeId?: number; // 可选，默认取当前登录用户
}

/** 请假审批参数 */
export interface LeaveApproveParams {
  action: number; // 1=通过, 2=拒绝, 3=退回
  comment: string;
}

/**
 * 天数试算预览
 * GET /api/v1/leave/days/calculate
 */
export async function calculateDays(params: DaysCalculateParams): Promise<number> {
  return get<number>('/leave/days/calculate', params as Record<string, any>);
}

/**
 * 查询员工假期余额
 * GET /api/v1/leave/balance/{employeeId}
 */
export async function getBalance(employeeId: number, year?: number): Promise<LeaveBalance[]> {
  return get<LeaveBalance[]>(`/leave/balance/${employeeId}`, { year: year ?? 2026 });
}

/**
 * 初始化年假余额
 * POST /api/v1/leave/balance/annual/init
 */
export async function initAnnualBalance(employeeId: number, entryDate: string, year?: number): Promise<void> {
  return post<void>('/leave/balance/annual/init', undefined, { employeeId, entryDate, year: year ?? 2026 });
}

/**
 * 创建请假申请（草稿）
 * POST /api/v1/leave/apply
 */
export async function applyLeave(params: LeaveApplyParams): Promise<LeaveApplication> {
  return post<LeaveApplication>('/leave/apply', params as Record<string, any>);
}

/**
 * 提交请假申请
 * POST /api/v1/leave/{id}/submit
 */
export async function submitLeave(id: number): Promise<void> {
  return post<void>(`/leave/${id}/submit`);
}

/**
 * 审批请假申请
 * POST /api/v1/leave/{id}/approve
 */
export async function approveLeave(id: number, params: LeaveApproveParams): Promise<void> {
  return post<void>(`/leave/${id}/approve`, params as Record<string, any>);
}

/**
 * 取消请假申请
 * POST /api/v1/leave/{id}/cancel
 */
export async function cancelLeave(id: number): Promise<void> {
  return post<void>(`/leave/${id}/cancel`);
}

/**
 * 查询员工请假记录（分页）
 * GET /api/v1/leave/applications/{employeeId}
 */
export async function getApplications(employeeId: number, page = 1, size = 20): Promise<PageResult<LeaveApplication>> {
  return get<PageResult<LeaveApplication>>(`/leave/applications/${employeeId}`, { page, size });
}
