/**
 * 员工档案管理 API
 *
 * 按 API 文档 2.1-2.5：
 *   2.1 GET  /employee/list      — 分页查询员工列表
 *   2.2 GET  /employee/{id}      — 查看员工详情
 *   2.3 POST /employee            — 创建员工档案
 *   2.4 PUT  /employee/{id}      — 更新员工档案
 *   2.5 DELETE /employee/{id}    — 删除员工档案
 */

import { get, post, put, del } from '@/utils/request';
import type { PageResult } from '@/utils/request';

/** 员工 */
export interface Employee {
  id: number;
  employeeNo: string;
  name: string;
  phone: string;
  email: string;
  idCard?: string;
  gender?: number;
  birthday?: string;
  deptId: number;
  deptName: string;
  positionId: number;
  positionName: string;
  grade?: string;
  reportTo?: number;
  reportToName?: string;
  workLocation?: string;
  entryType?: number;
  entryDate?: string;
  status: number;
  baseSalary?: number;
  bankAccount?: string;
  bankName?: string;
  registeredAddress?: string;
  currentAddress?: string;
  salaryAccountId?: number;
  createTime?: string;
  updateTime?: string;
}

/** 员工列表查询参数 */
export interface EmployeeListParams {
  keyword?: string;
  phone?: string;
  deptId?: number;
  status?: number;
  deptIds?: number[];
  positionIds?: number[];
  statuses?: number[];
  grades?: string[];
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

/** 创建/更新员工参数 */
export interface EmployeeFormParams {
  name: string;
  phone: string;
  email: string;
  idCard?: string;
  gender?: number;
  birthday?: string;
  registeredAddress?: string;
  currentAddress?: string;
  deptId: number;
  positionId: number;
  grade?: string;
  reportTo?: number;
  workLocation?: string;
  entryType?: number;
  entryDate?: string;
  salaryAccountId?: number;
  baseSalary?: number;
  bankAccount?: string;
  bankName?: string;
  status?: number;
}

/**
 * 分页查询员工列表
 * GET /api/v1/employee/list
 */
export async function getList(params: EmployeeListParams): Promise<PageResult<Employee>> {
  console.log('[service:employee] getList 请求参数:', JSON.stringify(params));
  const result = await get<PageResult<Employee>>('/employee/list', params as Record<string, any>);
  console.log('[service:employee] getList 响应数据:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * 查看员工详情
 * GET /api/v1/employee/{id}
 */
export async function getById(id: number): Promise<Employee> {
  return get<Employee>(`/employee/${id}`);
}

/**
 * 创建员工档案
 * POST /api/v1/employee
 */
export async function create(params: EmployeeFormParams): Promise<Employee> {
  return post<Employee>('/employee', params as Record<string, any>);
}

/**
 * 更新员工档案
 * PUT /api/v1/employee/{id}
 */
export async function update(id: number, params: EmployeeFormParams): Promise<Employee> {
  return put<Employee>(`/employee/${id}`, params as Record<string, any>);
}

/**
 * 删除员工档案
 * DELETE /api/v1/employee/{id}
 */
export async function remove(id: number): Promise<void> {
  return del<void>(`/employee/${id}`);
}
