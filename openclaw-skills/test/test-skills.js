/**
 * OpenClaw Skills 测试脚本
 * 
 * 使用方法：
 * node test/test-skills.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试用例
const testCases = [
  {
    name: '测试陪伴智能体 - 聊天',
    command: 'openclaw',
    args: ['skill', 'run', 'skill-companion', 'chat', '--message', '你好', '--userId', 'test_001']
  },
  {
    name: '测试陪伴智能体 - 情绪反馈',
    command: 'openclaw',
    args: ['skill', 'run', 'skill-companion', 'moodFeedback', '--userId', 'test_001', '--accuracy', '85', '--questionCount', '20', '--streakDays', '3']
  },
  {
    name: '测试学习规划 - 创建计划',
    command: 'openclaw',
    args: ['skill', 'run', 'skill-study-planner', 'createPlan', '--userId', 'test_001', '--goal', '学习 Python 编程']
  },
  {
    name: '测试教学智能体 - 讲解',
    command: 'openclaw',
    args: ['skill', 'run', 'skill-tutor', 'teach', '--userId', 'test_001', '--topic', '什么是变量']
  },
  {
    name: '测试答疑智能体 - 解答问题',
    command: 'openclaw',
    args: ['skill', 'run', 'skill-homework-helper', 'answer', '--userId', 'test_001', '--content', '这个代码为什么报错？']
  },
  {
    name: '测试评估智能体 - 批改作业',
    command: 'openclaw',
    args: ['skill', 'run', 'skill-evaluator', 'evaluateHomework', '--userId', 'test_001', '--homeworkContent', 'print("Hello")']
  },
  {
    name: '测试智能体管理器 - 意图识别',
    command: 'openclaw',
    args: ['skill', 'run', 'skill-agent-manager', 'handleMessage', '--message', '我想制定一个学习计划', '--userId', 'test_001']
  },
  {
    name: '测试智能体管理器 - 获取状态',
    command: 'openclaw',
    args: ['skill', 'run', 'skill-agent-manager', 'getStatus']
  },
  {
    name: '测试情绪状态查询',
    command: 'openclaw',
    args: ['skill', 'run', 'skill-companion', 'getMoodState', '--userId', 'test_001']
  },
  {
    name: '测试情绪历史查询',
    command: 'openclaw',
    args: ['skill', 'run', 'skill-companion', 'getMoodHistory', '--userId', 'test_001', '--limit', '5']
  }
];

// 运行单个测试
async function runTest(testCase) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试：${testCase.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`命令：${testCase.command} ${testCase.args.join(' ')}\n`);
    
    const child = spawn(testCase.command, testCase.args, {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ 测试通过：${testCase.name}`);
        resolve({ name: testCase.name, success: true });
      } else {
        console.log(`❌ 测试失败：${testCase.name} (退出码：${code})`);
        resolve({ name: testCase.name, success: false, code });
      }
    });
    
    child.on('error', (error) => {
      console.log(`❌ 测试错误：${testCase.name}`);
      console.error(error);
      resolve({ name: testCase.name, success: false, error });
    });
  });
}

// 运行所有测试
async function runAllTests() {
  console.log('\n' + '🧪'.repeat(30));
  console.log('  OpenClaw Skills 测试套件');
  console.log('🧪'.repeat(30) + '\n');
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
    
    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 汇总结果
  console.log('\n' + '📊'.repeat(30));
  console.log('  测试结果汇总');
  console.log('📊'.repeat(30) + '\n');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  
  console.log(`总测试数：${results.length}`);
  console.log(`✅ 通过：${passed}`);
  console.log(`❌ 失败：${failed}`);
  console.log(`通过率：${Math.round(passed / results.length * 100)}%\n`);
  
  if (failed > 0) {
    console.log('失败的测试:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}`);
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

// 运行指定测试
async function runSingleTest(testName) {
  const testCase = testCases.find(t => t.name.includes(testName));
  if (!testCase) {
    console.error(`未找到测试：${testName}`);
    process.exit(1);
  }
  await runTest(testCase);
}

// 主函数
const testName = process.argv[2];
if (testName) {
  runSingleTest(testName);
} else {
  runAllTests();
}
