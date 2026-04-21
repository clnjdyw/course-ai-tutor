import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { knowledgePointModel, courseModel } from '../models/index.js'
import db, { saveDb } from '../../database/init.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  try {
    const { courseId, limit = 100, offset = 0 } = req.query
    
    let knowledgePoints
    if (courseId) {
      knowledgePoints = knowledgePointModel.findByCourseId(parseInt(courseId))
    } else {
      knowledgePoints = knowledgePointModel.findAll(parseInt(limit), parseInt(offset))
    }
    
    res.json({
      success: true,
      data: knowledgePoints
    })
  } catch (error) {
    console.error('获取知识点失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取知识点失败' 
    })
  }
})

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const knowledgePoint = knowledgePointModel.findById(parseInt(req.params.id))
    
    if (!knowledgePoint) {
      return res.status(404).json({ 
        success: false, 
        message: '知识点不存在' 
      })
    }
    
    res.json({
      success: true,
      data: knowledgePoint
    })
  } catch (error) {
    console.error('获取知识点失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取知识点失败' 
    })
  }
})

router.post('/', authMiddleware, (req, res) => {
  try {
    const { courseId, title, description, content, difficulty, parentId, agentType, knowledgeBaseId, prerequisites, tags } = req.body
    
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: '知识点标题不能为空' 
      })
    }
    
    const result = knowledgePointModel.create(
      courseId, 
      title, 
      description, 
      content, 
      difficulty || 1, 
      parentId, 
      agentType, 
      knowledgeBaseId,
      prerequisites ? JSON.stringify(prerequisites) : null,
      tags ? JSON.stringify(tags) : null
    )
    
    res.status(201).json({
      success: true,
      message: '创建成功',
      data: { id: result.lastInsertRowid }
    })
  } catch (error) {
    console.error('创建知识点失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '创建知识点失败' 
    })
  }
})

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const updateData = {}
    const { title, description, content, difficulty, parentId, agentType, knowledgeBaseId, prerequisites, tags } = req.body
    
    if (title) updateData.title = title
    if (description) updateData.description = description
    if (content) updateData.content = content
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (parentId !== undefined) updateData.parent_id = parentId
    if (agentType) updateData.agent_type = agentType
    if (knowledgeBaseId) updateData.knowledge_base_id = knowledgeBaseId
    if (prerequisites) updateData.prerequisites = JSON.stringify(prerequisites)
    if (tags) updateData.tags = JSON.stringify(tags)
    
    knowledgePointModel.update(parseInt(req.params.id), updateData)
    
    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新知识点失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '更新知识点失败' 
    })
  }
})

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    knowledgePointModel.delete(parseInt(req.params.id))
    
    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除知识点失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '删除知识点失败' 
    })
  }
})

export default router
