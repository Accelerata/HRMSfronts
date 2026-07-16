/**
 * 审批工作台
 *
 * 按 spec: approval-workbench
 *   - 待办/已办 Tab 切换列表（businessType 图标+标签）
 *   - 统一审批详情页（业务信息 + 审批时间线）
 *   - 审批操作（通过/拒绝/退回） + 转交按钮
 *   - 转交弹窗（targetApproverId + reason）
 *   - 委托管理（我的委托列表 + 新增委托弹窗 + 取消委托）
 *
 * API: services/approval.ts
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Tabs, Table, Tag, Space, Button, Drawer, Descriptions, Timeline,
  Modal, Form, Select, Input, DatePicker, Popconfirm, message, Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileProtectOutlined, UserAddOutlined, IdcardOutlined, SwapOutlined,
  LogoutOutlined, ScheduleOutlined, DollarOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, RollbackOutlined,
  SwapRightOutlined, SendOutlined, TeamOutlined, PlusOutlined, DeleteOutlined,
  ReloadOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/models/user';
import ApprovalModal, { type ApprovalFormValues } from '@/components/ApprovalModal';
import {
  BUSINESS_TYPE_MAP, APPROVAL_ACTION_MAP, getStatusColor,
} from '@/utils/constants';
import {
  getTodo, getDone, getDetail, transfer, createDelegation,
  deleteDelegation, getMyDelegations, approve,
} from '@/services/approval';
import type {
  ApprovalRecordItem, ApprovalDetail, Delegation,
} from '@/services/approval';
import { getList as getEmployeeList } from '@/services/employee';
import type { Employee } from '@/services/employee';
import dayjs from 'dayjs';

const { TextArea } = Input;

/** 业务类型 → 图标映射 */
const BUSINESS_TYPE_ICON: Record<number, React.ReactNode> = {
  1: <FileProtectOutlined />,   // 请假
  2: <UserAddOutlined />,        // 入职
  3: <IdcardOutlined />,         // 转正
  4: <SwapOutlined />,           // 调岗
  5: <LogoutOutlined />,         // 离职
  6: <ScheduleOutlined />,       // 补卡
  7: <DollarOutlined />,         // 薪资批次
};

/** 业务类型 → 图标颜色 */
const BUSINESS_TYPE_COLOR: Record<number, string> = {
  1: '#722ed1',   // 请假
  2: '#1890ff',   // 入职
  3: '#52c41a',   // 转正
  4: '#fa8c16',   // 调岗
  5: '#ff4d4f',   // 离职
  6: '#13c2c2',   // 补卡
  7: '#eb2f96',   // 薪资批次
};

export default function ApprovalWorkbenchPage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const canAccess = currentUser?.roleCode === 'ROLE_ADMIN' || currentUser?.roleCode === 'ROLE_HR'
    || currentUser?.roleCode === 'ROLE_MANAGER' || currentUser?.roleCode === 'ROLE_FINANCE';

  // ===== Tab 状态 =====
  const [activeTab, setActiveTab] = useState<string>('todo');

  // ===== Todo 列表 =====
  const [todoData, setTodoData] = useState<ApprovalRecordItem[]>([]);
  const [todoLoading, setTodoLoading] = useState(false);

  // ===== Done 列表 =====
  const [doneData, setDoneData] = useState<ApprovalRecordItem[]>([]);
  const [doneLoading, setDoneLoading] = useState(false);

  // ===== 详情抽屉 =====
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<ApprovalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ApprovalRecordItem | null>(null);

  // ===== 审批弹窗 =====
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  // ===== 转交弹窗 =====
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferRecord, setTransferRecord] = useState<ApprovalRecordItem | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empSearchLoading, setEmpSearchLoading] = useState(false);
  const [transferForm] = Form.useForm();

  // ===== 委托管理 =====
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [delegationsLoading, setDelegationsLoading] = useState(false);
  const [delegationOpen, setDelegationOpen] = useState(false);
  const [delegationSaving, setDelegationSaving] = useState(false);
  const [delegationForm] = Form.useForm();

  // ===== 数据加载 =====

  const fetchTodo = useCallback(async () => {
    setTodoLoading(true);
    try {
      const data = await getTodo();
      setTodoData(Array.isArray(data) ? data : []);
    } catch {
      setTodoData([]);
    } finally {
      setTodoLoading(false);
    }
  }, []);

  const fetchDone = useCallback(async () => {
    setDoneLoading(true);
    try {
      const data = await getDone();
      setDoneData(Array.isArray(data) ? data : []);
    } catch {
      setDoneData([]);
    } finally {
      setDoneLoading(false);
    }
  }, []);

  const fetchDelegations = useCallback(async () => {
    setDelegationsLoading(true);
    try {
      const data = await getMyDelegations();
      setDelegations(Array.isArray(data) ? data : []);
    } catch {
      setDelegations([]);
    } finally {
      setDelegationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodo();
    fetchDelegations();
  }, [fetchTodo, fetchDelegations]);

  // ===== 详情 =====
  const handleOpenDetail = async (record: ApprovalRecordItem) => {
    setCurrentRecord(record);
    setDetail(null);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await getDetail(record.businessType, record.businessId);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // ===== 审批操作 =====
  const handleOpenApproval = () => {
    setApprovalOpen(true);
  };

  const handleApprovalOk = async (values: ApprovalFormValues) => {
    if (!currentRecord) return;
    setApproving(true);
    try {
      await approve(currentRecord.businessType, currentRecord.businessId, {
        action: values.action,
        comment: values.comment,
      });
      message.success(values.action === 1 ? '审批通过' : values.action === 2 ? '已拒绝' : '已退回');
      setApprovalOpen(false);
      setDetailOpen(false);
      setCurrentRecord(null);
      fetchTodo();
    } catch {
      // handled by interceptor
    } finally {
      setApproving(false);
    }
  };

  // ===== 转交操作 =====
  const handleOpenTransfer = (record: ApprovalRecordItem) => {
    setTransferRecord(record);
    transferForm.resetFields();
    setTransferOpen(true);
  };

  /** 搜索员工（用于转交选择人） */
  const handleSearchEmployee = async (keyword: string) => {
    if (!keyword || keyword.length < 1) {
      setEmployees([]);
      return;
    }
    setEmpSearchLoading(true);
    try {
      const result = await getEmployeeList({ keyword, page: 1, size: 20 });
      setEmployees(result.records || result.list || []);
    } catch {
      setEmployees([]);
    } finally {
      setEmpSearchLoading(false);
    }
  };

  const handleTransferOk = async () => {
    if (!transferRecord) return;
    try {
      const values = await transferForm.validateFields();
      setTransferring(true);
      await transfer(transferRecord.recordId, {
        targetApproverId: values.targetApproverId,
        reason: values.reason,
      });
      message.success('转交成功');
      setTransferOpen(false);
      setTransferRecord(null);
      setDetailOpen(false);
      setCurrentRecord(null);
      fetchTodo();
    } catch (err: any) {
      if (err?.errorFields) return;
    } finally {
      setTransferring(false);
    }
  };

  // ===== 委托操作 =====
  const handleOpenDelegationForm = () => {
    delegationForm.resetFields();
    setDelegationOpen(true);
  };

  const handleCreateDelegation = async () => {
    try {
      const values = await delegationForm.validateFields();
      setDelegationSaving(true);
      await createDelegation({
        delegateTo: values.delegateTo,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        reason: values.reason || '',
      });
      message.success('委托设置成功');
      setDelegationOpen(false);
      fetchDelegations();
    } catch (err: any) {
      if (err?.errorFields) return;
    } finally {
      setDelegationSaving(false);
    }
  };

  const handleDeleteDelegation = async (id: number) => {
    try {
      await deleteDelegation(id);
      message.success('委托已取消');
      fetchDelegations();
    } catch {
      // handled by interceptor
    }
  };

  // ===== 通用列表列定义 =====
  const getRecordColumns = (
    showAction: boolean,
    onTransfer?: (record: ApprovalRecordItem) => void,
  ): ColumnsType<ApprovalRecordItem> => [
    {
      title: '业务类型',
      dataIndex: 'businessType',
      width: 120,
      render: (type: number, record) => (
        <Space>
          <span style={{ color: BUSINESS_TYPE_COLOR[type] || '#666' }}>
            {BUSINESS_TYPE_ICON[type] || <UnorderedListOutlined />}
          </span>
          <Tag color={BUSINESS_TYPE_COLOR[type] || 'default'}>
            {record.businessTypeName || BUSINESS_TYPE_MAP[type] || type}
          </Tag>
        </Space>
      ),
    },
    { title: '申请人', dataIndex: 'applicantName', width: 100 },
    { title: '申请部门', dataIndex: 'applicantDept', width: 110, ellipsis: true },
    {
      title: '摘要',
      dataIndex: 'summary',
      ellipsis: true,
    },
    {
      title: '申请时间',
      dataIndex: 'applicationTime',
      width: 170,
    },
    ...(showAction
      ? [
          {
            title: '审批结果',
            dataIndex: 'actionName',
            width: 90,
            render: (v: string) => v ? <Tag>{v}</Tag> : '--',
          } as any,
          {
            title: '审批意见',
            dataIndex: 'comment',
            width: 140,
            ellipsis: true,
            render: (v: string) => v || '--',
          } as any,
          {
            title: '审批时间',
            dataIndex: 'approvalTime',
            width: 170,
            render: (v: string) => v || '--',
          } as any,
        ]
      : [
          {
            title: '截止时间',
            dataIndex: 'deadline',
            width: 170,
            render: (v: string) => v || '--',
          } as any,
        ]),
    {
      title: '操作',
      width: showAction ? 80 : 120,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleOpenDetail(record)}>
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  // ===== 委托列表列定义 =====
  const delegationColumns: ColumnsType<Delegation> = [
    {
      title: '委托人',
      dataIndex: 'delegateToName',
      width: 100,
      render: (v: string, r) => v || `用户#${r.delegateTo}`,
    },
    { title: '委托人部门', dataIndex: 'delegateToDept', width: 120, ellipsis: true },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      width: 110,
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      width: 110,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'active',
      width: 80,
      render: (v: boolean | undefined) => (
        <Tag color={v !== false ? 'green' : 'default'}>{v !== false ? '生效中' : '已失效'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 170,
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="确定取消此委托？"
          onConfirm={() => handleDeleteDelegation(record.id)}
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            取消
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // ===== 渲染审批详情中业务信息的通用展示 =====
  const renderApplicationInfo = (info: Record<string, any> | null) => {
    if (!info || Object.keys(info).length === 0) {
      return <Empty description="无业务详情数据" />;
    }
    return (
      <Descriptions column={2} bordered size="small">
        {Object.entries(info).map(([key, value]) => (
          <Descriptions.Item key={key} label={key}>
            {value === null || value === undefined ? '--' : String(value)}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  const renderApprovalHistory = (history: ApprovalDetail['approvalHistory']) => {
    if (!history || history.length === 0) {
      return <Empty description="暂无审批记录" />;
    }
    return (
      <Timeline
        items={history.map((item, idx) => ({
          key: idx,
          color:
            item.action === 1 ? 'green' :
            item.action === 2 ? 'red' :
            item.action === 3 ? 'orange' : 'gray',
          children: (
            <div>
              <div style={{ fontWeight: 500 }}>
                {item.stepName}
                <Tag
                  color={
                    item.action === 1 ? 'green' :
                    item.action === 2 ? 'red' :
                    item.action === 3 ? 'orange' : 'default'
                  }
                  style={{ marginLeft: 8 }}
                >
                  {item.actionName || APPROVAL_ACTION_MAP[item.action] || item.action}
                </Tag>
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>
                <Space>
                  <span>审批人: {item.approverName}</span>
                  {item.approvalTime && <span>| 时间: {item.approvalTime}</span>}
                </Space>
              </div>
              {item.comment && (
                <div style={{ color: '#999', marginTop: 2, fontStyle: 'italic' }}>
                  意见: {item.comment}
                </div>
              )}
            </div>
          ),
        }))}
      />
    );
  };

  // ===== 渲染 tab 内容 =====
  const tabItems = [
    {
      key: 'todo',
      label: (
        <Space>
          <ClockCircleOutlined />
          我的待办
          {todoData.length > 0 && (
            <Tag color="blue" style={{ marginLeft: 4 }}>{todoData.length}</Tag>
          )}
        </Space>
      ),
      children: (
        <Table<ApprovalRecordItem>
          rowKey="recordId"
          columns={getRecordColumns(false)}
          dataSource={todoData}
          loading={todoLoading}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无待办事项" /> }}
          scroll={{ x: 800 }}
        />
      ),
    },
    {
      key: 'done',
      label: (
        <Space>
          <CheckCircleOutlined />
          我的已办
        </Space>
      ),
      children: (
        <Table<ApprovalRecordItem>
          rowKey="recordId"
          columns={getRecordColumns(true)}
          dataSource={doneData}
          loading={doneLoading}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无已办记录" /> }}
          scroll={{ x: 900 }}
        />
      ),
    },
    {
      key: 'delegations',
      label: (
        <Space>
          <SwapRightOutlined />
          委托管理
        </Space>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenDelegationForm}>
              新增委托
            </Button>
          </div>
          <Table<Delegation>
            rowKey="id"
            columns={delegationColumns}
            dataSource={delegations}
            loading={delegationsLoading}
            pagination={false}
            locale={{ emptyText: <Empty description="暂无委托记录" /> }}
            scroll={{ x: 800 }}
          />
        </div>
      ),
    },
  ];

  // ===== 主渲染 =====
  if (!canAccess) {
    return (
      <div style={{ padding: 24 }}>
        <Card><Empty description="您没有访问审批工作台的权限" /></Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="审批工作台"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              if (activeTab === 'done') fetchDone();
              else if (activeTab === 'delegations') fetchDelegations();
              else fetchTodo();
            }}
          >
            刷新
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            if (key === 'done') fetchDone();
            else if (key === 'delegations') fetchDelegations();
          }}
          items={tabItems}
        />
      </Card>

      {/* ===== 统一审批详情抽屉 ===== */}
      <Drawer
        title="审批详情"
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setCurrentRecord(null);
          setDetail(null);
        }}
        width={640}
        footer={
          detail?.currentActionable ? (
            <Space>
              <Button
                icon={<SendOutlined />}
                onClick={() => currentRecord && handleOpenTransfer(currentRecord)}
              >
                转交
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleOpenApproval}
              >
                审批
              </Button>
            </Space>
          ) : undefined
        }
      >
        {detailLoading ? (
          <Empty description="加载中..." />
        ) : detail ? (
          <>
            {/* 当前审批状态 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Tag color={detail.currentActionable ? 'blue' : 'default'}>
                    {detail.currentActionable ? '待审批' : '已处理'}
                  </Tag>
                  {detail.nextApprover && (
                    <span style={{ marginLeft: 8, color: '#666' }}>
                      下一审批人: <strong>{detail.nextApprover}</strong>
                    </span>
                  )}
                </div>
                {currentRecord && (
                  <>
                    <div>
                      <strong>业务类型:</strong>{' '}
                      <Tag color={BUSINESS_TYPE_COLOR[currentRecord.businessType]}>
                        {currentRecord.businessTypeName}
                      </Tag>
                    </div>
                    <div><strong>摘要:</strong> {currentRecord.summary}</div>
                  </>
                )}
              </Space>
            </Card>

            {/* 业务信息 */}
            <Card title="业务信息" size="small" style={{ marginBottom: 16 }}>
              {renderApplicationInfo(detail.applicationInfo)}
            </Card>

            {/* 审批时间线 */}
            <Card title="审批历史" size="small">
              {renderApprovalHistory(detail.approvalHistory)}
            </Card>
          </>
        ) : (
          <Empty description="加载详情失败" />
        )}
      </Drawer>

      {/* ===== 审批弹窗 ===== */}
      <ApprovalModal
        open={approvalOpen}
        title="审批操作"
        onOk={handleApprovalOk}
        onCancel={() => setApprovalOpen(false)}
        loading={approving}
      />

      {/* ===== 转交弹窗 ===== */}
      <Modal
        title="转交审批任务"
        open={transferOpen}
        onOk={handleTransferOk}
        onCancel={() => {
          setTransferOpen(false);
          setTransferRecord(null);
          transferForm.resetFields();
        }}
        confirmLoading={transferring}
        okText="确认转交"
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={transferForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          preserve={false}
        >
          <Form.Item label="当前任务">
            <div style={{ color: '#666' }}>
              {transferRecord?.summary || '--'}
            </div>
          </Form.Item>

          <Form.Item
            name="targetApproverId"
            label="转交给"
            rules={[{ required: true, message: '请选择转交目标人' }]}
          >
            <Select
              showSearch
              placeholder="搜索并选择审批人"
              filterOption={false}
              onSearch={handleSearchEmployee}
              loading={empSearchLoading}
              options={employees.map((emp) => ({
                value: emp.id,
                label: `${emp.name} (${emp.employeeNo}) - ${emp.deptName || ''}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="转交原因"
            rules={[{ required: true, message: '请输入转交原因' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入转交原因，如：出差期间无法处理"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ===== 新增委托弹窗 ===== */}
      <Modal
        title="新增审批委托"
        open={delegationOpen}
        onOk={handleCreateDelegation}
        onCancel={() => {
          setDelegationOpen(false);
          delegationForm.resetFields();
        }}
        confirmLoading={delegationSaving}
        okText="确认设置"
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={delegationForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          preserve={false}
        >
          <Form.Item
            name="delegateTo"
            label="委托给谁"
            rules={[{ required: true, message: '请选择委托人' }]}
          >
            <Select
              showSearch
              placeholder="搜索并选择委托人"
              filterOption={false}
              onSearch={handleSearchEmployee}
              loading={empSearchLoading}
              options={employees.map((emp) => ({
                value: emp.id,
                label: `${emp.name} (${emp.employeeNo}) - ${emp.deptName || ''}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="开始日期"
            rules={[{ required: true, message: '请选择开始日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="结束日期"
            rules={[{ required: true, message: '请选择结束日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="reason" label="委托原因">
            <TextArea
              rows={2}
              placeholder="如：休假期间委托审批"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
