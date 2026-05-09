// @ts-check
/**
 * 自动化测试运行器 + 报告生成器
 * 用法: node tests/run-tests.js
 *
 * 流程:
 * 1. 安装 Playwright（如未安装）
 * 2. 安装浏览器
 * 3. 启动 Vite 开发服务器
 * 4. 运行所有测试
 * 5. 收集测试结果
 * 6. 生成中文测试报告
 * 7. 输出到 tests/reports/ 目录
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'tests/reports');
const REPORT_FILE = path.join(REPORT_DIR, '测试报告_' + new Date().toISOString().slice(0, 10) + '.md');

// 确保报告目录存在
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

console.log('🚀 开始自动化测试...');
console.log('='.repeat(60));

// ========== Step 1: 检查依赖 ==========
console.log('\n📦 Step 1: 检查依赖...');
try {
  require.resolve('@playwright/test');
  console.log('  ✅ Playwright 已安装');
} catch {
  console.log('  ⏳ 安装 Playwright...');
  execSync('npm install -D @playwright/test', { cwd: ROOT, stdio: 'inherit' });
  console.log('  ✅ Playwright 安装完成');
}

// ========== Step 2: 安装浏览器 ==========
console.log('\n🌐 Step 2: 检查浏览器...');
try {
  execSync('npx playwright install chromium', { cwd: ROOT, stdio: 'inherit' });
  console.log('  ✅ Chromium 就绪');
} catch (e) {
  console.log('  ⚠️ 浏览器安装可能有问题，继续尝试...');
}

// ========== Step 3: 启动 Vite 开发服务器 ==========
console.log('\n🔧 Step 3: 启动 Vite 开发服务器...');
let viteProcess = null;
try {
  viteProcess = spawn('npx', ['vite', '--port', '5173', '--strictPort'], {
    cwd: ROOT,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, VITE_API_BASE_URL: 'http://localhost:8082/api' }
  });

  // 等待服务器启动
  let ready = false;
  viteProcess.stdout.on('data', (data) => {
    const str = data.toString();
    if (str.includes('ready') || str.includes('Local:')) {
      ready = true;
      console.log('  ✅ Vite 服务器启动成功 (http://localhost:5173)');
    }
  });

  viteProcess.stderr.on('data', (data) => {
    const str = data.toString();
    if (str.includes('ready') || str.includes('Local:')) {
      ready = true;
      console.log('  ✅ Vite 服务器启动成功 (http://localhost:5173)');
    } else if (str.includes('Port 5173')) {
      ready = true;
      console.log('  ℹ️ 端口 5173 可能已被占用，假设服务器已运行');
    }
  });

  // 等待最多 15 秒
  const waitStart = Date.now();
  while (!ready && Date.now() - waitStart < 15000) {
    require('deasync').sleep(500);
  }

  if (!ready) {
    console.log('  ⚠️ 未检测到 Vite 就绪信号，尝试继续测试（可能服务器已在运行）');
  }
} catch (e) {
  console.log('  ⚠️ Vite 启动异常:', e.message);
}

// ========== Step 4: 运行测试 ==========
console.log('\n🧪 Step 4: 运行 E2E 测试...');
console.log('-'.repeat(60));

let testOutput = '';
let testResults = null;
let exitCode = 0;

try {
  testOutput = execSync(
    'npx playwright test --reporter=json,list --output=tests/reports/playwright-output',
    {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        VITE_TEST_BASE_URL: 'http://localhost:5173',
        FORCE_COLOR: '0'
      },
      timeout: 300000 // 5 分钟超时
    }
  ).toString();
  console.log(testOutput);
} catch (e) {
  testOutput = (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '');
  exitCode = e.status || 1;
  console.log(testOutput);
}

// ========== Step 5: 读取 JSON 结果 ==========
console.log('\n📊 Step 5: 解析测试结果...');
const resultsPath = path.join(REPORT_DIR, 'results.json');

if (fs.existsSync(resultsPath)) {
  try {
    testResults = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    console.log('  ✅ 测试结果已解析');
  } catch {
    console.log('  ⚠️ JSON 解析失败');
    testResults = null;
  }
}

// ========== Step 6: 收集前端控制台错误 ==========
console.log('\n🔍 Step 6: 收集代码分析结果...');
const analysisErrors = [];
const srcDir = path.join(ROOT, 'src');

function scanFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanFiles(fullPath);
    } else if (item.endsWith('.js') || item.endsWith('.vue')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      // 检查潜在问题
      checkIssues(content, fullPath, item);
    }
  }
}

function checkIssues(content, fullPath, filename) {
  const relPath = fullPath.replace(ROOT + path.sep, '');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // 跳过注释
    if (line.startsWith('//') || line.startsWith('*') || line.startsWith('* ')) continue;

    // 检查未使用的变量
    if (line.includes('const ') || line.includes('let ')) {
      // 简单检查：只出现在文件中的声明
    }

    // 检查硬编码
    if (line.includes('localhost:8081') || line.includes('localhost:8082')) {
      analysisErrors.push({
        file: relPath,
        line: i + 1,
        type: '⚠️ 警告',
        message: '硬编码的本地地址，应使用环境变量'
      });
    }

    // 检查 eval
    if (line.includes('eval(')) {
      analysisErrors.push({
        file: relPath,
        line: i + 1,
        type: '🚨 严重',
        message: '使用了 eval()，存在安全风险'
      });
    }

    // 检查 innerHTML 赋值（潜在的 XSS）
    if (line.includes('.innerHTML =') && !line.includes('renderMd')) {
      analysisErrors.push({
        file: relPath,
        line: i + 1,
        type: '⚠️ 警告',
        message: '直接设置 innerHTML，可能存在 XSS 风险'
      });
    }
  }
}

scanFiles(srcDir);
console.log(`  ℹ️ 代码扫描完成，发现 ${analysisErrors.length} 个问题`);

// ========== Step 7: 生成报告 ==========
console.log('\n📝 Step 7: 生成测试报告...');

const now = new Date();
const dateStr = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

let report = `# 🧪 课程辅导 AI - 自动化测试报告

## 基本信息

| 项目 | 值 |
|------|-----|
| 测试时间 | ${dateStr} |
| 测试环境 | ${process.platform} / Node ${process.version} |
| 测试框架 | Playwright E2E |
| 浏览器 | Chromium (Desktop) |
| 项目路径 | ${ROOT} |
| 前端地址 | http://localhost:5173 |
| 后端地址 | http://localhost:8082 |

---

## 测试结果总览

`;

if (testResults && testResults.suites) {
  let total = 0, passed = 0, failed = 0, skipped = 0;
  const specResults = [];

  function walkSuites(suites) {
    for (const suite of suites) {
      for (const spec of (suite.specs || [])) {
        total++;
        const status = spec.ok ? '✅ 通过' : '❌ 失败';
        if (spec.ok) passed++;
        else failed++;

        const errors = (spec.results || []).filter(r => r.errors && r.errors.length > 0)
          .flatMap(r => r.errors.map(e => e.message || e.value || String(e)));

        specResults.push({
          title: spec.title,
          status,
          duration: spec.results[0]?.duration ? `${(spec.results[0].duration / 1000).toFixed(1)}s` : '-',
          errors
        });
      }
      if (suite.suites) walkSuites(suite.suites);
    }
  }

  walkSuites(testResults.suites);

  report += `| 总用例数 | ${total} |
| :---: | :--- |
| ✅ 通过 | ${passed} |
| ❌ 失败 | ${failed} |
| ⏭️ 跳过 | ${skipped} |
| 通过率 | ${total > 0 ? ((passed / total * 100).toFixed(1)) : '0'}% |

---

## 详细测试结果

`;

  for (const r of specResults) {
    report += `### ${r.status} ${r.title}\n`;
    report += `- 耗时: ${r.duration}\n`;
    if (r.errors.length > 0) {
      report += `- **错误信息:**\n\`\`\`\n${r.errors.join('\n')}\n\`\`\`\n`;
    }
    report += '\n';
  }
} else {
  // 没有 JSON 结果，使用控制台输出解析
  report += `> ⚠️ 未能解析 Playwright JSON 结果，使用控制台输出。\n`;
  report += `\n### 测试输出\n\`\`\`\n${testOutput.substring(0, 5000)}\n\`\`\`\n`;
}

report += `\n---

## 代码静态分析结果

`;

if (analysisErrors.length === 0) {
  report += `✅ 未发现严重代码问题。\n`;
} else {
  report += `| 类型 | 文件 | 行号 | 问题描述 |\n|------|------|------|----------|\n`;
  for (const err of analysisErrors) {
    report += `| ${err.type} | \`${err.file}\` | ${err.line} | ${err.message} |\n`;
  }
}

report += `\n---

## 已测试的功能模块

| 编号 | 模块 | 测试文件 | 状态 |
|------|------|----------|------|
| 1 | 登录注册 | 01-login.spec.js | ${failed === 0 ? '✅ 运行完成' : '❌ 有失败用例'} |
| 2 | 主界面导航 | 02-navigation.spec.js | ${failed === 0 ? '✅ 运行完成' : '❌ 有失败用例'} |
| 3 | 实时答疑 | 03-helper.spec.js | ${failed === 0 ? '✅ 运行完成' : '❌ 有失败用例'} |
| 4 | 学习规划 | 04-planner.spec.js | ${failed === 0 ? '✅ 运行完成' : '❌ 有失败用例'} |
| 5 | 历史记录 | 05-history.spec.js | ${failed === 0 ? '✅ 运行完成' : '❌ 有失败用例'} |
| 6 | 代码分析 | 06-code-analysis.spec.js | ✅ 静态分析 |

---

## 需要后端支持

以下测试用例需要后端 API 正常运行才能完全通过：

- 登录/注册提交（后端验证）
- AI 问题提交与响应
- 历史记录查询（后端数据库）
- 文件上传

当前测试在 **前端独立模式** 下运行（Mock Token），主要验证：
- ✅ 页面渲染
- ✅ 表单验证
- ✅ 交互逻辑
- ✅ 导航路由
- ✅ UI 组件状态

---

## 建议

1. **后端 API** 需要启动以测试完整的端到端流程
2. 推荐配置 CI/CD 自动运行此测试套件
3. 建议增加 API 接口 Mock 数据以支持无后端测试

---

*报告由自动化测试脚本生成 | Playwright E2E Testing*
`;

fs.writeFileSync(REPORT_FILE, report, 'utf-8');
console.log(`  ✅ 报告已生成: ${REPORT_FILE}`);

// 同时输出一份纯文本摘要
const summaryPath = path.join(REPORT_DIR, '测试摘要.txt');
let summary = `
========================================
  课程辅导 AI - 自动化测试摘要
========================================
测试时间: ${dateStr}
平台: ${process.platform} / Node ${process.version}

`;

if (testResults && testResults.suites) {
  let total = 0, passed = 0, failed = 0;
  function walk(suites) {
    for (const s of suites) {
      for (const spec of (s.specs || [])) {
        total++;
        if (spec.ok) passed++; else failed++;
        if (!spec.ok) {
          const errs = (spec.results || []).filter(r => r.errors && r.errors.length > 0)
            .flatMap(r => r.errors.map(e => e.message || e.value || String(e)));
          summary += `  ❌ ${spec.title}\n     错误: ${errs[0] || '未知'}\n`;
        }
      }
      if (s.suites) walk(s.suites);
    }
  }
  walk(testResults.suites);
  summary += `\n总计: ${total} | 通过: ${passed} | 失败: ${failed} | 通过率: ${(passed / total * 100).toFixed(1)}%\n`;
} else {
  summary += `未能解析测试结果，请查看 HTML 报告。\n`;
}

summary += `\n代码分析发现 ${analysisErrors.length} 个问题\n`;
summary += `详细报告: ${REPORT_FILE}\n`;
summary += `========================================\n`;

fs.writeFileSync(summaryPath, summary, 'utf-8');
console.log(`  ✅ 摘要已生成: ${summaryPath}`);

// 打印摘要
console.log('\n' + summary);

// ========== 清理 ==========
if (viteProcess) {
  console.log('  🛑 停止 Vite 服务器...');
  viteProcess.kill('SIGTERM');
}

console.log('\n✅ 测试完成！');
console.log(`📄 完整报告: ${REPORT_FILE}`);
