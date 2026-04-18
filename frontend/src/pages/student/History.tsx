/**
 * 学生提交历史页面 — 含分数色标、统计栏、操作按钮
 */
import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Typography, Card, Checkbox, Modal, Row, Col, Statistic, Space } from 'antd';
import { EyeOutlined, ClockCircleOutlined, SwapOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import api from '../../services/api';
import dayjs from 'dayjs';
import './History.css';

const { Title, Text } = Typography;

interface SubmissionWithReport {
  id: string;
  assignment_title?: string;
  submitted_at: string;
  content: string;
  grading_status: string;
  status?: string;
  report?: {
    total_score: number;
    scores?: { content: number; structure: number; language: number; writing: number };
    comment?: string;
  } | null;
}

const getScoreClass = (score: number | undefined): string => {
  if (score == null) return 'gray';
  if (score >= 85) return 'green';
  if (score >= 70) return 'blue';
  if (score >= 60) return 'orange';
  return 'red';
};

/** 迷你得分柱状图 — 用 inline SVG 渲染 4 个维度分数 */
const ScoreSparkline: React.FC<{ scores?: { content: number; structure: number; language: number; writing: number } }> = ({ scores }) => {
  if (!scores) return null;
  const bars = [
    { value: scores.content, max: 35 },
    { value: scores.structure, max: 25 },
    { value: scores.language, max: 25 },
    { value: scores.writing, max: 15 },
  ];
  return (
    <div className="score-sparkline">
      {bars.map((b, i) => {
        const pct = Math.round((b.value / b.max) * 100);
        const height = Math.max(4, Math.round((pct / 100) * 20));
        return (
          <div
            key={i}
            className="score-sparkline-bar active"
            style={{ height, background: pct >= 80 ? '#52c41a' : pct >= 60 ? '#0066FF' : '#fa8c16' }}
          />
        );
      })}
    </div>
  );
};

const History: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { submissions, fetchHistory, isLoading } = useStudentStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareData, setCompareData] = useState<[SubmissionWithReport, SubmissionWithReport] | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchHistory(user.id);
    }
  }, [user]);

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'processing', text: '批改中' },
      submitted: { color: 'processing', text: '批改中' },
      ai_graded: { color: 'warning', text: '待审核' },
      graded: { color: 'warning', text: '待审核' },
      teacher_reviewed: { color: 'success', text: '已完成' },
      published: { color: 'success', text: '已发布' },
    };
    const config = statusMap[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      if (selectedIds.length >= 2) {
        setSelectedIds([selectedIds[1], id]);
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      setSelectedIds(selectedIds.filter((s) => s !== id));
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length !== 2) return;
    setLoadingCompare(true);
    try {
      const [res1, res2] = await Promise.all([
        api.student.getReport(selectedIds[0]),
        api.student.getReport(selectedIds[1]),
      ]);
      const sub1 = (submissions as SubmissionWithReport[]).find((s) => s.id === selectedIds[0]);
      const sub2 = (submissions as SubmissionWithReport[]).find((s) => s.id === selectedIds[1]);
      if (sub1 && sub2) {
        const withReport1: SubmissionWithReport = { ...sub1, report: res1?.data || res1 };
        const withReport2: SubmissionWithReport = { ...sub2, report: res2?.data || res2 };
        const sorted = [withReport1, withReport2].sort(
          (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
        ) as [SubmissionWithReport, SubmissionWithReport];
        setCompareData(sorted);
        setCompareModalOpen(true);
      }
    } catch {
      // ignore
    } finally {
      setLoadingCompare(false);
    }
  };

  const scoreDiff = (a: number | undefined, b: number | undefined) => {
    if (a == null || b == null) return null;
    const diff = b - a;
    if (diff === 0) return <Text type="secondary">持平</Text>;
    return diff > 0 ? (
      <Text style={{ color: '#52c41a' }}>↑ +{diff}分</Text>
    ) : (
      <Text style={{ color: '#f5222d' }}>↓ {diff}分</Text>
    );
  };

  // 统计数据
  const gradedSubmissions = (submissions as SubmissionWithReport[]).filter(
    (s) => s.grading_status === 'published' || s.grading_status === 'teacher_reviewed'
  );
  const scores = gradedSubmissions
    .map((s) => (s as any).total_score ?? (s as any).report?.total_score)
    .filter((v): v is number => typeof v === 'number');
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const maxScore = scores.length > 0 ? Math.max(...scores) : null;

  const canViewReport = (status: string) =>
    status !== 'pending' && status !== 'submitted';

  const columns = [
    {
      title: '对比',
      key: 'compare',
      width: 60,
      render: (_: unknown, record: any) => (
        <Checkbox
          checked={selectedIds.includes(record.id)}
          onChange={(e) => handleCheckboxChange(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: '作文标题',
      dataIndex: 'assignment_title',
      key: 'assignment_title',
      width: 180,
    },
    {
      title: '提交时间',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '字数',
      dataIndex: 'content',
      key: 'word_count',
      width: 80,
      render: (content: string) => {
        const text = content.replace(/<[^>]*>/g, '').trim();
        return `${text.length}字`;
      },
    },
    {
      title: '得分',
      key: 'score',
      width: 140,
      render: (_: unknown, record: any) => {
        const score: number | undefined =
          record.total_score ?? record.report?.total_score ?? record.final_total_score;
        const scoreClass = getScoreClass(score);
        const scoreScores = record.scores ?? record.report?.scores;
        return (
          <div className="score-cell">
            <span className={`score-badge ${scoreClass}`}>
              {score != null ? `${score}分` : '—'}
            </span>
            <ScoreSparkline scores={scoreScores} />
          </div>
        );
      },
    },
    {
      title: '批改状态',
      dataIndex: 'grading_status',
      key: 'grading_status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: any) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/student/report/${record.id}`)}
            disabled={!canViewReport(record.grading_status)}
          >
            查看报告
          </Button>
          <Button
            type="link"
            size="small"
            icon={<MessageOutlined />}
            onClick={() => navigate(`/student/ai-chat/${record.id}`)}
            disabled={!canViewReport(record.grading_status)}
          >
            AI辅导
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container history-page">
      <div className="page-header">
        <Title level={2}>提交历史</Title>
        <Space>
          {selectedIds.length === 2 && (
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={handleCompare}
              loading={loadingCompare}
            >
              对比选中
            </Button>
          )}
          {selectedIds.length > 0 && (
            <Button onClick={() => setSelectedIds([])}>
              清除选择 ({selectedIds.length}/2)
            </Button>
          )}
        </Space>
      </div>

      {/* 统计栏 */}
      <div className="history-stats-bar">
        <div className="history-stat-card">
          <div className="history-stat-label">总提交数</div>
          <div className="history-stat-value blue">{submissions.length}</div>
        </div>
        <div className="history-stat-card">
          <div className="history-stat-label">平均分</div>
          <div className="history-stat-value green">{avgScore != null ? avgScore : '—'}</div>
        </div>
        <div className="history-stat-card">
          <div className="history-stat-label">最高分</div>
          <div className="history-stat-value gold">{maxScore != null ? maxScore : '—'}</div>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={submissions}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="作文对比"
        open={compareModalOpen}
        onCancel={() => setCompareModalOpen(false)}
        footer={null}
        width={800}
      >
        {compareData && (
          <div>
            <Row gutter={16}>
              <Col span={11}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <ClockCircleOutlined />
                      <Text>{dayjs(compareData[0].submitted_at).format('YYYY-MM-DD')}</Text>
                      <Tag color="default">较早</Tag>
                    </Space>
                  }
                >
                  <Statistic title="总分" value={compareData[0].report?.total_score ?? '-'} suffix="分" />
                  {compareData[0].report?.scores && (
                    <div style={{ marginTop: 8 }}>
                      <Text>思想内容：{compareData[0].report.scores.content}分</Text><br />
                      <Text>结构安排：{compareData[0].report.scores.structure}分</Text><br />
                      <Text>语言表达：{compareData[0].report.scores.language}分</Text><br />
                      <Text>文字书写：{compareData[0].report.scores.writing}分</Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SwapOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              </Col>
              <Col span={11}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <ClockCircleOutlined />
                      <Text>{dayjs(compareData[1].submitted_at).format('YYYY-MM-DD')}</Text>
                      <Tag color="blue">较新</Tag>
                    </Space>
                  }
                >
                  <Statistic title="总分" value={compareData[1].report?.total_score ?? '-'} suffix="分" />
                  {compareData[1].report?.scores && (
                    <div style={{ marginTop: 8 }}>
                      <Text>思想内容：{compareData[1].report.scores.content}分</Text><br />
                      <Text>结构安排：{compareData[1].report.scores.structure}分</Text><br />
                      <Text>语言表达：{compareData[1].report.scores.language}分</Text><br />
                      <Text>文字书写：{compareData[1].report.scores.writing}分</Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#f5f5f5', borderRadius: 8 }}>
              <Text strong>分数变化：</Text>
              <Space style={{ marginLeft: 8 }}>
                <span>总分 {scoreDiff(compareData[0].report?.total_score, compareData[1].report?.total_score)}</span>
                {compareData[0].report?.scores && compareData[1].report?.scores && (
                  <>
                    <span>思想内容 {scoreDiff(compareData[0].report.scores.content, compareData[1].report.scores.content)}</span>
                    <span>结构安排 {scoreDiff(compareData[0].report.scores.structure, compareData[1].report.scores.structure)}</span>
                    <span>语言表达 {scoreDiff(compareData[0].report.scores.language, compareData[1].report.scores.language)}</span>
                  </>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default History;
