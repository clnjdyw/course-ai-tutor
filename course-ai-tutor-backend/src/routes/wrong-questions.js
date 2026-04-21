import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { wrongQuestionModel, exerciseModel } from '../models/index.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  try {
    const { limit = 100, unmastered } = req.query
    
    let wrongQuestions
    if (unmastered === 'true') {
      wrongQuestions = wrongQuestionModel.getUnmastered(req.user.id)
    } else {
      wrongQuestions = wrongQuestionModel.findByUserId(req.user.id, parseInt(limit))
    }
    
    res.json({
      success: true,
      data: wrongQuestions
    })
  } catch (error) {
    console.error('获取错题失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取错题失败' 
    })
  }
})

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const wrongQuestion = wrongQuestionModel.findById(parseInt(req.params.id))
    
    if (!wrongQuestion) {
      return res.status(404).json({ 
        success: false, 
        message: '错题不存在' 
      })
    }
    
    if (wrongQuestion.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权访问此错题' 
      })
    }
    
    res.json({
      success: true,
      data: wrongQuestion
    })
  } catch (error) {
    console.error('获取错题失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取错题失败' 
    })
  }
})

router.post('/', authMiddleware, (req, res) => {
  try {
    const { exerciseId, userAnswer, correctAnswer, errorAnalysis } = req.body
    
    if (!exerciseId || !userAnswer) {
      return res.status(400).json({ 
        success: false, 
        message: '习题ID和用户答案不能为空' 
      })
    }
    
    const exercise = exerciseModel.findById(exerciseId)
    if (!exercise) {
      return res.status(404).json({ 
        success: false, 
        message: '习题不存在' 
      })
    }
    
    const result = wrongQuestionModel.create(
      req.user.id,
      exerciseId,
      userAnswer,
      correctAnswer || exercise.answer,
      errorAnalysis
    )
    
    res.status(201).json({
      success: true,
      message: '添加成功',
      data: { id: result.lastInsertRowid }
    })
  } catch (error) {
    console.error('添加错题失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '添加错题失败' 
    })
  }
})

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const wrongQuestion = wrongQuestionModel.findById(parseInt(req.params.id))
    
    if (!wrongQuestion || wrongQuestion.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权修改此错题' 
      })
    }
    
    const updateData = {}
    const { errorAnalysis, reviewCount, mastered } = req.body
    
    if (errorAnalysis) updateData.error_analysis = errorAnalysis
    if (reviewCount !== undefined) updateData.review_count = reviewCount
    if (mastered !== undefined) updateData.mastered = mastered ? 1 : 0
    
    wrongQuestionModel.update(parseInt(req.params.id), updateData)
    
    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新错题失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '更新错题失败' 
    })
  }
})

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const wrongQuestion = wrongQuestionModel.findById(parseInt(req.params.id))
    
    if (!wrongQuestion || wrongQuestion.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权删除此错题' 
      })
    }
    
    wrongQuestionModel.delete(parseInt(req.params.id))
    
    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除错题失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '删除错题失败' 
    })
  }
})

export default router
