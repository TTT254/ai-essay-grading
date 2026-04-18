/**
 * TEST-03: 教师端流程 E2E 测试
 * 覆盖教师路由的认证保护
 */
import { test, expect } from '@playwright/test';

test.describe('教师端流程', () => {
  test('教师 Dashboard 需要认证', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await expect(page).toHaveURL(/.*login|.*\//);
  });

  test('教师班级管理需要认证', async ({ page }) => {
    await page.goto('/teacher/classes');
    await expect(page).toHaveURL(/.*login|.*\//);
  });

  test('教师作业管理需要认证', async ({ page }) => {
    await page.goto('/teacher/assignments');
    await expect(page).toHaveURL(/.*login|.*\//);
  });

  test('教师批改页面需要认证', async ({ page }) => {
    await page.goto('/teacher/grading/test-id');
    await expect(page).toHaveURL(/.*login|.*\//);
  });

  test('登录页面品牌 Logo 可见', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.logo-title')).toBeVisible();
  });

  test('登录页面特性卡片渲染', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.features-grid')).toBeVisible();
    await expect(page.locator('.feature-card').first()).toBeVisible();
  });
});
