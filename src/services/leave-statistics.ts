/**
 * 请假统计 API
 *
 * 按 API 文档 11.1-11.3：
 *   11.1 GET /leave/stats/personal/{employeeId}  — 个人请假统计
 *   11.2 GET /leave/stats/dept/{deptId}          — 部门请假率统计
 *   11.3 GET /leave/stats/type-distribution      — 请假类型分布
 */

import { get } from '@/utils/request';

/** 个人请假统计 */
export interface PersonalLeaveStats {
  employeeId: number;
  employeeName: string;
  year: number;
  month: number;
  totalLeaveDays: number;
  annualLeaveDays: number;
  sickLeaveDays: number;
  personalLeaveDays: number;
  otherLeaveDays: number;
}

/** 部门请假率统计 */
export interface DeptLeaveStats {
  deptId: number;
  deptName: string;
  year: number;
  month: number;
  totalEmployees: number;
  leaveEmployeeCount: number;
  totalLeaveDays: number;
  leaveRate: number;
}

/** 请假类型分布项 */
export interface LeaveTypeDistribution {
  leaveType: number;
  leaveTypeName: string;
  totalDays: number;
  count: number;
}

/**
 * 个人请假统计
 * GET /api/v1/leave/stats/personal/{employeeId}
 */
export async function getPersonalLeaveStats(
  employeeId: number,
  year: number,
  month: number,
): Promise<PersonalLeaveStats> {
  return get<PersonalLeaveStats>(`/leave/stats/personal/${employeeId}`, { year, month });
}

/**
 * 部门请假率统计
 * GET /api/v1/leave/stats/dept/{deptId}
 */
export async function getDeptLeaveStats(
  deptId: number,
  year: number,
  month: number,
): Promise<DeptLeaveStats> {
  return get<DeptLeaveStats>(`/leave/stats/dept/${deptId}`, { year, month });
}

/**
 * 请假类型分布
 * GET /api/v1/leave/stats/type-distribution
 */
export async function getTypeDistribution(
  year: number,
  month: number,
  deptId?: number,
): Promise<LeaveTypeDistribution[]> {
  const params: Record<string, any> = { year, month };
  if (deptId) params.deptId = deptId;
  return get<LeaveTypeDistribution[]>('/leave/stats/type-distribution', params);
}
