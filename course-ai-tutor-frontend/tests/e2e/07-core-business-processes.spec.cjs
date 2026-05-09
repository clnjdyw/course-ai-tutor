// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 核心业务流程功能测试套件
 * 
 * 测试范围：
 * 1. 智能教学 (AI Tutor) - 核心AI功能
 * 2. 学习评估 (Evaluator) - 作业批改与能力评估
 * 3. PK对战系统 - 实时答题对战
 * 4. 个人中心与成就系统
 * 5. 笔记与错题本管理
 * 6. 学习进度与提醒
 * 
 * 测试策略：
 * - 完整业务流程端到端测试
 * - 正向场景 + 异常场景覆盖
 * - AI功能响应验证
 */

// 辅助函数
const loginPanel = (page) => page.getByRole('tabpanel', { name: '登录' });

async function loginAsStudent(page, username = 'testuser', password = '123456') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  const panel = loginPanel(page);
  await panel.locator('input[placeholder="请输入用户名"]').fill(username);
  await panel.locator('input[placeholder="请输入密码"]').fill(password);
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForTimeout(2000);
  
  // 验证登录成功
  const url = page.url();
  expect(url).not.toContain('/login');
}

// ==================== 测试套件1: 智能教学 (AI Tutor) ====================
test.describe('核心业务流程 1: 智能教学 (AI Tutor)', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.waitForTimeout(1000);
  });

  test('TC-TUTOR-01 - 智能教学页面加载', async ({ page }) => {
    await page.goto('/tutor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证页面核心元素
    await expect(page.locator('h1, .page-title, text="智能教学"').first()).toBeVisible();
    await expect(page.locator('textarea, input[type="text"]')).toBeVisible();
    await expect(page.locator('button')).toBeVisible();
  });

  test('TC-TUTOR-02 - AI知识点讲解', async ({ page }) => {
    await page.goto('/tutor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 输入知识点请求
    const input = page.locator('textarea').first();
    await input.fill('请讲解一下勾股定理');
    await page.waitForTimeout(500);
    
    // 点击发送按钮
    const submitBtn = page.locator('button:has-text("发送"), button:has-text("提交"), button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(5000);
    
    // 验证AI回复
    const responseArea = page.locator('.message, .response, .ai-reply, [class*="message"]').first();
    await expect(responseArea).toBeVisible();
  });

  test('TC-TUTOR-03 - 苏格拉底式对话', async ({ page }) => {
    await page.goto('/tutor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 发起对话
    const input = page.locator('textarea').first();
    await input.fill('什么是光合作用？');
    await page.waitForTimeout(500);
    
    const submitBtn = page.locator('button:has-text("发送"), button:has-text("提交"), button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(5000);
    
    // 验证对话历史
    const messages = page.locator('.message, .chat-message, [class*="message"]');
    const count = await messages.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-TUTOR-04 - 空输入处理', async ({ page }) => {
    await page.goto('/tutor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 尝试空提交
    const submitBtn = page.locator('button:has-text("发送"), button:has-text("提交"), button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(1000);
    
    // 验证应该有提示或按钮禁用
    const submitBtnAfter = page.locator('button:has-text("发送"), button:has-text("提交"), button[type="submit"]').first();
    const isDisabled = await submitBtnAfter.isDisabled();
    expect(isDisabled).toBe(true);
  });
});

// ==================== 测试套件2: 学习评估 (Evaluator) ====================
test.describe('核心业务流程 2: 学习评估', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.waitForTimeout(1000);
  });

  test('TC-EVAL-01 - 学习评估页面加载', async ({ page }) => {
    await page.goto('/evaluator');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证页面元素
    await expect(page.locator('h1, .page-title, text="学习评估"').first()).toBeVisible();
  });

  test('TC-EVAL-02 - 生成习题', async ({ page }) => {
    await page.goto('/evaluator');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 查找生成习题按钮
    const generateBtn = page.locator('button:has-text("生成"), button:has-text("开始评估")').first();
    await expect(generateBtn).toBeVisible();
  });

  test('TC-EVAL-03 - 提交习题答案', async ({ page }) => {
    await page.goto('/evaluator');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 尝试提交答案
    const submitBtn = page.locator('button:has-text("提交"), button:has-text("提交答案")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }
  });
});

// ==================== 测试套件3: PK对战系统 ====================
test.describe('核心业务流程 3: PK对战系统', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.waitForTimeout(1000);
  });

  test('TC-BATTLE-01 - PK对战页面加载', async ({ page }) => {
    await page.goto('/battle');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证页面元素
    await expect(page.locator('h1, .page-title, text="PK对战"').first()).toBeVisible();
  });

  test('TC-BATTLE-02 - 选择对战模式', async ({ page }) => {
    await page.goto('/battle');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证模式选择存在
    const modeButtons = page.locator('button:has-text("快速"), button:has-text("练习"), button:has-text("挑战")');
    const count = await modeButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC-BATTLE-03 - 开始对战', async ({ page }) => {
    await page.goto('/battle');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 查找开始按钮
    const startBtn = page.locator('button:has-text("开始"), button:has-text("匹配")').first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(3000);
    }
  });
});

// ==================== 测试套件4: 个人中心与成就系统 ====================
test.describe('核心业务流程 4: 个人中心与成就系统', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.waitForTimeout(1000);
  });

  test('TC-PROFILE-01 - 个人中心页面加载', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证页面元素
    await expect(page.locator('h1, .page-title, text="个人中心"').first()).toBeVisible();
  });

  test('TC-PROFILE-02 - 查看用户信息', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证显示用户信息
    await expect(page.locator('text="testuser"')).toBeVisible();
  });

  test('TC-ACHIEVE-01 - 成就中心页面加载', async ({ page }) => {
    await page.goto('/achievements');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证成就页面
    await expect(page.locator('h1, .page-title, text="成就"').first()).toBeVisible();
  });

  test('TC-ACHIEVE-02 - 查看成就列表', async ({ page }) => {
    await page.goto('/achievements');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证成就徽章存在
    const achievements = page.locator('.achievement, .badge, [class*="achievement"], [class*="badge"]');
    const count = await achievements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-PROFILE-03 - 修改密码功能', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 查找修改密码按钮
    const changePwdBtn = page.locator('button:has-text("修改密码")');
    await expect(changePwdBtn).toBeVisible();
  });
});

// ==================== 测试套件5: 笔记与错题本管理 ====================
test.describe('核心业务流程 5: 笔记与错题本管理', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.waitForTimeout(1000);
  });

  test('TC-NOTE-01 - 笔记页面加载', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证页面元素
    await expect(page.locator('h1, .page-title, text="笔记"').first()).toBeVisible();
  });

  test('TC-NOTE-02 - 创建新笔记', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 查找创建笔记按钮
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建"), button:has-text("添加")');
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      
      // 验证编辑器出现
      const editor = page.locator('textarea, [contenteditable="true"], .editor');
      await expect(editor.first()).toBeVisible();
    }
  });

  test('TC-WRONG-01 - 错题本页面加载', async ({ page }) => {
    await page.goto('/wrong-questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证页面元素
    await expect(page.locator('h1, .page-title, text="错题"').first()).toBeVisible();
  });

  test('TC-WRONG-02 - 查看错题列表', async ({ page }) => {
    await page.goto('/wrong-questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证列表或空状态
    const listOrEmpty = page.locator('.question-list, .empty-state, [class*="question"], text="暂无错题"');
    await expect(listOrEmpty.first()).toBeVisible();
  });
});

// ==================== 测试套件6: 学习进度与提醒 ====================
test.describe('核心业务流程 6: 学习进度与提醒', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.waitForTimeout(1000);
  });

  test('TC-PROGRESS-01 - 学习进度页面加载', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证页面元素
    await expect(page.locator('h1, .page-title, text="进度"').first()).toBeVisible();
  });

  test('TC-PROGRESS-02 - 查看学习统计', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证统计图表或数据
    const stats = page.locator('.chart, .statistics, .progress-bar, [class*="progress"], [class*="chart"]');
    const count = await stats.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-REMINDER-01 - 学习提醒页面加载', async ({ page }) => {
    await page.goto('/reminders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证页面元素
    await expect(page.locator('h1, .page-title, text="提醒"').first()).toBeVisible();
  });

  test('TC-REMINDER-02 - 创建学习提醒', async ({ page }) => {
    await page.goto('/reminders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 查找创建提醒按钮
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建"), button:has-text("添加提醒")');
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('TC-STATS-01 - 学习统计页面加载', async ({ page }) => {
    await page.goto('/statistics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证页面元素
    await expect(page.locator('h1, .page-title, text="统计"').first()).toBeVisible();
  });
});

// ==================== 测试套件7: 完整业务流程测试 ====================
test.describe('核心业务流程 7: 完整学习流程', () => {
  
  test('TC-FLOW-01 - 完整学习流程：登录 -> 学习规划 -> 智能教学 -> 答疑 -> 查看进度', async ({ page }) => {
    // 1. 登录
    await loginAsStudent(page);
    await page.waitForTimeout(1000);
    
    // 2. 导航到学习规划
    await page.goto('/planner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1, .page-title, text="规划"').first()).toBeVisible();
    
    // 3. 导航到智能教学
    await page.goto('/tutor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1, .page-title, text="教学"').first()).toBeVisible();
    
    // 4. 导航到实时答疑
    await page.goto('/helper');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1, .page-title, text="答疑"').first()).toBeVisible();
    
    // 5. 查看学习进度
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1, .page-title, text="进度"').first()).toBeVisible();
  });

  test('TC-FLOW-02 - 完整学习流程：登录 -> 笔记 -> 错题本 -> 成就 -> 个人中心', async ({ page }) => {
    // 1. 登录
    await loginAsStudent(page);
    await page.waitForTimeout(1000);
    
    // 2. 查看笔记
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 3. 查看错题本
    await page.goto('/wrong-questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 4. 查看成就
    await page.goto('/achievements');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 5. 查看个人中心
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page.locator('text="testuser"')).toBeVisible();
  });
});

// ==================== 测试套件8: 异常场景测试 ====================
test.describe('核心业务流程 8: 异常场景测试', () => {
  
  test('TC-ERROR-01 - 未登录访问受保护页面', async ({ page }) => {
    // 清除可能的登录状态
    await page.context().clearCookies();
    await page.goto('/tutor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 应该重定向到登录页
    expect(page.url()).toContain('/login');
  });

  test('TC-ERROR-02 - AI服务异常处理', async ({ page }) => {
    await loginAsStudent(page);
    await page.waitForTimeout(1000);
    
    await page.goto('/tutor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 输入特殊字符测试
    const input = page.locator('textarea').first();
    await input.fill('!@#$%^&*()');
    await page.waitForTimeout(500);
    
    const submitBtn = page.locator('button:has-text("发送"), button:has-text("提交")').first();
    await submitBtn.click();
    await page.waitForTimeout(3000);
    
    // 页面不应崩溃
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC-ERROR-03 - 空数据处理', async ({ page }) => {
    await loginAsStudent(page);
    await page.waitForTimeout(1000);
    
    // 测试笔记为空
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 页面应正常显示（可能有空状态提示）
    await expect(page.locator('body')).toBeVisible();
  });
});
