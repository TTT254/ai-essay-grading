/**
 * 学生个人信息页面
 */
import React, { useEffect, useState, useRef } from 'react';
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
  Empty,
  Typography,
  Statistic,
  Radio,
} from 'antd';
import {
  EditOutlined,
  LockOutlined,
  TeamOutlined,
  FileTextOutlined,
  TrophyOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import { useAuthStore } from '../../store/authStore';
import { userService, classService, authService } from '../../services/supabase';
import api from '../../services/api';

const { Title } = Typography;

type TimeRange = '1m' | '3m' | 'all';

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  teacher_id: string;
}

interface StudentStats {
  total_submitted: number;
  total_graded: number;
  average_score: number;
  highest_score: number;
}

interface LearningCurveData {
  date: string;
  score: number;
  content_score: number;
  structure_score: number;
  language_score: number;
  title: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [stats, setStats] = useState<StudentStats>({
    total_submitted: 0,
    total_graded: 0,
    average_score: 0,
    highest_score: 0,
  });
  const [learningCurve, setLearningCurve] = useState<LearningCurveData[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [loading, setLoading] = useState(false);
  const [classLoading, setClassLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const chartRef = useRef<HTMLDivElement>(null);
  const [nameForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // 加载班级信息
  useEffect(() => {
    const fetchClassInfo = async () => {
      if (user?.class_id) {
        setClassLoading(true);
        try {
          const { data, error } = await classService.getClassById(user.class_id);
          if (error) throw error;
          setClassInfo(data);
        } catch (error: any) {
          console.error('获取班级信息失败:', error);
        } finally {
          setClassLoading(false);
        }
      }
    };

    fetchClassInfo();
  }, [user?.class_id]);

  // 加载统计数据
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      setStatsLoading(true);
      try {
        const statsRes = await api.student.getStats(user.id);
        if (statsRes.success) {
          setStats(statsRes.data);
        }

        const curveRes = await api.student.getLearningCurve(user.id);
        if (curveRes.success) {
          setLearningCurve(curveRes.data);
        }
      } catch (error: any) {
        message.error('获取统计数据失败');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  // 根据时间范围过滤数据
  const getFilteredCurve = (): LearningCurveData[] => {
    if (timeRange === 'all') return learningCurve;
    const now = new Date();
    const cutoff = new Date(now);
    if (timeRange === '1m') cutoff.setMonth(now.getMonth() - 1);
    else if (timeRange === '3m') cutoff.setMonth(now.getMonth() - 3);
    return learningCurve.filter((item) => new Date(item.date) >= cutoff);
  };

  // 渲染学习曲线图表
  useEffect(() => {
    const filtered = getFilteredCurve();
    if (!chartRef.current || filtered.length === 0) return;

    const chart = echarts.init(chartRef.current);

    const dates = filtered.map((item) => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const option = {
      title: { text: '学习曲线', left: 'center' },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          const idx = params[0].dataIndex;
          const item = filtered[idx];
          const dateStr = dates[idx];
          let html = `<b>${item.title}</b><br/>日期: ${dateStr}<br/>`;
          params.forEach((p: any) => {
            html += `${p.marker}${p.seriesName}: ${p.value}分<br/>`;
          });
          return html;
        },
      },
      legend: {
        data: ['总分', '思想内容', '结构安排', '语言表达'],
        top: 30,
      },
      xAxis: {
        type: 'category',
        data: dates,
        name: '提交时间',
      },
      yAxis: {
        type: 'value',
        name: '分数',
        min: 0,
        max: 100,
      },
      series: [
        {
          name: '总分',
          data: filtered.map((d) => d.score),
          type: 'line',
          smooth: true,
          lineStyle: { color: '#1890ff', width: 3 },
          itemStyle: { color: '#1890ff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(24, 144, 255, 0.25)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.02)' },
            ]),
          },
        },
        {
          name: '思想内容',
          data: filtered.map((d) => d.content_score),
          type: 'line',
          smooth: true,
          lineStyle: { color: '#52c41a', width: 2 },
          itemStyle: { color: '#52c41a' },
        },
        {
          name: '结构安排',
          data: filtered.map((d) => d.structure_score),
          type: 'line',
          smooth: true,
          lineStyle: { color: '#faad14', width: 2 },
          itemStyle: { color: '#faad14' },
        },
        {
          name: '语言表达',
          data: filtered.map((d) => d.language_score),
          type: 'line',
          smooth: true,
          lineStyle: { color: '#f5222d', width: 2 },
          itemStyle: { color: '#f5222d' },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [learningCurve, timeRange]);

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
      const { error } = await userService.updateUser(user.id, {
        name: values.name,
      });

      if (error) throw error;

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

      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      message.error(error.message || '修改失败，请稍后重试');
      setLoading(false);
    }
  };

  const filteredCurve = getFilteredCurve();

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
              <Descriptions.Item label="角色">学生</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 统计信息卡片 */}
        <Col span={8}>
          <Card loading={statsLoading}>
            <Statistic
              title="已提交作业"
              value={stats.total_submitted}
              prefix={<FileTextOutlined />}
              suffix="篇"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={statsLoading}>
            <Statistic
              title="平均分"
              value={stats.average_score}
              precision={2}
              prefix={<LineChartOutlined />}
              suffix="分"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={statsLoading}>
            <Statistic
              title="最高分"
              value={stats.highest_score}
              precision={2}
              prefix={<TrophyOutlined />}
              suffix="分"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        {/* 学习曲线图 */}
        {learningCurve.length > 0 && (
          <Col span={24}>
            <Card
              title="学习曲线"
              loading={statsLoading}
              extra={
                <Radio.Group
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  size="small"
                >
                  <Radio.Button value="1m">近1个月</Radio.Button>
                  <Radio.Button value="3m">近3个月</Radio.Button>
                  <Radio.Button value="all">全部</Radio.Button>
                </Radio.Group>
              }
            >
              {filteredCurve.length > 0 ? (
                <div ref={chartRef} style={{ width: '100%', height: 400 }} />
              ) : (
                <Empty description="该时间段内暂无数据" />
              )}
            </Card>
          </Col>
        )}

        {/* 班级信息卡片 */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <TeamOutlined />
                班级信息
              </Space>
            }
            loading={classLoading}
          >
            {classInfo ? (
              <Descriptions column={2}>
                <Descriptions.Item label="年级">{classInfo.grade}年级</Descriptions.Item>
                <Descriptions.Item label="班级">{classInfo.name}</Descriptions.Item>
              </Descriptions>
            ) : user?.class_id ? (
              <Empty description="班级信息加载失败" />
            ) : (
              <Empty description="未加入班级">
                <Button type="primary" onClick={() => navigate('/student/select-class')}>
                  选择班级
                </Button>
              </Empty>
            )}
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
