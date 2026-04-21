import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { userModel, userProgressModel, learningRecordModel } from '../models/index.js'

const router = express.Router()

// 列出所有学生及其学习进度
router.get('/students', authMiddleware, (req, res) => {
  try {
    const students = userModel.getAll(100, 0).filter(u => u.role === 'student' || !u.role)
    const studentsWithProgress = students.map(s => {
      const progress = userProgressModel.findByUserId(s.id)
      const stats = learningRecordModel.getStatistics(s.id)
      return {
        ...s,
        progressCount: progress.length,
        masteredCount: progress.filter(p => p.mastery_level >= 0.8).length,
        avgScore: stats?.avg_score || 0,
        totalRecords: stats?.total_records || 0
      }
    })
    res.json({ success: true, data: studentsWithProgress, count: studentsWithProgress.length })
  } catch (error) {
    console.error('获取学生列表失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// 单个学生详细档案
router.get('/students/:id', authMiddleware, (req, res) => {
  try {
    const student = userModel.findById(parseInt(req.params.id))
    if (!student) return res.status(404).json({ success: false, message: '学生不存在' })
    const progress = userProgressModel.findByUserId(student.id)
    const records = learningRecordModel.findByUserId(student.id, 50)
    const stats = learningRecordModel.getStatistics(student.id)
    res.json({ success: true, data: { student, progress, records, stats } })
  } catch (error) {
    console.error('获取学生详情失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

export default router
