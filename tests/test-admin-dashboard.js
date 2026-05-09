const { chromium } = require('@playwright/test');
const path = require('path');

async function testAdminDashboard() {
  console.log('🚀 开始测试 Admin Dashboard...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: path.join(__dirname, 'test-videos'),
      size: { width: 1280, height: 720 }
    }
  });
  
  const page = await context.newPage();
  const consoleErrors = [];
  
  // 收集控制台错误
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        type: 'console',
        text: msg.text(),
        location: msg.location()
      });
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push({
      type: 'pageerror',
      text: error.message
    });
  });
  
  const screenshots = [];
  
  try {
    // 步骤1: 访问首页，检查是否重定向到登录页
    console.log('\n📍 步骤1: 访问首页 (http://localhost:3001)');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    const url1 = page.url();
    console.log(`   当前URL: ${url1}`);
    
    await page.screenshot({ 
      path: path.join(__dirname, 'screenshots', 'step1-home.png'),
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
    console.log(`   当前URL: ${url2}`);
    
    await page.screenshot({ 
      path: path.join(__dirname, 'screenshots', 'step2-admin-direct.png'),
      fullPage: true 
    });
    screenshots.push({ step: 2, url: url2, file: 'step2-admin-direct.png' });
    
    // 检查页面内容
    const pageTitle = await page.title();
    console.log(`   页面标题: ${pageTitle}`);
    
    const pageContent = await page.content();
    const hasLoginForm = pageContent.includes('登录') || pageContent.includes('login');
    console.log(`   包含登录表单: ${hasLoginForm}`);
    
    // 步骤3: 如果重定向到登录页，执行登录
    if (url2.includes('/login') || hasLoginForm) {
      console.log('\n📍 步骤3: 执行管理员登录');
      
      // 查找用户名输入框
      const usernameInput = await page.$('input[placeholder*="用户名"], input[placeholder*="账号"], input[type="text"]');
      
      // 尝试找到登录表单的输入框
      const inputs = await page.$$('input');
      console.log(`   找到 ${inputs.length} 个输入框`);
      
      // 尝试使用更通用的选择器
      const usernameField = await page.$('input[name="username"], input[name="account"], input[type="text"]:not([type="password"])');
      const passwordField = await page.$('input[type="password"]');
      
      if (usernameField && passwordField) {
        console.log('   找到登录表单字段，开始填写...');
        
        await usernameField.click();
        await usernameField.fill('admin');
        
        await passwordField.click();
        await passwordField.fill('admin123456');
        
        // 查找登录按钮
        const loginButton = await page.$('button:has-text("登录"), button:has-text("Login"), .el-button--primary');
        
        if (loginButton) {
          await loginButton.click();
          console.log('   点击登录按钮');
          
          // 等待导航完成
          await page.waitForNavigation({ 
            waitUntil: 'networkidle',
            timeout: 15000 
          }).catch(e => console.log('   导航超时，继续...'));
          
          // 等待一下让页面加载
          await page.waitForTimeout(2000);
          
          const url3 = page.url();
          console.log(`   登录后URL: ${url3}`);
          
          await page.screenshot({ 
            path: path.join(__dirname, 'screenshots', 'step3-after-login.png'),
            fullPage: true 
          });
          screenshots.push({ step: 3, url: url3, file: 'step3-after-login.png' });
          
          // 步骤4: 尝试访问 /admin 页面
          console.log('\n📍 步骤4: 登录后访问 /admin');
          await page.goto('http://localhost:3001/admin', { 
            waitUntil: 'networkidle',
            timeout: 30000 
          });
          
          const url4 = page.url();
          console.log(`   访问/admin后URL: ${url4}`);
          
          await page.screenshot({ 
            path: path.join(__dirname, 'screenshots', 'step4-admin-after-login.png'),
            fullPage: true 
          });
          screenshots.push({ step: 4, url: url4, file: 'step4-admin-after-login.png' });
          
          const title4 = await page.title();
          console.log(`   页面标题: ${title4}`);
          
          // 检查是否看到admin dashboard的内容
          const content4 = await page.content();
          const hasAdminContent = content4.includes('Admin Panel') || 
                                 content4.includes('后台管理') || 
                                 content4.includes('用户管理');
          console.log(`   包含Admin Dashboard内容: ${hasAdminContent}`);
          
        } else {
          console.log('   ⚠️ 未找到登录按钮');
        }
      } else {
        console.log('   ⚠️ 未找到登录表单字段');
        
        // 截图显示当前状态
        await page.screenshot({ 
          path: path.join(__dirname, 'screenshots', 'step3-login-form-not-found.png'),
          fullPage: true 
        });
      }
    } else {
      console.log('\n✅ 成功访问/admin页面，无需登录');
    }
    
    // 步骤5: 检查localStorage中的认证信息
    console.log('\n📍 步骤5: 检查认证状态');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const userRole = await page.evaluate(() => localStorage.getItem('userRole'));
    const isAdmin = await page.evaluate(() => localStorage.getItem('isAdmin'));
    
    console.log(`   Token: ${token ? token.substring(0, 50) + '...' : '无'}`);
    console.log(`   用户角色: ${userRole || '未设置'}`);
    console.log(`   是否管理员: ${isAdmin || '未设置'}`);
    
    // 步骤6: 检查网络请求错误
    console.log('\n📍 步骤6: 检查网络请求');
    const failedRequests = [];
    
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // 最终截图
    await page.screenshot({ 
      path: path.join(__dirname, 'screenshots', 'step6-final-state.png'),
      fullPage: true 
    });
    
    // 打印结果
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试报告');
    console.log('='.repeat(60));
    
    console.log('\n📸 截图记录:');
    screenshots.forEach(s => {
      console.log(`   步骤${s.step}: ${s.url}`);
      console.log(`          -> ${s.file}`);
    });
    
    console.log('\n❌ 控制台错误:');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((err, i) => {
        console.log(`   ${i+1}. [${err.type}] ${err.text}`);
        if (err.location) {
          console.log(`      位置: ${err.location.url}:${err.location.lineNumber}`);
        }
      });
    } else {
      console.log('   无控制台错误');
    }
    
    console.log('\n❌ 失败的请求:');
    if (failedRequests.length > 0) {
      failedRequests.forEach((req, i) => {
        console.log(`   ${i+1}. ${req.status} ${req.statusText} - ${req.url}`);
      });
    } else {
      console.log('   无失败请求');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 测试完成');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 即使出错也截图
    await page.screenshot({ 
      path: path.join(__dirname, 'screenshots', 'error-state.png'),
      fullPage: true 
    }).catch(() => {});
  } finally {
    await browser.close();
  }
}

// 确保screenshots目录存在
const fs = require('fs');
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

testAdminDashboard().catch(console.error);
