import express from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { userModel, courseModel, systemSettingsModel } from '../models/index.js'

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
