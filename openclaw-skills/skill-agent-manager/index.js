/**
 * Agent Manager Skill - 智能体管理器（带情绪反馈）
 * 
 * 功能：
 * 1. 识别用户意图，路由到合适的子智能体
 * 2. 协调多个智能体协作
 * 3. 管理对话上下文和状态
 * 4. 统一情绪反馈（所有 Skill 共享）
 * 
 * 路由规则：
 * - 学习计划、规划、安排 → skill-study-planner
 * - 讲解、教学、知识点 → skill-tutor
 * - 问题、答疑、帮助 → skill-homework-helper
 * - 评估、批改、检查 → skill-evaluator
 * - 聊天、心情、陪伴 → skill-companion
 */

import { moodService, MOOD_TYPES } from '../shared/mood-service.js';
import { callAIModel } from '../shared/ai-service.js';

// 导入子技能
import { skill as tutorSkill } from '../skill-tutor/index.js';
import { skill as plannerSkill } from '../skill-study-planner/index.js';
import { skill as helperSkill } from '../skill-homework-helper/index.js';
import { skill as evaluatorSkill } from '../skill-evaluator/index.js';
import { skill as companionSkill } from '../skill-companion/index.js';
import { skill as searchSkill } from '../skill-search/index.js';

const AGENT_TYPES = {
  PLANNER: 'planner',
  TUTOR: 'tutor',
  HELPER: 'helper',
  EVALUATOR: 'evaluator',
  COMPANION: 'companion',
  SEARCH: 'search'
};

/**
 * 意图识别提示词
 */
const INTENT_CLASSIFICATION_PROMPT = `
你是一个智能意图识别助手。请分析用户的问题，判断应该由哪个专业智能体处理。

可选的智能体类型：
1. ${AGENT_TYPES.PLANNER} - 学习规划：制定学习计划、安排学习时间、目标拆解
2. ${AGENT_TYPES.TUTOR} - 教学讲解：知识点讲解、概念说明、示例演示
3. ${AGENT_TYPES.HELPER} - 答疑辅导：作业帮助、问题解答、思路引导
4. ${AGENT_TYPES.EVALUATOR} - 评估批改：作业评估、测试评分、学习报告
5. ${AGENT_TYPES.COMPANION} - 陪伴聊天：日常交流、情绪支持、学习鼓励
6. ${AGENT_TYPES.SEARCH} - 查找资料：搜索资源、推荐教程、查找知识点

请只返回智能体类型名称（planner/tutor/helper/evaluator/companion/search），不要其他内容。
`;

/**
 * 路由配置
 */
const ROUTE_CONFIG = {
  [AGENT_TYPES.PLANNER]: {
    keywords: ['计划', '规划', '安排', '目标', '学习路径', '时间表', '进度', '阶段'],
    skill: 'skill-study-planner',
    action: 'createPlan'
  },
  [AGENT_TYPES.TUTOR]: {
    keywords: ['讲解', '教学', '知识点', '概念', '原理', '什么是', '怎么理解', '举例'],
    skill: 'skill-tutor',
    action: 'teach'
  },
  [AGENT_TYPES.HELPER]: {
    keywords: ['问题', '答疑', '帮助', '怎么做', '为什么', '如何', '解答', '辅导'],
    skill: 'skill-homework-helper',
    action: 'answer'
  },
  [AGENT_TYPES.EVALUATOR]: {
    keywords: ['评估', '批改', '评分', '检查', '测试', '作业', '报告', '分析'],
    skill: 'skill-evaluator',
    action: 'evaluateHomework'
  },
  [AGENT_TYPES.COMPANION]: {
    keywords: ['你好', '聊天', '心情', '开心', '难过', '累', '鼓励', '加油'],
    skill: 'skill-companion',
    action: 'chat'
  },
  [AGENT_TYPES.SEARCH]: {
    keywords: ['搜索', '查找', '资料', '资源', '教程', '推荐', '搜索资源', '查找资料'],
    skill: 'skill-search',
    action: 'searchResources'
  }
};

/**
 * 基于关键词的意图识别
 */
function recognizeIntentByKeywords(message) {
  const lowerMessage = message.toLowerCase();
  
  for (const [agentType, config] of Object.entries(ROUTE_CONFIG)) {
    if (config.keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))) {
      return agentType;
    }
  }
  
  // 默认返回陪伴智能体
  return AGENT_TYPES.COMPANION;
}

/**
 * 前端类型到内部智能体类型的映射
 */
const FRONTEND_TYPE_MAP = {
  'teach': AGENT_TYPES.TUTOR,
  'plan': AGENT_TYPES.PLANNER,
  'help': AGENT_TYPES.HELPER,
  'evaluate': AGENT_TYPES.EVALUATOR,
  'chat': AGENT_TYPES.COMPANION,
  'search': AGENT_TYPES.SEARCH
};

/**
 * 主处理函数（带情绪反馈）
 */
export async function handleMessage({ message, userId, context = {}, type }) {
  console.log(`[AgentManager] 收到消息：userId=${userId}, message=${message.substring(0, 50)}...`);

  try {
    // 1. 获取当前情绪状态
    const moodState = moodService.getMoodState(userId);
    console.log(`[AgentManager] 当前情绪：${moodState.currentMood.emoji} ${moodState.currentMood.description}`);

    // 2. 识别意图：优先使用显式 type 参数，否则基于关键词识别
    let intent;
    if (type && FRONTEND_TYPE_MAP[type]) {
      intent = FRONTEND_TYPE_MAP[type];
      console.log(`[AgentManager] 使用显式路由：${intent}`);
    } else {
      intent = recognizeIntentByKeywords(message);
      console.log(`[AgentManager] 关键词识别意图：${intent}`);
    }

    // 3. 获取路由配置
    const routeConfig = ROUTE_CONFIG[intent];

    if (!routeConfig) {
      throw new Error(`未知意图：${intent}`);
    }

    // 4. 构建各技能所需的参数
    const skillParams = buildSkillParams(routeConfig, message, userId, context, moodState);

    // 5. 调用对应的技能（传入情绪状态）
    const result = await callSkill(routeConfig.skill, routeConfig.action, skillParams);

    // 6. 附加情绪反馈
    const moodFeedback = moodService.getMoodFeedback(userId, {
      intent,
      messageLength: message.length
    });

    return {
      success: true,
      agentType: intent,
      ...result,
      mood: moodFeedback.mood,
      moodFeedback: moodFeedback.feedback,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[AgentManager] 处理失败:', error);
    return {
      success: false,
      error: error.message,
      agentType: 'manager',
      mood: moodService.getMoodState(userId).currentMood
    };
  }
}

/**
 * 构建各技能所需的参数
 */
function buildSkillParams(routeConfig, message, userId, context, moodState) {
  const moodData = {
    currentMood: moodState.currentMood,
    accuracy: moodState.accuracy,
    streakDays: moodState.streakDays,
    moodScore: moodState.moodScore
  };

  const baseParams = { userId, moodState: moodData, context };

  switch (routeConfig.skill) {
    case 'skill-tutor':
      return { ...baseParams, topic: message, studentLevel: 'beginner' };
    case 'skill-study-planner':
      return { ...baseParams, goal: message, currentLevel: 'beginner' };
    case 'skill-homework-helper':
      return { ...baseParams, content: message };
    case 'skill-evaluator':
      return { ...baseParams, homeworkContent: message };
    case 'skill-companion':
      return { ...baseParams, message };
    case 'skill-search':
      return { ...baseParams, query: message };
    default:
      return { ...baseParams, message };
  }
}

/**
 * 调用子技能（真实调用）
 */
const SKILL_MAP = {
  'skill-study-planner': plannerSkill,
  'skill-tutor': tutorSkill,
  'skill-homework-helper': helperSkill,
  'skill-evaluator': evaluatorSkill,
  'skill-companion': companionSkill,
  'skill-search': searchSkill
};

async function callSkill(skillName, action, params) {
  console.log(`[AgentManager] 调用技能：${skillName}.${action}`, params);

  const skill = SKILL_MAP[skillName];
  if (!skill) {
    throw new Error(`未知技能：${skillName}`);
  }

  const actionFn = skill.actions[action];
  if (!actionFn) {
    throw new Error(`技能 ${skillName} 没有动作：${action}`);
  }

  const result = await actionFn(params);
  return result;
}

/**
 * 获取智能体状态（带情绪系统状态）
 */
export async function getAgentStatus() {
  return {
    status: 'online',
    manager: 'active',
    moodSystem: 'enabled',
    agents: [
      { name: 'Planner', type: AGENT_TYPES.PLANNER, status: 'online', skill: 'skill-study-planner' },
      { name: 'Tutor', type: AGENT_TYPES.TUTOR, status: 'online', skill: 'skill-tutor' },
      { name: 'Helper', type: AGENT_TYPES.HELPER, status: 'online', skill: 'skill-homework-helper' },
      { name: 'Evaluator', type: AGENT_TYPES.EVALUATOR, status: 'online', skill: 'skill-evaluator' },
      { name: 'Companion', type: AGENT_TYPES.COMPANION, status: 'online', skill: 'skill-companion' },
      { name: 'Search', type: AGENT_TYPES.SEARCH, status: 'online', skill: 'skill-search' }
    ]
  };
}

/**
 * 获取智能体列表
 */
export async function getAgentList() {
  return Object.values(ROUTE_CONFIG).map(config => ({
    type: config.skill.replace('skill-', ''),
    name: config.skill,
    description: getAgentDescription(config.skill),
    actions: [config.action],
    moodEnabled: true
  }));
}

function getAgentDescription(skillName) {
  const descriptions = {
    'skill-study-planner': '学习规划智能体，制定个性化学习计划',
    'skill-tutor': '教学智能体，苏格拉底式知识点讲解',
    'skill-homework-helper': '答疑智能体，作业辅导和问题解答',
    'skill-evaluator': '评估智能体，作业批改和学习分析',
    'skill-companion': '陪伴智能体，情感支持和聊天交流',
    'skill-search': '搜索智能体，查找学习资源和教程推荐'
  };
  return descriptions[skillName] || '未知智能体';
}

/**
 * 更新学习表现（供其他 Skills 调用）
 */
export async function updatePerformance({ userId, correct, total, date }) {
  const newState = moodService.updatePerformance(userId, { correct, total, date });
  
  return {
    success: true,
    userId,
    moodState: {
      currentMood: newState.currentMood,
      accuracy: newState.accuracy,
      streakDays: newState.streakDays,
      moodScore: newState.moodScore
    },
    feedback: moodService.getMoodFeedback(userId).feedback
  };
}

/**
 * 获取用户情绪状态
 */
export async function getMoodState({ userId }) {
  const state = moodService.getMoodState(userId);
  
  return {
    success: true,
    userId,
    moodState: {
      currentMood: state.currentMood,
      accuracy: state.accuracy,
      streakDays: state.streakDays,
      moodScore: state.moodScore,
      totalQuestions: state.totalQuestions,
      correctQuestions: state.correctQuestions
    }
  };
}

/**
 * 获取情绪历史
 */
export async function getMoodHistory({ userId, limit = 10 }) {
  const history = moodService.getMoodHistory(userId, limit);
  
  return {
    success: true,
    userId,
    history
  };
}

// 导出 OpenClaw Skill 接口
export const skill = {
  name: 'skill-agent-manager',
  version: '1.0.0',
  description: 'Course AI Tutor Agent Manager - 智能体路由和协调（带情绪反馈）',
  
  actions: {
    /**
     * 处理用户消息，智能路由到合适的智能体
     */
    async handleMessage(params) {
      return handleMessage(params);
    },
    
    /**
     * 获取智能体状态
     */
    async getStatus() {
      return getAgentStatus();
    },
    
    /**
     * 获取智能体列表
     */
    async getList() {
      return getAgentList();
    },
    
    /**
     * 更新学习表现
     */
    async updatePerformance(params) {
      return updatePerformance(params);
    },
    
    /**
     * 获取情绪状态
     */
    async getMoodState(params) {
      return getMoodState(params);
    },
    
    /**
     * 获取情绪历史
     */
    async getMoodHistory(params) {
      return getMoodHistory(params);
    }
  }
};

export default skill;
