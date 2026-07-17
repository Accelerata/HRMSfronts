/**
 * 审批工作台 API
 *
 * 按 API 文档 17.1-17.7：
 *   17.1 GET  /approval/todo                      — 我的待办
 *   17.2 GET  /approval/done                      — 我的已办
 *   17.3 GET  /approval/detail/{businessType}/{businessId} — 统一审批详情
 *   17.4 POST /approval/records/{id}/transfer     — 转交审批任务
 *   17.5 POST /approval/delegations               — 设置委托
 *   17.6 DELETE /approval/delegations/{id}        — 取消委托
 *   17.7 GET  /approval/delegations/my            — 查询我的委托
 */

import { get, post, del } from '@/utils/request';

// ====== 数据类型 ======

/** 待办/已办列表项 */
export interface ApprovalRecordItem {
  recordId: number;
  businessType: number;
  businessTypeName: string;
  businessId: number;
  applicantName: string;
  applicantDept: string;
  applicationTime: string;
  deadline?: string;
  summary: string;
  /** 已办列表附加字段 */
  action?: number;
  actionName?: string;
  comment?: string;
  approvalTime?: string;
}

/** 审批历史记录 */
export interface ApprovalHistoryItem {
  stepName: string;
  approverName: string;
  action: number;       // 1=通过, 2=拒绝, 3=退回
  actionName: string;
  comment?: string;
  approvalTime?: string;
}

/** 统一审批详情 */
export interface ApprovalDetail {
  applicationInfo: Record<string, any>;
  approvalHistory: ApprovalHistoryItem[];
  currentActionable: boolean;
  nextApprover?: string;
}

/** 转交参数 */
export interface TransferParams {
  targetApproverId: number;
  reason: string;
}

/** 委托参数 */
export interface DelegationParams {
  delegateTo: number;
  startDate: string;
  endDate: string;
  reason: string;
}

/** 委托记录 */
export interface Delegation {
  id: number;
  delegateTo: number;
  delegateToName?: string;
  delegateToDept?: string;
  startDate: string;
  endDate: string;
  reason: string;
  active?: boolean;
  createTime?: string;
}

// ====== API 方法 ======

/**
 * 17.1 我的待办
 * GET /approval/todo
 */
export async function getTodo(): Promise<ApprovalRecordItem[]> {
  return get('/approval/todo');
}

/**
 * 17.2 我的已办
 * GET /approval/done
 */
export async function getDone(): Promise<ApprovalRecordItem[]> {
  return get('/approval/done');
}

/**
 * 17.3 统一审批详情
 * GET /approval/detail/{businessType}/{businessId}
 */
export async function getDetail(
  businessType: number,
  businessId: number,
): Promise<ApprovalDetail> {
  return get(`/approval/detail/${businessType}/${businessId}`);
}

/**
 * 17.4 转交审批任务
 * POST /approval/records/{id}/transfer
 */
export async function transfer(recordId: number, params: TransferParams): Promise<void> {
  return post(`/approval/records/${recordId}/transfer`, params as any);
}

/**
 * 17.5 设置委托
 * POST /approval/delegations
 */
export async function createDelegation(params: DelegationParams): Promise<void> {
  return post('/approval/delegations', params as any);
}

/**
 * 17.6 取消委托
 * DELETE /approval/delegations/{id}
 */
export async function deleteDelegation(id: number): Promise<void> {
  return del(`/approval/delegations/${id}`);
}

/**
 * 17.7 查询我的委托
 * GET /approval/delegations/my
 */
export async function getMyDelegations(): Promise<Delegation[]> {
  return get('/approval/delegations/my');
}

// ====== 审批操作（复用各模块的 approve 接口） ======

/**
 * 通用审批操作
 *
 * 根据不同 businessType 调用不同模块的 approve 接口：
 *   1=请假: POST /leave/{id}/approve
 *   2=入职: PUT  /onboarding/{id}/approve
 *   3=转正: PUT  /regularization/{id}/approve
 *   4=调岗: PUT  /transfers/{id}/approve
 *   5=离职: PUT  /resignations/{id}/approve
 *   6=补卡: POST /supplementary-card/{id}/approve
 *   7=薪资批次: POST /salary/batches/{id}/approve
 */

export interface ApproveParams {
  action: number;    // 1=通过, 2=拒绝, 3=退回
  comment?: string;
  /** 转正特有: 审批结果类型 1=通过转正, 2=延长试用, 3=不通过辞退 */
  resultType?: number;
  /** 转正特有: 延长试用期月数 */
  extendedMonths?: number;
}

const APPROVE_URL_MAP: Record<number, string> = {
  1: '/leave',                // LeaveController: POST /leave/{id}/approve
  2: '/onboarding',            // OnboardingController: PUT /onboarding/{id}/approve
  3: '/regularization',        // RegularizationController: PUT /regularization/{id}/approve
  4: '/transfers',             // TransferController: PUT /transfers/{id}/approve
  5: '/resignations',          // ResignationController: PUT /resignations/{id}/approve
  6: '/supplementary-card',    // SupplementaryCardController: POST /supplementary-card/{id}/approve
  7: '/salary',                // SalaryController: POST /salary/batches/{id}/approve
};

/** PUT 方法的业务类型（后端使用 @PutMapping） */
const PUT_BUSINESS_TYPES = new Set([2, 3, 4, 5]);

/** 获取审批接口 URL */
function getApproveUrl(businessType: number, businessId: number): string {
  const prefix = APPROVE_URL_MAP[businessType];
  if (!prefix) throw new Error(`未知业务类型: ${businessType}`);

  // 薪资批次 approve 路径是 /batches/{id}/approve，其他都是 /{id}/approve
  if (businessType === 7) {
    return `${prefix}/batches/${businessId}/approve`;
  }
  return `${prefix}/${businessId}/approve`;
}

/**
 * 执行审批操作
 * 根据 businessType 路由到对应的模块接口
 */
export async function approve(
  businessType: number,
  businessId: number,
  params: ApproveParams,
): Promise<void> {
  const url = getApproveUrl(businessType, businessId);
  if (PUT_BUSINESS_TYPES.has(businessType)) {
    const { put } = await import('@/utils/request');
    return put(url, params as any);
  }
  return post(url, params as any);
}
