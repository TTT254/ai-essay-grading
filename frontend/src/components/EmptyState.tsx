/**
 * 空状态组件 - 用于列表为空时的友好提示
 */
import { Empty, Button } from 'antd';
import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionText, onAction }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
    <Empty
      description={
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', marginBottom: 8 }}>{title}</div>
          {description && <div style={{ fontSize: 14, color: '#666' }}>{description}</div>}
        </div>
      }
    />
    {actionText && onAction && (
      <Button type="primary" onClick={onAction} style={{ marginTop: 16, background: '#0066FF' }}>
        {actionText}
      </Button>
    )}
  </div>
);

export default EmptyState;
