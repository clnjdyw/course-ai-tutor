# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-login.spec.cjs >> 登录注册模块 >> TC06 - 注册表单验证：密码不一致
- Location: tests\e2e\01-login.spec.cjs:53:3

# Error details

```
TimeoutError: page.fill: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('input[placeholder="请输入用户名"]')
    - locator resolved to <input type="text" tabindex="0" autocomplete="off" id="el-id-4666-12" placeholder="请输入用户名" class="el-input__inner"/>
    - fill("testuser")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    20 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e10]:
  - generic [ref=e12]:
    - img [ref=e15]
    - heading "课程辅导 AI" [level=1] [ref=e18]
    - paragraph [ref=e19]: 智能学习伙伴
  - generic [ref=e20]:
    - tablist [ref=e24]:
      - tab "登录" [ref=e26]
      - tab "注册" [active] [selected] [ref=e27]
    - tabpanel "注册" [ref=e29]:
      - radiogroup "radio-group" [ref=e31]:
        - generic [ref=e32]:
          - radio "🎓 学生" [checked] [ref=e33]
          - generic [ref=e34] [cursor=pointer]:
            - generic [ref=e35]: 🎓
            - text: 学生
        - generic [ref=e36]:
          - radio "👨‍🏫 教师" [ref=e37]
          - generic [ref=e38] [cursor=pointer]:
            - generic [ref=e39]: 👨‍🏫
            - text: 教师
      - generic [ref=e40]:
        - generic [ref=e44]:
          - img [ref=e47]
          - textbox "请输入用户名（3-20 位）" [ref=e49]
        - generic [ref=e53]:
          - img [ref=e56]
          - textbox "请输入邮箱" [ref=e59]
        - generic [ref=e63]:
          - img [ref=e66]
          - textbox "请输入密码（至少 6 位）" [ref=e69]
        - generic [ref=e73]:
          - img [ref=e76]
          - textbox "请确认密码" [ref=e79]
        - button "注册" [ref=e82] [cursor=pointer]:
          - generic [ref=e83]:
            - img [ref=e85]
            - text: 注册
  - paragraph [ref=e89]:
    - text: 登录即代表您同意
    - generic [ref=e91] [cursor=pointer]: 用户协议
    - text: 和
    - generic [ref=e93] [cursor=pointer]: 隐私政策
```

# Test source

```ts
  1  | // @ts-check
  2  | const { test, expect } = require('@playwright/test');
  3  | 
  4  | /**
  5  |  * 测试 1: 登录/注册页
  6  |  * 验证页面渲染、表单验证、角色选择、管理员入口
  7  |  */
  8  | test.describe('登录注册模块', () => {
  9  | 
  10 |   test.beforeEach(async ({ page }) => {
  11 |     await page.goto('/login');
  12 |     await page.waitForLoadState('networkidle');
  13 |   });
  14 | 
  15 |   test('TC01 - 登录页正确渲染核心元素', async ({ page }) => {
  16 |     await expect(page.locator('.app-title')).toHaveText('课程辅导 AI');
  17 |     await expect(page.locator('.app-subtitle')).toHaveText('智能学习伙伴');
  18 |     await expect(page.locator('.login-tabs')).toBeVisible();
  19 |     await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
  20 |   });
  21 | 
  22 |   test('TC02 - 切换到注册标签页', async ({ page }) => {
  23 |     await page.getByRole('tab', { name: '注册' }).click();
  24 |     await expect(page.getByRole('button', { name: '注册' })).toBeVisible();
  25 |     await expect(page.locator('input[placeholder*="邮箱"]')).toBeVisible();
  26 |   });
  27 | 
  28 |   test('TC03 - 登录表单验证：空字段', async ({ page }) => {
  29 |     await page.getByRole('button', { name: '登录' }).click();
  30 |     await expect(page.locator('.el-form-item__error').first()).toBeVisible();
  31 |   });
  32 | 
  33 |   test('TC04 - 登录表单验证：密码少于 6 位', async ({ page }) => {
  34 |     await page.fill('input[placeholder="请输入用户名"]', 'testuser');
  35 |     await page.fill('input[placeholder="请输入密码"]', '123');
  36 |     await page.getByRole('button', { name: '登录' }).click();
  37 |     await expect(page.locator('.el-form-item__error')).toBeVisible();
  38 |   });
  39 | 
  40 |   test('TC05 - 注册表单验证：邮箱格式错误', async ({ page }) => {
  41 |     await page.getByRole('tab', { name: '注册' }).click();
  42 |     await page.fill('input[placeholder="请输入用户名"]', 'testuser');
  43 |     await page.fill('input[placeholder="请输入邮箱"]', 'invalid-email');
  44 |     await page.fill('input[placeholder="请输入密码（至少 6 位）"]', '123456');
  45 |     await page.fill('input[placeholder="请确认密码"]', '123456');
  46 |     await page.getByRole('button', { name: '注册' }).click();
  47 |     await page.waitForTimeout(500);
  48 |     const emailError = page.locator('.el-form-item__error');
  49 |     const count = await emailError.count();
  50 |     expect(count).toBeGreaterThanOrEqual(1);
  51 |   });
  52 | 
  53 |   test('TC06 - 注册表单验证：密码不一致', async ({ page }) => {
  54 |     await page.getByRole('tab', { name: '注册' }).click();
> 55 |     await page.fill('input[placeholder="请输入用户名"]', 'testuser');
     |                ^ TimeoutError: page.fill: Timeout 10000ms exceeded.
  56 |     await page.fill('input[placeholder="请输入邮箱"]', 'test@example.com');
  57 |     await page.fill('input[placeholder="请输入密码（至少 6 位）"]', '123456');
  58 |     await page.fill('input[placeholder="请确认密码"]', '654321');
  59 |     await page.getByRole('button', { name: '注册' }).click();
  60 |     await page.waitForTimeout(500);
  61 |     const errors = page.locator('.el-form-item__error');
  62 |     const count = await errors.count();
  63 |     expect(count).toBeGreaterThanOrEqual(1);
  64 |   });
  65 | 
  66 |   test('TC07 - 角色选择：学生/教师切换', async ({ page }) => {
  67 |     await expect(page.locator('.el-radio-button.is-active')).toContainText('学生');
  68 |     await page.getByRole('radio', { name: /教师/ }).click();
  69 |     await expect(page.locator('.el-radio-button.is-active')).toContainText('教师');
  70 |   });
  71 | 
  72 |   test('TC08 - 教师注册时显示额外字段', async ({ page }) => {
  73 |     await page.getByRole('tab', { name: '注册' }).click();
  74 |     await page.getByRole('radio', { name: /教师/ }).click();
  75 |     await expect(page.locator('input[placeholder="请输入教师编号"]')).toBeVisible();
  76 |     await expect(page.locator('input[placeholder="请输入教学科目"]')).toBeVisible();
  77 |   });
  78 | 
  79 |   test('TC09 - 管理员入口可点击', async ({ page }) => {
  80 |     await page.getByText('管理员入口').click();
  81 |     await expect(page.locator('.el-message')).toContainText('管理员');
  82 |   });
  83 | 
  84 |   test('TC10 - 学生注册字段', async ({ page }) => {
  85 |     await page.getByRole('tab', { name: '注册' }).click();
  86 |     await expect(page.locator('input[placeholder="请输入教师编号"]')).not.toBeVisible();
  87 |   });
  88 | });
  89 | 
```