import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { achievementModel, userAchievementModel } from '../models/index.js'

const router = express.Router()

// 获取所有成就（包含用户解锁状态）
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    // 触发成就检查
    achievementModel.checkAndUnlock(userId)

    const all = achievementModel.getAll()
    const unlockedList = userAchievementModel.findByUserId(userId)
    const unlockedIds = new Set(unlockedList.map(a => a.achievement_id))

    const result = all.map(a => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
      unlockedAt: unlockedList.find(u => u.achievement_id === a.id)?.unlocked_at || null
    }))

    res.json({
      success: true,
      data: { achievements: result, count: result.length, unlockedCount: unlockedIds.size, totalCount: result.length }
    })
  } catch (error) {
    console.error('获取成就列表失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// 触发成就检查
router.post('/check', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id
    const newlyUnlocked = achievementModel.checkAndUnlock(userId)
    res.json({
      success: true,
      data: { newlyUnlocked, count: newlyUnlocked.length }
    })
  } catch (error) {
    console.error('成就检查失败:', error)
    res.status(500).json({ success: false, message: '检查失败' })
  }
})

export default router
