/**
 * 教师端布局组件 - 现代侧边栏设计
 */
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Tooltip, message, Popover, Button, List } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
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
import './TeacherLayout.css';

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
    title: '待批改提醒',
    content: '班级「高三1班」有 5 篇作文待批改',
    read: false,
    createdAt: '2026-04-13',
  },
  {
    id: '2',
    title: '新作文提交',
    content: '学生张三提交了作文《我的梦想》',
    read: false,
    createdAt: '2026-04-12',
  },
  {
    id: '3',
    title: '本周批改统计',
    content: '本周批改统计：已批改 12 篇，平均分 78 分',
    read: false,
    createdAt: '2026-04-11',
  },
];

const TeacherLayout: React.FC = () => {
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

  const handleMenuNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
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
      onClick: () => navigate('/teacher/profile'),
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
      key: '/teacher/classes',
      icon: <TeamOutlined />,
      label: '班级管理',
      onClick: () => handleMenuNavigate('/teacher/classes'),
    },
    {
      key: '/teacher/assignments',
      icon: <FileTextOutlined />,
      label: '作业管理',
      onClick: () => handleMenuNavigate('/teacher/assignments'),
    },
    {
      key: '/teacher/grading',
      icon: <CheckCircleOutlined />,
      label: '批改工作台',
      onClick: () => handleMenuNavigate('/teacher/assignments'),
    },
    {
      key: '/teacher/dashboard',
      icon: <BarChartOutlined />,
      label: '数据看板',
      onClick: () => handleMenuNavigate('/teacher/dashboard'),
    },
    {
      key: '/teacher/profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => handleMenuNavigate('/teacher/profile'),
    },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/teacher/grading')) return '/teacher/grading';
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
    <Layout className="teacher-layout">
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
        className={`teacher-sider${mobileMenuOpen ? ' teacher-sider--mobile-open' : ''}`}
        trigger={null}
      >
        {/* Logo */}
        <div className={`sider-logo${collapsed ? ' sider-logo--collapsed' : ''}`}>
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
        className="teacher-main"
        style={{ marginLeft: collapsed ? 64 : 240 }}
      >
        {/* Header */}
        <div className="teacher-header">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="打开菜单"
            >
              {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
            </button>
            <span className="header-logo-text">AI作文批改 - 教师端</span>
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
        <Content className="teacher-content page-content-animated">
          <EmailConfirmationBanner />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default TeacherLayout;
