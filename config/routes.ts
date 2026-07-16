/**
 * HRMS 完整路由表
 *
 * 权限策略 (roleCode → 菜单可见性):
 *   ADMIN   — 全部菜单与操作
 *   HR      — 除审计日志外全部可见
 *   MANAGER — 仅本部门相关模块（组织/员工/考勤/请假/异动/审批）
 *   FINANCE — 仅薪资相关模块
 *   EMPLOYEE— 仅个人相关模块（打卡/请假/个人中心/工资条）
 */
export default [
  {
    path: '/',
    component: '@/layouts/BasicLayout',
    // 不在菜单中显示根布局
    routes: [
      // ======================== 首页 ========================
      {
        path: '/',
        redirect: '/dashboard',
      },
      {
        name: '首页工作台',
        path: '/dashboard',
        icon: 'DashboardOutlined',
        component: './Dashboard',
        access: 'canAccessDashboard',
      },

      // ======================== 组织管理 ========================
      {
        name: '组织管理',
        path: '/organization',
        icon: 'ClusterOutlined',
        access: 'canAccessOrg',
        routes: [
          {
            path: '/organization',
            redirect: '/organization/dept',
          },
          {
            name: '部门管理',
            path: '/organization/dept',
            component: './Organization/DeptManagement',
            access: 'canAccessDept',
          },
          {
            name: '职位管理',
            path: '/organization/position',
            component: './Organization/PositionManagement',
            access: 'canAccessPosition',
          },
        ],
      },

      // ======================== 员工档案 ========================
      {
        name: '员工档案',
        path: '/employee',
        icon: 'UserOutlined',
        component: './Employee/EmployeeList',
        access: 'canAccessEmployee',
      },

      // ======================== 考勤管理 ========================
      {
        name: '考勤管理',
        path: '/attendance',
        icon: 'ClockCircleOutlined',
        access: 'canAccessAttendance',
        routes: [
          {
            path: '/attendance',
            redirect: '/attendance/punch',
          },
          {
            name: '打卡签到',
            path: '/attendance/punch',
            component: './Attendance/Punch',
            access: 'canAccessPunch',
          },
          {
            name: '打卡记录',
            path: '/attendance/records',
            component: './Attendance/Records',
            access: 'canAccessPunchRecord',
          },
          {
            name: '考勤统计',
            path: '/attendance/statistics',
            component: './Attendance/Statistics',
            access: 'canAccessAttendanceStats',
          },
          {
            name: '补卡管理',
            path: '/attendance/supplementary-card',
            component: './Attendance/SupplementaryCard',
            access: 'canAccessSuppCard',
          },
          {
            name: '调休管理',
            path: '/attendance/comp-leave',
            component: './Attendance/CompLeave',
            access: 'canAccessCompLeave',
          },
          {
            name: '考勤组管理',
            path: '/attendance/groups',
            component: './Attendance/AttendanceGroups',
            access: 'canAccessAttendanceGroup',
          },
          {
            name: '工作日历',
            path: '/attendance/work-calendar',
            component: './Attendance/WorkCalendar',
            access: 'canAccessCalendar',
          },
        ],
      },

      // ======================== 请假管理 ========================
      {
        name: '请假管理',
        path: '/leave',
        icon: 'CalendarOutlined',
        access: 'canAccessLeave',
        routes: [
          {
            path: '/leave',
            redirect: '/leave/apply',
          },
          {
            name: '请假申请',
            path: '/leave/apply',
            component: './Leave/LeaveApply',
            access: 'canAccessLeaveApply',
          },
          {
            name: '我的请假',
            path: '/leave/my',
            component: './Leave/MyLeaves',
            access: 'canAccessMyLeave',
          },
          {
            name: '请假审批',
            path: '/leave/approval',
            component: './Leave/LeaveApproval',
            access: 'canAccessLeaveApprove',
          },
          {
            name: '假期余额',
            path: '/leave/balance',
            component: './Leave/LeaveBalance',
            access: 'canAccessLeaveBalance',
          },
          {
            name: '请假统计',
            path: '/leave/statistics',
            component: './Leave/LeaveStatistics',
            access: 'canAccessLeaveStats',
          },
        ],
      },

      // ======================== 人事异动 ========================
      {
        name: '人事异动',
        path: '/transfer',
        icon: 'SwapOutlined',
        access: 'canAccessTransfer',
        routes: [
          {
            path: '/transfer',
            redirect: '/transfer/onboarding',
          },
          {
            name: '入职管理',
            path: '/transfer/onboarding',
            component: './Onboarding/OnboardingList',
            access: 'canAccessOnboarding',
          },
          {
            name: '转正管理',
            path: '/transfer/regularization',
            component: './Regularization/RegularizationList',
            access: 'canAccessRegularization',
          },
          {
            name: '调岗管理',
            path: '/transfer/job-transfer',
            component: './Transfer/TransferList',
            access: 'canAccessJobTransfer',
          },
          {
            name: '离职管理',
            path: '/transfer/resignation',
            component: './Resignation/ResignationList',
            access: 'canAccessResignation',
          },
        ],
      },

      // ======================== 审批工作台 ========================
      {
        name: '审批工作台',
        path: '/approval',
        icon: 'AuditOutlined',
        component: './Approval/ApprovalWorkbench',
        access: 'canAccessApproval',
      },

      // ======================== 薪资管理 ========================
      {
        name: '薪资管理',
        path: '/salary',
        icon: 'DollarOutlined',
        access: 'canAccessSalary',
        routes: [
          {
            path: '/salary',
            redirect: '/salary/calc',
          },
          {
            name: '薪资核算',
            path: '/salary/calc',
            component: './Salary/SalaryCalc',
            access: 'canAccessSalaryCalc',
          },
          {
            name: '薪资批次',
            path: '/salary/batches',
            component: './Salary/SalaryBatches',
            access: 'canAccessSalaryBatch',
          },
          {
            name: '薪资记录',
            path: '/salary/records',
            component: './Salary/SalaryRecords',
            access: 'canAccessSalaryRecord',
          },
          {
            name: '薪资账套',
            path: '/salary/accounts',
            component: './Salary/SalaryAccounts',
            access: 'canAccessSalaryAccount',
          },
          {
            name: '薪资方案',
            path: '/salary/plans',
            component: './Salary/SalaryPlans',
            access: 'canAccessSalaryPlan',
          },
          {
            name: '薪资报表',
            path: '/salary/reports',
            component: './Salary/SalaryReports',
            access: 'canAccessSalaryReport',
          },
          {
            name: '我的工资条',
            path: '/salary/payslips',
            component: './Salary/MyPayslips',
            access: 'canAccessPayslip',
          },
        ],
      },

      // ======================== 个人中心 ========================
      {
        name: '个人中心',
        path: '/personal',
        icon: 'IdcardOutlined',
        component: './Personal/PersonalCenter',
        access: 'canAccessPersonal',
      },

      // ======================== 审计日志 ========================
      {
        name: '审计日志',
        path: '/audit',
        icon: 'SafetyOutlined',
        component: './Audit/AuditLog',
        access: 'canAccessAudit',
      },
    ],
  },

  // ======================== 独立登录页 ========================
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user/login',
        component: './User/Login',
      },
    ],
  },

  // 404 兜底
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
