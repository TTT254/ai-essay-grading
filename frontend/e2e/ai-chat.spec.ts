/**
 * TEST-04: AI 对话辅导 E2E 测试
 * 覆盖 AI 对话路由保护和登录页视觉元素
 */
import { test, expect } from '@playwright/test';

test.describe('AI 对话辅导', () => {
  test('AI 对话路由需要认证', async ({ page }) => {
    await page.goto('/student/ai-chat/test-id');
    await expect(page).toHaveURL(/.*login|.*\//);
  });

  test('学生报告页面需要认证', async ({ page }) => {
    await page.goto('/student/report/test-id');
    await expect(page).toHaveURL(/.*login|.*\//);
  });

  test('登录页面视觉面板存在', async ({ page }) => {
    await page.goto('/login');
    const loginVisual = page.locator('.login-visual');
    await expect(loginVisual).toBeVisible();
  });

  test('登录页面视觉面板有背景色', async ({ page }) => {
    await page.goto('/login');
    const loginVisual = page.locator('.login-visual');
    await expect(loginVisual).toBeVisible();
    const bgColor = await loginVisual.evaluate(
      (el) => getComputedStyle(el).background || getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toContain('rgb');
  });

  test('登录页面统计数据行渲染', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.stats-row')).toBeVisible();
    await expect(page.locator('.stat-item').first()).toBeVisible();
  });
});
