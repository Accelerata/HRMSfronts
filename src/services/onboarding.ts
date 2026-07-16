/**
 * 入职管理 API
 *
 * 按 API 文档 13.1-13.11：
 *   13.1  GET  /onboarding/page              — 入职申请分页列表
 *   13.2  GET  /onboarding/{id}              — 入职申请详情
 *   13.3  POST /onboarding                   — 提交入职申请
 *   13.4  POST /onboarding/draft             — 保存草稿
 *   13.5  PUT  /onboarding/{id}              — 更新入职申请
 *   13.6  DELETE /onboarding/{id}           — 删除草稿
 *   13.7  POST /onboarding/{id}/withdraw     — 撤回入职申请
 *   13.8  PUT  /onboarding/{id}/approve      — 审批入职申请
 *   13.9  POST /onboarding/{id}/confirm-arrival — 确认到岗
 *   13.10 PUT  /onboarding/{id}/entry-date   — 更新入职日期
 *   13.11 POST /onboarding/{id}/abandon      — 标记放弃入职
 */

import { get, post, put, del } from '@/utils/request';
import type { PageResult } from '@/utils/request';

/** 入职申请记录 */
export interface OnboardingApplication {
  id: number;
  realName: string;
  phone: string;
  email: string;
  idCard?: string;
  targetDeptId: number;
  targetDeptName?: string;
  targetPositionId: number;
  targetPositionName?: string;
  offerSalary: number;
  probationMonths: number;
  probationSalaryRatio?: number;
  entryDate: string;
  gender?: number;
  grade?: string;
  reportTo?: number;
  reportToName?: string;
  workLocation?: string;
  entryType?: number;
  employmentType?: number;
  bankAccount?: string;
  bankName?: string;
  status: number; // 0=草稿, 1=审批中, 2=待入职, 3=已入职, 4=已拒绝, 5=已撤回, 6=已放弃
  approverComment?: string;
  approveTime?: string;
  employeeNo?: string;
  createTime: string;
  createBy?: string;
}

/** 入职申请提交参数 */
export interface OnboardingParams {
  realName: string;
  phone: string;
  email: string;
  idCard?: string;
  targetDeptId: number;
  targetPositionId: number;
  offerSalary: number;
  probationMonths?: number;
  probationSalaryRatio?: number;
  entryDate: string;
  gender?: number;
  grade?: string;
  reportTo?: number;
  workLocation?: string;
  entryType?: number;
  employmentType?: number;
  bankAccount?: string;
  bankName?: string;
}

/** 入职审批参数 */
export interface OnboardingApproveParams {
  action: number; // 1=通过, 2=拒绝
  comment: string;
}

/** 入职日期更新参数 */
export interface EntryDateParams {
  entryDate: string;
}

/**
 * 入职申请分页列表
 * GET /api/v1/onboarding/page
 */
export async function getPage(params?: {
  page?: number;
  size?: number;
  status?: number;
  keyword?: string;
}): Promise<PageResult<OnboardingApplication>> {
  return get<PageResult<OnboardingApplication>>('/onboarding/page', params as Record<string, any>);
}

/**
 * 入职申请详情
 * GET /api/v1/onboarding/{id}
 */
export async function getById(id: number): Promise<OnboardingApplication> {
  return get<OnboardingApplication>(`/onboarding/${id}`);
}

/**
 * 提交入职申请
 * POST /api/v1/onboarding
 */
export async function create(data: OnboardingParams): Promise<OnboardingApplication> {
  return post<OnboardingApplication>('/onboarding', data as Record<string, any>);
}

/**
 * 保存草稿
 * POST /api/v1/onboarding/draft
 */
export async function draft(data: Partial<OnboardingParams>): Promise<OnboardingApplication> {
  return post<OnboardingApplication>('/onboarding/draft', data as Record<string, any>);
}

/**
 * 更新入职申请
 * PUT /api/v1/onboarding/{id}
 */
export async function update(id: number, data: Partial<OnboardingParams>): Promise<void> {
  return put<void>(`/onboarding/${id}`, { ...data, id } as Record<string, any>);
}

/**
 * 删除草稿
 * DELETE /api/v1/onboarding/{id}
 */
export async function remove(id: number): Promise<void> {
  return del<void>(`/onboarding/${id}`);
}

/**
 * 撤回入职申请
 * POST /api/v1/onboarding/{id}/withdraw
 */
export async function withdraw(id: number): Promise<void> {
  return post<void>(`/onboarding/${id}/withdraw`);
}

/**
 * 审批入职申请
 * PUT /api/v1/onboarding/{id}/approve
 */
export async function approve(id: number, data: OnboardingApproveParams): Promise<void> {
  return put<void>(`/onboarding/${id}/approve`, data as Record<string, any>);
}

/**
 * 确认到岗
 * POST /api/v1/onboarding/{id}/confirm-arrival
 */
export async function confirmArrival(id: number): Promise<void> {
  return post<void>(`/onboarding/${id}/confirm-arrival`);
}

/**
 * 更新入职日期
 * PUT /api/v1/onboarding/{id}/entry-date
 */
export async function updateEntryDate(id: number, data: EntryDateParams): Promise<void> {
  return put<void>(`/onboarding/${id}/entry-date`, data as Record<string, any>);
}

/**
 * 标记放弃入职
 * POST /api/v1/onboarding/{id}/abandon
 */
export async function abandon(id: number): Promise<void> {
  return post<void>(`/onboarding/${id}/abandon`);
}
