/**
 * 转正管理 API
 *
 * 按 API 文档 14.1-14.5：
 *   14.1 GET  /regularization/page        — 转正申请分页列表
 *   14.2 GET  /regularization/{id}        — 转正申请详情
 *   14.3 POST /regularization             — 提交转正申请
 *   14.4 PUT  /regularization/{id}/approve — 审批转正申请
 *   14.5 GET  /regularization/expiring     — 即将到期员工列表
 */

import { get, post, put } from '@/utils/request';
import type { PageResult } from '@/utils/request';

/** 转正申请记录 */
export interface RegularizationApplication {
  id: number;
  employeeId: number;
  employeeName: string;
  deptName?: string;
  positionName?: string;
  entryDate?: string;
  probationEndDate: string;
  applyDate: string;
  status: number; // 0=草稿, 1=审批中, 2=已通过, 3=已拒绝
  resultType?: number; // 1=通过转正, 2=延长试用, 3=不通过辞退
  extendedMonths?: number;
  approverComment?: string;
  approveTime?: string;
  createTime: string;
}

/** 转正申请提交参数 */
export interface RegularizationParams {
  employeeId: number;
  probationEndDate: string;
  applyDate: string;
}

/** 转正审批参数 */
export interface RegularizationApproveParams {
  action: number; // 1=通过, 2=拒绝
  resultType: number; // 1=通过转正, 2=延长试用, 3=不通过辞退
  extendedMonths?: number; // resultType=2 时需要
  comment: string;
}

/** 即将到期员工 */
export interface ExpiringEmployee {
  employeeId: number;
  employeeName: string;
  deptName: string;
  entryDate: string;
  probationEndDate: string;
  daysUntilExpire: number;
}

/**
 * 转正申请分页列表
 * GET /api/v1/regularization/page
 */
export async function getPage(params?: {
  page?: number;
  size?: number;
  status?: number;
  keyword?: string;
}): Promise<PageResult<RegularizationApplication>> {
  return get<PageResult<RegularizationApplication>>('/regularization/page', params as Record<string, any>);
}

/**
 * 转正申请详情
 * GET /api/v1/regularization/{id}
 */
export async function getById(id: number): Promise<RegularizationApplication> {
  return get<RegularizationApplication>(`/regularization/${id}`);
}

/**
 * 提交转正申请
 * POST /api/v1/regularization
 */
export async function create(data: RegularizationParams): Promise<RegularizationApplication> {
  return post<RegularizationApplication>('/regularization', data as Record<string, any>);
}

/**
 * 审批转正申请
 * PUT /api/v1/regularization/{id}/approve
 */
export async function approve(id: number, data: RegularizationApproveParams): Promise<void> {
  return put<void>(`/regularization/${id}/approve`, data as Record<string, any>);
}

/**
 * 即将到期员工列表
 * GET /api/v1/regularization/expiring
 */
export async function getExpiring(days?: number): Promise<ExpiringEmployee[]> {
  return get<ExpiringEmployee[]>('/regularization/expiring', { days: days ?? 7 });
}
