/**
 * 教师班级管理页面 — 卡片网格布局 + FAB 按钮
 */
import React, { useEffect } from 'react';
import { Button, Statistic, Row, Col, Card, Typography, Tooltip, Modal, Form, Input, Select, message } from 'antd';
import { TeamOutlined, PlusOutlined, BarChartOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTeacherStore } from '../../store/teacherStore';
import dayjs from 'dayjs';
import './Classes.css';

const { Title } = Typography;
const { Option } = Select;

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
  const { classes, fetchClasses, createClass, isLoading } = useTeacherStore();
  const [form] = Form.useForm();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchClasses(user.id);
    }
  }, [user]);

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0);

  const handleCreateClass = async (values: { grade: number; name: string }) => {
    if (!user?.id) {
      message.error('请先登录教师账号');
      return;
    }

    const success = await createClass({
      grade: values.grade,
      name: values.name.trim(),
      teacher_id: user.id,
    });

    if (success) {
      message.success('班级创建成功');
      setIsCreateModalOpen(false);
      form.resetFields();
      fetchClasses(user.id);
    } else {
      const error = useTeacherStore.getState().error;
      message.error(error || '创建班级失败');
    }
  };

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
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="创建班级"
        >
          <PlusOutlined />
        </button>
      </Tooltip>

      <Modal
        title="创建班级"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateClass}
          initialValues={{ grade: 1, name: '1班' }}
        >
          <Form.Item
            label="年级"
            name="grade"
            rules={[{ required: true, message: '请选择年级' }]}
          >
            <Select placeholder="选择年级">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                <Option key={grade} value={grade}>
                  {grade}年级
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="班级名称"
            name="name"
            rules={[
              { required: true, message: '请输入班级名称' },
              { whitespace: true, message: '班级名称不能为空' },
            ]}
          >
            <Input placeholder="例如：1班" maxLength={100} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} block>
              创建班级
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Classes;
