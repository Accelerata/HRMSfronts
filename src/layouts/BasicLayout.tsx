/**
 * 全局基础布局
 *
 * 直接使用 ProLayout 渲染侧边栏菜单和顶栏用户下拉。
 * 通过 useAccessMarkedRoutes 对路由进行权限过滤。
 * 路由从 config/routes.ts 直接导入，不依赖 Umi Plugin Layout 的自动路由处理。
 */

import { ProLayout, PageContainer } from '@ant-design/pro-components';
import { Outlet, useNavigate, useLocation } from '@umijs/max';
import { Dropdown, Avatar, Space } from 'antd';
import {
  AuditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ClusterOutlined,
  DashboardOutlined,
  DollarOutlined,
  IdcardOutlined,
  SafetyOutlined,
  SwapOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import { useAccessMarkedRoutes } from '@@/plugin-access';
import type { IRoute } from '@umijs/max';
import { useState, useCallback, useEffect, useMemo } from 'react';
import ChangePasswordModal from '@/components/ChangePasswordModal';

// 从路由配置中取出菜单路由（routes[0] 是根路由 "/"）
import routeConfig from '../../config/routes';

const routeIconMap = {
  AuditOutlined: <AuditOutlined />,
  CalendarOutlined: <CalendarOutlined />,
  ClockCircleOutlined: <ClockCircleOutlined />,
  ClusterOutlined: <ClusterOutlined />,
  DashboardOutlined: <DashboardOutlined />,
  DollarOutlined: <DollarOutlined />,
  IdcardOutlined: <IdcardOutlined />,
  SafetyOutlined: <SafetyOutlined />,
  SwapOutlined: <SwapOutlined />,
  UserOutlined: <UserOutlined />,
};

type RouteWithStringIcon = IRoute & {
  icon?: keyof typeof routeIconMap | React.ReactNode;
  routes?: RouteWithStringIcon[];
  children?: RouteWithStringIcon[];
};

function attachRouteIcons(route: RouteWithStringIcon): IRoute {
  const icon = typeof route.icon === 'string' ? routeIconMap[route.icon] : route.icon;

  return {
    ...route,
    icon,
    routes: route.routes?.map(attachRouteIcons),
    children: route.children?.map(attachRouteIcons),
  };
}

export default function BasicLayout() {
  const { currentUser, logout, restore } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // 页面刷新后从 localStorage 恢复登录态
  useEffect(() => {
    restore();
  }, [restore]);

  // 用 useAccessMarkedRoutes 做权限过滤
  const [filteredRoute] = useAccessMarkedRoutes(
    useMemo(() => {
      // routeConfig[0] 是 { path: '/', component: '...', routes: [...] }
      const root = routeConfig[0] as IRoute;
      const menuRoutes = root?.routes || root?.children || [];
      return [{ path: '/', routes: menuRoutes } as IRoute];
    }, [])
  );
  const routeWithIcons = useMemo(
    () => attachRouteIcons(filteredRoute as RouteWithStringIcon),
    [filteredRoute]
  );

  const handleMenuClick = useCallback((key: string) => {
    if (key === 'logout') {
      logout();
    } else if (key === 'changePassword') {
      setPasswordModalOpen(true);
    }
  }, [logout]);

  const userDropdownItems = [
    {
      key: 'changePassword',
      icon: <KeyOutlined />,
      label: '修改密码',
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  return (
    <ProLayout
      title="HRMS"
      logo={false}
      layout="side"
      navTheme="light"
      contentWidth="Fluid"
      fixedHeader
      fixSiderbar
      location={location}
      route={routeWithIcons}
      menu={{ defaultOpenAll: false }}
      avatarProps={{
        icon: <UserOutlined />,
        title: currentUser?.realName || currentUser?.username || '用户',
        render: (_: any, dom: any) => (
          <Dropdown
            menu={{
              items: userDropdownItems,
              onClick: ({ key }) => handleMenuClick(key),
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{currentUser?.realName || currentUser?.username || '用户'}</span>
            </Space>
          </Dropdown>
        ),
      }}
      menuItemRender={(item, dom) => (
        <div onClick={() => item.path && navigate(item.path)} style={{ cursor: 'pointer' }}>
          {dom}
        </div>
      )}
    >
      <PageContainer>
        <Outlet />
      </PageContainer>

      {/* 修改密码弹窗 */}
      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </ProLayout>
  );
}
