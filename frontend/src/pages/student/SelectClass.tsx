/**
 * 学生选择班级页面
 */
import React, { useState, useEffect } from 'react';
import { Card, Select, Button, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { classService } from '../../services/supabase';

const { Title, Text } = Typography;
const { Option } = Select;

interface Class {
  id: string;
  grade: number;
  class_name: string;
}

const SelectClass: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const { data, error } = await classService.getClasses();
      if (error) throw error;
      setClasses(data || []);
    } catch (err: any) {
      message.error('加载班级列表失败');
    }
  };

  const getClassesByGrade = () => {
    if (!selectedGrade) return classes;
    return classes.filter((c) => c.grade === selectedGrade);
  };

  const handleSubmit = async () => {
    if (!selectedClassId) {
      message.warning('请选择班级');
      return;
    }

    setLoading(true);
    try {
      const success = await updateUser({ class_id: selectedClassId });
      if (success) {
        message.success('班级选择成功');
        navigate('/student/tasks');
      } else {
        message.error('选择失败，请重试');
      }
    } catch (err: any) {
      message.error('选择失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 600, margin: '0 auto', paddingTop: 60 }}>
      <Card>
        <Title level={3}>选择您的班级</Title>
        <Text type="secondary">请选择您所在的年级和班级</Text>

        <div style={{ marginTop: 32 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>年级</label>
            <Select
              placeholder="选择年级"
              onChange={(grade) => {
                setSelectedGrade(grade);
                setSelectedClassId(null);
              }}
              value={selectedGrade}
              style={{ width: '100%' }}
              size="large"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                <Option key={grade} value={grade}>
                  {grade}年级
                </Option>
              ))}
            </Select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>班级</label>
            <Select
              placeholder="选择班级"
              onChange={setSelectedClassId}
              value={selectedClassId}
              style={{ width: '100%' }}
              size="large"
              disabled={!selectedGrade}
            >
              {getClassesByGrade().map((cls) => (
                <Option key={cls.id} value={cls.id}>
                  {cls.grade}年级{cls.class_name}
                </Option>
              ))}
            </Select>
          </div>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleSubmit}
            loading={loading}
          >
            确认
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SelectClass;
