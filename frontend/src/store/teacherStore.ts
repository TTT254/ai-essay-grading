/**
 * 教师状态管理
 */
import { create } from 'zustand';
import api from '../services/api';

interface Class {
  id: string;
  grade: number;
  name: string;  // 数据库使用 name 字段
  teacher_id: string;
  student_count?: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  word_count_min?: number;
  word_count_max?: number;
  submissions_count?: number;
  graded_count?: number;
}

interface TeacherState {
  classes: Class[];
  assignments: Assignment[];
  selectedClassId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchClasses: (teacherId: string) => Promise<void>;
  createAssignment: (data: any) => Promise<boolean>;
  fetchAssignments: (classId: string, status?: string) => Promise<void>;
  reviewReport: (reportId: string, data: any) => Promise<boolean>;
  publishReport: (reportId: string) => Promise<boolean>;
  setSelectedClass: (classId: string) => void;
  clearError: () => void;
}

export const useTeacherStore = create<TeacherState>((set) => ({
  classes: [],
  assignments: [],
  selectedClassId: null,
  isLoading: false,
  error: null,

  fetchClasses: async (teacherId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.teacher.getClasses(teacherId);
      // 后端返回格式: { success: true, data: [...] }
      const classesData = response.data || response || [];
      set({
        classes: Array.isArray(classesData) ? classesData : [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || '获取班级失败',
        classes: [],  // 出错时设置为空数组
        isLoading: false,
      });
    }
  },

  createAssignment: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      await api.teacher.createAssignment(data);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        error: error.message || '创建作业失败',
        isLoading: false,
      });
      return false;
    }
  },

  fetchAssignments: async (classId: string, status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.teacher.getAssignments(classId, status);
      // 后端返回格式: { success: true, data: [...] }
      const assignmentsData = response.data || response || [];
      set({
        assignments: Array.isArray(assignmentsData) ? assignmentsData : [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || '获取作业失败',
        assignments: [],  // 出错时设置为空数组
        isLoading: false,
      });
    }
  },

  reviewReport: async (reportId: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      await api.grading.reviewReport(reportId, data);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        error: error.message || '审核失败',
        isLoading: false,
      });
      return false;
    }
  },

  publishReport: async (reportId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.grading.publishReport(reportId);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        error: error.message || '发布失败',
        isLoading: false,
      });
      return false;
    }
  },

  setSelectedClass: (classId: string) => set({ selectedClassId: classId }),

  clearError: () => set({ error: null }),
}));
