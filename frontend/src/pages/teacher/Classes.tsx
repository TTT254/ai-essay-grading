/**
 * 教师班级管理页面 — 卡片网格布局 + FAB 按钮
 */
import React, { useEffect } from 'react';
import { Button, Statistic, Row, Col, Card, Typography, Tooltip } from 'antd';
import { TeamOutlined, PlusOutlined, BarChartOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTeacherStore } from '../../store/teacherStore';
import dayjs from 'dayjs';
import './Classes.css';

const { Title } = Typography;

/** 生成头像颜色（基于字符串哈希） */
const avatarColors = ['#0066FF', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

interface ClassItem {
  id: string;
  grade: number;
  name: string;
  teacher_id: string;
  student_count?: number;
  created_at?: string;
}

const Classes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { classes, fetchClasses, isLoading } = useTeacherStore();

  useEffect(() => {
    if (user?.id) {
      fetchClasses(user.id);
    }
  }, [user]);

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0);

  const renderAvatarStack = (cls: ClassItem) => {
    const count = cls.student_count || 0;
    const shown = Math.min(count, 3);
    const extra = count - shown;
    const avatars = Array.from({ length: shown }, (_, i) => {
      const label = `S${i + 1}`;
      return (
        <div
          key={i}
          className="class-avatar-item"
          style={{ background: getAvatarColor(`${cls.id}-${i}`) }}
        >
          {label}
        </div>
      );
    });
    if (extra > 0) {
      avatars.push(
        <div key="more" className="class-avatar-item class-avatar-more">
          +{extra}
        </div>
      );
    }
    return avatars;
  };

  return (
    <div className="page-container classes-page">
      <div className="page-header">
        <Title level={2}>班级管理</Title>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="班级总数" value={classes.length} prefix={<TeamOutlined />} suffix="个" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="学生总数" value={totalStudents} prefix={<TeamOutlined />} suffix="人" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均班级人数"
              value={classes.length > 0 ? Math.round(totalStudents / classes.length) : 0}
              prefix={<TeamOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
      </Row>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#bbb' }}>加载中...</div>
      ) : classes.length === 0 ? (
        <div className="classes-empty">暂无班级，点击右下角按钮创建</div>
      ) : (
        <div className="classes-grid">
          {(classes as ClassItem[]).map((cls) => (
            <div key={cls.id} className="class-card">
              <div className="class-card-header">
                <div className="class-card-grade">{cls.grade} 年级</div>
                <div className="class-card-name">{cls.name}</div>
              </div>
              <div className="class-card-body">
                <div className="class-avatar-stack">
                  {renderAvatarStack(cls)}
                  <span className="class-student-count">{cls.student_count || 0} 名学生</span>
                </div>
                <div className="class-meta-row">
                  <TeamOutlined />
                  <span>班主任：{user?.name || '—'}</span>
                </div>
                {cls.created_at && (
                  <div className="class-meta-row">
                    <span>创建于 {dayjs(cls.created_at).format('YYYY-MM-DD')}</span>
                  </div>
                )}
              </div>
              <div className="class-card-footer">
                <Button
                  type="primary"
                  size="small"
                  icon={<UnorderedListOutlined />}
                  onClick={() => navigate('/teacher/assignments', { state: { classId: cls.id } })}
                >
                  查看作业
                </Button>
                <Button
                  size="small"
                  icon={<BarChartOutlined />}
                  onClick={() => navigate('/teacher/dashboard', { state: { classId: cls.id } })}
                >
                  数据统计
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Tooltip title="创建班级" placement="left">
        <button
          className="classes-fab"
          onClick={() => navigate('/teacher/assignments')}
          aria-label="创建班级"
        >
          <PlusOutlined />
        </button>
      </Tooltip>
    </div>
  );
};

export default Classes;
