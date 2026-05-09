const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testAdminWithRoleSelection() {
  console.log('🚀 测试 Admin Dashboard - 包含角色选择...');
  
  const screenshotsDir = path.join(__dirname, 'test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-web-security']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  const consoleErrors = [];
  const consoleLogs = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });
  
  const screenshots = [];
  
  try {
    // 步骤1: 访问登录页面
    console.log('\n📍 步骤1: 访问登录页面');
    await page.goto('http://localhost:3001/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'test2-step1-login.png'),
      fullPage: true 
    });
    screenshots.push('step1-login.png');
    console.log('✓ 登录页面已加载');
    
    // 步骤2: 点击"管理员入口"链接
    console.log('\n📍 步骤2: 点击管理员入口链接');
    const adminLink = await page.$('.admin-link, a:has-text("管理员入口")');
    
    if (adminLink) {
      await adminLink.click();
      console.log('✓ 已点击管理员入口');
      
      // 等待提示消息
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'test2-step2-admin-mode.png'),
        fullPage: true 
      });
      screenshots.push('step2-admin-mode.png');
    } else {
      console.log('⚠️ 未找到管理员入口链接');
    }
    
    // 步骤3: 填写管理员凭据
    console.log('\n📍 步骤3: 填写管理员凭据');
    
    const usernameInput = await page.$('input[placeholder*="用户名"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (usernameInput && passwordInput) {
      await usernameInput.fill('admin');
      await passwordInput.fill('admin123456');
      console.log('✓ 已填写用户名和密码');
      
      // 点击登录按钮
      const loginButton = await page.$('button:has-text("登录")');
      if (loginButton) {
        await loginButton.click();
        console.log('✓ 已点击登录按钮');
        
        // 等待登录完成
        await page.waitForTimeout(3000);
        
        const afterLoginUrl = page.url();
        console.log(`✓ 登录后URL: ${afterLoginUrl}`);
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, 'test2-step3-after-login.png'),
          fullPage: true 
        });
        screenshots.push('step3-after-login.png');
        
        // 步骤4: 检查localStorage中的角色
        console.log('\n📍 步骤4: 检查认证信息');
        const token = await page.evaluate(() => localStorage.getItem('token'));
        const userRole = await page.evaluate(() => localStorage.getItem('userRole'));
        const userId = await page.evaluate(() => localStorage.getItem('userId'));
        
        console.log(`  Token: ${token}`);
        console.log(`  用户角色: ${userRole}`);
        console.log(`  用户ID: ${userId}`);
        
        // 步骤5: 尝试访问/admin
        console.log('\n📍 步骤5: 访问 /admin 页面');
        await page.goto('http://localhost:3001/admin', { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        await page.waitForTimeout(2000);
        
        const adminUrl = page.url();
        const adminTitle = await page.title();
        
        console.log(`  访问/admin后URL: ${adminUrl}`);
        console.log(`  页面标题: ${adminTitle}`);
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, 'test2-step5-admin-page.png'),
          fullPage: true 
        });
        screenshots.push('step5-admin-page.png');
        
        // 检查页面内容
        const content = await page.content();
        const hasAdminPanel = content.includes('Admin Panel');
        const hasUserRole = userRole === 'admin';
        
        console.log(`  包含Admin Panel: ${hasAdminPanel}`);
        console.log(`  用户角色是admin: ${hasUserRole}`);
        
        // 打印控制台日志（查找关键信息）
        console.log('\n📍 关键控制台日志:');
        const relevantLogs = consoleLogs.filter(log => 
          log.includes('角色') || 
          log.includes('admin') || 
          log.includes('权限') ||
          log.includes('mock') ||
          log.includes('登录')
        );
        relevantLogs.slice(-10).forEach(log => console.log(`  ${log}`));
        
      }
    }
    
    // 最终报告
    console.log('\n' + '='.repeat(70));
    console.log('📊 测试报告 - Admin Dashboard 角色选择测试');
    console.log('='.repeat(70));
    
    console.log('\n📸 截图:');
    screenshots.forEach((s, i) => console.log(`  ${i+1}. ${s}`));
    
    console.log('\n❌ 控制台错误:');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((err, i) => console.log(`  ${i+1}. ${err}`));
    } else {
      console.log('  无错误');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ 测试完成');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('测试错误:', error.message);
  } finally {
    await browser.close();
  }
}

testAdminWithRoleSelection().catch(console.error);
