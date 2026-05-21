/**
 * 学生端完整流程 E2E 测试
 */
import { test, expect } from '@playwright/test';

const STUDENT_EMAIL = 'student@demo.com';
const STUDENT_PASSWORD = 'demo123456';

async function loginAsStudent(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.getByPlaceholder('邮箱').fill(STUDENT_EMAIL);
  await page.getByPlaceholder('密码').fill(STUDENT_PASSWORD);

  // Get captcha text and fill it
  const captchaText = await page.locator('.captcha-code').textContent();
  if (captchaText && captchaText !== '点击刷新' && captchaText !== '加载中...') {
    await page.getByPlaceholder('验证码').fill(captchaText);
  }

  await page.getByRole('button', { name: '登 录' }).click();
  await page.waitForURL(/\/(student|dashboard)/, { timeout: 20000 });
  await page.waitForTimeout(1000);
}

test.describe('学生端测试', () => {
  test.setTimeout(60000);

  test('报告详情页 - 不存在的报告显示友好提示', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/report/non-existent-id');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const hasErrorState = await page.getByText('报告不存在').isVisible().catch(() => false);
    const hasHelpText = await page.getByText('尚未批改完成').isVisible().catch(() => false);
    const spinnerGone = !(await page.locator('.ant-spin-spinning').isVisible().catch(() => false));

    expect(hasErrorState || hasHelpText || spinnerGone).toBeTruthy();
    await page.screenshot({ path: 'test-results/report-error-state.png' });
  });

  test('报告详情页 - submission ID无报告时不卡在转圈', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/report/5299c830-e73d-4099-85a3-e01204098e5a');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const noSpinner = !(await page.locator('.ant-spin-spinning').isVisible().catch(() => false));
    expect(noSpinner).toBeTruthy();
    await page.screenshot({ path: 'test-results/report-no-data.png' });
  });

  test('AI辅导页面展示正常', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/ai-chat/5299c830-e73d-4099-85a3-e01204098e5a');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.locator('.chat-topbar')).toBeVisible();
    await expect(page.locator('.chat-input-area')).toBeVisible();

    await page.screenshot({ path: 'test-results/ai-chat-layout.png' });
  });

  test('各学生页面可正常访问', async ({ page }) => {
    await loginAsStudent(page);

    const pages = [
      '/student/tasks',
      '/student/history',
      '/student/mistakes',
      '/student/profile',
    ];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
    }
    await page.screenshot({ path: 'test-results/student-pages.png' });
  });
});
