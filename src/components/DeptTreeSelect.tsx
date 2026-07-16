/**
 * 通用 DeptTreeSelect 组件
 *
 * 部门树选择器 — 调用 GET /api/v1/dept/tree 获取树形数据，
 * 使用 Ant Design TreeSelect 展示。
 */

import { TreeSelect } from 'antd';
import type { TreeSelectProps } from 'antd';
import { useState, useEffect, useCallback } from 'react';
import { get } from '@/utils/request';

/** 部门树节点 */
export interface DeptTreeNode {
  id: number;
  deptName: string;
  deptCode?: string;
  parentId: number;
  children?: DeptTreeNode[];
  employeeCount?: number;
}

/** Ant Design TreeSelect 需要的节点 */
interface TreeNode {
  value: number;
  title: string;
  key: number;
  children?: TreeNode[];
  selectable?: boolean;
}

function transformTree(depts: DeptTreeNode[]): TreeNode[] {
  return depts.map((d) => ({
    value: d.id,
    title: `${d.deptName}${d.employeeCount != null ? ` (${d.employeeCount}人)` : ''}`,
    key: d.id,
    children: d.children ? transformTree(d.children) : undefined,
  }));
}

export interface DeptTreeSelectProps extends Omit<TreeSelectProps<number>, 'treeData' | 'value'> {
  /** 受控值 */
  value?: number | number[];
  /** 是否多选 */
  multiple?: boolean;
  /** onChange */
  onChange?: (value: number | number[] | undefined) => void;
}

export default function DeptTreeSelect({
  value,
  multiple = false,
  onChange,
  ...rest
}: DeptTreeSelectProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const data: DeptTreeNode[] = await get('/dept/tree');
      setTreeData(transformTree(data));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return (
    <TreeSelect<number>
      treeData={treeData}
      value={value}
      loading={loading}
      placeholder="请选择部门"
      treeDefaultExpandAll={false}
      showSearch
      treeNodeFilterProp="title"
      allowClear
      multiple={multiple}
      onChange={onChange as any}
      {...rest}
    />
  );
}
