/**
 * 认证状态管理
 * 使用Zustand进行状态管理
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, userService } from '../services/supabase';

// 统一错误格式化，便于在页面上展示清晰原因
const formatError = (e: any): string => {
  try {
    const msg = e?.message || e?.error_description || e?.error || e?.data?.message || e?.data?.error;
    const code = e?.code || e?.status || e?.name;
    if (msg && code) return `${msg} (code: ${code})`;
    if (msg) return String(msg);
    if (typeof e === 'string') return e;
    return '未知错误';
  } catch {
    return '未知错误';
  }
};

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
  class_id?: string;
  avatar?: string;
  email_confirmed_at?: string | null;  // 新增：邮箱确认时间
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, userData: {
    name: string;
    role: 'student' | 'teacher';
    class_id?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  resendConfirmationEmail: () => Promise<boolean>;  // 新增：重新发送确认邮件
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        console.log('🔵 [authStore] login 开始', { email });
        set({ isLoading: true, error: null });
        try {
          console.log('🔵 [authStore] 调用 authService.signIn...');
          const { data, error } = await authService.signIn(email, password);
          console.log('🔵 [authStore] signIn 返回', { data, error });

          if (error) {
            console.error('🔴 [authStore] signIn 错误', error);
            throw error;
          }

          if (data.user) {
            console.log('🔵 [authStore] 登录成功，获取用户信息', data.user.id);
            // 获取用户详细信息
            let { data: userData, error: userError } = await userService.getUserById(data.user.id);
            console.log('🔵 [authStore] getUserById 返回', { userData, userError });

            // 若业务用户不存在，则尝试用 metadata 初始化一条记录
            if (userError || !userData) {
              console.log('🟡 [authStore] 业务用户不存在，尝试创建...');
              const md: any = (data.user as any).user_metadata || {};
              const createPayload: any = {
                id: data.user.id,
                email: data.user.email,
                role: md.role ?? null,
                class_id: md.class_id ?? null,
              };

              // 添加 name 字段（如果存在）
              if (md.name) {
                createPayload.name = md.name;
              }

              const createRes = await userService.createUser(createPayload);
              if (createRes.error) {
                console.error('🔴 [authStore] 创建业务用户失败', createRes.error);
                throw createRes.error;
              }
              userData = createRes.data;
              console.log('🔵 [authStore] 业务用户创建成功', userData);
            }

            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
            });

            // 保存token
            if (data.session?.access_token) {
              localStorage.setItem('access_token', data.session.access_token);
              console.log('🔵 [authStore] token 已保存');
            }

            console.log('✅ [authStore] 登录完成', userData);
            return true;
          }
          console.error('🔴 [authStore] 登录失败：未返回用户信息');
          set({ error: '登录失败：未返回用户信息', isLoading: false });
          return false;
        } catch (error: any) {
          console.error('🔴 [authStore] login 异常', error);
          const errMsg = formatError(error) || '登录失败';
          set({
            error: errMsg,
            isLoading: false,
          });
          return false;
        }
      },

      register: async (email: string, password: string, userData) => {
        console.log('🔵 [authStore] register 开始', { email, userData });
        set({ isLoading: true, error: null });
        try {
          console.log('🔵 [authStore] 调用 authService.signUp...');
          const { data, error } = await authService.signUp(email, password, userData);
          console.log('🔵 [authStore] signUp 返回', { data, error });

          if (error) {
            console.error('🔴 [authStore] signUp 错误', error);
            throw error;
          }

          if (data.user) {
            console.log('🔵 [authStore] 用户创建成功', data.user.id);

            // 立即在业务表中写入记录
            const metadata: any = (data.user as any).user_metadata || {};
            const userPayload: any = {
              id: data.user.id,
              email: data.user.email,
              role: metadata.role ?? userData.role,
              class_id: metadata.class_id ?? userData.class_id ?? null,
            };

            // 添加 name/full_name 字段（根据数据库实际字段）
            if (metadata.name ?? userData.name) {
              userPayload.name = metadata.name ?? userData.name;
            }

            console.log('🔵 [authStore] 创建业务用户', userPayload);
            const createResult = await userService.createUser(userPayload);

            if (createResult.error) {
              console.error('🔴 [authStore] 创建业务用户失败', createResult.error);
              console.error('🔴 [authStore] 错误详情', {
                code: createResult.error.code,
                message: createResult.error.message,
                details: createResult.error.details,
                hint: createResult.error.hint
              });

              // 如果不是重复错误，抛出异常
              if (createResult.error.code !== '23505') {
                throw new Error(`创建用户失败: ${createResult.error.message}`);
              } else {
                console.log('🟡 [authStore] 用户已存在，跳过创建');
              }
            } else {
              console.log('✅ [authStore] 业务用户创建成功', createResult.data);
            }

            // 无论邮箱确认状态如何，都尝试自动登录
            console.log('🔵 [authStore] 准备自动登录...');
            try {
              const loginResult = await get().login(email, password);
              console.log('✅ [authStore] 自动登录结果', loginResult);

              // 如果登录成功，返回 true
              if (loginResult) {
                return true;
              }

              // 登录失败但注册成功，也返回 true
              // 用户可能需要先确认邮箱才能登录
              console.log('🟡 [authStore] 自动登录失败，但注册成功');
              set({ isLoading: false });
              return true;
            } catch (loginError) {
              console.error('🔴 [authStore] 自动登录失败', loginError);
              // 登录失败但注册成功，返回 true
              set({ isLoading: false });
              return true;
            }
          }

          console.error('🔴 [authStore] 注册失败：未返回用户信息');
          set({ error: '注册失败：未返回用户信息', isLoading: false });
          return false;
        } catch (error: any) {
          console.error('🔴 [authStore] register 异常', error);
          const errMsg = formatError(error) || '注册失败';
          set({
            error: errMsg,
            isLoading: false,
          });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.signOut();
          localStorage.removeItem('access_token');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || '登出失败',
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const { user, error } = await authService.getCurrentUser();
          if (error) throw error;

          if (user) {
            const { data: userData, error: userError } = await userService.getUserById(user.id);
            if (userError) throw userError;

            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return false;

        set({ isLoading: true, error: null });
        try {
          const { data, error } = await userService.updateUser(user.id, updates);
          if (error) throw error;

          set({
            user: { ...user, ...data },
            isLoading: false,
          });
          return true;
        } catch (error: any) {
          set({
            error: error.message || '更新失败',
            isLoading: false,
          });
          return false;
        }
      },

      // 新增：重新发送确认邮件
      resendConfirmationEmail: async () => {
        const { user } = get();
        if (!user?.email) {
          set({ error: '无法获取用户邮箱' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          console.log('📧 [authStore] 重新发送确认邮件', user.email);
          const { error } = await authService.resendConfirmation(user.email);

          if (error) {
            console.error('❌ [authStore] 发送失败', error);
            throw error;
          }

          console.log('✅ [authStore] 确认邮件已发送');
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          const errMsg = formatError(error) || '发送失败';
          set({ error: errMsg, isLoading: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
