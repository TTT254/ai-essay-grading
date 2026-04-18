/**
 * 页面级加载组件 - 使用骨架屏替代纯 Spin
 */
import React from 'react';
import { Skeleton } from 'antd';

const Loading: React.FC = () => {
  return (
    <div style={{
      padding: '40px 24px',
      maxWidth: 900,
      margin: '0 auto',
      minHeight: '100vh',
      background: 'var(--bg-color, #F8FAFC)',
    }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 16 }}
        >
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      ))}
    </div>
  );
};

export default Loading;
