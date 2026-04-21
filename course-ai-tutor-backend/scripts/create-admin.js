import initSqlJs from 'sql.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量
dotenv.config({ path: join(__dirname, '..', '.env') })

const DB_PATH = join(__dirname, '..', 'data', 'course-ai-tutor.db')

async function createAdmin() {
  console.log('🔧 正在创建管理员账号...\n')

  // 初始化 SQL.js
  const SQL = await initSqlJs({
    locateFile: file => join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
  })

  // 加载数据库
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ 数据库文件不存在:', DB_PATH)
    console.log('💡 请先启动后端服务以初始化数据库')
    process.exit(1)
  }

  const fileBuffer = fs.readFileSync(DB_PATH)
  const db = new SQL.Database(fileBuffer)

  // 管理员信息
  const adminUsername = 'admin'
  const adminEmail = 'admin@coursetutor.com'
  const adminPassword = 'admin123456'
  const adminRole = 'admin'

  // 检查管理员是否已存在
  const existingAdmin = db.exec(`SELECT * FROM users WHERE username = '${adminUsername}'`)
  if (existingAdmin.length > 0 && existingAdmin[0].values.length > 0) {
    console.log('⚠️  管理员账号已存在')
    console.log('📋 管理员信息:')
    console.log(`   用户名: ${adminUsername}`)
    console.log(`   密码: ${adminPassword}`)
    console.log(`   邮箱: ${adminEmail}`)
    console.log('\n💡 如需重置密码,请先删除现有管理员账号')
    db.close()
    return
  }

  // 加密密码
  const passwordHash = bcrypt.hashSync(adminPassword, 12)

  // 插入管理员账号
  db.run(
    `INSERT INTO users (username, email, password_hash, role, level, status) 
     VALUES (?, ?, ?, ?, 1, 'active')`,
    [adminUsername, adminEmail, passwordHash, adminRole]
  )

  // 保存数据库
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)

  db.close()

  console.log('✅ 管理员账号创建成功!\n')
  console.log('📋 管理员登录信息:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   用户名: ${adminUsername}`)
  console.log(`   密码:   ${adminPassword}`)
  console.log(`   邮箱:   ${adminEmail}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('⚠️  请妥善保管管理员账号信息!')
}

createAdmin().catch(error => {
  console.error('❌ 创建管理员失败:', error)
  process.exit(1)
})
