import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { learningReminderModel } from '../models/index.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  try {
    const reminders = learningReminderModel.findByUserId(req.user.id)
    
    res.json({
      success: true,
      data: reminders
    })
  } catch (error) {
    console.error('获取提醒失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取提醒失败' 
    })
  }
})

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const reminder = learningReminderModel.findById(parseInt(req.params.id))
    
    if (!reminder) {
      return res.status(404).json({ 
        success: false, 
        message: '提醒不存在' 
      })
    }
    
    if (reminder.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权访问此提醒' 
      })
    }
    
    res.json({
      success: true,
      data: reminder
    })
  } catch (error) {
    console.error('获取提醒失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取提醒失败' 
    })
  }
})

router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, content, reminderTime, reminderType } = req.body
    
    if (!title || !reminderTime) {
      return res.status(400).json({ 
        success: false, 
        message: '标题和提醒时间不能为空' 
      })
    }
    
    const result = learningReminderModel.create(
      req.user.id,
      title,
      content,
      reminderTime,
      reminderType || 'study'
    )
    
    res.status(201).json({
      success: true,
      message: '创建成功',
      data: { id: result.lastInsertRowid }
    })
  } catch (error) {
    console.error('创建提醒失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '创建提醒失败' 
    })
  }
})

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const reminder = learningReminderModel.findById(parseInt(req.params.id))
    
    if (!reminder || reminder.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权修改此提醒' 
      })
    }
    
    const updateData = {}
    const { title, content, reminderTime, reminderType, status } = req.body
    
    if (title) updateData.title = title
    if (content) updateData.content = content
    if (reminderTime) updateData.reminder_time = reminderTime
    if (reminderType) updateData.reminder_type = reminderType
    if (status) updateData.status = status
    
    learningReminderModel.update(parseInt(req.params.id), updateData)
    
    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新提醒失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '更新提醒失败' 
    })
  }
})

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const reminder = learningReminderModel.findById(parseInt(req.params.id))
    
    if (!reminder || reminder.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权删除此提醒' 
      })
    }
    
    learningReminderModel.delete(parseInt(req.params.id))
    
    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除提醒失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '删除提醒失败' 
    })
  }
})

export default router
