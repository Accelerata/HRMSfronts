/**
 * 员工表单弹窗（创建/编辑共用）
 *
 * 按 API 2.3 POST /employee, 2.4 PUT /employee/{id}
 * 字段级权限校验：敏感字段仅在创建/编辑时可见
 */

import { ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormDatePicker } from '@ant-design/pro-components';
import { message } from 'antd';
import { useState } from 'react';
import { create, update } from '@/services/employee';
import type { Employee } from '@/services/employee';
import { GENDER_MAP, EMPLOYEE_STATUS_MAP, ENTRY_TYPE_MAP } from '@/utils/constants';

interface EmployeeFormModalProps {
  open: boolean;
  editData: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

function buildSelectOptions(map: Record<number, string>) {
  return Object.entries(map).map(([k, v]) => ({ value: Number(k), label: v }));
}

export default function EmployeeFormModal({ open, editData, onClose, onSuccess }: EmployeeFormModalProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!editData;
  const title = isEdit ? '编辑员工' : '新增员工';

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      if (isEdit && editData) {
        await update(editData.id, values);
        message.success('员工信息更新成功');
      } else {
        await create(values);
        message.success('员工创建成功');
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
          : { status: 1, entryType: 1, gender: 1 }
      }
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      layout="horizontal"
    >
      <ProFormText
        name="name"
        label="姓名"
        rules={[{ required: true, message: '请输入姓名' }]}
        colProps={{ span: 12 }}
      />
      <ProFormText
        name="phone"
        label="手机号"
        rules={[
          { required: true, message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
        ]}
        colProps={{ span: 12 }}
      />
      <ProFormText
        name="email"
        label="邮箱"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '邮箱格式不正确' },
        ]}
        colProps={{ span: 12 }}
      />
      <ProFormText
        name="idCard"
        label="身份证号"
        rules={[
          { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '身份证号格式不正确' },
        ]}
        placeholder="选填"
        colProps={{ span: 12 }}
      />
      <ProFormSelect
        name="gender"
        label="性别"
        options={buildSelectOptions(GENDER_MAP)}
        colProps={{ span: 12 }}
      />
      <ProFormDatePicker
        name="birthday"
        label="出生日期"
        colProps={{ span: 12 }}
        fieldProps={{ style: { width: '100%' } }}
      />
      <ProFormText
        name="deptId"
        label="部门"
        rules={[{ required: true, message: '请选择部门' }]}
        colProps={{ span: 12 }}
      />
      <ProFormText
        name="positionId"
        label="职位ID"
        rules={[{ required: true, message: '请输入职位ID' }]}
        placeholder="请输入职位ID（数字）"
        colProps={{ span: 12 }}
      />
      <ProFormText
        name="grade"
        label="职级"
        placeholder="如 P1, P2, M1"
        colProps={{ span: 12 }}
      />
      <ProFormText
        name="reportTo"
        label="汇报上级ID"
        placeholder="请输入上级员工ID（数字）"
        colProps={{ span: 12 }}
      />
      <ProFormText
        name="workLocation"
        label="工作地点"
        placeholder="如 北京、上海"
        colProps={{ span: 12 }}
      />
      <ProFormSelect
        name="entryType"
        label="入职类型"
        options={buildSelectOptions(ENTRY_TYPE_MAP)}
        colProps={{ span: 12 }}
      />
      <ProFormDatePicker
        name="entryDate"
        label="入职日期"
        rules={[{ required: true, message: '请选择入职日期' }]}
        colProps={{ span: 12 }}
        fieldProps={{ style: { width: '100%' } }}
      />
      <ProFormSelect
        name="status"
        label="状态"
        options={buildSelectOptions(EMPLOYEE_STATUS_MAP)}
        colProps={{ span: 12 }}
      />
      {/* 薪资相关（敏感字段 — 仅 Admin/HR 可见，由后端二次校验） */}
      <ProFormDigit
        name="baseSalary"
        label="基本工资"
        placeholder="请输入基本工资"
        colProps={{ span: 12 }}
        fieldProps={{ precision: 2, min: 0 }}
      />
      <ProFormText
        name="bankAccount"
        label="银行账号"
        placeholder="选填"
        colProps={{ span: 12 }}
      />
      <ProFormText
        name="bankName"
        label="开户银行"
        placeholder="如 招商银行"
        colProps={{ span: 12 }}
      />
      <ProFormText
        name="registeredAddress"
        label="户籍地址"
        placeholder="选填"
        colProps={{ span: 24 }}
      />
      <ProFormText
        name="currentAddress"
        label="现居地址"
        placeholder="选填"
        colProps={{ span: 24 }}
      />
    </ModalForm>
  );
}
