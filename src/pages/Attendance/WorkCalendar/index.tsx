/**
 * 工作日历页面
 *
 * 按 spec: work-calendar
 *   - 年度日历视图：节假日（橙色）/ 调班（蓝色）颜色标记
 *   - 批量配置面板：日期多选 + dayType/name 输入 + 批量保存
 *   - 单日删除（含确认）
 *
 * API:
 *   GET    /calendar
 *   POST   /calendar/batch
 *   DELETE /calendar?date=
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  DatePicker,
  Input,
  Space,
  Tag,
  Popconfirm,
  message,
  Spin,
  Empty,
  Divider,
  Tooltip,
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import {
  getCalendar,
  batchSaveCalendar,
  deleteCalendarEntry,
} from '@/services/work-calendar';
import type { CalendarEntry } from '@/services/work-calendar';
import { CALENDAR_DAY_TYPE_MAP } from '@/utils/constants';

export default function WorkCalendarPage() {
  const now = dayjs();
  const [year, setYear] = useState(now.year());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // 批量配置
  const [selectedDates, setSelectedDates] = useState<Dayjs[]>([]);
  const [dayType, setDayType] = useState<number>(1); // 1=节假日, 2=调班
  const [holidayName, setHolidayName] = useState('');
  const [saving, setSaving] = useState(false);

  // 删除中
  const [deletingDate, setDeletingDate] = useState<string | null>(null);

  // 加载日历数据
  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCalendar(year);
      setEntries(result);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  // 构建日期 → 日历条目映射
  const dateMap = new Map<string, CalendarEntry>();
  entries.forEach((e) => dateMap.set(e.calendarDate, e));

  // 批量保存
  const handleBatchSave = async () => {
    if (selectedDates.length === 0) {
      message.warning('请先选择日期');
      return;
    }
    if (!holidayName.trim()) {
      message.warning('请输入节假日/调班名称');
      return;
    }

    const batch: CalendarEntry[] = selectedDates.map((d) => ({
      calendarDate: d.format('YYYY-MM-DD'),
      dayType,
      name: holidayName.trim(),
    }));

    setSaving(true);
    try {
      await batchSaveCalendar(batch);
      message.success(`已保存 ${batch.length} 条日历配置`);
      setSelectedDates([]);
      setHolidayName('');
      fetchCalendar();
    } catch {
      // handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  // 单日删除
  const handleDelete = async (date: string) => {
    setDeletingDate(date);
    try {
      await deleteCalendarEntry(date);
      message.success(`已删除 ${date} 的配置`);
      fetchCalendar();
    } catch {
      // handled by interceptor
    } finally {
      setDeletingDate(null);
    }
  };

  // 年份选项
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = now.year() - 2 + i;
    return { value: y, label: `${y}年` };
  });

  // 生成全年月份日历
  const months: { month: number; label: string; days: Dayjs[] }[] = [];
  for (let m = 0; m < 12; m++) {
    const firstDay = dayjs(`${year}-${String(m + 1).padStart(2, '0')}-01`);
    const daysInMonth = firstDay.daysInMonth();
    const days: Dayjs[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(dayjs(`${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`));
    }
    // 补齐前面的空白（让星期对齐）
    const startDayOfWeek = firstDay.day(); // 0=周日
    for (let i = 0; i < startDayOfWeek; i++) {
      days.unshift(null as unknown as Dayjs);
    }
    months.push({ month: m + 1, label: `${m + 1}月`, days });
  }

  // 日期单元格样式
  const getDayStyle = (d: Dayjs | null): React.CSSProperties | undefined => {
    if (!d) return { visibility: 'hidden' as const };
    const dateStr = d.format('YYYY-MM-DD');
    const entry = dateMap.get(dateStr);
    if (!entry) return undefined;
    if (entry.dayType === 1) {
      return {
        background: '#fff7e6',
        color: '#d46b08',
        fontWeight: 600,
        borderRadius: 4,
      };
    }
    if (entry.dayType === 2) {
      return {
        background: '#e6f7ff',
        color: '#0958d9',
        fontWeight: 600,
        borderRadius: 4,
      };
    }
    return undefined;
  };

  const dayTypeColorMap: Record<number, string> = { 1: 'orange', 2: 'blue' };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={24}>
        {/* 左侧：日历视图 */}
        <Col xs={24} lg={17}>
          <Card
            title={
              <>
                <CalendarOutlined style={{ marginRight: 8 }} />
                工作日历
              </>
            }
            extra={
              <Space>
                <Select value={year} onChange={setYear} options={yearOptions} />
                <Button icon={<ReloadOutlined />} onClick={fetchCalendar} loading={loading}>
                  刷新
                </Button>
              </Space>
            }
          >
            <Spin spinning={loading}>
              {/* 图例 */}
              <Space style={{ marginBottom: 16 }}>
                <Tag color="orange">节假日/休息</Tag>
                <Tag color="blue">调班工作日</Tag>
              </Space>

              {entries.length === 0 && !loading ? (
                <Empty description="暂无日历配置数据" />
              ) : (
                <Row gutter={[16, 16]}>
                  {months.map((m) => (
                    <Col xs={12} sm={8} md={6} lg={6} key={m.month}>
                      <Card
                        size="small"
                        title={<span style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</span>}
                        styles={{ body: { padding: 8 } }}
                      >
                        {/* 星期头 */}
                        <Row gutter={[0, 0]} style={{ marginBottom: 4 }}>
                          {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
                            <Col span={3} key={w} style={{ textAlign: 'center' }}>
                              <span style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>{w}</span>
                            </Col>
                          ))}
                        </Row>
                        {/* 日期网格 */}
                        <Row gutter={[0, 2]}>
                          {m.days.map((d, idx) => {
                            const dateStr = d ? d.format('YYYY-MM-DD') : '';
                            const entry = d ? dateMap.get(dateStr) : undefined;
                            const dayStyle = getDayStyle(d);
                            const isToday = d ? d.format('YYYY-MM-DD') === now.format('YYYY-MM-DD') : false;

                            return (
                              <Col span={3} key={idx} style={{ textAlign: 'center', padding: '2px 0' }}>
                                {d && entry ? (
                                  <Popconfirm
                                    title={
                                      <div>
                                        <div>
                                          <strong>{dateStr}</strong>
                                        </div>
                                        <div>
                                          类型：{CALENDAR_DAY_TYPE_MAP[entry.dayType]}
                                        </div>
                                        <div>名称：{entry.name}</div>
                                        <div style={{ marginTop: 4 }}>确定要删除此日配置吗？</div>
                                      </div>
                                    }
                                    onConfirm={() => handleDelete(dateStr)}
                                    okText="删除"
                                    cancelText="取消"
                                    okButtonProps={{ danger: true, loading: deletingDate === dateStr }}
                                  >
                                    <Tooltip title={`${entry.name} (${CALENDAR_DAY_TYPE_MAP[entry.dayType]})`}>
                                      <div
                                        style={{
                                          ...dayStyle,
                                          padding: '2px 4px',
                                          fontSize: 12,
                                          cursor: 'pointer',
                                          border: isToday ? '1px solid #1677ff' : undefined,
                                          lineHeight: '18px',
                                        }}
                                      >
                                        {d.date()}
                                      </div>
                                    </Tooltip>
                                  </Popconfirm>
                                ) : d ? (
                                  <div
                                    style={{
                                      padding: '2px 4px',
                                      fontSize: 12,
                                      lineHeight: '18px',
                                      border: isToday ? '1px solid #1677ff' : undefined,
                                      borderRadius: isToday ? 4 : undefined,
                                      color: isToday ? '#1677ff' : '#333',
                                      fontWeight: isToday ? 600 : 400,
                                    }}
                                  >
                                    {d.date()}
                                  </div>
                                ) : (
                                  <div style={{ padding: '2px 4px', fontSize: 12, opacity: 0 }}>0</div>
                                )}
                              </Col>
                            );
                          })}
                        </Row>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Spin>
          </Card>
        </Col>

        {/* 右侧：批量配置面板 */}
        <Col xs={24} lg={7}>
          <Card
            title={
              <>
                <PlusOutlined style={{ marginRight: 8 }} />
                批量配置
              </>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>选择日期（可多选）</div>
              <DatePicker
                multiple
                value={selectedDates}
                onChange={(v) => setSelectedDates(v || [])}
                style={{ width: '100%' }}
                placeholder="点击选择多个日期"
              />
              {selectedDates.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Tag color="processing">已选 {selectedDates.length} 个日期</Tag>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    {selectedDates
                      .slice(0, 5)
                      .map((d) => d.format('MM-DD'))
                      .join(', ')}
                    {selectedDates.length > 5 && ` 等${selectedDates.length}个日期`}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>日期类型</div>
              <Select
                value={dayType}
                onChange={setDayType}
                style={{ width: '100%' }}
                options={[
                  { value: 1, label: '节假日/休息' },
                  { value: 2, label: '调班工作日' },
                ]}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>名称</div>
              <Input
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder={dayType === 1 ? '如：国庆节' : '如：国庆调班补班'}
                maxLength={50}
              />
            </div>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              block
              onClick={handleBatchSave}
              loading={saving}
            >
              批量保存
            </Button>

            <Divider />

            {/* 已配置列表摘要 */}
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
              已配置 {entries.length} 天
            </div>
            <div style={{ maxHeight: 360, overflow: 'auto' }}>
              {entries.length === 0 ? (
                <Empty description="暂无配置" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                entries
                  .sort((a, b) => a.calendarDate.localeCompare(b.calendarDate))
                  .map((entry) => (
                    <div
                      key={entry.calendarDate}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 8px',
                        marginBottom: 4,
                        background: '#fafafa',
                        borderRadius: 4,
                      }}
                    >
                      <span style={{ fontSize: 12 }}>
                        <Tag
                          color={dayTypeColorMap[entry.dayType] || 'default'}
                          style={{ marginRight: 4, fontSize: 11 }}
                        >
                          {CALENDAR_DAY_TYPE_MAP[entry.dayType]}
                        </Tag>
                        <span style={{ fontSize: 11, color: '#666' }}>{entry.calendarDate}</span>
                        <span style={{ marginLeft: 4, fontSize: 12 }}>{entry.name}</span>
                      </span>
                      <Popconfirm
                        title={`确定删除 ${entry.calendarDate} 的配置吗？`}
                        onConfirm={() => handleDelete(entry.calendarDate)}
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true, loading: deletingDate === entry.calendarDate }}
                      >
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
