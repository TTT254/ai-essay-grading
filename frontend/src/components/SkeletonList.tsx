/**
 * 骨架屏列表组件 - 渲染多个骨架卡片用于页面加载占位
 */
import React from 'react';
import SkeletonCard from './SkeletonCard';

interface SkeletonListProps {
  count?: number;
  rows?: number;
  avatar?: boolean;
}

const SkeletonList: React.FC<SkeletonListProps> = ({ count = 3, rows = 3, avatar = false }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} rows={rows} avatar={avatar} />
    ))}
  </>
);

export default SkeletonList;
