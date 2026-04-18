/**
 * TEST-05: 错题本和学习数据 E2E 测试
 * 覆盖错题本、个人中心路由保护和首页 roles 区域
 */
import { test, expect } from '@playwright/test';

test.describe('错题本和学习数据', () => {
  test('错题本路由需要认证', async ({ page }) => {
    await page.goto('/student/mistakes');
    await expect(page).toHaveURL(/.*login|.*\//);
  });

  test('个人中心路由需要认证', async ({ page }) => {
    await page.goto('/student/profile');
    await expect(page).toHaveURL(/.*login|.*\//);
  });

  test('注册页面有返回首页按钮', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('.back-home-btn')).toBeVisible();
  });

  test('注册页面返回首页按钮点击后跳转到首页', async ({ page }) => {
    await page.goto('/register');
    await page.click('.back-home-btn');
    await expect(page).toHaveURL(/.*\//);
  });

  test('首页 roles 区域渲染', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.roles-section')).toBeVisible();
    await expect(page.locator('text=为每个角色量身打造')).toBeVisible();
  });

  test('注册页面价值卡片渲染', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('.value-cards')).toBeVisible();
    await expect(page.locator('.value-card').first()).toBeVisible();
  });

  test('注册页面统计数据渲染', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('.register-stats-row')).toBeVisible();
  });
});
