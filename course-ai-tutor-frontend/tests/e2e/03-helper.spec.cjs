// @ts-check
const { test, expect } = require('@playwright/test');

async function mockLogin(page) {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('token', 'mock-token-test-12345');
    localStorage.setItem('userId', '1');
    localStorage.setItem('userRole', 'student');
    localStorage.setItem('isLoggedIn', 'true');
  });
  await page.goto('/helper');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
}

/**
 * 测试 3: 实时答疑模块（核心功能）
 * 验证：快捷提问、输入框、提交按钮、清空、图片上传区域、代码调试折叠面板
 */
test.describe('实时答疑模块', () => {

  test.beforeEach(async ({ page }) => {
    await mockLogin(page);
  });

  test('TC14 - 答疑页面正确渲染', async ({ page }) => {
    await expect(page.locator('.helper-container')).toBeVisible();
    await expect(page.locator('h2')).toContainText('实时答疑');
  });

  test('TC15 - 快捷提问标签存在且可点击', async ({ page }) => {
    const tags = page.locator('.quick-tag');
    const count = await tags.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // 点击第一个快捷问题应填入输入框
    const firstTag = page.locator('.quick-tag').first();
    const tagText = await firstTag.textContent();
    await firstTag.click();
    // 等待一小段时间让点击生效
    await page.waitForTimeout(300);
    const inputValue = await page.locator('.question-input textarea').inputValue();
    expect(inputValue).toContain(tagText.trim());
  });

  test('TC16 - 输入框存在且可输入', async ({ page }) => {
    const textarea = page.locator('.question-input textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('什么是依赖注入？');
    const value = await textarea.inputValue();
    expect(value).toBe('什么是依赖注入？');
  });

  test('TC17 - 清空按钮功能', async ({ page }) => {
    const textarea = page.locator('.question-input textarea');
    await textarea.fill('测试内容');
    await page.getByText('清空').click();
    await page.waitForTimeout(300);
    const value = await textarea.inputValue();
    expect(value).toBe('');
  });

  test('TC18 - 上传图片按钮存在', async ({ page }) => {
    await expect(page.getByText('上传图片')).toBeVisible();
  });

  test('TC19 - 提交问题按钮存在且默认启用', async ({ page }) => {
    const btn = page.getByText('提交问题');
    await expect(btn).toBeVisible();
    await expect(btn).not.toBeDisabled();
  });

  test('TC20 - 空提交应显示提示', async ({ page }) => {
    await page.getByText('提交问题').click();
    // 等待 Element Plus 消息
    await page.waitForTimeout(1000);
    // 应显示警告消息
    const messages = page.locator('.el-message');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC21 - 代码调试折叠面板', async ({ page }) => {
    // 展开代码调试面板
    await page.getByText('代码调试').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.debug-section')).toBeVisible();
    // 检查代码输入框
    await expect(page.locator('.code-input textarea')).toBeVisible();
  });

  test('TC22 - 快捷问题内容正确', async ({ page }) => {
    const expectedQuestions = [
      '什么是依赖注入？',
      'Spring Boot 自动配置原理',
      '如何理解 MVC 模式？',
    ];
    const tags = page.locator('.quick-tag');
    for (let i = 0; i < expectedQuestions.length; i++) {
      await expect(tags.nth(i)).toContainText(expectedQuestions[i]);
    }
  });
});
