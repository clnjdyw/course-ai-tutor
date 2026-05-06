import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import db, { saveDb } from './database.js'
import { getEmbedding, cosineSimilarity, chunkText, preprocessText, getCacheStats, clearCache } from './embedding.js'
import retrievalEngine from './retrieval-engine.js'
import vectorIndex from './vector-index.js'

dotenv.config()

vectorIndex.initialize()

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
  
  while (stmt.step(params)) {
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
  const knowledgeBases = queryAll(`
    SELECT kb.*, COUNT(d.id) as document_count
    FROM knowledge_bases kb
    LEFT JOIN documents d ON d.knowledge_base_id = kb.id
    GROUP BY kb.id
  `)
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

// 删除知识库（级联删除文档和分块）
app.delete('/api/knowledge-bases/:id', (req, res) => {
  const { id } = req.params
  try {
    // 先删除关联的 chunks 和 documents
    const docs = queryAll('SELECT id FROM documents WHERE knowledge_base_id = ?', [id])
    for (const doc of docs) {
      query('DELETE FROM chunks WHERE document_id = ?', [doc.id])
    }
    query('DELETE FROM documents WHERE knowledge_base_id = ?', [id])
    query('DELETE FROM knowledge_bases WHERE id = ?', [id])
    saveDb()
    res.json({ success: true, message: '知识库已删除' })
  } catch (err) {
    res.status(500).json({ success: false, message: '删除失败: ' + err.message })
  }
})

// 辅助函数：延迟执行
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 辅助函数：批量并行获取向量嵌入
async function getEmbeddingsBatch(texts, batchSize = 10) {
  const embeddings = []
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    
    // 并行处理当前批次
    const batchEmbeddings = await Promise.all(
      batch.map(text => getEmbedding(text))
    )
    
    embeddings.push(...batchEmbeddings)
    
    // 如果还有下一批，添加延迟避免 API 限流
    if (i + batchSize < texts.length) {
      await sleep(100)
    }
  }
  
  return embeddings
}

// 添加文档（优化版：批量并行向量化）
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
    
    saveDb()
    
    // 分块处理
    const chunks = chunkText(preprocessText(content), 500, 50)
    console.log(`📝 文档分块完成，共 ${chunks.length} 个块`)
    
    // 批量并行获取向量嵌入
    console.log('🔄 开始批量向量化...')
    const embeddings = await getEmbeddingsBatch(chunks.map(c => c.content), 10)
    console.log('✅ 向量化完成')
    
    // 批量保存分块
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = embeddings[i]
      
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
    
    console.log(`✅ 文档处理完成: ${title}`)
    
    res.json({ 
      success: true, 
      message: '文档添加成功',
      data: { documentId, chunks: chunks.length }
    })
  } catch (error) {
    console.error('添加文档失败:', error)
    
    // 如果失败，更新文档状态为 failed
    try {
      query(
        `UPDATE documents SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [documentId]
      )
      saveDb()
    } catch (e) {
      console.error('更新文档状态失败:', e)
    }
    
    res.status(500).json({ success: false, message: error.message })
  }
})

// 检索相似内容
app.post('/api/retrieve', async (req, res) => {
  const { query: searchQuery, knowledgeBaseId, topK = 5, threshold = 0.7, useHybrid = true } = req.body
  
  if (!searchQuery) {
    return res.json({ success: false, message: '查询内容不能为空' })
  }
  
  try {
    const result = await retrievalEngine.retrieve(searchQuery, {
      knowledgeBaseId,
      topK,
      threshold,
      useHybrid
    })
    
    res.json({
      success: true,
      data: result
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
    SELECT d.*, k.name as knowledge_base_name,
           (SELECT COUNT(*) FROM chunks c WHERE c.document_id = d.id) as chunk_count
    FROM documents d
    LEFT JOIN knowledge_bases k ON d.knowledge_base_id = k.id
    WHERE 1=1
  `

  const params = []
  if (knowledgeBaseId) {
    sql += ` AND d.knowledge_base_id = ?`
    params.push(knowledgeBaseId)
  }

  sql += ' ORDER BY d.created_at DESC'

  const documents = queryAll(sql, params)
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

// 获取缓存统计
app.get('/api/cache/stats', (req, res) => {
  const cacheStats = getCacheStats()
  res.json({ 
    success: true, 
    data: {
      ...cacheStats,
      description: 'Embedding 向量缓存统计'
    }
  })
})

// 清空缓存
app.post('/api/cache/clear', (req, res) => {
  clearCache()
  res.json({ 
    success: true, 
    message: '缓存已清空'
  })
})

// 获取检索统计
app.get('/api/stats', (req, res) => {
  const kbCount = queryAll('SELECT COUNT(*) as count FROM knowledge_bases')[0].count
  const docCount = queryAll('SELECT COUNT(*) as count FROM documents')[0].count
  const chunkCount = queryAll('SELECT COUNT(*) as count FROM chunks')[0].count
  const retrievalCount = queryAll('SELECT COUNT(*) as count FROM retrieval_history')[0].count

  const stats = {
    knowledgeBases: kbCount,
    documents: docCount,
    chunks: chunkCount,
    retrievals: retrievalCount,
    totalKnowledgeBases: kbCount,
    totalDocuments: docCount,
    totalChunks: chunkCount,
    cacheHitRate: '0%'
  }

  res.json({ success: true, data: stats })
})

app.get('/api/search/history', (req, res) => {
  const { limit = 50 } = req.query
  const history = retrievalEngine.getSearchHistory(parseInt(limit))
  res.json({ success: true, data: history })
})

app.get('/api/search/popular', (req, res) => {
  const { limit = 20 } = req.query
  const popular = retrievalEngine.getPopularQueries(parseInt(limit))
  res.json({ success: true, data: popular })
})

app.post('/api/optimize', (req, res) => {
  vectorIndex.optimizeRetrieval()
  res.json({ success: true, message: '数据库优化完成' })
})

app.get('/api/vector-index/stats', (req, res) => {
  const stats = vectorIndex.getStats()
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
