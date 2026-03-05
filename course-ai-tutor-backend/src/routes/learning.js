import express from 'express'
import { studyPlanModel, conversationModel, learningRecordModel, userExerciseModel, exerciseModel } from '../models/index.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// 创建学习计划
router.post('/plans', authMiddleware, (req, res) => {
  try {
    const { goal, schedule, resources, courseId } = req.body
    
    const result = studyPlanModel.create(
      req.user.id,
      goal,
      JSON.stringify(schedule || {}),
      JSON.stringify(resources || [])
    )

    res.status(201).json({
      success: true,
      message: '学习计划创建成功',
      data: {
        id: result.lastInsertRowid,
        goal,
        courseId
      }
    })
  } catch (error) {
    console.error('创建学习计划失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '创建失败' 
    })
  }
})

// 获取用户的学习计划
router.get('/plans', authMiddleware, (req, res) => {
  try {
    const plans = studyPlanModel.findByUserId(req.user.id)
    res.json({
      success: true,
      data: { plans }
    })
  } catch (error) {
    console.error('获取学习计划失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取失败' 
    })
  }
})

// 保存对话历史
router.post('/conversations', authMiddleware, (req, res) => {
  try {
    const { agentType, messages, topic } = req.body
    
    const result = conversationModel.create(
      req.user.id,
      agentType,
      JSON.stringify(messages),
      topic
    )

    res.status(201).json({
      success: true,
      message: '对话已保存',
      data: { id: result.lastInsertRowid }
    })
  } catch (error) {
    console.error('保存对话失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '保存失败' 
    })
  }
})

// 获取对话历史
router.get('/conversations', authMiddleware, (req, res) => {
  try {
    const conversations = conversationModel.findByUserId(req.user.id)
    res.json({
      success: true,
      data: { conversations }
    })
  } catch (error) {
    console.error('获取对话失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取失败' 
    })
  }
})

// 保存学习记录
router.post('/records', authMiddleware, (req, res) => {
  try {
    const { courseId, actionType, result, duration, score } = req.body
    
    const record = learningRecordModel.create(
      req.user.id,
      courseId,
      actionType,
      JSON.stringify(result || {}),
      duration || 0,
      score || 0
    )

    res.status(201).json({
      success: true,
      message: '学习记录已保存',
      data: { id: record.lastInsertRowid }
    })
  } catch (error) {
    console.error('保存学习记录失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '保存失败' 
    })
  }
})

// 获取学习统计
router.get('/statistics', authMiddleware, (req, res) => {
  try {
    const records = learningRecordModel.findByUserId(req.user.id)
    const stats = learningRecordModel.getStatistics(req.user.id)
    
    res.json({
      success: true,
      data: {
        totalRecords: stats.total_records || 0,
        avgScore: stats.avg_score || 0,
        totalDuration: stats.total_duration || 0,
        records: records.slice(0, 10)
      }
    })
  } catch (error) {
    console.error('获取统计失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取失败' 
    })
  }
})

// 提交练习
router.post('/exercises/submit', authMiddleware, (req, res) => {
  try {
    const { exerciseId, userAnswer } = req.body
    
    const exercise = exerciseModel.findById(exerciseId)
    if (!exercise) {
      return res.status(404).json({ 
        success: false, 
        message: '练习不存在' 
      })
    }

    // 简单判断答案是否正确（实际应该更复杂）
    const isCorrect = userAnswer.toLowerCase().includes(exercise.answer.toLowerCase())
    const score = isCorrect ? 100 : 0

    const result = userExerciseModel.create(
      req.user.id,
      exerciseId,
      userAnswer,
      isCorrect,
      score
    )

    res.json({
      success: true,
      message: '练习已完成',
      data: {
        isCorrect,
        score,
        correctAnswer: exercise.answer,
        explanation: exercise.explanation
      }
    })
  } catch (error) {
    console.error('提交练习失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '提交失败' 
    })
  }
})

// 获取练习记录
router.get('/exercises', authMiddleware, (req, res) => {
  try {
    const exercises = userExerciseModel.findByUserId(req.user.id)
    res.json({
      success: true,
      data: { exercises }
    })
  } catch (error) {
    console.error('获取练习记录失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取失败' 
    })
  }
})

export default router
