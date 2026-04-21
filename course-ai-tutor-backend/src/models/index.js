import db, { saveDb } from '../../database/init.js'

// Helper: execute a query and return rows as objects
function query(sql, params = []) {
  const result = db.exec(sql, params)
  if (!result.length || !result[0].values.length) return []
  const columns = result[0].columns
  return result[0].values.map(row => {
    const obj = {}
    columns.forEach((col, i) => obj[col] = row[i])
    return obj
  })
}

// Helper: get single row
function queryOne(sql, params = []) {
  const rows = query(sql, params)
  return rows.length > 0 ? rows[0] : undefined
}

export const userModel = {
  create(username, email, passwordHash) {
    db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, passwordHash])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  findByUsername(username) {
    return queryOne('SELECT * FROM users WHERE username = ?', [username])
  },

  findByEmail(email) {
    return queryOne('SELECT * FROM users WHERE email = ?', [email])
  },

  findById(id) {
    return queryOne('SELECT id, username, email, phone, avatar_url, bio, level, experience, role, status, created_at FROM users WHERE id = ?', [id])
  },

  update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)
    db.run(`UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id])
    saveDb()
  },

  updatePassword(id, passwordHash) {
    db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [passwordHash, id])
    saveDb()
  },

  getAll(limit = 100, offset = 0) {
    return query('SELECT id, username, email, level, status, created_at FROM users LIMIT ? OFFSET ?', [limit, offset])
  },

  count() {
    return queryOne('SELECT COUNT(*) as count FROM users')
  }
}

export const courseModel = {
  create(title, description, categoryId, instructorId) {
    db.run('INSERT INTO courses (title, description, category, instructor_id) VALUES (?, ?, ?, ?)', [title, description, categoryId, instructorId])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  getAll(limit = 100, offset = 0) {
    return query('SELECT * FROM courses LIMIT ? OFFSET ?', [limit, offset])
  },

  findById(id) {
    return queryOne('SELECT * FROM courses WHERE id = ?', [id])
  }
}

export const studyPlanModel = {
  create(userId, goal, schedule, resources) {
    db.run('INSERT INTO study_plans (user_id, goal, schedule, resources) VALUES (?, ?, ?, ?)', [userId, goal, schedule, resources])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  findByUserId(userId) {
    return query('SELECT * FROM study_plans WHERE user_id = ? ORDER BY created_at DESC', [userId])
  },

  update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)
    db.run(`UPDATE study_plans SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id])
    saveDb()
  }
}

export const conversationModel = {
  create(userId, agentType, messages, topic) {
    db.run('INSERT INTO conversations (user_id, agent_type, messages, topic) VALUES (?, ?, ?, ?)', [userId, agentType, JSON.stringify(messages), topic])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  findByUserId(userId, limit = 50) {
    return query('SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit])
  },

  delete(id) {
    db.run('DELETE FROM conversations WHERE id = ?', [id])
    saveDb()
  }
}

export const learningRecordModel = {
  create(userId, courseId, actionType, result, duration, score) {
    db.run('INSERT INTO learning_records (user_id, course_id, action_type, result, duration, score) VALUES (?, ?, ?, ?, ?, ?)', [userId, courseId, actionType, result, duration, score])
    saveDb()
  },

  findByUserId(userId, limit = 100) {
    return query('SELECT * FROM learning_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit])
  },

  getStatistics(userId) {
    return queryOne('SELECT COUNT(*) as total_records, AVG(score) as avg_score, SUM(duration) as total_duration FROM learning_records WHERE user_id = ?', [userId])
  },

  getRecentByType(userId, type, limit = 10) {
    return query('SELECT * FROM learning_records WHERE user_id = ? AND action_type = ? ORDER BY created_at DESC LIMIT ?', [userId, type, limit])
  }
}

export const exerciseModel = {
  create(courseId, question, answer, explanation, difficulty) {
    db.run('INSERT INTO exercises (course_id, question, answer, explanation, difficulty) VALUES (?, ?, ?, ?, ?)', [courseId, question, answer, explanation, difficulty])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  findById(id) {
    return queryOne('SELECT * FROM exercises WHERE id = ?', [id])
  }
}

export const userExerciseModel = {
  create(userId, exerciseId, userAnswer, isCorrect, score) {
    db.run('INSERT INTO user_exercises (user_id, exercise_id, user_answer, is_correct, score) VALUES (?, ?, ?, ?, ?)', [userId, exerciseId, userAnswer, isCorrect, score])
    saveDb()
  },

  findByUserId(userId, limit = 50) {
    return query(`SELECT ue.*, e.question FROM user_exercises ue JOIN exercises e ON ue.exercise_id = e.id WHERE ue.user_id = ? ORDER BY ue.completed_at DESC LIMIT ?`, [userId, limit])
  }
}

export const systemSettingsModel = {
  get(keyName) {
    return queryOne('SELECT value FROM system_settings WHERE key_name = ?', [keyName])
  },

  set(keyName, value, description = '') {
    db.run('INSERT OR REPLACE INTO system_settings (key_name, value, description) VALUES (?, ?, ?)', [keyName, value, description])
    saveDb()
  },

  getAll() {
    return query('SELECT * FROM system_settings')
  }
}

export const knowledgePointModel = {
  create(courseId, title, description, content, difficulty, parentId, agentType, knowledgeBaseId, prerequisites, tags) {
    db.run('INSERT INTO knowledge_points (course_id, title, description, content, difficulty, parent_id, agent_type, knowledge_base_id, prerequisites, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [courseId, title, description, content, difficulty, parentId, agentType, knowledgeBaseId, prerequisites, tags])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  findById(id) {
    return queryOne('SELECT * FROM knowledge_points WHERE id = ?', [id])
  },

  findByIds(ids) {
    if (!ids || ids.length === 0) return []
    const placeholders = ids.map(() => '?').join(',')
    return query(`SELECT * FROM knowledge_points WHERE id IN (${placeholders})`, ids)
  },

  findByCourseId(courseId) {
    return query('SELECT * FROM knowledge_points WHERE course_id = ? ORDER BY difficulty', [courseId])
  },

  findAll(limit = 100, offset = 0) {
    return query('SELECT * FROM knowledge_points LIMIT ? OFFSET ?', [limit, offset])
  },

  update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)
    db.run(`UPDATE knowledge_points SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id])
    saveDb()
  },

  delete(id) {
    db.run('DELETE FROM knowledge_points WHERE id = ?', [id])
    saveDb()
  }
}

export const noteModel = {
  create(userId, courseId, knowledgePointId, title, content, tags, isPublic) {
    db.run('INSERT INTO notes (user_id, course_id, knowledge_point_id, title, content, tags, is_public) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [userId, courseId, knowledgePointId, title, content, tags, isPublic ? 1 : 0])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  findByUserId(userId, limit = 100) {
    return query('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?', [userId, limit])
  },

  findById(id) {
    return queryOne('SELECT * FROM notes WHERE id = ?', [id])
  },

  update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)
    db.run(`UPDATE notes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id])
    saveDb()
  },

  delete(id) {
    db.run('DELETE FROM notes WHERE id = ?', [id])
    saveDb()
  }
}

export const wrongQuestionModel = {
  create(userId, exerciseId, userAnswer, correctAnswer, errorAnalysis) {
    db.run('INSERT INTO wrong_questions (user_id, exercise_id, user_answer, correct_answer, error_analysis) VALUES (?, ?, ?, ?, ?)', 
      [userId, exerciseId, userAnswer, correctAnswer, errorAnalysis])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  findByUserId(userId, limit = 100) {
    return query('SELECT wq.*, e.question FROM wrong_questions wq JOIN exercises e ON wq.exercise_id = e.id WHERE wq.user_id = ? ORDER BY wq.updated_at DESC LIMIT ?', [userId, limit])
  },

  findById(id) {
    return queryOne('SELECT * FROM wrong_questions WHERE id = ?', [id])
  },

  update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)
    db.run(`UPDATE wrong_questions SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id])
    saveDb()
  },

  delete(id) {
    db.run('DELETE FROM wrong_questions WHERE id = ?', [id])
    saveDb()
  },

  getUnmastered(userId) {
    return query('SELECT wq.*, e.question FROM wrong_questions wq JOIN exercises e ON wq.exercise_id = e.id WHERE wq.user_id = ? AND wq.mastered = 0 ORDER BY wq.review_count ASC', [userId])
  },

  createWithImage(userId, exerciseId, userAnswer, correctAnswer, errorAnalysis, imageUrl) {
    db.run('INSERT INTO wrong_questions (user_id, exercise_id, user_answer, correct_answer, error_analysis) VALUES (?, ?, ?, ?, ?)',
      [userId, exerciseId, userAnswer, correctAnswer, errorAnalysis])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    if (imageUrl && row) {
      db.run('INSERT OR REPLACE INTO agent_shared_data (key, value, agent_type) VALUES (?, ?, ?)',
        [`wrong_question_image:${row.lastInsertRowid}`, JSON.stringify({ imageUrl }), 'study-coordinator'])
      saveDb()
    }
    return { lastInsertRowid: row?.lastInsertRowid }
  }
}

export const learningReminderModel = {
  create(userId, title, content, reminderTime, reminderType) {
    db.run('INSERT INTO learning_reminders (user_id, title, content, reminder_time, reminder_type) VALUES (?, ?, ?, ?, ?)', 
      [userId, title, content, reminderTime, reminderType])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  findByUserId(userId) {
    return query('SELECT * FROM learning_reminders WHERE user_id = ? AND status = ? ORDER BY reminder_time', [userId, 'pending'])
  },

  findById(id) {
    return queryOne('SELECT * FROM learning_reminders WHERE id = ?', [id])
  },

  update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)
    db.run(`UPDATE learning_reminders SET ${fields} WHERE id = ?`, [...values, id])
    saveDb()
  },

  delete(id) {
    db.run('DELETE FROM learning_reminders WHERE id = ?', [id])
    saveDb()
  }
}

export const userProgressModel = {
  create(userId, knowledgePointId, masteryLevel) {
    db.run('INSERT INTO user_progress (user_id, knowledge_point_id, mastery_level) VALUES (?, ?, ?)', 
      [userId, knowledgePointId, masteryLevel])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  findByUserId(userId) {
    return query('SELECT up.*, kp.title as knowledge_point_title FROM user_progress up LEFT JOIN knowledge_points kp ON up.knowledge_point_id = kp.id WHERE up.user_id = ? ORDER BY up.updated_at DESC', [userId])
  },

  findByKnowledgePoint(userId, knowledgePointId) {
    return queryOne('SELECT * FROM user_progress WHERE user_id = ? AND knowledge_point_id = ?', [userId, knowledgePointId])
  },

  update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)
    db.run(`UPDATE user_progress SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id])
    saveDb()
  },

  upsert(userId, knowledgePointId, masteryLevel) {
    const existing = this.findByKnowledgePoint(userId, knowledgePointId)
    if (existing) {
      db.run('UPDATE user_progress SET mastery_level = ?, last_reviewed = CURRENT_TIMESTAMP, review_count = review_count + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND knowledge_point_id = ?',
        [masteryLevel, userId, knowledgePointId])
    } else {
      db.run('INSERT INTO user_progress (user_id, knowledge_point_id, mastery_level, last_reviewed, review_count) VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1)',
        [userId, knowledgePointId, masteryLevel])
    }
    saveDb()
  }
}

export const achievementModel = {
  getAll() {
    return query('SELECT * FROM achievements ORDER BY category, id')
  },

  findById(id) {
    return queryOne('SELECT * FROM achievements WHERE id = ?', [id])
  },

  checkAndUnlock(userId) {
    const unlocked = userAchievementModel.findByUserId(userId)
    const unlockedIds = new Set(unlocked.map(a => a.achievement_id))
    const all = this.getAll()
    const newlyUnlocked = []

    for (const achievement of all) {
      if (unlockedIds.has(achievement.id)) continue
      const criteria = JSON.parse(achievement.criteria_json || '{}')
      if (this._checkCriteria(userId, criteria)) {
        userAchievementModel.create(userId, achievement.id)
        newlyUnlocked.push(achievement)
      }
    }
    return newlyUnlocked
  },

  _checkCriteria(userId, criteria) {
    switch (criteria.action) {
      case 'login': return true
      case 'exercise': {
        const count = queryOne('SELECT COUNT(*) as count FROM user_exercises WHERE user_id = ?', [userId])
        return count && count.count >= (criteria.count || 1)
      }
      case 'mastery': {
        const count = queryOne('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND mastery_level >= 0.8', [userId])
        return count && count.count >= (criteria.count || 1)
      }
      case 'note': {
        const count = queryOne('SELECT COUNT(*) as count FROM notes WHERE user_id = ?', [userId])
        return count && count.count >= (criteria.count || 1)
      }
      case 'study_hours': {
        const total = queryOne('SELECT SUM(duration) as total FROM learning_records WHERE user_id = ?', [userId])
        const hours = (total?.total || 0) / 3600
        return hours >= (criteria.hours || 1)
      }
      default: return false
    }
  }
}

export const userAchievementModel = {
  create(userId, achievementId) {
    db.run('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)', [userId, achievementId])
    saveDb()
  },

  findByUserId(userId) {
    return query(`SELECT ua.*, a.name, a.description, a.category, a.icon
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC`, [userId])
  }
}

export const knowledgeBaseModel = {
  create(name, description, ownerId) {
    db.run('INSERT INTO knowledge_bases (name, description, owner_id) VALUES (?, ?, ?)', [name, description, ownerId])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  findByOwnerId(ownerId) {
    return query('SELECT * FROM knowledge_bases WHERE owner_id = ? ORDER BY updated_at DESC', [ownerId])
  },

  findById(id) {
    return queryOne('SELECT * FROM knowledge_bases WHERE id = ?', [id])
  },

  update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)
    db.run(`UPDATE knowledge_bases SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id])
    saveDb()
  },

  delete(id) {
    db.run('DELETE FROM knowledge_bases WHERE id = ?', [id])
    db.run('DELETE FROM knowledge_base_entries WHERE kb_id = ?', [id])
    saveDb()
  }
}

export const knowledgeBaseEntryModel = {
  create(kbId, title, content) {
    db.run('INSERT INTO knowledge_base_entries (kb_id, title, content) VALUES (?, ?, ?)', [kbId, title, content])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  findByKbId(kbId) {
    return query('SELECT * FROM knowledge_base_entries WHERE kb_id = ? ORDER BY created_at DESC', [kbId])
  },

  findAllByKbId(kbId) {
    return query('SELECT * FROM knowledge_base_entries WHERE kb_id = ? ORDER BY created_at DESC', [kbId])
  },

  search(kbId, q) {
    try {
      const terms = q.split(/\s+/).filter(Boolean).join(' AND ')
      const results = query(
        `SELECT e.* FROM knowledge_base_entries e
         INNER JOIN knowledge_base_entries_fts f ON f.rowid = e.id
         WHERE e.kb_id = ? AND f MATCH ?`,
        [kbId, `${terms} AND kb_id=${kbId}`]
      )
      if (results.length > 0) return results
    } catch (e) {
      // FTS5 不可用，回退到 LIKE
    }
    return query('SELECT * FROM knowledge_base_entries WHERE kb_id = ? AND (title LIKE ? OR content LIKE ?)',
      [kbId, `%${q}%`, `%${q}%`])
  },

  delete(id) {
    db.run('DELETE FROM knowledge_base_entries WHERE id = ?', [id])
    saveDb()
  }
}

export const learningSessionModel = {
  start(userId, activityType) {
    db.run('INSERT INTO learning_sessions (user_id, start_time, activity_type) VALUES (?, CURRENT_TIMESTAMP, ?)',
      [userId, activityType || 'study'])
    saveDb()
    const row = queryOne('SELECT last_insert_rowid() as lastInsertRowid')
    return { lastInsertRowid: row?.lastInsertRowid }
  },

  end(sessionId) {
    const session = queryOne('SELECT * FROM learning_sessions WHERE id = ?', [sessionId])
    if (!session) return null

    db.run(`UPDATE learning_sessions SET end_time = CURRENT_TIMESTAMP,
      duration = CAST((julianday(CURRENT_TIMESTAMP) - julianday(start_time)) * 86400 AS INTEGER)
      WHERE id = ?`, [sessionId])
    saveDb()
    return queryOne('SELECT * FROM learning_sessions WHERE id = ?', [sessionId])
  },

  findByUserId(userId, days = 7) {
    return query(`SELECT * FROM learning_sessions WHERE user_id = ?
      AND start_time >= datetime('now', '-${days} days')
      ORDER BY start_time DESC`, [userId])
  },

  getTotalDuration(userId, days = 7) {
    return queryOne(`SELECT COALESCE(SUM(duration), 0) as total FROM learning_sessions
      WHERE user_id = ? AND start_time >= datetime('now', '-${days} days')`, [userId])
  }
}
