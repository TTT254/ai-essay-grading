/**
 * 教师个人信息页面
 */
import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Row,
  Col,
  Typography,
  Table,
  Statistic,
} from 'antd';
import {
  EditOutlined,
  LockOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { userService, classService, authService } from '../../services/supabase';
import api from '../../services/api';

const { Title } = Typography;

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  student_count: number;
  teacher_id: string;
}

interface TeacherStats {
  total_graded: number;
  average_grading_time: number;
  recent_activity: number;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [stats, setStats] = useState<TeacherStats>({
    total_graded: 0,
    average_grading_time: 0,
    recent_activity: 0,
  });
  const [loading, setLoading] = useState(false);
  const [classLoading, setClassLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [nameForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // 加载教师管理的班级
  useEffect(() => {
    const fetchClasses = async () => {
      if (user?.id) {
        setClassLoading(true);
        try {
          const { data, error } = await classService.getClassesByTeacher(user.id);
          if (error) throw error;
          setClasses(data || []);
        } catch (error: any) {
          console.error('获取班级信息失败:', error);
          message.error('获取班级信息失败');
        } finally {
          setClassLoading(false);
        }
      }
    };

    fetchClasses();
  }, [user?.id]);

  // 加载教师统计数据
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      setStatsLoading(true);
      try {
        const statsRes = await api.teacher.getStats(user.id);
        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } catch (error: any) {
        console.error('获取统计数据失败:', error);
        message.error('获取统计数据失败');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  // 计算班级统计数据
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0);
  const avgStudents = classes.length > 0 ? Math.round(totalStudents / classes.length) : 0;

  // 打开修改姓名 Modal
  const handleOpenNameModal = () => {
    nameForm.setFieldsValue({ name: user?.name });
    setNameModalOpen(true);
  };

  // 修改姓名
  const handleNameChange = async (values: { name: string }) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await userService.updateUser(user.id, {
        name: values.name,
      });

      if (error) throw error;

      // 更新本地状态
      updateUser({ ...user, name: values.name });
      message.success('姓名修改成功');
      setNameModalOpen(false);
      nameForm.resetFields();
    } catch (error: any) {
      message.error(error.message || '修改失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 打开修改密码 Modal
  const handleOpenPasswordModal = () => {
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  // 修改密码
  const handlePasswordChange = async (values: { newPassword: string; confirmPassword: string }) => {
    setLoading(true);
    try {
      const { error } = await authService.updatePassword(values.newPassword);
      if (error) throw error;

      message.success('密码修改成功，请重新登录', 3);

      // 3秒后自动登出并跳转到登录页
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      message.error(error.message || '修改失败，请稍后重试');
      setLoading(false);
    }
  };

  // 班级表格列定义
  const columns = [
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
      width: 100,
      render: (grade: number) => `${grade}年级`,
      sorter: (a: ClassInfo, b: ClassInfo) => a.grade - b.grade,
    },
    {
      title: '班级',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '学生人数',
      dataIndex: 'student_count',
      key: 'student_count',
      width: 120,
      render: (count: number) => (
        <Space>
          <TeamOutlined />
          <span>{count || 0}人</span>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ClassInfo) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => navigate('/teacher/assignments', { state: { classId: record.id } })}
          >
            查看作业
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => navigate('/teacher/dashboard', { state: { classId: record.id } })}
          >
            数据统计
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2}>个人信息</Title>
      </div>

      <Row gutter={[16, 16]}>
        {/* 基本信息卡片 */}
        <Col span={24}>
          <Card
            title="基本信息"
            extra={
              <Button type="link" icon={<EditOutlined />} onClick={handleOpenNameModal}>
                修改姓名
              </Button>
            }
          >
            <Descriptions column={2}>
              <Descriptions.Item label="姓名">{user?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{user?.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="角色">教师</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 批改统计信息 */}
        <Col span={8}>
          <Card loading={statsLoading}>
            <Statistic
              title="批改作业总数"
              value={stats.total_graded}
              prefix={<CheckCircleOutlined />}
              suffix="篇"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={statsLoading}>
            <Statistic
              title="平均批改时间"
              value={stats.average_grading_time}
              precision={2}
              prefix={<ClockCircleOutlined />}
              suffix="分钟"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={statsLoading}>
            <Statistic
              title="最近7天活跃度"
              value={stats.recent_activity}
              prefix={<ThunderboltOutlined />}
              suffix="篇"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        {/* 班级统计信息 */}
        <Col span={8}>
          <Card>
            <Statistic title="管理班级" value={classes.length} prefix={<TeamOutlined />} suffix="个" />
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
              value={avgStudents}
              prefix={<TeamOutlined />}
              suffix="人"
            />
          </Card>
        </Col>

        {/* 管理的班级列表 */}
        <Col span={24}>
          <Card title="管理的班级">
            <Table
              columns={columns}
              dataSource={classes}
              rowKey="id"
              loading={classLoading}
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
                showTotal: (total) => `共 ${total} 个班级`,
              }}
            />
          </Card>
        </Col>

        {/* 安全设置卡片 */}
        <Col span={24}>
          <Card title="安全设置">
            <Space>
              <Button icon={<LockOutlined />} onClick={handleOpenPasswordModal}>
                修改密码
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 修改姓名 Modal */}
      <Modal
        title="修改姓名"
        open={nameModalOpen}
        onCancel={() => {
          setNameModalOpen(false);
          nameForm.resetFields();
        }}
        footer={null}
      >
        <Form form={nameForm} layout="vertical" onFinish={handleNameChange}>
          <Form.Item
            label="姓名"
            name="name"
            rules={[
              { required: true, message: '请输入姓名' },
              { min: 2, message: '姓名至少2个字符' },
              { max: 20, message: '姓名不能超过20个字符' },
            ]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认修改
              </Button>
              <Button
                onClick={() => {
                  setNameModalOpen(false);
                  nameForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改密码 Modal */}
      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]/,
                message: '密码必须包含字母和数字',
              },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认修改
              </Button>
              <Button
                onClick={() => {
                  setPasswordModalOpen(false);
                  passwordForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
