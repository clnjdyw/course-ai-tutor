// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', '..', 'test-screenshots');

test.describe('Admin Dashboard - Role Detection Fix Verification', () => {
  test('should login as admin and verify admin role detection', async ({ page }) => {
    // Collect console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Track errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Step 1: Clear localStorage and navigate to login page
    console.log('\n=== Step 1: Clear storage and navigate to login ===');
    await page.context().clearCookies();
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });
    
    // Verify we're on login page
    await expect(page).toHaveURL(/.*\/login/);
    console.log('Successfully navigated to login page');
    
    // Screenshot: Login page
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step1-login-page.png'),
      fullPage: true
    });
    console.log('Screenshot saved: step1-login-page.png');

    // Step 2: Login with admin credentials
    console.log('\n=== Step 2: Login with admin credentials ===');
    
    // Wait for login form to be visible
    await page.waitForSelector('input[placeholder="请输入用户名"]', { state: 'visible' });
    
    // Fill username
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    console.log('Entered username: admin');
    
    // Fill password
    await page.fill('input[placeholder="请输入密码"]', 'admin123456');
    console.log('Entered password: admin123456');
    
    // Click login button
    await page.click('button:has-text("登录")');
    console.log('Clicked login button');
    
    // Wait for login to complete and notification to appear
    await page.waitForTimeout(2000);
    
    // Screenshot: After login attempt
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step2-after-login.png'),
      fullPage: true
    });
    console.log('Screenshot saved: step2-after-login.png');

    // Step 3: Verify user role is set to 'admin'
    console.log('\n=== Step 3: Verify admin role ===');
    
    // Check localStorage for user role
    const userRole = await page.evaluate(() => localStorage.getItem('userRole'));
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const isLoggedIn = await page.evaluate(() => localStorage.getItem('isLoggedIn'));
    
    console.log('localStorage.userRole:', userRole);
    console.log('localStorage.token:', token);
    console.log('localStorage.isLoggedIn:', isLoggedIn);
    
    // Verify role is admin
    expect(userRole).toBe('admin');
    console.log('✅ User role is correctly set to: admin');
    
    // Verify token contains admin role
    expect(token).toContain('admin');
    console.log('✅ Token contains admin role');

    // Step 4: Check current URL (should redirect to /admin or /planner)
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step3-current-state.png'),
      fullPage: true
    });
    console.log('Screenshot saved: step3-current-state.png');

    // Step 5: Navigate to /admin dashboard
    console.log('\n=== Step 4: Navigate to /admin dashboard ===');
    await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // Verify we're on admin page
    const adminUrl = page.url();
    console.log('Admin page URL:', adminUrl);
    
    // Screenshot: Admin dashboard
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step4-admin-dashboard.png'),
      fullPage: true
    });
    console.log('Screenshot saved: step4-admin-dashboard.png');

    // Step 6: Verify sidebar navigation
    console.log('\n=== Step 5: Verify sidebar navigation ===');
    
    // Check sidebar exists
    const sidebarVisible = await page.isVisible('.sidebar');
    console.log('Sidebar visible:', sidebarVisible);
    expect(sidebarVisible).toBe(true);
    
    // Check sidebar header with logo
    const logoVisible = await page.isVisible('.sidebar-header');
    console.log('Sidebar header visible:', logoVisible);
    
    // Check navigation items
    const navItems = await page.locator('.nav-item').all();
    console.log('Number of nav items:', navItems.length);
    
    // Get all nav item labels
    const navLabels = await page.locator('.nav-label').allTextContents();
    console.log('Navigation items:', navLabels);
    
    // Verify expected navigation items exist
    const expectedItems = ['实时大盘', '用户管理', '子管理员', '操作日志', '通知管理', '教学资源', '学情报表', '安全中心', '系统设置', '数据管理'];
    for (const item of expectedItems) {
      const exists = navLabels.includes(item);
      console.log(`Nav item "${item}" exists:`, exists);
      expect(exists).toBe(true);
    }
    console.log('✅ All expected navigation items are present');

    // Check sidebar footer with user info
    const userInfoVisible = await page.isVisible('.sidebar-footer');
    console.log('Sidebar footer visible:', userInfoVisible);
    
    // Check user name in sidebar
    const userName = await page.locator('.user-name').textContent();
    console.log('User name in sidebar:', userName);
    
    // Check user role in sidebar
    const userRoleText = await page.locator('.user-role').textContent();
    console.log('User role in sidebar:', userRoleText);

    // Screenshot: Full admin dashboard with sidebar
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step5-admin-dashboard-full.png'),
      fullPage: true
    });
    console.log('Screenshot saved: step5-admin-dashboard-full.png');

    // Step 7: Verify dashboard content
    console.log('\n=== Step 6: Verify dashboard content ===');
    
    // Check page title
    const pageTitle = await page.locator('.page-title').textContent();
    console.log('Page title:', pageTitle);
    expect(pageTitle).toBe('实时大盘');
    
    // Check page subtitle
    const pageSubtitle = await page.locator('.page-subtitle').textContent();
    console.log('Page subtitle:', pageSubtitle);
    
    // Check stat cards
    const statCards = await page.locator('.stat-card').all();
    console.log('Number of stat cards:', statCards.length);
    expect(statCards.length).toBe(4);
    
    // Get stat card values
    const statValues = await page.locator('.stat-card__value').allTextContents();
    console.log('Stat card values:', statValues);
    
    // Get stat card labels
    const statLabels = await page.locator('.stat-card__label').allTextContents();
    console.log('Stat card labels:', statLabels);
    
    // Check metric cards
    const metricCards = await page.locator('.metric-card').all();
    console.log('Number of metric cards:', metricCards.length);
    
    // Check AI section
    const aiSectionVisible = await page.isVisible('.ai-section');
    console.log('AI section visible:', aiSectionVisible);

    // Screenshot: Dashboard metrics
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step6-dashboard-metrics.png'),
      fullPage: false
    });
    console.log('Screenshot saved: step6-dashboard-metrics.png');

    // Step 8: Test navigation between tabs
    console.log('\n=== Step 7: Test navigation tabs ===');
    
    // Click on "用户管理" tab
    await page.click('.nav-item:has-text("用户管理")');
    await page.waitForTimeout(1000);
    
    const usersTabTitle = await page.locator('.page-title').textContent();
    console.log('Users tab title:', usersTabTitle);
    expect(usersTabTitle).toBe('用户管理');
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step7-users-tab.png'),
      fullPage: true
    });
    console.log('Screenshot saved: step7-users-tab.png');

    // Click on "安全中心" tab
    await page.click('.nav-item:has-text("安全中心")');
    await page.waitForTimeout(1000);
    
    const securityTabTitle = await page.locator('.page-title').textContent();
    console.log('Security tab title:', securityTabTitle);
    expect(securityTabTitle).toBe('安全中心');
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'step8-security-tab.png'),
      fullPage: true
    });
    console.log('Screenshot saved: step8-security-tab.png');

    // Navigate back to dashboard
    await page.click('.nav-item:has-text("实时大盘")');
    await page.waitForTimeout(1000);

    // Step 9: Check console for errors
    console.log('\n=== Step 8: Check console for errors ===');
    
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    
    console.log('Console errors count:', errors.length);
    console.log('Console warnings count:', warnings.length);
    
    if (errors.length > 0) {
      console.log('Console errors:');
      errors.forEach(e => console.log('  -', e.text));
    }
    
    if (warnings.length > 0) {
      console.log('Console warnings:');
      warnings.forEach(w => console.log('  -', w.text));
    }

    // Check for page errors (JavaScript errors)
    if (pageErrors.length > 0) {
      console.log('Page errors:');
      pageErrors.forEach(e => console.log('  -', e));
    }

    // Final summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log('1. Login with admin credentials: ✅ PASSED');
    console.log('2. User role detection (admin): ✅ PASSED - role =', userRole);
    console.log('3. Token contains admin role: ✅ PASSED');
    console.log('4. Admin dashboard loads: ✅ PASSED');
    console.log('5. Sidebar navigation visible: ✅ PASSED');
    console.log('6. All nav items present: ✅ PASSED');
    console.log('7. Dashboard content correct: ✅ PASSED');
    console.log('8. Tab navigation works: ✅ PASSED');
    console.log('9. Console errors:', errors.length > 0 ? '⚠️ FOUND' : '✅ NONE');
    console.log('10. Page errors:', pageErrors.length > 0 ? '⚠️ FOUND' : '✅ NONE');
    console.log('========================================');
    console.log('Screenshots saved to:', SCREENSHOT_DIR);
    console.log('========================================\n');

    // Final verification
    expect(userRole).toBe('admin');
    expect(sidebarVisible).toBe(true);
    expect(pageTitle).toBe('实时大盘');
  });
});
