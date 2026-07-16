/**
 * 调岗管理 API
 *
 * 按 API 文档 15.1-15.4：
 *   15.1 GET  /transfers/page        — 调岗申请分页列表
 *   15.2 GET  /transfers/{id}        — 调岗申请详情
 *   15.3 POST /transfers             — 提交调岗申请
 *   15.4 PUT  /transfers/{id}/approve — 审批调岗申请（双审批：原部门+新部门）
 */

import { get, post, put } from '@/utils/request';
import type { PageResult } from '@/utils/request';

/** 调岗申请记录 */
export interface TransferApplication {
  id: number;
  employeeId: number;
  employeeName: string;
  fromDeptId: number;
  fromDeptName?: string;
  toDeptId: number;
  toDeptName?: string;
  fromPositionId: number;
  fromPositionName?: string;
  toPositionId: number;
  toPositionName?: string;
  effectiveDate: string;
  reason: string;
  status: number;
  /** 原部门审批状态 */
  oldDeptApprovalStatus?: number; // 0=待审批, 1=已通过, 2=已拒绝
  oldDeptApproverId?: number;
  oldDeptApproverName?: string;
  oldDeptApprovalTime?: string;
  oldDeptApprovalComment?: string;
  /** 新部门审批状态 */
  newDeptApprovalStatus?: number;
  newDeptApproverId?: number;
  newDeptApproverName?: string;
  newDeptApprovalTime?: string;
  newDeptApprovalComment?: string;
  createTime: string;
}

/** 调岗申请提交参数 */
export interface TransferParams {
  employeeId: number;
  fromDeptId: number;
  toDeptId: number;
  fromPositionId: number;
  toPositionId: number;
  effectiveDate: string;
  reason: string;
}

/** 调岗审批参数 */
export interface TransferApproveParams {
  action: number; // 1=通过, 2=拒绝
  role: 'old' | 'new'; // old=原部门负责人, new=新部门负责人
  comment: string;
}

/**
 * 调岗申请分页列表
 * GET /api/v1/transfers/page
 */
export async function getPage(params?: {
  page?: number;
  size?: number;
  status?: number;
  keyword?: string;
}): Promise<PageResult<TransferApplication>> {
  return get<PageResult<TransferApplication>>('/transfers/page', params as Record<string, any>);
}

/**
 * 调岗申请详情
 * GET /api/v1/transfers/{id}
 */
export async function getById(id: number): Promise<TransferApplication> {
  return get<TransferApplication>(`/transfers/${id}`);
}

/**
 * 提交调岗申请
 * POST /api/v1/transfers
 */
export async function create(data: TransferParams): Promise<TransferApplication> {
  return post<TransferApplication>('/transfers', data as Record<string, any>);
}

/**
 * 审批调岗申请
 * PUT /api/v1/transfers/{id}/approve
 */
export async function approve(id: number, data: TransferApproveParams): Promise<void> {
  return put<void>(`/transfers/${id}/approve`, data as Record<string, any>);
}
