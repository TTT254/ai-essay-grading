import { test, expect } from '@playwright/test';

async function login(page: any, email: string, password: string) {
  await page.goto('http://localhost:5173/login');
  await page.waitForSelector('.captcha-code', { timeout: 5000 });
  const captchaText = await page.locator('.captcha-code').textContent();
  expect(captchaText).toBeTruthy();
  await page.fill('input[placeholder="邮箱"]', email);
  await page.fill('input[placeholder="密码"]', password);
  await page.fill('input[placeholder="验证码"]', captchaText!);
  await page.click('button[type="submit"]');
}

test.describe('教师登录验证', () => {
  test('教师1: 李老师登录成功', async ({ page }) => {
    await login(page, '1806874707@qq.com', 'Test123456!');
    await page.waitForURL(/\/teacher/, { timeout: 10000 });

    // 验证跳转到教师端
    expect(page.url()).toContain('/teacher');

    // 验证页面基本元素
    await expect(page.locator('body')).toContainText('AI作文批改');

    // 截图保存
    await page.screenshot({ path: 'test-results/teacher1-login.png', fullPage: true });
  });

  test('教师1: 查看班级管理', async ({ page }) => {
    await login(page, '1806874707@qq.com', 'Test123456!');
    await page.waitForURL(/\/teacher/, { timeout: 10000 });

    await page.goto('http://localhost:5173/teacher/classes');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/teacher1-classes.png', fullPage: true });

    // 验证有班级数据
    await expect(page.locator('body')).toContainText('班级');
  });

  test('教师1: 查看作业管理', async ({ page }) => {
    await login(page, '1806874707@qq.com', 'Test123456!');
    await page.waitForURL(/\/teacher/, { timeout: 10000 });

    await page.goto('http://localhost:5173/teacher/assignments');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/teacher1-assignments.png', fullPage: true });

    await expect(page.locator('body')).toContainText('作业');
  });

  test('教师1: 查看数据看板', async ({ page }) => {
    await login(page, '1806874707@qq.com', 'Test123456!');
    await page.waitForURL(/\/teacher/, { timeout: 10000 });

    await page.goto('http://localhost:5173/teacher/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/teacher1-dashboard.png', fullPage: true });
  });

  test('教师2: 王老师登录成功', async ({ page }) => {
    await login(page, 'teacher2@example.com', 'Teacher123!');
    await page.waitForURL(/\/teacher/, { timeout: 10000 });

    expect(page.url()).toContain('/teacher');
    await expect(page.locator('body')).toContainText('AI作文批改');

    await page.screenshot({ path: 'test-results/teacher2-login.png', fullPage: true });
  });
});
