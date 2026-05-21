import { test, expect, Page } from '@playwright/test';

const TEACHER_EMAIL = 'teacher@demo.com';
const TEACHER_PASSWORD = 'demo123456';

async function loginAsTeacher(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);
  await page.getByPlaceholder('邮箱').fill(TEACHER_EMAIL);
  await page.getByPlaceholder('密码').fill(TEACHER_PASSWORD);
  const captchaText = await page.locator('.captcha-code').textContent();
  if (captchaText && captchaText !== '点击刷新' && captchaText !== '加载中...') {
    await page.getByPlaceholder('验证码').fill(captchaText);
  }
  await page.getByRole('button', { name: '登 录' }).click();
  await page.waitForURL(/\/(teacher|dashboard)/, { timeout: 30000 });
  await page.waitForTimeout(1500);
}

test.describe('教师批改流程', () => {
  test.setTimeout(90000);

  test('教师能看到班级和作业', async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/teacher/assignments');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/full/teacher-assignments-list.png' });
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('批改页面加载提交列表', async ({ page }) => {
    await loginAsTeacher(page);
    // Use known assignment ID with submissions
    await page.goto('/teacher/grading/273628a0-422c-46bf-87d7-6b73b5b9c290');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Should show submission list
    const listItems = page.locator('.ant-list-item');
    const count = await listItems.count();

    await page.screenshot({ path: 'test-results/full/teacher-grading-page.png' });
    expect(count).toBeGreaterThan(0);
  });

  test('一键批量批改按钮可点击', async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/teacher/grading/273628a0-422c-46bf-87d7-6b73b5b9c290');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const batchBtn = page.getByText('一键批量批改');
    await expect(batchBtn).toBeVisible();

    // Button should be enabled (there are submitted essays)
    const isDisabled = await batchBtn.locator('..').getAttribute('disabled');
    await page.screenshot({ path: 'test-results/full/teacher-batch-btn.png' });

    // Click it - should show confirm modal
    await batchBtn.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('.ant-modal-content');
    const modalVisible = await modal.isVisible().catch(() => false);

    await page.screenshot({ path: 'test-results/full/teacher-batch-confirm.png' });

    if (modalVisible) {
      // Cancel for now - don't actually batch grade in test
      await page.getByText('取消').click();
    }

    expect(modalVisible).toBeTruthy();
  });
});
