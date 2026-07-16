/**
 * 补卡管理 API
 *
 * 按 API 文档 7.1-7.3：
 *   7.1 POST /supplementary-card/apply        — 发起补卡申请
 *   7.2 POST /supplementary-card/{id}/approve — 审批补卡申请
 *   7.3 GET  /supplementary-card/my           — 查询我的补卡申请
 */

import { get, post } from '@/utils/request';
import type { PageResult } from '@/utils/request';

/** 补卡申请记录 */
export interface SupplementaryCardRecord {
  id: number;
  employeeId: number;
  employeeName?: string;
  attendanceDate: string;
  cardType: number; // 1=上班卡, 2=下班卡
  supplementTime: string;
  reason: string;
  status: number; // 0=草稿, 1=审批中, 2=已通过, 3=已拒绝
  approverComment?: string;
  approveTime?: string;
  createTime: string;
}

/** 补卡申请参数 */
export interface SupplementaryCardApplyParams {
  attendanceDate: string;
  cardType: number; // 1=上班卡, 2=下班卡
  supplementTime: string;
  reason: string;
}

/** 补卡审批参数 */
export interface SupplementaryCardApproveParams {
  action: number; // 1=通过, 2=拒绝
  comment: string;
}

/**
 * 发起补卡申请
 * POST /api/v1/supplementary-card/apply
 */
export async function apply(params: SupplementaryCardApplyParams): Promise<SupplementaryCardRecord> {
  return post<SupplementaryCardRecord>('/supplementary-card/apply', params as Record<string, any>);
}

/**
 * 审批补卡申请
 * POST /api/v1/supplementary-card/{id}/approve
 */
export async function approve(id: number, params: SupplementaryCardApproveParams): Promise<void> {
  return post<void>(`/supplementary-card/${id}/approve`, params as Record<string, any>);
}

/**
 * 查询我的补卡申请（分页）
 * GET /api/v1/supplementary-card/my
 */
export async function getMy(params?: { page?: number; size?: number }): Promise<PageResult<SupplementaryCardRecord>> {
  return get<PageResult<SupplementaryCardRecord>>('/supplementary-card/my', params as Record<string, any>);
}
