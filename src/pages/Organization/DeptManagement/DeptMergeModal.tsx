/**
 * 部门合并弹窗
 *
 * 按 API 3.5: POST /dept/{sourceId}/merge?targetDeptId=X
 */

import { Modal, Form, message } from 'antd';
import { useState } from 'react';
import { merge } from '@/services/dept';
import DeptTreeSelect from '@/components/DeptTreeSelect';

interface DeptMergeModalProps {
  open: boolean;
  sourceDept: { id: number; name: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeptMergeModal({ open, sourceDept, onClose, onSuccess }: DeptMergeModalProps) {
  const [loading, setLoading] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState<number | undefined>();

  const handleOk = async () => {
    if (!sourceDept || !targetDeptId) {
      message.warning('请选择目标部门');
      return;
    }
    if (targetDeptId === sourceDept.id) {
      message.warning('不能合并到自身');
      return;
    }
    setLoading(true);
    try {
      await merge(sourceDept.id, targetDeptId);
      message.success('部门合并成功');
      setTargetDeptId(undefined);
      onSuccess();
      onClose();
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTargetDeptId(undefined);
    onClose();
  };

  return (
    <Modal
      title="部门合并"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="确认合并"
      cancelText="取消"
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <strong>源部门：</strong>
        {sourceDept?.name || '--'}
      </div>
      <Form.Item label="目标部门" required>
        <DeptTreeSelect
          value={targetDeptId}
          onChange={(v) => setTargetDeptId(v as number)}
        />
      </Form.Item>
      <div style={{ color: '#999', fontSize: 12 }}>
        合并后，源部门下的员工和子部门将转移至目标部门，源部门将被删除。
      </div>
    </Modal>
  );
}
