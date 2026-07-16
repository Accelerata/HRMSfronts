/**
 * 部门管理 API
 *
 * 按 API 文档 3.1-3.5：
 *   3.1 GET /dept/tree           — 获取部门树
 *   3.2 POST /dept               — 创建部门
 *   3.3 PUT /dept/{id}           — 更新部门
 *   3.4 DELETE /dept/{id}        — 删除部门
 *   3.5 POST /dept/{id}/merge    — 部门合并
 */

import { get, post, put, del } from '@/utils/request';

/** 部门节点 */
export interface DeptNode {
  id: number;
  deptName: string;
  deptCode: string;
  parentId: number;
  managerId?: number;
  managerName?: string;
  sortOrder: number;
  status: number;
  employeeCount?: number;
  children?: DeptNode[];
}

/** 创建/更新部门参数 */
export interface DeptFormParams {
  parentId: number;
  deptName: string;
  deptCode: string;
  managerId?: number;
  sortOrder?: number;
  status?: number;
}

/**
 * 获取部门树
 * GET /api/v1/dept/tree
 */
export async function getTree(): Promise<DeptNode[]> {
  return get<DeptNode[]>('/dept/tree');
}

/**
 * 创建部门
 * POST /api/v1/dept
 */
export async function create(params: DeptFormParams): Promise<void> {
  return post<void>('/dept', params);
}

/**
 * 更新部门
 * PUT /api/v1/dept/{id}
 */
export async function update(id: number, params: DeptFormParams): Promise<void> {
  return put<void>(`/dept/${id}`, params);
}

/**
 * 删除部门
 * DELETE /api/v1/dept/{id}
 */
export async function remove(id: number): Promise<void> {
  return del<void>(`/dept/${id}`);
}

/**
 * 部门合并
 * POST /api/v1/dept/{sourceId}/merge?targetDeptId=xxx
 */
export async function merge(sourceId: number, targetDeptId: number): Promise<void> {
  return post<void>(`/dept/${sourceId}/merge`, undefined, { targetDeptId });
}
