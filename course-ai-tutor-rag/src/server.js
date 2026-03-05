import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import db, { saveDb } from './database.js'
import { getEmbedding, cosineSimilarity, chunkText, preprocessText } from './embedding.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8083

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 辅助函数：执行查询
function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql)
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.getAsObject(params)
    }
    stmt.run(params)
    return db.exec('SELECT last_insert_rowid()')[0].values[0][0]
  } catch (error) {
    console.error('数据库错误:', error.message)
    throw error
  }
}

// 辅助函数：查询所有
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  const results = []
  
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  
  return results
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'RAG Service'
  })
})

// 获取知识库列表
app.get('/api/knowledge-bases', (req, res) => {
  const knowledgeBases = queryAll('SELECT * FROM knowledge_bases')
  res.json({ success: true, data: knowledgeBases })
})

// 创建知识库
app.post('/api/knowledge-bases', (req, res) => {
  const { name, description, category } = req.body
  
  const id = query(
    'INSERT INTO knowledge_bases (name, description, category) VALUES (?, ?, ?)',
    [name, description, category]
  )
  
  saveDb()
  res.json({ 
    success: true, 
    message: '知识库创建成功',
    data: { id }
  })
})

// 添加文档
app.post('/api/documents', async (req, res) => {
  const { knowledgeBaseId, title, content, fileType = 'text' } = req.body
  
  if (!content) {
    return res.json({ success: false, message: '文档内容不能为空' })
  }
  
  try {
    // 保存文档
    const documentId = query(
      `INSERT INTO documents (knowledge_base_id, title, content, file_type, word_count, status)
       VALUES (?, ?, ?, ?, ?, 'processing')`,
      [knowledgeBaseId, title, content, fileType, content.length]
    )
    
    // 分块处理
    const chunks = chunkText(preprocessText(content), 500, 50)
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      // 获取向量嵌入
      const embedding = await getEmbedding(chunk.content)
      
      // 保存分块
      query(
        `INSERT INTO chunks (document_id, chunk_index, content, embedding, metadata)
         VALUES (?, ?, ?, ?, ?)`,
        [
          documentId,
          i,
          chunk.content,
          JSON.stringify(embedding),
          JSON.stringify({ start: chunk.start, end: chunk.end })
        ]
      )
    }
    
    // 更新文档状态
    query(
      `UPDATE documents SET status = 'processed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [documentId]
    )
    
    saveDb()
    
    res.json({ 
      success: true, 
      message: '文档添加成功',
      data: { documentId, chunks: chunks.length }
    })
  } catch (error) {
    console.error('添加文档失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 检索相似内容
app.post('/api/retrieve', async (req, res) => {
  const { query: searchQuery, knowledgeBaseId, topK = 5, threshold = 0.7 } = req.body
  
  if (!searchQuery) {
    return res.json({ success: false, message: '查询内容不能为空' })
  }
  
  const startTime = Date.now()
  
  try {
    // 获取查询向量
    const queryEmbedding = await getEmbedding(preprocessText(searchQuery))
    
    // 获取所有分块
    let sql = `
      SELECT c.id, c.document_id, c.content, c.embedding, d.title, d.knowledge_base_id
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE d.status = 'processed'
    `
    
    if (knowledgeBaseId) {
      sql += ` AND d.knowledge_base_id = ${knowledgeBaseId}`
    }
    
    const chunks = queryAll(sql)
    
    // 计算相似度
    const results = chunks.map(chunk => {
      const chunkEmbedding = JSON.parse(chunk.embedding)
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding)
      
      return {
        id: chunk.id,
        documentId: chunk.document_id,
        title: chunk.title,
        content: chunk.content,
        similarity,
        knowledgeBaseId: chunk.knowledge_base_id
      }
    })
    
    // 过滤并排序
    const filteredResults = results
      .filter(r => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
    
    const responseTime = Date.now() - startTime
    
    // 记录检索历史
    query(
      `INSERT INTO retrieval_history (query, results_count, response_time_ms)
       VALUES (?, ?, ?)`,
      [searchQuery, filteredResults.length, responseTime]
    )
    
    res.json({
      success: true,
      data: {
        query: searchQuery,
        results: filteredResults,
        count: filteredResults.length,
        responseTime
      }
    })
  } catch (error) {
    console.error('检索失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 获取文档列表
app.get('/api/documents', (req, res) => {
  const { knowledgeBaseId } = req.query
  
  let sql = `
    SELECT d.*, k.name as knowledge_base_name
    FROM documents d
    LEFT JOIN knowledge_bases k ON d.knowledge_base_id = k.id
    WHERE 1=1
  `
  
  if (knowledgeBaseId) {
    sql += ` AND d.knowledge_base_id = ${knowledgeBaseId}`
  }
  
  sql += ' ORDER BY d.created_at DESC'
  
  const documents = queryAll(sql)
  res.json({ success: true, data: documents })
})

// 删除文档
app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params
  
  query('DELETE FROM chunks WHERE document_id = ?', [id])
  query('DELETE FROM documents WHERE id = ?', [id])
  
  saveDb()
  res.json({ success: true, message: '文档删除成功' })
})

// 获取检索统计
app.get('/api/stats', (req, res) => {
  const stats = {
    knowledgeBases: queryAll('SELECT COUNT(*) as count FROM knowledge_bases')[0].count,
    documents: queryAll('SELECT COUNT(*) as count FROM documents')[0].count,
    chunks: queryAll('SELECT COUNT(*) as count FROM chunks')[0].count,
    retrievals: queryAll('SELECT COUNT(*) as count FROM retrieval_history')[0].count
  }
  
  res.json({ success: true, data: stats })
})

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================')
  console.log('   🧠 Course AI Tutor - RAG Service')
  console.log('========================================')
  console.log(`   服务地址：http://0.0.0.0:${PORT}`)
  console.log(`   本地访问：http://localhost:${PORT}`)
  console.log('========================================')
  console.log('✅ RAG 服务已启动')
  console.log('✅ 向量检索已就绪')
  console.log('========================================')
})
