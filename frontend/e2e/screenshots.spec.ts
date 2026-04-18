import { test } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCREENSHOT_DIR = resolve(__dirname, '../../docs/screenshots');

async function loginTeacher(page: any) {
  await page.goto('http://localhost:5173/login');
  await page.waitForSelector('.captcha-code', { timeout: 5000 });
  const captcha = await page.locator('.captcha-code').textContent();
  await page.fill('input[placeholder="邮箱"]', '1806874707@qq.com');
  await page.fill('input[placeholder="密码"]', 'Test123456!');
  await page.fill('input[placeholder="验证码"]', captcha!);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/teacher/, { timeout: 15000 });
}

async function loginStudent(page: any) {
  await page.goto('http://localhost:5173/login');
  await page.waitForSelector('.captcha-code', { timeout: 5000 });
  const captcha = await page.locator('.captcha-code').textContent();
  await page.fill('input[placeholder="邮箱"]', 'student001@example.com');
  await page.fill('input[placeholder="密码"]', 'Student123!');
  await page.fill('input[placeholder="验证码"]', captcha!);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/student/, { timeout: 15000 });
}

test.describe('截图生成', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  // === 公共页面 ===
  test('01-首页', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-home.png`, fullPage: true });
  });

  test('02-登录页', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-login.png`, fullPage: true });
  });

  test('03-注册页', async ({ page }) => {
    await page.goto('http://localhost:5173/register');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-register.png`, fullPage: true });
  });

  // === 教师端 ===
  test('04-教师-班级管理', async ({ page }) => {
    await loginTeacher(page);
    await page.goto('http://localhost:5173/teacher/classes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-teacher-classes.png`, fullPage: true });
  });

  test('05-教师-作业管理', async ({ page }) => {
    await loginTeacher(page);
    await page.goto('http://localhost:5173/teacher/assignments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-teacher-assignments.png`, fullPage: true });
  });

  test('06-教师-数据看板', async ({ page }) => {
    await loginTeacher(page);
    await page.goto('http://localhost:5173/teacher/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-teacher-dashboard.png`, fullPage: true });
  });

  // === 学生端 ===
  test('07-学生-任务列表', async ({ page }) => {
    await loginStudent(page);
    await page.goto('http://localhost:5173/student/tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-student-tasks.png`, fullPage: true });
  });

  test('08-学生-提交作文', async ({ page }) => {
    await loginStudent(page);
    await page.goto('http://localhost:5173/student/tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    // 尝试点击第一个作业的"开始写作"按钮
    const btn = page.locator('button:has-text("开始写作"), a:has-text("开始写作")').first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-student-submit.png`, fullPage: true });
  });

  test('09-学生-历史记录', async ({ page }) => {
    await loginStudent(page);
    await page.goto('http://localhost:5173/student/history');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-student-history.png`, fullPage: true });
  });

  test('10-学生-错题本', async ({ page }) => {
    await loginStudent(page);
    await page.goto('http://localhost:5173/student/mistakes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-student-mistakes.png`, fullPage: true });
  });

  test('11-学生-个人中心', async ({ page }) => {
    await loginStudent(page);
    await page.goto('http://localhost:5173/student/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-student-profile.png`, fullPage: true });
  });
});
