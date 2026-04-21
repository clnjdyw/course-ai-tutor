import initSqlJs from 'sql.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 确保数据库目录存在
const dbDir = join(__dirname, '..', 'data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = join(dbDir, 'rag.db')

// 初始化数据库
const SQL = await initSqlJs()
let db

// 加载现有数据库或创建新数据库
if (fs.existsSync(dbPath)) {
  const fileBuffer = fs.readFileSync(dbPath)
  db = new SQL.Database(fileBuffer)
} else {
  db = new SQL.Database()
  
  // 创建 RAG 相关表
  db.run(`
    CREATE TABLE IF NOT EXISTS knowledge_bases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      knowledge_base_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      file_type TEXT,
      word_count INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS retrieval_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      results_count INTEGER,
      response_time_ms INTEGER,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // 创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks(document_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_documents_kb ON documents(knowledge_base_id)`)
  
  // 插入默认知识库
  db.run(`
    INSERT INTO knowledge_bases (name, description, category) VALUES
      ('Java 基础', 'Java 编程语言基础知识', 'programming'),
      ('Spring Boot', 'Spring Boot 框架教程', 'framework'),
      ('Vue.js', 'Vue.js 前端框架', 'frontend'),
      ('数据库', 'MySQL 数据库知识', 'database'),
      ('人工智能', 'AI 和机器学习基础', 'ai')
  `)
}

console.log('✅ RAG 数据库初始化完成！')
console.log(`📁 数据库路径：${dbPath}`)
console.log('📚 已创建的知识库:')
console.log('  - Java 基础')
console.log('  - Spring Boot')
console.log('  - Vue.js')
console.log('  - 数据库')
console.log('  - 人工智能')

// 保存数据库
function saveDb() {
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

export default db
export { saveDb }
