/**
 * 调休管理 API
 *
 * 按 API 文档 8.1：
 *   8.1 POST /comp-leave/convert/{employeeId} — 手动触发加班折算调休
 */

import { post } from '@/utils/request';

/**
 * 手动触发加班折算调休
 * POST /api/v1/comp-leave/convert/{employeeId}
 * @returns 折算的调休天数（BigDecimal）
 */
export async function convert(employeeId: number): Promise<number> {
  return post<number>(`/comp-leave/convert/${employeeId}`);
}
