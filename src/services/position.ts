/**
 * 职位管理 API
 *
 * 按 API 文档 4.1-4.5：
 *   4.1 GET /position/list?sequence=   — 查询职位列表
 *   4.2 GET /position/{id}             — 根据ID查询职位
 *   4.3 POST /position                 — 创建职位
 *   4.4 PUT /position/{id}             — 更新职位
 *   4.5 DELETE /position/{id}          — 删除职位
 */

import { get, post, put, del } from '@/utils/request';

/** 职位 */
export interface Position {
  id: number;
  positionName: string;
  positionCode: string;
  sequence: string;       // M/P/S
  gradeRange?: string;    // 职级范围，如 "P1-P5"
  defaultProbationMonths?: number;
  deptId?: number | null;
  description?: string;
  isStandard: number;     // 0=非标准, 1=标准职位
  status: number;         // 0=禁用, 1=启用
}

/** 创建/更新职位参数 */
export interface PositionFormParams {
  positionName: string;
  positionCode: string;
  sequence: string;
  gradeRange?: string;
  defaultProbationMonths?: number;
  deptId?: number | null;
  description?: string;
  isStandard?: number;
  status?: number;
}

/**
 * 查询职位列表
 * GET /api/v1/position/list?sequence=
 */
export async function getList(sequence?: string): Promise<Position[]> {
  const params: Record<string, any> = {};
  if (sequence) params.sequence = sequence;
  return get<Position[]>('/position/list', params);
}

/**
 * 根据ID查询职位
 * GET /api/v1/position/{id}
 */
export async function getById(id: number): Promise<Position> {
  return get<Position>(`/position/${id}`);
}

/**
 * 创建职位
 * POST /api/v1/position
 */
export async function create(params: PositionFormParams): Promise<void> {
  return post<void>('/position', params);
}

/**
 * 更新职位
 * PUT /api/v1/position/{id}
 */
export async function update(id: number, params: PositionFormParams): Promise<void> {
  return put<void>(`/position/${id}`, params);
}

/**
 * 删除职位
 * DELETE /api/v1/position/{id}
 */
export async function remove(id: number): Promise<void> {
  return del<void>(`/position/${id}`);
}
