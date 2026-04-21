import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { knowledgePointModel, userProgressModel, wrongQuestionModel, exerciseModel } from '../models/index.js'
import db, { saveDb } from '../../database/init.js'
import { chat, chatStream } from '../agents/AIService.js'
import { buildUserContext, formatContextForPrompt } from '../agents/UserContext.js'
import { getSystemPrompt, buildMessages } from '../agents/prompts/index.js'

const router = express.Router()

// 学习计划
router.post('/planner/plan', authMiddleware, async (req, res) => {
  try {
    console.log('📚 收到学习计划请求:', req.body)
    const { goal, currentProgress, weakPoints } = req.body
    const userId = req.user.id

    const ctx = buildUserContext(userId)
    const contextStr = formatContextForPrompt(ctx)

    const systemPrompt = getSystemPrompt('planner')
    const { system, messages } = buildMessages(systemPrompt, contextStr,
      `请为我生成学习计划。学习目标：${goal || '未指定'}`)

    const result = await chat(messages, { system })
    const content = result.content?.find(c => c.type === 'text')?.text || '计划生成失败'

    res.json({
      success: true,
      planContent: content,
      agentType: 'planner',
      userContext: { level: ctx.user?.level, weakCount: ctx.weakCount, masteredCount: ctx.masteredCount }
    })
  } catch (error) {
    console.error('生成学习计划失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 教学
router.post('/tutor/teach', authMiddleware, async (req, res) => {
  try {
    console.log('👨‍🏫 收到教学请求:', req.body)
    const { topic, level } = req.body
    const userId = req.user.id

    const ctx = buildUserContext(userId)
    const contextStr = formatContextForPrompt(ctx)

    const systemPrompt = getSystemPrompt('tutor')
    const { system, messages } = buildMessages(systemPrompt, contextStr,
      `请为我讲解这个知识点：${topic || '用户未指定主题'}`)

    const result = await chat(messages, { system })
    const content = result.content?.find(c => c.type === 'text')?.text || '讲解生成失败'

    res.json({
      success: true,
      content,
      topic,
      agentType: 'tutor',
      userContext: { level: ctx.user?.level, weakCount: ctx.weakCount }
    })
  } catch (error) {
    console.error('生成教学内容失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 答疑
router.post('/helper/answer', authMiddleware, async (req, res) => {
  try {
    console.log('💬 收到答疑请求:', req.body)
    const { question, messageType, imageUrl, audioUrl } = req.body
    const userId = req.user.id

    const ctx = buildUserContext(userId)
    const contextStr = formatContextForPrompt(ctx)

    const systemPrompt = getSystemPrompt('helper')
    let userInput = question
    if (messageType === 'image' && imageUrl) {
      userInput = `[图片消息] ${question}`
    } else if (messageType === 'audio' && audioUrl) {
      userInput = `[语音消息] ${question}`
    }

    const { system, messages } = buildMessages(systemPrompt, contextStr, userInput)

    const result = await chat(messages, { system })
    const content = result.content?.find(c => c.type === 'text')?.text || '回答生成失败'

    res.json({
      success: true,
      answer: content,
      question,
      messageType: messageType || 'text',
      agentType: 'helper'
    })
  } catch (error) {
    console.error('生成答疑失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 评估
router.post('/evaluator/evaluate', authMiddleware, async (req, res) => {
  try {
    console.log('📊 收到评估请求:', req.body)
    const { submission, type } = req.body
    const userId = req.user.id

    const ctx = buildUserContext(userId)
    const contextStr = formatContextForPrompt(ctx)

    const systemPrompt = getSystemPrompt('evaluator')
    const { system, messages } = buildMessages(systemPrompt, contextStr,
      `请评估以下内容：\n\n${submission || '用户未提交具体内容'}`)

    const result = await chat(messages, { system })
    const content = result.content?.find(c => c.type === 'text')?.text || '评估生成失败'

    res.json({
      success: true,
      feedback: content,
      agentType: 'evaluator'
    })
  } catch (error) {
    console.error('生成评估失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 聊天
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    console.log('💬 收到聊天请求:', req.body)
    const { message, messageType, imageUrl, audioUrl, context } = req.body
    const userId = req.user.id

    const ctx = buildUserContext(userId)
    const contextStr = formatContextForPrompt(ctx)

    const systemPrompt = getSystemPrompt('companion')
    let userInput = message
    if (messageType === 'image' && imageUrl) {
      userInput = `[图片] ${message}`
    } else if (messageType === 'audio' && audioUrl) {
      userInput = `[语音] ${message}`
    }

    const { system, messages } = buildMessages(systemPrompt, contextStr, userInput)

    const result = await chat(messages, { system })
    const content = result.content?.find(c => c.type === 'text')?.text || '回复生成失败'

    res.json({
      success: true,
      message: content,
      messageType: messageType || 'text',
      agentType: 'companion',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('生成聊天回复失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 习题生成
router.post('/exercise/generate', authMiddleware, async (req, res) => {
  try {
    console.log('📝 收到习题生成请求:', req.body)
    const { knowledgePointId, difficulty, questionType, count = 10, topic } = req.body
    const userId = req.user.id

    let kpInfo = ''
    if (knowledgePointId) {
      const kp = knowledgePointModel.findById(knowledgePointId)
      if (kp) kpInfo = `知识点：${kp.title}\n${kp.description || ''}\n${kp.content?.substring(0, 500) || ''}`
    }

    const ctx = buildUserContext(userId)
    const contextStr = formatContextForPrompt(ctx)

    const systemPrompt = `你是一位出题专家。请根据用户的知识水平和指定知识点，生成 ${count} 道${questionType || '选择题'}。
题目难度：${difficulty || '中等'}。
每道题包含：题目、选项（A-D）、正确答案、详细解析。
使用 Markdown 格式输出。`

    const userInput = `请生成习题${topic ? '，主题：' + topic : ''}${kpInfo ? '\n\n' + kpInfo : ''}`
    const { system, messages } = buildMessages(systemPrompt, contextStr, userInput)

    const result = await chat(messages, { system })
    const content = result.content?.find(c => c.type === 'text')?.text || '习题生成失败'

    res.json({
      success: true,
      data: content,
      count,
      format: 'markdown'
    })
  } catch (error) {
    console.error('生成习题失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 习题提交
router.post('/exercise/submit', authMiddleware, (req, res) => {
  try {
    console.log('📝 收到习题提交请求:', req.body)
    const { exerciseId, userAnswer } = req.body

    const exercise = exerciseModel.findById(exerciseId)
    if (!exercise) {
      return res.status(404).json({ success: false, message: '习题不存在' })
    }

    const isCorrect = userAnswer === exercise.answer
    const score = isCorrect ? 100 : 0

    db.run('INSERT INTO user_exercises (user_id, exercise_id, user_answer, is_correct, score) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, exerciseId, userAnswer, isCorrect, score])
    saveDb()

    if (!isCorrect) {
      db.run('INSERT INTO wrong_questions (user_id, exercise_id, user_answer, correct_answer) VALUES (?, ?, ?, ?)',
        [req.user.id, exerciseId, userAnswer, exercise.answer])
      saveDb()
    }

    res.json({
      success: true,
      data: { isCorrect, score, correctAnswer: exercise.answer, explanation: exercise.explanation }
    })
  } catch (error) {
    console.error('提交习题失败:', error)
    res.status(500).json({ success: false, message: '提交习题失败' })
  }
})

export default router
