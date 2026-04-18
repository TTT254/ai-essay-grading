/**
 * Supabase客户端封装
 * 用于认证和实时数据
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 认证服务
export const authService = {
  // 注册
  signUp: async (email: string, password: string, userData: {
    name: string;
    role: 'student' | 'teacher';
    class_id?: string;
  }) => {
    const emailRedirectTo =
      // 可通过环境变量覆盖，否则回退到 /login
      (import.meta.env.VITE_SUPABASE_EMAIL_REDIRECT_TO as string | undefined)
      || (typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });
    return { data, error };
  },

  // 登录
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // 登出
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // 获取当前用户
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // 重置密码
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },

  // 更新密码
  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  // 监听认证状态变化
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // 重新发送确认邮件
  resendConfirmation: async (email: string) => {
    const emailRedirectTo =
      (import.meta.env.VITE_SUPABASE_EMAIL_REDIRECT_TO as string | undefined)
      || (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined);

    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });
    return { data, error };
  },
};

// 用户服务
export const userService = {
  // 获取用户信息
  getUserById: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // 创建用户信息（在首次登录且业务表无记录时调用）
  createUser: async (user: {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: 'student' | 'teacher' | null;
    class_id?: string | null;
  }) => {
    // 只传递有值的字段
    const payload: any = {
      id: user.id,
      email: user.email ?? null,
      role: user.role ?? null,
      class_id: user.class_id ?? null,
    };

    // 如果有 name，添加到 payload
    if (user.name !== undefined) {
      payload.name = user.name;
    }

    const { data, error } = await supabase
      .from('users')
      .insert(payload)
      .select()
      .single();
    return { data, error };
  },

  // 更新用户信息
  updateUser: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },
};

// 班级服务
export const classService = {
  // 获取所有班级
  getClasses: async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('grade', { ascending: true })
      .order('name', { ascending: true });  // 使用 name 字段排序
    return { data, error };
  },

  // 根据年级获取班级
  getClassesByGrade: async (grade: number) => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('grade', grade)
      .order('name', { ascending: true });  // 使用 name 字段排序
    return { data, error };
  },

  // 根据ID获取单个班级
  getClassById: async (classId: string) => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();
    return { data, error };
  },

  // 获取教师管理的所有班级
  getClassesByTeacher: async (teacherId: string) => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('grade', { ascending: true })
      .order('name', { ascending: true });
    return { data, error };
  },
};

export default supabase;
