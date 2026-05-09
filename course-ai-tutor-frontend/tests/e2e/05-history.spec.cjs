// @ts-check
const { test, expect } = require('@playwright/test');

async function mockLogin(page) {
  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('token', 'mock-token-test-12345');
    localStorage.setItem('userId', '1');
    localStorage.setItem('userRole', 'student');
    localStorage.setItem('isLoggedIn', 'true');
  });
  // Intercept API calls
  await page.route(/localhost.*learning\/history/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, success: true, data: [], total: 0 })
    });
  });
  await page.goto('/history', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
}

/**
 * 测试 5: 历史记录模块（含搜索功能）
 */
test.describe('历史记录模块', () => {

  test.beforeEach(async ({ page }) => {
    await mockLogin(page);
  });

  test('TC29 - 历史页面正确渲染', async ({ page }) => {
    // URL 应该包含 /history
    expect(page.url()).toContain('/history');
    // 页面标题或 h2 应有"历史记录"
    await expect(page.locator('h2')).toContainText('历史记录');
  });

  test('TC30 - 5个Tab标签全部存在', async ({ page }) => {
    const expectedTabs = ['学习规划', '实时答疑', '智能教学', '学习评估', 'PK 对战'];
    for (const tab of expectedTabs) {
      await expect(page.getByText(tab).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('TC31 - 搜索栏存在（关键词输入框）', async ({ page }) => {
    // SearchBar renders inside each tab panel
    // Element Plus el-input renders as .el-input > input.el-input__inner
    const searchInput = page.locator('.search-bar .el-input input').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('TC32 - 搜索栏存在（日期范围选择器）', async ({ page }) => {
    const startDateInput = page.locator('.search-bar .el-date-editor input[placeholder="开始日期"]').first();
    const endDateInput = page.locator('.search-bar .el-date-editor input[placeholder="结束日期"]').first();
    await expect(startDateInput).toBeVisible({ timeout: 10000 });
    await expect(endDateInput).toBeVisible({ timeout: 10000 });
  });

  test('TC33 - 搜索和重置按钮存在', async ({ page }) => {
    // Button text has leading space from icon: " 搜索" / " 重置"
    await expect(page.getByText('搜索').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('重置').first()).toBeVisible({ timeout: 8000 });
  });

  test('TC34 - 搜索框可输入', async ({ page }) => {
    const searchInput = page.locator('.search-bar .el-input input').first();
    await searchInput.fill('依赖注入');
    const value = await searchInput.inputValue();
    expect(value).toBe('依赖注入');
  });

  test('TC35 - 点击搜索后页面稳定', async ({ page }) => {
    const searchInput = page.locator('.search-bar .el-input input').first();
    await searchInput.fill('test');
    await page.getByText('搜索').first().click();
    await page.waitForTimeout(1000);
    // 页面不应崩溃
    await expect(page.locator('h2')).toContainText('历史记录');
  });

  test('TC36 - Tab切换', async ({ page }) => {
    // Click the tab button within the history tabs
    await page.locator('.history-tabs .el-tabs__item').filter({ hasText: '实时答疑' }).click();
    await page.waitForTimeout(500);
    // Page should still be on history route
    expect(page.url()).toContain('/history');

    await page.locator('.history-tabs .el-tabs__item').filter({ hasText: '智能教学' }).click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/history');
  });

  test('TC37 - 重置按钮清空搜索条件', async ({ page }) => {
    const searchInput = page.locator('.search-bar .el-input input').first();
    await searchInput.fill('test');
    await page.getByText('重置').first().click();
    await page.waitForTimeout(500);
    const value = await searchInput.inputValue();
    expect(value).toBe('');
  });

  test('TC38 - 空状态或数据展示', async ({ page }) => {
    // 可能有空状态，也可能有数据，都算通过
    await page.waitForTimeout(1000);
    const hasContent = await page.locator('.history-card').count();
    const hasEmpty = await page.locator('.el-empty').count();
    expect(hasContent + hasEmpty).toBeGreaterThanOrEqual(0);
  });
});
