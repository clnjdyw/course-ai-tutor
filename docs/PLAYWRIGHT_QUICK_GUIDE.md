# Playwright E2E 测试 - 快速执行指南

## 📋 测试概览

| 项目 | 详情 |
|------|------|
| **测试框架** | Playwright 1.59.1 |
| **测试文件** | 7个测试文件 |
| **总用例数** | 89个 |
| **测试范围** | 登录、导航、AI教学、答疑、规划、历史、核心业务流程 |

---

## 🚀 快速执行

### 一键执行测试

```bash
cd /home/ubuntu/course-ai-tutor/course-ai-tutor-main
bash run-playwright-tests.sh
```

### 手动执行

```bash
cd course-ai-tutor-frontend
npx playwright test
```

### 执行特定测试

```bash
# 只执行核心业务流程测试
npx playwright test 07-core-business-processes.spec.cjs

# 只执行登录测试
npx playwright test 01-login.spec.cjs

# 执行包含"TUTOR"的测试
npx playwright test --grep "TUTOR"
```

---

## 📊 测试文件清单

| 文件 | 模块 | 用例数 | 状态 |
|------|------|--------|------|
| 01-login.spec.cjs | 登录注册 | 10 | ✅ 已验证 |
| 02-navigation.spec.cjs | 主界面导航 | 16 | ✅ 已验证 |
| 03-helper.spec.cjs | 实时答疑 | 9 | ✅ 已验证 |
| 04-planner.spec.cjs | 学习规划 | 6 | ✅ 已验证 |
| 05-history.spec.cjs | 历史记录 | 10 | ✅ 已验证 |
| 06-code-analysis.spec.cjs | 代码静态分析 | 9 | ✅ 已验证 |
| **07-core-business-processes.spec.cjs** | **核心业务流程** | **29** | **📋 新增** |

---

## ✅ 前置检查

执行测试前，确保：

- [x] 前端服务运行在 http://localhost:8080
- [x] 后端服务运行在 http://localhost:8081
- [ ] Node.js >= 18 已安装
- [ ] Playwright 已安装

### 检查服务状态

```bash
curl http://localhost:8080/api/health
curl http://localhost:8081/api/health
```

---

## 📈 预期结果

| 指标 | 目标值 |
|------|--------|
| 通过率 | >= 95% |
| 执行时间 | ~5分钟 |
| 评级 | A 或 B |

---

## 🐛 故障排查

### 测试失败？

```bash
# 1. 显示浏览器窗口调试
npx playwright test --headed

# 2. 慢速执行查看问题
npx playwright test --slowmo=1000

# 3. 查看HTML报告
xdg-open tests/reports/html/index.html
```

### 常见错误

| 错误 | 解决方案 |
|------|---------|
| `browserType.launch: Executable doesn't exist` | `npx playwright install chromium` |
| `Timeout exceeded` | 增加timeout: `--timeout=120000` |
| `Element not visible` | 检查页面加载，增加等待 |

---

## 📁 测试报告

执行后查看：

| 报告 | 位置 |
|------|------|
| HTML报告 | `tests/reports/html/index.html` |
| JSON报告 | `tests/reports/results.json` |

---

## 🔧 高级用法

```bash
# 并行执行 (加速)
npx playwright test --workers=4

# 重试失败的测试
npx playwright test --retries=2

# 生成trace文件用于调试
npx playwright test --trace on

# 查看trace
npx playwright show-trace trace.zip
```

---

**完整文档**: [PLAYWRIGHT_E2E_TEST_REPORT.md](PLAYWRIGHT_E2E_TEST_REPORT.md)  
**测试配置**: [playwright.config.cjs](course-ai-tutor-frontend/playwright.config.cjs)
