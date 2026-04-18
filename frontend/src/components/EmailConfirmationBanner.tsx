/**
 * 邮箱确认提示横幅
 * 在用户未确认邮箱时显示
 */
import React, { useState } from 'react';
import { Alert, Button, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const EmailConfirmationBanner: React.FC = () => {
  const { user, resendConfirmationEmail } = useAuthStore();
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // 如果邮箱已确认或用户已关闭提示，不显示
  if (!user || user.email_confirmed_at || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    try {
      const success = await resendConfirmationEmail();
      if (success) {
        message.success('确认邮件已发送，请查收邮箱');
      } else {
        message.error('发送失败，请稍后重试');
      }
    } catch (error) {
      message.error('发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  return (
    <Alert
      type="warning"
      message="邮箱未确认"
      description={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span>
            您的邮箱 <strong>{user.email}</strong> 尚未确认。
            为了账号安全，请前往邮箱查收确认邮件。
          </span>
          <Button
            size="small"
            icon={<MailOutlined />}
            loading={sending}
            onClick={handleResend}
          >
            重新发送
          </Button>
        </div>
      }
      showIcon
      closable
      onClose={() => setDismissed(true)}
      style={{ marginBottom: '16px' }}
    />
  );
};

export default EmailConfirmationBanner;
