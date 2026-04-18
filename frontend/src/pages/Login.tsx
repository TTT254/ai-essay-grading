/**
 * 登录页面 - 商业化版本
 */
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Typography, Alert } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  BarChartOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import './Login.css';

const { Title, Text } = Typography;

interface CaptchaData {
  captcha_id: string;
  captcha_code: string;
  expires_at: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const [form] = Form.useForm();
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 如果已登录，跳转到首页
  useEffect(() => {
    if (isAuthenticated) {
      // 已登录用户进入登录页时，统一跳转到仪表盘以便分流到对应角色
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

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

  useEffect(() => {
    loadCaptcha();
    return () => clearError();
  }, []);

  // 处理登录
  const handleSubmit = async (values: any) => {
    setSubmitError(null);
    try {
      // 先验证验证码
      if (captcha) {
        try {
          await api.auth.verifyCaptcha(captcha.captcha_id, values.captcha);
        } catch (captchaErr: any) {
          const reason = '验证码错误，请重新输入';
          message.error(reason);
          setSubmitError(reason);
          loadCaptcha();
          return;
        }
      }

      // 登录
      const success = await login(values.email, values.password);
      if (success) {
        setSubmitError(null);
        message.success('登录成功');
        const user = useAuthStore.getState().user;
        if (user?.role === 'student') {
          navigate('/student');
        } else if (user?.role === 'teacher') {
          navigate('/teacher');
        } else {
          // 兜底跳转：若角色缺失，交给 /dashboard 统一分流
          navigate('/dashboard');
        }
      } else {
        const reason = error || '登录失败，请检查邮箱和密码';
        message.error(reason);
        setSubmitError(reason);
        loadCaptcha(); // 刷新验证码
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const reason = err?.response?.data?.detail || err?.message || '登录失败，请检查邮箱和密码';
      message.error(reason);
      setSubmitError(reason);
      loadCaptcha(); // 刷新验证码
    }
  };

  return (
    <div className="login-container">
      {/* 左侧品牌展示区 */}
      <div className="login-visual">
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
              智能批改 · 精准辅导 · 数据驱动教学
            </Text>
          </div>

          {/* 特性卡片 */}
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-card-icon">
                <ThunderboltOutlined />
              </div>
              <div className="feature-card-title">秒级批改</div>
              <div className="feature-card-desc">
                AI智能分析，3秒完成全文批改
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <CheckCircleOutlined />
              </div>
              <div className="feature-card-title">多维评分</div>
              <div className="feature-card-desc">
                内容、结构、语言、书写四维度打分
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <TeamOutlined />
              </div>
              <div className="feature-card-title">个性化辅导</div>
              <div className="feature-card-desc">
                AI对话式教学，实时答疑解惑
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <BarChartOutlined />
              </div>
              <div className="feature-card-title">数据分析</div>
              <div className="feature-card-desc">
                学情可视化，精准把握教学重点
              </div>
            </div>
          </div>

          {/* 数据统计 */}
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-value">10W+</div>
              <div className="stat-label">累计批改作文</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">95%</div>
              <div className="stat-label">教师满意度</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">24/7</div>
              <div className="stat-label">全天候服务</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="login-form-section">
        {/* 返回首页按钮 */}
        <Link to="/" className="back-home-btn">
          <HomeOutlined /> 返回首页
        </Link>

        <Card className="login-card">
          <div className="login-header">
            <Title level={2}>欢迎回来</Title>
            <Text type="secondary">登录您的账号开始使用</Text>
          </div>

          {submitError && (
            <div style={{ marginBottom: 16 }}>
              <Alert
                type="error"
                message="登录失败"
                description={submitError}
                showIcon
                closable
                onClose={() => { setSubmitError(null); clearError(); }}
              />
            </div>
          )}

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            onValuesChange={() => { if (submitError) { setSubmitError(null); clearError(); } }}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="邮箱"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item
              name="captcha"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <Input
                prefix={<SafetyOutlined />}
                placeholder="验证码"
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
                className="login-button"
                loading={isLoading}
                block
              >
                登录
              </Button>
            </Form.Item>

            <div className="login-footer">
              <Text type="secondary">还没有账号？</Text>
              <Link to="/register" className="register-link">
                立即注册
              </Link>
            </div>
          </Form>
        </Card>

        <div className="login-tips">
          © 2026 AI作文批改系统 · 让每一次写作都有提升
        </div>
      </div>
    </div>
  );
};

export default Login;
