/**
 * 学生错题本页面 - 重新设计版
 */
import React, { useState, useEffect } from 'react';
import { Tag, Typography, Button, Segmented, message } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import './Mistakes.css';

const { Text } = Typography;

interface Mistake {
  id: string;
  error_type: string;
  original_text: string;
  correct_text: string;
  description: string;
  occurrence_count: number;
  is_mastered: boolean;
  created_at: string;
}

const errorTypeMap: Record<string, { color: string; text: string; tagColor: string }> = {
  typo:        { color: '#ff4d4f', text: '错别字',  tagColor: 'red' },
  grammar:     { color: '#fa8c16', text: '语法错误', tagColor: 'orange' },
  punctuation: { color: '#0066FF', text: '标点错误', tagColor: 'blue' },
  logic:       { color: '#722ed1', text: '逻辑问题', tagColor: 'purple' },
  structure:   { color: '#13c2c2', text: '结构问题', tagColor: 'cyan' },
};

const filterOptions = [
  { label: '全部',   value: 'all' },
  { label: '错别字', value: 'typo' },
  { label: '语法',   value: 'grammar' },
  { label: '标点',   value: 'punctuation' },
  { label: '逻辑',   value: 'logic' },
  { label: '结构',   value: 'structure' },
];

const Mistakes: React.FC = () => {
  const { user } = useAuthStore();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const [masteringIds, setMasteringIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      loadMistakes();
    }
  }, [user, filterType]);

  const loadMistakes = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await api.mistakes.getMistakes(
        user.id,
        filterType === 'all' ? undefined : filterType
      );
      const mistakesData = response?.data || response || [];
      setMistakes(Array.isArray(mistakesData) ? mistakesData : []);
    } catch (err: unknown) {
      void err;
      setMistakes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkMastered = async (mistakeId: string) => {
    // 乐观更新
    setMistakes((prev) =>
      prev.map((m) => (m.id === mistakeId ? { ...m, is_mastered: true } : m))
    );
    setMasteringIds((prev) => new Set(prev).add(mistakeId));

    try {
      await api.mistakes.markMastered(mistakeId);
      message.success('已标记为掌握');
    } catch {
      // 回滚乐观更新
      setMistakes((prev) =>
        prev.map((m) => (m.id === mistakeId ? { ...m, is_mastered: false } : m))
      );
      message.error('标记失败，请重试');
    } finally {
      setMasteringIds((prev) => {
        const next = new Set(prev);
        next.delete(mistakeId);
        return next;
      });
    }
  };

  const totalCount = mistakes.length;
  const masteredCount = mistakes.filter((m) => m.is_mastered).length;
  const remainingCount = totalCount - masteredCount;

  return (
    <div className="page-container mistakes-page">
      {/* Header */}
      <div className="page-header">
        <div className="mistakes-title">
          <BookOutlined style={{ color: '#0066FF', marginRight: 10 }} />
          我的错题本
        </div>
        <Text type="secondary">自动聚合所有作文中的错误，帮助针对性改进</Text>
      </div>

      {/* Stats bar */}
      <div className="mistakes-stats-bar">
        <div className="stat-item">
          <span className="stat-number" style={{ color: '#0066FF' }}>{totalCount}</span>
          <span className="stat-label">总错误数</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number" style={{ color: '#52c41a' }}>{masteredCount}</span>
          <span className="stat-label">已掌握</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number" style={{ color: '#fa8c16' }}>{remainingCount}</span>
          <span className="stat-label">待掌握</span>
        </div>
        {totalCount > 0 && (
          <>
            <div className="stat-divider" />
            <div className="stat-item stat-progress-item">
              <div className="stat-progress-bar">
                <div
                  className="stat-progress-fill"
                  style={{ width: `${(masteredCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="stat-label">
                掌握率 {Math.round((masteredCount / totalCount) * 100)}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Filter bar */}
      <div className="mistakes-filter-bar">
        <Segmented
          options={filterOptions}
          value={filterType}
          onChange={(val) => setFilterType(val as string)}
        />
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="mistakes-loading">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="mistake-card-skeleton" />
          ))}
        </div>
      ) : mistakes.length === 0 ? (
        <div className="mistakes-empty">
          <div className="mistakes-empty-icon">
            <FileTextOutlined />
          </div>
          <div className="mistakes-empty-title">暂无错误记录</div>
          <div className="mistakes-empty-desc">
            {filterType === 'all'
              ? '你的作文中还没有记录错误，继续保持！'
              : `暂无「${errorTypeMap[filterType]?.text || filterType}」类型的错误`}
          </div>
        </div>
      ) : (
        <div className="mistakes-grid">
          {mistakes.map((mistake) => {
            const typeInfo = errorTypeMap[mistake.error_type] || {
              color: '#999',
              text: mistake.error_type,
              tagColor: 'default',
            };
            return (
              <div
                key={mistake.id}
                className={`mistake-card ${mistake.is_mastered ? 'mastered' : ''}`}
              >
                {mistake.is_mastered && (
                  <div className="mastered-overlay">
                    <CheckCircleOutlined />
                    <span>已掌握</span>
                  </div>
                )}
                <div className="mistake-card-header">
                  <Tag color={typeInfo.tagColor}>{typeInfo.text}</Tag>
                  {mistake.occurrence_count > 1 && (
                    <Tag color={mistake.occurrence_count > 3 ? 'red' : 'orange'}>
                      出现{mistake.occurrence_count}次
                    </Tag>
                  )}
                </div>
                <div className="mistake-correction">
                  <span className="mistake-original">{mistake.original_text}</span>
                  <span className="mistake-arrow">→</span>
                  <span className="mistake-correct">{mistake.correct_text}</span>
                </div>
                {mistake.description && (
                  <div className="mistake-desc">{mistake.description}</div>
                )}
                {!mistake.is_mastered && (
                  <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<CheckCircleOutlined />}
                    loading={masteringIds.has(mistake.id)}
                    onClick={() => handleMarkMastered(mistake.id)}
                    className="mastered-btn"
                  >
                    标记已掌握
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Mistakes;
