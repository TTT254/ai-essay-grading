import { test, expect } from '@playwright/test';

test.describe('学生端登录流程自动化验证', () => {
  test('test_student1@example.com / Test123456! 登录成功', async ({ page }) => {
    // 1. 访问登录页
    await page.goto('http://localhost:5173/login');
    await expect(page).toHaveURL(/\/login/);

    // 2. 等待验证码加载
    await page.waitForSelector('.captcha-code', { timeout: 5000 });
    const captchaText = await page.locator('.captcha-code').textContent();
    expect(captchaText).toBeTruthy();
    expect(captchaText!.length).toBeGreaterThanOrEqual(4);

    // 3. 填写表单
    await page.fill('input[placeholder="邮箱"]', 'test_student1@example.com');
    await page.fill('input[placeholder="密码"]', 'Test123456!');
    await page.fill('input[placeholder="验证码"]', captchaText!);

    // 4. 点击登录
    await page.click('button[type="submit"]');

    // 5. 验证跳转（学生端 dashboard 或班级选择）
    await page.waitForURL(/\/(student\/tasks|student\/select-class)/, { timeout: 10000 });

    // 6. 验证页面包含学生端特征
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('AI作文批改');
  });

  test('教师账号 test_teacher@example.com / Test123456! 登录成功', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await page.waitForSelector('.captcha-code', { timeout: 5000 });
    const captchaText = await page.locator('.captcha-code').textContent();
    expect(captchaText).toBeTruthy();
    expect(captchaText!.length).toBeGreaterThanOrEqual(4);

    await page.fill('input[placeholder="邮箱"]', 'test_teacher@example.com');
    await page.fill('input[placeholder="密码"]', 'Test123456!');
    await page.fill('input[placeholder="验证码"]', captchaText!);

    await page.click('button[type="submit"]');

    await page.waitForURL(/\/teacher/, { timeout: 10000 });

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('AI作文批改');
  });
});
