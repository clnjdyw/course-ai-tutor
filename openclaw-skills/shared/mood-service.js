/**
 * Shared Mood Service - 共享情绪状态管理服务
 * 
 * 功能：
 * 1. 存储和更新学生情绪状态
 * 2. 根据学习表现计算情绪
 * 3. 提供情绪反馈给所有 Skills
 * 4. 追踪情绪变化历史
 * 
 * 情绪类型：
 * - HAPPY (😊): 正确率 > 80%
 * - EXCITED (🤩): 正确率 > 80% + 连续 7 天
 * - NEUTRAL (🙂): 正确率 50-80%
 * - CONCERNED (😔): 正确率 < 50%
 * - ENCOURAGING (💪): 需要鼓励时
 */

// 情绪类型定义
export const MOOD_TYPES = {
  HAPPY: {
    type: 'HAPPY',
    emoji: '😊',
    description: '开心',
    color: '#FFD700',
    minAccuracy: 80,
    message: '太棒了！继续保持！'
  },
  EXCITED: {
    type: 'EXCITED',
    emoji: '🤩',
    description: '兴奋',
    color: '#FF69B4',
    minAccuracy: 80,
    minStreak: 7,
    message: '你真是太厉害了！'
  },
  NEUTRAL: {
    type: 'NEUTRAL',
    emoji: '🙂',
    description: '平静',
    color: '#87CEEB',
    minAccuracy: 50,
    message: '做得不错，继续加油！'
  },
  CONCERNED: {
    type: 'CONCERNED',
    emoji: '😔',
    description: '关心',
    color: '#9370DB',
    minAccuracy: 0,
    message: '别灰心，我们一起努力！'
  },
  ENCOURAGING: {
    type: 'ENCOURAGING',
    emoji: '💪',
    description: '鼓励',
    color: '#32CD32',
    message: '相信自己，你能行的！'
  }
};

// 内存存储（生产环境应使用数据库）
const moodStore = new Map(); // userId -> MoodState
const moodHistory = new Map(); // userId -> MoodHistory[]

/**
 * 情绪状态
 */
export class MoodState {
  constructor(userId) {
    this.userId = userId;
    this.currentMood = MOOD_TYPES.NEUTRAL;
    this.accuracy = 50; // 正确率
    this.totalQuestions = 0; // 总题数
    this.correctQuestions = 0; // 正确题数
    this.streakDays = 0; // 连续学习天数
    this.lastActiveDate = null;
    this.moodScore = 50; // 情绪分数 0-100
    this.updatedAt = new Date().toISOString();
  }
}

/**
 * 情绪历史记录
 */
export class MoodHistoryEntry {
  constructor(userId, mood, reason) {
    this.userId = userId;
    this.mood = mood;
    this.reason = reason;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * 获取或创建用户情绪状态
 */
export function getMoodState(userId) {
  if (!moodStore.has(userId)) {
    moodStore.set(userId, new MoodState(userId));
  }
  return moodStore.get(userId);
}

/**
 * 更新学习表现数据
 */
export function updatePerformance(userId, performance) {
  const state = getMoodState(userId);
  const { correct, total, date = new Date().toISOString() } = performance;
  
  // 更新统计数据
  if (total > 0) {
    state.correctQuestions += correct;
    state.totalQuestions += total;
    state.accuracy = Math.round((state.correctQuestions / state.totalQuestions) * 100);
  }
  
  // 更新连续学习天数
  const today = new Date(date).toDateString();
  const lastActive = state.lastActiveDate ? new Date(state.lastActiveDate).toDateString() : null;
  
  if (today !== lastActive) {
    if (lastActive) {
      const daysDiff = daysBetween(new Date(state.lastActiveDate), new Date(date));
      if (daysDiff === 1) {
        state.streakDays += 1;
      } else if (daysDiff > 1) {
        state.streakDays = 1; // 中断后重新开始
      }
    } else {
      state.streakDays = 1;
    }
    state.lastActiveDate = date;
  }
  
  // 计算并更新情绪
  const newMood = calculateMood(state);
  const oldMood = state.currentMood;
  
  state.currentMood = newMood;
  state.moodScore = calculateMoodScore(state);
  state.updatedAt = new Date().toISOString();
  
  // 记录历史
  if (oldMood.type !== newMood.type) {
    recordMoodHistory(userId, newMood, `正确率：${state.accuracy}%, 连续：${state.streakDays}天`);
  }
  
  return state;
}

/**
 * 计算情绪状态
 */
export function calculateMood(state) {
  const { accuracy, streakDays } = state;
  
  if (accuracy >= 80 && streakDays >= 7) {
    return MOOD_TYPES.EXCITED;
  } else if (accuracy >= 80) {
    return MOOD_TYPES.HAPPY;
  } else if (accuracy >= 50) {
    return MOOD_TYPES.NEUTRAL;
  } else {
    return MOOD_TYPES.CONCERNED;
  }
}

/**
 * 计算情绪分数 (0-100)
 */
export function calculateMoodScore(state) {
  const { accuracy, streakDays } = state;
  
  // 正确率占 70%，连续天数占 30%
  const accuracyScore = accuracy * 0.7;
  const streakScore = Math.min(streakDays * 5, 30); // 最多 30 分
  
  return Math.round(accuracyScore + streakScore);
}

/**
 * 记录情绪历史
 */
export function recordMoodHistory(userId, mood, reason = '') {
  if (!moodHistory.has(userId)) {
    moodHistory.set(userId, []);
  }
  
  const history = moodHistory.get(userId);
  const entry = new MoodHistoryEntry(userId, mood, reason);
  history.push(entry);
  
  // 只保留最近 100 条记录
  if (history.length > 100) {
    history.shift();
  }
  
  return entry;
}

/**
 * 获取情绪历史
 */
export function getMoodHistory(userId, limit = 10) {
  const history = moodHistory.get(userId) || [];
  return history.slice(-limit);
}

/**
 * 获取情绪反馈消息
 */
export function getMoodFeedback(userId, context = {}) {
  const state = getMoodState(userId);
  const mood = state.currentMood;
  
  let feedback = '';
  
  switch (mood.type) {
    case 'EXCITED':
      feedback = generateExcitedFeedback(state, context);
      break;
    case 'HAPPY':
      feedback = generateHappyFeedback(state, context);
      break;
    case 'NEUTRAL':
      feedback = generateNeutralFeedback(state, context);
      break;
    case 'CONCERNED':
      feedback = generateConcernedFeedback(state, context);
      break;
    case 'ENCOURAGING':
      feedback = generateEncouragingFeedback(state, context);
      break;
  }
  
  return {
    feedback,
    mood: {
      ...mood,
      accuracy: state.accuracy,
      streakDays: state.streakDays,
      moodScore: state.moodScore
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * 生成兴奋反馈
 */
function generateExcitedFeedback(state, context) {
  const emojis = ['🎉', '🌟', '✨', '🏆', '💫', '🔥'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  
  return `${emoji} **哇！小勇士，你太厉害了！**\n\n` +
    `你的正确率达到了 **${state.accuracy}%**，简直完美！\n` +
    `🔥 已经连续学习 **${state.streakDays}** 天了！\n\n` +
    `这种状态太棒了，继续保持！\n` +
    `我为你感到超级骄傲！${emoji}`;
}

/**
 * 生成开心反馈
 */
function generateHappyFeedback(state, context) {
  const emojis = ['😊', '🌸', '⭐', '👏', '💕'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  
  return `${emoji} **太棒了！小勇士！**\n\n` +
    `你的正确率达到了 **${state.accuracy}%**，真的超级厉害！\n\n` +
    `${state.streakDays > 0 ? `🔥 已经连续学习 **${state.streakDays}** 天啦！\n\n` : ''}` +
    `继续保持这个状态，你一定能达成目标的！\n` +
    `加油！${emoji}`;
}

/**
 * 生成平静反馈
 */
function generateNeutralFeedback(state, context) {
  return `🙂 **做得不错哦！**\n\n` +
    `你的正确率是 **${state.accuracy}%**，表现很稳定！\n\n` +
    `${state.streakDays > 0 ? `👍 已经坚持 **${state.streakDays}** 天啦！\n\n` : ''}` +
    `再细心一点，你会更棒的！\n` +
    `有什么不懂的随时问我～`;
}

/**
 * 生成关心反馈
 */
function generateConcernedFeedback(state, context) {
  return `😔 **小勇士，别灰心！**\n\n` +
    `我知道现在的正确率 **${state.accuracy}%** 可能让你有点沮丧...\n\n` +
    `但是！\n` +
    `💡 每一道错题都是学习的机会\n` +
    `💡 每一次尝试都让你离成功更近一步\n\n` +
    `${state.streakDays > 0 ? `而且你已经坚持了 **${state.streakDays}** 天，这本身就很棒了！\n\n` : ''}` +
    `我们一起分析一下错题，下次一定会更好！\n` +
    `我相信你，加油！💪❤️`;
}

/**
 * 生成鼓励反馈
 */
function generateEncouragingFeedback(state, context) {
  return `💪 **小勇士，加油！**\n\n` +
    `学习路上遇到困难是很正常的～\n\n` +
    `记住：\n` +
    `🌟 没有人一开始就什么都会\n` +
    `🌟 每一次努力都在让你变得更强\n` +
    `🌟 我会一直陪着你\n\n` +
    `有什么不懂的，随时问我！\n` +
    `我们一起克服！❤️`;
}

/**
 * 计算两个日期之间的天数差
 */
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
}

/**
 * 导出情绪服务
 */
export const moodService = {
  getMoodState,
  updatePerformance,
  calculateMood,
  calculateMoodScore,
  getMoodHistory,
  getMoodFeedback,
  recordMoodHistory,
  MOOD_TYPES
};

export default moodService;
