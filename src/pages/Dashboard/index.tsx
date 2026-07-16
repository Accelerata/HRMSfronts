/**
 * 首页工作台
 *
 * 展示当前用户的概览信息（待实现具体统计卡片和快捷入口）。
 */

import { Card, Row, Col, Statistic, Typography } from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  AuditOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import { ROLE_CODE_MAP } from '@/utils/constants';

const { Title } = Typography;

export default function Dashboard() {
  const { currentUser } = useUserStore();
  const roleName = currentUser?.roleCode
    ? ROLE_CODE_MAP[currentUser.roleCode] || currentUser.roleCode
    : '';

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        欢迎回来，{currentUser?.realName || currentUser?.username}
        <span style={{ fontSize: 14, color: '#999', marginLeft: 12 }}>
          {roleName}
        </span>
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理审批"
              value={0}
              prefix={<AuditOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日打卡"
              value="--"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="部门人数"
              value={0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月薪资"
              value="--"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
