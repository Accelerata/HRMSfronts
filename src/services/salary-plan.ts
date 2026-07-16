/**
 * 薪资方案 API
 *
 * 按 API 文档 20.1-20.10：
 *   20.1  GET    /salary/plans                       — 薪资方案列表
 *   20.2  GET    /salary/plans/{id}                  — 薪资方案详情
 *   20.3  POST   /salary/plans                       — 创建薪资方案
 *   20.4  PUT    /salary/plans/{id}                  — 更新薪资方案
 *   20.5  PUT    /salary/plans/{id}/status           — 切换方案状态
 *   20.6  GET    /salary/plans/{planId}/items        — 方案工资项目列表
 *   20.7  POST   /salary/plans/{planId}/items        — 添加方案工资项目
 *   20.8  DELETE /salary/plans/{planId}/items/{id}   — 删除方案工资项目
 *   20.9  GET    /salary/plans/{planId}/scopes       — 方案适用范围列表
 *   20.10 POST   /salary/plans/{planId}/scopes       — 添加方案适用范围
 */

import { get, post, put, del } from '@/utils/request';

// ======================== 类型定义 ========================

/** 薪资方案 */
export interface SalaryPlan {
  id: number;
  planName: string;
  description?: string;
  status: number;
  createTime?: string;
  updateTime?: string;
}

/** 方案工资项 */
export interface SalaryPlanItem {
  id: number;
  planId: number;
  itemName: string;
  itemType: string;
  amount: number;
  calculationRule: string;
  sortOrder: number;
  createTime?: string;
}

/** 方案适用范围 */
export interface SalaryPlanScope {
  id: number;
  planId: number;
  scopeType: string;
  scopeId: number;
  scopeName: string;
  createTime?: string;
}

/** 创建/更新方案参数 */
export interface SalaryPlanFormParams {
  planName: string;
  description?: string;
  status?: number;
}

/** 添加工资项参数 */
export interface SalaryPlanItemFormParams {
  itemName: string;
  itemType: string;
  amount: number;
  calculationRule: string;
  sortOrder?: number;
}

/** 添加适用范围参数 */
export interface SalaryPlanScopeFormParams {
  scopeType: string;
  scopeId: number;
  scopeName: string;
}

// ======================== API 方法 ========================

/**
 * 薪资方案列表
 * GET /api/v1/salary/plans
 */
export async function getList(): Promise<SalaryPlan[]> {
  return get<SalaryPlan[]>('/salary/plans');
}

/**
 * 薪资方案详情
 * GET /api/v1/salary/plans/{id}
 */
export async function getById(id: number): Promise<SalaryPlan> {
  return get<SalaryPlan>(`/salary/plans/${id}`);
}

/**
 * 创建薪资方案
 * POST /api/v1/salary/plans
 */
export async function create(params: SalaryPlanFormParams): Promise<SalaryPlan> {
  return post<SalaryPlan>('/salary/plans', params as Record<string, any>);
}

/**
 * 更新薪资方案
 * PUT /api/v1/salary/plans/{id}
 */
export async function update(id: number, params: SalaryPlanFormParams): Promise<void> {
  return put<void>(`/salary/plans/${id}`, params as Record<string, any>);
}

/**
 * 切换方案状态
 * PUT /api/v1/salary/plans/{id}/status?status=0|1
 */
export async function toggleStatus(id: number, status: number): Promise<void> {
  return put<void>(`/salary/plans/${id}/status`, undefined, { status });
}

/**
 * 方案工资项目列表
 * GET /api/v1/salary/plans/{planId}/items
 */
export async function getItems(planId: number): Promise<SalaryPlanItem[]> {
  return get<SalaryPlanItem[]>(`/salary/plans/${planId}/items`);
}

/**
 * 添加方案工资项目
 * POST /api/v1/salary/plans/{planId}/items
 */
export async function addItem(
  planId: number,
  params: SalaryPlanItemFormParams,
): Promise<SalaryPlanItem> {
  return post<SalaryPlanItem>(`/salary/plans/${planId}/items`, params as Record<string, any>);
}

/**
 * 删除方案工资项目
 * DELETE /api/v1/salary/plans/{planId}/items/{id}
 */
export async function deleteItem(planId: number, id: number): Promise<void> {
  return del<void>(`/salary/plans/${planId}/items/${id}`);
}

/**
 * 方案适用范围列表
 * GET /api/v1/salary/plans/{planId}/scopes
 */
export async function getScopes(planId: number): Promise<SalaryPlanScope[]> {
  return get<SalaryPlanScope[]>(`/salary/plans/${planId}/scopes`);
}

/**
 * 添加方案适用范围
 * POST /api/v1/salary/plans/{planId}/scopes
 */
export async function addScope(
  planId: number,
  params: SalaryPlanScopeFormParams,
): Promise<SalaryPlanScope> {
  return post<SalaryPlanScope>(`/salary/plans/${planId}/scopes`, params as Record<string, any>);
}
