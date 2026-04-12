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
import './Dashboard.css';

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
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: ['0-59', '60-69', '70-79', '80-89', '90-100'],
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748B' },
      },
      yAxis: {
        type: 'value',
        name: '人数',
        nameTextStyle: { color: '#64748B' },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#64748B' },
      },
      series: [
        {
          name: '学生人数',
          type: 'bar',
          data: distribution,
          barMaxWidth: 48,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#0066FF' },
              { offset: 1, color: '#66A3FF' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
    });
  };

  const renderTrendChart = (assignmentScores: { title: string; avg_score: number; count: number }[]) => {
    if (!trendChartRef.current) return;

    if (!trendChartInstance.current) {
      trendChartInstance.current = echarts.init(trendChartRef.current);
    }
    const chart = trendChartInstance.current;
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: assignmentScores.map((a) => a.title),
        axisLabel: { rotate: 30, overflow: 'truncate', width: 80, color: '#64748B' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: '平均分',
        nameTextStyle: { color: '#64748B' },
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#64748B' },
      },
      series: [
        {
          name: '平均分',
          type: 'line',
          smooth: true,
          data: assignmentScores.map((a) => a.avg_score),
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 102, 255, 0.25)' },
              { offset: 1, color: 'rgba(0, 102, 255, 0.02)' },
            ]),
          },
          itemStyle: { color: '#0066FF' },
          lineStyle: { color: '#0066FF', width: 2 },
          symbol: 'circle',
          symbolSize: 6,
        },
      ],
      grid: { left: 40, right: 20, top: 20, bottom: 60 },
    });
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>数据看板</Title>
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
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card stat-card--blue">
              <div className="stat-card-icon">
                <TeamOutlined />
              </div>
              <Statistic
                title="班级数量"
                value={teacherStats.total_classes}
                suffix="个"
                valueStyle={{ fontSize: 28, fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card stat-card--green">
              <div className="stat-card-icon">
                <FileTextOutlined />
              </div>
              <Statistic
                title="作业数量"
                value={teacherStats.total_assignments}
                suffix="个"
                valueStyle={{ fontSize: 28, fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card stat-card--orange">
              <div className="stat-card-icon">
                <ClockCircleOutlined />
              </div>
              <Statistic
                title="待批改数量"
                value={teacherStats.pending_grading}
                suffix="篇"
                valueStyle={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: teacherStats.pending_grading > 0 ? '#F59E0B' : undefined,
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card stat-card--purple">
              <div className="stat-card-icon">
                <CheckCircleOutlined />
              </div>
              <Statistic
                title="本周批改数"
                value={teacherStats.weekly_graded}
                suffix="篇"
                valueStyle={{ fontSize: 28, fontWeight: 700, color: '#10B981' }}
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
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card className="stat-card stat-card--blue">
                    <div className="stat-card-icon"><FileTextOutlined /></div>
                    <Statistic
                      title="班级作业数"
                      value={classStats.total_assignments}
                      suffix="个"
                      valueStyle={{ fontSize: 28, fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card className="stat-card stat-card--green">
                    <div className="stat-card-icon"><CheckCircleOutlined /></div>
                    <Statistic
                      title="提交总数"
                      value={classStats.total_submissions}
                      suffix="篇"
                      valueStyle={{ fontSize: 28, fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card className="stat-card stat-card--orange">
                    <div className="stat-card-icon"><ClockCircleOutlined /></div>
                    <Statistic
                      title="已批改"
                      value={classStats.graded_count}
                      suffix="篇"
                      valueStyle={{ fontSize: 28, fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card className="stat-card stat-card--purple">
                    <div className="stat-card-icon"><TrophyOutlined /></div>
                    <Statistic
                      title="班级平均分"
                      value={classStats.average_score}
                      precision={1}
                      suffix="分"
                      valueStyle={{ fontSize: 28, fontWeight: 700 }}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card
                    title="作文分数分布"
                    styles={{ header: { borderBottom: '1px solid #f0f0f0', fontWeight: 600 } }}
                  >
                    <div ref={scoreDistChartRef} style={{ width: '100%', height: 320 }} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card
                    title="近7天批改趋势"
                    styles={{ header: { borderBottom: '1px solid #f0f0f0', fontWeight: 600 } }}
                  >
                    <div ref={trendChartRef} style={{ width: '100%', height: 320 }} />
                  </Card>
                </Col>
              </Row>
            </>
          )}
          {!classStats && !classStatsLoading && (
            <Card>
              <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
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
