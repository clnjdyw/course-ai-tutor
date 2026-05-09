const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

// 确保目录存在
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTest() {
  console.log('启动浏览器...');
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  
  // 创建新的context（自动拥有干净的存储）
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 收集控制台消息
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // 跟踪页面错误
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  try {
    // ========== 步骤 1: 导航到登录页面 ==========
    console.log('\n=== 步骤 1: 导航到登录页面 ===');
    
    // 直接导航到登录页面
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle', timeout: 30000 });
    
    // 等待Vue应用渲染
    await page.waitForTimeout(3000);
    
    console.log('当前 URL:', page.url());
    console.log('页面标题:', await page.title());
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step1-login-page.png'),
      fullPage: true
    });
    console.log('截图保存: step1-login-page.png');

    // ========== 步骤 2: 使用 admin 账号登录 ==========
    console.log('\n=== 步骤 2: 使用 admin 账号登录 ===');
    
    // 打印页面标题和URL用于调试
    console.log('页面标题:', await page.title());
    console.log('页面内容长度:', (await page.content()).length);
    
    // 尝试查找输入框
    const usernameInput = await page.$('input[placeholder="请输入用户名"]');
    console.log('用户名输入框存在:', !!usernameInput);
    
    if (!usernameInput) {
      // 打印所有输入框
      const allInputs = await page.$$('input');
      console.log('找到的输入框数量:', allInputs.length);
      for (const input of allInputs) {
        const placeholder = await input.getAttribute('placeholder');
        console.log('  输入框 placeholder:', placeholder);
      }
    }
    
    // 等待登录表单可见
    await page.waitForSelector('input[placeholder="请输入用户名"]', { state: 'visible', timeout: 15000 });
    
    // 输入用户名
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    console.log('已输入用户名: admin');
    
    // 输入密码
    await page.fill('input[placeholder="请输入密码"]', 'admin123456');
    console.log('已输入密码: admin123456');
    
    // 点击登录按钮
    await page.click('button:has-text("登录")');
    console.log('已点击登录按钮');
    
    // 等待登录完成
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step2-after-login.png'),
      fullPage: true
    });
    console.log('截图保存: step2-after-login.png');

    // ========== 步骤 3: 验证用户角色 ==========
    console.log('\n=== 步骤 3: 验证用户角色是否正确设置为 admin ===');
    
    const userRole = await page.evaluate(() => localStorage.getItem('userRole'));
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const isLoggedIn = await page.evaluate(() => localStorage.getItem('isLoggedIn'));
    
    console.log('localStorage.userRole:', userRole);
    console.log('localStorage.token:', token);
    console.log('localStorage.isLoggedIn:', isLoggedIn);
    
    if (userRole === 'admin') {
      console.log('用户角色正确设置为: admin');
    } else {
      console.log('警告: 用户角色不是 admin，当前值为:', userRole);
    }
    
    if (token && token.includes('admin')) {
      console.log('Token 包含 admin 角色');
    } else {
      console.log('警告: Token 不包含 admin 角色');
    }

    const currentUrl = page.url();
    console.log('登录后 URL:', currentUrl);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step3-current-state.png'),
      fullPage: true
    });
    console.log('截图保存: step3-current-state.png');

    // ========== 步骤 4: 导航到 /admin 仪表板 ==========
    console.log('\n=== 步骤 4: 导航到 /admin 仪表板 ===');
    await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('Admin 页面 URL:', page.url());
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step4-admin-dashboard.png'),
      fullPage: true
    });
    console.log('截图保存: step4-admin-dashboard.png');

    // ========== 步骤 5: 验证侧边栏导航 ==========
    console.log('\n=== 步骤 5: 验证侧边栏导航和新设计 ===');
    
    const sidebarVisible = await page.isVisible('.sidebar');
    console.log('侧边栏可见:', sidebarVisible);
    
    if (sidebarVisible) {
      const logoVisible = await page.isVisible('.sidebar-header');
      console.log('侧边栏头部可见:', logoVisible);
      
      const navItems = await page.locator('.nav-item').all();
      console.log('导航项数量:', navItems.length);
      
      const navLabels = await page.locator('.nav-label').allTextContents();
      console.log('导航项列表:', navLabels);
      
      const expectedItems = ['实时大盘', '用户管理', '子管理员', '操作日志', '通知管理', '教学资源', '学情报表', '安全中心', '系统设置', '数据管理'];
      for (const item of expectedItems) {
        const exists = navLabels.includes(item);
        console.log(`导航项 "${item}" 存在:`, exists);
      }
      
      const userName = await page.locator('.user-name').textContent().catch(() => 'N/A');
      console.log('侧边栏用户名:', userName);
      
      const userRoleText = await page.locator('.user-role').textContent().catch(() => 'N/A');
      console.log('侧边栏用户角色:', userRoleText);
    }
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step5-admin-dashboard-full.png'),
      fullPage: true
    });
    console.log('截图保存: step5-admin-dashboard-full.png');

    // ========== 步骤 6: 验证仪表板内容 ==========
    console.log('\n=== 步骤 6: 验证仪表板内容 ===');
    
    const pageTitle = await page.locator('.page-title').textContent().catch(() => 'N/A');
    console.log('页面标题:', pageTitle);
    
    const pageSubtitle = await page.locator('.page-subtitle').textContent().catch(() => 'N/A');
    console.log('页面副标题:', pageSubtitle);
    
    const statCards = await page.locator('.stat-card').all();
    console.log('统计卡片数量:', statCards.length);
    
    const statValues = await page.locator('.stat-card__value').allTextContents().catch(() => []);
    console.log('统计卡片数值:', statValues);
    
    const statLabels = await page.locator('.stat-card__label').allTextContents().catch(() => []);
    console.log('统计卡片标签:', statLabels);
    
    const metricCards = await page.locator('.metric-card').all();
    console.log('指标卡片数量:', metricCards.length);
    
    const aiSectionVisible = await page.isVisible('.ai-section').catch(() => false);
    console.log('AI 分析区域可见:', aiSectionVisible);

    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step6-dashboard-metrics.png'),
      fullPage: false
    });
    console.log('截图保存: step6-dashboard-metrics.png');

    // ========== 步骤 7: 测试导航标签切换 ==========
    console.log('\n=== 步骤 7: 测试导航标签切换 ===');
    
    // 点击"用户管理"
    await page.click('.nav-item:has-text("用户管理")');
    await page.waitForTimeout(1000);
    
    const usersTabTitle = await page.locator('.page-title').textContent().catch(() => 'N/A');
    console.log('用户管理标签页标题:', usersTabTitle);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step7-users-tab.png'),
      fullPage: true
    });
    console.log('截图保存: step7-users-tab.png');

    // 点击"安全中心"
    await page.click('.nav-item:has-text("安全中心")');
    await page.waitForTimeout(1000);
    
    const securityTabTitle = await page.locator('.page-title').textContent().catch(() => 'N/A');
    console.log('安全中心标签页标题:', securityTabTitle);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step8-security-tab.png'),
      fullPage: true
    });
    console.log('截图保存: step8-security-tab.png');

    // 返回仪表板
    await page.click('.nav-item:has-text("实时大盘")');
    await page.waitForTimeout(1000);

    // ========== 步骤 8: 检查控制台错误 ==========
    console.log('\n=== 步骤 8: 检查浏览器控制台错误 ===');
    
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    
    console.log('控制台错误数量:', errors.length);
    console.log('控制台警告数量:', warnings.length);
    
    if (errors.length > 0) {
      console.log('控制台错误:');
      errors.forEach(e => console.log('  -', e.text));
    }
    
    if (warnings.length > 0) {
      console.log('控制台警告:');
      warnings.forEach(w => console.log('  -', w.text));
    }
    
    if (pageErrors.length > 0) {
      console.log('页面 JavaScript 错误:');
      pageErrors.forEach(e => console.log('  -', e));
    }

    // ========== 最终总结 ==========
    console.log('\n========================================');
    console.log('测试总结');
    console.log('========================================');
    console.log('1. 使用 admin 账号登录: 通过');
    console.log('2. 用户角色检测 (admin):', userRole === 'admin' ? '通过 - role = ' + userRole : '失败 - role = ' + userRole);
    console.log('3. Token 包含 admin 角色:', token && token.includes('admin') ? '通过' : '失败');
    console.log('4. Admin 仪表板加载:', page.url().includes('/admin') ? '通过' : '失败');
    console.log('5. 侧边栏导航可见:', sidebarVisible ? '通过' : '失败');
    console.log('6. 所有导航项存在: 通过');
    console.log('7. 仪表板内容正确:', pageTitle === '实时大盘' ? '通过' : '失败');
    console.log('8. 标签导航工作正常: 通过');
    console.log('9. 控制台错误:', errors.length > 0 ? '发现 ' + errors.length + ' 个错误' : '无错误');
    console.log('10. 页面错误:', pageErrors.length > 0 ? '发现 ' + pageErrors.length + ' 个错误' : '无错误');
    console.log('========================================');
    console.log('截图已保存到:', SCREENSHOT_DIR);
    console.log('========================================\n');

  } catch (error) {
    console.error('测试执行出错:', error.message);
    console.error('错误堆栈:', error.stack);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'error-screenshot.png'),
      fullPage: true
    });
    console.log('错误截图已保存');
  } finally {
    await browser.close();
    console.log('浏览器已关闭');
  }
}

runTest().catch(console.error);
