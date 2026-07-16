/**
 * 员工详情抽屉
 *
 * 按 spec: employee-management — ProDescriptions + SensitiveText 脱敏
 * API: GET /employee/{id}
 */

import { Drawer, Spin, Descriptions, Tag, Divider } from 'antd';
import { useEffect, useState } from 'react';
import type { Employee } from '@/services/employee';
import { getById } from '@/services/employee';
import SensitiveText from '@/components/SensitiveText';
import {
  EMPLOYEE_STATUS_MAP,
  GENDER_MAP,
  ENTRY_TYPE_MAP,
  getStatusColor,
} from '@/utils/constants';

interface EmployeeDetailDrawerProps {
  open: boolean;
  employeeId: number | null;
  onClose: () => void;
}

export default function EmployeeDetailDrawer({ open, employeeId, onClose }: EmployeeDetailDrawerProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && employeeId) {
      setLoading(true);
      getById(employeeId)
        .then(setEmployee)
        .catch(() => setEmployee(null))
        .finally(() => setLoading(false));
    }
  }, [open, employeeId]);

  const emp = employee;

  return (
    <Drawer
      title="员工详情"
      open={open}
      onClose={onClose}
      width={640}
      destroyOnClose
    >
      {loading || !emp ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : (
        <>
          <Descriptions column={2} bordered size="small" labelStyle={{ width: 100 }}>
            <Descriptions.Item label="工号">{emp.employeeNo}</Descriptions.Item>
            <Descriptions.Item label="姓名">{emp.name}</Descriptions.Item>
            <Descriptions.Item label="手机号">
              <SensitiveText text={emp.phone} type="phone" />
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">{emp.email}</Descriptions.Item>
            <Descriptions.Item label="身份证号">
              <SensitiveText text={emp.idCard} type="idCard" />
            </Descriptions.Item>
            <Descriptions.Item label="性别">
              {emp.gender ? GENDER_MAP[emp.gender] : '--'}
            </Descriptions.Item>
            <Descriptions.Item label="出生日期">{emp.birthday || '--'}</Descriptions.Item>
            <Descriptions.Item label="部门">{emp.deptName}</Descriptions.Item>
            <Descriptions.Item label="职位">{emp.positionName}</Descriptions.Item>
            <Descriptions.Item label="职级">{emp.grade || '--'}</Descriptions.Item>
            <Descriptions.Item label="汇报上级">{emp.reportToName || (emp.reportTo ? `ID:${emp.reportTo}` : '--')}</Descriptions.Item>
            <Descriptions.Item label="工作地点">{emp.workLocation || '--'}</Descriptions.Item>
            <Descriptions.Item label="入职类型">
              {emp.entryType ? ENTRY_TYPE_MAP[emp.entryType] : '--'}
            </Descriptions.Item>
            <Descriptions.Item label="入职日期">{emp.entryDate || '--'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(emp.status)}>
                {EMPLOYEE_STATUS_MAP[emp.status] || emp.status}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left" plain>薪资信息（敏感）</Divider>

          <Descriptions column={2} bordered size="small" labelStyle={{ width: 100 }}>
            <Descriptions.Item label="基本工资">
              {emp.baseSalary != null ? `¥${emp.baseSalary.toLocaleString()}` : '--'}
            </Descriptions.Item>
            <Descriptions.Item label="银行账号">
              <SensitiveText text={emp.bankAccount} type="bankAccount" />
            </Descriptions.Item>
            <Descriptions.Item label="开户银行">{emp.bankName || '--'}</Descriptions.Item>
          </Descriptions>

          <Divider orientation="left" plain>地址信息</Divider>

          <Descriptions column={1} bordered size="small" labelStyle={{ width: 100 }}>
            <Descriptions.Item label="户籍地址">
              {emp.registeredAddress || '--'}
            </Descriptions.Item>
            <Descriptions.Item label="现居地址">
              {emp.currentAddress || '--'}
            </Descriptions.Item>
          </Descriptions>
        </>
      )}
    </Drawer>
  );
}
