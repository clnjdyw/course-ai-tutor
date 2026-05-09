import db, { saveDb } from './database.js'
import { getEmbedding, cosineSimilarity } from './embedding.js'
import vectorIndex from './vector-index.js'

class RetrievalEngine {
  constructor() {
    this.searchHistory = []
    this.maxHistorySize = 1000
  }

  async retrieve(query, options = {}) {
    const {
      knowledgeBaseId,
      topK = 5,
      threshold = 0.7,
      useHybrid = true,
      includeMetadata = true
    } = options

    const startTime = Date.now()

    try {
      let results
      if (useHybrid) {
        results = await this.hybridSearch(query, {
          knowledgeBaseId,
          topK,
          threshold,
          includeMetadata
        })
      } else {
        results = await this.vectorSearch(query, {
          knowledgeBaseId,
          topK,
          threshold,
          includeMetadata
        })
      }

      const responseTime = Date.now() - startTime

      this.recordSearch(query, results.length, responseTime, knowledgeBaseId)

      return {
        query,
        results,
        count: results.length,
        responseTime,
        searchType: useHybrid ? 'hybrid' : 'vector'
      }
    } catch (error) {
      console.error('❌ 检索失败:', error.message)
      throw error
    }
  }

  async vectorSearch(query, options = {}) {
    const {
      knowledgeBaseId,
      topK = 5,
      threshold = 0.7,
      includeMetadata = true
    } = options

    console.log('🔍 开始向量检索...')

    const queryEmbedding = await getEmbedding(query)

    let sql = `
      SELECT c.id, c.document_id, c.chunk_index, c.content, c.embedding, c.metadata,
             d.title, d.knowledge_base_id
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE d.status = 'processed'
    `

    const params = []
    if (knowledgeBaseId) {
      sql += ' AND d.knowledge_base_id = ?'
      params.push(knowledgeBaseId)
    }

    const stmt = db.prepare(sql)
    const chunks = []
    while (stmt.step(params)) {
      chunks.push(stmt.getAsObject())
    }
    stmt.free()

    console.log(`📊 加载了 ${chunks.length} 个文档块`)

    const results = chunks.map(chunk => {
      const chunkEmbedding = JSON.parse(chunk.embedding)
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding)

      return {
        id: chunk.id,
        documentId: chunk.document_id,
        chunkIndex: chunk.chunk_index,
        title: chunk.title,
        content: chunk.content,
        similarity,
        knowledgeBaseId: chunk.knowledge_base_id,
        metadata: includeMetadata && chunk.metadata ? JSON.parse(chunk.metadata) : null
      }
    })

    const filteredResults = results
      .filter(r => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)

    console.log(`✅ 向量检索完成,返回 ${filteredResults.length} 个结果`)
    return filteredResults
  }

  keywordSearch(query, options = {}) {
    const {
      knowledgeBaseId,
      topK = 5
    } = options

    console.log('🔍 开始关键词检索...')

    const keywords = query.split(/\s+/).filter(k => k.length > 1)

    if (keywords.length === 0) {
      return []
    }

    let sql = `
      SELECT c.id, c.document_id, c.chunk_index, c.content, c.metadata,
             d.title, d.knowledge_base_id
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE d.status = 'processed'
    `

    const params = []
    if (knowledgeBaseId) {
      sql += ' AND d.knowledge_base_id = ?'
      params.push(knowledgeBaseId)
    }

    const conditions = keywords.map(() => 'c.content LIKE ?').join(' OR ')
    sql += ` AND (${conditions})`
    params.push(...keywords.map(k => `%${k}%`))

    sql += ' ORDER BY LENGTH(c.content) ASC'

    const stmt = db.prepare(sql)
    const chunks = []
    while (stmt.step(params)) {
      chunks.push(stmt.getAsObject())
    }
    stmt.free()

    const results = chunks.map(chunk => {
      let score = 0
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi')
        const matches = chunk.content.match(regex)
        if (matches) {
          score += matches.length
        }
      })

      return {
        id: chunk.id,
        documentId: chunk.document_id,
        chunkIndex: chunk.chunk_index,
        title: chunk.title,
        content: chunk.content,
        keywordScore: score,
        knowledgeBaseId: chunk.knowledge_base_id,
        metadata: chunk.metadata ? JSON.parse(chunk.metadata) : null
      }
    })

    const sortedResults = results
      .sort((a, b) => b.keywordScore - a.keywordScore)
      .slice(0, topK)

    console.log(`✅ 关键词检索完成,返回 ${sortedResults.length} 个结果`)
    return sortedResults
  }

  async hybridSearch(query, options = {}) {
    const {
      knowledgeBaseId,
      topK = 5,
      threshold = 0.7,
      includeMetadata = true
    } = options

    console.log('🔍 开始混合检索...')

    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearch(query, { knowledgeBaseId, topK: topK * 2, threshold: 0, includeMetadata }),
      Promise.resolve(this.keywordSearch(query, { knowledgeBaseId, topK: topK * 2 }))
    ])

    const resultMap = new Map()

    vectorResults.forEach(result => {
      resultMap.set(result.id, {
        ...result,
        combinedScore: result.similarity * 0.7
      })
    })

    keywordResults.forEach(result => {
      const maxKeywordScore = Math.max(...keywordResults.map(r => r.keywordScore), 1)
      const normalizedScore = result.keywordScore / maxKeywordScore

      if (resultMap.has(result.id)) {
        const existing = resultMap.get(result.id)
        existing.combinedScore += normalizedScore * 0.3
        existing.keywordScore = result.keywordScore
      } else {
        resultMap.set(result.id, {
          ...result,
          similarity: 0,
          keywordScore: result.keywordScore,
          combinedScore: normalizedScore * 0.3
        })
      }
    })

    const allResults = Array.from(resultMap.values())

    const filteredResults = allResults
      .filter(r => r.combinedScore >= threshold * 0.7)
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topK)

    console.log(`✅ 混合检索完成,返回 ${filteredResults.length} 个结果`)
    return filteredResults
  }

  recordSearch(query, resultsCount, responseTime, knowledgeBaseId) {
    try {
      db.run(
        `INSERT INTO retrieval_history (query, results_count, response_time_ms, knowledge_base_id)
         VALUES (?, ?, ?, ?)`,
        [query, resultsCount, responseTime, knowledgeBaseId || null]
      )
      saveDb()

      this.searchHistory.push({
        query,
        resultsCount,
        responseTime,
        knowledgeBaseId,
        timestamp: new Date().toISOString()
      })

      if (this.searchHistory.length > this.maxHistorySize) {
        this.searchHistory.shift()
      }
    } catch (error) {
      console.error('❌ 记录搜索历史失败:', error.message)
    }
  }

  getSearchHistory(limit = 50) {
    return this.searchHistory.slice(-limit)
  }

  getPopularQueries(limit = 20) {
    const queryCount = new Map()
    this.searchHistory.forEach(item => {
      queryCount.set(item.query, (queryCount.get(item.query) || 0) + 1)
    })

    return Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }
}

export default new RetrievalEngine()
