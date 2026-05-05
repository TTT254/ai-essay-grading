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
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await authService.signIn(email, password);

          if (error) {
            throw error;
          }

          if (data.user) {
            // 获取用户详细信息
            let { data: userData, error: userError } = await userService.getUserById(data.user.id);

            // 若业务用户不存在，则尝试用 metadata 初始化一条记录
            if (userError || !userData) {
              const md: any = (data.user as any).user_metadata || {};
              const createPayload: any = {
                id: data.user.id,
                email: data.user.email,
                role: md.role ?? null,
                class_id: md.class_id ?? null,
              };

              if (md.name) {
                createPayload.name = md.name;
              }

              const createRes = await userService.createUser(createPayload);
              if (createRes.error) {
                throw new Error(createRes.error.message || '创建用户信息失败');
              }
              userData = createRes.data;
            }

            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
            });

            // 保存token
            if (data.session?.access_token) {
              localStorage.setItem('access_token', data.session.access_token);
            }

            return true;
          }
          set({ error: '登录失败：未返回用户信息', isLoading: false });
          return false;
        } catch (error: any) {
          const errMsg = formatError(error) || '登录失败';
          set({
            error: errMsg,
            isLoading: false,
          });
          return false;
        }
      },

      register: async (email: string, password: string, userData) => {
        set({ isLoading: true, error: null });
        try {
          // 添加超时保护，防止 Supabase 不可达时无限等待
          const signUpPromise = authService.signUp(email, password, userData);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('注册请求超时，请检查网络连接')), 15000)
          );
          const { data, error } = await Promise.race([signUpPromise, timeoutPromise]);

          if (error) {
            throw error;
          }

          if (!data.user) {
            set({ error: '注册失败：未返回用户信息', isLoading: false });
            return false;
          }

          // 检测 Supabase "fake user" 场景：
          // 邮箱已注册但未确认时，signUp 不报错但返回 identities 为空
          const identities = (data.user as any).identities;
          if (Array.isArray(identities) && identities.length === 0) {
            set({
              error: '该邮箱已注册，请直接登录或检查邮箱中的确认邮件',
              isLoading: false,
            });
            return false;
          }

          // 在业务表中写入记录
          const metadata: any = (data.user as any).user_metadata || {};
          const userPayload: any = {
            id: data.user.id,
            email: data.user.email,
            role: metadata.role ?? userData.role,
            class_id: metadata.class_id ?? userData.class_id ?? null,
          };

          if (metadata.name ?? userData.name) {
            userPayload.name = metadata.name ?? userData.name;
          }

          const createResult = await userService.createUser(userPayload);

          if (createResult.error) {
            // 重复记录可以忽略（用户已存在）
            if (createResult.error.code !== '23505') {
              throw new Error(`创建用户失败: ${createResult.error.message}`);
            }
          }

          // 尝试自动登录（不污染 error 状态）
          try {
            const { data: loginData, error: loginError } = await authService.signIn(email, password);

            if (!loginError && loginData.user) {
              // 自动登录成功，获取业务用户信息
              const { data: bizUser } = await userService.getUserById(loginData.user.id);

              if (bizUser) {
                set({
                  user: bizUser,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                });

                if (loginData.session?.access_token) {
                  localStorage.setItem('access_token', loginData.session.access_token);
                }
                return true;
              }
            }
          } catch {
            // 自动登录失败（如需邮箱确认），不影响注册成功的结果
          }

          // 注册成功但无法自动登录（需要邮箱确认）
          set({ isLoading: false, error: null });
          return true;
        } catch (error: any) {
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

      // 重新发送确认邮件
      resendConfirmationEmail: async () => {
        const { user } = get();
        if (!user?.email) {
          set({ error: '无法获取用户邮箱' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const { error } = await authService.resendConfirmation(user.email);
          if (error) {
            throw error;
          }
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
