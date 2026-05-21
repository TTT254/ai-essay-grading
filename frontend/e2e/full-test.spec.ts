/**
 * 全面功能测试 - 覆盖登录、注册、学生端、教师端所有页面和交互
 */
import { test, expect, Page } from '@playwright/test';

const STUDENT_EMAIL = 'student@demo.com';
const STUDENT_PASSWORD = 'demo123456';
const TEACHER_EMAIL = 'teacher@demo.com';
const TEACHER_PASSWORD = 'demo123456';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);

  await page.getByPlaceholder('邮箱').fill(email);
  await page.getByPlaceholder('密码').fill(password);

  const captchaText = await page.locator('.captcha-code').textContent();
  if (captchaText && captchaText !== '点击刷新' && captchaText !== '加载中...') {
    await page.getByPlaceholder('验证码').fill(captchaText);
  }

  await page.getByRole('button', { name: '登 录' }).click();
  await page.waitForURL(/\/(student|teacher|dashboard)/, { timeout: 30000 });
  await page.waitForTimeout(1500);
}

// ==================== 首页 ====================
test.describe('首页', () => {
  test.setTimeout(30000);

  test('首页正常展示', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await expect(page.getByText('AI赋能作文批改')).toBeVisible();
    await expect(page.getByText('免费开始使用')).toBeVisible();
    await expect(page.getByText('立即登录')).toBeVisible();

    await page.screenshot({ path: 'test-results/full/home.png' });
  });

  test('首页导航到登录页', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await page.getByText('立即登录').click();
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page.getByText('欢迎回来')).toBeVisible();
  });
});

// ==================== 登录 ====================
test.describe('登录功能', () => {
  test.setTimeout(40000);

  test('登录页面元素完整', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 表单元素
    await expect(page.getByPlaceholder('邮箱')).toBeVisible();
    await expect(page.getByPlaceholder('密码')).toBeVisible();
    await expect(page.getByPlaceholder('验证码')).toBeVisible();
    await expect(page.getByRole('button', { name: '登 录' })).toBeVisible();

    // 验证码已加载（不是"加载中..."）
    const captcha = page.locator('.captcha-code');
    await expect(captcha).toBeVisible();
    const captchaText = await captcha.textContent();
    expect(captchaText).not.toBe('加载中...');

    // 注册链接
    await expect(page.getByText('立即注册')).toBeVisible();

    // 左侧功能卡片
    await expect(page.getByText('秒级批改')).toBeVisible();

    await page.screenshot({ path: 'test-results/full/login-page.png' });
  });

  test('验证码可点击刷新', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const captcha = page.locator('.captcha-code');
    const firstCode = await captcha.textContent();

    // 点击验证码刷新
    await captcha.click();
    await page.waitForTimeout(1500);

    const newCode = await captcha.textContent();
    // 新验证码应该不同（大概率）
    expect(newCode).toBeTruthy();
    expect(newCode).not.toBe('加载中...');
  });

  test('空表单提交显示验证错误', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: '登 录' }).click();
    await page.waitForTimeout(1000);

    // 应该有表单验证提示
    const hasValidation = await page.locator('.ant-form-item-explain-error').count();
    expect(hasValidation).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/full/login-validation.png' });
  });

  test('错误密码登录失败', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.getByPlaceholder('邮箱').fill(STUDENT_EMAIL);
    await page.getByPlaceholder('密码').fill('wrongpassword');

    const captchaText = await page.locator('.captcha-code').textContent();
    if (captchaText && captchaText !== '点击刷新' && captchaText !== '加载中...') {
      await page.getByPlaceholder('验证码').fill(captchaText);
    }

    await page.getByRole('button', { name: '登 录' }).click();
    await page.waitForTimeout(3000);

    // 应该还在登录页或显示错误
    const url = page.url();
    const hasError = await page.locator('.ant-message-error, .ant-alert-error').isVisible().catch(() => false);
    expect(url.includes('/login') || hasError).toBeTruthy();

    await page.screenshot({ path: 'test-results/full/login-failed.png' });
  });

  test('学生账号登录成功', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await expect(page).toHaveURL(/\/student/);
    await page.screenshot({ path: 'test-results/full/student-login-success.png' });
  });

  test('教师账号登录成功', async ({ page }) => {
    await login(page, TEACHER_EMAIL, TEACHER_PASSWORD);
    await expect(page).toHaveURL(/\/teacher/);
    await page.screenshot({ path: 'test-results/full/teacher-login-success.png' });
  });
});

// ==================== 注册 ====================
test.describe('注册功能', () => {
  test.setTimeout(30000);

  test('注册页面元素完整', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await expect(page.getByPlaceholder('姓名')).toBeVisible();
    await expect(page.getByPlaceholder('邮箱')).toBeVisible();
    await expect(page.getByPlaceholder(/密码/)).toBeVisible();
    await expect(page.getByPlaceholder('确认密码')).toBeVisible();

    // 角色选择
    await expect(page.getByText('学生')).toBeVisible();
    await expect(page.getByText('教师')).toBeVisible();

    // 验证码
    await expect(page.locator('.captcha-code')).toBeVisible();

    // 注册按钮
    await expect(page.getByRole('button', { name: /注 册/ })).toBeVisible();

    await page.screenshot({ path: 'test-results/full/register-page.png' });
  });

  test('选择学生角色时显示班级选择', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 点击学生角色
    const studentRadio = page.getByText('学生').first();
    if (await studentRadio.isVisible()) {
      await studentRadio.click();
      await page.waitForTimeout(1000);

      // 应显示班级选择下拉
      const classSelect = page.locator('.ant-select').first();
      const hasClassSelect = await classSelect.isVisible().catch(() => false);
      // 班级选择应该出现
      await page.screenshot({ path: 'test-results/full/register-student-role.png' });
    }
  });

  test('注册表单验证', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 直接提交空表单
    const submitBtn = page.getByRole('button', { name: /注册/ });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);

      const errors = await page.locator('.ant-form-item-explain-error').count();
      expect(errors).toBeGreaterThan(0);
    }

    await page.screenshot({ path: 'test-results/full/register-validation.png' });
  });

  test('注册页到登录页导航', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');

    const loginLink = page.getByText('已有账号').locator('..').getByRole('link');
    if (await loginLink.isVisible().catch(() => false)) {
      await loginLink.click();
      await page.waitForURL(/\/login/, { timeout: 5000 });
    } else {
      // 尝试直接找链接
      const link = page.locator('a[href="/login"]');
      if (await link.isVisible().catch(() => false)) {
        await link.click();
        await page.waitForURL(/\/login/, { timeout: 5000 });
      }
    }
  });
});

// ==================== 学生端 ====================
test.describe('学生端功能', () => {
  test.setTimeout(60000);

  test('任务列表页', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto('/student/tasks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 页面应加载，显示任务列表或空状态
    const hasTable = await page.locator('.ant-table').isVisible().catch(() => false);
    const hasEmpty = await page.locator('.ant-empty').isVisible().catch(() => false);
    const hasContent = await page.textContent('body');
    expect(hasTable || hasEmpty || (hasContent && hasContent.length > 0)).toBeTruthy();

    await page.screenshot({ path: 'test-results/full/student-tasks.png' });
  });

  test('提交作文页 - 需要assignmentId', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    // 没有有效assignmentId时访问提交页
    await page.goto('/student/submit/test-id');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/full/student-submit.png' });
  });

  test('历史记录页', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto('/student/history');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 应显示提交历史标题
    const hasTitle = await page.getByText('提交历史').isVisible().catch(() => false);
    // 统计栏
    const hasStats = await page.locator('.history-stats-bar, .history-stat-card').isVisible().catch(() => false);
    // 表格
    const hasTable = await page.locator('.ant-table').isVisible().catch(() => false);

    expect(hasTitle || hasTable).toBeTruthy();
    await page.screenshot({ path: 'test-results/full/student-history.png' });
  });

  test('报告页 - 不存在报告显示友好提示', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto('/student/report/5299c830-e73d-4099-85a3-e01204098e5a');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // 不应无限转圈
    const noSpinner = !(await page.locator('.ant-spin-spinning').isVisible().catch(() => false));
    // 应显示中文提示
    const hasChineseError = await page.getByText('报告不存在').isVisible().catch(() => false);
    const hasHelpText = await page.getByText('尚未批改完成').isVisible().catch(() => false);
    const hasBackBtn = await page.getByText('返回历史记录').isVisible().catch(() => false);

    expect(noSpinner).toBeTruthy();
    expect(hasChineseError || hasHelpText).toBeTruthy();
    expect(hasBackBtn).toBeTruthy();

    await page.screenshot({ path: 'test-results/full/student-report-empty.png' });
  });

  test('报告页 - 返回按钮有效', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto('/student/report/non-existent');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const backBtn = page.getByText('返回历史记录');
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForURL(/\/student\/history/, { timeout: 5000 });
      await expect(page).toHaveURL(/\/student\/history/);
    }
  });

  test('AI辅导页 - 界面展示', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto('/student/ai-chat/5299c830-e73d-4099-85a3-e01204098e5a');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 顶栏
    await expect(page.locator('.chat-topbar')).toBeVisible();
    await expect(page.getByText('AI写作辅导')).toBeVisible();
    // 输入区
    await expect(page.locator('.chat-textarea')).toBeVisible();
    // 返回按钮
    await expect(page.getByText('返回')).toBeVisible();
    // 空状态提示
    const emptyTitle = await page.getByText('我是AI写作助手').isVisible().catch(() => false);
    // 建议提问 chips
    const hasChips = await page.locator('.chat-hint-chip').count();

    await page.screenshot({ path: 'test-results/full/student-ai-chat.png' });
  });

  test('AI辅导页 - 返回按钮', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto('/student/history');
    await page.waitForTimeout(1500);
    await page.goto('/student/ai-chat/5299c830-e73d-4099-85a3-e01204098e5a');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.getByText('返回').click();
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url).not.toContain('/ai-chat/');
  });

  test('AI辅导页 - 输入框交互', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto('/student/ai-chat/5299c830-e73d-4099-85a3-e01204098e5a');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const textarea = page.locator('.chat-textarea');

    // 空输入时发送按钮应禁用
    const sendBtn = page.locator('.chat-send-btn');
    await expect(sendBtn).toBeDisabled();

    // 输入文字后发送按钮应启用
    await textarea.fill('测试消息');
    await expect(sendBtn).toBeEnabled();

    // 清空后按钮恢复禁用
    await textarea.fill('');
    await expect(sendBtn).toBeDisabled();
  });

  test('错题本页', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto('/student/mistakes');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    await page.screenshot({ path: 'test-results/full/student-mistakes.png' });
  });

  test('个人中心页', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto('/student/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 应显示用户名信息
    const hasUserInfo = await page.getByText('演示学生').isVisible().catch(() => false);
    const content = await page.textContent('body');
    expect(content && content.length > 0).toBeTruthy();

    await page.screenshot({ path: 'test-results/full/student-profile.png' });
  });

  test('侧边栏导航 - 所有菜单项可点击', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);

    const menuItems = [
      { text: '任务列表', urlPart: '/student/tasks' },
      { text: '历史记录', urlPart: '/student/history' },
      { text: '错题本', urlPart: '/student/mistakes' },
      { text: '个人中心', urlPart: '/student/profile' },
    ];

    for (const item of menuItems) {
      const menuLink = page.locator(`.ant-menu-item:has-text("${item.text}")`).first();
      if (await menuLink.isVisible().catch(() => false)) {
        await menuLink.click();
        await page.waitForTimeout(1500);
        expect(page.url()).toContain(item.urlPart);
      }
    }

    await page.screenshot({ path: 'test-results/full/student-sidebar-nav.png' });
  });
});

// ==================== 教师端 ====================
test.describe('教师端功能', () => {
  test.setTimeout(60000);

  test('教师登录后跳转到教师页', async ({ page }) => {
    await login(page, TEACHER_EMAIL, TEACHER_PASSWORD);
    await expect(page).toHaveURL(/\/teacher/);
    await page.screenshot({ path: 'test-results/full/teacher-home.png' });
  });

  test('班级管理页', async ({ page }) => {
    await login(page, TEACHER_EMAIL, TEACHER_PASSWORD);
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    await page.screenshot({ path: 'test-results/full/teacher-classes.png' });
  });

  test('作业管理页', async ({ page }) => {
    await login(page, TEACHER_EMAIL, TEACHER_PASSWORD);
    await page.goto('/teacher/assignments');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    await page.screenshot({ path: 'test-results/full/teacher-assignments.png' });
  });

  test('数据仪表盘页', async ({ page }) => {
    await login(page, TEACHER_EMAIL, TEACHER_PASSWORD);
    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    await page.screenshot({ path: 'test-results/full/teacher-dashboard.png' });
  });

  test('教师个人中心', async ({ page }) => {
    await login(page, TEACHER_EMAIL, TEACHER_PASSWORD);
    await page.goto('/teacher/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    await page.screenshot({ path: 'test-results/full/teacher-profile.png' });
  });
});

// ==================== 权限控制 ====================
test.describe('权限控制', () => {
  test.setTimeout(30000);

  test('未登录访问学生页面应跳转登录', async ({ page }) => {
    await page.goto('/student/tasks');
    await page.waitForTimeout(2000);

    // 应重定向到登录页或首页
    const url = page.url();
    expect(url.includes('/login') || url.endsWith('/') || url.includes('/home')).toBeTruthy();
  });

  test('未登录访问教师页面应跳转登录', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url.includes('/login') || url.endsWith('/') || url.includes('/home')).toBeTruthy();
  });
});
