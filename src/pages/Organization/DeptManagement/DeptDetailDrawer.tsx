/**
 * 部门详情抽屉
 *
 * 展示部门的完整信息，包括子部门列表
 */

import { Drawer, Descriptions, Tag, List, Typography, Empty } from 'antd';
import type { DeptNode } from '@/services/dept';

interface DeptDetailDrawerProps {
  open: boolean;
  dept: DeptNode | null;
  parentName?: string;
  onClose: () => void;
}

export default function DeptDetailDrawer({ open, dept, parentName, onClose }: DeptDetailDrawerProps) {
  return (
    <Drawer
      title="部门详情"
      open={open}
      onClose={onClose}
      width={480}
      destroyOnClose
    >
      {dept ? (
        <>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="部门名称">{dept.deptName}</Descriptions.Item>
            <Descriptions.Item label="部门编码">{dept.deptCode}</Descriptions.Item>
            <Descriptions.Item label="父部门">
              {parentName || '无（顶级部门）'}
            </Descriptions.Item>
            <Descriptions.Item label="负责人">
              {dept.managerName || dept.managerId || '--'}
            </Descriptions.Item>
            <Descriptions.Item label="排序">{dept.sortOrder}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={dept.status === 1 ? 'green' : 'red'}>
                {dept.status === 1 ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="在职人数">
              {dept.employeeCount ?? 0} 人
            </Descriptions.Item>
          </Descriptions>

          {dept.children && dept.children.length > 0 && (
            <>
              <Typography.Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
                子部门 ({dept.children.length})
              </Typography.Title>
              <List
                size="small"
                bordered
                dataSource={dept.children}
                renderItem={(child) => (
                  <List.Item>
                    <span>{child.deptName}</span>
                    {child.employeeCount != null && (
                      <span style={{ color: '#999', marginLeft: 8 }}>
                        ({child.employeeCount}人)
                      </span>
                    )}
                  </List.Item>
                )}
              />
            </>
          )}
        </>
      ) : (
        <Empty description="请选择一个部门" />
      )}
    </Drawer>
  );
}
