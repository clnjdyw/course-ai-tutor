import request, { ragRequest } from './request'

// 从响应中统一提取 AI 回复内容
function extractContent(response) {
  return response.teachingContent || response.message || response.planContent ||
         response.answer || response.evaluation || response.formattedResults ||
         response.content || ''
}

// 从响应中提取情绪数据
function extractMood(response) {
  return response.mood || null
}

// 从响应中提取情绪反馈文本
function extractMoodFeedback(response) {
  return response.moodFeedback || null
}

// 流式请求（使用 fetch 直接读取 SSE）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'

async function streamRequest(endpoint, data, onChunk, timeoutMs = 5 * 60 * 1000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: controller.signal
  })

  clearTimeout(timer)

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    buffer += chunk

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.slice(6))
          if (parsed.content !== undefined) {
            onChunk(parsed.content, parsed.done)
          }
        } catch (e) {
          // skip
        }
      } else if (line.startsWith('event: done')) {
        // stream finished
        break
      }
    }
  }
}

/**
 * 智能体统一请求接口
 */
export const agentApi = {
  // 统一请求入口（智能体管理器）
  request(data) {
    return request.post('/agent/request', data)
  },

  // 聊天接口（陪伴智能体）
  chat(data) {
    return request.post('/agent/chat', data)
  },

  // 获取智能体状态
  getStatus() {
    return request.get('/agent/status')
  },

  // 获取智能体列表
  getList() {
    return request.get('/agent/list')
  }
}

/**
 * 规划智能体 API
 */
export const plannerApi = {
  // 创建学习计划
  createPlan(data) {
    return request.post('/agent/request', {
      type: 'plan',
      ...data,
      knowledgeBaseId: data.knowledgeBaseId || null
    })
  },

  // 创建学习计划（流式）
  createPlanStream(data, onChunk) {
    return streamRequest('/agent/request/stream', {
      type: 'plan',
      ...data,
      knowledgeBaseId: data.knowledgeBaseId || null
    }, onChunk)
  },

  // 调整学习计划
  adjustPlan(planId, feedback) {
    return request.post('/agent/request', {
      type: 'plan',
      planId,
      content: feedback
    })
  }
}

/**
 * RAG 知识库 API
 */
export const ragApi = {
  // 获取知识库列表
  getKnowledgeBases() {
    return ragRequest.get('/knowledge-bases')
  },

  // 检索知识
  retrieve(query, knowledgeBaseId = null, topK = 5) {
    return ragRequest.post('/retrieve', {
      query,
      knowledgeBaseId,
      topK
    })
  },

  // 获取文档列表
  getDocuments(knowledgeBaseId = null) {
    return ragRequest.get('/documents', {
      params: { knowledgeBaseId }
    })
  },

  // 添加文档
  addDocument(data) {
    return ragRequest.post('/documents', data)
  },

  // 获取统计
  getStats() {
    return ragRequest.get('/stats')
  }
}

/**
 * 教学智能体 API
 */
export const tutorApi = {
  // 讲解知识点（使用 agent 统一接口）
  teach(data) {
    return request.post('/agent/request', {
      type: 'teaching',
      content: data.topic || data.content,
      context: { level: data.level, ...data.context }
    })
  },

  // 讲解知识点（流式 - 使用 agent 端点）
  teachStream(data, onChunk) {
    return streamRequest('/agent/request/stream', { type: 'tutor', content: data.topic || data.content }, onChunk)
  },

  // 保存单条消息
  saveMessage(role, content) {
    return request.post('/learning/tutor/messages', { role, content })
  },

  // 加载对话历史
  loadMessages(params = {}) {
    return request.get('/learning/tutor/messages', { params })
  },

  // 清空对话历史
  clearMessages() {
    return request.delete('/learning/tutor/messages')
  },

  // 解答疑问
  answerQuestion(userId, question, context = '') {
    return request.post('/agent/request', {
      type: 'help',
      userId,
      content: question,
      context
    })
  }
}

/**
 * 答疑智能体 API
 */
export const helperApi = {
  // 解答问题
  answer(data) {
    return request.post('/agent/request', {
      type: 'help',
      ...data
    })
  },

  // 解答问题（流式）
  answerStream(data, onChunk) {
    return streamRequest('/agent/request/stream', { type: 'help', ...data }, onChunk)
  },

  // 代码调试
  debugCode(data) {
    return request.post('/agent/request', {
      type: 'help',
      ...data,
      content: data.content || data.code ? `代码调试：${data.code || data.content}` : ''
    })
  }
}

/**
 * 评估智能体 API
 */
export const evaluatorApi = {
  // 评估作业
  evaluate(data) {
    return request.post('/agent/request', {
      type: 'evaluate',
      ...data
    })
  },

  // 评估作业（流式）
  evaluateStream(data, onChunk) {
    return streamRequest('/agent/request/stream', { type: 'evaluate', ...data }, onChunk)
  },

  // 生成学习报告
  generateReport(userId, learningData) {
    return request.post('/agent/request', {
      type: 'evaluate',
      userId,
      content: '生成学习报告',
      context: learningData
    })
  },

  // 生成学习报告（流式）
  generateReportStream(data, onChunk) {
    return streamRequest('/agent/request/stream', { type: 'evaluate', ...data }, onChunk)
  }
}

/**
 * 陪伴智能体 API（聊天交流）
 */
export const companionApi = {
  // 聊天
  chat(userId, message) {
    return request.post('/agent/chat', {
      userId,
      message
    })
  }
}

/**
 * 教师 API
 */
export const teacherApi = {
  // 分析单个学生情况
  analyzeStudent(studentId, analysisType = 'comprehensive') {
    return request.post('/agent/request', {
      type: 'evaluate',
      userId: studentId,
      content: `请详细分析学生 ${studentId} 的学习情况，包括：学习进度、薄弱知识点、学习建议等。（分析维度：${analysisType}）`
    })
  },

  // 系统整体学情概览
  systemOverview() {
    return request.post('/agent/request', {
      type: 'evaluate',
      userId: 1,
      content: '请生成一份当前所有学生的整体学习情况分析报告，包括：活跃学生数、平均进度、常见问题、教学建议。'
    })
  },

  // 获取学生列表
  getStudents() {
    return request.get('/teacher/students')
  },

  // 获取单个学生详情
  getStudent(id) {
    return request.get(`/teacher/students/${id}`)
  }
}

// 导出工具函数
export { extractContent, extractMood, extractMoodFeedback }

/**
 * 管理员 API
 */
export const adminApi = {
  // 用户管理
  getUsers(params) {
    return request.get('/admin/users', { params })
  },
  createUser(data) {
    return request.post('/admin/users', data)
  },
  updateUser(id, data) {
    return request.put(`/admin/users/${id}`, data)
  },
  deleteUser(id) {
    return request.delete(`/admin/users/${id}`)
  },
  toggleBan(id, muted) {
    return request.post(`/admin/users/${id}/ban`, { muted })
  },

  // 子管理员
  getSubAdmins() {
    return request.get('/admin/sub-admins')
  },
  createSubAdmin(data) {
    return request.post('/admin/sub-admins', data)
  },
  updateSubAdmin(id, data) {
    return request.put(`/admin/sub-admins/${id}`, data)
  },

  // 操作日志
  getLogs(params) {
    return request.get('/admin/logs', { params })
  },

  // 通知管理
  getNotifications() {
    return request.get('/admin/notifications')
  },
  createNotification(data) {
    return request.post('/admin/notifications', data)
  },
  deleteNotification(id) {
    return request.delete(`/admin/notifications/${id}`)
  },

  // 教学资源
  getResources() {
    return request.get('/admin/resources')
  },
  createResource(data) {
    return request.post('/admin/resources', data)
  },
  updateResource(id, data) {
    return request.put(`/admin/resources/${id}`, data)
  },
  deleteResource(id) {
    return request.delete(`/admin/resources/${id}`)
  },

  // 实时大盘
  getDashboard() {
    return request.get('/admin/dashboard')
  },

  // 学情报表
  getLearningStats() {
    return request.get('/admin/learning-stats')
  },

  // 系统设置
  getSettings() {
    return request.get('/admin/settings')
  },
  updateSettings(data) {
    return request.put('/admin/settings', data)
  },
  toggleMaintenance(enabled) {
    return request.post('/admin/maintenance', { enabled })
  },

  // 安全中心
  getSecurity() {
    return request.get('/admin/security')
  },
  addSensitiveWord(word) {
    return request.post('/admin/security/sensitive-words', { word })
  },
  removeSensitiveWord(word) {
    return request.delete(`/admin/security/sensitive-words/${word}`)
  },
  addIPBlacklist(ip, reason) {
    return request.post('/admin/security/ip-blacklist', { ip, reason })
  },
  removeIPBlacklist(ip) {
    return request.delete(`/admin/security/ip-blacklist/${ip}`)
  },

  // 数据备份/恢复
  backup() {
    return request.post('/admin/backup')
  },
  restore(backupData) {
    return request.post('/admin/restore', { backup: backupData })
  },

  // AI 系统分析
  aiAnalysis(content) {
    return request.post('/admin/ai-analysis', { content })
  }
}

/**
 * 知识点管理 API
 */
export const knowledgeApi = {
  getList(params) {
    return request.get('/knowledge', { params })
  },
  getById(id) {
    return request.get(`/knowledge/${id}`)
  },
  create(data) {
    return request.post('/knowledge', data)
  },
  update(id, data) {
    return request.put(`/knowledge/${id}`, data)
  },
  delete(id) {
    return request.delete(`/knowledge/${id}`)
  }
}

/**
 * 笔记 API
 */
export const notesApi = {
  getList(params) {
    return request.get('/notes', { params })
  },
  getById(id) {
    return request.get(`/notes/${id}`)
  },
  create(data) {
    return request.post('/notes', data)
  },
  update(id, data) {
    return request.put(`/notes/${id}`, data)
  },
  delete(id) {
    return request.delete(`/notes/${id}`)
  }
}

/**
 * 错题本 API
 */
export const wrongQuestionsApi = {
  getList(params) {
    return request.get('/wrong-questions', { params })
  },
  getById(id) {
    return request.get(`/wrong-questions/${id}`)
  },
  create(data) {
    return request.post('/wrong-questions', data)
  },
  update(id, data) {
    return request.put(`/wrong-questions/${id}`, data)
  },
  delete(id) {
    return request.delete(`/wrong-questions/${id}`)
  },
  getUnmastered() {
    return request.get('/wrong-questions', { params: { unmastered: true } })
  }
}

/**
 * 学习提醒 API
 */
export const remindersApi = {
  getList() {
    return request.get('/reminders')
  },
  getById(id) {
    return request.get(`/reminders/${id}`)
  },
  create(data) {
    return request.post('/reminders', data)
  },
  update(id, data) {
    return request.put(`/reminders/${id}`, data)
  },
  delete(id) {
    return request.delete(`/reminders/${id}`)
  }
}

/**
 * 学习进度 API
 */
export const progressApi = {
  getList() {
    return request.get('/progress')
  },
  update(data) {
    return request.post('/progress', data)
  },
  getStats() {
    return request.get('/progress/stats')
  },
  getRecommendations() {
    return request.get('/progress/recommendations')
  }
}

/**
 * 习题 API
 */
export const exerciseApi = {
  generate(data) {
    return request.post('/exercise/generate', data)
  },
  submit(data) {
    return request.post('/exercise/submit', data)
  }
}

/**
 * 成就 API
 */
export const achievementsApi = {
  getAll() {
    return request.get('/achievements')
  },
  check() {
    return request.post('/achievements/check')
  }
}

/**
 * 知识库 API
 */
export const knowledgeBasesApi = {
  getList() {
    return request.get('/knowledge-bases')
  },
  create(data) {
    return request.post('/knowledge-bases', data)
  },
  getById(id) {
    return request.get(`/knowledge-bases/${id}`)
  },
  update(id, data) {
    return request.put(`/knowledge-bases/${id}`, data)
  },
  delete(id) {
    return request.delete(`/knowledge-bases/${id}`)
  },
  getEntries(kbId) {
    return request.get(`/knowledge-bases/${kbId}/entries`)
  },
  addEntry(kbId, data) {
    return request.post(`/knowledge-bases/${kbId}/entries`, data)
  },
  deleteEntry(kbId, entryId) {
    return request.delete(`/knowledge-bases/${kbId}/entries/${entryId}`)
  },
  search(kbId, q) {
    return request.get(`/knowledge-bases/${kbId}/search`, { params: { q } })
  }
}

/**
 * 文件上传 API
 */
export const uploadApi = {
  uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadAudio(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

/**
 * 学习会话 API
 */
export const sessionApi = {
  start(activityType) {
    return request.post('/learning/session/start', { activityType })
  },
  end(sessionId) {
    return request.post('/learning/session/end', { sessionId })
  },
  getList(days = 7) {
    return request.get('/learning/sessions', { params: { days } })
  }
}
