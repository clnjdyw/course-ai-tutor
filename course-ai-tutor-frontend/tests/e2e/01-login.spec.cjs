// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 测试 1: 登录/注册页
 * 验证页面渲染、表单验证、角色选择、管理员入口
 *
 * 注意: Element Plus tab 使用 v-show，两个 tab 的输入框都在 DOM 中。
 * 必须通过 tabpanel 作用域来定位到可见的输入框。
 */
test.describe('登录注册模块', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  // 获取登录/注册 tabpanel 作用域
  const loginPanel = (page) => page.getByRole('tabpanel', { name: '登录' });
  const registerPanel = (page) => page.getByRole('tabpanel', { name: '注册' });

  test('TC01 - 登录页正确渲染核心元素', async ({ page }) => {
    await expect(page.locator('.app-title')).toHaveText('课程辅导 AI');
    await expect(page.locator('.app-subtitle')).toHaveText('智能学习伙伴');
    await expect(page.locator('.login-tabs')).toBeVisible();
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
  });

  test('TC02 - 切换到注册标签页', async ({ page }) => {
    await page.getByRole('tab', { name: '注册' }).click();
    await expect(page.getByRole('button', { name: '注册' })).toBeVisible();
    await expect(page.locator('input[placeholder*="邮箱"]')).toBeVisible();
  });

  test('TC03 - 登录表单验证：空字段', async ({ page }) => {
    await page.getByRole('button', { name: '登录' }).click();
    await expect(loginPanel(page).locator('.el-form-item__error').first()).toBeVisible();
  });

  test('TC04 - 登录表单验证：密码少于 6 位', async ({ page }) => {
    await loginPanel(page).locator('input[placeholder="请输入用户名"]').fill('testuser');
    await loginPanel(page).locator('input[placeholder="请输入密码"]').fill('123');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(loginPanel(page).locator('.el-form-item__error')).toBeVisible();
  });

  test('TC05 - 注册表单验证：邮箱格式错误', async ({ page }) => {
    await page.getByRole('tab', { name: '注册' }).click();
    await registerPanel(page).locator('input[placeholder="请输入用户名（3-20 位）"]').fill('testuser');
    await registerPanel(page).locator('input[placeholder="请输入邮箱"]').fill('invalid-email');
    await registerPanel(page).locator('input[placeholder="请输入密码（至少 6 位）"]').fill('123456');
    await registerPanel(page).locator('input[placeholder="请确认密码"]').fill('123456');
    await page.getByRole('button', { name: '注册' }).click();
    await page.waitForTimeout(500);
    const emailError = registerPanel(page).locator('.el-form-item__error');
    const count = await emailError.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC06 - 注册表单验证：密码不一致', async ({ page }) => {
    await page.getByRole('tab', { name: '注册' }).click();
    await registerPanel(page).locator('input[placeholder="请输入用户名（3-20 位）"]').fill('testuser');
    await registerPanel(page).locator('input[placeholder="请输入邮箱"]').fill('test@example.com');
    await registerPanel(page).locator('input[placeholder="请输入密码（至少 6 位）"]').fill('123456');
    await registerPanel(page).locator('input[placeholder="请确认密码"]').fill('654321');
    await page.getByRole('button', { name: '注册' }).click();
    await page.waitForTimeout(500);
    const errors = registerPanel(page).locator('.el-form-item__error');
    const count = await errors.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC07 - 角色选择：学生/教师切换', async ({ page }) => {
    // 只检查登录 tab 的角色选择
    await expect(loginPanel(page).locator('.el-radio-button.is-active')).toContainText('学生');
    // 点击可见的 label span，不是隐藏的 radio input
    await loginPanel(page).locator('.el-radio-button__inner').filter({ hasText: '教师' }).click();
    await expect(loginPanel(page).locator('.el-radio-button.is-active')).toContainText('教师');
  });

  test('TC08 - 教师注册时显示额外字段', async ({ page }) => {
    await page.getByRole('tab', { name: '注册' }).click();
    // 点击可见的 label span
    await registerPanel(page).locator('.el-radio-button__inner').filter({ hasText: '教师' }).click();
    await expect(registerPanel(page).locator('input[placeholder="请输入教师编号"]')).toBeVisible();
    await expect(registerPanel(page).locator('input[placeholder="请输入教学科目，如：计算机科学"]')).toBeVisible();
  });

  test('TC09 - 管理员入口可点击', async ({ page }) => {
    await loginPanel(page).getByText('管理员入口').click();
    await expect(page.locator('.el-message')).toContainText('管理员');
  });

  test('TC10 - 学生注册字段', async ({ page }) => {
    await page.getByRole('tab', { name: '注册' }).click();
    await expect(registerPanel(page).locator('input[placeholder="请输入教师编号"]')).not.toBeVisible();
  });
});
