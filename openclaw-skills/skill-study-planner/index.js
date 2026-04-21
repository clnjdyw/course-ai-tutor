/**
 * Study Planner Skill - 学习规划智能体（带情绪反馈）
 * 
 * 功能：
 * 1. 分析学生的学习目标和当前水平
 * 2. 制定游戏化的学习计划（关卡式）
 * 3. 安排合理的学习时间（考虑注意力时长）
 * 4. 设计激励机制（奖励、成就徽章）
 * 5. 根据情绪状态调整计划难度和语气
 * 
 * 核心原则：
 * - 目标拆解：把大目标变成小游戏关卡
 * - 时间合理：每次学习 15-25 分钟
 * - 劳逸结合：安排休息和娱乐
 * - 激励设计：完成每关有奖励
 * - 情绪适配：根据情绪调整语气和难度
 */

import { moodService, MOOD_TYPES } from '../shared/mood-service.js';
import { callAIModel } from '../shared/ai-service.js';

/**
 * 系统提示词 - 定义规划智能体的角色和行为
 */
const SYSTEM_PROMPT = `
你是一位专业的学习规划师，擅长根据学生的目标和水平制定个性化的学习计划。

🎯 核心规划原则（必须遵守）：
1. 【目标拆解】把大目标变成小游戏，每个阶段都有小成就
2. 【时间合理】考虑小学生注意力时长，每次学习 15-25 分钟
3. 【劳逸结合】安排休息时间和娱乐活动
4. 【激励设计】每个阶段完成后有奖励建议
5. 【灵活调整】根据学生实际情况可调整进度
6. 【情绪适配】根据学生情绪状态调整语气和鼓励程度

💡 计划结构（必须遵循）：
1. 🎯 终极目标（用有趣的方式描述）
2. 📍 小目标关卡（像游戏关卡一样，第 1 关、第 2 关...）
3. ⏰ 时间安排（每天/每周，每次 15-25 分钟）
4. 🎁 奖励机制（完成每关后的小奖励）
5. ⭐️ 成就徽章（可以收集的虚拟徽章）

🌈 情绪适配规则：
- 情绪高涨（HAPPY/EXCITED）：可以设置更有挑战性的目标
- 情绪平静（NEUTRAL）：保持正常难度，适当鼓励
- 情绪低落（CONCERNED）：降低难度，增加鼓励和休息

👧 面向小学生：
- 用游戏化语言描述计划（关卡、成就、奖励）
- 使用 emoji 让计划更生动
- 避免过于严肃的表达
- 称呼学生为"小挑战者"或"小勇士"

请始终用中文回复，使用 Markdown 格式，让计划结构清晰、易于阅读。
`;

/**
 * 创建学习计划（带情绪反馈）
 */
export async function createPlan({ userId, goal, currentLevel = 'beginner', availableTime, preference = '', moodState = null }) {
  console.log(`[StudyPlanner] 创建计划：userId=${userId}, goal=${goal}, level=${currentLevel}`);
  
  // 获取情绪状态
  const mood = moodState || moodService.getMoodState(userId);
  console.log(`[StudyPlanner] 当前情绪：${mood.currentMood.emoji} ${mood.currentMood.description}`);
  
  // 根据情绪调整计划策略
  const planStrategy = adjustPlanByMood(mood.currentMood, { goal, currentLevel, availableTime });
  
  const userPrompt = `
学生信息：
- 用户 ID: ${userId}
- 学习目标：${goal}
- 当前水平：${currentLevel}
- 可用时间：${availableTime || '未指定'}
- 学习偏好：${preference || '未指定'}
- 当前情绪：${mood.currentMood.description} ${mood.currentMood.emoji}
- 正确率：${mood.accuracy}%
- 连续学习：${mood.streakDays}天

请为该学生制定详细的学习计划，根据情绪状态调整难度和语气。
`;

  try {
    const planContent = await callAIModel(SYSTEM_PROMPT, userPrompt);
    
    // 更新情绪历史
    moodService.recordMoodHistory(userId, mood.currentMood, `创建学习计划：${goal}`);
    
    return {
      success: true,
      agentType: 'planner',
      action: 'createPlan',
      planContent,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays,
        moodScore: mood.moodScore
      },
      moodFeedback: generateMoodFeedback(mood.currentMood, planStrategy),
      metadata: {
        userId,
        goal,
        currentLevel,
        planStrategy,
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[StudyPlanner] 创建计划失败:', error);
    return {
      success: false,
      error: error.message,
      agentType: 'planner',
      mood: mood.currentMood
    };
  }
}

/**
 * 调整学习计划
 */
export async function adjustPlan({ planId, feedback, userId, moodState = null }) {
  console.log(`[StudyPlanner] 调整计划：planId=${planId}, feedback=${feedback}`);
  
  const mood = moodState || moodService.getMoodState(userId);
  
  const userPrompt = `
需要根据以下反馈调整学习计划：
- 计划 ID: ${planId}
- 用户 ID: ${userId}
- 用户反馈：${feedback}
- 当前情绪：${mood.currentMood.description}

请分析反馈并给出调整建议。
`;

  try {
    const adjustedPlan = await callAIModel(SYSTEM_PROMPT, userPrompt);
    
    return {
      success: true,
      agentType: 'planner',
      action: 'adjustPlan',
      planContent: adjustedPlan,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays
      },
      metadata: {
        planId,
        userId,
        adjustedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[StudyPlanner] 调整计划失败:', error);
    return {
      success: false,
      error: error.message,
      agentType: 'planner'
    };
  }
}

/**
 * 获取学习进度
 */
export async function getProgress({ userId, planId }) {
  console.log(`[StudyPlanner] 获取进度：userId=${userId}, planId=${planId}`);
  
  const mood = moodService.getMoodState(userId);
  
  return {
    success: true,
    agentType: 'planner',
    action: 'getProgress',
    progress: {
      planId,
      userId,
      completedStages: 0,
      totalStages: 0,
      percentage: 0,
      currentStage: null,
      achievements: []
    },
    mood: {
      currentMood: mood.currentMood,
      accuracy: mood.accuracy,
      streakDays: mood.streakDays
    }
  };
}

/**
 * 根据情绪调整计划策略
 */
function adjustPlanByMood(mood, params) {
  const strategy = {
    difficulty: 'normal',
    encouragement: 'normal',
    restFrequency: 'normal'
  };
  
  switch (mood.type) {
    case 'EXCITED':
    case 'HAPPY':
      strategy.difficulty = 'challenging';
      strategy.encouragement = 'high';
      strategy.message = '情绪高涨，可以挑战更高目标';
      break;
    case 'NEUTRAL':
      strategy.difficulty = 'normal';
      strategy.encouragement = 'normal';
      strategy.message = '情绪稳定，保持正常进度';
      break;
    case 'CONCERNED':
      strategy.difficulty = 'easy';
      strategy.encouragement = 'high';
      strategy.restFrequency = 'frequent';
      strategy.message = '情绪低落，降低难度，多鼓励';
      break;
  }
  
  return strategy;
}

/**
 * 生成情绪反馈消息
 */
function generateMoodFeedback(mood, planStrategy) {
  switch (mood.type) {
    case 'EXCITED':
      return `🤩 **小勇士，看到你这么兴奋，我也很开心！**\n\n这个计划会有一定挑战性，但我相信你能完成！加油！`;
    case 'HAPPY':
      return `😊 **太棒了！让我们一起开始这个学习冒险吧！**\n\n按照计划一步步来，你一定能达成目标！`;
    case 'NEUTRAL':
      return `🙂 **好的，计划已经准备好了！**\n\n不用着急，按照自己的节奏来就好。有疑问随时问我！`;
    case 'CONCERNED':
      return `😔 **我知道开始一个新计划可能有点压力...**\n\n没关系，我们从简单的开始，一点点来。我会一直陪着你！💕`;
    default:
      return `💪 **加油！我们一起努力！**`;
  }
}

// 导出 OpenClaw Skill 接口
export const skill = {
  name: 'skill-study-planner',
  version: '1.0.0',
  description: '学习规划智能体 - 制定个性化学习计划（带情绪反馈）',
  
  actions: {
    /**
     * 创建学习计划
     */
    async createPlan(params) {
      return createPlan(params);
    },
    
    /**
     * 调整学习计划
     */
    async adjustPlan(params) {
      return adjustPlan(params);
    },
    
    /**
     * 获取学习进度
     */
    async getProgress(params) {
      return getProgress(params);
    }
  }
};

export default skill;
