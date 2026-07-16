/**
 * 权限定义 (Umi Access)
 *
 * 根据 roleCode → 权限映射，控制路由和按钮显隐.
 */

import { ROLE_CODE } from '@/utils/constants';

type UserInfo = import('@/models/user').UserInfo;

export default function access(initialState: { currentUser?: UserInfo | null } | undefined) {
  const role = initialState?.currentUser?.roleCode;

  const isAdmin = role === ROLE_CODE.ADMIN;
  const isHR = role === ROLE_CODE.HR;
  const isManager = role === ROLE_CODE.MANAGER;
  const isFinance = role === ROLE_CODE.FINANCE;
  const isEmployee = role === ROLE_CODE.EMPLOYEE;
  const isAdminOrHR = isAdmin || isHR;
  const isAdminOrHRorManager = isAdmin || isHR || isManager;

  return {
    canAccessDashboard: !!role,
    canAccessOrg: isAdminOrHRorManager,
    canAccessDept: isAdminOrHR,
    canAccessPosition: isAdminOrHRorManager,
    canAccessEmployee: isAdminOrHRorManager,
    canAccessAttendance: !!role,
    canAccessPunch: !!role,
    canAccessPunchRecord: !!role,
    canAccessAttendanceStats: isAdminOrHRorManager,
    canAccessSuppCard: !!role,
    canAccessCompLeave: isAdminOrHR,
    canAccessAttendanceGroup: isAdminOrHRorManager,
    canAccessCalendar: isAdminOrHR,
    canAccessLeave: !!role,
    canAccessLeaveApply: !!role,
    canAccessMyLeave: !!role,
    canAccessLeaveApprove: isAdminOrHRorManager,
    canAccessLeaveBalance: !!role,
    canAccessLeaveStats: isAdminOrHRorManager,
    canAccessTransfer: isAdminOrHRorManager,
    canAccessOnboarding: isAdminOrHR,
    canAccessRegularization: isAdminOrHRorManager,
    canAccessJobTransfer: isAdminOrHR,
    canAccessResignation: isAdminOrHRorManager,
    canAccessApproval: isAdminOrHRorManager,
    canAccessSalary: isAdminOrHR || isFinance,
    canAccessSalaryCalc: isAdminOrHR || isFinance,
    canAccessSalaryBatch: isAdminOrHR || isFinance,
    canAccessSalaryRecord: isAdminOrHR || isFinance,
    canAccessSalaryAccount: isAdminOrHR || isFinance,
    canAccessSalaryPlan: isAdminOrHR,
    canAccessSalaryReport: isAdminOrHR || isFinance,
    canAccessPayslip: isAdminOrHR || isFinance || isEmployee,
    canAccessPersonal: !!role,
    canAccessAudit: isAdmin,
    canEditEmployee: isAdminOrHR,
    canDeleteEmployee: isAdmin,
    canManageDept: isAdminOrHR,
    canManagePosition: isAdminOrHR,
    canManageAttendanceGroup: isAdminOrHR,
    canManageCalendar: isAdminOrHR,
    canApproveLeave: isAdminOrHRorManager,
    canApproveSuppCard: isAdminOrHRorManager,
    canSubmitSalaryBatch: isAdminOrHR || isFinance,
    canApproveSalaryBatch: isAdminOrHR || isFinance,
    canPaySalaryBatch: isAdminOrHR || isFinance,
    canArchiveSalaryBatch: isAdminOrHR,
    canManageSalaryAccount: isAdminOrHR,
    canManageSalaryPlan: isAdminOrHR,
    canExportAuditLog: isAdmin,
  };
}
