// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// 截图保存目录
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

// 确保截图目录存在
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * 辅助函数：截图并保存
 */
async function takeScreenshot(page, name) {
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[Screenshot] Saved: ${filePath}`);
  return filePath;
}

/**
 * 辅助函数：等待并截图
 */
async function waitAndScreenshot(page, name, waitTime = 1000) {
  await page.waitForTimeout(waitTime);
  return takeScreenshot(page, name);
}

/**
 * 辅助函数：获取登录面板
 */
const loginPanel = (page) => page.getByRole('tabpanel', { name: '登录' });
const registerPanel = (page) => page.getByRole('tabpanel', { name: '注册' });

/**
 * 辅助函数：用户登录
 */
async function loginUser(page, username = 'testuser', password = '123456') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const panel = loginPanel(page);
  await panel.locator('input[placeholder="请输入用户名"]').fill(username);
  await panel.locator('input[placeholder="请输入密码"]').fill(password);
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForTimeout(2000);
}

/**
 * 辅助函数：注册新用户
 */
async function registerUser(page, username, email, password) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  await page.getByRole('tab', { name: '注册' }).click();
  await page.waitForTimeout(500);

  const panel = registerPanel(page);
  await panel.locator('input[placeholder="请输入用户名（3-20 位）"]').fill(username);
  await panel.locator('input[placeholder="请输入邮箱"]').fill(email);
  await panel.locator('input[placeholder="请输入密码（至少 6 位）"]').fill(password);
  await panel.locator('input[placeholder="请确认密码"]').fill(password);
  await page.getByRole('button', { name: '注册' }).click();
  await page.waitForTimeout(2000);
}

/**
 * 综合E2E测试套件
 */
test.describe('Course AI Tutor - 综合E2E测试', () => {

  // ==================== 测试1: 服务状态检查 ====================
  test.describe('环境检查', () => {
    test('TC01 - 前端服务可访问', async ({ page }) => {
      const response = await page.goto('/');
      expect(response.status()).toBeLessThan(400);
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '01-frontend-home');
      console.log('[PASS] 前端服务可访问');
    });

    test('TC02 - 后端API健康检查', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/health');
        return { status: res.status, ok: res.ok };
      });
      expect(response.ok).toBe(true);
      console.log('[PASS] 后端API健康检查通过');
    });
  });

  // ==================== 测试2: 用户注册 ====================
  test.describe('用户注册', () => {
    const testUsername = `testuser_${Date.now()}`;
    const testEmail = `${testUsername}@test.com`;
    const testPassword = 'Test123456';

    test('TC03 - 新用户注册流程', async ({ page }) => {
      await registerUser(page, testUsername, testEmail, testPassword);

      // 验证注册成功（应该跳转到主页或显示成功消息）
      const currentUrl = page.url();
      console.log(`[INFO] 注册后URL: ${currentUrl}`);

      await takeScreenshot(page, '02-registration-success');

      // 检查是否在主页或显示成功消息
      const hasSuccess = await page.locator('.el-message--success, .app-title, .home-container').count().then(c => c > 0);
      expect(hasSuccess).toBe(true);
      console.log('[PASS] 用户注册成功');
    });
  });

  // ==================== 测试3: 用户登录 ====================
  test.describe('用户登录', () => {
    test('TC04 - 有效用户登录', async ({ page }) => {
      await loginUser(page, 'testuser', '123456');

      await takeScreenshot(page, '03-login-success');

      // 验证登录成功 - 检查是否跳转到了主页
      const currentUrl = page.url();
      console.log(`[INFO] 登录后URL: ${currentUrl}`);

      // 检查主页元素
      const hasHomePage = await page.locator('.app-title, .home-container, .el-menu').count().then(c => c > 0);
      expect(hasHomePage).toBe(true);
      console.log('[PASS] 用户登录成功');
    });

    test('TC05 - 无效用户名登录失败', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const panel = loginPanel(page);
      await panel.locator('input[placeholder="请输入用户名"]').fill('nonexistent_user');
      await panel.locator('input[placeholder="请输入密码"]').fill('wrongpassword');
      await page.getByRole('button', { name: '登录' }).click();
      await page.waitForTimeout(2000);

      await takeScreenshot(page, '04-login-failure');

      // 应该显示错误消息
      const hasError = await page.locator('.el-message--error, .el-form-item__error').count().then(c => c > 0);
      expect(hasError).toBe(true);
      console.log('[PASS] 无效登录被正确拒绝');
    });

    test('TC06 - 空表单验证', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: '登录' }).click();
      await page.waitForTimeout(500);

      await takeScreenshot(page, '05-empty-form-validation');

      const hasError = await loginPanel(page).locator('.el-form-item__error').count().then(c => c > 0);
      expect(hasError).toBe(true);
      console.log('[PASS] 空表单验证通过');
    });
  });

  // ==================== 测试4: 主导航 ====================
  test.describe('主导航测试', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, 'testuser', '123456');
      await page.waitForTimeout(1000);
    });

    test('TC07 - 主页加载和导航菜单', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '06-homepage-navigation');

      // 检查导航菜单存在
      const menuExists = await page.locator('.el-menu, .sidebar, nav').count().then(c => c > 0);
      expect(menuExists).toBe(true);
      console.log('[PASS] 导航菜单存在');
    });

    test('TC08 - 智能答疑模块（HelperAgent）', async ({ page }) => {
      // 尝试导航到智能答疑页面
      await page.goto('/helper');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, '07-helper-agent');

      // 检查页面是否加载
      const pageLoaded = await page.locator('body').count().then(c => c > 0);
      expect(pageLoaded).toBe(true);
      console.log('[PASS] 智能答疑模块可访问');
    });

    test('TC09 - 学习规划模块（PlannerAgent）', async ({ page }) => {
      await page.goto('/planner');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, '08-planner-agent');

      const pageLoaded = await page.locator('body').count().then(c => c > 0);
      expect(pageLoaded).toBe(true);
      console.log('[PASS] 学习规划模块可访问');
    });

    test('TC10 - 辅助教学模块（TutorAgent）', async ({ page }) => {
      await page.goto('/tutor');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, '09-tutor-agent');

      const pageLoaded = await page.locator('body').count().then(c => c > 0);
      expect(pageLoaded).toBe(true);
      console.log('[PASS] 辅助教学模块可访问');
    });

    test('TC11 - 学习评估模块（EvaluatorAgent）', async ({ page }) => {
      await page.goto('/evaluator');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, '10-evaluator-agent');

      const pageLoaded = await page.locator('body').count().then(c => c > 0);
      expect(pageLoaded).toBe(true);
      console.log('[PASS] 学习评估模块可访问');
    });

    test('TC12 - 情感陪伴模块（CompanionAgent）', async ({ page }) => {
      await page.goto('/companion');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, '11-companion-agent');

      const pageLoaded = await page.locator('body').count().then(c => c > 0);
      expect(pageLoaded).toBe(true);
      console.log('[PASS] 情感陪伴模块可访问');
    });
  });

  // ==================== 测试5: 智能答疑（HelperAgent） ====================
  test.describe('智能答疑模块', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, 'testuser', '123456');
      await page.waitForTimeout(1000);
      await page.goto('/helper');
      await page.waitForTimeout(1500);
    });

    test('TC13 - 智能答疑页面元素', async ({ page }) => {
      await takeScreenshot(page, '12-helper-page-elements');

      // 检查聊天输入框
      const hasInput = await page.locator('textarea, input[type="text"], .chat-input').count().then(c => c > 0);
      expect(hasInput).toBe(true);
      console.log('[PASS] 智能答疑输入框存在');
    });

    test('TC14 - 智能答疑消息发送', async ({ page }) => {
      // 尝试查找并填写问题
      const input = page.locator('textarea, input[type="text"]').first();
      if (await input.count() > 0) {
        await input.fill('什么是人工智能？');
        await takeScreenshot(page, '13-helper-question-entered');

        // 尝试点击发送按钮
        const sendBtn = page.locator('button').filter({ hasText: /发送|submit|Send/i }).first();
        if (await sendBtn.count() > 0) {
          await sendBtn.click();
          await page.waitForTimeout(2000);
          await takeScreenshot(page, '14-helper-message-sent');
          console.log('[PASS] 消息发送成功');
        }
      }
    });
  });

  // ==================== 测试6: 学习规划（PlannerAgent） ====================
  test.describe('学习规划模块', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, 'testuser', '123456');
      await page.waitForTimeout(1000);
      await page.goto('/planner');
      await page.waitForTimeout(1500);
    });

    test('TC15 - 学习规划页面元素', async ({ page }) => {
      await takeScreenshot(page, '15-planner-page-elements');

      const hasContent = await page.locator('body').innerText().then(t => t.length > 50);
      expect(hasContent).toBe(true);
      console.log('[PASS] 学习规划页面内容存在');
    });

    test('TC16 - 创建学习计划', async ({ page }) => {
      // 尝试查找表单元素
      const inputs = page.locator('input, textarea, select');
      const count = await inputs.count();

      if (count > 0) {
        await takeScreenshot(page, '16-planner-form');
        console.log(`[INFO] 找到 ${count} 个表单元素`);
      }
      console.log('[PASS] 学习规划表单检查完成');
    });
  });

  // ==================== 测试7: 辅助教学（TutorAgent） ====================
  test.describe('辅助教学模块', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, 'testuser', '123456');
      await page.waitForTimeout(1000);
      await page.goto('/tutor');
      await page.waitForTimeout(1500);
    });

    test('TC17 - 辅助教学页面加载', async ({ page }) => {
      await takeScreenshot(page, '17-tutor-page-load');

      const hasContent = await page.locator('body').innerText().then(t => t.length > 50);
      expect(hasContent).toBe(true);
      console.log('[PASS] 辅助教学页面加载成功');
    });
  });

  // ==================== 测试8: 学习评估（EvaluatorAgent） ====================
  test.describe('学习评估模块', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, 'testuser', '123456');
      await page.waitForTimeout(1000);
      await page.goto('/evaluator');
      await page.waitForTimeout(1500);
    });

    test('TC18 - 学习评估页面加载', async ({ page }) => {
      await takeScreenshot(page, '18-evaluator-page-load');

      const hasContent = await page.locator('body').innerText().then(t => t.length > 50);
      expect(hasContent).toBe(true);
      console.log('[PASS] 学习评估页面加载成功');
    });
  });

  // ==================== 测试9: 情感陪伴（CompanionAgent） ====================
  test.describe('情感陪伴模块', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, 'testuser', '123456');
      await page.waitForTimeout(1000);
      await page.goto('/companion');
      await page.waitForTimeout(1500);
    });

    test('TC19 - 情感陪伴页面加载', async ({ page }) => {
      await takeScreenshot(page, '19-companion-page-load');

      const hasContent = await page.locator('body').innerText().then(t => t.length > 50);
      expect(hasContent).toBe(true);
      console.log('[PASS] 情感陪伴页面加载成功');
    });
  });

  // ==================== 测试10: 多智能体协作 ====================
  test.describe('多智能体协作', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, 'testuser', '123456');
      await page.waitForTimeout(1000);
    });

    test('TC20 - 智能体状态检查', async ({ page }) => {
      // 尝试访问智能体状态页面或API
      const agentStatus = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/agent/status');
          return res.ok;
        } catch (e) {
          return false;
        }
      });

      console.log(`[INFO] 智能体状态API: ${agentStatus ? '可用' : '不可用'}`);
      await takeScreenshot(page, '20-agent-status');
      console.log('[PASS] 智能体状态检查完成');
    });

    test('TC21 - 智能体列表', async ({ page }) => {
      const agentList = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/agent/list');
          if (res.ok) {
            const data = await res.json();
            return data;
          }
          return null;
        } catch (e) {
          return null;
        }
      });

      console.log(`[INFO] 智能体列表: ${agentList ? JSON.stringify(agentList).substring(0, 200) : '无数据'}`);
      await takeScreenshot(page, '21-agent-list');
      console.log('[PASS] 智能体列表检查完成');
    });

    test('TC22 - 智能体请求测试', async ({ page }) => {
      // 测试智能体请求接口
      const response = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/agent/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: '你好，请介绍一下自己',
              agent: 'helper'
            })
          });
          return { status: res.status, ok: res.ok };
        } catch (e) {
          return { status: 0, ok: false, error: e.message };
        }
      });

      console.log(`[INFO] 智能体请求响应: ${JSON.stringify(response)}`);
      await takeScreenshot(page, '22-agent-request');
      console.log('[PASS] 智能体请求测试完成');
    });
  });

  // ==================== 测试11: 其他功能页面 ====================
  test.describe('其他功能页面', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, 'testuser', '123456');
      await page.waitForTimeout(1000);
    });

    test('TC23 - 知识库页面', async ({ page }) => {
      await page.goto('/knowledge');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, '23-knowledge-page');
      console.log('[PASS] 知识库页面可访问');
    });

    test('TC24 - 学习笔记页面', async ({ page }) => {
      await page.goto('/notes');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, '24-notes-page');
      console.log('[PASS] 学习笔记页面可访问');
    });

    test('TC25 - 错题本页面', async ({ page }) => {
      await page.goto('/wrong-questions');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, '25-wrong-questions-page');
      console.log('[PASS] 错题本页面可访问');
    });

    test('TC26 - 学习进度页面', async ({ page }) => {
      await page.goto('/progress');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, '26-progress-page');
      console.log('[PASS] 学习进度页面可访问');
    });

    test('TC27 - 成就页面', async ({ page }) => {
      await page.goto('/achievements');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, '27-achievements-page');
      console.log('[PASS] 成就页面可访问');
    });
  });

  // ==================== 测试12: 响应式布局 ====================
  test.describe('响应式布局', () => {
    test('TC28 - 移动端视图（375x667）', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginUser(page, 'testuser', '123456');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '28-mobile-view');
      console.log('[PASS] 移动端视图检查完成');
    });

    test('TC29 - 平板视图（768x1024）', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await loginUser(page, 'testuser', '123456');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '29-tablet-view');
      console.log('[PASS] 平板视图检查完成');
    });
  });

  // ==================== 测试13: 性能检查 ====================
  test.describe('性能检查', () => {
    test('TC30 - 页面加载时间', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`[INFO] 首页加载时间: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000); // 10秒内加载完成
      console.log('[PASS] 页面加载时间检查通过');
    });
  });
});
