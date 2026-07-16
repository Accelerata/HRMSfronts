/**
 * 通用 StatusTag 组件
 *
 * 统一状态颜色映射（按 CLAUDE.md）：
 *   灰色 default — 草稿/已归档/已撤回
 *   蓝色 processing — 审批中/计算中
 *   绿色 success — 成功/已批准/已入职
 *   橙色 warning — 警告/异常/延长试用/待离职
 *   红色 error — 拒绝/失败/已离职/已取消
 *
 * 支持传入 statusMap 自定义映射，或通过 statusType 使用内置映射。
 */

import { Tag } from 'antd';
import type { TagProps } from 'antd';

/** 内置状态类型（用于快捷使用） */
export type StatusType =
  | 'draft'       // 草稿 → default
  | 'pending'     // 审批中 → processing
  | 'approved'    // 已通过 → success
  | 'rejected'    // 已拒绝 → error
  | 'success'     // 成功 → success
  | 'warning'     // 警告 → warning
  | 'error'       // 失败 → error
  | 'info';       // 信息 → processing

/** 内置状态映射 */
const BUILTIN_STATUS_MAP: Record<StatusType, { color: TagProps['color']; label: string }> = {
  draft:    { color: 'default',    label: '草稿' },
  pending:  { color: 'processing', label: '审批中' },
  approved: { color: 'success',    label: '已通过' },
  rejected: { color: 'error',      label: '已拒绝' },
  success:  { color: 'success',    label: '成功' },
  warning:  { color: 'warning',    label: '异常' },
  error:    { color: 'error',      label: '失败' },
  info:     { color: 'processing', label: '处理中' },
};

export interface StatusTagProps {
  /** 状态值（数字或字符串） */
  status: number | string;
  /** 自定义映射表：status → { color, label } */
  statusMap?: Record<string | number, { color: TagProps['color']; label: string }>;
  /** 或直接使用内置快捷状态类型 */
  statusType?: StatusType;
}

export default function StatusTag({ status, statusMap, statusType }: StatusTagProps) {
  let color: TagProps['color'] = 'default';
  let label = String(status);

  if (statusMap && status in statusMap) {
    const entry = statusMap[status];
    color = entry.color;
    label = entry.label;
  } else if (statusType && statusType in BUILTIN_STATUS_MAP) {
    const entry = BUILTIN_STATUS_MAP[statusType];
    color = entry.color;
    label = entry.label;
  }

  return <Tag color={color}>{label}</Tag>;
}
