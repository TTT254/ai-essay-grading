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

test.describe('Bug 修复验证', () => {
  test('Bug1: 在线编辑页面正常显示（TipTap编辑器）', async ({ page }) => {
    await login(page, 'test_student1@example.com', 'Test123456!');

    // 登录后跳转到提交页面（直接 URL 不经过登录检查）
    await page.goto('http://localhost:5173/student/submit/00000000-0000-0000-0003-000000000001');
    await page.waitForURL(/submit/, { timeout: 8000 });

    // 点击"在线编辑"标签
    await page.click('div[role="tab"]:has-text("在线编辑")');

    // 等待 TipTap 编辑器加载（ProseMirror 容器）
    await page.waitForSelector('.ProseMirror', { timeout: 8000 });

    // 验证编辑器存在且可交互
    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible();

    // 验证编辑器可输入
    await editor.click();
    await page.keyboard.type('这是一篇测试作文。');

    const editorContent = await editor.textContent();
    expect(editorContent).toContain('这是一篇测试作文');
  });

  test('Bug2: AI辅导页面发送消息能看到回复', async ({ page }) => {
    await login(page, 'test_student1@example.com', 'Test123456!');

    // 直接访问 AI 辅导页面（用一个有批改报告的 submissionId）
    await page.goto('http://localhost:5173/student/ai-chat/00000000-0000-0000-0004-000000000001');
    await page.waitForURL(/ai-chat/, { timeout: 5000 });

    // 验证页面加载成功
    await expect(page.locator('body')).toContainText('AI写作辅导');

    // 发送一条测试消息
    await page.fill('.chat-textarea', '这篇作文有哪些优点？');
    await page.click('.chat-send-btn');

    // 等待 AI 回复气泡出现（loading 消失 + 有 assistant 消息）
    await page.waitForSelector('.chat-message.assistant', { timeout: 15000 });

    const aiMessages = await page.locator('.chat-message.assistant').count();
    expect(aiMessages).toBeGreaterThan(0);

    // 验证回复不为空
    const lastAiBubble = page.locator('.chat-message.assistant').last().locator('.chat-bubble');
    await expect(lastAiBubble).not.toHaveText('');
    const replyText = await lastAiBubble.textContent();
    expect(replyText!.length).toBeGreaterThan(5);
  });
});
