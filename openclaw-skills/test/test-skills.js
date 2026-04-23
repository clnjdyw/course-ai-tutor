/**
 * OpenClaw Skills 测试脚本
 *
 * 使用方法：
 * node test/test-skills.js
 *
 * 注意：此测试脚本直接通过 Node.js 模块调用技能，不依赖 OpenClaw CLI
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 导入技能模块
import { skill as companionSkill } from '../skill-companion/index.js';
import { skill as plannerSkill } from '../skill-study-planner/index.js';
import { skill as tutorSkill } from '../skill-tutor/index.js';
import { skill as helperSkill } from '../skill-homework-helper/index.js';
import { skill as evaluatorSkill } from '../skill-evaluator/index.js';
import { skill as agentManagerSkill } from '../skill-agent-manager/index.js';

// 测试用例
const testCases = [
  {
    name: '测试陪伴智能体 - 聊天',
    skill: companionSkill,
    action: 'chat',
    params: { userId: 'test_001', message: '你好' }
  },
  {
    name: '测试陪伴智能体 - 情绪反馈',
    skill: companionSkill,
    action: 'moodFeedback',
    params: { userId: 'test_001', accuracy: 85, questionCount: 20, streakDays: 3 }
  },
  {
    name: '测试学习规划 - 创建计划',
    skill: plannerSkill,
    action: 'createPlan',
    params: { userId: 'test_001', goal: '学习 Python 编程' }
  },
  {
    name: '测试教学智能体 - 讲解',
    skill: tutorSkill,
    action: 'teach',
    params: { userId: 'test_001', topic: '什么是变量' }
  },
  {
    name: '测试答疑智能体 - 解答问题',
    skill: helperSkill,
    action: 'answer',
    params: { userId: 'test_001', content: '这个代码为什么报错？' }
  },
  {
    name: '测试评估智能体 - 批改作业',
    skill: evaluatorSkill,
    action: 'evaluateHomework',
    params: { userId: 'test_001', homeworkContent: 'print("Hello")' }
  },
  {
    name: '测试智能体管理器 - 意图识别',
    skill: agentManagerSkill,
    action: 'handleMessage',
    params: { message: '我想制定一个学习计划', userId: 'test_001' }
  },
  {
    name: '测试智能体管理器 - 获取状态',
    skill: agentManagerSkill,
    action: 'getStatus',
    params: {}
  },
  {
    name: '测试情绪状态查询',
    skill: companionSkill,
    action: 'getMoodState',
    params: { userId: 'test_001' }
  },
  {
    name: '测试情绪历史查询',
    skill: companionSkill,
    action: 'getMoodHistory',
    params: { userId: 'test_001', limit: 5 }
  }
];

// 运行单个测试
async function runTest(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试：${testCase.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`技能：${testCase.skill.name}.${testCase.action}`);
  console.log(`参数：${JSON.stringify(testCase.params)}\n`);

  try {
    const actionFn = testCase.skill.actions[testCase.action];
    if (!actionFn) {
      throw new Error(`技能 ${testCase.skill.name} 没有动作：${testCase.action}`);
    }

    const result = await actionFn(testCase.params);

    if (result.success) {
      console.log(`✅ 测试通过：${testCase.name}`);
      console.log(`回复：${result.message || result.feedback || result.content || JSON.stringify(result).substring(0, 100)}...`);
      return { name: testCase.name, success: true, result };
    } else {
      console.log(`❌ 测试失败：${testCase.name} - ${result.error || '未知错误'}`);
      return { name: testCase.name, success: false, error: result.error };
    }
  } catch (error) {
    console.log(`❌ 测试错误：${testCase.name}`);
    console.error(error);
    return { name: testCase.name, success: false, error: error.message };
  }
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
    await new Promise(resolve => setTimeout(resolve, 500));
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
      console.log(`  - ${r.name}: ${r.error}`);
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
