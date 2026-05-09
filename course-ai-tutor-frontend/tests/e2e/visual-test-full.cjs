// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Screenshot directory
const screenshotsDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('AI Tutor Full Visual Test Report', () => {
  test.setTimeout(120000);

  test('TC01 - Login Page Visual Test', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-login-page.png'),
      fullPage: true 
    });
    
    const h1Visible = await page.locator('h1').first().isVisible().catch(() => false);
    expect(h1Visible).toBeTruthy();
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-login-form.png'),
      fullPage: true 
    });
    
    const usernameInput = page.locator('input[placeholder*="username"]');
    const passwordInput = page.locator('input[placeholder*="password"]');
    
    await usernameInput.fill('testuser');
    await passwordInput.fill('testpassword123');
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-login-filled.png'),
      fullPage: true 
    });
    
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(5000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-login-success.png'),
      fullPage: true 
    });
    
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
  });

  test('TC02 - Navigation Visual Test', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await page.locator('input[placeholder*="username"]').fill('testuser');
    await page.locator('input[placeholder*="password"]').fill('testpassword123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(5000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-dashboard.png'),
      fullPage: true 
    });
    
    const navItems = [
      { name: 'Helper', filename: '02-nav-helper' },
      { name: 'Planner', filename: '02-nav-planner' },
      { name: 'Tutor', filename: '02-nav-tutor' },
      { name: 'Evaluator', filename: '02-nav-evaluator' },
      { name: 'Companion', filename: '02-nav-companion' }
    ];
    
    for (const item of navItems) {
      await page.getByText(item.name).first().click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, `${item.filename}.png`),
        fullPage: true 
      });
    }
  });

  test('TC03 - Helper Agent Visual Test', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await page.locator('input[placeholder*="username"]').fill('testuser');
    await page.locator('input[placeholder*="password"]').fill('testpassword123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(5000);
    await page.getByText('Helper').first().click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-helper-init.png'),
      fullPage: true 
    });
    
    const input = page.locator('textarea').first().isVisible().catch(() => false) 
      ? page.locator('textarea').first()
      : page.locator('input[type="text"]').first();
    
    await input.fill('What is JavaScript closure?');
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-helper-question.png'),
      fullPage: true 
    });
    
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(10000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-helper-answer.png'),
      fullPage: true 
    });
  });

  test('TC04 - Planner Agent Visual Test', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await page.locator('input[placeholder*="username"]').fill('testuser');
    await page.locator('input[placeholder*="password"]').fill('testpassword123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(5000);
    await page.getByText('Planner').first().click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-planner-init.png'),
      fullPage: true 
    });
    
    const input = page.locator('textarea').first().isVisible().catch(() => false) 
      ? page.locator('textarea').first()
      : page.locator('input[type="text"]').first();
    
    await input.fill('I want to learn React in 3 months');
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-planner-goal.png'),
      fullPage: true 
    });
    
    await page.getByRole('button', { name: 'Generate' }).click();
    await page.waitForTimeout(15000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-planner-result.png'),
      fullPage: true 
    });
  });

  test('TC05 - Multi-Agent Collaboration Visual Test', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await page.locator('input[placeholder*="username"]').fill('testuser');
    await page.locator('input[placeholder*="password"]').fill('testpassword123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(5000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '05-main-dashboard.png'),
      fullPage: true 
    });
    
    await page.getByText('Helper').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '05-collab-helper.png'),
      fullPage: true 
    });
    
    await page.getByText('Planner').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '05-collab-planner.png'),
      fullPage: true 
    });
    
    await page.getByText('Evaluator').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '05-collab-evaluator.png'),
      fullPage: true 
    });
    
    await page.getByText('Companion').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '05-collab-companion.png'),
      fullPage: true 
    });
  });
});
