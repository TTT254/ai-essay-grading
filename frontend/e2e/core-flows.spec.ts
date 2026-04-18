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

test.describe('核心流程自动化验证', () => {
  test('学生端：登录后查看作文任务列表', async ({ page }) => {
    await login(page, 'test_student1@example.com', 'Test123456!');
    await page.waitForURL(/\/student/, { timeout: 10000 });

    // 验证任务列表页面加载
    await expect(page.locator('body')).toContainText('AI作文批改');
    await expect(page.locator('body')).toContainText('作文任务');
  });

  test('学生端：查看历史提交记录', async ({ page }) => {
    await login(page, 'test_student1@example.com', 'Test123456!');
    await page.waitForURL(/\/student/, { timeout: 10000 });

    await page.goto('http://localhost:5173/student/history');
    await expect(page.locator('body')).toContainText('提交历史');
  });

  test('教师端：登录后查看班级管理', async ({ page }) => {
    await login(page, 'test_teacher@example.com', 'Test123456!');
    await page.waitForURL(/\/teacher/, { timeout: 10000 });

    await expect(page.locator('body')).toContainText('AI作文批改');
    await expect(page.locator('body')).toContainText('班级管理');
  });

  test('教师端：查看作业管理', async ({ page }) => {
    await login(page, 'test_teacher@example.com', 'Test123456!');
    await page.waitForURL(/\/teacher/, { timeout: 10000 });

    await page.goto('http://localhost:5173/teacher/assignments');
    await expect(page.locator('body')).toContainText('作业管理');
  });
});
