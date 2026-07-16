/**
 * Umi Max 运行时配置
 */

// ======================== getInitialState ========================

export async function getInitialState() {
  try {
    const token = localStorage.getItem('hrms_token');
    const userJson = localStorage.getItem('hrms_user');
    if (token && userJson) {
      const currentUser = JSON.parse(userJson);
      return {
        currentUser,
        token,
        // Umi Plugin Layout 默认右侧渲染需要的字段
        name: currentUser.realName || currentUser.username,
        avatar: currentUser.avatar,
      };
    }
  } catch {
    // ignore
  }
  return {};
}

// ======================== request ========================

export const request = {
  timeout: 30000,
  errorConfig: {
    errorHandler(error: any) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
        window.location.href = '/user/login';
      }
    },
  },
};
