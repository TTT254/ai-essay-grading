/**
 * 学生状态管理
 */
import { create } from 'zustand';
import api from '../services/api';

interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  word_count_min?: number;
  word_count_max?: number;
  status: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  content: string;
  image_url?: string;
  submitted_at: string;
  grading_status: string;
}

interface GradingReport {
  id: string;
  submission_id: string;
  total_score: number;
  scores: any;
  errors: any[];
  comment: string;
  teacher_scores?: any;
  teacher_comment?: string;
  status: string;
}

interface StudentState {
  assignments: Assignment[];
  submissions: Submission[];
  currentReport: GradingReport | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAssignments: (studentId: string) => Promise<void>;
  submitEssay: (studentId: string, data: any) => Promise<boolean>;
  uploadImage: (file: File) => Promise<string | null>;
  ocrRecognize: (imageUrl: string) => Promise<string | null>;
  fetchHistory: (studentId: string) => Promise<void>;
  fetchReport: (submissionId: string) => Promise<void>;
  clearError: () => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  assignments: [],
  submissions: [],
  currentReport: null,
  isLoading: false,
  error: null,

  fetchAssignments: async (studentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.student.getAssignments(studentId);
      // 后端返回格式: { success: true, data: [...] } 或直接返回数组
      const assignmentsData = response.data || response || [];
      set({
        assignments: Array.isArray(assignmentsData) ? assignmentsData : [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || '获取任务失败',
        assignments: [],  // 出错时设置为空数组
        isLoading: false,
      });
    }
  },

  submitEssay: async (studentId: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      await api.student.submitEssay(studentId, data);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        error: error.message || '提交失败',
        isLoading: false,
      });
      return false;
    }
  },

  uploadImage: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.student.uploadImage(file);
      set({ isLoading: false });
      return data.url;
    } catch (error: any) {
      set({
        error: error.message || '上传失败',
        isLoading: false,
      });
      return null;
    }
  },

  ocrRecognize: async (imageUrl: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.student.ocrRecognize(imageUrl);
      set({ isLoading: false });
      return data.text;
    } catch (error: any) {
      set({
        error: error.message || 'OCR识别失败',
        isLoading: false,
      });
      return null;
    }
  },

  fetchHistory: async (studentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.student.getHistory(studentId);
      // 后端返回格式: { success: true, data: [...] } 或直接返回数组
      const historyData = response.data || response || [];
      set({
        submissions: Array.isArray(historyData) ? historyData : [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || '获取历史失败',
        submissions: [],  // 出错时设置为空数组
        isLoading: false,
      });
    }
  },

  fetchReport: async (submissionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.student.getReport(submissionId);
      // 后端返回格式: { success: true, data: {...} } 或直接返回对象
      const reportData = response.data || response || null;
      set({
        currentReport: reportData,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || '获取报告失败',
        currentReport: null,  // 出错时设置为 null
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
