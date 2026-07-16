/**
 * 部门表单弹窗（创建/编辑）
 *
 * 按 API 3.2 POST /dept, 3.3 PUT /dept/{id}
 */

import { ModalForm, ProFormText, ProFormDigit, ProFormSelect, ProForm } from '@ant-design/pro-components';
import { message } from 'antd';
import { useEffect, useState } from 'react';
import { create, update, getTree } from '@/services/dept';
import type { DeptNode } from '@/services/dept';
import DeptTreeSelect from '@/components/DeptTreeSelect';

interface DeptFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  /** 父部门ID（创建时） */
  parentId?: number;
  /** 编辑时的部门ID */
  editId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeptFormModal({ open, mode, parentId, editId, onClose, onSuccess }: DeptFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<any>({});
  const [fetchingInit, setFetchingInit] = useState(false);

  const title = mode === 'create' ? '新增部门' : '编辑部门';

  useEffect(() => {
    if (open) {
      if (mode === 'create') {
        setInitialValues({ parentId: parentId ?? undefined, status: 1, sortOrder: 1 });
      } else if (mode === 'edit' && editId) {
        // 编辑模式：已选中的节点信息通过父页面传入
        setInitialValues({ status: 1, sortOrder: 1 });
      }
    }
  }, [open, mode, parentId, editId]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      if (mode === 'create') {
        await create(values);
        message.success('部门创建成功');
      } else if (editId) {
        await update(editId, values);
        message.success('部门更新成功');
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
      initialValues={initialValues}
      width={520}
    >
      <ProFormText
        name="deptName"
        label="部门名称"
        rules={[{ required: true, message: '请输入部门名称' }]}
      />
      <ProFormText
        name="deptCode"
        label="部门编码"
        rules={[{ required: true, message: '请输入部门编码' }]}
        placeholder="如 TECH, HR, FIN"
      />
      {mode === 'create' && (
        <ProForm.Item name="parentId" label="父部门">
          <DeptTreeSelect />
        </ProForm.Item>
      )}
      {mode === 'edit' && (
        <ProFormText name="parentId" label="父部门ID" disabled hidden />
      )}
      <ProFormDigit name="managerId" label="负责人ID" placeholder="请输入员工ID" />
      <ProFormDigit
        name="sortOrder"
        label="排序"
        min={1}
        max={999}
        rules={[{ required: true, message: '请输入排序号' }]}
      />
      <ProFormSelect
        name="status"
        label="状态"
        options={[
          { value: 1, label: '启用' },
          { value: 0, label: '禁用' },
        ]}
        rules={[{ required: true }]}
      />
    </ModalForm>
  );
}
