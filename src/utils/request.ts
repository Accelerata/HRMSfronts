/**
 * 统一请求配置
 *
 * 对接后端 API（按 /HRMS/docs/api文档.md）：
 *   Result<T>:    { code: 1, msg: null, data: T }        — 成功
 *   Result<T>:    { code: 0, msg: "error", data: null }  — 失败
 *   PageResult<T>: { list: T[], total: N, page: N, size: N }
 *
 * Base URL: /api/v1
 * 认证方式: JWT Bearer Token（localStorage key: hrms_token）
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

const API_BASE = '/api/v1';

/** 后端 Result 包裹 */
interface ApiResponse<T = any> {
  code: number;
  msg: string | null;
  data: T;
}

/** 分页返回（后端实际使用 records，兼容文档中的 list） */
export interface PageResult<T = any> {
  records?: T[];
  list?: T[];
  total: number;
  page: number;
  size: number;
}

// -------- Axios 实例 --------

const http = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// -------- 请求拦截器：注入 JWT Token --------

http.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('hrms_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// -------- 响应拦截器：解包 & 错误处理 --------

http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const body = response.data;
    // 正常响应 (code === 1)
    if (body.code === 1) {
      return { ...response, data: body.data };
    }
    // 业务错误 (code === 0)
    message.error(body.msg || '操作失败');
    return Promise.reject(new Error(body.msg || '操作失败'));
  },
  (error) => {
    // HTTP 错误（如 401）
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        message.error('登录已过期，请重新登录');
        redirectToLogin();
      } else if (status === 403) {
        message.error('无权限执行此操作');
      } else if (status >= 500) {
        message.error('服务器内部错误');
      } else {
        message.error(error.response.data?.msg || '请求失败');
      }
    } else {
      message.error('网络异常，请检查连接');
    }
    return Promise.reject(error);
  },
);

// -------- 公共方法 --------

/** 清除登录态并跳转登录页 */
export function redirectToLogin() {
  try {
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
  } catch {
    // ignore
  }
  if (window.location.pathname !== '/user/login') {
    window.location.href = '/user/login';
  }
}

/** 读取 Token */
export function getToken(): string | null {
  try {
    return localStorage.getItem('hrms_token');
  } catch {
    return null;
  }
}

// -------- 导出请求方法 --------

export async function get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
  const response = await http.get<any, AxiosResponse<T>>(url, { params });
  return response.data;
}

export async function post<T = any>(
  url: string,
  data?: Record<string, any>,
  params?: Record<string, any>,
): Promise<T> {
  const response = await http.post<any, AxiosResponse<T>>(url, data, { params });
  return response.data;
}

export async function put<T = any>(
  url: string,
  data?: Record<string, any>,
  params?: Record<string, any>,
): Promise<T> {
  const response = await http.put<any, AxiosResponse<T>>(url, data, { params });
  return response.data;
}

export async function del<T = any>(url: string, params?: Record<string, any>): Promise<T> {
  const response = await http.delete<any, AxiosResponse<T>>(url, { params });
  return response.data;
}

/**
 * 文件上传 (multipart/form-data)
 * 按 API 文档 10.1: POST /api/v1/leave/attachments
 */
export async function upload<T = any>(url: string, formData: FormData): Promise<T> {
  const response = await http.post<any, AxiosResponse<T>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return response.data;
}

/**
 * 文件下载 (Blob)
 * 按 API 文档 22.2: GET /api/v1/audit-logs/export → CSV
 */
export async function download(url: string, params?: Record<string, any>): Promise<Blob> {
  const response = await http.get(url, {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export default http;
