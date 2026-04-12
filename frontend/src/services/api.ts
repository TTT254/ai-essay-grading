/**
 * API客户端封装
 * 使用axios进行HTTP请求
 */
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 未授权，清除token并跳转登录
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API方法封装
export const api = {
  // 基础请求方法
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data),

  // 学生端API
  student: {
    // 获取任务列表
    getAssignments: (studentId: string) =>
      api.get(`/api/student/assignments?student_id=${studentId}`),

    // 提交作文
    submitEssay: (studentId: string, data: {
      assignment_id: string;
      content: string;
      image_url?: string;
      ocr_result?: string;
    }) =>
      api.post(`/api/student/submissions?student_id=${studentId}`, data),

    // 上传图片
    uploadImage: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post('/api/student/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((res) => res.data);
    },

    // OCR识别
    ocrRecognize: (imageUrl: string) =>
      api.post(`/api/student/ocr?image_url=${encodeURIComponent(imageUrl)}`),

    // 获取提交历史
    getHistory: (studentId: string, limit = 10, offset = 0) =>
      api.get(`/api/student/submissions/history?student_id=${studentId}&limit=${limit}&offset=${offset}`),

    // 获取批改报告
    getReport: (submissionId: string) =>
      api.get(`/api/student/reports/${submissionId}`),

    // 获取学生统计数据
    getStats: (studentId: string) =>
      api.get(`/api/student/stats?student_id=${studentId}`),

    // 获取学习曲线数据
    getLearningCurve: (studentId: string) =>
      api.get(`/api/student/learning-curve?student_id=${studentId}`),
  },

  // 教师端API
  teacher: {
    // 获取班级列表
    getClasses: (teacherId: string) =>
      api.get(`/api/teacher/classes?teacher_id=${teacherId}`),

    // 创建作业
    createAssignment: (data: {
      title: string;
      description: string;
      teacher_id: string;
      class_id: string;
      deadline: string;
      word_count_min?: number;
      word_count_max?: number;
    }) =>
      api.post('/api/teacher/assignments', data),

    // 获取作业列表
    getAssignments: (classId: string, status?: string) =>
      api.get(`/api/teacher/assignments?class_id=${classId}${status ? `&status=${status}` : ''}`),

    // 获取教师统计数据
    getStats: (teacherId: string) =>
      api.get(`/api/teacher/stats?teacher_id=${teacherId}`),

    // 获取班级统计数据
    getClassStats: (classId: string) =>
      api.get(`/api/teacher/classes/${classId}/stats`),

    // 批量AI批改
    batchGrade: (assignmentId: string) =>
      api.post(`/api/teacher/assignments/${assignmentId}/batch-grade`),

    // 获取班级排行榜
    getClassRanking: (classId: string) =>
      api.get(`/api/teacher/classes/${classId}/ranking`),
  },

  // 批改API
  grading: {
    // AI自动批改
    autoGrade: (submissionId: string) =>
      api.post(`/api/grading/auto-grade/${submissionId}`),

    // 教师审核
    reviewReport: (reportId: string, data: {
      teacher_scores?: any;
      teacher_comment?: string;
    }) =>
      api.put(`/api/grading/reports/${reportId}/review`, data),

    // 发布报告
    publishReport: (reportId: string) =>
      api.post(`/api/grading/reports/${reportId}/publish`),
  },

  // 认证API
  auth: {
    // 生成验证码
    getCaptcha: () =>
      api.get('/api/auth/captcha'),

    // 验证验证码
    verifyCaptcha: (captchaId: string, code: string) =>
      api.post('/api/auth/verify-captcha', { captcha_id: captchaId, code }),
  },

  // AI对话API
  aiChat: {
    // 发送消息
    sendMessage: (studentId: string, submissionId: string, message: string) =>
      api.post('/api/ai-chat/message', {
        student_id: studentId,
        submission_id: submissionId,
        message,
      }),

    // 获取对话历史
    getHistory: (studentId: string, submissionId: string) =>
      api.get(`/api/ai-chat/history?student_id=${studentId}&submission_id=${submissionId}`),
  },

  // 错题本API
  mistakes: {
    // 获取错题列表
    getMistakes: (studentId: string, errorType?: string) =>
      api.get(`/api/mistakes?student_id=${studentId}${errorType ? `&error_type=${errorType}` : ''}`),

    // 标记已掌握
    markMastered: (mistakeId: string) =>
      api.put(`/api/mistakes/${mistakeId}/master`),
  },
};

export default api;
