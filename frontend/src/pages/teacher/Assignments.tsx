/**
 * 教师作业管理页面
 */
import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Space,
  Tag,
  message,
  Typography,
} from 'antd';
import {  PlusOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTeacherStore } from '../../store/teacherStore';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Assignments: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { classes, assignments, fetchClasses, fetchAssignments, createAssignment, isLoading } = useTeacherStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    location.state?.classId || null
  );
  const [form] = Form.useForm();

  useEffect(() => {
    if (user?.id) {
      fetchClasses(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedClassId) {
      fetchAssignments(selectedClassId);
    }
  }, [selectedClassId]);

  const handleCreate = async (values: any) => {
    if (!selectedClassId || !user?.id) {
      message.error('请先选择班级');
      return;
    }

    const data = {
      ...values,
      teacher_id: user.id,
      class_id: selectedClassId,
      deadline: values.deadline.toISOString(),
    };

    const success = await createAssignment(data);
    if (success) {
      message.success('作业创建成功');
      setIsModalOpen(false);
      form.resetFields();
      fetchAssignments(selectedClassId);
    } else {
      message.error('创建失败');
    }
  };

  const getStatusTag = (deadline: string, submissionCount: number, totalStudents: number) => {
    const now = dayjs();
    const deadlineDate = dayjs(deadline);
    const diff = deadlineDate.diff(now, 'day');

    if (diff < 0) {
      return <Tag color="default">已截止</Tag>;
    } else if (diff === 0) {
      return <Tag color="red">今日截止</Tag>;
    } else if (diff <= 3) {
      return <Tag color="orange">即将截止</Tag>;
    } else {
      return <Tag color="blue">进行中</Tag>;
    }
  };

  const columns = [
    {
      title: '作业标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '字数要求',
      key: 'word_count',
      width: 120,
      render: (_: any, record: any) => {
        if (record.word_count_min && record.word_count_max) {
          return `${record.word_count_min}-${record.word_count_max}字`;
        } else if (record.word_count_min) {
          return `不少于${record.word_count_min}字`;
        }
        return '-';
      },
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 180,
      render: (deadline: string) => (
        <Space>
          <ClockCircleOutlined />
          {dayjs(deadline).format('YYYY-MM-DD HH:mm')}
        </Space>
      ),
    },
    {
      title: '提交/批改',
      key: 'progress',
      width: 120,
      render: (_: any, record: any) => (
        <span>
          {record.submission_count || 0}/{record.graded_count || 0}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'deadline',
      key: 'status',
      width: 100,
      render: (deadline: string, record: any) =>
        getStatusTag(deadline, record.submission_count, record.total_students),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          onClick={() => navigate(`/teacher/grading/${record.id}`)}
        >
          批改作业
        </Button>
      ),
    },
  ];

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2}>作业管理</Title>
        <Space>
          <Select
            placeholder="选择班级"
            style={{ width: 200 }}
            value={selectedClassId}
            onChange={setSelectedClassId}
          >
            {classes.map((cls) => (
              <Option key={cls.id} value={cls.id}>
                {cls.grade}年级{cls.class_name}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedClassId}
          >
            创建作业
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={assignments}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个作业`,
          }}
        />
      </Card>

      <Modal
        title="创建作业"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="作业标题"
            name="title"
            rules={[{ required: true, message: '请输入作业标题' }]}
          >
            <Input placeholder="例如：我的家乡" />
          </Form.Item>

          <Form.Item
            label="作业描述"
            name="description"
            rules={[{ required: true, message: '请输入作业描述' }]}
          >
            <TextArea rows={4} placeholder="请描述作业要求..." />
          </Form.Item>

          <Form.Item
            label="最少字数"
            name="word_count_min"
            rules={[{ required: true, message: '请输入最少字数' }]}
          >
            <Input type="number" placeholder="400" suffix="字" />
          </Form.Item>

          <Form.Item label="最多字数" name="word_count_max">
            <Input type="number" placeholder="800（可选）" suffix="字" />
          </Form.Item>

          <Form.Item
            label="截止时间"
            name="deadline"
            rules={[{ required: true, message: '请选择截止时间' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="选择截止日期和时间"
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Assignments;
