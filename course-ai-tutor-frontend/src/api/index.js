import request from './request'

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
      ...data
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
