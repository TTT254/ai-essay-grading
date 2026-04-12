/**
 * 学生端布局组件 - 现代侧边栏设计
 */
import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Tooltip, message } from 'antd';
import {
  UnorderedListOutlined,
  EditOutlined,
  HistoryOutlined,
  MessageOutlined,
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

const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      key: '/student/ai-chat',
      icon: <MessageOutlined />,
      label: 'AI辅导',
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

  // Determine active key — match prefix for nested routes like /student/ai-chat/:id
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/student/ai-chat')) return '/student/ai-chat';
    if (path.startsWith('/student/submit')) return '/student/submit';
    return path;
  };

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
            <Badge count={0} showZero={false}>
              <button className="header-icon-btn" aria-label="通知">
                <BellOutlined />
              </button>
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="header-user-trigger">
                <Avatar size={32} icon={<UserOutlined />} src={user?.avatar} />
                <span className="header-user-name">{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </div>

        {/* Content */}
        <Content className="student-content">
          <EmailConfirmationBanner />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;
