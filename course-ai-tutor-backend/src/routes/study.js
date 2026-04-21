import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import studyCoordinator from '../agents/StudyCoordinator.js'
import { knowledgeBaseEntryModel } from '../models/index.js'
import { formatKBForPrompt, invalidateContext } from '../agents/UserContext.js'

const router = express.Router()

// 启动学习会话
router.post('/start', authMiddleware, (req, res) => {
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
router.post('/mode', authMiddleware, (req, res) => {
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
router.post('/input', authMiddleware, async (req, res) => {
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

// 批量提交练习反馈
router.post('/exercise-feedback', authMiddleware, async (req, res) => {
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
router.get('/session', authMiddleware, (req, res) => {
  try {
    const { sessionId } = req.query
    if (sessionId) {
      const result = studyCoordinator.getSession(sessionId)
      if (!result) return res.status(404).json({ success: false, message: '会话不存在' })
      return res.json({ success: true, data: result })
    }
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
router.post('/end', authMiddleware, (req, res) => {
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
router.post('/eval-correct', authMiddleware, async (req, res) => {
  try {
    const result = await studyCoordinator.triggerEvalCorrection()
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('触发评估-纠偏失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
