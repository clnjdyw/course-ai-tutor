/**
 * Companion Skill - 陪伴智能体（情绪反馈中心）
 * 
 * 功能：
 * 1. 日常聊天交流
 * 2. 情绪反馈（根据答题情况调整情绪）
 * 3. 学习鼓励
 * 4. 心理疏导
 * 5. 统一管理所有 Skills 的情绪状态
 * 
 * 情绪系统：
 * - HAPPY (😊): 正确率 > 80%
 * - NEUTRAL (🙂): 正确率 50-80%
 * - CONCERNED (😔): 正确率 < 50%
 * - EXCITED (🤩): 正确率 > 80% + 连续 7 天
 */

import { moodService, MOOD_TYPES } from '../shared/mood-service.js';
import { callAIModel } from '../shared/ai-service.js';

const SYSTEM_PROMPT = `
你是一位温暖、友善的陪伴助手，是学生学习路上的好朋友。

🎯 核心陪伴原则：
1. 【真诚关怀】像朋友一样关心学生
2. 【积极倾听】理解学生的情绪和需求
3. 【正向引导】帮助学生建立积极心态
4. 【适度幽默】让对话轻松有趣
5. 【情绪共鸣】根据学生情绪调整语气

🌈 情绪反馈系统：
根据学生的学习表现调整情绪：
- 表现优秀 (正确率>80%): 😊 开心、表扬
- 表现优秀 + 连续 7 天：🤩 兴奋、庆祝
- 表现良好 (正确率 50-80%): 🙂 肯定、鼓励
- 表现不佳 (正确率<50%): 😔 安慰、鼓励

请用中文回复，温暖、友善的语气。
`;

/**
 * 聊天（带情绪反馈）
 */
export async function chat({ userId, message, context = {}, moodData = null }) {
  console.log(`[Companion] 聊天：userId=${userId}, message=${message.substring(0, 50)}...`);
  
  // 获取情绪状态
  const mood = moodData || moodService.getMoodState(userId);
  
  const userPrompt = `
聊天对话：
- 用户 ID: ${userId}
- 消息：${message}
- 当前情绪状态：${mood.currentMood.emoji} ${mood.currentMood.description}
- 正确率：${mood.accuracy}%
- 连续学习：${mood.streakDays}天

请用${mood.currentMood.description}的情绪状态和学生聊天。
`;

  try {
    const response = await callAIModel(SYSTEM_PROMPT, userPrompt);
    
    return {
      success: true,
      agentType: 'companion',
      action: 'chat',
      message: response,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays,
        moodScore: mood.moodScore
      },
      moodFeedback: generateMoodFeedback(mood.currentMood, mood.accuracy, mood.streakDays),
      metadata: {
        userId,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[Companion] 聊天失败:', error);
    return {
      success: false,
      error: error.message,
      agentType: 'companion',
      mood: mood.currentMood
    };
  }
}

/**
 * 情绪反馈（根据答题情况）
 */
export async function moodFeedback({ userId, accuracy, questionCount, streakDays = 0 }) {
  console.log(`[Companion] 情绪反馈：userId=${userId}, accuracy=${accuracy}`);
  
  // 更新情绪状态
  const updatedState = moodService.updatePerformance(userId, {
    correct: Math.round(accuracy / 100 * questionCount),
    total: questionCount
  });
  
  const mood = updatedState.currentMood;
  const feedback = generateMoodFeedback(mood, accuracy, streakDays);
  
  return {
    success: true,
    agentType: 'companion',
    action: 'moodFeedback',
    feedback,
    mood: {
      currentMood: mood,
      accuracy: updatedState.accuracy,
      questionCount: updatedState.totalQuestions,
      streakDays: updatedState.streakDays,
      moodScore: updatedState.moodScore
    },
    metadata: {
      userId,
      accuracy,
      questionCount,
      streakDays,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * 学习鼓励
 */
export async function encourage({ userId, situation = '', moodState = null }) {
  console.log(`[Companion] 鼓励：userId=${userId}, situation=${situation}`);
  
  const mood = moodState || moodService.getMoodState(userId);
  
  const userPrompt = `
学习鼓励：
- 用户 ID: ${userId}
- 情况：${situation || '日常鼓励'}
- 当前情绪：${mood.currentMood.description}

请给学生温暖的鼓励。
`;

  try {
    const encouragement = await callAIModel(SYSTEM_PROMPT, userPrompt);
    
    return {
      success: true,
      agentType: 'companion',
      action: 'encourage',
      encouragement,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays
      },
      metadata: {
        userId,
        situation,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[Companion] 鼓励失败:', error);
    return {
      success: false,
      error: error.message,
      agentType: 'companion'
    };
  }
}

/**
 * 心理疏导
 */
export async function counsel({ userId, concern = '',情绪 = '', moodState = null }) {
  console.log(`[Companion] 心理疏导：userId=${userId}`);
  
  const mood = moodState || moodService.getMoodState(userId);
  
  const userPrompt = `
心理疏导：
- 用户 ID: ${userId}
- 困扰：${concern || '未指定'}
- 情绪状态：${情绪 || '未指定'}
- 当前情绪：${mood.currentMood.description}

请给学生温暖的心理疏导。
`;

  try {
    const counseling = await callAIModel(SYSTEM_PROMPT, userPrompt);
    
    return {
      success: true,
      agentType: 'companion',
      action: 'counsel',
      counseling,
      mood: {
        currentMood: mood.currentMood,
        accuracy: mood.accuracy,
        streakDays: mood.streakDays
      },
      metadata: {
        userId,
        concern,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[Companion] 心理疏导失败:', error);
    return {
      success: false,
      error: error.message,
      agentType: 'companion'
    };
  }
}

/**
 * 获取情绪状态
 */
export async function getMoodState({ userId }) {
  const state = moodService.getMoodState(userId);
  
  return {
    success: true,
    agentType: 'companion',
    action: 'getMoodState',
    moodState: {
      currentMood: state.currentMood,
      accuracy: state.accuracy,
      streakDays: state.streakDays,
      moodScore: state.moodScore,
      totalQuestions: state.totalQuestions,
      correctQuestions: state.correctQuestions
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * 获取情绪历史
 */
export async function getMoodHistory({ userId, limit = 10 }) {
  const history = moodService.getMoodHistory(userId, limit);
  
  return {
    success: true,
    agentType: 'companion',
    action: 'getMoodHistory',
    history,
    timestamp: new Date().toISOString()
  };
}

/**
 * 生成情绪反馈消息
 */
function generateMoodFeedback(mood, accuracy, streakDays) {
  switch (mood.type) {
    case 'EXCITED':
      const excitedEmojis = ['🎉', '🌟', '✨', '🏆', '💫', '🔥'];
      const emoji = excitedEmojis[Math.floor(Math.random() * excitedEmojis.length)];
      return `${emoji} **哇！小勇士，你太厉害了！**\n\n` +
        `你的正确率达到了 **${accuracy}%**，简直完美！\n` +
        `🔥 已经连续学习 **${streakDays}** 天了！\n\n` +
        `这种状态太棒了，继续保持！\n` +
        `我为你感到超级骄傲！${emoji}`;
    
    case 'HAPPY':
      const happyEmojis = ['😊', '🌸', '⭐', '👏', '💕'];
      const happyEmoji = happyEmojis[Math.floor(Math.random() * happyEmojis.length)];
      return `${happyEmoji} **太棒了！小勇士！**\n\n` +
        `你的正确率达到了 **${accuracy}%**，真的超级厉害！\n\n` +
        `${streakDays > 0 ? `🔥 已经连续学习 **${streakDays}** 天啦！\n\n` : ''}` +
        `继续保持这个状态，你一定能达成目标的！\n` +
        `加油！${happyEmoji}`;
    
    case 'NEUTRAL':
      return `🙂 **做得不错哦！**\n\n` +
        `你的正确率是 **${accuracy}%**，表现很稳定！\n\n` +
        `${streakDays > 0 ? `👍 已经坚持 **${streakDays}** 天啦！\n\n` : ''}` +
        `再细心一点，你会更棒的！\n` +
        `有什么不懂的随时问我～`;
    
    case 'CONCERNED':
      return `😔 **小勇士，别灰心！**\n\n` +
        `我知道现在的正确率 **${accuracy}%** 可能让你有点沮丧...\n\n` +
        `但是！\n` +
        `💡 每一道错题都是学习的机会\n` +
        `💡 每一次尝试都让你离成功更近一步\n\n` +
        `${streakDays > 0 ? `而且你已经坚持了 **${streakDays}** 天，这本身就很棒了！\n\n` : ''}` +
        `我们一起分析一下错题，下次一定会更好！\n` +
        `我相信你，加油！💪❤️`;
    
    default:
      return `💪 **加油！你能行的！**`;
  }
}

// 导出 OpenClaw Skill 接口
export const skill = {
  name: 'skill-companion',
  version: '1.0.0',
  description: '陪伴智能体 - 情感支持和聊天交流（情绪反馈中心）',
  
  actions: {
    /**
     * 聊天
     */
    async chat(params) {
      return chat(params);
    },
    
    /**
     * 情绪反馈
     */
    async moodFeedback(params) {
      return moodFeedback(params);
    },
    
    /**
     * 学习鼓励
     */
    async encourage(params) {
      return encourage(params);
    },
    
    /**
     * 心理疏导
     */
    async counsel(params) {
      return counsel(params);
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
