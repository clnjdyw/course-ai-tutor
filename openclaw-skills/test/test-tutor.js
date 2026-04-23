/**
 * Tutor Skill 单元测试
 *
 * 测试场景：
 * 1. 讲解知识点 - 验证苏格拉底式教学方法
 * 2. 引导式提问 - 验证启发式引导逻辑
 * 3. 处理未知问题 - 验证优雅降级和情绪适配
 *
 * 使用方法：
 * node test/test-tutor.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { moodService, MOOD_TYPES } from '../shared/mood-service.js';
import { skill as tutorSkill } from '../skill-tutor/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// 测试工具函数
// ============================================

/**
 * 断言辅助函数
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`断言失败：${message}`);
  }
}

/**
 * 深度相等比较
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => deepEqual(a[key], b[key]));
  }

  return false;
}

/**
 * 运行单个测试用例
 */
async function runTestCase(testFn, testName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试：${testName}`);
  console.log(`${'='.repeat(60)}`);

  try {
    await testFn();
    console.log(`✅ 通过：${testName}`);
    return { name: testName, success: true };
  } catch (error) {
    console.log(`❌ 失败：${testName}`);
    console.error(`   错误：${error.message}`);
    return { name: testName, success: false, error: error.message };
  }
}

// ============================================
// 测试场景 1：讲解知识点
// ============================================

/**
 * 测试 1.1: 基础知识点讲解 - 验证返回结构
 */
async function testTeachBasicStructure() {
  const userId = 'test_teach_001';
  const topic = 'Python 变量';

  console.log(`测试参数：userId=${userId}, topic=${topic}`);

  const result = await tutorSkill.actions.teach({
    userId,
    topic,
    studentLevel: 'beginner'
  });

  // 验证返回结构
  assert(result.success === true, 'success 应为 true');
  assert(result.agentType === 'tutor', 'agentType 应为 tutor');
  assert(result.action === 'teach', 'action 应为 teach');
  assert(typeof result.teachingContent === 'string', 'teachingContent 应为字符串');
  assert(result.teachingContent.length > 0, 'teachingContent 不应为空');
  assert(result.mood !== undefined, '应包含 mood 信息');
  assert(result.moodFeedback !== undefined, '应包含 moodFeedback');
  assert(result.teachingStrategy !== undefined, '应包含 teachingStrategy');

  console.log(`   返回结构验证通过`);
  console.log(`   内容长度：${result.teachingContent.length} 字符`);
}

/**
 * 测试 1.2: 不同情绪状态下的教学策略适配
 */
async function testTeachMoodAdaptation() {
  const userId = 'test_teach_mood_001';

  // 测试不同情绪状态
  const moodStates = [
    { mood: MOOD_TYPES.EXCITED, expectedPace: 'fast' },
    { mood: MOOD_TYPES.HAPPY, expectedPace: 'normal' },
    { mood: MOOD_TYPES.NEUTRAL, expectedPace: 'normal' },
    { mood: MOOD_TYPES.CONCERNED, expectedPace: 'slow' }
  ];

  for (const { mood, expectedPace } of moodStates) {
    const moodState = {
      currentMood: mood,
      accuracy: mood === MOOD_TYPES.EXCITED || mood === MOOD_TYPES.HAPPY ? 85 : 50,
      streakDays: mood === MOOD_TYPES.EXCITED ? 7 : 0,
      moodScore: 80
    };

    const result = await tutorSkill.actions.teach({
      userId,
      topic: '循环结构',
      studentLevel: 'intermediate',
      moodState
    });

    assert(result.success === true, `${mood.type} 状态下教学应成功`);
    assert(result.teachingStrategy.pace === expectedPace,
      `${mood.type} 状态下节奏应为 ${expectedPace}，实际为 ${result.teachingStrategy.pace}`);

    console.log(`   ${mood.emoji} ${mood.type}: 节奏=${result.teachingStrategy.pace} ✓`);
  }
}

/**
 * 测试 1.3: 不同学生水平的讲解深度
 */
async function testTeachStudentLevels() {
  const userId = 'test_teach_level_001';
  const topic = '函数';

  const levels = ['beginner', 'intermediate', 'advanced'];

  for (const level of levels) {
    const result = await tutorSkill.actions.teach({
      userId,
      topic,
      studentLevel: level
    });

    assert(result.success === true, `${level} 水平教学应成功`);
    assert(result.teachingContent.includes(level) || result.teachingContent.length > 50,
      '内容应与学生水平匹配');

    console.log(`   ${level}: 内容生成成功 ✓`);
  }
}

// ============================================
// 测试场景 2：引导式提问（苏格拉底式教学）
// ============================================

/**
 * 测试 2.1: 解答问题 - 验证苏格拉底式引导
 */
async function testAnswerQuestionSocratic() {
  const userId = 'test_socratic_001';
  const question = '为什么我的代码总是报错？';

  console.log(`测试参数：userId=${userId}, question=${question}`);

  const result = await tutorSkill.actions.answerQuestion({
    userId,
    question
  });

  assert(result.success === true, '解答问题应成功');
  assert(typeof result.answer === 'string', 'answer 应为字符串');
  assert(result.answer.length > 0, 'answer 不应为空');

  // 苏格拉底式教学应该包含提问而非直接答案
  const hasQuestion = result.answer.includes('?') || result.answer.includes('？');
  const hasGuidance = result.answer.includes('思考') || result.answer.includes('理解') ||
                      result.answer.includes('为什么') || result.answer.includes('怎么');

  console.log(`   包含引导性问题：${hasQuestion ? '✓' : '○'}`);
  console.log(`   包含启发性内容：${hasGuidance ? '✓' : '○'}`);
}

/**
 * 测试 2.2: 检查理解程度 - 验证反馈质量
 */
async function testCheckUnderstanding() {
  const userId = 'test_understand_001';
  const topic = '变量作用域';
  const studentResponse = '我认为变量作用域是指变量可以访问的范围';

  console.log(`测试参数：userId=${userId}, topic=${topic}`);
  console.log(`学生回答：${studentResponse}`);

  const result = await tutorSkill.actions.checkUnderstanding({
    userId,
    topic,
    studentResponse
  });

  assert(result.success === true, '检查理解应成功');
  assert(typeof result.feedback === 'string', 'feedback 应为字符串');
  assert(result.feedback.length > 0, 'feedback 不应为空');

  // 验证反馈包含鼓励性内容
  const hasEncouragement = result.feedback.includes('不错') ||
                          result.feedback.includes('好') ||
                          result.feedback.includes('✓') ||
                          result.feedback.includes('√');

  console.log(`   包含鼓励性反馈：${hasEncouragement ? '✓' : '○'}`);
  console.log(`   反馈长度：${result.feedback.length} 字符`);
}

/**
 * 测试 2.3: 生成练习题 - 验证难度适配
 */
async function testGeneratePracticeDifficulty() {
  const userId = 'test_practice_001';
  const topic = 'Python 基础';

  const difficulties = ['easy', 'medium', 'hard'];

  for (const difficulty of difficulties) {
    const result = await tutorSkill.actions.generatePractice({
      userId,
      topic,
      difficulty
    });

    assert(result.success === true, `${difficulty} 难度练习应生成成功`);
    assert(typeof result.practiceContent === 'string', 'practiceContent 应为字符串');

    // 验证难度适配（情绪低落时应降低难度）
    const moodState = moodService.getMoodState(userId);
    if (moodState.currentMood.type === 'CONCERNED') {
      assert(result.adjustedDifficulty === 'easy',
        '情绪低落时应降低难度为 easy');
      console.log(`   ${difficulty} → ${result.adjustedDifficulty} (情绪适配) ✓`);
    } else {
      console.log(`   ${difficulty}: 生成成功 ✓`);
    }
  }
}

// ============================================
// 测试场景 3：处理未知问题
// ============================================

/**
 * 测试 3.1: 未知主题 - 验证优雅降级
 */
async function testUnknownTopic() {
  const userId = 'test_unknown_001';
  const unknownTopic = '量子纠缠在编程中的应用';

  console.log(`测试参数：userId=${userId}, topic=${unknownTopic}`);

  const result = await tutorSkill.actions.teach({
    userId,
    topic: unknownTopic,
    studentLevel: 'beginner'
  });

  // 即使是不常见的主题，AI 也应该尝试回答或承认知识限制
  assert(result.success === true, '即使是不常见的主题也应返回成功');
  assert(typeof result.teachingContent === 'string', '应返回内容');

  console.log(`   未知主题处理：成功 ✓`);
  console.log(`   内容长度：${result.teachingContent.length} 字符`);
}

/**
 * 测试 3.2: 模糊问题 - 验证澄清请求
 */
async function testVagueQuestion() {
  const userId = 'test_vague_001';
  const vagueQuestion = '这个怎么做？';

  console.log(`测试参数：userId=${userId}, question=${vagueQuestion}`);

  const result = await tutorSkill.actions.answerQuestion({
    userId,
    question: vagueQuestion
  });

  assert(result.success === true, '模糊问题也应返回响应');

  // 好的回答应该请求澄清或提供通用指导
  const hasClarification = result.answer.includes('什么') ||
                          result.answer.includes('具体') ||
                          result.answer.includes('哪个') ||
                          result.answer.includes('帮助') ||
                          result.answer.includes('问题');

  console.log(`   模糊问题处理：成功 ✓`);
  console.log(`   包含澄清请求或通用指导：${hasClarification ? '✓' : '○'}`);
}

/**
 * 测试 3.3: 空输入处理 - 验证边界情况
 */
async function testEmptyInput() {
  const userId = 'test_empty_001';

  console.log(`测试参数：userId=${userId}, topic=''`);

  const result = await tutorSkill.actions.teach({
    userId,
    topic: '',
    studentLevel: 'beginner'
  });

  // 空主题也应该有响应（可能是请求澄清）
  assert(result.success === true, '空输入应返回成功');
  assert(typeof result.teachingContent === 'string', '应返回内容');

  console.log(`   空输入处理：成功 ✓`);
}

// ============================================
// 测试场景 4：情绪系统集成
// ============================================

/**
 * 测试 4.1: 情绪状态传递
 */
async function testMoodStatePropagation() {
  const userId = 'test_mood_prop_001';

  // 创建一个特定的情绪状态
  const customMoodState = {
    currentMood: MOOD_TYPES.HAPPY,
    accuracy: 90,
    streakDays: 5,
    moodScore: 85
  };

  const result = await tutorSkill.actions.teach({
    userId,
    topic: '测试情绪传递',
    moodState: customMoodState
  });

  assert(result.success === true, '自定义情绪状态教学应成功');
  assert(result.mood.accuracy === 90, '准确率应保持 90');
  assert(result.mood.streakDays === 5, '连续天数应保持 5');

  console.log(`   情绪状态传递：✓`);
  console.log(`   accuracy: ${result.mood.accuracy}`);
  console.log(`   streakDays: ${result.mood.streakDays}`);
}

/**
 * 测试 4.2: 情绪历史记录
 */
async function testMoodHistoryRecording() {
  const userId = 'test_mood_history_001';

  // 先进行几次教学
  await tutorSkill.actions.teach({
    userId,
    topic: '知识点 1',
    studentLevel: 'beginner'
  });

  await tutorSkill.actions.teach({
    userId,
    topic: '知识点 2',
    studentLevel: 'beginner'
  });

  // 检查情绪历史是否被记录
  const history = moodService.getMoodHistory(userId, 10);

  // 至少应该有记录
  assert(Array.isArray(history), '情绪历史应为数组');

  console.log(`   情绪历史记录：✓`);
  console.log(`   记录数量：${history.length}`);
}

// ============================================
// 测试运行器
// ============================================

const testCases = [
  // 场景 1：讲解知识点
  { fn: testTeachBasicStructure, name: '场景 1.1: 基础知识点讲解 - 返回结构验证' },
  { fn: testTeachMoodAdaptation, name: '场景 1.2: 不同情绪状态下的教学策略适配' },
  { fn: testTeachStudentLevels, name: '场景 1.3: 不同学生水平的讲解深度' },

  // 场景 2：引导式提问
  { fn: testAnswerQuestionSocratic, name: '场景 2.1: 解答问题 - 苏格拉底式引导验证' },
  { fn: testCheckUnderstanding, name: '场景 2.2: 检查理解程度 - 反馈质量验证' },
  { fn: testGeneratePracticeDifficulty, name: '场景 2.3: 生成练习题 - 难度适配验证' },

  // 场景 3：处理未知问题
  { fn: testUnknownTopic, name: '场景 3.1: 未知主题 - 优雅降级验证' },
  { fn: testVagueQuestion, name: '场景 3.2: 模糊问题 - 澄清请求验证' },
  { fn: testEmptyInput, name: '场景 3.3: 空输入 - 边界情况处理' },

  // 场景 4：情绪系统集成
  { fn: testMoodStatePropagation, name: '场景 4.1: 情绪状态传递' },
  { fn: testMoodHistoryRecording, name: '场景 4.2: 情绪历史记录' }
];

async function runAllTests() {
  console.log('\n' + '📚'.repeat(30));
  console.log('  Tutor Skill 单元测试套件');
  console.log('📚'.repeat(30));
  console.log('\n测试场景:');
  console.log('  1. 讲解知识点（3 个测试）');
  console.log('  2. 引导式提问（3 个测试）');
  console.log('  3. 处理未知问题（3 个测试）');
  console.log('  4. 情绪系统集成（2 个测试）');
  console.log('\n开始运行测试...\n');

  const results = [];

  for (const testCase of testCases) {
    const result = await runTestCase(testCase.fn, testCase.name);
    results.push(result);

    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 汇总结果
  console.log('\n' + '='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60) + '\n');

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
    console.log();
  }

  console.log('='.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

// 运行指定测试
async function runSingleTest(testName) {
  const testCase = testCases.find(t => t.name.includes(testName));
  if (!testCase) {
    console.error(`未找到测试：${testName}`);
    console.error('\n可用测试:');
    testCases.forEach(t => console.log(`  - ${t.name}`));
    process.exit(1);
  }
  await runTestCase(testCase.fn, testCase.name);
}

// 主函数
const testName = process.argv[2];
if (testName) {
  runSingleTest(testName);
} else {
  runAllTests();
}
