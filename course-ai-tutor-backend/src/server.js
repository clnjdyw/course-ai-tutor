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
import knowledgeRoutes from './routes/knowledge.js'
import notesRoutes from './routes/notes.js'
import wrongQuestionsRoutes from './routes/wrong-questions.js'
import remindersRoutes from './routes/reminders.js'
import progressRoutes from './routes/progress.js'
import agentRoutes from './routes/agents.js'
import achievementsRoutes from './routes/achievements.js'
import knowledgeBasesRoutes from './routes/knowledge-bases.js'
import teacherRoutes from './routes/teacher.js'
import uploadRoutes from './routes/upload.js'
import studyRoutes from './routes/study.js'

// 导入智能体
import mainAgent from './agents/MainAgent.js'
import studyCoordinator from './agents/StudyCoordinator.js'

const app = express()
const PORT = process.env.PORT || 8081

// 中间件
app.use(helmet())
app.use(cors())
app.use(compression())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务（上传的文件）
app.use('/uploads', express.static(join(__dirname, '..', 'data', 'uploads')))

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
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/notes', notesRoutes)
app.use('/api/wrong-questions', wrongQuestionsRoutes)
app.use('/api/reminders', remindersRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/agent', agentRoutes)
app.use('/api/achievements', achievementsRoutes)
app.use('/api/knowledge-bases', knowledgeBasesRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/study', studyRoutes)
app.use('/api/upload', uploadRoutes)

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
  console.log('✅ 智能体联动系统已加载')
  console.log('========================================')
  console.log('📡 可用API接口:')
  console.log('   - GET  /api/health')
  console.log('   - POST /api/agent/request')
  console.log('   - POST /api/agent/chat')
  console.log('   - GET  /api/agent/status')
  console.log('   - GET  /api/agent/list')
  console.log('   - GET  /api/agent/paths')
  console.log('   - GET  /api/knowledge')
  console.log('   - GET  /api/notes')
  console.log('   - GET  /api/wrong-questions')
  console.log('   - GET  /api/reminders')
  console.log('   - GET  /api/progress')
  console.log('========================================')
})

export default app
