/**
 * 通用 SensitiveText 组件
 *
 * 敏感字段脱敏展示（手机号、身份证、银行账号）：
 *   - 手机号 13800138000 → 138****8000
 *   - 身份证 320102199808151234 → 3201**********1234
 *   - 银行账号 6222021234567890 → 6222****7890
 *   - 自定义：显示首N位 + **** + 末M位
 *
 * 默认对长度 >= 11 的字符串执行脱敏。
 */

import { Typography } from 'antd';
import type { CSSProperties } from 'react';

const { Text } = Typography;

export interface SensitiveTextProps {
  /** 原始文本 */
  text?: string | null;
  /** 脱敏类型：phone | idCard | bankAccount | auto */
  type?: 'phone' | 'idCard' | 'bankAccount' | 'auto';
  /** 自定义：开头保留位数（默认 3） */
  prefixLen?: number;
  /** 自定义：末尾保留位数（默认 4） */
  suffixLen?: number;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 空值占位符 */
  placeholder?: string;
}

export default function SensitiveText({
  text,
  type = 'auto',
  prefixLen,
  suffixLen,
  style,
  placeholder = '--',
}: SensitiveTextProps) {
  if (!text) {
    return <Text type="secondary">{placeholder}</Text>;
  }

  const mask = (raw: string, pre: number, suf: number): string => {
    if (raw.length <= pre + suf) {
      // 太短直接用星号
      return raw.slice(0, 1) + '***';
    }
    const stars = '*'.repeat(Math.min(raw.length - pre - suf, 4));
    return raw.slice(0, pre) + stars + raw.slice(raw.length - suf);
  };

  let masked = text;

  switch (type) {
    case 'phone':
      masked = mask(text, 3, 4);
      break;
    case 'idCard':
      masked = mask(text, 4, 4);
      break;
    case 'bankAccount':
      masked = mask(text, 4, 4);
      break;
    case 'auto':
    default: {
      const pre = prefixLen ?? 3;
      const suf = suffixLen ?? 4;
      if (text.length >= 7) {
        masked = mask(text, pre, suf);
      }
      break;
    }
  }

  return (
    <Text style={{ letterSpacing: '2px', color: 'rgba(0, 0, 0, 0.65)', ...style }}>
      {masked}
    </Text>
  );
}
