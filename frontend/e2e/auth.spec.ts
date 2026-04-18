/**
 * TEST-01: 认证流程 E2E 测试
 * 覆盖登录页、注册页的渲染和基础交互
 */
import { test, expect } from '@playwright/test';

test.describe('认证流程', () => {
  test('登录页面正确渲染', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.login-visual')).toBeVisible();
    await expect(page.locator('.login-form-section')).toBeVisible();
  });

  test('登录表单包含必要输入字段', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Email/username input (Ant Design renders as text input)
    await expect(page.locator('.ant-input').first()).toBeVisible();
  });

  test('登录表单验证 - 空字段提交', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    // Ant Design shows validation error messages
    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible();
  });

  test('登录页面有验证码区域', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.captcha-code')).toBeVisible();
  });

  test('注册页面正确渲染', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('.register-container')).toBeVisible();
    await expect(page.locator('.register-visual')).toBeVisible();
    await expect(page.locator('.register-form-section')).toBeVisible();
  });

  test('注册表单 - 学生角色默认选中并显示年级选择', async ({ page }) => {
    await page.goto('/register');
    // Student role is default (initialValues={{ role: 'student' }})
    await expect(page.locator('text=年级').first()).toBeVisible();
  });

  test('首页导航到登录', async ({ page }) => {
    await page.goto('/');
    await page.click('text=登录');
    await expect(page).toHaveURL(/.*login/);
  });

  test('首页导航到注册', async ({ page }) => {
    await page.goto('/');
    // Click the primary CTA "免费注册" button
    await page.locator('.cta-primary').first().click();
    await expect(page).toHaveURL(/.*register/);
  });
});
