/**
 * 骨架屏卡片组件 - 用于列表/卡片加载占位
 */
import { Skeleton } from 'antd';
import React from 'react';

interface SkeletonCardProps {
  rows?: number;
  avatar?: boolean;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ rows = 3, avatar = false }) => (
  <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 16 }}>
    <Skeleton active avatar={avatar} paragraph={{ rows }} />
  </div>
);

export default SkeletonCard;
