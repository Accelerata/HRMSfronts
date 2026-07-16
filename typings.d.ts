import 'umi/typings';

declare module '*.css';
declare module '*.less';
declare module '*.png';
declare module '*.svg' {
  export function ReactComponent(props: React.SVGProps<SVGSVGElement>): React.ReactElement;
  const url: string;
  export default url;
}

// API 统一返回格式
interface ApiResult<T = any> {
  code: number;
  msg: string | null;
  data: T;
}

// 分页返回格式
interface PageResult<T = any> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

// 登录用户信息
interface LoginUserInfo {
  token: string;
  userId: number;
  username: string;
  realName: string;
  roleCode: string;
  employeeId: number;
}
