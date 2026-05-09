import db, { saveDb } from './database.js'

class VectorIndexManager {
  constructor() {
    this.initialized = false
  }

  initialize() {
    if (this.initialized) return

    try {
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks(embedding)
      `)

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_chunks_content ON chunks(content)
      `)

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)
      `)

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_retrieval_history_query ON retrieval_history(query)
      `)

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_retrieval_history_created ON retrieval_history(created_at)
      `)

      this.initialized = true
      console.log('✅ 向量索引创建完成')
    } catch (error) {
      console.error('❌ 向量索引创建失败:', error.message)
    }
  }

  optimizeRetrieval() {
    try {
      db.run('ANALYZE')
      console.log('✅ 数据库分析优化完成')
    } catch (error) {
      console.error('❌ 数据库优化失败:', error.message)
    }
  }

  getDocumentChunks(documentId) {
    const stmt = db.prepare(`
      SELECT id, chunk_index, content, embedding, metadata
      FROM chunks
      WHERE document_id = ?
      ORDER BY chunk_index
    `)
    
    const chunks = []
    while (stmt.step([documentId])) {
      chunks.push(stmt.getAsObject())
    }
    stmt.free()
    
    return chunks
  }

  getKnowledgeBaseChunks(knowledgeBaseId) {
    const stmt = db.prepare(`
      SELECT c.id, c.document_id, c.chunk_index, c.content, c.embedding, c.metadata,
             d.title, d.knowledge_base_id
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE d.knowledge_base_id = ? AND d.status = 'processed'
      ORDER BY d.created_at DESC, c.chunk_index
    `)
    
    const chunks = []
    while (stmt.step([knowledgeBaseId])) {
      chunks.push(stmt.getAsObject())
    }
    stmt.free()
    
    return chunks
  }

  deleteDocumentChunks(documentId) {
    db.run('DELETE FROM chunks WHERE document_id = ?', [documentId])
    saveDb()
  }

  getStats() {
    const totalChunks = db.exec('SELECT COUNT(*) as count FROM chunks')[0].values[0][0]
    const totalDocuments = db.exec('SELECT COUNT(*) as count FROM documents')[0].values[0][0]
    const totalKnowledgeBases = db.exec('SELECT COUNT(*) as count FROM knowledge_bases')[0].values[0][0]
    const processedDocuments = db.exec("SELECT COUNT(*) as count FROM documents WHERE status = 'processed'")[0].values[0][0]
    
    return {
      totalChunks,
      totalDocuments,
      totalKnowledgeBases,
      processedDocuments,
      unprocessedDocuments: totalDocuments - processedDocuments
    }
  }
}

export default new VectorIndexManager()
