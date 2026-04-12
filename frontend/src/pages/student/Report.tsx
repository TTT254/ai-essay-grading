/**
 * 学生查看批改报告页面 - 重新设计版
 */
import React, { useEffect } from 'react';
import { Card, Row, Col, Typography, Tag, Button, Spin, Space } from 'antd';
import {
  CommentOutlined,
  ArrowLeftOutlined,
  RobotOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudentStore } from '../../store/studentStore';
import ReactECharts from 'echarts-for-react';
import './Report.css';

const { Title, Text, Paragraph } = Typography;

const Report: React.FC = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>();
  const { currentReport, fetchReport, isLoading } = useStudentStore();

  useEffect(() => {
    if (submissionId) {
      fetchReport(submissionId);
    }
  }, [submissionId]);

  if (isLoading || !currentReport) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  const report = currentReport;
  // AI scores from ai_scores field, teacher scores from teacher_scores
  const aiScores = report.ai_scores || report.scores || {};
  const teacherScores = report.teacher_scores || null;
  const scores = teacherScores || aiScores;
  const totalScore = report.teacher_scores?.total || report.teacher_total_score || report.ai_total_score || report.total_score || 0;
  const comment = report.teacher_comment || report.ai_comment || report.comment || '';

  // 4 dimensions matching the spec
  const dimensionItems = [
    { label: '思想内容', key: 'content', total: 35, color: '#0066FF' },
    { label: '结构安排', key: 'structure', total: 25, color: '#52c41a' },
    { label: '语言表达', key: 'language', total: 25, color: '#fa8c16' },
    { label: '文字书写', key: 'writing', total: 15, color: '#722ed1' },
  ];

  const errorTypeMap: Record<string, { color: string; text: string }> = {
    typo: { color: 'red', text: '错别字' },
    grammar: { color: 'orange', text: '语法错误' },
    punctuation: { color: 'blue', text: '标点错误' },
    logic: { color: 'purple', text: '逻辑问题' },
    structure: { color: 'cyan', text: '结构问题' },
  };

  // Score color coding
  const getScoreColor = (score: number) => {
    if (score >= 85) return '#52c41a';
    if (score >= 70) return '#0066FF';
    if (score >= 60) return '#fa8c16';
    return '#ff4d4f';
  };

  const scoreColor = getScoreColor(totalScore);

  // Radar chart options — show AI score and teacher score if both available
  const radarSeries: object[] = [
    {
      type: 'radar',
      data: [
        {
          value: dimensionItems.map((d) => aiScores[d.key] || 0),
          name: 'AI评分',
          areaStyle: { color: 'rgba(0,102,255,0.12)' },
          lineStyle: { color: '#0066FF', width: 2 },
          itemStyle: { color: '#0066FF' },
        },
      ],
    },
  ];

  if (teacherScores) {
    radarSeries.push({
      type: 'radar',
      data: [
        {
          value: dimensionItems.map((d) => teacherScores[d.key] || 0),
          name: '教师评分',
          areaStyle: { color: 'rgba(82,196,26,0.12)' },
          lineStyle: { color: '#52c41a', width: 2 },
          itemStyle: { color: '#52c41a' },
        },
      ],
    });
  }

  const radarOption = {
    legend: teacherScores
      ? { data: ['AI评分', '教师评分'], bottom: 0 }
      : undefined,
    radar: {
      indicator: dimensionItems.map((d) => ({ name: d.label, max: d.total })),
      center: ['50%', teacherScores ? '45%' : '50%'],
      radius: '65%',
      axisName: { color: '#555', fontSize: 12 },
      splitArea: { areaStyle: { color: ['rgba(0,102,255,0.04)', 'rgba(0,102,255,0.08)'] } },
      axisLine: { lineStyle: { color: 'rgba(0,102,255,0.2)' } },
      splitLine: { lineStyle: { color: 'rgba(0,102,255,0.2)' } },
    },
    series: radarSeries,
    tooltip: { trigger: 'item' },
  };

  return (
    <div className="page-container report-page">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/student/history')}>
            返回
          </Button>
          <Title level={2} style={{ margin: 0 }}>批改报告</Title>
        </Space>
      </div>

      {/* Score header */}
      <Card className="score-header-card">
        <div className="score-header-inner">
          <div className="score-circle-wrap">
            <svg className="score-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f0f0f0" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={scoreColor} strokeWidth="8"
                strokeDasharray={`${(totalScore / 100) * 326.7} 326.7`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="score-circle-text">
              <span className="score-number" style={{ color: scoreColor }}>{totalScore}</span>
              <span className="score-unit">/ 100</span>
            </div>
          </div>
          <div className="score-header-meta">
            <div className="score-grade" style={{ color: scoreColor }}>
              {totalScore >= 85 ? '优秀' : totalScore >= 70 ? '良好' : totalScore >= 60 ? '及格' : '待提高'}
            </div>
            <Text type="secondary">综合得分</Text>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Dimension score cards */}
        {dimensionItems.map((dim) => {
          const dimScore = scores[dim.key] || 0;
          const pct = Math.round((dimScore / dim.total) * 100);
          return (
            <Col xs={12} sm={12} md={6} key={dim.key}>
              <Card className="dimension-card">
                <div className="dimension-label">{dim.label}</div>
                <div className="dimension-score" style={{ color: dim.color }}>
                  {dimScore}<span className="dimension-total">/{dim.total}</span>
                </div>
                <div className="dimension-bar-bg">
                  <div
                    className="dimension-bar-fill"
                    style={{ width: `${pct}%`, background: dim.color }}
                  />
                </div>
                <div className="dimension-pct">{pct}%</div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Radar chart */}
        <Col xs={24} md={12}>
          <Card title="能力雷达图" className="radar-card">
            <ReactECharts option={radarOption} style={{ height: 280 }} />
          </Card>
        </Col>

        {/* AI comment */}
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: '#0066FF' }} />
                <span>AI综合评语</span>
              </Space>
            }
            className="comment-card"
          >
            <Paragraph style={{ fontSize: 15, lineHeight: 1.9, color: '#333' }}>
              {comment || '暂无评语'}
            </Paragraph>
            {report.teacher_comment && report.comment && (
              <div className="ai-original-comment">
                <Text type="secondary" style={{ fontSize: 12 }}>AI初评：</Text>
                <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
                  {report.comment}
                </Paragraph>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Error highlights */}
      {report.errors && report.errors.length > 0 && (
        <Card title="错误详情" style={{ marginTop: 16 }}>
          <div className="error-list">
            {report.errors.map((error: any, index: number) => (
              <div key={index} className="error-item">
                <div className="error-item-header">
                  <Tag color={errorTypeMap[error.type]?.color || 'default'}>
                    {errorTypeMap[error.type]?.text || error.type}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>第{index + 1}处</Text>
                </div>
                <div className="error-content">
                  <Text delete type="danger">{error.original}</Text>
                  {error.suggestion && (
                    <>
                      <span className="error-arrow"> → </span>
                      <Text type="success" strong>{error.suggestion}</Text>
                    </>
                  )}
                </div>
                {error.description && (
                  <Paragraph type="secondary" style={{ marginTop: 6, fontSize: 13 }}>
                    {error.description}
                  </Paragraph>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Teacher comment (if published) */}
      {report.teacher_comment && (
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: '#52c41a' }} />
              <span>教师评语</span>
              <Tag color="success" icon={<CheckCircleOutlined />}>已发布</Tag>
            </Space>
          }
          className="teacher-comment-card"
          style={{ marginTop: 16 }}
        >
          <Paragraph style={{ fontSize: 15, lineHeight: 1.9 }}>
            {report.teacher_comment}
          </Paragraph>
        </Card>
      )}

      {/* AI tutoring button */}
      <Card style={{ marginTop: 16, textAlign: 'center' }}>
        <Button
          type="primary"
          icon={<CommentOutlined />}
          size="large"
          onClick={() => navigate(`/student/ai-chat/${submissionId}`)}
          style={{ minWidth: 200 }}
        >
          AI辅导
        </Button>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">针对本次作文进行一对一辅导</Text>
        </div>
      </Card>
    </div>
  );
};

export default Report;
