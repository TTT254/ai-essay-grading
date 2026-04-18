/**
 * 邮箱确认回调页面
 * 处理用户点击邮件中的确认链接后的逻辑
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

type ConfirmStatus = 'loading' | 'success' | 'error';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuth, user } = useAuthStore();
  const [status, setStatus] = useState<ConfirmStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    handleEmailConfirmation();
  }, []);

  const handleEmailConfirmation = async () => {
    try {
      console.log('📧 [AuthCallback] 开始处理邮箱确认...');
      console.log('📧 [AuthCallback] 完整 URL', window.location.href);
      console.log('📧 [AuthCallback] Hash', window.location.hash);
      console.log('📧 [AuthCallback] Search', window.location.search);

      // Supabase 重定向后会自动建立 session
      // 我们只需要检查当前是否有 session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      console.log('📧 [AuthCallback] 当前 session', { session, sessionError });

      if (sessionError) {
        throw sessionError;
      }

      if (session?.user) {
        console.log('✅ [AuthCallback] 已有有效 session，邮箱确认成功', session.user.id);

        // 同步认证状态到 authStore
        await checkAuth();

        setStatus('success');

        // 2秒后自动跳转到对应角色首页
        setTimeout(() => {
          const currentUser = useAuthStore.getState().user;
          console.log('📧 [AuthCallback] 准备跳转', currentUser);

          if (currentUser?.role === 'student') {
            navigate('/student/tasks');
          } else if (currentUser?.role === 'teacher') {
            navigate('/teacher/classes');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
      } else {
        throw new Error('未找到有效的 session，邮箱确认可能已过期');
      }
    } catch (error: any) {
      console.error('❌ [AuthCallback] 邮箱确认失败', error);
      setStatus('error');
      setErrorMessage(error.message || '确认链接无效或已过期');
    }
  };

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: '#f5f5f5'
      }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />} />
        <p style={{ fontSize: '16px', color: '#666', marginTop: '16px' }}>
          正在确认您的邮箱...
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ padding: '100px 24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Result
          icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '72px' }} />}
          title="邮箱确认成功！"
          subTitle="您的账号已激活，正在跳转到首页..."
          extra={[
            <Button
              type="primary"
              size="large"
              key="home"
              onClick={() => {
                const currentUser = useAuthStore.getState().user;
                if (currentUser?.role === 'student') {
                  navigate('/student/tasks');
                } else if (currentUser?.role === 'teacher') {
                  navigate('/teacher/classes');
                } else {
                  navigate('/dashboard');
                }
              }}
            >
              立即前往
            </Button>
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '100px 24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Result
        icon={<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '72px' }} />}
        title="邮箱确认失败"
        subTitle={errorMessage}
        extra={[
          <Button key="home" size="large" onClick={() => navigate('/')}>
            返回首页
          </Button>,
          <Button type="primary" size="large" key="login" onClick={() => navigate('/login')}>
            前往登录
          </Button>
        ]}
      />
    </div>
  );
};

export default AuthCallback;
