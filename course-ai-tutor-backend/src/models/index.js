import db, { saveDb } from '../../database/init.js'

export const userModel = {
  // 创建用户
  create(username, email, passwordHash) {
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `)
    return stmt.run(username, email, passwordHash)
  },

  // 根据用户名查找用户
  findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?')
    return stmt.get(username)
  },

  // 根据邮箱查找用户
  findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?')
    return stmt.get(email)
  },

  // 根据 ID 查找用户
  findById(id) {
    const stmt = db.prepare('SELECT id, username, email, phone, avatar_url, bio, level, experience, status, created_at FROM users WHERE id = ?')
    return stmt.get(id)
  },

  // 更新用户信息
  update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)
    const stmt = db.prepare(`
      UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
    return stmt.run(...values, id)
  },

  // 更新密码
  updatePassword(id, passwordHash) {
    const stmt = db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
    return stmt.run(passwordHash, id)
  },

  // 获取所有用户
  getAll(limit = 100, offset = 0) {
    const stmt = db.prepare('SELECT id, username, email, level, status, created_at FROM users LIMIT ? OFFSET ?')
    return stmt.all(limit, offset)
  },

  // 统计用户数
  count() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users')
    return stmt.get()
  }
}

export const courseModel = {
  create(title, description, categoryId, instructorId) {
    const stmt = db.prepare(`
      INSERT INTO courses (title, description, category, instructor_id)
      VALUES (?, ?, ?, ?)
    `)
    return stmt.run(title, description, categoryId, instructorId)
  },

  getAll(limit = 100, offset = 0) {
    const stmt = db.prepare('SELECT * FROM courses LIMIT ? OFFSET ?')
    return stmt.all(limit, offset)
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM courses WHERE id = ?')
    return stmt.get(id)
  }
}

export const studyPlanModel = {
  create(userId, goal, schedule, resources) {
    const stmt = db.prepare(`
      INSERT INTO study_plans (user_id, goal, schedule, resources)
      VALUES (?, ?, ?, ?)
    `)
    return stmt.run(userId, goal, schedule, resources)
  },

  findByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM study_plans WHERE user_id = ? ORDER BY created_at DESC')
    return stmt.all(userId)
  },

  update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)
    const stmt = db.prepare(`
      UPDATE study_plans SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
    return stmt.run(...values, id)
  }
}

export const conversationModel = {
  create(userId, agentType, messages, topic) {
    const stmt = db.prepare(`
      INSERT INTO conversations (user_id, agent_type, messages, topic)
      VALUES (?, ?, ?, ?)
    `)
    return stmt.run(userId, agentType, messages, topic)
  },

  findByUserId(userId, limit = 50) {
    const stmt = db.prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    return stmt.all(userId, limit)
  }
}

export const learningRecordModel = {
  create(userId, courseId, actionType, result, duration, score) {
    const stmt = db.prepare(`
      INSERT INTO learning_records (user_id, course_id, action_type, result, duration, score)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(userId, courseId, actionType, result, duration, score)
  },

  findByUserId(userId, limit = 100) {
    const stmt = db.prepare('SELECT * FROM learning_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    return stmt.all(userId, limit)
  },

  getStatistics(userId) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_records,
        AVG(score) as avg_score,
        SUM(duration) as total_duration
      FROM learning_records
      WHERE user_id = ?
    `)
    return stmt.get(userId)
  }
}

export const exerciseModel = {
  create(courseId, question, answer, explanation, difficulty) {
    const stmt = db.prepare(`
      INSERT INTO exercises (course_id, question, answer, explanation, difficulty)
      VALUES (?, ?, ?, ?, ?)
    `)
    return stmt.run(courseId, question, answer, explanation, difficulty)
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM exercises WHERE id = ?')
    return stmt.get(id)
  }
}

export const userExerciseModel = {
  create(userId, exerciseId, userAnswer, isCorrect, score) {
    const stmt = db.prepare(`
      INSERT INTO user_exercises (user_id, exercise_id, user_answer, is_correct, score)
      VALUES (?, ?, ?, ?, ?)
    `)
    return stmt.run(userId, exerciseId, userAnswer, isCorrect, score)
  },

  findByUserId(userId, limit = 50) {
    const stmt = db.prepare(`
      SELECT ue.*, e.question 
      FROM user_exercises ue
      JOIN exercises e ON ue.exercise_id = e.id
      WHERE ue.user_id = ?
      ORDER BY ue.completed_at DESC
      LIMIT ?
    `)
    return stmt.all(userId, limit)
  }
}

export const systemSettingsModel = {
  get(keyName) {
    const stmt = db.prepare('SELECT value FROM system_settings WHERE key_name = ?')
    return stmt.get(keyName)
  },

  set(keyName, value, description = '') {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO system_settings (key_name, value, description)
      VALUES (?, ?, ?)
    `)
    return stmt.run(keyName, value, description)
  },

  getAll() {
    const stmt = db.prepare('SELECT * FROM system_settings')
    return stmt.all()
  }
}
