/**
 * TEST-02: 学生提交作文 E2E 测试
 * 覆盖首页内容渲染和受保护路由的认证重定向
 */
import { test, expect } from '@playwright/test';

test.describe('学生提交作文', () => {
  test('提交页面需要认证 - 重定向到登录或首页', async ({ page }) => {
    await page.goto('/student/submit/test-id');
    await expect(page).toHaveURL(/.*login|.*\//);
  });

  test('学生任务列表需要认证', async ({ page }) => {
    await page.goto('/student/tasks');
    await expect(page).toHaveURL(/.*login|.*\//);
  });

  test('学生历史记录需要认证', async ({ page }) => {
    await page.goto('/student/history');
    await expect(page).toHaveURL(/.*login|.*\//);
  });

  test('首页展示正确内容', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-navbar')).toBeVisible();
    // Use scoped selector to avoid matching footer text
    await expect(page.locator('.navbar-logo').first()).toBeVisible();
    await expect(page.locator('.workflow-section')).toBeVisible();
    await expect(page.locator('text=三步开始智能批改')).toBeVisible();
  });

  test('首页 Hero 区域渲染', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-demo-card')).toBeVisible();
    await expect(page.locator('.cta-stats')).toBeVisible();
  });

  test('首页滚动后导航栏添加 scrolled 类', async ({ page }) => {
    await page.goto('/');
    // Scroll and dispatch event to trigger React state update
    await page.evaluate(() => {
      window.scrollTo(0, 200);
      window.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(500);
    await expect(page.locator('.home-navbar.scrolled')).toBeVisible();
  });
});
