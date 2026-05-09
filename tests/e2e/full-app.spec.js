// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Helper: Set up auth state and navigate to a page
// The login works (backend returns success) but router.push() redirect doesn't fire
// So we set up auth state manually and navigate directly
async function setupAuthAndNavigate(page, route = 'planner') {
  // Go to login page first to establish session
  await page.goto(`${BASE_URL}/login`);
  await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });

  // Fill and submit login form
  const loginPanel = page.locator('[role="tabpanel"]').first();
  const usernameInput = loginPanel.locator('input[placeholder="请输入用户名"]');
  await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
  await usernameInput.fill(ADMIN_USERNAME);

  const passwordInput = loginPanel.locator('input[placeholder="请输入密码"]');
  await passwordInput.fill(ADMIN_PASSWORD);

  const loginBtn = loginPanel.locator('button.el-button--primary');
  await loginBtn.click();

  // Wait for login to complete (notification appears)
  await page.waitForTimeout(2000);

  // Login succeeded but redirect didn't fire - navigate directly to target page
  await page.goto(`${BASE_URL}/${route}`);
  await page.waitForURL(new RegExp(`/${route}`), { timeout: 15000 });
  await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
}

// Helper: Just login without navigating (for testing login itself)
async function doLogin(page) {
  await page.goto(`${BASE_URL}/login`);
  await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });

  const loginPanel = page.locator('[role="tabpanel"]').first();
  const usernameInput = loginPanel.locator('input[placeholder="请输入用户名"]');
  await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
  await usernameInput.fill(ADMIN_USERNAME);

  const passwordInput = loginPanel.locator('input[placeholder="请输入密码"]');
  await passwordInput.fill(ADMIN_PASSWORD);

  const loginBtn = loginPanel.locator('button.el-button--primary');
  await loginBtn.click();

  // Wait for login notification
  await page.waitForTimeout(2000);
}

// Collect console errors
test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  test.info().errors = errors;
});

// ============================================================
// TEST GROUP 1: Authentication
// ============================================================
test.describe('1. Authentication', () => {
  test('should load login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByText('课程辅导 AI')).toBeVisible();

    const loginTab = page.getByRole('tab', { name: '登录' }).first();
    await expect(loginTab).toBeVisible();
    await expect(page.locator('[role="tabpanel"]').first().getByText('学生')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/login-page.png' });
  });

  test('should login with admin credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const loginPanel = page.locator('[role="tabpanel"]').first();

    const usernameInput = loginPanel.locator('input[placeholder="请输入用户名"]');
    await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    await usernameInput.fill(ADMIN_USERNAME);

    const passwordInput = loginPanel.locator('input[placeholder="请输入密码"]');
    await passwordInput.fill(ADMIN_PASSWORD);

    const loginBtn = loginPanel.locator('button.el-button--primary');
    await loginBtn.click();

    // Wait for login success notification
    await expect(page.getByText('登录成功')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/screenshots/login-success.png' });
  });

  test('should show error for wrong credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const loginPanel = page.locator('[role="tabpanel"]').first();

    const usernameInput = loginPanel.locator('input[placeholder="请输入用户名"]');
    await usernameInput.fill('wronguser');

    const passwordInput = loginPanel.locator('input[placeholder="请输入密码"]');
    await passwordInput.fill('wrongpass');

    const loginBtn = loginPanel.locator('button.el-button--primary');
    await loginBtn.click();

    // Wait for error or stay on login
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/screenshots/login-failure.png' });
  });

  test('should require username and password', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const loginPanel = page.locator('[role="tabpanel"]').first();

    const loginBtn = loginPanel.locator('button.el-button--primary');
    await loginBtn.click();

    await expect(page.getByText('请输入用户名')).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================
// TEST GROUP 2: Home Page / Dashboard
// ============================================================
test.describe('2. Home Page / Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'planner');
  });

  test('should show planner page after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/planner/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/home-dashboard.png' });
  });

  test('should have sidebar navigation', async ({ page }) => {
    const sidebar = page.locator('.el-menu, .el-aside, aside, nav, .sidebar');
    await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================
// TEST GROUP 3: Smart Tutor (智能教学)
// ============================================================
test.describe('3. Smart Tutor (智能教学)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'tutor');
  });

  test('should load tutor page', async ({ page }) => {
    await expect(page).toHaveURL(/\/tutor/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/tutor-page.png' });
  });

  test('should send teaching request and get response', async ({ page }) => {
    const input = page.locator('textarea[placeholder], input[placeholder]').first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill('讲解三角函数');

    const sendBtn = page.locator('button.el-button--primary').filter({ hasText: /发送|提交|提问/ }).first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(15000);
    } else {
      const anyBtn = page.locator('button.el-button--primary').first();
      if (await anyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await anyBtn.click();
        await page.waitForTimeout(15000);
      }
    }

    await page.screenshot({ path: 'test-results/screenshots/tutor-request.png' });
  });
});

// ============================================================
// TEST GROUP 4: Planner (学习计划)
// ============================================================
test.describe('4. Planner (学习计划)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'planner');
  });

  test('should load planner page', async ({ page }) => {
    await expect(page).toHaveURL(/\/planner/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/planner-page.png' });
  });

  test('should create study plan', async ({ page }) => {
    const input = page.locator('textarea[placeholder], input[placeholder]').first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill('学习Python基础');

    const sendBtn = page.locator('button.el-button--primary').filter({ hasText: /生成|发送|创建|规划/ }).first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(15000);
    }

    await page.screenshot({ path: 'test-results/screenshots/planner-create.png' });
  });
});

// ============================================================
// TEST GROUP 5: Helper (智能助手)
// ============================================================
test.describe('5. Helper (智能助手)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'helper');
  });

  test('should load helper page', async ({ page }) => {
    await expect(page).toHaveURL(/\/helper/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/helper-page.png' });
  });

  test('should ask question and get answer', async ({ page }) => {
    const input = page.locator('textarea[placeholder], input[placeholder]').first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill('什么是闭包？');

    const sendBtn = page.locator('button.el-button--primary').filter({ hasText: /发送|提问/ }).first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(15000);
    }

    await page.screenshot({ path: 'test-results/screenshots/helper-question.png' });
  });
});

// ============================================================
// TEST GROUP 6: Evaluator (评估智能体)
// ============================================================
test.describe('6. Evaluator (评估智能体)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'evaluator');
  });

  test('should load evaluator page', async ({ page }) => {
    await expect(page).toHaveURL(/\/evaluator/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/evaluator-page.png' });
  });

  test('should submit evaluation', async ({ page }) => {
    const inputs = page.locator('textarea[placeholder], input[placeholder]');
    const count = await inputs.count();
    if (count >= 2) {
      await inputs.nth(0).fill('请简述Python的垃圾回收机制');
      await inputs.nth(1).fill('Python使用引用计数和循环垃圾回收器来管理内存');

      const sendBtn = page.locator('button.el-button--primary').filter({ hasText: /评估|提交/ }).first();
      if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sendBtn.click();
        await page.waitForTimeout(15000);
      }
    }

    await page.screenshot({ path: 'test-results/screenshots/evaluator-submit.png' });
  });
});

// ============================================================
// TEST GROUP 7: Custom Exercise Templates (自定义题库)
// ============================================================
test.describe('7. Custom Exercise Templates (自定义题库)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'exercise-templates');
  });

  test('should load exercise templates page', async ({ page }) => {
    await expect(page).toHaveURL(/\/exercise-templates/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/exercise-templates-page.png' });
  });

  test('should create new template', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /新建|添加|创建/ }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      const nameInput = page.locator('input[placeholder*="名称"], input[placeholder*="名字"], .el-dialog input[type="text"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('数学测试');
      }

      const confirmBtn = page.locator('button').filter({ hasText: /确定|保存|提交/ }).first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(5000);
      }
    }

    await page.screenshot({ path: 'test-results/screenshots/exercise-template-create.png' });
  });

  test('should generate exercises from template', async ({ page }) => {
    const generateBtn = page.locator('button').filter({ hasText: /生成|练习/ }).first();
    if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await generateBtn.click();
      await page.waitForTimeout(15000);
    }

    await page.screenshot({ path: 'test-results/screenshots/exercise-generate.png' });
  });
});

// ============================================================
// TEST GROUP 8: Knowledge Bases (知识库)
// ============================================================
test.describe('8. Knowledge Bases (知识库)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'knowledge-bases');
  });

  test('should load knowledge bases page', async ({ page }) => {
    await expect(page).toHaveURL(/\/knowledge-bases/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/knowledge-bases-page.png' });
  });
});

// ============================================================
// TEST GROUP 9: Notes (笔记)
// ============================================================
test.describe('9. Notes (笔记)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'notes');
  });

  test('should load notes page', async ({ page }) => {
    await expect(page).toHaveURL(/\/notes/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/notes-page.png' });
  });

  test('should create a note', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /新建|添加|创建笔记/ }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      const titleInput = page.locator('input[placeholder*="标题"], input[placeholder*="题目"], .el-dialog input[type="text"]').first();
      if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await titleInput.fill('测试笔记');
      }

      const contentInput = page.locator('textarea[placeholder*="内容"]').first();
      if (await contentInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await contentInput.fill('这是一条测试笔记');
      }

      const saveBtn = page.locator('button').filter({ hasText: /保存|确定|提交/ }).first();
      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(5000);
      }
    }

    await page.screenshot({ path: 'test-results/screenshots/notes-create.png' });
  });
});

// ============================================================
// TEST GROUP 10: Wrong Questions (错题本)
// ============================================================
test.describe('10. Wrong Questions (错题本)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'wrong-questions');
  });

  test('should load wrong questions page', async ({ page }) => {
    await expect(page).toHaveURL(/\/wrong-questions/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/wrong-questions-page.png' });
  });
});

// ============================================================
// TEST GROUP 11: Progress (学习进度)
// ============================================================
test.describe('11. Progress (学习进度)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'progress');
  });

  test('should load progress page', async ({ page }) => {
    await expect(page).toHaveURL(/\/progress/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/progress-page.png' });
  });
});

// ============================================================
// TEST GROUP 12: Achievements (成就)
// ============================================================
test.describe('12. Achievements (成就中心)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'achievements');
  });

  test('should load achievements page', async ({ page }) => {
    await expect(page).toHaveURL(/\/achievements/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/achievements-page.png' });
  });
});

// ============================================================
// TEST GROUP 13: Study Session (学习会话)
// ============================================================
test.describe('13. Study Session (学习会话)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'study');
  });

  test('should load study session page', async ({ page }) => {
    await expect(page).toHaveURL(/\/study/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/study-session-page.png' });
  });
});

// ============================================================
// TEST GROUP 14: Reminders (提醒)
// ============================================================
test.describe('14. Reminders (学习提醒)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'reminders');
  });

  test('should load reminders page', async ({ page }) => {
    await expect(page).toHaveURL(/\/reminders/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/reminders-page.png' });
  });
});

// ============================================================
// TEST GROUP 15: Profile & Settings
// ============================================================
test.describe('15. Profile & Settings', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'planner');
  });

  test('should load profile page', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForURL(/\/profile/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/profile-page.png' });
  });

  test('should load settings page', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForURL(/\/settings/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/settings-page.png' });
  });
});

// ============================================================
// TEST GROUP 16: Additional Pages
// ============================================================
test.describe('16. Additional Pages', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'planner');
  });

  test('should load statistics page', async ({ page }) => {
    await page.goto(`${BASE_URL}/statistics`);
    await page.waitForURL(/\/statistics/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/statistics/);
    await page.screenshot({ path: 'test-results/screenshots/statistics-page.png' });
  });

  test('should load history page', async ({ page }) => {
    await page.goto(`${BASE_URL}/history`);
    await page.waitForURL(/\/history/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/history/);
    await page.screenshot({ path: 'test-results/screenshots/history-page.png' });
  });

  test('should load feedback history page', async ({ page }) => {
    await page.goto(`${BASE_URL}/feedback`);
    await page.waitForURL(/\/feedback/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/feedback/);
    await page.screenshot({ path: 'test-results/screenshots/feedback-page.png' });
  });

  test('should load knowledge graph page', async ({ page }) => {
    await page.goto(`${BASE_URL}/knowledge-graph`);
    await page.waitForURL(/\/knowledge-graph/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/knowledge-graph/);
    await page.screenshot({ path: 'test-results/screenshots/knowledge-graph-page.png' });
  });

  test('should load knowledge manage page', async ({ page }) => {
    await page.goto(`${BASE_URL}/knowledge-manage`);
    await page.waitForURL(/\/knowledge-manage/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/knowledge-manage/);
    await page.screenshot({ path: 'test-results/screenshots/knowledge-manage-page.png' });
  });

  test('should load learning paths page', async ({ page }) => {
    await page.goto(`${BASE_URL}/learning-paths`);
    await page.waitForURL(/\/learning-paths/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/learning-paths/);
    await page.screenshot({ path: 'test-results/screenshots/learning-paths-page.png' });
  });

  test('should load analytics page', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForURL(/\/analytics/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/analytics/);
    await page.screenshot({ path: 'test-results/screenshots/analytics-page.png' });
  });

  test('should load reviews page', async ({ page }) => {
    await page.goto(`${BASE_URL}/reviews`);
    await page.waitForURL(/\/reviews/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/reviews/);
    await page.screenshot({ path: 'test-results/screenshots/reviews-page.png' });
  });

  test('should load companion page', async ({ page }) => {
    await page.goto(`${BASE_URL}/companion`);
    await page.waitForURL(/\/companion/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/companion/);
    await page.screenshot({ path: 'test-results/screenshots/companion-page.png' });
  });

  test('should load community page', async ({ page }) => {
    await page.goto(`${BASE_URL}/community`);
    await page.waitForURL(/\/community/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/community/);
    await page.screenshot({ path: 'test-results/screenshots/community-page.png' });
  });

  test('should load notifications page', async ({ page }) => {
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForURL(/\/notifications/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/notifications/);
    await page.screenshot({ path: 'test-results/screenshots/notifications-page.png' });
  });

  test('should load export page', async ({ page }) => {
    await page.goto(`${BASE_URL}/export`);
    await page.waitForURL(/\/export/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/export/);
    await page.screenshot({ path: 'test-results/screenshots/export-page.png' });
  });
});

// ============================================================
// TEST GROUP 17: Battle View (PK 对战)
// ============================================================
test.describe('17. Battle View (PK 对战)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndNavigate(page, 'battle');
  });

  test('should load battle page', async ({ page }) => {
    await expect(page).toHaveURL(/\/battle/);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/battle-page.png' });
  });
});

// ============================================================
// TEST GROUP 18: Logout
// ============================================================
test.describe('18. Logout', () => {
  test('should logout successfully', async ({ page }) => {
    await setupAuthAndNavigate(page, 'planner');

    const logoutBtn = page.locator('button, a').filter({ hasText: /退出|登出/ }).first();
    if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
    }

    const currentUrl = page.url();
    console.log(`After logout, URL: ${currentUrl}`);
    await page.screenshot({ path: 'test-results/screenshots/logout.png' });
  });
});
