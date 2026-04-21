import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { knowledgeBaseModel, knowledgeBaseEntryModel } from '../models/index.js'

const router = express.Router()

// 权限检查中间件：验证知识库属于当前用户
function checkKbOwnership(req, res, next) {
  const kbId = parseInt(req.params.id)
  const kb = knowledgeBaseModel.findById(kbId)
  if (!kb) return res.status(404).json({ success: false, message: '知识库不存在' })
  if (kb.owner_id !== req.user.id) {
    return res.status(403).json({ success: false, message: '无权访问该知识库' })
  }
  req.kb = kb
  next()
}

// 列出当前用户的知识库
router.get('/', authMiddleware, (req, res) => {
  try {
    const kbs = knowledgeBaseModel.findByOwnerId(req.user.id)
    res.json({ success: true, data: kbs, count: kbs.length })
  } catch (error) {
    console.error('获取知识库列表失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// 创建知识库
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, description } = req.body
    if (!name) return res.status(400).json({ success: false, message: '知识库名称不能为空' })
    const result = knowledgeBaseModel.create(name, description || '', req.user.id)
    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (error) {
    console.error('创建知识库失败:', error)
    res.status(500).json({ success: false, message: '创建失败' })
  }
})

// 获取知识库详情
router.get('/:id', authMiddleware, checkKbOwnership, (req, res) => {
  try {
    const entries = knowledgeBaseEntryModel.findByKbId(req.kb.id)
    res.json({ success: true, data: { ...req.kb, entries, entryCount: entries.length } })
  } catch (error) {
    console.error('获取知识库失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// 更新知识库
router.put('/:id', authMiddleware, checkKbOwnership, (req, res) => {
  try {
    const { name, description } = req.body
    knowledgeBaseModel.update(req.kb.id, { name, description })
    res.json({ success: true, message: '更新成功' })
  } catch (error) {
    console.error('更新知识库失败:', error)
    res.status(500).json({ success: false, message: '更新失败' })
  }
})

// 删除知识库
router.delete('/:id', authMiddleware, checkKbOwnership, (req, res) => {
  try {
    knowledgeBaseModel.delete(req.kb.id)
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除知识库失败:', error)
    res.status(500).json({ success: false, message: '删除失败' })
  }
})

// 列出知识库条目
router.get('/:id/entries', authMiddleware, checkKbOwnership, (req, res) => {
  try {
    const entries = knowledgeBaseEntryModel.findByKbId(req.kb.id)
    res.json({ success: true, data: entries, count: entries.length })
  } catch (error) {
    console.error('获取条目失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// 添加条目
router.post('/:id/entries', authMiddleware, checkKbOwnership, (req, res) => {
  try {
    const { title, content } = req.body
    if (!title) return res.status(400).json({ success: false, message: '标题不能为空' })
    const result = knowledgeBaseEntryModel.create(req.kb.id, title, content || '')
    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (error) {
    console.error('添加条目失败:', error)
    res.status(500).json({ success: false, message: '添加失败' })
  }
})

// 删除条目
router.delete('/:id/entries/:entryId', authMiddleware, checkKbOwnership, (req, res) => {
  try {
    knowledgeBaseEntryModel.delete(parseInt(req.params.entryId))
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除条目失败:', error)
    res.status(500).json({ success: false, message: '删除失败' })
  }
})

// 搜索条目
router.get('/:id/search', authMiddleware, checkKbOwnership, (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.status(400).json({ success: false, message: '搜索关键词不能为空' })
    const results = knowledgeBaseEntryModel.search(req.kb.id, q)
    res.json({ success: true, data: results, count: results.length })
  } catch (error) {
    console.error('搜索失败:', error)
    res.status(500).json({ success: false, message: '搜索失败' })
  }
})

export default router
