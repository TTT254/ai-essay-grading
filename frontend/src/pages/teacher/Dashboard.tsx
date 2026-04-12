/**
 * 教师数据统计页面
 */
import React, { useEffect, useState, useRef } from 'react';
import { Card, Row, Col, Statistic, Select, Space, Typography, Spin } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import { useAuthStore } from '../../store/authStore';
import { useTeacherStore } from '../../store/teacherStore';
import api from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

interface TeacherStats {
  total_classes: number;
  total_assignments: number;
  pending_grading: number;
  weekly_graded: number;
}

interface ClassStats {
  total_assignments: number;
  total_submissions: number;
  graded_count: number;
  average_score: number;
  score_distribution: number[];
  assignment_avg_scores: { title: string; avg_score: number; count: number }[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { classes, fetchClasses } = useTeacherStore();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [teacherStats, setTeacherStats] = useState<TeacherStats>({
    total_classes: 0,
    total_assignments: 0,
    pending_grading: 0,
    weekly_graded: 0,
  });
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [classStatsLoading, setClassStatsLoading] = useState(false);

  const scoreDistChartRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);
  const scoreDistChartInstance = useRef<echarts.ECharts | null>(null);
  const trendChartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchClasses(user.id);
      loadTeacherStats(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedClassId) {
      loadClassStats(selectedClassId);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (classStats) {
      renderCharts(classStats);
    }
  }, [classStats]);

  // 清理图表实例
  useEffect(() => {
    return () => {
      scoreDistChartInstance.current?.dispose();
      trendChartInstance.current?.dispose();
    };
  }, []);

  const loadTeacherStats = async (teacherId: string) => {
    setStatsLoading(true);
    try {
      const response = await api.teacher.getStats(teacherId);
      const data = response?.data || response || {};
      setTeacherStats({
        total_classes: data.total_classes ?? 0,
        total_assignments: data.total_assignments ?? 0,
        pending_grading: data.pending_grading ?? 0,
        weekly_graded: data.weekly_graded ?? 0,
      });
    } catch {
      // 保持默认值
    } finally {
      setStatsLoading(false);
    }
  };

  const loadClassStats = async (classId: string) => {
    setClassStatsLoading(true);
    try {
      const response = await api.teacher.getClassStats(classId);
      const data = response?.data || response || null;
      setClassStats(data);
    } catch {
      setClassStats(null);
    } finally {
      setClassStatsLoading(false);
    }
  };

  const renderCharts = (stats: ClassStats) => {
    renderScoreDistribution(stats.score_distribution);
    renderTrendChart(stats.assignment_avg_scores);
  };

  const renderScoreDistribution = (distribution: number[]) => {
    if (!scoreDistChartRef.current) return;

    if (!scoreDistChartInstance.current) {
      scoreDistChartInstance.current = echarts.init(scoreDistChartRef.current);
    }
    const chart = scoreDistChartInstance.current;
    chart.setOption({
      title: { text: '分数分布', left: 'center' },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: ['0-59', '60-69', '70-79', '80-89', '90-100'],
      },
      yAxis: { type: 'value', name: '人数' },
      series: [
        {
          name: '学生人数',
          type: 'bar',
          data: distribution,
          itemStyle: { color: '#1890ff' },
        },
      ],
    });
  };

  const renderTrendChart = (assignmentScores: { title: string; avg_score: number; count: number }[]) => {
    if (!trendChartRef.current) return;

    if (!trendChartInstance.current) {
      trendChartInstance.current = echarts.init(trendChartRef.current);
    }
    const chart = trendChartInstance.current;
    chart.setOption({
      title: { text: '各作业平均分', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: assignmentScores.map((a) => a.title),
        axisLabel: { rotate: 30, overflow: 'truncate', width: 80 },
        boundaryGap: false,
      },
      yAxis: { type: 'value', name: '平均分', min: 0, max: 100 },
      series: [
        {
          name: '平均分',
          type: 'line',
          smooth: true,
          data: assignmentScores.map((a) => a.avg_score),
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ]),
          },
          itemStyle: { color: '#1890ff' },
        },
      ],
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2}>数据统计</Title>
        <Space>
          <Select
            placeholder="选择班级查看详情"
            style={{ width: 200 }}
            value={selectedClassId}
            onChange={setSelectedClassId}
            allowClear
          >
            {classes.map((cls) => (
              <Option key={cls.id} value={cls.id}>
                {cls.grade}年级{cls.class_name}
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      {/* 教师总览统计 */}
      <Spin spinning={statsLoading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="我的班级"
                value={teacherStats.total_classes}
                prefix={<TeamOutlined />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="作业总数"
                value={teacherStats.total_assignments}
                prefix={<FileTextOutlined />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待批改"
                value={teacherStats.pending_grading}
                prefix={<ClockCircleOutlined />}
                suffix="篇"
                valueStyle={{ color: teacherStats.pending_grading > 0 ? '#cf1322' : undefined }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="本周已批改"
                value={teacherStats.weekly_graded}
                prefix={<CheckCircleOutlined />}
                suffix="篇"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* 班级详情统计 */}
      {selectedClassId && (
        <Spin spinning={classStatsLoading}>
          {classStats && (
            <>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="班级作业数"
                      value={classStats.total_assignments}
                      prefix={<FileTextOutlined />}
                      suffix="个"
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="提交总数"
                      value={classStats.total_submissions}
                      prefix={<CheckCircleOutlined />}
                      suffix="篇"
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="已批改"
                      value={classStats.graded_count}
                      prefix={<ClockCircleOutlined />}
                      suffix="篇"
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="班级平均分"
                      value={classStats.average_score}
                      prefix={<TrophyOutlined />}
                      precision={1}
                      suffix="分"
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Card>
                    <div ref={scoreDistChartRef} style={{ width: '100%', height: 400 }} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <div ref={trendChartRef} style={{ width: '100%', height: 400 }} />
                  </Card>
                </Col>
              </Row>
            </>
          )}
          {!classStats && !classStatsLoading && (
            <Card>
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                暂无班级数据
              </div>
            </Card>
          )}
        </Spin>
      )}
    </div>
  );
};

export default Dashboard;
