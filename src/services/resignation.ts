/**
 * 离职管理 API
 *
 * 按 API 文档 16.1-16.4：
 *   16.1 GET  /resignations/page        — 离职申请分页列表
 *   16.2 GET  /resignations/{id}        — 离职申请详情
 *   16.3 POST /resignations             — 提交离职申请
 *   16.4 PUT  /resignations/{id}/approve — 审批离职申请
 */

import { get, post, put } from '@/utils/request';
import type { PageResult } from '@/utils/request';

/** 离职申请记录 */
export interface ResignationApplication {
  id: number;
  employeeId: number;
  employeeName: string;
  deptName?: string;
  positionName?: string;
  resignationDate: string;
  resignationType: number; // 1=主动离职, 2=被动离职, 3=协商离职
  reason: string;
  handoverTo?: number;
  handoverToName?: string;
  handoverNotes?: string;
  status: number;
  approverComment?: string;
  approveTime?: string;
  createTime: string;
}

/** 离职申请提交参数 */
export interface ResignationParams {
  employeeId: number;
  resignationDate: string;
  resignationType: number;
  reason: string;
  handoverTo?: number;
  handoverNotes?: string;
}

/** 离职审批参数 */
export interface ResignationApproveParams {
  action: number; // 1=通过, 2=拒绝
  comment: string;
}

/**
 * 离职申请分页列表
 * GET /api/v1/resignations/page
 */
export async function getPage(params?: {
  page?: number;
  size?: number;
  status?: number;
  keyword?: string;
}): Promise<PageResult<ResignationApplication>> {
  return get<PageResult<ResignationApplication>>('/resignations/page', params as Record<string, any>);
}

/**
 * 离职申请详情
 * GET /api/v1/resignations/{id}
 */
export async function getById(id: number): Promise<ResignationApplication> {
  return get<ResignationApplication>(`/resignations/${id}`);
}

/**
 * 提交离职申请
 * POST /api/v1/resignations
 */
export async function create(data: ResignationParams): Promise<ResignationApplication> {
  return post<ResignationApplication>('/resignations', data as Record<string, any>);
}

/**
 * 审批离职申请
 * PUT /api/v1/resignations/{id}/approve
 */
export async function approve(id: number, data: ResignationApproveParams): Promise<void> {
  return put<void>(`/resignations/${id}/approve`, data as Record<string, any>);
}
