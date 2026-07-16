/**
 * 部门管理页面
 *
 * 按 spec: dept-management — 树形展示 + 右键菜单 + CRUD + 合并 + 详情
 * API: GET /dept/tree, POST /dept, PUT /dept/{id}, DELETE /dept/{id}, POST /dept/{id}/merge
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Tree, Card, Dropdown, Spin, message, Modal, Button, Space, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import type { DataNode, EventDataNode } from 'antd/es/tree';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MergeCellsOutlined,
  ApartmentOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { getTree, remove } from '@/services/dept';
import type { DeptNode } from '@/services/dept';
import DeptFormModal from './DeptFormModal';
import DeptMergeModal from './DeptMergeModal';
import DeptDetailDrawer from './DeptDetailDrawer';

/** 右键菜单选中节点 */
interface SelectedNode {
  id: number;
  deptName: string;
  parentId: number;
  employeeCount: number;
}

export default function DeptManagementPage() {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  // 弹窗状态
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [mergeOpen, setMergeOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  /** 存储完整 DeptNode 数据，供详情抽屉查询 */
  const deptMapRef = useRef<Map<number, DeptNode>>(new Map());

  /** 将 DeptNode 转为 Ant Design Tree DataNode */
  const transform = (nodes: DeptNode[]): DataNode[] =>
    nodes.map((d) => {
      deptMapRef.current.set(d.id, d);
      return {
        key: d.id,
        title:
          d.employeeCount != null
            ? `${d.deptName} (${d.employeeCount}人)`
            : d.deptName,
        children: d.children ? transform(d.children) : undefined,
        // 自定义数据
        deptName: d.deptName,
        parentId: d.parentId,
        employeeCount: d.employeeCount ?? 0,
      } as any;
    });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      deptMapRef.current.clear();
      const data = await getTree();
      setTreeData(transform(data));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** 获取当前选中部门的完整 DeptNode */
  const getSelectedDeptData = (): DeptNode | null => {
    if (!selectedNode || selectedNode.id === 0) return null;
    return deptMapRef.current.get(selectedNode.id) || null;
  };

  /** 获取父部门名称 */
  const getParentName = (): string | undefined => {
    const dept = getSelectedDeptData();
    if (!dept || dept.parentId === 0) return undefined;
    const parent = deptMapRef.current.get(dept.parentId);
    return parent?.deptName;
  };

  /** 左键选中节点 */
  const onSelect = (
    _keys: React.Key[],
    info: { node: EventDataNode<DataNode> },
  ) => {
    const n = info.node as any;
    setSelectedKeys(_keys);
    setSelectedNode({
      id: n.key as number,
      deptName: n.deptName || info.node.title,
      parentId: n.parentId,
      employeeCount: n.employeeCount ?? 0,
    });
  };

  /** 右键菜单 */
  const onRightClick = ({
    event,
    node,
  }: {
    event: React.MouseEvent;
    node: EventDataNode<DataNode>;
  }) => {
    event.preventDefault();
    const n = node as any;
    setSelectedKeys([n.key]);
    setSelectedNode({
      id: n.key as number,
      deptName: n.deptName || node.title,
      parentId: n.parentId,
      employeeCount: n.employeeCount ?? 0,
    });
  };

  /** 右键菜单项 */
  const contextMenuItems: MenuProps['items'] = selectedNode
    ? [
        {
          key: 'detail',
          icon: <EyeOutlined />,
          label: '查看详情',
          onClick: () => setDetailOpen(true),
        },
        { type: 'divider' },
        {
          key: 'add',
          icon: <PlusOutlined />,
          label: '新增子部门',
          onClick: () => {
            setFormMode('create');
            setFormOpen(true);
          },
        },
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: '编辑',
          onClick: () => {
            setFormMode('edit');
            setFormOpen(true);
          },
        },
        { type: 'divider' },
        {
          key: 'merge',
          icon: <MergeCellsOutlined />,
          label: '合并到其他部门',
          disabled: selectedNode.employeeCount === 0,
          onClick: () => setMergeOpen(true),
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: '删除',
          danger: true,
          disabled: selectedNode.employeeCount > 0 || selectedNode.id === 1,
          onClick: () => handleDelete(),
        },
      ]
    : [];

  /** 删除部门 */
  const handleDelete = () => {
    if (!selectedNode) return;
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除部门「${selectedNode.deptName}」吗？该操作不可撤销。`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await remove(selectedNode.id);
          message.success('删除成功');
          setSelectedNode(null);
          setSelectedKeys([]);
          fetchData();
        } catch {
          // error handled by request interceptor
        }
      },
    });
  };

  const isNodeSelected = selectedNode && selectedNode.id !== 0;

  return (
    <Card
      title={
        <>
          <ApartmentOutlined style={{ marginRight: 8 }} />
          部门管理
        </>
      }
      extra={
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedNode({
                id: 0,
                deptName: '',
                parentId: 0,
                employeeCount: 0,
              });
              setSelectedKeys([]);
              setFormMode('create');
              setFormOpen(true);
            }}
          >
            新增部门
          </Button>
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={fetchData} />
          </Tooltip>
        </Space>
      }
    >
      {/* 选中节点后的操作工具栏 */}
      {isNodeSelected && (
        <div
          style={{
            marginBottom: 12,
            padding: '8px 12px',
            background: '#fafafa',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ marginRight: 8, color: '#666' }}>
            已选：<strong>{selectedNode!.deptName}</strong>
            {selectedNode!.employeeCount > 0 &&
              ` (${selectedNode!.employeeCount}人)`}
          </span>
          <Space size="small" style={{ marginLeft: 'auto' }}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setDetailOpen(true)}
            >
              详情
            </Button>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setFormMode('create');
                setFormOpen(true);
              }}
            >
              子部门
            </Button>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setFormMode('edit');
                setFormOpen(true);
              }}
            >
              编辑
            </Button>
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
              disabled={
                selectedNode!.employeeCount > 0 || selectedNode!.id === 1
              }
              onClick={handleDelete}
            >
              删除
            </Button>
          </Space>
        </div>
      )}

      <Spin spinning={loading}>
        <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
          <Tree
            showLine={{ showLeafIcon: false }}
            defaultExpandAll
            treeData={treeData}
            selectedKeys={selectedKeys}
            onSelect={onSelect as any}
            style={{ minHeight: 400 }}
            onRightClick={onRightClick as any}
          />
        </Dropdown>
      </Spin>

      {/* 部门表单弹窗 */}
      <DeptFormModal
        open={formOpen}
        mode={formMode}
        parentId={formMode === 'create' ? selectedNode?.id : undefined}
        editId={formMode === 'edit' ? selectedNode?.id : undefined}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchData}
      />

      {/* 部门合并弹窗 */}
      <DeptMergeModal
        open={mergeOpen}
        sourceDept={
          selectedNode
            ? { id: selectedNode.id, name: selectedNode.deptName }
            : null
        }
        onClose={() => setMergeOpen(false)}
        onSuccess={fetchData}
      />

      {/* 部门详情抽屉 */}
      <DeptDetailDrawer
        open={detailOpen}
        dept={getSelectedDeptData()}
        parentName={getParentName()}
        onClose={() => setDetailOpen(false)}
      />
    </Card>
  );
}
