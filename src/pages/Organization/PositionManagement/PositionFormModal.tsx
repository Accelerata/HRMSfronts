/**
 * 职位表单弹窗（创建/编辑）
 *
 * 按 API 4.3 POST /position, 4.4 PUT /position/{id}
 * positionCode 必填且全局唯一；sequence 必填，仅限 M/P/S
 */

import { ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormTextArea } from '@ant-design/pro-components';
import { message } from 'antd';
import { useState } from 'react';
import { create, update } from '@/services/position';
import type { Position } from '@/services/position';

interface PositionFormModalProps {
  open: boolean;
  editData: Position | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PositionFormModal({ open, editData, onClose, onSuccess }: PositionFormModalProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!editData;
  const title = isEdit ? '编辑职位' : '新增职位';

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      if (isEdit && editData) {
        await update(editData.id, values);
        message.success('职位更新成功');
      } else {
        await create(values);
        message.success('职位创建成功');
      }
      onSuccess();
      onClose();
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalForm
      title={title}
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      onFinish={handleFinish}
      loading={loading}
      initialValues={
        isEdit
          ? { ...editData }
          : { isStandard: 1, status: 1, defaultProbationMonths: 3 }
      }
      width={560}
    >
      <ProFormText
        name="positionName"
        label="职位名称"
        rules={[{ required: true, message: '请输入职位名称' }]}
      />
      <ProFormText
        name="positionCode"
        label="职位编码"
        rules={[{ required: true, message: '请输入职位编码' }]}
        placeholder="如 P3, M1（全局唯一）"
      />
      <ProFormSelect
        name="sequence"
        label="序列"
        rules={[{ required: true, message: '请选择序列' }]}
        options={[
          { value: 'M', label: 'M - 管理序列' },
          { value: 'P', label: 'P - 专业序列' },
          { value: 'S', label: 'S - 支持序列' },
        ]}
      />
      <ProFormText
        name="gradeRange"
        label="职级范围"
        placeholder="如 P1-P5"
      />
      <ProFormDigit
        name="defaultProbationMonths"
        label="默认试用期(月)"
        min={0}
        max={12}
      />
      <ProFormSelect
        name="isStandard"
        label="是否标准职位"
        rules={[{ required: true }]}
        options={[
          { value: 1, label: '是 — 入职直接通过' },
          { value: 0, label: '否 — 入职需HR二审' },
        ]}
      />
      <ProFormSelect
        name="status"
        label="状态"
        options={[
          { value: 1, label: '启用' },
          { value: 0, label: '禁用' },
        ]}
      />
      <ProFormTextArea
        name="description"
        label="描述"
        placeholder="职位描述（可选）"
        fieldProps={{ rows: 3, maxLength: 200, showCount: true }}
      />
    </ModalForm>
  );
}
