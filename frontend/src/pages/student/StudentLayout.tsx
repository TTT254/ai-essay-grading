/**
 * 学生端布局组件 - 现代侧边栏设计
 */
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Tooltip, message, Popover, Button, List } from 'antd';
import {
  UnorderedListOutlined,
  EditOutlined,
  HistoryOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  RobotOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import EmailConfirmationBanner from '../../components/EmailConfirmationBanner';
import './StudentLayout.css';

const { Content, Sider } = Layout;

interface Notification {
  id: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: '作文批改完成',
    content: '您的作文《春天》已批改完成，得分 85 分',
    read: false,
    createdAt: '2026-04-13',
  },
  {
    id: '2',
    title: '新作业发布',
    content: '新作业「期末作文」已发布，截止日期 2026-04-20',
    read: false,
    createdAt: '2026-04-12',
  },
  {
    id: '3',
    title: 'AI辅导提醒',
    content: 'AI辅导提醒：您有 3 个未掌握的错题',
    read: false,
    createdAt: '2026-04-11',
  },
];

const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [bellOpen, setBellOpen] = useState(false);

  // Reset bell popover on route change
  useEffect(() => {
    setBellOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    await logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/student/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/student/tasks',
      icon: <UnorderedListOutlined />,
      label: '任务列表',
      onClick: () => { navigate('/student/tasks'); setMobileMenuOpen(false); },
    },
    {
      key: '/student/submit',
      icon: <EditOutlined />,
      label: '提交作文',
      onClick: () => { navigate('/student/tasks'); setMobileMenuOpen(false); },
    },
    {
      key: '/student/history',
      icon: <HistoryOutlined />,
      label: '历史记录',
      onClick: () => { navigate('/student/history'); setMobileMenuOpen(false); },
    },
    {
      key: '/student/mistakes',
      icon: <BookOutlined />,
      label: '错题本',
      onClick: () => { navigate('/student/mistakes'); setMobileMenuOpen(false); },
    },
    {
      key: '/student/profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => { navigate('/student/profile'); setMobileMenuOpen(false); },
    },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/student/ai-chat')) return '/student/ai-chat';
    if (path.startsWith('/student/submit')) return '/student/submit';
    return path;
  };

  const notificationPopoverContent = (
    <div style={{ width: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>通知</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllRead} style={{ padding: 0, color: '#0066FF' }}>
            全部已读
          </Button>
        )}
      </div>
      <List
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: '10px 0',
              borderBottom: '1px solid #f0f0f0',
              opacity: item.read ? 0.6 : 1,
            }}
            actions={
              !item.read
                ? [
                    <Button
                      key="read"
                      type="link"
                      size="small"
                      onClick={() => markRead(item.id)}
                      style={{ padding: 0, fontSize: 12, color: '#0066FF' }}
                    >
                      标记已读
                    </Button>,
                  ]
                : []
            }
          >
            <List.Item.Meta
              title={
                <span style={{ fontWeight: item.read ? 400 : 600, fontSize: 13, color: item.read ? '#999' : '#1A1A1A' }}>
                  {item.title}
                </span>
              }
              description={
                <span style={{ fontSize: 12, color: item.read ? '#bbb' : '#666' }}>{item.content}</span>
              }
            />
          </List.Item>
        )}
      />
      {notifications.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', padding: '20px 0', fontSize: 13 }}>暂无通知</div>
      )}
    </div>
  );

  return (
    <Layout className="student-layout">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sider
        width={240}
        collapsedWidth={64}
        collapsed={collapsed}
        className={`student-sider${mobileMenuOpen ? ' student-sider--mobile-open' : ''}`}
        trigger={null}
      >
        {/* Logo */}
        <div className={`sider-logo ${collapsed ? 'sider-logo--collapsed' : ''}`}>
          <RobotOutlined className="sider-logo-icon" />
          {!collapsed && <span className="sider-logo-text">AI作文批改</span>}
        </div>

        {/* Navigation */}
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          className="sider-menu"
          items={menuItems.map((item) => ({
            ...item,
            label: collapsed ? (
              <Tooltip title={item.label} placement="right">
                <span>{item.label}</span>
              </Tooltip>
            ) : (
              item.label
            ),
          }))}
        />

        {/* Bottom: user info + collapse toggle */}
        <div className="sider-bottom">
          {!collapsed && (
            <div className="sider-user">
              <Avatar size={32} icon={<UserOutlined />} src={user?.avatar} className="sider-user-avatar" />
              <span className="sider-user-name">{user?.name}</span>
            </div>
          )}
          <button
            className="sider-collapse-btn desktop-only"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>
      </Sider>

      <Layout
        className="student-main"
        style={{ marginLeft: collapsed ? 64 : 240 }}
      >
        {/* Header */}
        <div className="student-header">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="打开菜单"
            >
              {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
            </button>
          </div>
          <div className="header-actions">
            <Popover
              content={notificationPopoverContent}
              trigger="click"
              open={bellOpen}
              onOpenChange={setBellOpen}
              placement="bottomRight"
            >
              <Badge count={unreadCount} size="small">
                <button className="header-icon-btn" aria-label="通知">
                  <BellOutlined />
                </button>
              </Badge>
            </Popover>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="header-user-trigger">
                <Avatar size={32} icon={<UserOutlined />} src={user?.avatar} />
                <span className="header-user-name">{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </div>

        {/* Content */}
        <Content className="student-content page-content-animated">
          <EmailConfirmationBanner />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;
