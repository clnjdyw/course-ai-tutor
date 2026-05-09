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

test.describe('主界面导航 & 页面渲染', () => {

  test.beforeEach(async ({ page }) => {
    await mockLogin(page);
  });

  const pages = [
    { name: '学习规划', path: '/planner', selector: '.planner-container' },
    { name: '智能教学', path: '/tutor', selector: '.container' },
    { name: '实时答疑', path: '/helper', selector: '.helper-container' },
    { name: '学习评估', path: '/evaluator', selector: '.container' },
    { name: 'PK对战', path: '/battle', selector: '.container' },
    { name: '历史记录', path: '/history', selector: '.history-container' },
    { name: '个人中心', path: '/profile', selector: '.container' },
    { name: '学习统计', path: '/statistics', selector: '.container' },
    { name: '成就中心', path: '/achievements', selector: '.container' },
    { name: '我的笔记', path: '/notes', selector: '.container' },
    { name: '错题本', path: '/wrong-questions', selector: '.container' },
    { name: '学习进度', path: '/progress', selector: '.container' },
    { name: '学习提醒', path: '/reminders', selector: '.container' },
    { name: '系统设置', path: '/settings', selector: '.container' },
  ];

  for (const pg of pages) {
    test(`TC11 - 导航到"${pg.name}"页面`, async ({ page }) => {
      await page.goto(pg.path);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      expect(page.url()).toContain(pg.path);
    });
  }

  test('TC12 - 侧边栏菜单高亮当前页面', async ({ page }) => {
    await page.goto('/helper');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    const activeMenu = page.locator('.el-menu-item.is-active');
    await expect(activeMenu).toBeVisible({ timeout: 8000 });
  });

  test('TC13 - 侧边栏包含所有主菜单项', async ({ page }) => {
    const menuItems = page.locator('.el-menu-item');
    const count = await menuItems.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });
});
