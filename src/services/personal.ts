/**
 * 个人中心 API
 *
 * 按 API 文档 21.1-21.4：
 *   21.1 GET  /personal/profile              — 我的档案
 *   21.2 PUT  /personal/profile              — 更新个人信息
 *   21.3 GET  /personal/attendance-calendar  — 考勤日历视图
 *   21.4 GET  /personal/salary-trend         — 个人薪资趋势
 */

import { get, put } from '@/utils/request';
import type { PageResult } from '@/utils/request';

// ---- 类型定义 ----

/** 字段可编辑性 */
export interface EditabilityField {
  editable: boolean;
  lockReason: string | null;
}

/** 个人档案 */
export interface PersonalProfile {
  id: number;
  employeeNo: string;
  name: string;
  phone: string;
  email: string;
  deptName: string;
  positionName: string;
  grade: string;
  entryDate: string;
  status: number;
  // 完整信息
  idCard?: string;
  gender?: number;
  birthday?: string;
  registeredAddress?: string;
  currentAddress?: string;
  bankAccount?: string;
  bankName?: string;
  baseSalary?: number;
  workLocation?: string;
  reportToName?: string;
}

/** 个人档案响应 */
export interface PersonalProfileResponse {
  profile: PersonalProfile;
  editability: Record<string, EditabilityField>;
}

/** 更新个人信息参数（仅4个可编辑字段） */
export interface PersonalProfileUpdateParams {
  email?: string;
  currentAddress?: string;
  registeredAddress?: string;
  birthday?: string;
}

/** 考勤日历日 */
export interface AttendanceCalendarDay {
  date: string;
  isWorkday: boolean;
  status: string;
  leaveDetail?: {
    leaveType: number;
    leaveTypeName: string;
    reason: string;
    applicationId: number;
  };
}

/** 薪资趋势数据点 */
export interface SalaryTrendItem {
  yearMonth: string;
  netPay: number;
}

// ---- API 方法 ----

/**
 * 我的档案
 * GET /api/v1/personal/profile
 */
export async function getProfile(): Promise<PersonalProfileResponse> {
  return get<PersonalProfileResponse>('/personal/profile');
}

/**
 * 更新个人信息（仅 email, currentAddress, registeredAddress, birthday 可更新）
 * PUT /api/v1/personal/profile
 */
export async function updateProfile(params: PersonalProfileUpdateParams): Promise<void> {
  return put<void>('/personal/profile', params as Record<string, any>);
}

/**
 * 考勤日历视图
 * GET /api/v1/personal/attendance-calendar?yearMonth=2026-07
 */
export async function getAttendanceCalendar(
  yearMonth: string,
): Promise<AttendanceCalendarDay[]> {
  return get<AttendanceCalendarDay[]>('/personal/attendance-calendar', { yearMonth });
}

/**
 * 个人薪资趋势
 * GET /api/v1/personal/salary-trend
 */
export async function getSalaryTrend(): Promise<SalaryTrendItem[]> {
  return get<SalaryTrendItem[]>('/personal/salary-trend');
}
