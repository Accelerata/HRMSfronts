import { defineConfig } from '@umijs/max';
import routes from './config/routes';

export default defineConfig({
  // 路由前缀
  base: '/',
  publicPath: '/',

  // 插件配置（@umijs/max 内置：路由、布局、数据流、权限）
  antd: {
    // Ant Design 5 主题 token
    theme: {
      token: {
        colorPrimary: '#1677ff',
        colorSuccess: '#52c41a',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
        colorInfo: '#1677ff',
        borderRadius: 6,
      },
    },
  },
  access: {},
  model: {},
  initialState: {},
  // 使用 config/routes.ts 中的自定义 BasicLayout，避免 Umi plugin-layout 再包一层侧边栏。
  layout: false,

  // 路由配置（从 config/routes.ts 导入）
  routes,

  // Mock 配置：开发环境优先使用 mock/ 目录，然后才走代理
  mock: {},

  // esbuild IIFE 冲突修复
  esbuildMinifyIIFE: true,

  // 代理配置：Mock 未命中时才转发到后端
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },

  // 构建配置
  npmClient: 'npm',
  targets: {
    chrome: 80,
  },
  outputPath: 'dist',

  // 请求配置（Umi 内置 request 插件）
  request: {},

  // 定义全局常量
  define: {
    'process.env.API_BASE': '/api/v1',
  },
});
