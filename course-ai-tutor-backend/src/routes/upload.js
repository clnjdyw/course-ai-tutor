import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import multer from 'multer'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const uploadDir = join(__dirname, '..', '..', 'data', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('不支持的文件类型'))
  }
})

const router = express.Router()

// 上传文件（图片或音频）
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: '未选择文件' })
    const url = `/uploads/${req.file.filename}`
    res.json({ success: true, data: { url, filename: req.file.filename, size: req.file.size } })
  } catch (error) {
    console.error('文件上传失败:', error)
    res.status(500).json({ success: false, message: '上传失败' })
  }
})

export default router
