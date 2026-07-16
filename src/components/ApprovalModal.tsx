/**
 * 通用 ApprovalModal 组件
 *
 * 支持三种审批动作：通过 / 拒绝 / 退回，附带评论输入。
 *
 * 按 API 文档：action: 1=通过, 2=拒绝, 3=退回
 */

import { Modal, Form, Input, Radio, Space } from 'antd';
import { useState } from 'react';
import { CheckCircleOutlined, CloseCircleOutlined, RollbackOutlined } from '@ant-design/icons';

export interface ApprovalFormValues {
  action: number;    // 1=通过, 2=拒绝, 3=退回
  comment: string;
}

export interface ApprovalModalProps {
  open: boolean;
  /** 是否显示"退回"选项，默认 true */
  showReturn?: boolean;
  /** 标题 */
  title?: string;
  /** 确认回调 */
  onOk: (values: ApprovalFormValues) => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 加载状态 */
  loading?: boolean;
}

const { TextArea } = Input;

export default function ApprovalModal({
  open,
  showReturn = true,
  title = '审批操作',
  onOk,
  onCancel,
  loading = false,
}: ApprovalModalProps) {
  const [form] = Form.useForm<ApprovalFormValues>();
  const [action, setAction] = useState(1);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
    } catch {
      // 表单校验错误
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setAction(1);
    onCancel();
  };

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="确认提交"
      cancelText="取消"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ action: 1, comment: '' }}
        preserve={false}
      >
        <Form.Item name="action" label="审批结果" rules={[{ required: true }]}>
          <Radio.Group
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value={1}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 6 }} />
                通过
              </Radio>
              <Radio value={2}>
                <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />
                拒绝
              </Radio>
              {showReturn && (
                <Radio value={3}>
                  <RollbackOutlined style={{ color: '#faad14', marginRight: 6 }} />
                  退回
                </Radio>
              )}
            </Space>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="comment" label="审批意见">
          <TextArea
            rows={3}
            placeholder={
              action === 1 ? '请输入通过意见（可选）' :
              action === 2 ? '请输入拒绝原因' :
              '请输入退回原因'
            }
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
