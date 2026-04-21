/**
 * Tutor Skill - 教学智能体（苏格拉底式教学 + 情绪反馈）
 * 
 * 功能：
 * 1. 知识点讲解（由浅入深）
 * 2. 苏格拉底式引导（提问而非直接给答案）
 * 3. 提供代码示例和类比
 * 4. 生成练习题
 * 5. 根据情绪调整教学方式和鼓励程度
 * 
 * 核心教学原则：
 * - 苏格拉底式引导：不直接给答案，通过提问引导思考
 * - 循序渐进：每次只讲一个小概念
 * - 启发式教学：引导学生自己发现答案
 * - 鼓励探索：积极反馈，肯定思考过程
 * - 情绪适配：根据情绪调整语气和节奏
 */

import { moodService, MOOD_TYPES } from '../shared/mood-service.js';
import { callAIModel } from '../shared/ai-service.js';

/**
 * 系统提示词
 */
const SYSTEM_PROMPT = `
你是一位经验丰富的课程讲师，擅长用简单易懂的方式讲解复杂概念。

🎯 核心教学原则（必须遵守）：
1. 【苏格拉底式引导】不要直接给出答案！通过提问引导学生自己思考
2. 【循序渐进】由浅入深，每次只讲解一个小概念，确认学生理解后再继续
3. 【启发式教学】当学生问"答案是什么"时，回应"让我们一起想想..."
4. 【鼓励探索】对学生的尝试给予积极反馈，即使答案是错的也要肯定思考过程
5. 【举例说明】用生活中的例子、类比来解释抽象概念
6. 【情绪适配】根据学生情绪调整语气、节奏和鼓励程度

💡 教学流程（推荐）：
1. 先了解学生的前置知识和困惑点
2. 用简单语言引入概念（可以用类比）
3. 提出引导性问题，让学生思考
4. 根据学生回答，逐步深入
5. 总结关键点，确认理解
6. 提供练习题巩固

🌈 情绪适配规则：
- 情绪高涨（HAPPY/EXCITED）：可以加快节奏，增加挑战性问题
- 情绪平静（NEUTRAL）：保持正常节奏，适当互动
- 情绪低落（CONCERNED）：放慢节奏，更多鼓励，降低难度

👧 面向小学生：
- 使用简单易懂的语言
- 多用比喻和生活中的例子
- 使用 emoji 让内容更生动
- 多鼓励、多表扬
- 称呼学生为"小勇士"或"小探索家"

⚠️ 重要提醒：
- 当学生直接问答案时，不要直接给出，而是引导他们思考
- 如果学生卡住了，给一点提示，而不是完整答案
- 每次讲解后，问"你明白了吗？"或"你有什么疑问吗？"

请始终用中文回复，使用 Markdown 格式，让内容结构清晰。
`;

/**
 * 教学讲解（带情绪反馈）
 */
export async function teach({ userId, topic, context = '', studentLevel = 'beginner', moodState = null }) {
  console.log(`[Tutor] 教学：userId=${userId}, topic=${topic}, level=${studentLevel}`);
  
  // 获取情绪状态
  const mood = moodState || moodService.getMoodState(userId);
  console.log(`[Tutor] 当前情绪：${mood.currentMood.emoji} ${mood.currentMood.description}`);
  
  // 根据情绪调整教学策略
  const teachingStrategy = adjustTeachingByMood(mood.currentMood);
  
  const userPrompt = `
学生信息：
- 用户 ID: ${userId}
- 学习主题：${topic}
- 当前水平：${studentLevel}
- 相关上下文：${context || '无'}
- 当前情绪：${mood.currentMood.description} ${mood.currentMood.emoji}
- 正确率：${mood.accuracy}%

请用苏格拉底式教学方法讲解这个主题，根据情绪调整语气和节奏。
`;

  try {
    const teachingContent = await callAIModel(SYSTEM_PROMPT, userPrompt);
    
    // 记录情绪历史
    moodService.recordMoodHistory(userId, mood.currentMood, `学习主题：${topic}`);
    
    return {
      success: true,
      agentType: 'tutor',
      action: 'teach',
      teachingContent,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays,
        moodScore: mood.moodScore
      },
      moodFeedback: generateMoodFeedback(mood.currentMood, teachingStrategy),
      teachingStrategy,
      metadata: {
        userId,
        topic,
        studentLevel,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[Tutor] 教学失败:', error);
    return {
      success: false,
      error: error.message,
      agentType: 'tutor',
      mood: mood.currentMood
    };
  }
}

/**
 * 解答问题（带情绪反馈）
 */
export async function answerQuestion({ userId, question, context = '', moodState = null }) {
  console.log(`[Tutor] 答疑：userId=${userId}, question=${question.substring(0, 50)}...`);
  
  const mood = moodState || moodService.getMoodState(userId);
  
  const userPrompt = `
学生问题：
- 用户 ID: ${userId}
- 问题：${question}
- 相关上下文：${context || '无'}
- 当前情绪：${mood.currentMood.description}

请用苏格拉底式方法引导学生思考，根据情绪调整语气。
`;

  try {
    const answer = await callAIModel(SYSTEM_PROMPT, userPrompt);
    
    return {
      success: true,
      agentType: 'tutor',
      action: 'answerQuestion',
      answer,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays
      },
      metadata: {
        userId,
        question,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[Tutor] 答疑失败:', error);
    return {
      success: false,
      error: error.message,
      agentType: 'tutor'
    };
  }
}

/**
 * 生成练习题（带情绪反馈）
 */
export async function generatePractice({ userId, topic, difficulty = 'medium', count = 3, moodState = null }) {
  console.log(`[Tutor] 生成练习：userId=${userId}, topic=${topic}, difficulty=${difficulty}`);
  
  const mood = moodState || moodService.getMoodState(userId);
  
  // 根据情绪调整难度
  let adjustedDifficulty = difficulty;
  if (mood.currentMood.type === 'CONCERNED' && difficulty !== 'easy') {
    adjustedDifficulty = 'easy';
  } else if ((mood.currentMood.type === 'HAPPY' || mood.currentMood.type === 'EXCITED') && difficulty !== 'hard') {
    adjustedDifficulty = difficulty === 'easy' ? 'medium' : 'hard';
  }
  
  const userPrompt = `
生成练习题：
- 用户 ID: ${userId}
- 主题：${topic}
- 原始难度：${difficulty}
- 调整后难度：${adjustedDifficulty}
- 数量：${count} 题
- 当前情绪：${mood.currentMood.description}

请生成适合学生的练习题。
`;

  try {
    const practiceContent = await callAIModel(SYSTEM_PROMPT, userPrompt);
    
    return {
      success: true,
      agentType: 'tutor',
      action: 'generatePractice',
      practiceContent,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays
      },
      metadata: {
        userId,
        topic,
        originalDifficulty: difficulty,
        adjustedDifficulty,
        count,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[Tutor] 生成练习失败:', error);
    return {
      success: false,
      error: error.message,
      agentType: 'tutor'
    };
  }
}

/**
 * 检查理解程度（带情绪反馈）
 */
export async function checkUnderstanding({ userId, topic, studentResponse, moodState = null }) {
  console.log(`[Tutor] 检查理解：userId=${userId}, topic=${topic}`);
  
  const mood = moodState || moodService.getMoodState(userId);
  
  const userPrompt = `
检查学生理解程度：
- 用户 ID: ${userId}
- 主题：${topic}
- 学生回答：${studentResponse}
- 当前情绪：${mood.currentMood.description}

请评估学生的理解程度，给出鼓励性反馈。
`;

  try {
    const feedback = await callAIModel(SYSTEM_PROMPT, userPrompt);
    
    // 如果回答正确，更新情绪表现
    if (feedback.includes('正确') || feedback.includes('理解')) {
      moodService.updatePerformance(userId, { correct: 1, total: 1 });
    }
    
    return {
      success: true,
      agentType: 'tutor',
      action: 'checkUnderstanding',
      feedback,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays
      },
      metadata: {
        userId,
        topic,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[Tutor] 检查理解失败:', error);
    return {
      success: false,
      error: error.message,
      agentType: 'tutor'
    };
  }
}

/**
 * 根据情绪调整教学策略
 */
function adjustTeachingByMood(mood) {
  const strategy = {
    pace: 'normal',
    encouragement: 'normal',
    difficulty: 'normal',
    interactionLevel: 'normal'
  };
  
  switch (mood.type) {
    case 'EXCITED':
      strategy.pace = 'fast';
      strategy.encouragement = 'high';
      strategy.difficulty = 'challenging';
      strategy.interactionLevel = 'high';
      strategy.message = '情绪高涨，加快节奏，增加挑战';
      break;
    case 'HAPPY':
      strategy.pace = 'normal';
      strategy.encouragement = 'high';
      strategy.difficulty = 'normal';
      strategy.message = '情绪好，保持正常节奏';
      break;
    case 'NEUTRAL':
      strategy.pace = 'normal';
      strategy.encouragement = 'normal';
      strategy.message = '情绪稳定，正常教学';
      break;
    case 'CONCERNED':
      strategy.pace = 'slow';
      strategy.encouragement = 'high';
      strategy.difficulty = 'easy';
      strategy.interactionLevel = 'high';
      strategy.message = '情绪低落，放慢节奏，多鼓励';
      break;
  }
  
  return strategy;
}

/**
 * 生成情绪反馈消息
 */
function generateMoodFeedback(mood, teachingStrategy) {
  switch (mood.type) {
    case 'EXCITED':
      return `🤩 **看到你这么有热情，我太开心了！**\n\n让我们开始这个有趣的学习之旅吧！准备好迎接挑战了吗？`;
    case 'HAPPY':
      return `😊 **好的，让我们一起探索这个知识点！**\n\n跟着我的引导，你会发现它很有趣的！`;
    case 'NEUTRAL':
      return `🙂 **没问题，我们慢慢来！**\n\n有任何不懂的地方随时问我，不用着急！`;
    case 'CONCERNED':
      return `😔 **我知道学习新知识可能有点难...**\n\n没关系，我们一步步来，我会一直陪着你！💕`;
    default:
      return `💪 **加油！我们一起学习！**`;
  }
}

// 导出 OpenClaw Skill 接口
export const skill = {
  name: 'skill-tutor',
  version: '1.0.0',
  description: '教学智能体 - 苏格拉底式知识点讲解（带情绪反馈）',
  
  actions: {
    /**
     * 教学讲解
     */
    async teach(params) {
      return teach(params);
    },
    
    /**
     * 解答问题
     */
    async answerQuestion(params) {
      return answerQuestion(params);
    },
    
    /**
     * 生成练习题
     */
    async generatePractice(params) {
      return generatePractice(params);
    },
    
    /**
     * 检查理解程度
     */
    async checkUnderstanding(params) {
      return checkUnderstanding(params);
    }
  }
};

export default skill;
