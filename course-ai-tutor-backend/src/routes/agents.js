import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import mainAgent from '../agents/MainAgent.js'
import plannerAgent from '../agents/PlannerAgent.js'
import sharedKB from '../agents/SharedKnowledgeBase.js'
import thoughtEngine from '../agents/ChainOfThoughtEngine.js'
import { chat, chatStream } from '../agents/AIService.js'
import { buildUserContext, formatContextForPrompt, formatKBForPrompt, invalidateContext, buildRetrievalAdvice } from '../agents/UserContext.js'
import { knowledgeBaseEntryModel } from '../models/index.js'
import { getSystemPrompt, buildMessages } from '../agents/prompts/index.js'
import { executeTool } from '../agents/ToolRegistry.js'
import studyCoordinator from '../agents/StudyCoordinator.js'

const router = express.Router()

// 任务追踪（后台任务管理）
const activeTasks = new Map()

// 智能体统一请求入口 — 使用 MainAgent 协调
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { type, content, context, knowledgeBaseId } = req.body
    if (!content) {
      return res.status(400).json({ success: false, message: '请求内容不能为空' })
    }

    const userId = req.user.id

    // 可选：注入知识库内容到上下文
    let kbContent = ''
    if (knowledgeBaseId) {
      const entries = knowledgeBaseEntryModel.findAllByKbId(parseInt(knowledgeBaseId))
      kbContent = formatKBForPrompt(entries)
    }

    const result = await mainAgent.handleRequest(userId, content, {
      type: type || 'helper',
      history: context?.history || [],
      kbContent
    })

    // 缓存失效，下次请求重新构建
    invalidateContext(userId)

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('智能体请求失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 智能体流式请求
router.post('/request/stream', authMiddleware, async (req, res) => {
  try {
    const { content, type, knowledgeBaseId } = req.body

    if (!content) {
      return res.status(400).json({ success: false, message: '请求内容不能为空' })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const userId = req.user.id
    const ctx = buildUserContext(userId)
    const contextStr = formatContextForPrompt(ctx)
    const agentType = type || 'helper'
    const systemPrompt = getSystemPrompt(agentType)
    const { system, messages } = buildMessages(systemPrompt, contextStr, content)

    await chatStream(messages, { system }, (fullContent, done) => {
      res.write(`data: ${JSON.stringify({ content: fullContent, done })}\n\n`)
      if (done) {
        res.write(`event: done\ndata: ${JSON.stringify({ success: true })}\n\n`)
        res.end()
      }
    })
  } catch (error) {
    console.error('智能体流式请求失败:', error)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message })
    } else {
      res.end()
    }
  }
})

// 聊天接口
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, messageType, imageUrl, audioUrl } = req.body

    if (!message) {
      return res.status(400).json({ success: false, message: '消息内容不能为空' })
    }

    const userId = req.user.id
    const ctx = buildUserContext(userId)
    const contextStr = formatContextForPrompt(ctx)

    const systemPrompt = getSystemPrompt('companion')
    let userInput = message
    if (messageType === 'image' && imageUrl) userInput = `[图片] ${message}`
    else if (messageType === 'audio' && audioUrl) userInput = `[语音] ${message}`

    const { system, messages } = buildMessages(systemPrompt, contextStr, userInput)

    const result = await chat(messages, { system })
    const aiContent = result.content?.find(c => c.type === 'text')?.text || '回复生成失败'

    res.json({
      success: true,
      data: { message: aiContent, agentType: 'companion', timestamp: new Date().toISOString() }
    })
  } catch (error) {
    console.error('聊天失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 获取智能体状态
router.get('/status', authMiddleware, (req, res) => {
  try {
    const status = mainAgent.getStatus()
    res.json({ success: true, data: status })
  } catch (error) {
    console.error('获取智能体状态失败:', error)
    res.status(500).json({ success: false, message: '获取状态失败' })
  }
})

// 获取注册的智能体列表
router.get('/list', authMiddleware, (req, res) => {
  try {
    const agents = mainAgent.getRegisteredAgents()
    res.json({ success: true, data: agents })
  } catch (error) {
    console.error('获取智能体列表失败:', error)
    res.status(500).json({ success: false, message: '获取列表失败' })
  }
})

// 获取可用的思维链路径
router.get('/paths', authMiddleware, (req, res) => {
  try {
    const paths = thoughtEngine.getAvailablePaths()
    res.json({ success: true, data: paths })
  } catch (error) {
    console.error('获取思维链路径失败:', error)
    res.status(500).json({ success: false, message: '获取路径失败' })
  }
})

// 同步用户信息到共享知识库
router.post('/sync-user', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id
    const userData = req.body

    sharedKB.set(`user:${userId}:info`, userData, 'user-center')

    if (userData.learningGoal) {
      sharedKB.set(`user:${userId}:goal`, userData.learningGoal, 'user-center')
    }
    if (userData.subjectPreferences) {
      sharedKB.set(`user:${userId}:preferences`, userData.subjectPreferences, 'user-center')
    }

    sharedKB.publishEvent('user_sync', 'user-center', null, { userId, userData })

    res.json({ success: true, message: '用户信息已同步到共享知识库' })
  } catch (error) {
    console.error('同步用户信息失败:', error)
    res.status(500).json({ success: false, message: '同步失败' })
  }
})

// 获取共享知识库数据
router.get('/knowledge/:key', authMiddleware, (req, res) => {
  try {
    const { key } = req.params
    const value = sharedKB.get(key)
    res.json({ success: true, data: { key, value } })
  } catch (error) {
    console.error('获取共享知识失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// 获取事件
router.get('/events', authMiddleware, (req, res) => {
  try {
    const { limit = 50 } = req.query
    const events = sharedKB.getEvents('main-agent', parseInt(limit))
    res.json({ success: true, data: events })
  } catch (error) {
    console.error('获取事件失败:', error)
    res.status(500).json({ success: false, message: '获取事件失败' })
  }
})

// 触发自主规划
router.post('/plan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const taskId = `plan_${userId}_${Date.now()}`
    activeTasks.set(taskId, { status: 'running', type: 'plan', userId, startedAt: new Date().toISOString() })

    const result = await plannerAgent.generatePlan(userId)

    activeTasks.set(taskId, { status: 'completed', type: 'plan', userId, result, completedAt: new Date().toISOString() })
    res.json({ success: true, data: result, taskId })
  } catch (error) {
    console.error('自主规划失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 触发错题自动复习
router.post('/review', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const taskId = `review_${userId}_${Date.now()}`
    activeTasks.set(taskId, { status: 'running', type: 'review', userId, startedAt: new Date().toISOString() })

    const result = await plannerAgent.autoReview(userId)

    activeTasks.set(taskId, { status: 'completed', type: 'review', userId, result, completedAt: new Date().toISOString() })
    res.json({ success: true, data: result, taskId })
  } catch (error) {
    console.error('自动复习失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 自适应学习调整
router.post('/adapt', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const result = await plannerAgent.adaptiveLearning(userId)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('自适应学习失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 查看正在执行的任务
router.get('/tasks', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id
    const tasks = []
    for (const [id, task] of activeTasks) {
      if (task.userId === userId) {
        tasks.push({ id, ...task })
      }
    }
    res.json({ success: true, data: tasks, count: tasks.length })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    res.status(500).json({ success: false, message: '获取任务列表失败' })
  }
})

// 取消任务
router.post('/tasks/:id/cancel', authMiddleware, (req, res) => {
  try {
    const { id } = req.params
    const task = activeTasks.get(id)
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' })
    }
    if (task.status === 'completed') {
      return res.json({ success: false, message: '任务已完成，无法取消' })
    }
    activeTasks.set(id, { ...task, status: 'cancelled', cancelledAt: new Date().toISOString() })
    res.json({ success: true, message: '任务已取消' })
  } catch (error) {
    console.error('取消任务失败:', error)
    res.status(500).json({ success: false, message: '取消任务失败' })
  }
})

// 调用指定工具（直接工具调用接口）
router.post('/tool', authMiddleware, async (req, res) => {
  try {
    const { toolName, params } = req.body
    if (!toolName) {
      return res.status(400).json({ success: false, message: '缺少工具名称' })
    }
    const userId = req.user.id
    const result = await executeTool(toolName, params || {}, userId)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('工具调用失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ===== StudyCoordinator 路由 =====

// 启动学习会话
router.post('/study/start', authMiddleware, (req, res) => {
  try {
    const { mode = 'questioning', goal = '' } = req.body
    const result = studyCoordinator.startSession(req.user.id, mode, goal)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('启动学习会话失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 切换学习模式
router.post('/study/mode', authMiddleware, (req, res) => {
  try {
    const { sessionId, mode } = req.body
    if (!sessionId || !mode) {
      return res.status(400).json({ success: false, message: '缺少 sessionId 或 mode' })
    }
    const result = studyCoordinator.switchMode(sessionId, mode)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('切换模式失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 带会话上下文的统一输入
router.post('/study/input', authMiddleware, async (req, res) => {
  try {
    const { sessionId, message, messageType, imageUrl, audioUrl, exerciseResults, knowledgeBaseId } = req.body
    if (!sessionId || !message) {
      return res.status(400).json({ success: false, message: '缺少 sessionId 或 message' })
    }

    let kbContent = ''
    if (knowledgeBaseId) {
      const entries = knowledgeBaseEntryModel.findAllByKbId(parseInt(knowledgeBaseId))
      kbContent = formatKBForPrompt(entries)
    }

    const result = await studyCoordinator.processInput(sessionId, message, {
      imageUrl: messageType === 'image' ? imageUrl : imageUrl,
      audioUrl: messageType === 'audio' ? audioUrl : audioUrl,
      exerciseResults,
      kbContent
    })

    invalidateContext(req.user.id)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('处理输入失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 批量提交练习反馈（触发评估-纠偏）
router.post('/study/exercise-feedback', authMiddleware, async (req, res) => {
  try {
    const { exerciseResults } = req.body
    if (!exerciseResults || !Array.isArray(exerciseResults)) {
      return res.status(400).json({ success: false, message: '缺少 exerciseResults 数组' })
    }
    const result = await studyCoordinator.submitExerciseFeedback(req.user.id, exerciseResults)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('处理练习反馈失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 获取当前会话状态
router.get('/study/session', authMiddleware, (req, res) => {
  try {
    const { sessionId } = req.query
    if (sessionId) {
      const result = studyCoordinator.getSession(sessionId)
      if (!result) return res.status(404).json({ success: false, message: '会话不存在' })
      return res.json({ success: true, data: result })
    }
    // 无 sessionId 时返回用户的活跃会话
    const session = studyCoordinator.getActiveSession(req.user.id)
    res.json({
      success: true,
      data: session ? studyCoordinator.getSession(session.id) : null,
      coordinatorStatus: studyCoordinator.getStatus()
    })
  } catch (error) {
    console.error('获取会话状态失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 结束会话
router.post('/study/end', authMiddleware, (req, res) => {
  try {
    const { sessionId } = req.body
    if (!sessionId) {
      return res.status(400).json({ success: false, message: '缺少 sessionId' })
    }
    const result = studyCoordinator.endSession(sessionId)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('结束会话失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 手动触发评估-纠偏
router.post('/study/eval-correct', authMiddleware, async (req, res) => {
  try {
    const result = await studyCoordinator.triggerEvalCorrection()
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('触发评估-纠偏失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
