import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { userProgressModel, knowledgePointModel, learningRecordModel } from '../models/index.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  try {
    const progress = userProgressModel.findByUserId(req.user.id)
    
    res.json({
      success: true,
      data: progress
    })
  } catch (error) {
    console.error('获取学习进度失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取学习进度失败' 
    })
  }
})

router.post('/', authMiddleware, (req, res) => {
  try {
    const { knowledgePointId, masteryLevel } = req.body
    
    if (!knowledgePointId || masteryLevel === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: '知识点ID和掌握程度不能为空' 
      })
    }
    
    userProgressModel.upsert(req.user.id, knowledgePointId, masteryLevel)
    
    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新学习进度失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '更新学习进度失败' 
    })
  }
})

router.get('/stats', authMiddleware, (req, res) => {
  try {
    const progress = userProgressModel.findByUserId(req.user.id)
    const learningStats = learningRecordModel.getStatistics(req.user.id)
    
    const totalKnowledgePoints = progress.length
    const masteredCount = progress.filter(p => p.mastery_level >= 0.8).length
    const learningCount = progress.filter(p => p.mastery_level >= 0.5 && p.mastery_level < 0.8).length
    const weakCount = progress.filter(p => p.mastery_level < 0.5).length
    
    const weakPoints = progress
      .filter(p => p.mastery_level < 0.5)
      .map(p => ({
        id: p.knowledge_point_id,
        title: p.knowledge_point_title,
        masteryLevel: p.mastery_level
      }))
    
    res.json({
      success: true,
      data: {
        totalKnowledgePoints,
        masteredCount,
        learningCount,
        weakCount,
        weakPoints,
        learningStats
      }
    })
  } catch (error) {
    console.error('获取学习统计失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取学习统计失败' 
    })
  }
})

router.get('/recommendations', authMiddleware, (req, res) => {
  try {
    const progress = userProgressModel.findByUserId(req.user.id)
    
    const weakPoints = progress
      .filter(p => p.mastery_level < 0.6)
      .sort((a, b) => a.mastery_level - b.mastery_level)
      .slice(0, 5)
    
    const recommendations = weakPoints.map(p => ({
      knowledgePointId: p.knowledge_point_id,
      title: p.knowledge_point_title,
      masteryLevel: p.mastery_level,
      suggestion: `建议重点复习"${p.knowledge_point_title}"，当前掌握程度为${Math.round(p.mastery_level * 100)}%`
    }))
    
    res.json({
      success: true,
      data: recommendations
    })
  } catch (error) {
    console.error('获取学习建议失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取学习建议失败' 
    })
  }
})

export default router
