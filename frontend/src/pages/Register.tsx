/**
 * 注册页面
 */
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Typography, Select, Radio, Modal } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SafetyOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  EditOutlined,
  FileSearchOutlined,
  BookOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import './Register.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface CaptchaData {
  captcha_id: string;
  captcha_code: string;
  expires_at: string;
}

interface Class {
  id: string;
  grade: number;
  name: string;  // 数据库使用 name 字段
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, clearError } = useAuthStore();
  const [form] = Form.useForm();
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  // 加载验证码
  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const data = await api.auth.getCaptcha();
      setCaptcha(data);
      form.setFieldValue('captcha', '');
    } catch (err: any) {
      message.error('加载验证码失败，请点击重试');
      setCaptcha(null);
    } finally {
      setCaptchaLoading(false);
    }
  };

  // 加载班级列表
  const loadClasses = async () => {
    try {
      const result = await api.auth.getClasses();
      setClasses(result.data || []);
    } catch (err: any) {
      message.error(`加载班级列表失败: ${err.message || '未知错误'}`);
    }
  };

  useEffect(() => {
    loadCaptcha();
    loadClasses();
    return () => clearError();
  }, []);

  // 处理注册
  const handleSubmit = async (values: any) => {
    if (values.role === 'student' && !values.class_id) {
      message.warning('学生请选择班级');
      return;
    }

    const userData = {
      name: values.name,
      role: values.role,
      class_id: values.role === 'student' ? values.class_id : undefined,
    };

    try {
      message.loading({ content: '正在注册，请稍候...', key: 'register', duration: 0 });
      const success = await register(values.email, values.password, userData);
      message.destroy('register');

      if (success) {
        // 检查是否已经自动登录
        const currentUser = useAuthStore.getState().user;
        const isLoggedIn = useAuthStore.getState().isAuthenticated;

        if (isLoggedIn && currentUser) {
          Modal.success({
            title: '注册成功！',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            content: '您的账号已创建成功，现在可以开始使用系统。',
            okText: '立即开始',
            onOk: () => {
              if (currentUser.role === 'student') {
                navigate('/student/select-class');
              } else if (currentUser.role === 'teacher') {
                navigate('/teacher/classes');
              } else {
                navigate('/dashboard');
              }
            },
          });
        } else {
          // 注册成功但需要邮箱确认
          Modal.success({
            title: '注册成功！',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            content: (
              <div>
                <p>您的账号已创建成功！</p>
                <p>我们已向您的邮箱发送了确认邮件，请查收并确认后即可登录。</p>
              </div>
            ),
            okText: '前往登录',
            onOk: () => {
              navigate('/login');
            },
          });
        }
      } else {
        // 注册失败，从 store 获取最新错误信息
        const storeError = useAuthStore.getState().error;
        const errMsg = storeError || '注册失败，请检查邮箱是否已被使用';
        message.error(errMsg);
        loadCaptcha();
      }
    } catch (err: any) {
      message.destroy('register');
      const errMsg = err.response?.data?.detail || err.message || '注册失败，请重试';
      message.error(errMsg);
      loadCaptcha();
    }
  };

  // 获取当前年级的班级
  const getClassesByGrade = () => {
    if (!selectedGrade) return classes;
    return classes.filter((c) => c.grade === selectedGrade);
  };

  return (
    <div className="register-container">
      {/* 左侧品牌展示区 */}
      <div className="register-visual">
        <div className="visual-content">
          {/* Logo区域 */}
          <div className="logo-section">
            <div className="logo-icon">
              <RobotOutlined />
            </div>
            <Title level={1} className="logo-title">
              AI作文批改系统
            </Title>
            <Text className="logo-subtitle">
              开启智能写作新时代
            </Text>
          </div>

          {/* 价值卡片 */}
          <div className="value-cards">
            <div className="value-card">
              <div className="value-card-icon">
                <EditOutlined />
              </div>
              <div>
                <div className="value-card-title">智能批改</div>
                <div className="value-card-desc">AI秒级完成多维度作文评分</div>
              </div>
            </div>

            <div className="value-card">
              <div className="value-card-icon">
                <FileSearchOutlined />
              </div>
              <div>
                <div className="value-card-title">精准分析</div>
                <div className="value-card-desc">内容、结构、语言全面诊断</div>
              </div>
            </div>

            <div className="value-card">
              <div className="value-card-icon">
                <BookOutlined />
              </div>
              <div>
                <div className="value-card-title">持续进步</div>
                <div className="value-card-desc">个性化辅导助力写作成长</div>
              </div>
            </div>
          </div>

          {/* 底部统计 */}
          <div className="register-stats-row">
            <div className="register-stat-item">
              <div className="register-stat-value">10W+</div>
              <div className="register-stat-label">累计批改</div>
            </div>
            <div className="register-stat-item">
              <div className="register-stat-value">4维度</div>
              <div className="register-stat-label">评分体系</div>
            </div>
            <div className="register-stat-item">
              <div className="register-stat-value">K-12</div>
              <div className="register-stat-label">全学段覆盖</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧注册表单区 */}
      <div className="register-form-section">
        {/* 返回首页按钮 */}
        <Link to="/" className="back-home-btn">
          <HomeOutlined /> 返回首页
        </Link>

        <Card className="register-card">
          <div className="register-header">
            <Title level={2}>创建账号</Title>
            <Text type="secondary">注册后即可开始智能作文批改</Text>
          </div>

          <Form
            form={form}
            name="register"
            onFinish={handleSubmit}
            onFinishFailed={(errorInfo) => {
              const firstField = errorInfo.errorFields[0]?.name[0];
              if (firstField) {
                message.warning(`请填写必填项：${errorInfo.errorFields.map(f => f.errors[0]).join('、')}`);
              }
            }}
            autoComplete="off"
            size="large"
            initialValues={{ role: 'student' }}
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="姓名"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="邮箱"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码（至少6位）"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次密码输入不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="确认密码"
              />
            </Form.Item>

            <Form.Item
              name="role"
              label="身份"
              rules={[{ required: true }]}
            >
              <Radio.Group onChange={(e) => setRole(e.target.value)}>
                <Radio value="student">学生</Radio>
                <Radio value="teacher">教师</Radio>
              </Radio.Group>
            </Form.Item>

            {role === 'student' && (
              <>
                <Form.Item label="年级">
                  <Select
                    placeholder="选择年级"
                    onChange={(grade) => {
                      setSelectedGrade(grade);
                      form.setFieldValue('class_id', undefined);
                    }}
                    allowClear
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                      <Option key={grade} value={grade}>
                        {grade}年级
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="class_id"
                  label="班级"
                >
                  <Select placeholder="选择班级">
                    {getClassesByGrade().map((cls) => (
                      <Option key={cls.id} value={cls.id}>
                        {cls.grade}年级{cls.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </>
            )}

            <Form.Item
              name="captcha"
            >
              <Input
                prefix={<SafetyOutlined />}
                placeholder="验证码（选填）"
                addonAfter={
                  <div
                    className="captcha-code"
                    onClick={loadCaptcha}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {captchaLoading ? '加载中...' : (captcha?.captcha_code || '点击刷新')}
                  </div>
                }
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="register-button"
                loading={isLoading}
                block
              >
                注册
              </Button>
            </Form.Item>

            <div className="register-footer">
              <Text type="secondary">已有账号？</Text>
              <Link to="/login" className="login-link">立即登录</Link>
            </div>
          </Form>
        </Card>

        <div className="register-tips">
          © 2026 AI作文批改系统 · 让每一次写作都有提升
        </div>
      </div>
    </div>
  );
};

export default Register;
