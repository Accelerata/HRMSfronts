/**
 * 登录页面
 *
 * 按 API 文档 1.1: POST /api/v1/auth/login
 * 登录成功后跳转至首页 /dashboard
 *
 * 开发模式：后端未启动时，点击「开发模式登录」直接模拟 ADMIN 登录态
 */

import { useState } from 'react';
import { Form, Input, Button, message, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import { login, LoginParams } from '@/services/auth';

const DEV_TOKEN = 'dev-mock-jwt-token';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login: storeLogin } = useUserStore();

  const doLogin = (token: string, user: { userId: number; username: string; realName: string; roleCode: string; employeeId: number }) => {
    storeLogin(token, user);
    message.success(`欢迎回来，${user.realName || user.username}（${user.roleCode}）`);
    window.location.href = '/dashboard';
  };

  /** 真实登录 */
  const onFinish = async (values: LoginParams) => {
    setLoading(true);
    try {
      const result = await login(values);
      doLogin(result.token, {
        userId: result.userId,
        username: result.username,
        realName: result.realName,
        roleCode: result.roleCode,
        employeeId: result.employeeId,
      });
    } catch (err: any) {
      // 错误已在 request 拦截器中统一提示
    } finally {
      setLoading(false);
    }
  };

  /** 开发模式登录 — 模拟 ADMIN 角色 */
  const devLogin = (roleCode: string, realName: string) => {
    doLogin(DEV_TOKEN, {
      userId: 1,
      username: 'admin',
      realName,
      roleCode,
      employeeId: 1,
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>HRMS 人力资源管理系统</h2>
        <Form
          name="login"
          size="large"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider plain style={{ fontSize: 12, color: '#999' }}>
          开发模式（后端未启动时使用）
        </Divider>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button block onClick={() => devLogin('ROLE_ADMIN', '系统管理员')}>
            ADMIN — 系统管理员
          </Button>
          <Button block onClick={() => devLogin('ROLE_HR', 'HR 专员')}>
            HR — 人事专员
          </Button>
          <Button block onClick={() => devLogin('ROLE_MANAGER', '部门主管')}>
            MANAGER — 部门主管
          </Button>
          <Button block onClick={() => devLogin('ROLE_FINANCE', '财务专员')}>
            FINANCE — 财务
          </Button>
          <Button block onClick={() => devLogin('ROLE_EMPLOYEE', '普通员工')}>
            EMPLOYEE — 普通员工
          </Button>
        </div>
      </div>
    </div>
  );
}
