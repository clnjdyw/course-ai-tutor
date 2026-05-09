const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 测试结果文件路径
const testResultsPath = path.join(__dirname, '../test-results.json');
const screenshotsDir = path.join(__dirname, '../test-screenshots');
const outputExcelPath = path.join(__dirname, '../test-report.xlsx');

/**
 * 读取测试结果
 */
function readTestResults() {
  if (!fs.existsSync(testResultsPath)) {
    console.error('❌ 测试结果文件不存在,请先运行测试!');
    process.exit(1);
  }
  
  const data = fs.readFileSync(testResultsPath, 'utf-8');
  return JSON.parse(data);
}

/**
 * 生成主测试报告工作表
 */
function createMainReportSheet(testResults) {
  const headers = [
    '序号',
    '功能模块',
    '测试用例',
    '测试内容',
    '测试结果',
    '测试时间',
    '截图路径',
    '备注'
  ];
  
  const rows = [headers];
  
  testResults.forEach((result, index) => {
    rows.push([
      index + 1,
      result.module,
      result.testCase,
      getTestDescription(result.testCase),
      result.status,
      new Date(result.timestamp).toLocaleString('zh-CN'),
      result.screenshot ? path.basename(result.screenshot) : '无',
      result.details
    ]);
  });
  
  return rows;
}

/**
 * 获取测试内容描述
 */
function getTestDescription(testCase) {
  const descriptions = {
    'TC01 - 用户注册(学生)': '验证学生用户注册流程,包括邮箱、密码、姓名填写及角色选择',
    'TC02 - 用户登录': '验证用户使用邮箱和密码登录系统功能',
    'TC03 - 个人信息管理': '验证用户查看和编辑个人信息页面功能',
    'TC04 - 学习目标与学科偏好设置': '验证用户设置学习目标和学科偏好功能',
    'TC05 - 角色权限区分(教师)': '验证教师角色权限,访问教师端管理后台',
    'TC06 - 文字交互(知识点讲解)': '验证通过文字进行知识点问答交互功能',
    'TC07 - 图片交互(上传)': '验证上传图片进行提问的功能',
    'TC08 - 语音交互': '验证语音输入和语音交互功能',
    'TC09 - 心理辅导交互': '验证心理辅导和情感支持问答功能',
    'TC10 - 习题模拟交互': '验证习题生成和模拟练习功能',
    'TC11 - 知识库访问': '验证知识点知识库页面访问功能',
    'TC12 - 知识点结构化展示': '验证知识点的结构化梳理和展示',
    'TC13 - 教师端知识库管理': '验证教师在管理后台管理知识库功能',
    'TC14 - 知识库搜索功能': '验证知识库的全文搜索功能',
    'TC15 - 学习规划生成': '验证AI生成个性化学习规划功能',
    'TC16 - 学习进度跟踪': '验证学习进度可视化跟踪功能',
    'TC17 - 自定义题库练习': '验证基于薄弱点生成自定义题库功能',
    'TC18 - 学习成果统计': '验证学习成果数据可视化统计功能',
    'TC19 - 笔记功能': '验证学习笔记创建和管理功能',
    'TC20 - 错题收集功能': '验证错题自动收集和复习功能',
    'TC21 - 学习数据统计分析': '验证学习数据的统计分析功能',
    'TC22 - 学习提醒功能': '验证学习提醒设置和通知功能',
    'TC23 - 历史记录查询': '验证学习历史记录的查询和搜索功能',
    'TC24 - 成就系统': '验证游戏化成就徽章系统功能'
  };
  
  return descriptions[testCase] || testCase;
}

/**
 * 生成模块汇总工作表
 */
function createModuleSummarySheet(testResults) {
  const moduleStats = {};
  
  testResults.forEach(result => {
    if (!moduleStats[result.module]) {
      moduleStats[result.module] = {
        total: 0,
        passed: 0,
        failed: 0,
        partial: 0
      };
    }
    
    moduleStats[result.module].total++;
    
    if (result.status === '通过') {
      moduleStats[result.module].passed++;
    } else if (result.status === '失败') {
      moduleStats[result.module].failed++;
    } else if (result.status === '部分通过') {
      moduleStats[result.module].partial++;
    }
  });
  
  const headers = ['功能模块', '总测试数', '通过', '失败', '部分通过', '通过率'];
  const rows = [headers];
  
  Object.entries(moduleStats).forEach(([module, stats]) => {
    const passRate = ((stats.passed / stats.total) * 100).toFixed(1) + '%';
    rows.push([
      module,
      stats.total,
      stats.passed,
      stats.failed,
      stats.partial,
      passRate
    ]);
  });
  
  return rows;
}

/**
 * 生成测试统计工作表
 */
function createStatisticsSheet(testResults) {
  const total = testResults.length;
  const passed = testResults.filter(r => r.status === '通过').length;
  const failed = testResults.filter(r => r.status === '失败').length;
  const partial = testResults.filter(r => r.status === '部分通过').length;
  
  const rows = [
    ['测试统计报告'],
    [],
    ['统计项', '数值'],
    ['总测试用例数', total],
    ['通过', passed],
    ['失败', failed],
    ['部分通过', partial],
    ['总体通过率', ((passed / total) * 100).toFixed(1) + '%'],
    [],
    ['测试时间', new Date().toLocaleString('zh-CN')],
    ['测试环境', process.env.BASE_URL || 'http://localhost:5173'],
    ['API环境', process.env.API_URL || 'http://localhost:8081'],
    [],
    ['功能模块覆盖率', '5/5 (100%)'],
    ['测试用例总数', '24'],
    []
  ];
  
  return rows;
}

/**
 * 生成测试详情工作表(按模块分组)
 */
function createDetailSheet(testResults, moduleName) {
  const moduleResults = testResults.filter(r => r.module === moduleName);
  
  const headers = ['测试用例', '测试内容', '结果', '详情', '时间', '截图'];
  const rows = [headers];
  
  moduleResults.forEach(result => {
    rows.push([
      result.testCase,
      getTestDescription(result.testCase),
      result.status,
      result.details,
      new Date(result.timestamp).toLocaleString('zh-CN'),
      result.screenshot ? path.basename(result.screenshot) : '无'
    ]);
  });
  
  return rows;
}

/**
 * 创建Excel工作簿
 */
function createWorkbook(testResults) {
  const workbook = XLSX.utils.book_new();
  
  // 1. 主报告
  const mainData = createMainReportSheet(testResults);
  const mainSheet = XLSX.utils.aoa_to_sheet(mainData);
  
  // 设置列宽
  mainSheet['!cols'] = [
    { wch: 8 },   // 序号
    { wch: 15 },  // 功能模块
    { wch: 30 },  // 测试用例
    { wch: 50 },  // 测试内容
    { wch: 12 },  // 测试结果
    { wch: 20 },  // 测试时间
    { wch: 40 },  // 截图路径
    { wch: 60 }   // 备注
  ];
  
  XLSX.utils.book_append_sheet(workbook, mainSheet, '测试总报告');
  
  // 2. 模块汇总
  const moduleData = createModuleSummarySheet(testResults);
  const moduleSheet = XLSX.utils.aoa_to_sheet(moduleData);
  moduleSheet['!cols'] = [
    { wch: 20 },  // 功能模块
    { wch: 12 },  // 总测试数
    { wch: 10 },  // 通过
    { wch: 10 },  // 失败
    { wch: 12 },  // 部分通过
    { wch: 12 }   // 通过率
  ];
  XLSX.utils.book_append_sheet(workbook, moduleSheet, '模块汇总');
  
  // 3. 测试统计
  const statsData = createStatisticsSheet(testResults);
  const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
  statsSheet['!cols'] = [
    { wch: 20 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(workbook, statsSheet, '测试统计');
  
  // 4. 按模块的详细报告
  const modules = ['用户中心', '智能问答', '知识点管理', '个性化学习', '辅助功能'];
  modules.forEach(module => {
    const detailData = createDetailSheet(testResults, module);
    const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
    detailSheet['!cols'] = [
      { wch: 30 },
      { wch: 50 },
      { wch: 12 },
      { wch: 60 },
      { wch: 20 },
      { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(workbook, detailSheet, module);
  });
  
  return workbook;
}

/**
 * 主函数
 */
function main() {
  console.log('📊 开始生成测试报告...\n');
  
  // 读取测试结果
  const testResults = readTestResults();
  console.log(`✅ 读取到 ${testResults.length} 个测试结果`);
  
  // 创建工作簿
  const workbook = createWorkbook(testResults);
  
  // 保存Excel文件
  XLSX.writeFile(workbook, outputExcelPath);
  console.log(`\n✅ Excel报告已生成: ${outputExcelPath}`);
  
  // 输出统计信息
  const passed = testResults.filter(r => r.status === '通过').length;
  const failed = testResults.filter(r => r.status === '失败').length;
  const partial = testResults.filter(r => r.status === '部分通过').length;
  
  console.log('\n📈 测试统计:');
  console.log(`   总计: ${testResults.length} 个测试用例`);
  console.log(`   ✅ 通过: ${passed}`);
  console.log(`   ❌ 失败: ${failed}`);
  console.log(`   ⚠️  部分通过: ${partial}`);
  console.log(`   📊 通过率: ${((passed / testResults.length) * 100).toFixed(1)}%`);
  
  console.log('\n📁 相关文件:');
  console.log(`   - Excel报告: ${outputExcelPath}`);
  console.log(`   - 测试截图: ${screenshotsDir}`);
  console.log(`   - 测试结果: ${testResultsPath}`);
}

// 执行
main();
