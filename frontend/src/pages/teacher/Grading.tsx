/**
 * 教师批改审核页面 - 三栏布局
 */
import React, { useEffect, useState } from 'react';
import {
  Card,
  List,
  Typography,
  Space,
  Tag,
  Button,
  Divider,
  Input,
  InputNumber,
  message,
  Spin,
  Empty,
  Modal,
} from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useTeacherStore } from '../../store/teacherStore';
import api from '../../services/api';
import dayjs from 'dayjs';
import './Grading.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Submission {
  id: string;
  student_id: string;
  student_name: string;
  content: string;
  submitted_at: string;
  grading_status: string;
  report?: any;
}

const Grading: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { reviewReport, publishReport } = useTeacherStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBatchGrading, setIsBatchGrading] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');
  const [teacherScores, setTeacherScores] = useState<any>({});
  const [teacherComment, setTeacherComment] = useState('');

  useEffect(() => {
    if (assignmentId) {
      loadSubmissions();
    }
  }, [assignmentId]);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/teacher/assignments/${assignmentId}/submissions`);
      const submissionsData = response?.data || response || [];
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
    } catch (error) {
      message.error('加载提交列表失败');
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReport = async (submissionId: string) => {
    setIsLoading(true);
    try {
      const response = await api.student.getReport(submissionId);
      const reportData = response?.data || response || null;
      setCurrentReport(reportData);
      setTeacherScores(reportData?.teacher_scores || {});
      setTeacherComment(reportData?.teacher_comment || '');
    } catch (error) {
      message.error('加载批改报告失败');
      setCurrentReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    if (submission.grading_status !== 'pending') {
      loadReport(submission.id);
    }
  };

  const handleAutoGrade = async () => {
    if (!selectedSubmission) return;

    setIsLoading(true);
    try {
      await api.grading.autoGrade(selectedSubmission.id);
      message.success('AI批改已完成');
      await loadReport(selectedSubmission.id);
      await loadSubmissions();
    } catch (error) {
      message.error('AI批改失败');
    } finally {
      setIsLoading(false);
    }
  };

  const ungradedCount = submissions.filter((s) => s.grading_status === 'pending' || s.status === 'submitted').length;

  const handleBatchGrade = () => {
    if (ungradedCount === 0) {
      message.info('没有待批改的作文');
      return;
    }
    Modal.confirm({
      title: '批量AI批改',
      content: `将对 ${ungradedCount} 篇未批改作文进行AI批改，确认？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setIsBatchGrading(true);
        setBatchProgress(`正在批改中，请稍候...`);
        try {
          const res = await api.teacher.batchGrade(assignmentId!);
          const graded = res?.graded_count ?? res?.data?.graded_count ?? 0;
          message.success(`批量批改完成，共批改 ${graded} 篇`);
          await loadSubmissions();
        } catch (error) {
          message.error('批量批改失败');
        } finally {
          setIsBatchGrading(false);
          setBatchProgress('');
        }
      },
    });
  };

  const handleReview = async () => {
    if (!currentReport) return;

    const success = await reviewReport(currentReport.id, {
      teacher_scores: teacherScores,
      teacher_comment: teacherComment,
    });

    if (success) {
      message.success('审核成功');
      await loadReport(selectedSubmission!.id);
    }
  };

  const handlePublish = async () => {
    if (!currentReport) return;

    const success = await publishReport(currentReport.id);
    if (success) {
      message.success('报告已发布给学生');
      await loadSubmissions();
      await loadReport(selectedSubmission!.id);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: '待批改' },
      submitted: { color: 'default', text: '待批改' },
      ai_graded: { color: 'processing', text: 'AI已批改' },
      graded: { color: 'processing', text: 'AI已批改' },
      reviewed: { color: 'success', text: '教师已审核' },
      published: { color: 'success', text: '已发布' },
    };
    const s = statusMap[status] || statusMap.pending;
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  return (
    <div className="grading-container">
      <div className="grading-header">
        <Title level={2}>作业批改</Title>
      </div>

      <div className="grading-layout">
        {/* 左栏：提交列表 */}
        <Card
          className="submissions-list"
          title="提交列表"
          extra={
            <Button
              type="primary"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={handleBatchGrade}
              loading={isBatchGrading}
              disabled={ungradedCount === 0}
            >
              一键批量批改
            </Button>
          }
        >
          {isBatchGrading && batchProgress && (
            <div style={{ padding: '8px 0', color: '#1890ff', fontSize: 12 }}>{batchProgress}</div>
          )}
          {isLoading && !selectedSubmission ? (
            <Spin />
          ) : (
            <List
              dataSource={submissions}
              renderItem={(item) => (
                <List.Item
                  className={selectedSubmission?.id === item.id ? 'selected' : ''}
                  onClick={() => handleSelectSubmission(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <List.Item.Meta
                    avatar={<UserOutlined />}
                    title={
                      <Space>
                        <span>{item.student_name}</span>
                        {getStatusTag(item.grading_status || item.status)}
                      </Space>
                    }
                    description={
                      <Space size="small">
                        <ClockCircleOutlined />
                        <Text type="secondary">
                          {dayjs(item.submitted_at).format('MM-DD HH:mm')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* 中栏：作文内容 */}
        <Card className="essay-content" title="作文内容">
          {selectedSubmission ? (
            <div>
              <Space style={{ marginBottom: 16 }}>
                <Text strong>学生：</Text>
                <Text>{selectedSubmission.student_name}</Text>
                <Divider type="vertical" />
                <Text strong>提交时间：</Text>
                <Text>{dayjs(selectedSubmission.submitted_at).format('YYYY-MM-DD HH:mm')}</Text>
                <Divider type="vertical" />
                <Text strong>字数：</Text>
                <Text>{selectedSubmission.content.length}字</Text>
              </Space>

              <Divider />

              <Paragraph style={{ whiteSpace: 'pre-wrap', lineHeight: 2 }}>
                {selectedSubmission.content}
              </Paragraph>

              {(selectedSubmission.grading_status === 'pending' || selectedSubmission.grading_status === 'submitted') && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleAutoGrade}
                    loading={isLoading}
                  >
                    启动AI批改
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Empty description="请选择一篇作文" />
          )}
        </Card>

        {/* 右栏：批改报告 */}
        <Card className="grading-report" title="批改报告">
          {currentReport ? (
            <div>
              <Title level={5}>AI评分</Title>
              <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                <div>
                  <Text strong>总分：</Text>
                  <Text style={{ fontSize: 24, color: '#1890ff', marginLeft: 8 }}>
                    {currentReport.total_score}
                  </Text>
                  <Text type="secondary"> / 100</Text>
                </div>
                {currentReport.scores && (
                  <div>
                    <Text>内容：{currentReport.scores.content}分</Text>
                    <br />
                    <Text>结构：{currentReport.scores.structure}分</Text>
                    <br />
                    <Text>语言：{currentReport.scores.language}分</Text>
                    <br />
                    <Text>书写：{currentReport.scores.writing}分</Text>
                  </div>
                )}
              </Space>

              <Divider />

              <Title level={5}>错误列表</Title>
              {currentReport.errors && currentReport.errors.length > 0 ? (
                <List
                  size="small"
                  dataSource={currentReport.errors}
                  renderItem={(error: any) => (
                    <List.Item>
                      <Space direction="vertical" size="small">
                        <Tag color="red">{error.type}</Tag>
                        <Text delete>{error.original}</Text>
                        <Text type="success">→ {error.suggestion}</Text>
                        <Text type="secondary">{error.description}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无错误" />
              )}

              <Divider />

              <Title level={5}>AI评语</Title>
              <Paragraph>{currentReport.comment}</Paragraph>

              <Divider />

              <Title level={5}>教师审核</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>调整总分：</Text>
                  <InputNumber
                    min={0}
                    max={100}
                    value={teacherScores.total || currentReport.total_score}
                    onChange={(val) => setTeacherScores({ ...teacherScores, total: val })}
                    style={{ marginLeft: 8 }}
                  />
                </div>

                <div>
                  <Text strong>教师评语：</Text>
                  <TextArea
                    rows={4}
                    value={teacherComment}
                    onChange={(e) => setTeacherComment(e.target.value)}
                    placeholder="输入教师评语..."
                    style={{ marginTop: 8 }}
                  />
                </div>

                <Space style={{ marginTop: 16 }}>
                  <Button type="primary" onClick={handleReview} loading={isLoading}>
                    保存审核
                  </Button>
                  {currentReport.status !== 'published' && (
                    <Button
                      type="primary"
                      danger
                      onClick={handlePublish}
                      loading={isLoading}
                      icon={<CheckCircleOutlined />}
                    >
                      发布给学生
                    </Button>
                  )}
                </Space>
              </Space>
            </div>
          ) : selectedSubmission?.grading_status === 'pending' ? (
            <Empty description="请先进行AI批改" />
          ) : (
            <Empty description="请选择一篇作文" />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Grading;
