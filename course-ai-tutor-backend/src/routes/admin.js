import express from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { userModel, courseModel, systemSettingsModel, learningRecordModel } from '../models/index.js'
import { chat } from '../agents/AIService.js'

const router = express.Router()

// 获取系统概览
router.get('/overview', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const userCount = userModel.count()
    const courses = courseModel.getAll(100)

    res.json({
      success: true,
      data: {
        totalUsers: userCount.count,
        totalCourses: courses.length,
        systemUptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    })
  } catch (error) {
    console.error('获取系统概览失败:', error)
    res.status(500).json({
      success: false,
      message: '获取失败'
    })
  }
})

// 获取所有用户
router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query
    const users = userModel.getAll(parseInt(limit), parseInt(offset))

    res.json({
      success: true,
      data: { users }
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取失败'
    })
  }
})

// 创建用户
router.post('/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { username, email, password, role } = req.body
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '用户名、邮箱和密码不能为空' })
    }
    const result = userModel.create(username, email, password)
    if (role) userModel.update(result.lastInsertRowid, { role })
    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (error) {
    console.error('创建用户失败:', error)
    res.status(500).json({ success: false, message: '创建失败' })
  }
})

// 更新用户
router.put('/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { role, status, level } = req.body
    const updates = {}
    if (role) updates.role = role
    if (status) updates.status = status
    if (level !== undefined) updates.level = level
    userModel.update(parseInt(req.params.id), updates)
    res.json({ success: true, message: '更新成功' })
  } catch (error) {
    console.error('更新用户失败:', error)
    res.status(500).json({ success: false, message: '更新失败' })
  }
})

// 删除用户（软删除）
router.delete('/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    userModel.update(parseInt(req.params.id), { status: 'disabled' })
    res.json({ success: true, message: '用户已禁用' })
  } catch (error) {
    console.error('删除用户失败:', error)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

// 封禁/解封用户
router.post('/users/:id/ban', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { muted } = req.body
    userModel.update(parseInt(req.params.id), { status: muted ? 'banned' : 'active' })
    res.json({ success: true, message: muted ? '用户已封禁' : '用户已解封' })
  } catch (error) {
    console.error('封禁用户失败:', error)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

// 管理面板统计数据
router.get('/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const userCount = userModel.count()
    const allUsers = userModel.getAll(1000)
    const activeToday = allUsers.filter(u => {
      const created = new Date(u.created_at)
      const now = new Date()
      return now - created < 86400000
    }).length

    const totalRecords = learningRecordModel.getStatistics(1)

    res.json({
      success: true,
      data: {
        totalUsers: userCount.count,
        activeToday,
        totalRecords: totalRecords?.total_records || 0,
        avgScore: totalRecords?.avg_score || 0,
        systemUptime: process.uptime()
      }
    })
  } catch (error) {
    console.error('获取面板统计失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// 全局学习统计
router.get('/learning-stats', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const userCount = userModel.count()
    const allUsers = userModel.getAll(1000)
    let totalRecords = 0
    let totalScore = 0
    let scoreCount = 0

    for (const user of allUsers) {
      const stats = learningRecordModel.getStatistics(user.id)
      totalRecords += stats?.total_records || 0
      if (stats?.avg_score) {
        totalScore += stats.avg_score
        scoreCount++
      }
    }

    res.json({
      success: true,
      data: {
        totalUsers: userCount.count,
        totalRecords,
        avgScore: scoreCount > 0 ? totalScore / scoreCount : 0,
        period: 'all'
      }
    })
  } catch (error) {
    console.error('获取学习统计失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// AI 分析
router.post('/ai-analysis', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { content } = req.body
    if (!content) return res.status(400).json({ success: false, message: '分析内容不能为空' })

    const { system, messages } = {
      system: '你是一位教育数据分析专家。请分析提供的教育数据并给出专业建议。',
      messages: [{ role: 'user', content }]
    }
    const result = await chat(messages, { system })
    const analysisContent = result.content?.find(c => c.type === 'text')?.text || '分析失败'

    res.json({ success: true, data: { analysis: analysisContent } })
  } catch (error) {
    console.error('AI 分析失败:', error)
    res.status(500).json({ success: false, message: '分析失败' })
  }
})

// 获取系统设置
router.get('/settings', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const settings = systemSettingsModel.getAll()
    res.json({
      success: true,
      data: { settings }
    })
  } catch (error) {
    console.error('获取系统设置失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取失败' 
    })
  }
})

// 更新系统设置
router.put('/settings/:key', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { key } = req.params
    const { value, description } = req.body
    
    systemSettingsModel.set(key, value, description)
    
    res.json({
      success: true,
      message: '设置已更新'
    })
  } catch (error) {
    console.error('更新系统设置失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '更新失败' 
    })
  }
})

export default router
