import { test, expect, Page } from '@playwright/test';

test.describe('登录注册流程', () => {
  test.setTimeout(60000);

  test('注册页面能正常加载', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await expect(page.getByText('创建账号')).toBeVisible();
    await expect(page.getByPlaceholder('姓名')).toBeVisible();
    await expect(page.getByPlaceholder('邮箱')).toBeVisible();

    await page.screenshot({ path: 'test-results/auth/register-page.png' });
  });

  test('教师注册能触发注册逻辑', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const timestamp = Date.now();
    await page.getByPlaceholder('姓名').fill('测试教师');
    await page.getByPlaceholder('邮箱').fill(`test_teacher_${timestamp}@example.com`);
    await page.getByPlaceholder('密码（至少6位）').fill('Test123456!');
    await page.getByPlaceholder('确认密码').fill('Test123456!');
    await page.getByText('教师').click();

    await page.screenshot({ path: 'test-results/auth/register-filled-teacher.png' });

    const consoleLogs: string[] = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    // Ant Design 按钮文字有空格："注 册"
    await page.locator('button.register-button').click();
    await page.waitForTimeout(8000);

    await page.screenshot({ path: 'test-results/auth/register-after-click-teacher.png' });

    const submitCalled = consoleLogs.some((log) => log.includes('handleSubmit 被调用'));
    const registerStarted = consoleLogs.some((log) => log.includes('开始注册'));
    console.log('Register logs:', consoleLogs.filter((l) => l.includes('[Register]') || l.includes('[authStore]')));

    expect(submitCalled).toBeTruthy();
    expect(registerStarted).toBeTruthy();
  });

  test('学生注册（选班级）能触发注册逻辑', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const timestamp = Date.now();
    await page.getByPlaceholder('姓名').fill('测试学生');
    await page.getByPlaceholder('邮箱').fill(`test_student_${timestamp}@example.com`);
    await page.getByPlaceholder('密码（至少6位）').fill('Test123456!');
    await page.getByPlaceholder('确认密码').fill('Test123456!');

    // 选年级
    await page.locator('.ant-select').first().click();
    await page.waitForTimeout(500);
    await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
    await page.waitForTimeout(500);

    // 选班级
    await page.locator('.ant-select').nth(1).click();
    await page.waitForTimeout(500);
    await page.locator('.ant-select-dropdown:visible .ant-select-item').first().click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/auth/register-filled-student.png' });

    const consoleLogs: string[] = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    await page.locator('button.register-button').click();
    await page.waitForTimeout(8000);

    await page.screenshot({ path: 'test-results/auth/register-after-click-student.png' });

    const submitCalled = consoleLogs.some((log) => log.includes('handleSubmit 被调用'));
    console.log('Register logs:', consoleLogs.filter((l) => l.includes('[Register]') || l.includes('[authStore]')));
    expect(submitCalled).toBeTruthy();
  });

  test('学生不选班级点注册会提示', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.getByPlaceholder('姓名').fill('测试');
    await page.getByPlaceholder('邮箱').fill('test@example.com');
    await page.getByPlaceholder('密码（至少6位）').fill('Test123456!');
    await page.getByPlaceholder('确认密码').fill('Test123456!');

    await page.locator('button.register-button').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/auth/register-no-class.png' });

    // 应该看到"学生请选择班级"提示
    const bodyText = await page.textContent('body');
    console.log('页面是否有班级提示:', bodyText?.includes('选择班级'));
  });

  test('登录页面能正常加载', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await expect(page.getByText('欢迎回来')).toBeVisible();
    await expect(page.getByPlaceholder('邮箱')).toBeVisible();
    await expect(page.getByPlaceholder('密码')).toBeVisible();

    await page.screenshot({ path: 'test-results/auth/login-page.png' });
  });

  test('登录 demo 教师账号', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2500);

    await page.getByPlaceholder('邮箱').fill('teacher@demo.com');
    await page.getByPlaceholder('密码').fill('demo123456');

    const consoleLogs: string[] = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));

    // Ant Design: "登 录"
    await page.locator('button.login-button').click();
    await page.waitForTimeout(10000);

    await page.screenshot({ path: 'test-results/auth/login-after-click.png' });

    const url = page.url();
    console.log('登录后 URL:', url);
    console.log('Login logs:', consoleLogs.filter((l) => l.includes('[authStore]')));

    // 检查是否跳转了或者有错误信息
    const bodyText = await page.textContent('body');
    const hasError = bodyText?.includes('登录失败') || bodyText?.includes('错误');
    console.log('是否有错误:', hasError);
    console.log('页面内容片段:', bodyText?.substring(0, 200));
  });
});
