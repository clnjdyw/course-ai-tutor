/**
 * Evaluator Skill - 评估智能体（带情绪反馈）
 * 
 * 功能：
 * 1. 作业批改（给出评分和详细反馈）
 * 2. 学习报告生成
 * 3. 薄弱点分析
 * 4. 进步追踪
 * 5. 根据情绪调整反馈方式
 */

import { moodService } from '../shared/mood-service.js';
import { callAIModel } from '../shared/ai-service.js';

const SYSTEM_PROMPT = `
你是一位专业、友善的学习评估老师。

🎯 核心评估原则：
1. 【鼓励为主】先肯定优点，再指出不足
2. 【具体反馈】解释为什么
3. 【建设性建议】给出改进方向
4. 【成长思维】强调进步而非完美
5. 【情绪适配】根据情绪调整反馈方式

🌈 情绪适配：
- 情绪高涨：可以指出更多改进空间
- 情绪平静：平衡反馈
- 情绪低落：更多鼓励，减少批评

请用中文回复，使用 Markdown 格式。
`;

export async function evaluateHomework({ userId, homeworkContent, standardAnswer = '', rubric = '', moodState = null }) {
  const mood = moodState || moodService.getMoodState(userId);
  
  const userPrompt = `
作业批改：
- 用户 ID: ${userId}
- 学生答案：${homeworkContent}
- 参考答案：${standardAnswer || '无'}
- 当前情绪：${mood.currentMood.description}

请批改作业，根据情绪调整反馈方式。
`;

  try {
    const evaluation = await callAIModel(SYSTEM_PROMPT, userPrompt);
    const score = extractScore(evaluation);
    
    // 更新情绪表现
    if (score !== null) {
      moodService.updatePerformance(userId, { 
        correct: Math.round(score / 100 * 10), 
        total: 10 
      });
    }
    
    const updatedMood = moodService.getMoodState(userId);
    
    return {
      success: true,
      agentType: 'evaluator',
      action: 'evaluateHomework',
      evaluation,
      score,
      mood: {
        currentMood: updatedMood.currentMood,
        accuracy: updatedMood.accuracy,
        streakDays: updatedMood.streakDays,
        moodScore: updatedMood.moodScore
      },
      moodFeedback: generateMoodFeedback(updatedMood.currentMood, score),
      metadata: {
        userId,
        evaluatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      agentType: 'evaluator',
      mood: mood.currentMood
    };
  }
}

export async function generateReport({ userId, timeRange = 'week', learningData = {}, moodState = null }) {
  const mood = moodState || moodService.getMoodState(userId);
  
  try {
    const report = await callAIModel(SYSTEM_PROMPT, `生成报告：userId=${userId}, timeRange=${timeRange}, 情绪：${mood.currentMood.description}`);
    
    return {
      success: true,
      agentType: 'evaluator',
      action: 'generateReport',
      report,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays
      },
      metadata: { userId, timeRange, generatedAt: new Date().toISOString() }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      agentType: 'evaluator'
    };
  }
}

export async function analyzeWeaknesses({ userId, wrongQuestions = [], learningHistory = {}, moodState = null }) {
  const mood = moodState || moodService.getMoodState(userId);
  
  try {
    const analysis = await callAIModel(SYSTEM_PROMPT, `薄弱点分析：userId=${userId}, 情绪：${mood.currentMood.description}`);
    
    return {
      success: true,
      agentType: 'evaluator',
      action: 'analyzeWeaknesses',
      analysis,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays
      },
      moodFeedback: generateMoodFeedback(mood.currentMood),
      metadata: { userId, analyzedAt: new Date().toISOString() }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      agentType: 'evaluator'
    };
  }
}

export async function trackProgress({ userId, currentData, historicalData = [], moodState = null }) {
  const mood = moodState || moodService.getMoodState(userId);
  
  try {
    const progressReport = await callAIModel(SYSTEM_PROMPT, `进步追踪：userId=${userId}, 情绪：${mood.currentMood.description}`);
    
    return {
      success: true,
      agentType: 'evaluator',
      action: 'trackProgress',
      progressReport,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays
      },
      metadata: { userId, trackedAt: new Date().toISOString() }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      agentType: 'evaluator'
    };
  }
}

function extractScore(text) {
  const match = text.match(/(\d{1,3})\s*分/) || text.match(/(\d{1,3})\s*\/\s*100/);
  return match ? parseInt(match[1], 10) : null;
}

function generateMoodFeedback(mood, score = null) {
  if (score !== null) {
    if (score >= 90) {
      return `🎉 **太棒了！这个成绩非常优秀！**\n\n你的努力得到了回报，继续保持！`;
    } else if (score >= 75) {
      return `😊 **做得很好！**\n\n有一些小问题，但整体很棒！继续加油！`;
    } else if (score >= 60) {
      return `🙂 **不错哦！**\n\n还有进步空间，我相信你能做得更好！`;
    } else {
      return `💪 **别灰心！**\n\n这次没考好没关系，我们一起找出问题，下次一定会更好！`;
    }
  }
  
  switch (mood.type) {
    case 'EXCITED':
    case 'HAPPY':
      return `😊 **看到你这么棒的表现，我为你骄傲！**\n\n继续保持这个状态！`;
    case 'NEUTRAL':
      return `🙂 **表现稳定！**\n\n继续努力，你会越来越好的！`;
    case 'CONCERNED':
      return `😔 **我知道你可能不太满意...**\n\n但每一次练习都是进步的机会！我会陪着你一起努力！💕`;
    default:
      return `💪 **加油！你可以的！**`;
  }
}

export const skill = {
  name: 'skill-evaluator',
  version: '1.0.0',
  description: '评估智能体 - 作业批改和学习分析（带情绪反馈）',
  
  actions: {
    async evaluateHomework(params) { return evaluateHomework(params); },
    async generateReport(params) { return generateReport(params); },
    async analyzeWeaknesses(params) { return analyzeWeaknesses(params); },
    async trackProgress(params) { return trackProgress(params); }
  }
};

export default skill;
