import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { userModel } from '../models/index.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '请填写完整信息' 
      })
    }

    // 检查用户名是否已存在
    const existingUser = userModel.findByUsername(username)
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名已存在' 
      })
    }

    // 检查邮箱是否已存在
    const existingEmail = userModel.findByEmail(email)
    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        message: '邮箱已被注册' 
      })
    }

    // 密码强度验证
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: '密码长度不能少于 6 位' 
      })
    }

    // 加密密码
    const passwordHash = bcrypt.hashSync(password, 10)

    // 创建用户
    const result = userModel.create(username, email, passwordHash)

    // 生成 JWT
    const token = jwt.sign(
      { userId: result.lastInsertRowid, username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: result.lastInsertRowid,
          username,
          email
        }
      }
    })
  } catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '注册失败，请稍后重试' 
    })
  }
})

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '请填写用户名和密码' 
      })
    }

    // 查找用户
    const user = userModel.findByUsername(username)
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      })
    }

    // 验证密码
    const isValid = bcrypt.compareSync(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      })
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          level: user.level
        }
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '登录失败，请稍后重试' 
    })
  }
})

// 获取当前用户信息
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  })
})

// 更新用户信息
router.put('/me', authMiddleware, (req, res) => {
  try {
    const { phone, bio } = req.body
    const updateData = {}
    
    if (phone) updateData.phone = phone
    if (bio) updateData.bio = bio

    userModel.update(req.user.id, updateData)

    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '更新失败' 
    })
  }
})

// 修改密码
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: '请填写完整信息' 
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: '新密码长度不能少于 6 位' 
      })
    }

    const user = userModel.findById(req.user.id)
    const isValid = bcrypt.compareSync(currentPassword, user.password_hash)
    
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: '当前密码错误' 
      })
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10)
    userModel.updatePassword(req.user.id, passwordHash)

    res.json({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '修改密码失败' 
    })
  }
})

export default router
