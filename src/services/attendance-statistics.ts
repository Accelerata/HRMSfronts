/**
 * 考勤统计 API
 *
 * 按 API 文档 6.1-6.2：
 *   6.1 GET /attendance-statistics/personal — 个人月度考勤统计
 *   6.2 GET /attendance-statistics/dept     — 部门月度考勤统计
 */

import { get } from '@/utils/request';

/** 个人月度考勤统计 */
export interface PersonalStatistics {
  employeeId: number;
  year: number;
  month: number;
  totalWorkDays: number;
  normalDays: number;
  lateDays: number;
  earlyDays: number;
  absentHalfDays: number;
  missingPunchDays: number;
  attendanceRate: number;
}

/** 部门月度考勤统计 */
export interface DeptStatistics {
  deptId: number;
  year: number;
  month: number;
  totalEmployees: number;
  recordedEmployeeCount: number;
  normalDays: number;
  lateDays: number;
  earlyDays: number;
  absentHalfDays: number;
  missingPunchDays: number;
  deptAttendanceRate: number;
}

/**
 * 个人月度考勤统计
 * GET /api/v1/attendance-statistics/personal
 */
export async function getPersonalStats(
  employeeId: number,
  year: number,
  month: number,
): Promise<PersonalStatistics> {
  return get<PersonalStatistics>('/attendance-statistics/personal', { employeeId, year, month });
}

/**
 * 部门月度考勤统计
 * GET /api/v1/attendance-statistics/dept
 */
export async function getDeptStats(
  deptId: number,
  year: number,
  month: number,
): Promise<DeptStatistics> {
  return get<DeptStatistics>('/attendance-statistics/dept', { deptId, year, month });
}
