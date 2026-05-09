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
  await page.goto('/planner');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
}

/**
 * 测试 4: 学习规划模块
 */
test.describe('学习规划模块', () => {

  test.beforeEach(async ({ page }) => {
    await mockLogin(page);
  });

  test('TC23 - 规划页面正确渲染', async ({ page }) => {
    await expect(page.locator('.planner-container')).toBeVisible();
    await expect(page.locator('h2')).toContainText('学习冒险地图');
  });

  test('TC24 - 表单字段全部存在', async ({ page }) => {
    await expect(page.locator('textarea[placeholder*="学习目标"]')).toBeVisible();
    await expect(page.locator('.el-select')).toBeVisible(); // 当前等级
    await expect(page.locator('input[placeholder*="每天"]')).toBeVisible(); // 每日能量
    await expect(page.locator('input[placeholder*="实践"]')).toBeVisible(); // 特殊技能
  });

  test('TC25 - 生成按钮存在', async ({ page }) => {
    const btn = page.getByRole('button', { name: /生成冒险地图/ });
    await expect(btn).toBeVisible();
  });

  test('TC26 - 空目标点击生成', async ({ page }) => {
    await page.getByRole('button', { name: /生成冒险地图/ }).click();
    await page.waitForTimeout(1000);
    const messages = page.locator('.el-message');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC27 - 清空按钮存在', async ({ page }) => {
    await expect(page.getByRole('button', { name: /清空/ })).toBeVisible();
  });

  test('TC28 - 等级下拉框可展开', async ({ page }) => {
    const select = page.locator('.el-select').first();
    await select.click();
    await page.waitForTimeout(500);
    // 下拉选项应出现
    await expect(page.locator('.el-select-dropdown')).toBeVisible();
  });
});
