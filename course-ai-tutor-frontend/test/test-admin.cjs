const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testAdminDashboard() {
  console.log('🚀 开始测试 Admin Dashboard...');
  
  // 确保screenshots目录存在
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
  const networkErrors = [];
  
  // 收集控制台错误
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        type: 'console',
        text: msg.text(),
        location: msg.location()
      });
      console.log(`   [CONSOLE ERROR] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push({
      type: 'pageerror',
      text: error.message
    });
    console.log(`   [PAGE ERROR] ${error.message}`);
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });
  
  const screenshots = [];
  
  try {
    // 步骤1: 访问首页
    console.log('\n📍 步骤1: 访问首页 (http://localhost:3001)');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    const url1 = page.url();
    console.log(`   ✓ 当前URL: ${url1}`);
    const title1 = await page.title();
    console.log(`   ✓ 页面标题: ${title1}`);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'step1-home.png'),
      fullPage: true 
    });
    screenshots.push({ step: 1, url: url1, file: 'step1-home.png' });
    
    // 步骤2: 直接访问 /admin 页面
    console.log('\n📍 步骤2: 直接访问 /admin 页面');
    await page.goto('http://localhost:3001/admin', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    const url2 = page.url();
    console.log(`   ✓ 当前URL: ${url2}`);
    const title2 = await page.title();
    console.log(`   ✓ 页面标题: ${title2}`);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'step2-admin-direct.png'),
      fullPage: true 
    });
    screenshots.push({ step: 2, url: url2, file: 'step2-admin-direct.png' });
    
    // 检查是否被重定向到登录页
    const isLoginPage = url2.includes('/login');
    console.log(`   ✓ 是否登录页: ${isLoginPage}`);
    
    // 步骤3: 如果在登录页，执行登录
    if (isLoginPage) {
      console.log('\n📍 步骤3: 执行管理员登录');
      
      // 等待页面稳定
      await page.waitForTimeout(1000);
      
      // 查找输入框
      const allInputs = await page.$$('input');
      console.log(`   找到 ${allInputs.length} 个输入框`);
      
      // 尝试常见的选择器
      let usernameInput = null;
      let passwordInput = null;
      
      // 尝试按placeholder查找
      usernameInput = await page.$('input[placeholder*="用户名"], input[placeholder*="账号"], input[placeholder*="Username"]');
      passwordInput = await page.$('input[type="password"]');
      
      // 如果没找到，尝试按name属性
      if (!usernameInput) {
        usernameInput = await page.$('input[name="username"], input[name="account"]');
      }
      
      // 如果还是没找到，尝试获取前两个输入框
      if (!usernameInput && allInputs.length >= 2) {
        usernameInput = allInputs[0];
        passwordInput = allInputs[1];
      }
      
      if (usernameInput && passwordInput) {
        console.log('   ✓ 找到登录表单字段');
        
        await usernameInput.click();
        await usernameInput.fill('admin');
        console.log('   ✓ 输入用户名: admin');
        
        await passwordInput.click();
        await passwordInput.fill('admin123456');
        console.log('   ✓ 输入密码: admin123456');
        
        // 查找登录按钮
        const loginButton = await page.$('button:has-text("登录"), button:has-text("Login"), .el-button--primary');
        
        if (loginButton) {
          await loginButton.click();
          console.log('   ✓ 点击登录按钮');
          
          // 等待响应
          await page.waitForTimeout(3000);
          
          const url3 = page.url();
          console.log(`   ✓ 登录后URL: ${url3}`);
          
          await page.screenshot({ 
            path: path.join(screenshotsDir, 'step3-after-login.png'),
            fullPage: true 
          });
          screenshots.push({ step: 3, url: url3, file: 'step3-after-login.png' });
          
          // 步骤4: 访问 /admin 页面
          console.log('\n📍 步骤4: 登录后访问 /admin');
          await page.goto('http://localhost:3001/admin', { 
            waitUntil: 'networkidle',
            timeout: 30000 
          });
          
          await page.waitForTimeout(2000);
          
          const url4 = page.url();
          console.log(`   ✓ 访问/admin后URL: ${url4}`);
          const title4 = await page.title();
          console.log(`   ✓ 页面标题: ${title4}`);
          
          await page.screenshot({ 
            path: path.join(screenshotsDir, 'step4-admin-after-login.png'),
            fullPage: true 
          });
          screenshots.push({ step: 4, url: url4, file: 'step4-admin-after-login.png' });
          
          // 检查页面内容
          const content4 = await page.content();
          const hasAdminPanel = content4.includes('Admin Panel') || content4.includes('后台管理');
          const hasUserManagement = content4.includes('用户管理');
          const hasDashboard = content4.includes('实时大盘');
          
          console.log(`   ✓ 包含Admin Panel: ${hasAdminPanel}`);
          console.log(`   ✓ 包含用户管理: ${hasUserManagement}`);
          console.log(`   ✓ 包含实时大盘: ${hasDashboard}`);
          
        } else {
          console.log('   ⚠️ 未找到登录按钮');
          await page.screenshot({ 
            path: path.join(screenshotsDir, 'step3-no-login-button.png'),
            fullPage: true 
          });
        }
      } else {
        console.log('   ⚠️ 未找到登录表单字段');
        await page.screenshot({ 
          path: path.join(screenshotsDir, 'step3-no-login-form.png'),
          fullPage: true 
        });
        
        // 打印页面文本以帮助调试
        const bodyText = await page.evaluate(() => document.body.innerText);
        console.log('   页面文本内容 (前500字符):');
        console.log(bodyText.substring(0, 500));
      }
    } else {
      console.log('\n✅ 直接访问/admin成功，无需登录');
    }
    
    // 步骤5: 检查认证状态
    console.log('\n📍 步骤5: 检查认证状态');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const userRole = await page.evaluate(() => localStorage.getItem('userRole'));
    const userId = await page.evaluate(() => localStorage.getItem('userId'));
    
    console.log(`   Token: ${token ? token.substring(0, 30) + '...' : '无'}`);
    console.log(`   用户角色: ${userRole || '未设置'}`);
    console.log(`   用户ID: ${userId || '未设置'}`);
    
    // 最终状态截图
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'step5-final-state.png'),
      fullPage: true 
    });
    
    // 打印测试报告
    console.log('\n' + '='.repeat(70));
    console.log('📊 测试报告 - Admin Dashboard');
    console.log('='.repeat(70));
    
    console.log('\n📸 截图记录:');
    screenshots.forEach(s => {
      console.log(`   步骤${s.step}: ${s.url}`);
      console.log(`          截图: ${s.file}`);
    });
    
    console.log('\n❌ 控制台错误:');
    if (consoleErrors.length > 0) {
      consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log(`   ${i+1}. [${err.type}] ${err.text}`);
        if (err.location && err.location.url) {
          console.log(`      位置: ${err.location.url}:${err.location.lineNumber}`);
        }
      });
      if (consoleErrors.length > 10) {
        console.log(`   ... 还有 ${consoleErrors.length - 10} 个错误`);
      }
    } else {
      console.log('   无控制台错误 ✓');
    }
    
    console.log('\n❌ 网络请求错误 (HTTP 4xx/5xx):');
    if (networkErrors.length > 0) {
      networkErrors.slice(0, 10).forEach((req, i) => {
        console.log(`   ${i+1}. ${req.status} ${req.statusText} - ${req.url}`);
      });
      if (networkErrors.length > 10) {
        console.log(`   ... 还有 ${networkErrors.length - 10} 个错误`);
      }
    } else {
      console.log('   无网络请求错误 ✓');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ 测试完成!');
    console.log('='.repeat(70));
    console.log(`\n截图保存在: ${screenshotsDir}`);
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    
    // 即使出错也截图
    try {
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'error-state.png'),
        fullPage: true 
      });
      console.log(`错误截图已保存: ${path.join(screenshotsDir, 'error-state.png')}`);
    } catch (e) {
      console.error('无法保存错误截图:', e.message);
    }
  } finally {
    await browser.close();
  }
}

testAdminDashboard().catch(console.error);
