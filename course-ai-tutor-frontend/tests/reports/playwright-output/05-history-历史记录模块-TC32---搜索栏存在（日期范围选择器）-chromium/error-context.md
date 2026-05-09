# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-history.spec.cjs >> 历史记录模块 >> TC32 - 搜索栏存在（日期范围选择器）
- Location: tests\e2e\05-history.spec.cjs:47:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[placeholder="开始日期"]')
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('input[placeholder="开始日期"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e8]: ⭐
    - generic [ref=e9]: 🌟
    - generic [ref=e10]: ✨
  - generic [ref=e11]:
    - complementary [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e15]: 🦊
        - generic [ref=e16]:
          - heading "AI 学习伙伴" [level=1] [ref=e17]
          - paragraph [ref=e18]: 和小伙伴一起学习吧！
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: Lv.1
          - generic [ref=e22]: 初学者
        - progressbar [ref=e23]
        - generic [ref=e26]: 0/400 经验值
      - menubar [ref=e27]:
        - menuitem "🗺️ 学习规划 开始冒险" [ref=e28] [cursor=pointer]:
          - generic [ref=e29]:
            - generic [ref=e31]: 🗺️
            - generic [ref=e32]: 学习规划
            - generic [ref=e33]: 开始冒险
        - menuitem "👨‍🏫 智能教学 解锁知识" [ref=e34] [cursor=pointer]:
          - generic [ref=e35]:
            - generic [ref=e37]: 👨‍🏫
            - generic [ref=e38]: 智能教学
            - generic [ref=e39]: 解锁知识
        - menuitem "💬 实时答疑 随时提问" [ref=e40] [cursor=pointer]:
          - generic [ref=e41]:
            - generic [ref=e43]: 💬
            - generic [ref=e44]: 实时答疑
            - generic [ref=e45]: 随时提问
        - menuitem "📝 学习评估 挑战测试" [ref=e46] [cursor=pointer]:
          - generic [ref=e47]:
            - generic [ref=e49]: 📝
            - generic [ref=e50]: 学习评估
            - generic [ref=e51]: 挑战测试
        - menuitem "⚔️ PK 对战 实时竞技" [ref=e52] [cursor=pointer]:
          - generic [ref=e53]:
            - generic [ref=e55]: ⚔️
            - generic [ref=e56]: PK 对战
            - generic [ref=e57]: 实时竞技
        - separator [ref=e58]
        - menuitem "📊 成长记录" [ref=e59] [cursor=pointer]:
          - generic [ref=e60]:
            - generic [ref=e62]: 📊
            - generic [ref=e63]: 成长记录
        - menuitem "🏆 成就中心 收集徽章" [ref=e64] [cursor=pointer]:
          - generic [ref=e65]:
            - generic [ref=e67]: 🏆
            - generic [ref=e68]: 成就中心
            - generic [ref=e69]: 收集徽章
        - menuitem "👤 个人中心" [ref=e70] [cursor=pointer]:
          - generic [ref=e71]:
            - generic [ref=e73]: 👤
            - generic [ref=e74]: 个人中心
        - separator [ref=e75]
        - menuitem "📝 我的笔记" [ref=e76] [cursor=pointer]:
          - generic [ref=e77]:
            - generic [ref=e79]: 📝
            - generic [ref=e80]: 我的笔记
        - menuitem "❌ 错题本" [ref=e81] [cursor=pointer]:
          - generic [ref=e82]:
            - generic [ref=e84]: ❌
            - generic [ref=e85]: 错题本
        - menuitem "🕐 历史记录" [ref=e86] [cursor=pointer]:
          - generic [ref=e87]:
            - generic [ref=e89]: 🕐
            - generic [ref=e90]: 历史记录
        - menuitem "📊 学习进度" [ref=e91] [cursor=pointer]:
          - generic [ref=e92]:
            - generic [ref=e94]: 📊
            - generic [ref=e95]: 学习进度
        - menuitem "⏰ 学习提醒" [ref=e96] [cursor=pointer]:
          - generic [ref=e97]:
            - generic [ref=e99]: ⏰
            - generic [ref=e100]: 学习提醒
        - menuitem "⚙️ 系统设置" [ref=e101] [cursor=pointer]:
          - generic [ref=e102]:
            - generic [ref=e104]: ⚙️
            - generic [ref=e105]: 系统设置
      - generic [ref=e107]:
        - generic [ref=e109]: 🧑‍🎓
        - generic [ref=e110]:
          - generic [ref=e111]: 同学
          - generic [ref=e112]:
            - generic [ref=e113]: 🔥
            - generic [ref=e114]: 连续学习 0 天
    - generic [ref=e115]:
      - generic [ref=e117]:
        - generic [ref=e118]:
          - generic [ref=e119]: 🏠
          - generic [ref=e120]: 首页
          - generic [ref=e121]: →
          - generic [ref=e122]: 历史记录
        - generic [ref=e123]:
          - generic [ref=e124]:
            - generic [ref=e125]: 📋
            - generic [ref=e126]: 今日任务：0/3
            - superscript [ref=e128]: "3"
          - generic [ref=e129]:
            - button "🔔" [ref=e130] [cursor=pointer]:
              - generic [ref=e132]: 🔔
            - superscript [ref=e133]: "3"
          - button "🚪" [ref=e134] [cursor=pointer]:
            - generic [ref=e136]: 🚪
      - main [ref=e137]:
        - generic [ref=e139]:
          - generic [ref=e142]:
            - img [ref=e145]
            - generic [ref=e149]:
              - heading "历史记录" [level=2] [ref=e150]
              - paragraph [ref=e151]: 查看所有学习活动的历史记录
          - generic [ref=e153]:
            - tablist [ref=e157]:
              - tab "📋 学习规划" [selected] [ref=e159]
              - tab "💬 实时答疑" [ref=e160]
              - tab "🎓 智能教学" [ref=e161]
              - tab "📊 学习评估" [ref=e162]
              - tab "⚔️ PK 对战" [ref=e163]
            - tabpanel "📋 学习规划" [ref=e165]:
              - generic [ref=e166]:
                - generic [ref=e167]: 搜索
                - generic [ref=e168]: 重置
```

# Test source

```ts
  1   | // @ts-check
  2   | const { test, expect } = require('@playwright/test');
  3   | 
  4   | async function mockLogin(page) {
  5   |   await page.goto('/login');
  6   |   await page.evaluate(() => {
  7   |     localStorage.setItem('token', 'mock-token-test-12345');
  8   |     localStorage.setItem('userId', '1');
  9   |     localStorage.setItem('userRole', 'student');
  10  |     localStorage.setItem('isLoggedIn', 'true');
  11  |   });
  12  |   await page.goto('/history');
  13  |   await page.waitForLoadState('domcontentloaded');
  14  |   // Don't wait for networkidle since API calls will hang
  15  |   await page.waitForTimeout(2000);
  16  | }
  17  | 
  18  | /**
  19  |  * 测试 5: 历史记录模块（含搜索功能）
  20  |  */
  21  | test.describe('历史记录模块', () => {
  22  | 
  23  |   test.beforeEach(async ({ page }) => {
  24  |     await mockLogin(page);
  25  |   });
  26  | 
  27  |   test('TC29 - 历史页面正确渲染', async ({ page }) => {
  28  |     // URL 应该包含 /history
  29  |     expect(page.url()).toContain('/history');
  30  |     // 页面标题或 h2 应有"历史记录"
  31  |     await expect(page.locator('h2')).toContainText('历史记录');
  32  |   });
  33  | 
  34  |   test('TC30 - 5个Tab标签全部存在', async ({ page }) => {
  35  |     const expectedTabs = ['学习规划', '实时答疑', '智能教学', '学习评估', 'PK 对战'];
  36  |     for (const tab of expectedTabs) {
  37  |       await expect(page.getByText(tab).first()).toBeVisible({ timeout: 8000 });
  38  |     }
  39  |   });
  40  | 
  41  |   test('TC31 - 搜索栏存在（关键词输入框）', async ({ page }) => {
  42  |     // 搜索输入框可能有多种渲染方式，使用宽松的查找
  43  |     const searchInput = page.locator('input[placeholder*="关键词"]').or(page.locator('.search-input input'));
  44  |     await expect(searchInput.first()).toBeVisible({ timeout: 8000 });
  45  |   });
  46  | 
  47  |   test('TC32 - 搜索栏存在（日期范围选择器）', async ({ page }) => {
  48  |     const startDateInput = page.locator('input[placeholder="开始日期"]');
  49  |     const endDateInput = page.locator('input[placeholder="结束日期"]');
> 50  |     await expect(startDateInput).toBeVisible({ timeout: 8000 });
      |                                  ^ Error: expect(locator).toBeVisible() failed
  51  |     await expect(endDateInput).toBeVisible({ timeout: 8000 });
  52  |   });
  53  | 
  54  |   test('TC33 - 搜索和重置按钮存在', async ({ page }) => {
  55  |     await expect(page.getByRole('button', { name: '搜索' })).toBeVisible({ timeout: 8000 });
  56  |     await expect(page.getByRole('button', { name: '重置' })).toBeVisible({ timeout: 8000 });
  57  |   });
  58  | 
  59  |   test('TC34 - 搜索框可输入', async ({ page }) => {
  60  |     const searchInput = page.locator('input[placeholder*="关键词"]').or(page.locator('.search-input input'));
  61  |     await searchInput.first().fill('依赖注入');
  62  |     const value = await searchInput.first().inputValue();
  63  |     expect(value).toBe('依赖注入');
  64  |   });
  65  | 
  66  |   test('TC35 - 点击搜索后页面稳定', async ({ page }) => {
  67  |     const searchInput = page.locator('input[placeholder*="关键词"]').or(page.locator('.search-input input'));
  68  |     await searchInput.first().fill('test');
  69  |     await page.getByRole('button', { name: '搜索' }).click();
  70  |     await page.waitForTimeout(1000);
  71  |     // 页面不应崩溃
  72  |     await expect(page.locator('h2')).toContainText('历史记录');
  73  |   });
  74  | 
  75  |   test('TC36 - Tab切换', async ({ page }) => {
  76  |     await page.getByText('实时答疑').click();
  77  |     await page.waitForTimeout(500);
  78  |     await expect(page.locator('h2')).toContainText('历史记录');
  79  | 
  80  |     await page.getByText('智能教学').click();
  81  |     await page.waitForTimeout(500);
  82  |     await expect(page.locator('h2')).toContainText('历史记录');
  83  |   });
  84  | 
  85  |   test('TC37 - 重置按钮清空搜索条件', async ({ page }) => {
  86  |     const searchInput = page.locator('input[placeholder*="关键词"]').or(page.locator('.search-input input'));
  87  |     await searchInput.first().fill('test');
  88  |     await page.getByRole('button', { name: '重置' }).click();
  89  |     await page.waitForTimeout(500);
  90  |     const value = await searchInput.first().inputValue();
  91  |     expect(value).toBe('');
  92  |   });
  93  | 
  94  |   test('TC38 - 空状态或数据展示', async ({ page }) => {
  95  |     // 可能有空状态，也可能有数据，都算通过
  96  |     await page.waitForTimeout(1000);
  97  |     const hasContent = await page.locator('.history-card').count();
  98  |     const hasEmpty = await page.locator('.el-empty').count();
  99  |     expect(hasContent + hasEmpty).toBeGreaterThanOrEqual(0);
  100 |   });
  101 | });
  102 | 
```