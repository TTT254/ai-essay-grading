/**
 * 登录/注册流程单元测试
 * 模拟 Supabase 服务，验证 authStore 逻辑
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase service
const mockSignUp = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockGetCurrentUser = vi.fn();
const mockResendConfirmation = vi.fn();
const mockGetUserById = vi.fn();
const mockCreateUser = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('../services/supabase', () => ({
  authService: {
    signUp: (...args: any[]) => mockSignUp(...args),
    signIn: (...args: any[]) => mockSignIn(...args),
    signOut: (...args: any[]) => mockSignOut(...args),
    getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
    resendConfirmation: (...args: any[]) => mockResendConfirmation(...args),
  },
  userService: {
    getUserById: (...args: any[]) => mockGetUserById(...args),
    createUser: (...args: any[]) => mockCreateUser(...args),
    updateUser: (...args: any[]) => mockUpdateUser(...args),
  },
}));

// Must import AFTER mocks are set up
import { useAuthStore } from '../store/authStore';

describe('Auth Store - 登录流程', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== 登录测试 ==========

  describe('login', () => {
    it('正常登录 - 用户存在于业务表', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' };
      const mockSession = { access_token: 'token-123' };
      const mockUserData = {
        id: 'user-1',
        email: 'test@test.com',
        name: '张三',
        role: 'student',
        class_id: 'class-1',
      };

      mockSignIn.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      mockGetUserById.mockResolvedValue({
        data: mockUserData,
        error: null,
      });

      const result = await useAuthStore.getState().login('test@test.com', '123456');

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUserData);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
      expect(localStorage.getItem('access_token')).toBe('token-123');
    });

    it('登录失败 - 邮箱未确认', async () => {
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed', code: 'email_not_confirmed' },
      });

      const result = await useAuthStore.getState().login('test@test.com', '123456');

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toContain('Email not confirmed');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('登录失败 - 密码错误', async () => {
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', code: 'invalid_credentials' },
      });

      const result = await useAuthStore.getState().login('test@test.com', 'wrong');

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toContain('Invalid login credentials');
    });

    it('登录成功但业务用户不存在 - 自动创建', async () => {
      const mockUser = {
        id: 'user-2',
        email: 'new@test.com',
        user_metadata: { name: '李四', role: 'teacher' },
      };
      const mockSession = { access_token: 'token-456' };
      const createdUser = {
        id: 'user-2',
        email: 'new@test.com',
        name: '李四',
        role: 'teacher',
      };

      mockSignIn.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      // 第一次查询业务用户不存在
      mockGetUserById.mockResolvedValue({
        data: null,
        error: { message: 'not found', code: 'PGRST116' },
      });
      // 创建业务用户成功
      mockCreateUser.mockResolvedValue({
        data: createdUser,
        error: null,
      });

      const result = await useAuthStore.getState().login('new@test.com', '123456');

      expect(result).toBe(true);
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-2',
          email: 'new@test.com',
          role: 'teacher',
          name: '李四',
        })
      );
      expect(useAuthStore.getState().user).toEqual(createdUser);
    });

    it('BUG: 登录成功但业务用户创建失败 - 应该报错', async () => {
      const mockUser = {
        id: 'user-3',
        email: 'fail@test.com',
        user_metadata: { name: '王五', role: 'student' },
      };
      const mockSession = { access_token: 'token-789' };

      mockSignIn.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      mockGetUserById.mockResolvedValue({
        data: null,
        error: { message: 'not found' },
      });
      // 创建失败 - 比如 RLS 阻止
      mockCreateUser.mockResolvedValue({
        data: null,
        error: { message: 'new row violates row-level security policy', code: '42501' },
      });

      const result = await useAuthStore.getState().login('fail@test.com', '123456');

      // 应该失败
      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toBeTruthy();
    });
  });

  // ========== 注册测试 ==========

  describe('register', () => {
    it('正常注册 - 无需邮箱确认，自动登录成功', async () => {
      const mockUser = {
        id: 'new-user-1',
        email: 'student@test.com',
        user_metadata: { name: '小明', role: 'student', class_id: 'class-1' },
        identities: [{ id: 'new-user-1' }],
      };
      const mockSession = { access_token: 'reg-token-1' };
      const mockUserData = {
        id: 'new-user-1',
        email: 'student@test.com',
        name: '小明',
        role: 'student',
        class_id: 'class-1',
      };

      // signUp 成功
      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      // createUser 成功
      mockCreateUser.mockResolvedValue({
        data: mockUserData,
        error: null,
      });
      // 自动登录 signIn 成功
      mockSignIn.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      // getUserById 返回用户
      mockGetUserById.mockResolvedValue({
        data: mockUserData,
        error: null,
      });

      const result = await useAuthStore.getState().register(
        'student@test.com',
        '123456',
        { name: '小明', role: 'student', class_id: 'class-1' }
      );

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUserData);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('注册成功但需要邮箱确认 - error 状态应为 null', async () => {
      const mockUser = {
        id: 'new-user-2',
        email: 'confirm@test.com',
        user_metadata: { name: '小红', role: 'student' },
        identities: [{ id: 'new-user-2' }],
      };

      // signUp 成功
      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });
      // createUser 成功
      mockCreateUser.mockResolvedValue({
        data: { id: 'new-user-2', email: 'confirm@test.com', name: '小红', role: 'student' },
        error: null,
      });
      // 自动登录失败 - 邮箱未确认
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed', code: 'email_not_confirmed' },
      });

      const result = await useAuthStore.getState().register(
        'confirm@test.com',
        '123456',
        { name: '小红', role: 'student' }
      );

      // register 返回 true（注册本身成功了）
      expect(result).toBe(true);

      // 修复后: error 应该为 null，不被自动登录失败污染
      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('注册时 createUser 被 RLS 阻止 - 应返回失败', async () => {
      const mockUser = {
        id: 'new-user-3',
        email: 'rls@test.com',
        user_metadata: { name: '小刚', role: 'student' },
        identities: [{ id: 'new-user-3' }],
      };

      // signUp 成功
      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });
      // createUser 被 RLS 阻止
      mockCreateUser.mockResolvedValue({
        data: null,
        error: { message: 'new row violates row-level security policy', code: '42501' },
      });

      const result = await useAuthStore.getState().register(
        'rls@test.com',
        '123456',
        { name: '小刚', role: 'student' }
      );

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBeTruthy();
    });

    it('注册失败 - 邮箱已被使用', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', code: 'user_already_exists' },
      });

      const result = await useAuthStore.getState().register(
        'existing@test.com',
        '123456',
        { name: '已存在', role: 'student' }
      );

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toContain('User already registered');
    });

    it('注册超时', async () => {
      // signUp 永远不返回
      mockSignUp.mockImplementation(() => new Promise(() => {}));

      const result = await useAuthStore.getState().register(
        'timeout@test.com',
        '123456',
        { name: '超时', role: 'student' }
      );

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toContain('超时');
    }, 20000);

    it('signUp 返回 fake user (Supabase 已存在用户但未确认) - 应提示已注册', async () => {
      // Supabase 的坑：如果用户已注册但未确认邮箱，signUp 不会报错
      // 而是返回一个 "fake" user（identities 为空数组）
      const fakeUser = {
        id: 'fake-user-id',
        email: 'existing-unconfirmed@test.com',
        user_metadata: {},
        identities: [], // 空 identities = fake user
      };

      mockSignUp.mockResolvedValue({
        data: { user: fakeUser, session: null },
        error: null,
      });

      const result = await useAuthStore.getState().register(
        'existing-unconfirmed@test.com',
        '123456',
        { name: '重复', role: 'student' }
      );

      // 修复后：应该返回 false 并提示已注册
      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toContain('已注册');
    });
  });

  // ========== isLoading 状态测试 ==========

  describe('isLoading 状态管理', () => {
    it('登录过程中 isLoading 应为 true', async () => {
      let loadingDuringSignIn = false;

      mockSignIn.mockImplementation(async () => {
        loadingDuringSignIn = useAuthStore.getState().isLoading;
        return {
          data: { user: { id: '1', email: 'a@b.com' }, session: { access_token: 't' } },
          error: null,
        };
      });
      mockGetUserById.mockResolvedValue({
        data: { id: '1', email: 'a@b.com', name: 'A', role: 'student' },
        error: null,
      });

      await useAuthStore.getState().login('a@b.com', '123');

      expect(loadingDuringSignIn).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('BUG: register 内部调用 login 导致 isLoading 状态混乱', async () => {
      const loadingStates: boolean[] = [];

      const unsubscribe = useAuthStore.subscribe((state) => {
        loadingStates.push(state.isLoading);
      });

      mockSignUp.mockResolvedValue({
        data: { user: { id: 'u1', email: 'x@y.com', user_metadata: {}, identities: [{ id: 'u1' }] }, session: null },
        error: null,
      });
      mockCreateUser.mockResolvedValue({ data: {}, error: null });
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      });

      await useAuthStore.getState().register('x@y.com', '123', { name: 'X', role: 'student' });

      unsubscribe();

      // 修复后: isLoading 应该只有一次 true → false 的转换
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
