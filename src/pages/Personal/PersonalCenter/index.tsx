/**
 * 个人中心页面
 *
 * 按 spec: personal-center，包含四个 Tab：
 *   1. 我的档案 — ProDescriptions + 字段级可编辑性标识 + 编辑弹窗
 *   2. 考勤日历 — 月度日历 + 状态色块 + 请假 Popover
 *   3. 薪资趋势 — AntV 折线图 (netPay 12个月)
 *   4. 我的工资条 — 快捷入口跳转
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Tabs,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Spin,
  Empty,
  Popover,
  Tag,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  LockOutlined,
  CalendarOutlined,
  DollarOutlined,
  IdcardOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  BankOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  NumberOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import {
  getProfile,
  updateProfile,
  getAttendanceCalendar,
  getSalaryTrend,
} from '@/services/personal';
import type {
  PersonalProfile,
  PersonalProfileResponse,
  AttendanceCalendarDay,
  SalaryTrendItem,
} from '@/services/personal';
import SensitiveText from '@/components/SensitiveText';
import {
  EMPLOYEE_STATUS_MAP,
  getStatusColor,
  GENDER_MAP,
  ATTENDANCE_DAY_STATUS_MAP,
} from '@/utils/constants';
import { useUserStore } from '@/models/user';

// ======================== 考勤日历颜色映射 ========================
// 统一使用与 Records/index.tsx 一致的 Ant Design token 颜色名称
// NORMAL=green, LATE=orange, EARLY=yellow, ABSENT/MISSING=red, LEAVE=blue, WEEKEND/FUTURE=default

const ATTENDANCE_TAG_COLOR: Record<string, string> = {
  NORMAL: 'green',
  LATE: 'orange',
  EARLY: 'gold',
  ABSENT: 'red',
  MISSING: 'red',
  LEAVE: 'blue',
  WEEKEND: 'default',
  FUTURE: 'default',
};

const ATTENDANCE_BG_COLOR: Record<string, string> = {
  NORMAL: '#f6ffed',
  LATE: '#fff7e6',
  EARLY: '#fffbe6',
  ABSENT: '#fff2f0',
  MISSING: '#fafafa',
  LEAVE: '#e6f7ff',
  WEEKEND: '#f5f5f5',
  FUTURE: '#ffffff',
};

// ======================== 主组件 ========================

export default function PersonalCenter() {
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<PersonalProfileResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [calendarData, setCalendarData] = useState<AttendanceCalendarDay[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(dayjs());
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [salaryTrendData, setSalaryTrendData] = useState<SalaryTrendItem[]>([]);
  const [salaryTrendLoading, setSalaryTrendLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [form] = Form.useForm();

  // ---- 加载个人档案 ----
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfileData(data);
    } catch {
      // error handled by interceptor
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- 加载考勤日历 ----
  const loadCalendar = useCallback(async (month: Dayjs) => {
    setCalendarLoading(true);
    try {
      const yearMonth = month.format('YYYY-MM');
      const data = await getAttendanceCalendar(yearMonth);
      setCalendarData(data);
    } catch {
      setCalendarData([]);
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  // ---- 加载薪资趋势 ----
  const loadSalaryTrend = useCallback(async () => {
    setSalaryTrendLoading(true);
    try {
      const data = await getSalaryTrend();
      setSalaryTrendData(data);
    } catch {
      setSalaryTrendData([]);
    } finally {
      setSalaryTrendLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (activeTab === 'calendar') {
      loadCalendar(calendarMonth);
    }
  }, [activeTab, calendarMonth, loadCalendar]);

  useEffect(() => {
    if (activeTab === 'salary') {
      loadSalaryTrend();
    }
  }, [activeTab, loadSalaryTrend]);

  // ---- 编辑弹窗 ----
  const handleEditOpen = useCallback(() => {
    if (!profileData) return;
    const p = profileData.profile;
    form.setFieldsValue({
      email: p.email,
      currentAddress: p.currentAddress,
      registeredAddress: p.registeredAddress,
      birthday: p.birthday ? dayjs(p.birthday) : undefined,
    });
    setEditOpen(true);
  }, [profileData, form]);

  const handleEditSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setEditLoading(true);
      await updateProfile({
        email: values.email,
        currentAddress: values.currentAddress,
        registeredAddress: values.registeredAddress,
        birthday: values.birthday ? dayjs(values.birthday).format('YYYY-MM-DD') : undefined,
      });
      message.success('个人信息更新成功');
      setEditOpen(false);
      loadProfile();
    } catch (err: any) {
      if (err?.errorFields) return; // 表单校验失败
      // error handled by interceptor
    } finally {
      setEditLoading(false);
    }
  }, [form, loadProfile]);

  // ---- 可编辑字段判断 ----
  const isEditable = useCallback(
    (field: string) => {
      return profileData?.editability?.[field]?.editable ?? false;
    },
    [profileData],
  );

  const lockReason = useCallback(
    (field: string) => {
      return profileData?.editability?.[field]?.lockReason;
    },
    [profileData],
  );

  // ---- 渲染字段图标（编辑/锁定） ----
  const renderFieldIcon = (field: string) => {
    if (isEditable(field)) {
      return <EditOutlined style={{ color: '#52c41a', marginLeft: 4, fontSize: 12 }} />;
    }
    const reason = lockReason(field);
    return (
      <Tooltip title={reason || '不可编辑'}>
        <LockOutlined style={{ color: '#bfbfbf', marginLeft: 4, fontSize: 12 }} />
      </Tooltip>
    );
  };

  // ---- 考勤日历渲染 ----
  const calendarGrid = useMemo(() => {
    if (!calendarData.length) return <Empty description="暂无考勤数据" />;

    const startOfMonth = calendarMonth.startOf('month');
    const endOfMonth = calendarMonth.endOf('month');
    const startDayOfWeek = startOfMonth.day(); // 0=周日
    const daysInMonth = endOfMonth.date();

    // 构建日期索引
    const dayMap = new Map<string, AttendanceCalendarDay>();
    calendarData.forEach((d) => dayMap.set(d.date, d));

    const cells: React.ReactNode[] = [];

    // 星期头
    const weekHeaders = ['日', '一', '二', '三', '四', '五', '六'];
    weekHeaders.forEach((w, i) => {
      cells.push(
        <div
          key={`header-${i}`}
          style={{
            textAlign: 'center',
            fontWeight: 600,
            padding: '4px 0',
            fontSize: 13,
            color: '#666',
            borderBottom: '2px solid #f0f0f0',
          }}
        >
          {w}
        </div>,
      );
    });

    // 填充上月的空白格
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(<div key={`empty-start-${i}`} style={{ minHeight: 64 }} />);
    }

    // 日期格子
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = calendarMonth.date(day).format('YYYY-MM-DD');
      const record = dayMap.get(dateStr);
      const status = record?.status || 'FUTURE';
      const bgColor = ATTENDANCE_BG_COLOR[status] || ATTENDANCE_BG_COLOR.FUTURE;

      const cellContent = (
        <div
          style={{
            minHeight: 64,
            padding: '4px 6px',
            border: '1px solid #f0f0f0',
            backgroundColor: bgColor,
            cursor: status === 'LEAVE' ? 'pointer' : 'default',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{day}</span>
          <Tag
            color={ATTENDANCE_TAG_COLOR[status]}
            style={{ fontSize: 10, marginTop: 4, lineHeight: '16px' }}
          >
            {ATTENDANCE_DAY_STATUS_MAP[status] || status}
          </Tag>
        </div>
      );

      if (status === 'LEAVE' && record?.leaveDetail) {
        const detail = record.leaveDetail;
        cells.push(
          <Popover
            key={`day-${day}`}
            title="请假详情"
            content={
              <div style={{ maxWidth: 260 }}>
                <p style={{ margin: '4px 0' }}>
                  <strong>类型：</strong>
                  {detail.leaveTypeName}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>事由：</strong>
                  {detail.reason || '--'}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>申请ID：</strong>
                  <a onClick={() => navigate(`/leave/my?appId=${detail.applicationId}`)}>
                    {detail.applicationId}
                  </a>
                </p>
              </div>
            }
          >
            {cellContent}
          </Popover>,
        );
      } else {
        cells.push(<div key={`day-${day}`}>{cellContent}</div>);
      }
    }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0,
        }}
      >
        {cells}
      </div>
    );
  }, [calendarData, calendarMonth, navigate]);

  // ---- 薪资趋势图配置 ----
  const salaryTrendConfig = useMemo(() => {
    if (!salaryTrendData.length) return null;

    return {
      data: salaryTrendData,
      xField: 'yearMonth',
      yField: 'netPay',
      smooth: true,
      point: {
        size: 5,
        shape: 'circle',
      },
      label: {
        style: {
          fill: '#666',
          fontSize: 11,
        },
      },
      lineStyle: {
        stroke: '#1890ff',
        lineWidth: 3,
      },
      areaStyle: {
        fill: 'l(270) 0:#ffffff 1:rgba(24,144,255,0.15)',
      },
      tooltip: {
        formatter: (datum: SalaryTrendItem) => ({
          name: '实发工资',
          value: `¥${datum.netPay.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
        }),
      },
      yAxis: {
        label: {
          formatter: (v: string) => `¥${Number(v).toLocaleString()}`,
        },
      },
      xAxis: {
        label: { rotate: -Math.PI / 6 },
      },
    };
  }, [salaryTrendData]);

  // ======================== Tab 内容 ========================

  const profileTab = (
    <Spin spinning={loading}>
      {profileData ? (
        <>
          <Descriptions
            title={
              <span>
                <IdcardOutlined /> 基本信息
              </span>
            }
            column={2}
            bordered
            size="middle"
            style={{ marginBottom: 24 }}
            extra={
              <Button type="primary" icon={<EditOutlined />} onClick={handleEditOpen}>
                编辑个人信息
              </Button>
            }
          >
            <Descriptions.Item label="姓名">
              {profileData.profile.name} {renderFieldIcon('name')}
            </Descriptions.Item>
            <Descriptions.Item label="工号">
              {profileData.profile.employeeNo} {renderFieldIcon('employeeNo')}
            </Descriptions.Item>
            <Descriptions.Item label="手机号">
              <SensitiveText text={profileData.profile.phone} type="phone" />{' '}
              {renderFieldIcon('phone')}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">
              {profileData.profile.email || '--'} {renderFieldIcon('email')}
            </Descriptions.Item>
            <Descriptions.Item label="部门">
              {profileData.profile.deptName} {renderFieldIcon('deptId')}
            </Descriptions.Item>
            <Descriptions.Item label="职位">
              {profileData.profile.positionName} {renderFieldIcon('positionId')}
            </Descriptions.Item>
            <Descriptions.Item label="职级">
              {profileData.profile.grade || '--'} {renderFieldIcon('grade')}
            </Descriptions.Item>
            <Descriptions.Item label="性别">
              {profileData.profile.gender ? GENDER_MAP[profileData.profile.gender] : '--'}{' '}
              {renderFieldIcon('gender')}
            </Descriptions.Item>
            <Descriptions.Item label="出生日期">
              {profileData.profile.birthday || '--'} {renderFieldIcon('birthday')}
            </Descriptions.Item>
            <Descriptions.Item label="入职日期">
              {profileData.profile.entryDate || '--'} {renderFieldIcon('entryDate')}
            </Descriptions.Item>
            <Descriptions.Item label="工作地点">
              {profileData.profile.workLocation || '--'} {renderFieldIcon('workLocation')}
            </Descriptions.Item>
            <Descriptions.Item label="直属上级">
              {profileData.profile.reportToName || '--'} {renderFieldIcon('reportTo')}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(profileData.profile.status)}>
                {EMPLOYEE_STATUS_MAP[profileData.profile.status] || profileData.profile.status}
              </Tag>
              {renderFieldIcon('status')}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions
            title={
              <span>
                <BankOutlined /> 薪资与银行信息
              </span>
            }
            column={2}
            bordered
            size="middle"
            style={{ marginBottom: 24 }}
          >
            <Descriptions.Item label="基本薪资">
              {profileData.profile.baseSalary != null
                ? `¥${profileData.profile.baseSalary.toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                  })}`
                : '--'}{' '}
              {renderFieldIcon('baseSalary')}
            </Descriptions.Item>
            <Descriptions.Item label="银行账号">
              <SensitiveText
                text={profileData.profile.bankAccount}
                type="bankAccount"
              />{' '}
              {renderFieldIcon('bankAccount')}
            </Descriptions.Item>
            <Descriptions.Item label="开户行">
              {profileData.profile.bankName || '--'} {renderFieldIcon('bankName')}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions
            title={
              <span>
                <HomeOutlined /> 地址信息
              </span>
            }
            column={2}
            bordered
            size="middle"
          >
            <Descriptions.Item label="现居住地址">
              {profileData.profile.currentAddress || '--'}{' '}
              {renderFieldIcon('currentAddress')}
            </Descriptions.Item>
            <Descriptions.Item label="户籍地址">
              {profileData.profile.registeredAddress || '--'}{' '}
              {renderFieldIcon('registeredAddress')}
            </Descriptions.Item>
          </Descriptions>
        </>
      ) : (
        <Empty description="暂无档案信息，请确认是否已关联员工身份" />
      )}
    </Spin>
  );

  const calendarTab = (
    <Spin spinning={calendarLoading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button
          onClick={() => setCalendarMonth((m) => m.subtract(1, 'month'))}
          icon={<RightOutlined style={{ transform: 'rotate(180deg)' }} />}
        >
          上月
        </Button>
        <h3 style={{ margin: 0 }}>{calendarMonth.format('YYYY年 M月')}</h3>
        <Button
          onClick={() => setCalendarMonth((m) => m.add(1, 'month'))}
          icon={<RightOutlined />}
        >
          下月
        </Button>
      </div>

      {/* 图例 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        {Object.entries(ATTENDANCE_TAG_COLOR).map(([key, color]) => (
          <Tag key={key} color={color} style={{ fontSize: 12 }}>
            {ATTENDANCE_DAY_STATUS_MAP[key] || key}
          </Tag>
        ))}
      </div>

      {calendarGrid}
    </Spin>
  );

  const salaryTab = (
    <Spin spinning={salaryTrendLoading}>
      {salaryTrendData.length > 0 ? (
        <div style={{ padding: '16px 0' }}>
          <h3 style={{ marginBottom: 24 }}>
            <DollarOutlined /> 近12个月实发工资趋势
          </h3>
          <div style={{ height: 400 }}>
            {salaryTrendConfig && <Line {...salaryTrendConfig} />}
          </div>
        </div>
      ) : (
        <Empty description="暂无薪资趋势数据" />
      )}
    </Spin>
  );

  const payslipTab = (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <FileTextOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 24 }} />
      <h3>查看您的工资条</h3>
      <p style={{ color: '#666', marginBottom: 24 }}>
        工资条包含每月薪资明细，查看需要二次密码验证
      </p>
      <Button
        type="primary"
        size="large"
        icon={<RightOutlined />}
        onClick={() => navigate('/salary/payslips')}
      >
        前往我的工资条
      </Button>
    </div>
  );

  // ======================== Tabs ========================

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <IdcardOutlined /> 我的档案
        </span>
      ),
      children: profileTab,
    },
    {
      key: 'calendar',
      label: (
        <span>
          <CalendarOutlined /> 考勤日历
        </span>
      ),
      children: calendarTab,
    },
    {
      key: 'salary',
      label: (
        <span>
          <DollarOutlined /> 薪资趋势
        </span>
      ),
      children: salaryTab,
    },
    {
      key: 'payslip',
      label: (
        <span>
          <FileTextOutlined /> 我的工资条
        </span>
      ),
      children: payslipTab,
    },
  ];

  return (
    <>
      <Card title="个人中心" bordered={false}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
      </Card>

      {/* 编辑个人信息弹窗（仅4个可编辑字段） */}
      <Modal
        title="编辑个人信息"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleEditSubmit}
        confirmLoading={editLoading}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <div style={{ padding: '8px 0 16px', color: '#666', fontSize: 13 }}>
          仅以下四个字段可自行修改，其他字段如需修改请联系 HR
        </div>
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱" allowClear />
          </Form.Item>
          <Form.Item name="birthday" label="出生日期">
            <DatePicker style={{ width: '100%' }} placeholder="请选择出生日期" />
          </Form.Item>
          <Form.Item name="currentAddress" label="现居住地址">
            <Input
              prefix={<EnvironmentOutlined />}
              placeholder="请输入现居住地址"
              allowClear
            />
          </Form.Item>
          <Form.Item name="registeredAddress" label="户籍地址">
            <Input
              prefix={<HomeOutlined />}
              placeholder="请输入户籍地址"
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
