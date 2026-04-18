/**
 * 首页 - Landing Page
 * 产品门面：展示核心价值、使用流程、角色引导
 */
import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  BarChartOutlined,
  RocketOutlined,
  RobotOutlined,
  FormOutlined,
  ReadOutlined,
  SolutionOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const features = [
    {
      icon: <ThunderboltOutlined />,
      title: '秒级批改',
      description: 'AI智能分析，3秒完成全文批改，节省80%人工时间'
    },
    {
      icon: <CheckCircleOutlined />,
      title: '多维评分',
      description: '内容、结构、语言、书写四个维度，全方位精准评分'
    },
    {
      icon: <TeamOutlined />,
      title: '个性化辅导',
      description: 'AI对话式教学，针对每个学生的薄弱点提供定制化建议'
    },
    {
      icon: <BarChartOutlined />,
      title: '数据分析',
      description: '学情可视化，精准把握班级整体水平和个人进步轨迹'
    }
  ];

  const workflowSteps = [
    {
      number: '01',
      icon: <FormOutlined />,
      title: '提交作文',
      description: '学生在线编辑或拍照上传手写作文，支持多种格式'
    },
    {
      number: '02',
      icon: <RobotOutlined />,
      title: 'AI智能批改',
      description: 'AI从内容、结构、语言、书写四个维度进行全面分析'
    },
    {
      number: '03',
      icon: <TrophyOutlined />,
      title: '获取报告',
      description: '查看详细批改报告，通过AI对话获得个性化辅导建议'
    }
  ];

  return (
    <div className="home-container">
      {/* 顶部导航栏 */}
      <div className={`home-navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-logo">
          <RobotOutlined />
          <span>AI作文批改</span>
        </div>
        <div className="navbar-actions">
          <Button
            ghost
            onClick={() => navigate('/login')}
          >
            登录
          </Button>
          <Button
            type="primary"
            onClick={() => navigate('/register')}
          >
            免费注册
          </Button>
        </div>
      </div>

      {/* Hero 区域 */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <RocketOutlined />
            <span>基于大语言模型的智能批改引擎</span>
          </div>

          <h1 className="hero-title">
            AI赋能作文批改<br />
            <span className="hero-gradient-text">让每一次写作都有提升</span>
          </h1>

          <p className="hero-description">
            面向K-12教育场景，利用先进AI技术实现作文智能批改、个性化辅导和学情数据分析，帮助教师减负增效，助力学生写作成长
          </p>

          <div className="hero-cta">
            <Button
              type="primary"
              size="large"
              className="cta-primary"
              onClick={() => navigate('/register')}
            >
              免费开始使用
            </Button>
            <Button
              size="large"
              className="cta-secondary"
              onClick={() => navigate('/login')}
            >
              立即登录
            </Button>
          </div>
        </div>

        <div className="hero-demo">
          <div className="hero-demo-card">
            <div className="demo-score-item">
              <span className="demo-score-label">内容</span>
              <span className="demo-score-value">30/35</span>
            </div>
            <div className="demo-score-item">
              <span className="demo-score-label">结构</span>
              <span className="demo-score-value">20/25</span>
            </div>
            <div className="demo-score-item">
              <span className="demo-score-label">语言</span>
              <span className="demo-score-value">22/25</span>
            </div>
            <div className="demo-score-item">
              <span className="demo-score-label">书写</span>
              <span className="demo-score-value">13/15</span>
            </div>
            <div className="demo-comment">
              <div className="demo-comment-label">AI总评</div>
              文章结构清晰，论点明确，语言表达流畅自然。建议在论据部分增加更多具体事例，使论证更加充分有力。
            </div>
          </div>
        </div>
      </section>

      {/* 使用流程区域 */}
      <section className="workflow-section">
        <div className="section-header">
          <h2 className="section-title">三步开始智能批改</h2>
          <p className="section-description">
            简单三步，即可体验AI赋能的作文批改服务
          </p>
        </div>

        <div className="workflow-grid">
          {workflowSteps.map((step, index) => (
            <div key={index} className="workflow-step">
              <div className="step-number">{step.number}</div>
              <div className="step-icon">
                {step.icon}
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 特性区域 */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">为什么选择我们</h2>
          <p className="section-description">
            专为中小学教育场景设计，让教学更高效，让学习更精准
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 角色引导区 */}
      <section className="roles-section">
        <div className="section-header">
          <h2 className="section-title">为每个角色量身打造</h2>
        </div>

        <div className="roles-grid">
          <div className="role-card">
            <div className="role-icon role-icon-student">
              <ReadOutlined />
            </div>
            <h3 className="role-title">学生</h3>
            <ul className="role-features">
              <li>即时获得AI批改反馈</li>
              <li>个性化写作辅导对话</li>
              <li>智能错题本查漏补缺</li>
              <li>学习曲线追踪进步</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="role-icon role-icon-teacher">
              <SolutionOutlined />
            </div>
            <h3 className="role-title">教师</h3>
            <ul className="role-features">
              <li>一键AI批改减负80%</li>
              <li>审核修改AI批改结果</li>
              <li>班级学情数据可视化</li>
              <li>精准把握教学重点</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">准备好开始了吗？</h2>
          <p className="cta-subtitle">
            立即注册，体验AI赋能的作文批改与辅导服务，
            让教学更智能，让学习更高效
          </p>
          <div className="cta-buttons">
            <Button
              type="primary"
              size="large"
              className="cta-primary"
              onClick={() => navigate('/register')}
            >
              免费注册
            </Button>
            <Button
              size="large"
              className="cta-secondary"
              onClick={() => navigate('/login')}
            >
              已有账号？立即登录
            </Button>
          </div>
          <div className="cta-stats">
            <div className="cta-stat-item">
              <div className="cta-stat-value">10W+</div>
              <div className="cta-stat-label">累计批改</div>
            </div>
            <div className="cta-stat-item">
              <div className="cta-stat-value">95%</div>
              <div className="cta-stat-label">教师满意度</div>
            </div>
            <div className="cta-stat-item">
              <div className="cta-stat-value">3秒</div>
              <div className="cta-stat-label">平均批改速度</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <p className="footer-text">
            © 2026 AI作文批改系统 · 让每一次写作都有提升
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
