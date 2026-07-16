/**
 * HRMS 枚举常量
 *
 * 数据来源：/HRMS/docs/api文档.md 附录 & 各接口字段说明
 */

// ======================== 员工状态 ========================
/** 员工状态（API 附录：Employee Status） */
export const EMPLOYEE_STATUS = {
  /** 待入职 */
  PENDING: 0,
  /** 试用期 */
  PROBATION: 1,
  /** 正式 */
  REGULAR: 2,
  /** 待离职 */
  RESIGNING: 3,
  /** 已离职 */
  RESIGNED: 4,
} as const;

export const EMPLOYEE_STATUS_MAP: Record<number, string> = {
  0: '待入职',
  1: '试用期',
  2: '正式',
  3: '待离职',
  4: '已离职',
};

// ======================== 假期类型 ========================
/** 假期类型（API 附录：Leave Type） */
export const LEAVE_TYPE = {
  /** 年假 */
  ANNUAL: 1,
  /** 调休 */
  COMPENSATORY: 2,
  /** 事假 */
  PERSONAL: 3,
  /** 病假 */
  SICK: 4,
  /** 婚假 */
  MARRIAGE: 5,
  /** 产假 */
  MATERNITY: 6,
  /** 丧假 */
  FUNERAL: 7,
} as const;

export const LEAVE_TYPE_MAP: Record<number, string> = {
  1: '年假',
  2: '调休',
  3: '事假',
  4: '病假',
  5: '婚假',
  6: '产假',
  7: '丧假',
};

// ======================== 审批动作 ========================
/** 审批动作（API 附录：Approval Action） */
export const APPROVAL_ACTION = {
  /** 通过 */
  APPROVE: 1,
  /** 拒绝 */
  REJECT: 2,
  /** 退回 */
  RETURN: 3,
} as const;

export const APPROVAL_ACTION_MAP: Record<number, string> = {
  1: '通过',
  2: '拒绝',
  3: '退回',
};

// ======================== 审批业务类型 ========================
/** 审批业务类型（API 附录：Business Type） */
export const BUSINESS_TYPE = {
  /** 请假申请 */
  LEAVE: 1,
  /** 入职申请 */
  ONBOARDING: 2,
  /** 转正申请 */
  REGULARIZATION: 3,
  /** 调岗申请 */
  TRANSFER: 4,
  /** 离职申请 */
  RESIGNATION: 5,
  /** 补卡申请 */
  SUPPLEMENTARY_CARD: 6,
  /** 薪资批次 */
  SALARY_BATCH: 7,
} as const;

export const BUSINESS_TYPE_MAP: Record<number, string> = {
  1: '请假申请',
  2: '入职申请',
  3: '转正申请',
  4: '调岗申请',
  5: '离职申请',
  6: '补卡申请',
  7: '薪资批次',
};

// ======================== 打卡类型 ========================
/** 打卡类型 */
export const CARD_TYPE = {
  /** 上班卡 */
  PUNCH_IN: 1,
  /** 下班卡 */
  PUNCH_OUT: 2,
} as const;

export const CARD_TYPE_MAP: Record<number, string> = {
  1: '上班卡',
  2: '下班卡',
};

// ======================== 考勤组类型 ========================
/** 考勤组类型（API 5.4） */
export const ATTENDANCE_GROUP_TYPE = {
  /** 固定班 */
  FIXED: 1,
  /** 弹性班 */
  FLEXIBLE: 2,
  /** 排班制 */
  SCHEDULED: 3,
} as const;

export const ATTENDANCE_GROUP_TYPE_MAP: Record<number, string> = {
  1: '固定班',
  2: '弹性班',
  3: '排班制',
};

// ======================== 补卡状态 ========================
/** 补卡状态（API 7.1） */
export const SUPPLEMENTARY_CARD_STATUS = {
  /** 草稿 */
  DRAFT: 0,
  /** 审批中 */
  PENDING: 1,
  /** 已通过 */
  APPROVED: 2,
  /** 已拒绝 */
  REJECTED: 3,
} as const;

export const SUPPLEMENTARY_CARD_STATUS_MAP: Record<number, string> = {
  0: '草稿',
  1: '审批中',
  2: '已通过',
  3: '已拒绝',
};

// ======================== 请假申请状态 ========================
/** 请假申请状态 */
export const LEAVE_APPLICATION_STATUS = {
  /** 草稿 */
  DRAFT: 0,
  /** 审批中 */
  PENDING: 1,
  /** 已通过 */
  APPROVED: 2,
  /** 已拒绝 */
  REJECTED: 3,
  /** 已取消 */
  CANCELLED: 4,
} as const;

export const LEAVE_APPLICATION_STATUS_MAP: Record<number, string> = {
  0: '草稿',
  1: '审批中',
  2: '已通过',
  3: '已拒绝',
  4: '已取消',
};

// ======================== 入职申请状态 ========================
/** 入职申请状态 */
export const ONBOARDING_STATUS = {
  /** 草稿 */
  DRAFT: 0,
  /** 审批中 */
  PENDING: 1,
  /** 已通过（待入职） */
  APPROVED: 2,
  /** 已入职 */
  ONBOARDED: 3,
  /** 已拒绝 */
  REJECTED: 4,
  /** 已撤回 */
  WITHDRAWN: 5,
  /** 已放弃 */
  ABANDONED: 6,
} as const;

export const ONBOARDING_STATUS_MAP: Record<number, string> = {
  0: '草稿',
  1: '审批中',
  2: '待入职',
  3: '已入职',
  4: '已拒绝',
  5: '已撤回',
  6: '已放弃',
};

// ======================== 转正审批结果类型 ========================
/** 转正审批结果类型（API 14.4） */
export const REGULARIZATION_RESULT_TYPE = {
  /** 通过转正 */
  PASS: 1,
  /** 延长试用 */
  EXTEND: 2,
  /** 不通过辞退 */
  DISMISS: 3,
} as const;

export const REGULARIZATION_RESULT_TYPE_MAP: Record<number, string> = {
  1: '通过转正',
  2: '延长试用',
  3: '不通过辞退',
};

// ======================== 离职类型 ========================
/** 离职类型（API 16.3） */
export const RESIGNATION_TYPE = {
  /** 主动离职 */
  VOLUNTARY: 1,
  /** 被动离职 */
  INVOLUNTARY: 2,
  /** 协商离职 */
  NEGOTIATED: 3,
} as const;

export const RESIGNATION_TYPE_MAP: Record<number, string> = {
  1: '主动离职',
  2: '被动离职',
  3: '协商离职',
};

// ======================== 调岗双审批角色 ========================
/** 调岗审批角色（API 15.4） */
export const TRANSFER_APPROVAL_ROLE = {
  /** 原部门负责人 */
  OLD: 'old',
  /** 新部门负责人 */
  NEW: 'new',
} as const;

// ======================== 薪资批次状态 ========================
/** 薪资批次状态（API 附录） */
export const SALARY_BATCH_STATUS = {
  /** 草稿 */
  DRAFT: 'DRAFT',
  /** 待审批 */
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  /** 已审批 */
  APPROVED: 'APPROVED',
  /** 已发放 */
  PAID: 'PAID',
  /** 已归档 */
  ARCHIVED: 'ARCHIVED',
} as const;

export const SALARY_BATCH_STATUS_MAP: Record<string, string> = {
  DRAFT: '草稿',
  PENDING_APPROVAL: '待审批',
  APPROVED: '已审批',
  PAID: '已发放',
  ARCHIVED: '已归档',
};

// ======================== 薪资方案工资项 ========================
/** 工资项类型（API 20.7） */
export const SALARY_ITEM_TYPE = {
  BASE: 'BASE',
  BONUS: 'BONUS',
  ALLOWANCE: 'ALLOWANCE',
  DEDUCTION: 'DEDUCTION',
  INSURANCE: 'INSURANCE',
  FUND: 'FUND',
  TAX: 'TAX',
} as const;

export const SALARY_ITEM_TYPE_MAP: Record<string, string> = {
  BASE: '基本工资',
  BONUS: '奖金',
  ALLOWANCE: '补贴',
  DEDUCTION: '扣款',
  INSURANCE: '社保',
  FUND: '公积金',
  TAX: '个税',
};

/** 计算规则类型（API 20.7） */
export const CALCULATION_RULE = {
  FIXED: 'FIXED',
  RATIO: 'RATIO',
  FORMULA: 'FORMULA',
} as const;

export const CALCULATION_RULE_MAP: Record<string, string> = {
  FIXED: '固定金额',
  RATIO: '比例计算',
  FORMULA: '公式计算',
};

// ======================== 考勤状态 ========================
/** 考勤日历状态（API 21.3） */
export const ATTENDANCE_DAY_STATUS = {
  NORMAL: 'NORMAL',
  LATE: 'LATE',
  EARLY: 'EARLY',
  ABSENT: 'ABSENT',
  MISSING: 'MISSING',
  LEAVE: 'LEAVE',
  WEEKEND: 'WEEKEND',
  FUTURE: 'FUTURE',
} as const;

export const ATTENDANCE_DAY_STATUS_MAP: Record<string, string> = {
  NORMAL: '正常',
  LATE: '迟到',
  EARLY: '早退',
  ABSENT: '旷工',
  MISSING: '缺卡',
  LEAVE: '请假',
  WEEKEND: '周末',
  FUTURE: '未来',
};

// ======================== 工作日历类型 ========================
/** 日历日类型（API 12.2） */
export const CALENDAR_DAY_TYPE = {
  /** 法定节假日/休息 */
  HOLIDAY: 1,
  /** 调班工作日 */
  WORKDAY_SWAP: 2,
} as const;

export const CALENDAR_DAY_TYPE_MAP: Record<number, string> = {
  1: '节假日',
  2: '调班工作日',
};

// ======================== 性别 ========================
export const GENDER = {
  /** 男 */
  MALE: 1,
  /** 女 */
  FEMALE: 2,
} as const;

export const GENDER_MAP: Record<number, string> = {
  1: '男',
  2: '女',
};

// ======================== 入职类型 ========================
export const ENTRY_TYPE = {
  /** 社会招聘 */
  SOCIAL: 1,
  /** 校园招聘 */
  CAMPUS: 2,
  /** 内部推荐 */
  REFERRAL: 3,
} as const;

export const ENTRY_TYPE_MAP: Record<number, string> = {
  1: '社会招聘',
  2: '校园招聘',
  3: '内部推荐',
};

// ======================== 职位序列 ========================
export const POSITION_SEQUENCE = {
  /** 管理 */
  M: 'M',
  /** 专业 */
  P: 'P',
  /** 支持 */
  S: 'S',
} as const;

export const POSITION_SEQUENCE_MAP: Record<string, string> = {
  M: '管理序列',
  P: '专业序列',
  S: '支持序列',
};

// ======================== 角色编码 ========================
export const ROLE_CODE = {
  ADMIN: 'ROLE_ADMIN',
  HR: 'ROLE_HR',
  MANAGER: 'ROLE_MANAGER',
  FINANCE: 'ROLE_FINANCE',
  EMPLOYEE: 'ROLE_EMPLOYEE',
} as const;

export const ROLE_CODE_MAP: Record<string, string> = {
  ROLE_ADMIN: '系统管理员',
  ROLE_HR: 'HR 专员',
  ROLE_MANAGER: '部门主管',
  ROLE_FINANCE: '财务专员',
  ROLE_EMPLOYEE: '普通员工',
};

// ======================== 权限码汇总 ========================
/** 权限码（API 附录：权限码汇总） */
export const PERMISSIONS = {
  // 员工档案
  EMP_VIEW: 'emp:view',
  EMP_CREATE: 'emp:create',
  EMP_EDIT: 'emp:edit',
  EMP_DELETE: 'emp:delete',
  EMP_ATTENDANCE_VIEW: 'emp:attendance:view',

  // 部门
  ORG_DEPT_VIEW: 'org:dept:view',
  ORG_DEPT_MANAGE: 'org:dept:manage',

  // 职位
  ORG_POSITION_VIEW: 'org:position:view',
  ORG_POSITION_MANAGE: 'org:position:manage',

  // 考勤
  ATT_RECORD_PUNCH: 'att:record:punch',
  ATT_RECORD_VIEW: 'att:record:view',
  ATT_RECORD_MANAGE: 'att:record:manage',
  ATT_GROUP_VIEW: 'att:group:view',
  ATT_GROUP_MANAGE: 'att:group:manage',
  ATT_LEAVE_VIEW: 'att:leave:view',
  ATT_LEAVE_APPLY: 'att:leave:apply',
  ATT_LEAVE_APPROVE: 'att:leave:approve',
  ATT_CARD_APPLY: 'att:card:apply',
  ATT_CARD_APPROVE: 'att:card:approve',
  ATT_CALENDAR_MANAGE: 'att:calendar:manage',

  // 异动
  ONBOARDING_MANAGE: 'onboarding:manage',
  REGULARIZATION_MANAGE: 'regularization:manage',
  TRANSFER_MANAGE: 'transfer:manage',
  RESIGNATION_MANAGE: 'resignation:manage',

  // 审批
  APPROVAL_WORKBENCH: 'approval:workbench',
  APPROVAL_VIEW: 'approval:view',

  // 薪资
  SALARY_BATCH_CALC: 'salary:batch:calc',
  SALARY_BATCH_VIEW: 'salary:batch:view',
  SALARY_BATCH_SUBMIT: 'salary:batch:submit',
  SALARY_BATCH_PAY: 'salary:batch:pay',
  SALARY_BATCH_ARCHIVE: 'salary:batch:archive',
  SALARY_CALC_APPROVE: 'salary:calc:approve',
  SALARY_CALC_VIEW: 'salary:calc:view',
  SALARY_PAYSLIP_SELF: 'salary:payslip:self',
  SALARY_ACCOUNT_VIEW: 'salary:account:view',
  SALARY_ACCOUNT_MANAGE: 'salary:account:manage',
  SALARY_PLAN_VIEW: 'salary:plan:view',
  SALARY_PLAN_MANAGE: 'salary:plan:manage',
  SALARY_REPORT_VIEW: 'salary:report:view',

  // 审计
  AUDIT_LOG_VIEW: 'audit:log:view',
  AUDIT_LOG_EXPORT: 'audit:log:export',
} as const;

// ======================== 角色 → 权限映射 ========================
/** 每个角色拥有的权限码集合 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: Object.values(PERMISSIONS),
  HR: [
    PERMISSIONS.EMP_VIEW, PERMISSIONS.EMP_CREATE, PERMISSIONS.EMP_EDIT, PERMISSIONS.EMP_DELETE,
    PERMISSIONS.EMP_ATTENDANCE_VIEW,
    PERMISSIONS.ORG_DEPT_VIEW, PERMISSIONS.ORG_DEPT_MANAGE,
    PERMISSIONS.ORG_POSITION_VIEW, PERMISSIONS.ORG_POSITION_MANAGE,
    PERMISSIONS.ATT_RECORD_VIEW, PERMISSIONS.ATT_RECORD_MANAGE,
    PERMISSIONS.ATT_GROUP_VIEW, PERMISSIONS.ATT_GROUP_MANAGE,
    PERMISSIONS.ATT_LEAVE_VIEW, PERMISSIONS.ATT_LEAVE_APPROVE,
    PERMISSIONS.ATT_CARD_APPROVE, PERMISSIONS.ATT_CALENDAR_MANAGE,
    PERMISSIONS.ONBOARDING_MANAGE, PERMISSIONS.REGULARIZATION_MANAGE,
    PERMISSIONS.TRANSFER_MANAGE, PERMISSIONS.RESIGNATION_MANAGE,
    PERMISSIONS.APPROVAL_WORKBENCH, PERMISSIONS.APPROVAL_VIEW,
    PERMISSIONS.SALARY_BATCH_CALC, PERMISSIONS.SALARY_BATCH_VIEW,
    PERMISSIONS.SALARY_BATCH_SUBMIT, PERMISSIONS.SALARY_CALC_APPROVE,
    PERMISSIONS.SALARY_CALC_VIEW, PERMISSIONS.SALARY_ACCOUNT_VIEW,
    PERMISSIONS.SALARY_ACCOUNT_MANAGE, PERMISSIONS.SALARY_PLAN_VIEW,
    PERMISSIONS.SALARY_PLAN_MANAGE, PERMISSIONS.SALARY_REPORT_VIEW,
  ],
  MANAGER: [
    PERMISSIONS.EMP_VIEW, PERMISSIONS.EMP_ATTENDANCE_VIEW,
    PERMISSIONS.ORG_DEPT_VIEW,
    PERMISSIONS.ORG_POSITION_VIEW,
    PERMISSIONS.ATT_RECORD_VIEW, PERMISSIONS.ATT_GROUP_VIEW,
    PERMISSIONS.ATT_LEAVE_VIEW, PERMISSIONS.ATT_LEAVE_APPROVE,
    PERMISSIONS.APPROVAL_WORKBENCH, PERMISSIONS.APPROVAL_VIEW,
    PERMISSIONS.ATT_CARD_APPROVE,
  ],
  FINANCE: [
    PERMISSIONS.SALARY_BATCH_CALC, PERMISSIONS.SALARY_BATCH_VIEW,
    PERMISSIONS.SALARY_BATCH_SUBMIT, PERMISSIONS.SALARY_BATCH_PAY,
    PERMISSIONS.SALARY_BATCH_ARCHIVE, PERMISSIONS.SALARY_CALC_APPROVE,
    PERMISSIONS.SALARY_CALC_VIEW, PERMISSIONS.SALARY_ACCOUNT_VIEW,
    PERMISSIONS.SALARY_ACCOUNT_MANAGE, PERMISSIONS.SALARY_PLAN_VIEW,
    PERMISSIONS.SALARY_REPORT_VIEW,
  ],
  EMPLOYEE: [
    PERMISSIONS.ATT_RECORD_PUNCH, PERMISSIONS.ATT_RECORD_VIEW,
    PERMISSIONS.ATT_LEAVE_VIEW, PERMISSIONS.ATT_LEAVE_APPLY,
    PERMISSIONS.ATT_CARD_APPLY,
    PERMISSIONS.SALARY_PAYSLIP_SELF,
  ],
};

// ======================== 通用状态颜色映射 ========================
/** 状态颜色映射（按 CLAUDE.md 规范：灰/蓝/绿/橙/红） */
export function getStatusColor(status: number | string): string {
  // 草稿/已归档 → 灰色
  if (status === 0 || status === 'DRAFT' || status === 'ARCHIVED' || status === 'WITHDRAWN') {
    return 'default';
  }
  // 审批中/计算中 → 蓝色
  if (status === 1 || status === 'PENDING' || status === 'PENDING_APPROVAL') {
    return 'processing';
  }
  // 成功/已批准 → 绿色
  if (status === 2 || status === 'APPROVED' || status === 'PAID' || status === 'ONBOARDED' || status === 'PASS') {
    return 'success';
  }
  // 警告/异常 → 橙色
  if (status === 3 || status === 'EXTEND' || status === 'RESIGNING') {
    return 'warning';
  }
  // 拒绝/失败 → 红色
  if (status === 4 || status === 'REJECTED' || status === 'CANCELLED' || status === 'ABANDONED' || status === 'RESIGNED') {
    return 'error';
  }
  return 'default';
}
