import request, { ragRequest } from './request'

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
  // 讲解知识点
  teach(data) {
    return request.post('/agent/request', {
      type: 'teach',
      ...data
    })
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
  
  // 代码调试
  debugCode(userId, code, errorMessage = '') {
    return request.post('/agent/request', {
      type: 'help',
      userId,
      content: `代码调试：${code}`,
      context: `错误信息：${errorMessage}`
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
  
  // 生成学习报告
  generateReport(userId, learningData) {
    return request.post('/agent/request', {
      type: 'evaluate',
      userId,
      content: '生成学习报告',
      context: learningData
    })
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
