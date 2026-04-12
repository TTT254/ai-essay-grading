/**
 * 教师端布局组件 - 现代侧边栏设计
 */
import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Tooltip, message } from 'antd';
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

const TeacherLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };
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
        <Content className="teacher-content">
          <EmailConfirmationBanner />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default TeacherLayout;
