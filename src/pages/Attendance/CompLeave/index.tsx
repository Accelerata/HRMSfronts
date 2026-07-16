/**
 * 调休管理页面
 *
 * 按 spec: comp-leave
 *   选择员工 → 点击"加班折算调休" → 显示折算天数
 *
 * API: POST /comp-leave/convert/{employeeId}
 */

import { useState } from 'react';
import { Card, Select, Button, Result, message, Space, Spin, Statistic } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { convert } from '@/services/comp-leave';
import { useUserStore } from '@/models/user';

/** 简单的员工选择（基于 employeeId 输入，后续可替换为 EmployeeSelect 组件） */
export default function CompLeavePage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const [employeeId, setEmployeeId] = useState<number | undefined>(undefined);
  const [converting, setConverting] = useState(false);
  const [resultDays, setResultDays] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!employeeId) {
      message.warning('请先输入员工ID');
      return;
    }
    setConverting(true);
    setResultDays(null);
    setErrorMsg(null);
    try {
      const days = await convert(employeeId);
      setResultDays(days);
      if (days === 0) {
        message.info('无可折算的加班记录');
      } else {
        message.success(`折算成功：${days} 天调休`);
      }
    } catch {
      setErrorMsg('折算失败，请确认员工ID是否正确');
    } finally {
      setConverting(false);
    }
  };

  const isAdminOrHR = currentUser?.roleCode === 'ROLE_ADMIN' || currentUser?.roleCode === 'ROLE_HR';

  if (!isAdminOrHR) {
    return (
      <div style={{ padding: 24 }}>
        <Result status="403" title="403" subTitle="抱歉，您没有权限访问此页面" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card title="加班折算调休" style={{ maxWidth: 600 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>选择员工</div>
            <Space>
              <Select
                showSearch
                placeholder="请输入员工ID搜索"
                value={employeeId}
                onChange={(v) => {
                  setEmployeeId(v);
                  setResultDays(null);
                  setErrorMsg(null);
                }}
                style={{ width: 240 }}
                filterOption={false}
                options={employeeId ? [{ value: employeeId, label: `员工ID: ${employeeId}` }] : []}
                notFoundContent="请输入员工ID"
              />
              <Button
                type="primary"
                icon={<SwapOutlined />}
                onClick={handleConvert}
                loading={converting}
                disabled={!employeeId}
              >
                加班折算调休
              </Button>
            </Space>
          </div>

          {converting && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Spin tip="正在折算中..." />
            </div>
          )}

          {resultDays !== null && !converting && (
            <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Statistic
                title="折算调休天数"
                value={resultDays}
                suffix="天"
                valueStyle={{ color: resultDays > 0 ? '#3f8600' : '#999' }}
              />
              {resultDays === 0 && (
                <div style={{ color: '#999', marginTop: 8 }}>
                  该员工当前没有可折算的加班记录
                </div>
              )}
            </Card>
          )}

          {errorMsg && !converting && (
            <Result status="error" title="折算失败" subTitle={errorMsg} />
          )}
        </Space>
      </Card>
    </div>
  );
}
