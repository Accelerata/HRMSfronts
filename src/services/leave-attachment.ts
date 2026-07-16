/**
 * 请假附件 API
 *
 * 按 API 文档 10.1-10.2：
 *   10.1 POST /leave/attachments    — 上传附件
 *   10.2 GET  /leave/{id}/attachments — 查看申请附件列表
 */

import { get, upload } from '@/utils/request';

/** 请假附件记录 */
export interface LeaveAttachment {
  id: number;
  leaveApplicationId: number | null;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  uploadTime: string;
}

/**
 * 上传附件
 * POST /api/v1/leave/attachments
 * Content-Type: multipart/form-data
 * 表单参数: file - 上传文件
 */
export async function uploadAttachment(file: File): Promise<LeaveAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  return upload<LeaveAttachment>('/leave/attachments', formData);
}

/**
 * 查看申请附件列表
 * GET /api/v1/leave/{id}/attachments
 */
export async function getAttachments(leaveApplicationId: number): Promise<LeaveAttachment[]> {
  return get<LeaveAttachment[]>(`/leave/${leaveApplicationId}/attachments`);
}
