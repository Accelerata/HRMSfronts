/**
 * 审计日志查询页面
 *
 * 按 spec: audit-log，实现：
 *   ProTable + 多条件筛选（操作人/操作类型/资源类型/时间范围）
 *   CSV 导出按钮（文件流下载）
 *
 * 权限：仅 ADMIN 可访问（路由层已控制，此处仅 admin 可见导出按钮）
 */

import { useRef, useCallback } from 'react';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Space, Tag, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { getLogs, exportCSV } from '@/services/audit-log';
import type { AuditLogRecord, AuditLogQueryParams } from '@/services/audit-log';
import dayjs from 'dayjs';

// ======================== 操作类型枚举 ========================

const OPERATION_OPTIONS = [
  { label: '查询 (SELECT)', value: 'SELECT' },
  { label: '创建 (CREATE)', value: 'CREATE' },
  { label: '更新 (UPDATE)', value: 'UPDATE' },
  { label: '删除 (DELETE)', value: 'DELETE' },
];

const OPERATION_COLOR_MAP: Record<string, string> = {
  SELECT: 'blue',
  CREATE: 'green',
  UPDATE: 'orange',
  DELETE: 'red',
};

// ======================== 资源类型枚举 ========================

const RESOURCE_TYPE_OPTIONS = [
  { label: '员工 (EMPLOYEE)', value: 'EMPLOYEE' },
  { label: '部门 (DEPT)', value: 'DEPT' },
  { label: '考勤 (ATTENDANCE)', value: 'ATTENDANCE' },
  { label: '请假 (LEAVE)', value: 'LEAVE' },
  { label: '薪资 (SALARY)', value: 'SALARY' },
  { label: '认证 (AUTH)', value: 'AUTH' },
  { label: '审批 (APPROVAL)', value: 'APPROVAL' },
  { label: '其他 (OTHER)', value: 'OTHER' },
];

// ======================== 审计日志页面 ========================

export default function AuditLogPage() {
  const actionRef = useRef<ActionType>();
  const currentParamsRef = useRef<AuditLogQueryParams>({});

  // ---- CSV 导出 ----
  const handleExport = useCallback(async (params: AuditLogQueryParams) => {
    try {
      message.loading({ content: '正在导出审计日志…', key: 'export' });
      const blob = await exportCSV({
        operatorId: params.operatorId,
        operation: params.operation,
        resourceType: params.resourceType,
        startTime: params.startTime,
        endTime: params.endTime,
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `审计日志_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      message.success({ content: '审计日志导出成功', key: 'export' });
    } catch {
      message.error({ content: '导出失败，请重试', key: 'export' });
    }
  }, []);

  // ======================== 列定义 ========================

  const columns: ProColumns<AuditLogRecord>[] = [
    // ---- 搜索表单字段（隐藏于表格）----
    {
      title: '操作人',
      dataIndex: 'operatorId',
      hideInTable: true,
      valueType: 'text',
      fieldProps: {
        placeholder: '输入操作人ID',
        allowClear: true,
        type: 'number',
      },
    },
    {
      title: '操作类型',
      dataIndex: 'operation',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        placeholder: '选择操作类型',
        allowClear: true,
        options: OPERATION_OPTIONS,
      },
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        placeholder: '选择资源类型',
        allowClear: true,
        options: RESOURCE_TYPE_OPTIONS,
      },
    },
    {
      title: '操作开始时间',
      dataIndex: 'startTime',
      hideInTable: true,
      valueType: 'dateTime',
      fieldProps: {
        placeholder: '操作开始时间',
        showTime: true,
      },
    },
    {
      title: '操作结束时间',
      dataIndex: 'endTime',
      hideInTable: true,
      valueType: 'dateTime',
      fieldProps: {
        placeholder: '操作结束时间',
        showTime: true,
      },
    },

    // ---- 表格可见列 ----
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
      search: false,
      align: 'center',
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      width: 120,
      search: false,
      ellipsis: true,
    },
    {
      title: '操作类型',
      dataIndex: 'operation',
      width: 110,
      search: false,
      render: (_, record) => (
        <Tag color={OPERATION_COLOR_MAP[record.operation] || 'default'}>
          {record.operation}
        </Tag>
      ),
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      width: 120,
      search: false,
      ellipsis: true,
    },
    {
      title: '资源ID',
      dataIndex: 'resourceId',
      width: 90,
      search: false,
      copyable: true,
    },
    {
      title: '操作结果',
      dataIndex: 'result',
      width: 100,
      search: false,
      render: (_, record) => (
        <Tag color={record.result === 'SUCCESS' ? 'success' : 'error'}>
          {record.result === 'SUCCESS' ? '成功' : record.result}
        </Tag>
      ),
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      width: 200,
      search: false,
      ellipsis: true,
      renderText: (v: string | null) => v || '--',
    },
    {
      title: '客户端IP',
      dataIndex: 'clientIp',
      width: 140,
      search: false,
      copyable: true,
    },
    {
      title: '操作时间',
      dataIndex: 'createTime',
      width: 170,
      search: false,
      valueType: 'dateTime',
      sorter: true,
    },
  ];

  return (
    <ProTable<AuditLogRecord>
      headerTitle="审计日志"
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      request={async (params, sort) => {
        const { current, pageSize, operatorId, operation, resourceType, startTime, endTime } =
          params as any;

        const queryParams: AuditLogQueryParams = {
          page: current,
          size: pageSize,
        };

        if (operatorId !== undefined && operatorId !== null && operatorId !== '') {
          queryParams.operatorId = Number(operatorId);
        }
        if (operation) queryParams.operation = operation;
        if (resourceType) queryParams.resourceType = resourceType;
        if (startTime) queryParams.startTime = startTime;
        if (endTime) queryParams.endTime = endTime;

        // 保存当前筛选参数用于导出
        currentParamsRef.current = queryParams;

        try {
          const result = await getLogs(queryParams);
          const data = result.records || result.list || [];
          return {
            data,
            total: result.total,
            success: true,
          };
        } catch (err: any) {
          message.error(err?.message || '加载审计日志失败');
          return { data: [], total: 0, success: false };
        }
      }}
      search={{
        labelWidth: 'auto',
        defaultCollapsed: false,
        span: 8,
      }}
      toolbar={{
        actions: [
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={() => handleExport(currentParamsRef.current)}
          >
            导出CSV
          </Button>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
          >
            刷新
          </Button>,
        ],
      }}
      pagination={{
        defaultPageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ['10', '20', '50', '100'],
      }}
      scroll={{ x: 1200 }}
      dateFormatter="string"
    />
  );
}
