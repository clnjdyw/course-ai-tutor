import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { noteModel } from '../models/index.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  try {
    const { limit = 100 } = req.query
    const notes = noteModel.findByUserId(req.user.id, parseInt(limit))
    
    res.json({
      success: true,
      data: notes
    })
  } catch (error) {
    console.error('获取笔记失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取笔记失败' 
    })
  }
})

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const note = noteModel.findById(parseInt(req.params.id))
    
    if (!note) {
      return res.status(404).json({ 
        success: false, 
        message: '笔记不存在' 
      })
    }
    
    if (note.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权访问此笔记' 
      })
    }
    
    res.json({
      success: true,
      data: note
    })
  } catch (error) {
    console.error('获取笔记失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取笔记失败' 
    })
  }
})

router.post('/', authMiddleware, (req, res) => {
  try {
    const { courseId, knowledgePointId, title, content, tags, isPublic } = req.body
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: '标题和内容不能为空' 
      })
    }
    
    const result = noteModel.create(
      req.user.id,
      courseId,
      knowledgePointId,
      title,
      content,
      tags ? JSON.stringify(tags) : null,
      isPublic
    )
    
    res.status(201).json({
      success: true,
      message: '创建成功',
      data: { id: result.lastInsertRowid }
    })
  } catch (error) {
    console.error('创建笔记失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '创建笔记失败' 
    })
  }
})

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const note = noteModel.findById(parseInt(req.params.id))
    
    if (!note || note.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权修改此笔记' 
      })
    }
    
    const updateData = {}
    const { title, content, tags, isPublic } = req.body
    
    if (title) updateData.title = title
    if (content) updateData.content = content
    if (tags) updateData.tags = JSON.stringify(tags)
    if (isPublic !== undefined) updateData.is_public = isPublic ? 1 : 0
    
    noteModel.update(parseInt(req.params.id), updateData)
    
    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新笔记失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '更新笔记失败' 
    })
  }
})

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const note = noteModel.findById(parseInt(req.params.id))
    
    if (!note || note.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权删除此笔记' 
      })
    }
    
    noteModel.delete(parseInt(req.params.id))
    
    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除笔记失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '删除笔记失败' 
    })
  }
})

export default router
