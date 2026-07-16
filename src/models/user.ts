/**
 * 全局用户状态 (Zustand)
 *
 * 存储当前登录用户信息、Token，并提供 login/logout actions。
 * Token 同步写入 localStorage，确保页面刷新后恢复。
 */

import { create } from 'zustand';

/** 登录用户信息（按 API 文档 1.1 登录响应） */
export interface UserInfo {
  userId: number;
  username: string;
  realName: string;
  roleCode: string;
  employeeId: number;
}

interface UserState {
  /** JWT Token */
  token: string | null;
  /** 当前用户信息 */
  currentUser: UserInfo | null;
  /** 是否已登录（有 token 且未过期） */
  isLoggedIn: boolean;

  /** 登录：写入 token 和用户信息 */
  login: (token: string, user: UserInfo) => void;
  /** 登出：清除 token 和用户信息，跳转登录页 */
  logout: () => void;
  /** 从 localStorage 恢复登录态 */
  restore: () => void;
}

const TOKEN_KEY = 'hrms_token';
const USER_KEY = 'hrms_user';

function persistToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

function persistUser(user: UserInfo) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

export const useUserStore = create<UserState>((set) => ({
  token: null,
  currentUser: null,
  isLoggedIn: false,

  login: (token: string, user: UserInfo) => {
    persistToken(token);
    persistUser(user);
    set({ token, currentUser: user, isLoggedIn: true });
  },

  logout: () => {
    clearStorage();
    set({ token: null, currentUser: null, isLoggedIn: false });
    window.location.href = '/user/login';
  },

  restore: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userJson = localStorage.getItem(USER_KEY);
      if (token && userJson) {
        const user: UserInfo = JSON.parse(userJson);
        set({ token, currentUser: user, isLoggedIn: true });
      }
    } catch {
      clearStorage();
      set({ token: null, currentUser: null, isLoggedIn: false });
    }
  },
}));
