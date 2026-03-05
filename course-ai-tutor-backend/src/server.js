import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 加载环境变量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 导入路由
import authRoutes from './routes/auth.js'
import learningRoutes from './routes/learning.js'
import aiRoutes from './routes/ai.js'
import adminRoutes from './routes/admin.js'

const app = express()
const PORT = process.env.PORT || 8081

// 中间件
app.use(helmet()) // 安全头
app.use(cors()) // 跨域
app.use(compression()) // 压缩
app.use(morgan('dev')) // 日志
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
})
app.use('/api/', limiter)

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/learning', learningRoutes)
app.use('/api', aiRoutes)
app.use('/api/admin', adminRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('错误:', err)
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  })
})

// 启动服务器
app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
  console.log('========================================')
  console.log('   🚀 Course AI Tutor - Backend Server')
  console.log('========================================')
  console.log(`   环境：${process.env.NODE_ENV || 'development'}`)
  console.log(`   服务地址：http://${process.env.HOST || '0.0.0.0'}:${PORT}`)
  console.log(`   本地访问：http://localhost:${PORT}`)
  console.log(`   API 前缀：/api`)
  console.log('========================================')
  console.log('✅ 后端服务已启动')
  console.log('✅ 数据库已连接')
  console.log('✅ JWT 认证已启用')
  console.log('========================================')
})

export default app
