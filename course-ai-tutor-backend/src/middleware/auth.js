import jwt from 'jsonwebtoken'
import { userModel } from '../models/index.js'

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      })
    }

    const token = authHeader.split(' ')[1]

    // 支持本地开发模拟模式：mock-token-{userId}-{role}
    if (token.startsWith('mock-token-')) {
      const parts = token.split('-')
      // 格式: mock-token-USERID-ROLE
      if (parts.length >= 4) {
        const userId = parseInt(parts[2])
        const role = parts.slice(3).join('-')
        req.user = {
          id: userId,
          username: 'mock-user',
          role: role || 'student',
          level: userId === 1 ? 10 : 0
        }
        req.isMockToken = true
        return next()
      }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = userModel.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期'
      })
    }
    next(error)
  }
}

export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.level < 10) {
    return res.status(403).json({ 
      success: false, 
      message: '需要管理员权限' 
    })
  }
  next()
}
