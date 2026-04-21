// 共享知识库 - 存储所有智能体共享的数据
import db, { saveDb } from '../../database/init.js'
import { buildUserContext } from './UserContext.js'

class SharedKnowledgeBase {
  constructor() {
    this.initializeTables()
  }

  initializeTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS agent_shared_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT,
        agent_type TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS agent_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        source_agent TEXT,
        target_agent TEXT,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS agent_registry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name TEXT NOT NULL UNIQUE,
        agent_type TEXT NOT NULL,
        capabilities TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ]

    tables.forEach(sql => {
      try {
        db.run(sql)
      } catch (e) {
        // 忽略已存在的表错误
      }
    })
    saveDb()
  }

  // 存储共享数据
  set(key, value, agentType = null) {
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : value
    db.run('INSERT OR REPLACE INTO agent_shared_data (key, value, agent_type, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)', 
      [key, valueStr, agentType])
    saveDb()
  }

  // 获取共享数据
  get(key) {
    const result = db.exec('SELECT value FROM agent_shared_data WHERE key = ?', [key])
    if (result.length > 0 && result[0].values.length > 0) {
      const value = result[0].values[0][0]
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return null
  }

  // 发布事件
  publishEvent(eventType, sourceAgent, targetAgent, data) {
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : data
    db.run('INSERT INTO agent_events (event_type, source_agent, target_agent, data) VALUES (?, ?, ?, ?)',
      [eventType, sourceAgent, targetAgent, dataStr])
    saveDb()
  }

  // 获取事件
  getEvents(targetAgent, limit = 50) {
    const result = db.exec('SELECT * FROM agent_events WHERE target_agent = ? OR target_agent IS NULL ORDER BY created_at DESC LIMIT ?',
      [targetAgent, limit])
    
    if (result.length === 0 || result[0].values.length === 0) return []
    
    const columns = result[0].columns
    return result[0].values.map(row => {
      const obj = {}
      columns.forEach((col, i) => {
        obj[col] = row[i]
        if (col === 'data') {
          try {
            obj[col] = JSON.parse(row[i])
          } catch {
            // 保持原值
          }
        }
      })
      return obj
    })
  }

  // 注册智能体
  registerAgent(agentName, agentType, capabilities) {
    const capabilitiesStr = typeof capabilities === 'object' ? JSON.stringify(capabilities) : capabilities
    db.run('INSERT OR REPLACE INTO agent_registry (agent_name, agent_type, capabilities, status) VALUES (?, ?, ?, ?)',
      [agentName, agentType, capabilitiesStr, 'active'])
    saveDb()
  }

  // 获取所有注册的智能体
  getRegisteredAgents() {
    const result = db.exec('SELECT * FROM agent_registry WHERE status = ?', ['active'])
    
    if (result.length === 0 || result[0].values.length === 0) return []
    
    const columns = result[0].columns
    return result[0].values.map(row => {
      const obj = {}
      columns.forEach((col, i) => {
        obj[col] = row[i]
        if (col === 'capabilities') {
          try {
            obj[col] = JSON.parse(row[i])
          } catch {
            // 保持原值
          }
        }
      })
      return obj
    })
  }

  // 获取用户完整画像 — 优先从真实数据库获取
  getUserProfile(userId) {
    const ctx = buildUserContext(userId)
    return {
      userInfo: ctx.user,
      learningGoal: this.get(`user:${userId}:goal`) || ctx.user?.learning_goal,
      subjectPreferences: this.get(`user:${userId}:preferences`) || ctx.user?.subject_preferences,
      learningProgress: ctx.progress,
      weakPoints: ctx.weakPoints,
      wrongQuestions: ctx.wrongQs,
      notes: ctx.notes,
      studyPlan: ctx.plans?.find(p => p.status === 'active'),
      stats: ctx.stats,
      masteredPoints: ctx.masteredPoints,
      learningPoints: ctx.learningPoints
    }
  }

  // 更新用户学习记录
  updateLearningRecord(userId, record) {
    const records = this.get(`user:${userId}:learningRecords`) || []
    records.push({
      ...record,
      timestamp: new Date().toISOString()
    })
    this.set(`user:${userId}:learningRecords`, records, 'learning-record')
  }
}

export default new SharedKnowledgeBase()
