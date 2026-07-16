/**
 * 认证模块 API
 *
 * 按 API 文档 1.1 (登录) 和 1.2 (修改密码)
 */

import { post, put } from '@/utils/request';

// ======================== 类型定义 ========================

/** 登录请求体（API 1.1） */
export interface LoginParams {
  username: string;
  password: string;
  captcha?: string;
}

/** 登录响应 data（API 1.1） */
export interface LoginResult {
  token: string;
  userId: number;
  username: string;
  realName: string;
  roleCode: string;
  employeeId: number;
}

/** 修改密码请求体（API 1.2） */
export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

// ======================== API 方法 ========================

/**
 * 用户登录
 * POST /api/v1/auth/login
 */
export async function login(params: LoginParams): Promise<LoginResult> {
  return post<LoginResult>('/auth/login', params);
}

/**
 * 修改密码
 * PUT /api/v1/auth/change-password
 */
export async function changePassword(params: ChangePasswordParams): Promise<void> {
  return put<void>('/auth/change-password', params);
}
