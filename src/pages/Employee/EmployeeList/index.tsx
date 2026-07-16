/**
 * 员工档案管理页面
 *
 * 按 API 文档 2.1 — GET /employee/list 支持的查询参数：
 *   keyword, phone, deptIds, positionIds, statuses, grades, startDate, endDate, page, size
 * 按 spec: employee-management — ProTable + 高级搜索表单
 */

import { useRef } from 'react';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Space, Tag, Modal, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useState, useCallback } from 'react';
import { getList, remove } from '@/services/employee';
import type { Employee } from '@/services/employee';
import { EMPLOYEE_STATUS_MAP, GENDER_MAP, getStatusColor } from '@/utils/constants';
import SensitiveText from '@/components/SensitiveText';
import EmployeeFormModal from './EmployeeFormModal';
import EmployeeDetailDrawer from './EmployeeDetailDrawer';
import { useUserStore } from '@/models/user';

export default function EmployeeListPage() {
  const actionRef = useRef<ActionType>();
  const currentUser = useUserStore((s) => s.currentUser);
  const isAdminOrHR = currentUser?.roleCode === 'ROLE_ADMIN' || currentUser?.roleCode === 'ROLE_HR';

  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [detailEmployeeId, setDetailEmployeeId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleAdd = useCallback(() => {
    setEditingEmployee(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((record: Employee) => {
    setEditingEmployee(record);
    setFormOpen(true);
  }, []);

  const handleView = useCallback((record: Employee) => {
    setDetailEmployeeId(record.id);
    setDetailOpen(true);
  }, []);

  const handleDelete = useCallback((record: Employee) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除员工「${record.name} (${record.employeeNo})」吗？删除后无法恢复。`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await remove(record.id);
          message.success('删除成功');
          actionRef.current?.reload();
        } catch {
          // error handled by interceptor
        }
      },
    });
  }, []);

  const columns: ProColumns<Employee>[] = [
    // ---- 以下是隐藏列，仅用于搜索表单 ----
    {
      title: '关键词',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '搜索姓名/工号', allowClear: true },
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      hideInTable: true,
      fieldProps: { placeholder: '精确搜索手机号', allowClear: true },
    },
    // ---- 以下是可见列 ----
    {
      title: '工号',
      dataIndex: 'employeeNo',
      width: 130,
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100,
      ellipsis: true,
      search: false,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
      search: false,
      render: (_, record) => <SensitiveText text={record.phone} type="phone" />,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      ellipsis: true,
      search: false,
    },
    {
      title: '部门',
      dataIndex: 'deptName',
      width: 130,
      ellipsis: true,
      search: false,
    },
    {
      title: '职位',
      dataIndex: 'positionName',
      width: 140,
      ellipsis: true,
      search: false,
    },
    {
      title: '职级',
      dataIndex: 'grade',
      width: 80,
      search: false,
      renderText: (v: string) => v || '--',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 60,
      search: false,
      render: (_, record) => (record.gender ? GENDER_MAP[record.gender] : '--'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      renderText: (status: number) => (
        <Tag color={getStatusColor(status)}>{EMPLOYEE_STATUS_MAP[status] || status}</Tag>
      ),
      valueType: 'select',
      valueEnum: {
        0: { text: '待入职' },
        1: { text: '试用期' },
        2: { text: '正式' },
        3: { text: '待离职' },
        4: { text: '已离职' },
      },
    },
    {
      title: '入职日期',
      dataIndex: 'entryDate',
      width: 110,
      valueType: 'date',
      search: false,
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<Employee>
        headerTitle="员工档案"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const { current, pageSize, status } = params as any;

          // 把所有搜索值直接传给后端 (keyword, phone, deptIds, positionIds, statuses, grades, startDate, endDate)
          const queryParams: Record<string, any> = {
            page: current,
            size: pageSize,
          };

          // 关键词搜索（后端 keyword 搜姓名/工号）
          if (params.keyword) queryParams.keyword = params.keyword;
          if (params.phone) queryParams.phone = params.phone;
          // 部门多选
          if (params.deptIds) queryParams.deptIds = params.deptIds;
          // 职位多选
          if (params.positionIds) queryParams.positionIds = params.positionIds;
          // 状态——ProTable valueEnum select 可能返回数组或单个值
          if (status !== undefined && status !== null) {
            queryParams.statuses = Array.isArray(status) ? status : [status];
          }
          // 职级多选
          if (params.grades) queryParams.grades = params.grades;
          // 日期范围
          if (params.startDate) queryParams.startDate = params.startDate;
          if (params.endDate) queryParams.endDate = params.endDate;

          console.log('[EmployeeList] 查询参数:', JSON.stringify(queryParams));
          console.log('[EmployeeList] 完整请求 URL: /api/v1/employee/list?' + new URLSearchParams(queryParams as any).toString());

          try {
            const result = await getList(queryParams);
            console.log('[EmployeeList] ✅ API 返回结果:', JSON.stringify(result, null, 2));
            const data = result.records || result.list || [];
            console.log('[EmployeeList] 数据条数:', data.length, '总数:', result.total);
            return {
              data,
              total: result.total,
              success: true,
            };
          } catch (err: any) {
            console.error('[EmployeeList] ❌ API 请求失败:', err);
            console.error('[EmployeeList] 错误详情:', {
              message: err?.message,
              stack: err?.stack,
              response: err?.response?.data,
              status: err?.response?.status,
            });
            message.error(err?.message || '加载员工列表失败，请确认后端服务已启动');
            return { data: [], total: 0, success: false };
          }
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        toolbar={{
          actions: [],
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1400 }}
      />

      <EmployeeFormModal
        open={formOpen}
        editData={editingEmployee}
        onClose={() => setFormOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />

      <EmployeeDetailDrawer
        open={detailOpen}
        employeeId={detailEmployeeId}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
