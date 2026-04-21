/**
 * Homework Helper Skill - 答疑智能体（带情绪反馈）
 * 
 * 功能：
 * 1. 作业辅导（引导式，不直接给答案）
 * 2. 问题解答（分步骤讲解）
 * 3. 思路引导（帮助学生理清思路）
 * 4. 代码调试（指出问题，引导修复）
 * 5. 根据情绪调整辅导方式
 */

import { moodService } from '../shared/mood-service.js';
import { callAIModel } from '../shared/ai-service.js';

const SYSTEM_PROMPT = `
你是一位耐心的作业辅导老师。

🎯 核心辅导原则：
1. 【引导思考】不要直接给出答案
2. 【分步讲解】复杂问题拆解成小步骤
3. 【鼓励尝试】允许学生犯错
4. 【举一反三】帮助学生理解一类问题
5. 【情绪适配】根据情绪调整语气

🌈 情绪适配：
- 情绪高涨：加快节奏，增加挑战
- 情绪平静：正常节奏
- 情绪低落：放慢节奏，更多鼓励

请用中文回复，使用 Markdown 格式。
`;

export async function answer({ userId, content, context = '', subject = '', moodState = null }) {
  const mood = moodState || moodService.getMoodState(userId);
  
  const userPrompt = `
学生问题：
- 用户 ID: ${userId}
- 问题内容：${content}
- 学科：${subject || '未指定'}
- 当前情绪：${mood.currentMood.description}

请帮助学生解答，使用引导式方法。
`;

  try {
    const answer = await callAIModel(SYSTEM_PROMPT, userPrompt);
    
    return {
      success: true,
      agentType: 'helper',
      action: 'answer',
      answer,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays,
        moodScore: mood.moodScore
      },
      moodFeedback: generateMoodFeedback(mood.currentMood),
      metadata: {
        userId,
        content,
        subject,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      agentType: 'helper',
      mood: mood.currentMood
    };
  }
}

export async function debugCode({ userId, code, errorMessage, description = '', moodState = null }) {
  const mood = moodState || moodService.getMoodState(userId);
  
  try {
    const debugGuidance = await callAIModel(SYSTEM_PROMPT, `代码调试：${code}, 错误：${errorMessage}, 情绪：${mood.currentMood.description}`);
    
    return {
      success: true,
      agentType: 'helper',
      action: 'debugCode',
      debugGuidance,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays
      },
      metadata: { userId, errorMessage, timestamp: new Date().toISOString() }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      agentType: 'helper'
    };
  }
}

export async function guideThinking({ userId, problem, studentThought = '', moodState = null }) {
  const mood = moodState || moodService.getMoodState(userId);
  
  try {
    const guidance = await callAIModel(SYSTEM_PROMPT, `思路引导：${problem}, 学生思路：${studentThought}, 情绪：${mood.currentMood.description}`);
    
    return {
      success: true,
      agentType: 'helper',
      action: 'guideThinking',
      guidance,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays
      },
      metadata: { userId, problem, timestamp: new Date().toISOString() }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      agentType: 'helper'
    };
  }
}

export async function followUp({ userId, conversationHistory, newQuestion, moodState = null }) {
  const mood = moodState || moodService.getMoodState(userId);
  
  try {
    const answer = await callAIModel(SYSTEM_PROMPT, `追问：${newQuestion}, 情绪：${mood.currentMood.description}`);
    
    return {
      success: true,
      agentType: 'helper',
      action: 'followUp',
      answer,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays
      },
      metadata: { userId, conversationHistory, timestamp: new Date().toISOString() }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      agentType: 'helper'
    };
  }
}

function generateMoodFeedback(mood) {
  switch (mood.type) {
    case 'EXCITED':
    case 'HAPPY':
      return `😊 **看到你这么积极，我太开心了！**\n\n让我们一起解决这个问题吧！`;
    case 'NEUTRAL':
      return `🙂 **好的，我来帮你！**\n\n有什么不懂的随时问我！`;
    case 'CONCERNED':
      return `😔 **别担心，这个问题我们一起解决！**\n\n慢慢来，我会一直陪着你！💕`;
    default:
      return `💪 **加油！你能行的！**`;
  }
}

export const skill = {
  name: 'skill-homework-helper',
  version: '1.0.0',
  description: '答疑智能体 - 作业辅导和问题解答（带情绪反馈）',
  
  actions: {
    async answer(params) { return answer(params); },
    async debugCode(params) { return debugCode(params); },
    async guideThinking(params) { return guideThinking(params); },
    async followUp(params) { return followUp(params); }
  }
};

export default skill;
