/**
 * Search Skill - 搜索智能体（带情绪反馈）
 *
 * 功能：
 * 1. 搜索学习资源
 * 2. 查找知识点相关资料
 * 3. 推荐教程和参考链接
 * 4. 情绪适配的搜索提示和结果展示
 */

import { moodService } from '../shared/mood-service.js';
import { callAIModel } from '../shared/ai-service.js';
import fetch from 'node-fetch';

const SEARXNG_URL = process.env.SEARXNG_URL || 'http://localhost:8080';

const SYSTEM_PROMPT = `
你是一位善于查找资料的助手。

🎯 核心原则：
1. 【精准搜索】根据学生需求找到相关资源
2. 【筛选推荐】从搜索结果中筛选最合适的学习资源
3. 【分类整理】按类型（视频、文章、教程等）分类展示
4. 【情绪适配】根据学生情绪调整推荐语气

请始终用中文回复，使用 Markdown 格式。
`;

/**
 * 执行搜索
 */
async function searchWeb(query, numResults = 10, language = 'zh') {
  try {
    const url = `${SEARXNG_URL}/search?q=${encodeURIComponent(query)}&format=json&categories=general&language=${language}&pageno=1`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.warn('[Search] SearXNG搜索失败:', response.status);
      return { results: [], error: '搜索服务不可用' };
    }

    const data = await response.json();
    return {
      results: (data.results || []).slice(0, numResults).map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content || '',
        engine: r.engine || ''
      })),
      error: null
    };
  } catch (error) {
    console.warn('[Search] 搜索失败:', error.message);
    return { results: [], error: error.message };
  }
}

/**
 * 搜索资源
 */
export async function searchResources({ userId, query, category = 'all', moodState = null }) {
  const mood = moodState || moodService.getMoodState(userId);

  console.log(`[Search] 搜索资源：userId=${userId}, query=${query}, category=${category}`);

  // 执行搜索
  const searchResult = await searchWeb(query);

  // 根据情绪生成个性化提示
  const searchPrompt = moodPrompt(mood);

  // 用AI整理搜索结果
  let formattedResults = '';
  if (searchResult.results.length > 0) {
    const aiPrompt = `
你是一个学习资源整理助手。请根据以下搜索结果，为学生整理推荐相关学习资源。

搜索关键词：${query}

搜索结果：
${searchResult.results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`).join('\n\n')}

请：
1. 挑选最有价值的 3-5 个资源推荐
2. 用简短语言说明每个资源为什么有用
3. 使用 emoji 让推荐更生动
4. 如果搜索结果为空，给出学习建议

请始终用中文回复，使用 Markdown 格式。
`;

    try {
      formattedResults = await callAIModel(SYSTEM_PROMPT, aiPrompt);
    } catch (error) {
      console.error('[Search] AI整理失败:', error);
      formattedResults = formatRawResults(searchResult.results);
    }
  } else {
    formattedResults = `
🔍 **暂时没有找到相关资源呢...**

不过别灰心！你可以尝试：
1. 换个关键词搜索
2. 去搜索引擎手动查找
3. 问问老师或同学

我可以帮你换个关键词再试试，要吗？
`;
  }

  return {
    success: true,
    agentType: 'search',
    action: 'searchResources',
    searchQuery: query,
    rawResults: searchResult.results,
    formattedResults,
    mood: {
      currentMood: mood.currentMood,
      accuracy: mood.accuracy,
      streakDays: mood.streakDays,
      moodScore: mood.moodScore
    },
    moodFeedback: searchPrompt,
    metadata: {
      userId,
      category,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * 推荐教程
 */
export async function recommendTutorials({ userId, topic, level = 'beginner', moodState = null }) {
  const mood = moodState || moodService.getMoodState(userId);
  const query = `${topic} ${level === 'beginner' ? '入门教程' : level === 'intermediate' ? '进阶教程' : '高级教程'}`;

  const searchResult = await searchWeb(query, 8);

  let recommendation = '';
  if (searchResult.results.length > 0) {
    const aiPrompt = `
请为学生推荐关于"${topic}"的学习教程（水平：${level}）。

以下是搜索到的资源：
${searchResult.results.map((r, i) => `${i + 1}. ${r.title} - ${r.url}`).join('\n')}

请：
1. 推荐 3 个最适合的教程
2. 说明推荐理由
3. 按难度排序
4. 用 emoji 让推荐更生动
`;

    try {
      recommendation = await callAIModel(SYSTEM_PROMPT, aiPrompt);
    } catch (error) {
      recommendation = formatRawResults(searchResult.results);
    }
  }

  return {
    success: true,
    agentType: 'search',
    action: 'recommendTutorials',
    topic,
    recommendation,
    mood: {
      currentMood: mood.currentMood,
      accuracy: mood.accuracy,
      streakDays: mood.streakDays
    },
    metadata: { userId, level, timestamp: new Date().toISOString() }
  };
}

/**
 * 查找知识点资料
 */
export async function findKnowledgePoints({ userId, concept, subject = '', moodState = null }) {
  const mood = moodState || moodService.getMoodState(userId);
  const query = `${subject ? subject + ' ' : ''}${concept} 知识点 解释`;

  const searchResult = await searchWeb(query, 10);

  let summary = '';
  if (searchResult.results.length > 0) {
    const aiPrompt = `
请用简单易懂的方式，为学生解释"${concept}"这个概念。

以下是搜索到的参考资料：
${searchResult.results.slice(0, 5).map((r, i) => `${i + 1}. ${r.title}: ${r.snippet}`).join('\n')}

请：
1. 用通俗语言解释概念
2. 举 1-2 个生活中的例子
3. 提供进一步学习的方向
`;

    try {
      summary = await callAIModel(SYSTEM_PROMPT, aiPrompt);
    } catch (error) {
      summary = formatRawResults(searchResult.results);
    }
  }

  return {
    success: true,
    agentType: 'search',
    action: 'findKnowledgePoints',
    concept,
    summary,
    mood: {
      currentMood: mood.currentMood,
      accuracy: mood.accuracy,
      streakDays: mood.streakDays
    },
    metadata: { userId, subject, timestamp: new Date().toISOString() }
  };
}

function formatRawResults(results) {
  if (results.length === 0) return '没有找到相关结果。';
  return results.map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}`).join('\n\n');
}

function moodPrompt(mood) {
  switch (mood.currentMood.type) {
    case 'EXCITED':
      return '🤩 **让我们一起探索新知识！** 找到了一些有趣的资源，快来看看吧！';
    case 'HAPPY':
      return '😊 **找到了一些不错的资料！** 希望对你有帮助，慢慢看哦！';
    case 'NEUTRAL':
      return '🙂 **搜索结果出来了！** 不用着急，慢慢浏览，有不懂的随时问我。';
    case 'CONCERNED':
      return '😔 **找到了一些资料...** 没关系，如果太多看不懂，我们可以一起分析。别灰心！';
    default:
      return '🔍 **搜索结果已整理！** 希望对你有帮助！';
  }
}

export const skill = {
  name: 'skill-search',
  version: '1.0.0',
  description: '搜索智能体 - 查找学习资源、推荐教程、知识点资料（带情绪反馈）',

  actions: {
    async searchResources(params) { return searchResources(params); },
    async recommendTutorials(params) { return recommendTutorials(params); },
    async findKnowledgePoints(params) { return findKnowledgePoints(params); }
  }
};

export default skill;
