/**
 * 职位管理页面
 *
 * 按 spec: position-management — ProTable + 序列筛选（M/P/S Tab）
 * API: GET /position/list, POST /position, PUT /position/{id}, DELETE /position/{id}
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Table, Button, Space, Tag, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, ContainerOutlined } from '@ant-design/icons';
import { getList, remove } from '@/services/position';
import type { Position } from '@/services/position';
import { POSITION_SEQUENCE_MAP } from '@/utils/constants';
import PositionFormModal from './PositionFormModal';

const SEQUENCE_TABS = [
  { key: '', label: '全部' },
  { key: 'M', label: '管理 (M)' },
  { key: 'P', label: '专业 (P)' },
  { key: 'S', label: '支持 (S)' },
];

export default function PositionManagementPage() {
  const [data, setData] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSeq, setActiveSeq] = useState('');
  // 表单弹窗
  const [formOpen, setFormOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getList(activeSeq || undefined);
      setData(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeSeq]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingPosition(null);
    setFormOpen(true);
  };

  const handleEdit = (record: Position) => {
    setEditingPosition(record);
    setFormOpen(true);
  };

  const handleDelete = (record: Position) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除职位「${record.positionName}」吗？`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await remove(record.id);
          message.success('删除成功');
          fetchData();
        } catch {
          // error handled by interceptor
        }
      },
    });
  };

  const columns: ColumnsType<Position> = [
    {
      title: '职位名称',
      dataIndex: 'positionName',
      width: 180,
    },
    {
      title: '职位编码',
      dataIndex: 'positionCode',
      width: 120,
    },
    {
      title: '序列',
      dataIndex: 'sequence',
      width: 100,
      render: (seq: string) => (
        <Tag color={seq === 'M' ? 'blue' : seq === 'P' ? 'green' : 'orange'}>
          {POSITION_SEQUENCE_MAP[seq] || seq}
        </Tag>
      ),
    },
    {
      title: '职级范围',
      dataIndex: 'gradeRange',
      width: 120,
      render: (v) => v || '--',
    },
    {
      title: '默认试用期(月)',
      dataIndex: 'defaultProbationMonths',
      width: 120,
      render: (v) => v ?? '--',
    },
    {
      title: '标准职位',
      dataIndex: 'isStandard',
      width: 100,
      render: (v: number) => v === 1 ? <Tag color="green">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) => v === 1 ? <Tag color="green">启用</Tag> : <Tag color="default">禁用</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (v) => v || '--',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <>
          <ContainerOutlined style={{ marginRight: 8 }} />
          职位管理
        </>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增职位
        </Button>
      }
    >
      <Tabs
        activeKey={activeSeq}
        onChange={setActiveSeq}
        items={SEQUENCE_TABS.map((t) => ({ key: t.key, label: t.label }))}
      />

      <Table<Position>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        scroll={{ x: 1000 }}
      />

      <PositionFormModal
        open={formOpen}
        editData={editingPosition}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchData}
      />
    </Card>
  );
}
