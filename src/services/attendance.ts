/**
 * 考勤管理 API
 *
 * 按 API 文档 5.1-5.7：
 *   5.1 POST   /attendance/punch-in     — 上班打卡
 *   5.2 POST   /attendance/punch-out    — 下班打卡
 *   5.3 GET    /attendance/records/{id} — 查询员工打卡记录
 *   5.4 GET    /attendance/groups       — 考勤组列表
 *   5.5 POST   /attendance/groups       — 创建考勤组
 *   5.6 PUT    /attendance/groups/{id}  — 更新考勤组
 *   5.7 DELETE /attendance/groups/{id}  — 删除考勤组
 */

import { get, post, put, del } from '@/utils/request';
import type { PageResult } from '@/utils/request';

/** 打卡记录 */
export interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  groupId: number;
  punchDate: string;
  punchInTime?: string;
  punchOutTime?: string;
  status: string; // NORMAL/LATE/EARLY/ABSENT/MISSING
  lateMinutes: number;
  earlyMinutes?: number;
}

/** 打卡参数 */
export interface PunchParams {
  employeeId: number;
  groupId: number;
  punchTime: string;
}

/** 考勤组 */
export interface AttendanceGroup {
  id: number;
  groupName: string;
  groupType: number; // 1=固定班, 2=弹性班, 3=排班制
  startTime: string;
  endTime: string;
  flexThreshold?: number;
  absentHalfDayThreshold?: number;
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
  lateThresholdMinutes?: number;
  earlyThresholdMinutes?: number;
  status: number;
}

/** 考勤组表单参数 */
export interface AttendanceGroupFormParams {
  groupName: string;
  groupType: number;
  startTime: string;
  endTime: string;
  flexThreshold?: number;
  absentHalfDayThreshold?: number;
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
  lateThresholdMinutes?: number;
  earlyThresholdMinutes?: number;
  status?: number;
}

/**
 * 上班打卡
 * POST /api/v1/attendance/punch-in
 */
export async function punchIn(params: PunchParams): Promise<AttendanceRecord> {
  return post<AttendanceRecord>('/attendance/punch-in', params as Record<string, any>);
}

/**
 * 下班打卡
 * POST /api/v1/attendance/punch-out
 */
export async function punchOut(params: PunchParams): Promise<AttendanceRecord> {
  return post<AttendanceRecord>('/attendance/punch-out', params as Record<string, any>);
}

/**
 * 查询员工打卡记录（分页）
 * GET /api/v1/attendance/records/{employeeId}
 */
export async function getRecords(employeeId: number, page = 1, size = 31): Promise<PageResult<AttendanceRecord>> {
  return get<PageResult<AttendanceRecord>>(`/attendance/records/${employeeId}`, { page, size });
}

/**
 * 考勤组列表
 * GET /api/v1/attendance/groups
 */
export async function getGroups(): Promise<AttendanceGroup[]> {
  return get<AttendanceGroup[]>('/attendance/groups');
}

/**
 * 创建考勤组
 * POST /api/v1/attendance/groups
 */
export async function createGroup(params: AttendanceGroupFormParams): Promise<void> {
  return post<void>('/attendance/groups', params as Record<string, any>);
}

/**
 * 更新考勤组
 * PUT /api/v1/attendance/groups/{id}
 */
export async function updateGroup(id: number, params: AttendanceGroupFormParams): Promise<void> {
  return put<void>(`/attendance/groups/${id}`, params as Record<string, any>);
}

/**
 * 删除考勤组
 * DELETE /api/v1/attendance/groups/{id}
 */
export async function deleteGroup(id: number): Promise<void> {
  return del<void>(`/attendance/groups/${id}`);
}
