/**
 * 审计日志 API
 *
 * 按 API 文档 22.1-22.2：
 *   22.1 GET  /audit-logs        — 审计日志分页查询
 *   22.2 GET  /audit-logs/export — 导出审计日志 (CSV)
 */

import { get, download } from '@/utils/request';
import type { PageResult } from '@/utils/request';

// ---- 类型定义 ----

/** 审计日志记录 */
export interface AuditLogRecord {
  id: number;
  operatorId: number;
  operatorName: string;
  operation: string;
  resourceType: string;
  resourceId: string;
  result: string;
  errorMessage: string | null;
  clientIp: string;
  createTime: string;
}

/** 审计日志查询参数 */
export interface AuditLogQueryParams {
  operatorId?: number;
  operation?: string;
  resourceType?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  size?: number;
}

// ---- API 方法 ----

/**
 * 审计日志分页查询
 * GET /api/v1/audit-logs
 */
export async function getLogs(params: AuditLogQueryParams): Promise<PageResult<AuditLogRecord>> {
  return get<PageResult<AuditLogRecord>>('/audit-logs', params as Record<string, any>);
}

/**
 * 导出审计日志 (CSV)
 * GET /api/v1/audit-logs/export
 * 返回 CSV 文件的 Blob
 */
export async function exportCSV(params: Omit<AuditLogQueryParams, 'page' | 'size'>): Promise<Blob> {
  return download('/audit-logs/export', params as Record<string, any>);
}
