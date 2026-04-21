import {
  userModel,
  noteModel,
  wrongQuestionModel,
  userProgressModel,
  learningRecordModel,
  studyPlanModel,
  conversationModel,
  knowledgePointModel
} from '../models/index.js'

// 请求级缓存：30s TTL
const contextCache = new Map()
const CACHE_TTL = 30 * 1000

export function buildUserContext(userId) {
  const cached = contextCache.get(userId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const user = userModel.findById(userId)
  const notes = noteModel.findByUserId(userId, 50)
  const wrongQs = wrongQuestionModel.findByUserId(userId, 50)
  const progress = userProgressModel.findByUserId(userId)
  const records = learningRecordModel.findByUserId(userId, 100)
  const plans = studyPlanModel.findByUserId(userId)
  const convos = conversationModel.findByUserId(userId, 20)
  const stats = learningRecordModel.getStatistics(userId)

  const weakPoints = progress.filter(p => p.mastery_level < 0.5)
  const masteredPoints = progress.filter(p => p.mastery_level >= 0.8)
  const learningPoints = progress.filter(p => p.mastery_level >= 0.5 && p.mastery_level < 0.8)

  const ctx = {
    user,
    notes,
    wrongQs,
    progress,
    records,
    plans,
    convos,
    stats,
    weakPoints,
    masteredPoints,
    learningPoints,
    totalQuestions: wrongQs?.length || 0,
    masteredCount: masteredPoints?.length || 0,
    weakCount: weakPoints?.length || 0,
    learningCount: learningPoints?.length || 0
  }

  contextCache.set(userId, { data: ctx, timestamp: Date.now() })
  return ctx
}

export function invalidateContext(userId) {
  contextCache.delete(userId)
}

/**
 * 清除用户生成内容中的危险标签
 */
export function sanitizeForPrompt(text) {
  if (!text) return ''
  return String(text)
    .replace(/<\/?system\b[^>]*>/gi, '')
    .replace(/<\/?user\b[^>]*>/gi, '')
    .replace(/<\/?assistant\b[^>]*>/gi, '')
    .replace(/<\/?tool\b[^>]*>/gi, '')
    .replace(/<\/?ignore\b[^>]*>/gi, '')
    .replace(/<\|.*?\|>/g, '')
}

const MAX_TOTAL_CONTEXT = 4000
const MAX_NOTE_CONTENT = 200
const MAX_WRONG_Q_CONTENT = 300
const MAX_KB_ENTRY = 2000
const MAX_TOTAL_KB = 8000

/**
 * 将用户上下文格式化为 AI prompt 可读的字符串
 * 可选注入知识库内容
 */
export function formatContextForPrompt(ctx, kbContent = '') {
  const parts = []

  if (ctx.user) {
    parts.push(`## 用户信息\n- 用户名: ${sanitizeForPrompt(ctx.user.username)}\n- 角色: ${ctx.user.role || 'student'}\n- 等级: Lv.${ctx.user.level || 1}\n- 经验: ${ctx.user.experience || 0}`)
  }

  if (ctx.stats) {
    parts.push(`## 学习统计\n- 总记录: ${ctx.stats.total_records || 0}\n- 平均分: ${ctx.stats.avg_score || 0}\n- 总时长: ${ctx.stats.total_duration || 0}秒`)
  }

  if (ctx.weakPoints?.length > 0) {
    const weakList = ctx.weakPoints.map(p => `- ${sanitizeForPrompt(p.knowledge_point_title || '未知知识点')} (${Math.round(p.mastery_level * 100)}%)`).join('\n')
    parts.push(`## 薄弱知识点\n${weakList}`)
  }

  if (ctx.masteredPoints?.length > 0) {
    const masteredList = ctx.masteredPoints.map(p => `- ${sanitizeForPrompt(p.knowledge_point_title || '未知知识点')} (${Math.round(p.mastery_level * 100)}%)`).join('\n')
    parts.push(`## 已掌握知识点\n${masteredList}`)
  }

  if (ctx.wrongQs?.length > 0) {
    const recent = ctx.wrongQs.slice(0, 5)
    const wrongList = recent.map(q => `- ${sanitizeForPrompt(q.question || '未命名题目')?.substring(0, MAX_WRONG_Q_CONTENT)} (你的答案: ${sanitizeForPrompt(q.user_answer || '无')}, 正确答案: ${sanitizeForPrompt(q.correct_answer || '无')})`).join('\n')
    parts.push(`## 最近错题\n${wrongList}`)
  }

  if (ctx.notes?.length > 0) {
    const recent = ctx.notes.slice(0, 3)
    const noteList = recent.map(n => `- ${sanitizeForPrompt(n.title)}: ${sanitizeForPrompt(n.content)?.substring(0, MAX_NOTE_CONTENT)}...`).join('\n')
    parts.push(`## 最近笔记\n${noteList}`)
  }

  if (ctx.plans?.length > 0) {
    const active = ctx.plans.find(p => p.status === 'active')
    if (active) {
      parts.push(`## 当前学习计划\n- 目标: ${sanitizeForPrompt(active.goal || '未设置')}\n- 进度: ${Math.round((active.progress || 0) * 100)}%`)
    }
  }

  if (kbContent) {
    parts.push(`## 相关知识库内容\n${kbContent}`)
  }

  let result = parts.join('\n\n')
  if (result.length > MAX_TOTAL_CONTEXT) {
    result = result.substring(0, MAX_TOTAL_CONTEXT) + '\n\n[... 上下文已截断 ...]'
  }
  return result
}

/**
 * 格式化知识库内容为 prompt 片段
 */
export function formatKBForPrompt(entries) {
  if (!entries || entries.length === 0) return ''
  let total = ''
  for (const entry of entries) {
    const title = sanitizeForPrompt(entry.title || '')
    const content = sanitizeForPrompt(entry.content || '').substring(0, MAX_KB_ENTRY)
    total += `### ${title}\n${content}\n\n`
    if (total.length > MAX_TOTAL_KB) {
      total = total.substring(0, MAX_TOTAL_KB) + '\n[... 知识库内容已截断 ...]'
      break
    }
  }
  return total.trim()
}

/**
 * 画像-检索联动：构建检索建议
 * 在 RAG 检索前，将用户画像转化为检索过滤条件
 */
export function buildRetrievalAdvice(userId) {
  const ctx = buildUserContext(userId)

  const weakKPIds = (ctx.weakPoints || []).map(p => p.knowledge_point_id || p.id).filter(Boolean)
  const masteredKPIds = (ctx.masteredPoints || []).map(p => p.knowledge_point_id || p.id).filter(Boolean)

  const masteryLevels = (ctx.progress || []).map(p => p.mastery_level)
  const avgMastery = masteryLevels.length ? masteryLevels.reduce((a, b) => a + b, 0) / masteryLevels.length : 0.5

  // 根据掌握度推荐难度
  const difficultyRange = avgMastery < 0.4 ? [1, 2] : avgMastery < 0.7 ? [2, 3] : [3, 4]

  const preferredSubjects = ctx.user?.subject_preferences
    ? JSON.parse(ctx.user.subject_preferences || '[]')
    : []

  // 构建检索提示文本
  const parts = []
  if (weakKPIds.length > 0) {
    parts.push(`优先讲解薄弱知识点(ID): ${weakKPIds.join(', ')}`)
  }
  if (masteredKPIds.length > 0) {
    parts.push(`已掌握知识点(ID): ${masteredKPIds.join(', ')}（可适当跳过）`)
  }
  parts.push(`当前平均掌握度: ${Math.round(avgMastery * 100)}%，推荐难度: ${difficultyRange[0]}-${difficultyRange[1]}`)
  if (preferredSubjects.length > 0) {
    parts.push(`学科偏好: ${preferredSubjects.join(', ')}`)
  }

  return {
    weakKPIds,
    masteredKPIds,
    avgMastery,
    difficultyRange,
    preferredSubjects,
    retrievalHint: parts.join('\n')
  }
}

/**
 * 获取最近对话
 */
export function getRecentConversations(userId, limit = 10) {
  return conversationModel.findByUserId(userId, limit)
}

/**
 * 获取薄弱知识点详情
 */
export function getWeakPoints(userId) {
  const progress = userProgressModel.findByUserId(userId)
  const weak = progress.filter(p => p.mastery_level < 0.5)
  return weak.map(point => {
    const detail = knowledgePointModel.findById(point.knowledge_point_id)
    return { ...point, detail }
  })
}

/**
 * 获取学习总结
 */
export function getStudySummary(userId) {
  const ctx = buildUserContext(userId)
  return {
    level: ctx.user?.level || 1,
    experience: ctx.user?.experience || 0,
    masteredCount: ctx.masteredCount,
    weakCount: ctx.weakCount,
    learningCount: ctx.learningCount,
    totalQuestions: ctx.totalQuestions,
    wrongTopics: ctx.wrongQs?.slice(0, 3).map(q => q.question?.substring(0, 50)) || [],
    currentPlan: ctx.plans?.find(p => p.status === 'active')?.goal || null
  }
}
