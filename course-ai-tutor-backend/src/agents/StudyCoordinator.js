import { chat } from './AIService.js'
import { buildUserContext, formatContextForPrompt, formatKBForPrompt, invalidateContext } from './UserContext.js'
import {
  wrongQuestionModel,
  userProgressModel,
  noteModel,
  learningReminderModel,
  knowledgePointModel,
  learningRecordModel
} from '../models/index.js'
import sharedKB from './SharedKnowledgeBase.js'

/**
 * 全局会话管理
 */
class SessionManager {
  constructor() {
    this.sessions = new Map()
  }

  start(userId, mode = 'questioning', goal = '') {
    const id = `session_${userId}_${Date.now()}`
    const session = {
      id,
      userId,
      mode,
      startTime: new Date(),
      lastActivity: new Date(),
      history: [],
      currentGoal: goal,
      contextRefs: [],
      modeTransitions: [{ from: null, to: mode, at: new Date().toISOString() }]
    }
    this.sessions.set(id, session)
    sharedKB.publishEvent('session_start', 'study-coordinator', 'session-manager', { sessionId: id, userId, mode })
    return session
  }

  get(id) {
    return this.sessions.get(id) || null
  }

  findByUserId(userId) {
    for (const [, s] of this.sessions) {
      if (s.userId === userId) return s
    }
    return null
  }

  switchMode(sessionId, newMode) {
    const session = this.sessions.get(sessionId)
    if (!session) return false
    const oldMode = session.mode
    session.mode = newMode
    session.lastActivity = new Date()
    session.modeTransitions.push({ from: oldMode, to: newMode, at: new Date().toISOString() })
    sharedKB.publishEvent('mode_switch', 'study-coordinator', 'session-manager', { sessionId, from: oldMode, to: newMode })
    return true
  }

  addHistory(sessionId, entry) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    session.history.push({ ...entry, timestamp: new Date().toISOString() })
    session.lastActivity = new Date()
  }

  addContextRef(sessionId, ref) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    session.contextRefs.push(ref)
  }

  getRecentContext(sessionId, maxItems = 5) {
    const session = this.sessions.get(sessionId)
    if (!session) return []
    return session.history.slice(-maxItems)
  }

  end(sessionId) {
    const session = this.sessions.get(sessionId)
    if (!session) return null
    session.endTime = new Date()
    this.sessions.delete(sessionId)
    sharedKB.publishEvent('session_end', 'study-coordinator', 'session-manager', { sessionId, duration: session.endTime - session.startTime })
    return session
  }
}

/**
 * 画像-检索联动 (ContextAdvisor)
 */
class ContextAdvisor {
  buildRetrievalFilter(userId) {
    const ctx = buildUserContext(userId)
    const weakKPIds = (ctx.weakPoints || []).map(p => p.knowledge_point_id || p.id).filter(Boolean)
    const masteredKPIds = (ctx.masteredPoints || []).map(p => p.knowledge_point_id || p.id).filter(Boolean)
    const learningKPIds = (ctx.learningPoints || []).map(p => p.knowledge_point_id || p.id).filter(Boolean)

    // 根据掌握度推断合适难度
    const masteryLevels = (ctx.progress || []).map(p => p.mastery_level)
    const avgMastery = masteryLevels.length ? masteryLevels.reduce((a, b) => a + b, 0) / masteryLevels.length : 0.5
    const difficultyRange = avgMastery < 0.4 ? [1, 2] : avgMastery < 0.7 ? [2, 3] : [3, 4]

    const preferredSubjects = ctx.user?.subject_preferences
      ? JSON.parse(ctx.user.subject_preferences || '[]')
      : []

    return {
      weakKPIds,
      masteredKPIds,
      learningKPIds,
      difficultyRange,
      preferredSubjects,
      avgMastery
    }
  }

  buildAdvisorPrompt(filter) {
    const parts = []
    if (filter.weakKPIds.length > 0) {
      parts.push(`薄弱知识点（优先讲解）: ${filter.weakKPIds.join(', ')}`)
    }
    if (filter.masteredKPIds.length > 0) {
      parts.push(`已掌握知识点（可跳过）: ${filter.masteredKPIds.join(', ')}`)
    }
    parts.push(`推荐难度范围: ${filter.difficultyRange[0]}-${filter.difficultyRange[1]}`)
    if (filter.preferredSubjects.length > 0) {
      parts.push(`学科偏好: ${filter.preferredSubjects.join(', ')}`)
    }
    return parts.join('\n')
  }
}

/**
 * 评估-纠偏任务
 */
class EvalCorrectionQueue {
  constructor() {
    this.queue = []
    this.processing = false
  }

  schedule(userId, exerciseResults) {
    this.queue.push({
      userId,
      exerciseResults,
      scheduledAt: new Date().toISOString(),
      status: 'pending'
    })
    sharedKB.publishEvent('eval_scheduled', 'study-coordinator', 'eval-queue', { userId, count: exerciseResults.length })
  }

  async processAll() {
    if (this.processing || this.queue.length === 0) return []
    this.processing = true
    const results = []

    while (this.queue.length > 0) {
      const task = this.queue.shift()
      task.status = 'processing'
      try {
        const result = await this._processTask(task)
        task.status = 'completed'
        results.push({ ...task, result })
      } catch (error) {
        task.status = 'failed'
        task.error = error.message
        results.push({ ...task })
      }
    }

    this.processing = false
    return results
  }

  async _processTask(task) {
    const { userId, exerciseResults } = task

    // 1. 分析错题分布
    const wrongResults = exerciseResults.filter(r => !r.isCorrect)
    const correctResults = exerciseResults.filter(r => r.isCorrect)
    const kpErrorMap = {}
    for (const r of wrongResults) {
      const kpId = r.knowledgePointId
      if (kpId) {
        kpErrorMap[kpId] = (kpErrorMap[kpId] || 0) + 1
      }
    }

    // 2. 更新掌握度
    for (const r of exerciseResults) {
      const masteryDelta = r.isCorrect ? 0.1 : -0.15
      const existing = userProgressModel.findByKnowledgePoint(userId, r.knowledgePointId)
      const currentMastery = existing ? existing.mastery_level : 0.5
      const newMastery = Math.max(0, Math.min(1, currentMastery + masteryDelta))
      userProgressModel.upsert(userId, r.knowledgePointId, newMastery)
    }

    // 3. 错题自动入库
    for (const r of wrongResults) {
      const kp = r.knowledgePointId ? knowledgePointModel.findById(r.knowledgePointId) : null
      wrongQuestionModel.create(
        userId,
        r.exerciseId || 0,
        r.userAnswer || '',
        r.correctAnswer || '',
        kp ? `错误于知识点: ${kp.title}` : '未知知识点'
      )
    }

    // 4. 生成"避坑指南"笔记
    if (wrongResults.length > 0) {
      const errorKpIds = Object.keys(kpErrorMap).map(Number)
      const errorKps = knowledgePointModel.findByIds(errorKpIds)
      const guideContent = `## 避坑指南\n\n基于最近练习中的 ${wrongResults.length} 道错题，以下是重点提醒：\n\n${errorKps.map(kp => `- **${kp.title}**: 注意理解核心概念，${kp.description || ''}`).join('\n')}\n\n建议：针对以上薄弱知识点进行针对性复习。`
      noteModel.create(userId, null, errorKps[0]?.id || null, `避坑指南_${new Date().toLocaleDateString()}`, guideContent, 'auto-generated', false)
    }

    // 5. 创建学习提醒
    if (wrongResults.length >= 3) {
      learningReminderModel.create(
        userId,
        '复习错题提醒',
        `你有 ${wrongResults.length} 道新错题未复习，建议安排时间回顾。`,
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        'review'
      )
    }

    return {
      totalExercises: exerciseResults.length,
      correctCount: correctResults.length,
      wrongCount: wrongResults.length,
      accuracy: exerciseResults.length ? Math.round((correctResults.length / exerciseResults.length) * 100) : 0,
      notesGenerated: wrongResults.length > 0 ? 1 : 0,
      remindersCreated: wrongResults.length >= 3 ? 1 : 0
    }
  }
}

/**
 * StudyCoordinator — 学习协调器
 */
class StudyCoordinator {
  constructor() {
    this.sessionManager = new SessionManager()
    this.contextAdvisor = new ContextAdvisor()
    this.evalQueue = new EvalCorrectionQueue()
    this.name = 'study-coordinator'
  }

  /**
   * 启动学习会话
   */
  startSession(userId, mode = 'questioning', goal = '') {
    const session = this.sessionManager.start(userId, mode, goal)
    invalidateContext(userId)
    return {
      success: true,
      sessionId: session.id,
      mode: session.mode,
      goal: session.currentGoal,
      retrievalAdvice: this.contextAdvisor.buildRetrievalFilter(userId)
    }
  }

  /**
   * 切换学习模式
   */
  switchMode(sessionId, newMode) {
    const ok = this.sessionManager.switchMode(sessionId, newMode)
    if (!ok) return { success: false, message: '会话不存在' }
    const session = this.sessionManager.get(sessionId)
    return {
      success: true,
      sessionId,
      mode: session.mode,
      history: this.sessionManager.getRecentContext(sessionId, 3)
    }
  }

  /**
   * 结束会话
   */
  endSession(sessionId) {
    const session = this.sessionManager.end(sessionId)
    if (!session) return { success: false, message: '会话不存在' }
    return {
      success: true,
      sessionId,
      duration: Math.round((session.endTime - session.startTime) / 1000),
      interactionCount: session.history.length,
      modeTransitions: session.modeTransitions.length - 1
    }
  }

  /**
   * 获取会话状态
   */
  getSession(sessionId) {
    const session = this.sessionManager.get(sessionId)
    if (!session) return null
    return {
      id: session.id,
      mode: session.mode,
      goal: session.currentGoal,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      interactionCount: session.history.length,
      recentContext: this.sessionManager.getRecentContext(sessionId, 3),
      modeTransitions: session.modeTransitions
    }
  }

  /**
   * 获取用户活跃会话
   */
  getActiveSession(userId) {
    return this.sessionManager.findByUserId(userId)
  }

  /**
   * 处理输入（统一入口，支持多模态）
   */
  async processInput(sessionId, userInput, options = {}) {
    const session = this.sessionManager.get(sessionId)
    if (!session) {
      return { success: false, message: '会话不存在，请先启动学习会话' }
    }

    const userId = session.userId
    const mode = session.mode

    // 多模态处理
    let enhancedInput = userInput
    if (options.imageUrl) {
      enhancedInput = `[图片内容] ${userInput}\n图片URL: ${options.imageUrl}`
    }
    if (options.audioUrl) {
      enhancedInput = `[语音内容] ${userInput}\n音频URL: ${options.audioUrl}`
    }

    // 画像-检索联动
    const filter = this.contextAdvisor.buildRetrievalFilter(userId)
    const advisorNote = this.contextAdvisor.buildAdvisorPrompt(filter)

    // 注入会话上下文到提示
    const recentHistory = this.sessionManager.getRecentContext(sessionId, 3)
    const contextNote = recentHistory.length > 0
      ? `\n## 最近会话上下文\n最近交互：\n${recentHistory.map(h => `- [${h.mode}] ${h.input?.substring(0, 100)}`).join('\n')}`
      : ''

    // 构建完整上下文
    const fullContext = `${advisorNote}${contextNote}\n\n## 当前学习模式\n${mode}\n\n请根据用户当前模式和画像，提供个性化回答。`

    // 根据模式选择智能体
    const modeAgentMap = {
      questioning: 'tutor',
      exercising: 'evaluator',
      reviewing: 'evaluator',
      counseling: 'companion'
    }
    const agentType = modeAgentMap[mode] || 'helper'

    // 记录到会话历史
    this.sessionManager.addHistory(sessionId, {
      mode,
      type: 'input',
      input: enhancedInput,
      agent: agentType
    })

    // 调用子智能体
    const subAgent = await this._getSubAgent(agentType)
    const result = await subAgent.execute(userId, enhancedInput, [], {
      kbContent: options.kbContent || '',
      extraContext: fullContext
    })

    // 记录 AI 回复
    this.sessionManager.addHistory(sessionId, {
      mode,
      type: 'output',
      content: typeof result === 'string' ? result : JSON.stringify(result)
    })

    // 如果有练习结果，自动触发评估-纠偏
    if (options.exerciseResults && options.exerciseResults.length > 0) {
      this.evalQueue.schedule(userId, options.exerciseResults)
      // 异步处理队列
      this.evalQueue.processAll().catch(console.error)
    }

    return {
      success: true,
      sessionId,
      mode,
      agent: agentType,
      result,
      retrievalAdvice: filter
    }
  }

  /**
   * 批量提交练习反馈（触发评估-纠偏循环）
   */
  async submitExerciseFeedback(userId, exerciseResults) {
    this.evalQueue.schedule(userId, exerciseResults)
    const results = await this.evalQueue.processAll()
    return {
      success: true,
      processed: results.length,
      details: results
    }
  }

  /**
   * 手动触发评估-纠偏
   */
  async triggerEvalCorrection() {
    const results = await this.evalQueue.processAll()
    return { success: true, processed: results.length, details: results }
  }

  /**
   * 获取协调器状态
   */
  getStatus() {
    return {
      name: this.name,
      activeSessions: this.sessionManager.sessions.size,
      pendingEvalTasks: this.evalQueue.queue.length,
      evalProcessing: this.evalQueue.processing
    }
  }

  async _getSubAgent(agentType) {
    // 延迟导入，避免循环依赖
    const agents = {
      tutor: () => import('./sub-agents/tutor.js'),
      helper: () => import('./sub-agents/helper.js'),
      planner: () => import('./sub-agents/planner.js'),
      evaluator: () => import('./sub-agents/evaluator.js'),
      companion: () => import('./sub-agents/companion.js')
    }
    const loader = agents[agentType] || agents.helper
    const mod = await loader()
    return mod
  }
}

export default new StudyCoordinator()
