/**
 * 工作日历 API
 *
 * 按 API 文档 12.1-12.3：
 *   12.1 GET    /calendar         — 查询节假日/调班列表
 *   12.2 POST   /calendar/batch   — 批量保存节假日/调班
 *   12.3 DELETE /calendar         — 删除某日配置
 */

import { get, post, del } from '@/utils/request';

/** 工作日历条目 */
export interface CalendarEntry {
  id?: number;
  calendarDate: string; // yyyy-MM-dd
  dayType: number; // 1=法定节假日/休息, 2=调班工作日
  name: string;
}

/**
 * 查询节假日/调班列表
 * GET /api/v1/calendar
 */
export async function getCalendar(year?: number): Promise<CalendarEntry[]> {
  return get<CalendarEntry[]>('/calendar', { year: year ?? new Date().getFullYear() });
}

/**
 * 批量保存节假日/调班
 * POST /api/v1/calendar/batch
 */
export async function batchSaveCalendar(entries: CalendarEntry[]): Promise<void> {
  return post<void>('/calendar/batch', entries as unknown as Record<string, any>);
}

/**
 * 删除某日配置
 * DELETE /api/v1/calendar
 */
export async function deleteCalendarEntry(date: string): Promise<void> {
  return del<void>('/calendar', { date });
}
