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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'

async function streamRequest(endpoint, data, onChunk, timeoutMs = 5 * 60 * 1000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
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
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    buffer += chunk

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        const eventType = line.slice(7)
        continue
      }
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.slice(6))
          if (parsed.content !== undefined) {
            fullContent = parsed.content
            onChunk(parsed.content, false, parsed)
          }
          if (parsed.done !== undefined || eventType === 'done') {
            onChunk(fullContent, true, parsed)
          }
        } catch (e) {
          // skip
        }
      }
    }
  }
  
  return fullContent
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
      type: 'planner',
      ...data,
      knowledgeBaseId: data.knowledgeBaseId || null
    })
  },

  // 创建学习计划（流式）
  createPlanStream(data, onChunk) {
    return streamRequest('/agent/request/stream', {
      type: 'planner',
      content: data.goal || data.content || '',
      context: {
        currentLevel: data.currentLevel,
        availableTime: data.availableTime,
        preference: data.preference
      },
      knowledgeBaseId: data.knowledgeBaseId || null
    }, onChunk)
  },

  // 调整学习计划
  adjustPlan(feedback, currentPlanContent) {
    return request.post('/agent/request', {
      type: 'planner',
      content: feedback,
      context: { previousPlan: currentPlanContent }
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

  // 创建知识库
  createKnowledgeBase(data) {
    return ragRequest.post('/knowledge-bases', data)
  },

  // 删除知识库
  deleteKnowledgeBase(id) {
    return ragRequest.delete(`/knowledge-bases/${id}`)
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

  // 删除文档
  deleteDocument(id) {
    return ragRequest.delete(`/documents/${id}`)
  },

  // 获取统计
  getStats() {
    return ragRequest.get('/stats')
  },

  // 缓存统计
  getCacheStats() {
    return ragRequest.get('/cache/stats')
  },

  // 清除缓存
  clearCache() {
    return ragRequest.post('/cache/clear')
  },

  // 优化索引
  optimize() {
    return ragRequest.post('/optimize')
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

  // 讲解知识点（流式 - 使用新的流式端点）
  teachStream(data, onChunk) {
    return streamRequest('/agent/request/stream', {
      type: 'tutor',
      content: data.topic || data.content,
      level: data.level,
      knowledgeBaseId: data.knowledgeBaseId || null
    }, onChunk)
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

  // 解答问题（流式）- 使用新的流式端点
  answerStream(data, onChunk) {
    return streamRequest('/agent/request/stream', {
      type: 'helper',
      content: data.question || data.content || '',
      messageType: data.messageType,
      imageUrl: data.imageUrl
    }, onChunk)
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
      type: 'evaluator',
      ...data
    })
  },

  // 评估作业（流式）
  evaluateStream(data, onChunk) {
    return streamRequest('/agent/request/stream', {
      type: 'evaluator',
      content: `题目：${data.question || ''}\n学生答案：${data.studentAnswer || ''}`,
      knowledgeBaseId: data.knowledgeBaseId || null
    }, onChunk)
  },

  // 生成学习报告
  generateReport(userId, learningData) {
    return request.post('/agent/request', {
      type: 'evaluator',
      userId,
      content: '生成学习报告',
      context: learningData
    })
  },

  // 生成学习报告（流式）
  generateReportStream(data, onChunk) {
    return streamRequest('/agent/request/stream', { type: 'evaluator', ...data }, onChunk)
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
  },

  // 课程管理
  getCourses: (page = 1, size = 20) => request.get(`/admin/courses?page=${page - 1}&size=${size}`),
  getCourse: (id) => request.get(`/admin/courses/${id}`),
  createCourse: (data) => request.post('/admin/courses', data),
  updateCourse: (id, data) => request.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => request.delete(`/admin/courses/${id}`),

  // 知识点管理
  getKnowledgePoints: (page = 1, size = 20) => request.get(`/admin/knowledge-points?page=${page - 1}&size=${size}`),
  getKnowledgePoint: (id) => request.get(`/admin/knowledge-points/${id}`),
  createKnowledgePoint: (data) => request.post('/admin/knowledge-points', data),
  updateKnowledgePoint: (id, data) => request.put(`/admin/knowledge-points/${id}`, data),
  deleteKnowledgePoint: (id) => request.delete(`/admin/knowledge-points/${id}`),

  // 练习题库
  getExercises: (page = 1, size = 20) => request.get(`/admin/exercises?page=${page - 1}&size=${size}`),
  getExercise: (id) => request.get(`/admin/exercises/${id}`),
  createExercise: (data) => request.post('/admin/exercises', data),
  updateExercise: (id, data) => request.put(`/admin/exercises/${id}`, data),
  deleteExercise: (id) => request.delete(`/admin/exercises/${id}`),

  // 学习笔记
  getAdminNotes: (page = 1, size = 20) => request.get(`/admin/notes?page=${page - 1}&size=${size}`),
  getNote: (id) => request.get(`/admin/notes/${id}`),
  createNote: (data) => request.post('/admin/notes', data),
  updateNote: (id, data) => request.put(`/admin/notes/${id}`, data),
  deleteNote: (id) => request.delete(`/admin/notes/${id}`),

  // 错题本
  getWrongQuestions: (page = 1, size = 20) => request.get(`/admin/wrong-questions?page=${page - 1}&size=${size}`),
  getWrongQuestion: (id) => request.get(`/admin/wrong-questions/${id}`),
  createWrongQuestion: (data) => request.post('/admin/wrong-questions', data),
  updateWrongQuestion: (id, data) => request.put(`/admin/wrong-questions/${id}`, data),
  deleteWrongQuestion: (id) => request.delete(`/admin/wrong-questions/${id}`),

  // 学习计划
  getStudyPlans: (page = 1, size = 20) => request.get(`/admin/study-plans?page=${page - 1}&size=${size}`),
  getStudyPlan: (id) => request.get(`/admin/study-plans/${id}`),
  createStudyPlan: (data) => request.post('/admin/study-plans', data),
  updateStudyPlan: (id, data) => request.put(`/admin/study-plans/${id}`, data),
  deleteStudyPlan: (id) => request.delete(`/admin/study-plans/${id}`),

  // 对话记录
  getConversations: (page = 1, size = 20) => request.get(`/admin/conversations?page=${page - 1}&size=${size}`),
  getConversation: (id) => request.get(`/admin/conversations/${id}`),
  createConversation: (data) => request.post('/admin/conversations', data),
  updateConversation: (id, data) => request.put(`/admin/conversations/${id}`, data),
  deleteConversation: (id) => request.delete(`/admin/conversations/${id}`),

  // 社区帖子
  getCommunityPosts: (page = 1, size = 20) => request.get(`/admin/community-posts?page=${page - 1}&size=${size}`),
  getCommunityPost: (id) => request.get(`/admin/community-posts/${id}`),
  createCommunityPost: (data) => request.post('/admin/community-posts', data),
  updateCommunityPost: (id, data) => request.put(`/admin/community-posts/${id}`, data),
  deleteCommunityPost: (id) => request.delete(`/admin/community-posts/${id}`),

  // 成就管理
  getAchievements: (page = 1, size = 20) => request.get(`/admin/achievements?page=${page - 1}&size=${size}`),
  getAchievement: (id) => request.get(`/admin/achievements/${id}`),
  createAchievement: (data) => request.post('/admin/achievements', data),
  updateAchievement: (id, data) => request.put(`/admin/achievements/${id}`, data),
  deleteAchievement: (id) => request.delete(`/admin/achievements/${id}`),

  // 学习会话
  getSessions: (page = 1, size = 20) => request.get(`/admin/sessions?page=${page - 1}&size=${size}`),
  getSession: (id) => request.get(`/admin/sessions/${id}`),
  deleteSession: (id) => request.delete(`/admin/sessions/${id}`)
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
  },
  getCourses() {
    return request.get('/knowledge/courses')
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
    return request.get('/exercises/random', { params: { count: data?.count || 10 } })
  },
  submit(data) {
    return request.post('/exercises/submit', data)
  },
  getRandom(count = 10) {
    return request.get('/exercises/random', { params: { count } })
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
 * 知识图谱与高级功能 API
 */
export const knowledgeGraphApi = {
  extractKnowledgePoints(data) {
    return request.post('/knowledge-advanced/extract', data)
  },
  getKnowledgeTree(courseId, userId = null) {
    const params = userId ? { userId } : {}
    return request.get(`/knowledge-advanced/tree/${courseId}`, { params })
  },
  getKnowledgeGraph(courseId, userId = null) {
    const params = userId ? { userId } : {}
    return request.get(`/knowledge-advanced/graph/${courseId}`, { params })
  },
  getLearningPath(courseId, targetPointId) {
    return request.get(`/knowledge-advanced/learning-path/${courseId}/${targetPointId}`)
  },
  recommendKnowledgePoints(courseId, data = {}) {
    return request.post(`/knowledge-advanced/recommend/${courseId}`, data)
  },
  getLearningOrder(courseId) {
    return request.get(`/knowledge-advanced/learning-order/${courseId}`)
  },
  evaluateMastery(knowledgePointId) {
    return request.post(`/knowledge-advanced/evaluate/${knowledgePointId}`)
  },
  evaluateCourseMastery(courseId) {
    return request.post(`/knowledge-advanced/evaluate/batch/${courseId}`)
  },
  importFile(courseId, formData) {
    return request.post(`/knowledge-advanced/import/${courseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  importText(courseId, data) {
    return request.post(`/knowledge-advanced/import-text/${courseId}`, data)
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

/**
 * 历史记录 API
 */
export const historyApi = {
  // 学习规划历史
  getPlannerHistory(page = 0, size = 10, filters = {}) {
    return request.get('/learning/history/planner', { params: { page, size, ...filters } })
  },
  savePlannerHistory(data) {
    return request.post('/learning/history/planner', data)
  },

  // 答疑历史
  getHelperHistory(page = 0, size = 10, filters = {}) {
    return request.get('/learning/history/helper', { params: { page, size, ...filters } })
  },

  // 教学历史
  getTutorHistory(page = 0, size = 10, filters = {}) {
    return request.get('/learning/history/tutor', { params: { page, size, ...filters } })
  },

  // 评估历史
  getEvaluatorHistory(page = 0, size = 10, filters = {}) {
    return request.get('/learning/history/evaluator', { params: { page, size, ...filters } })
  },

  // 对战历史
  getBattleHistory(page = 0, size = 10, filters = {}) {
    return request.get('/learning/history/battle', { params: { page, size, ...filters } })
  },
  saveBattleRecord(data) {
    return request.post('/learning/history/battle', data)
  },

  // 保存对话（答疑/教学/评估通用）
  saveConversation(agentType, topic, messages) {
    return request.post('/learning/history/conversation', {
      agentType,
      topic,
      messages: typeof messages === 'string' ? messages : JSON.stringify(messages)
    })
  }
}

export const notificationApi = {
  getPending() {
    return request.get('/notifications/pending')
  },
  markAsRead(id) {
    return request.post(`/notifications/${id}/read`)
  }
}

export const communityApi = {
  getPosts(params) {
    return request.get('/community/posts', { params })
  },
  createPost(data) {
    return request.post('/community/posts', data)
  },
  getPost(id) {
    return request.get(`/community/posts/${id}`)
  },
  addComment(postId, data) {
    return request.post(`/community/posts/${postId}/comments`, data)
  },
  getComments(postId) {
    return request.get(`/community/posts/${postId}/comments`)
  },
  likePost(id) {
    return request.post(`/community/posts/${id}/like`)
  },
  getGroups() {
    return request.get('/community/groups')
  },
  createGroup(data) {
    return request.post('/community/groups', data)
  },
  joinGroup(id) {
    return request.post(`/community/groups/${id}/join`)
  }
}

export const exportApi = {
  exportExcel() {
    return request.get('/export/excel', { responseType: 'blob' })
  },
  exportCSV(type) {
    return request.get(`/export/csv/${type}`, { responseType: 'blob' })
  }
}

export const wrongQuestionsApiExt = {
  analyze(id) {
    return request.post(`/wrong-questions/${id}/analyze`)
  },
  batchAnalyze(ids) {
    return request.post('/wrong-questions/batch-analyze', { wrongQuestionIds: ids })
  },
  getStatistics() {
    return request.get('/wrong-questions/statistics')
  }
}

export const notesApiExt = {
  getPublic(params) {
    return request.get('/notes/public', { params })
  },
  addComment(noteId, data) {
    return request.post(`/notes/${noteId}/comments`, data)
  },
  getComments(noteId) {
    return request.get(`/notes/${noteId}/comments`)
  },
  like(id) {
    return request.post(`/notes/${id}/like`)
  }
}

/**
 * 学习反馈 API
 */
export const feedbackApi = {
  submit(data) {
    return request.post('/feedbacks', data)
  },
  getList() {
    return request.get('/feedbacks')
  },
  adjustPlan(planId) {
    return request.post('/feedbacks/adjust-plan', { planId })
  }
}

/**
 * 复习计划 API
 */
export const reviewApi = {
  create(data) {
    return request.post('/reviews', data)
  },
  generateFromProgress() {
    return request.post('/reviews/generate-from-progress')
  },
  getList(status) {
    return request.get('/reviews', { params: { status } })
  },
  getDueReviews() {
    return request.get('/reviews/due')
  },
  completeReview(id, quality) {
    return request.post(`/reviews/${id}/review`, { quality })
  },
  delete(id) {
    return request.delete(`/reviews/${id}`)
  }
}

/**
 * 自定义题库 API
 */
export const exerciseTemplateApi = {
  create(data) {
    return request.post('/exercises/templates', data)
  },
  getList() {
    return request.get('/exercises/templates')
  },
  getById(id) {
    return request.get(`/exercises/templates/${id}`)
  },
  update(id, data) {
    return request.put(`/exercises/templates/${id}`, data)
  },
  delete(id) {
    return request.delete(`/exercises/templates/${id}`)
  },
  generateFromTemplate(templateId) {
    return request.post('/exercises/generate-from-template', { templateId })
  },
  submitAnswer(data) {
    return request.post('/exercises/submit', data)
  }
}

/**
 * 学习路径 API
 */
export const learningPathApi = {
  create(data) {
    return request.post('/learning-paths', data)
  },
  getList() {
    return request.get('/learning-paths')
  },
  getById(id) {
    return request.get(`/learning-paths/${id}`)
  },
  update(id, data) {
    return request.put(`/learning-paths/${id}`, data)
  },
  delete(id) {
    return request.delete(`/learning-paths/${id}`)
  },
  recommend(targetKnowledgePointIds) {
    return request.post('/learning-paths/recommend', { targetKnowledgePointIds })
  }
}

/**
 * 学习分析 API
 */
export const analyticsApi = {
  getOverview() {
    return request.get('/analytics/overview')
  },
  getTrend(days = 30) {
    return request.get('/analytics/trend', { params: { days } })
  },
  getMasteryDistribution() {
    return request.get('/analytics/mastery-distribution')
  },
  getExerciseStats() {
    return request.get('/analytics/exercise-stats')
  },
  getWeakPointsTrend() {
    return request.get('/analytics/weak-points-trend')
  },
  getGrowthCurve() {
    return request.get('/analytics/growth-curve')
  }
}

// 学习会话 API（StudyCoordinator）
export const studyApi = {
  start(data) {
    return request.post('/study/start', data)
  },
  switchMode(data) {
    return request.post('/study/mode', data)
  },
  submitInput(data) {
    return request.post('/study/input', data)
  },
  submitExerciseFeedback(data) {
    return request.post('/study/exercise-feedback', data)
  },
  getSession() {
    return request.get('/study/session')
  },
  endSession() {
    return request.post('/study/end')
  },
  evalCorrect(data) {
    return request.post('/study/eval-correct', data)
  }
}

// 语音识别 API
export const speechApi = {
  transcribe(audioFile) {
    const formData = new FormData()
    formData.append('audio', audioFile)
    return request.post('/speech/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  transcribeUrl(audioUrl) {
    return request.post('/speech/transcribe-url', { audioUrl })
  },
  getCacheStats() {
    return request.get('/speech/cache/stats')
  },
  clearCache() {
    return request.post('/speech/cache/clear')
  }
}

// OCR 文字识别 API
export const ocrApi = {
  recognize(imageFile) {
    const formData = new FormData()
    formData.append('image', imageFile)
    return request.post('/ocr/recognize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  recognizeUrl(imageUrl) {
    return request.post('/ocr/recognize-url', { imageUrl })
  },
  getCacheStats() {
    return request.get('/ocr/cache/stats')
  },
  clearCache() {
    return request.post('/ocr/cache/clear')
  }
}

// 知识提取 API
export const knowledgeExtractApi = {
  extract(data) {
    return request.post('/knowledge-extract/extract', data)
  },
  extractFromHistory(data) {
    return request.post('/knowledge-extract/extract-from-history', data)
  },
  schedule(data) {
    return request.post('/knowledge-extract/schedule', data)
  },
  getQueueStatus() {
    return request.get('/knowledge-extract/queue/status')
  },
  getStats() {
    return request.get('/knowledge-extract/stats')
  },
  extractBatch(data) {
    return request.post('/knowledge-extract/extract-batch', data)
  }
}
