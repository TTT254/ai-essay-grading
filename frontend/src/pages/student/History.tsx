/**
 * 学生提交历史页面
 */
import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Typography, Card, Checkbox, Modal, Row, Col, Statistic, Space } from 'antd';
import { EyeOutlined, ClockCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import api from '../../services/api';
import dayjs from 'dayjs';

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
        // Replace the first selected
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
        // Sort by submitted_at: older first
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

  const columns = [
    {
      title: '对比',
      key: 'compare',
      width: 60,
      render: (_: any, record: any) => (
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
      width: 200,
    },
    {
      title: '提交时间',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '字数',
      dataIndex: 'content',
      key: 'word_count',
      width: 100,
      render: (content: string) => {
        const text = content.replace(/<[^>]*>/g, '').trim();
        return `${text.length}字`;
      },
    },
    {
      title: '批改状态',
      dataIndex: 'grading_status',
      key: 'grading_status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/student/report/${record.id}`)}
            disabled={record.grading_status === 'pending' || record.grading_status === 'submitted'}
          >
            查看报告
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="page-container">
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
