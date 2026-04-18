/**
 * 学生作文任务列表页 — 卡片网格布局
 */
import React, { useEffect, useState } from 'react';
import { Button, Tag, Typography, Card, Radio, Spin } from 'antd';
import { ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import dayjs from 'dayjs';
import './Tasks.css';

const { Title } = Typography;

type FilterKey = 'all' | 'pending' | 'submitted' | 'graded';

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { assignments, fetchAssignments, isLoading } = useStudentStore();
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    if (user?.id) {
      fetchAssignments(user.id);
    }
  }, [user]);

  const getDeadlineInfo = (deadline: string) => {
    const now = dayjs();
    const deadlineDate = dayjs(deadline);
    const diff = deadlineDate.diff(now, 'day');
    const diffHours = deadlineDate.diff(now, 'hour');

    if (diff < 0) {
      return { label: '已截止', className: 'task-deadline-overdue', icon: true };
    } else if (diff === 0) {
      return { label: `今日截止（剩余 ${diffHours} 小时）`, className: 'task-deadline-urgent', icon: true };
    } else if (diff <= 3) {
      return { label: `还剩 ${diff} 天`, className: 'task-deadline-urgent', icon: true };
    } else {
      return { label: deadlineDate.format('MM-DD HH:mm 截止'), className: 'task-deadline-normal', icon: false };
    }
  };

  const getSubmissionStatus = (record: any) => {
    const status: string = record.status || '';
    if (status === 'published' || status === 'teacher_reviewed') {
      return { text: '已批改', color: 'success' };
    } else if (status === 'submitted' || status === 'ai_graded' || status === 'graded') {
      return { text: '已提交', color: 'processing' };
    }
    return { text: '未提交', color: 'default' };
  };

  const getWordCountLabel = (record: any) => {
    if (record.word_count_min && record.word_count_max) {
      return `${record.word_count_min}–${record.word_count_max} 字`;
    } else if (record.word_count_min) {
      return `不少于 ${record.word_count_min} 字`;
    }
    return null;
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'all') return true;
    const status: string = (a as any).status || '';
    if (filter === 'graded') return status === 'published' || status === 'teacher_reviewed';
    if (filter === 'submitted') return status === 'submitted' || status === 'ai_graded' || status === 'graded';
    if (filter === 'pending') return !status || status === 'pending' || status === '';
    return true;
  });

  return (
    <div className="page-container tasks-page">
      <div className="page-header">
        <Title level={2}>作文任务</Title>
      </div>

      <div className="tasks-filter-bar">
        <Radio.Group
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterKey)}
          buttonStyle="solid"
        >
          <Radio.Button value="all">全部 ({assignments.length})</Radio.Button>
          <Radio.Button value="pending">待提交</Radio.Button>
          <Radio.Button value="submitted">已提交</Radio.Button>
          <Radio.Button value="graded">已批改</Radio.Button>
        </Radio.Group>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="task-empty">
          <div className="task-empty-icon">
            <FileTextOutlined />
          </div>
          <div className="task-empty-text">暂无作文任务</div>
        </div>
      ) : (
        <div className="tasks-grid">
          {filteredAssignments.map((assignment) => {
            const deadlineInfo = getDeadlineInfo(assignment.deadline);
            const submissionStatus = getSubmissionStatus(assignment);
            const wordCountLabel = getWordCountLabel(assignment);
            const isOverdue = dayjs(assignment.deadline).isBefore(dayjs());

            return (
              <Card key={assignment.id} className="task-card" bodyStyle={{ padding: '20px' }}>
                <div className="task-card-header">
                  <div className="task-card-title">{assignment.title}</div>
                  <Tag color={submissionStatus.color}>{submissionStatus.text}</Tag>
                </div>

                <div className="task-card-desc">
                  {assignment.description || '暂无描述'}
                </div>

                <div className="task-card-meta">
                  <span className={`task-deadline ${deadlineInfo.className}`}>
                    {deadlineInfo.icon && <ClockCircleOutlined style={{ marginRight: 4 }} />}
                    {deadlineInfo.label}
                  </span>
                  {wordCountLabel && (
                    <span className="task-word-badge">{wordCountLabel}</span>
                  )}
                </div>

                <div className="task-card-footer">
                  <span style={{ fontSize: 12, color: '#bbb' }}>
                    {dayjs(assignment.deadline).format('YYYY-MM-DD HH:mm')}
                  </span>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => navigate(`/student/submit/${assignment.id}`)}
                    disabled={isOverdue}
                  >
                    开始写作
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tasks;
