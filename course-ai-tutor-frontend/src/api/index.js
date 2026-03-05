import request from './request'

/**
 * 规划智能体 API
 */
export const plannerApi = {
  // 创建学习计划
  createPlan(data) {
    return request.post('/planner/plan', data)
  },
  
  // 调整学习计划
  adjustPlan(planId, feedback) {
    return request.put(`/planner/plan/${planId}`, feedback, {
      headers: { 'Content-Type': 'text/plain' }
    })
  },
  
  // 获取智能体信息
  getInfo() {
    return request.get('/planner/info')
  }
}

/**
 * 教学智能体 API
 */
export const tutorApi = {
  // 讲解知识点
  teach(data) {
    return request.post('/tutor/teach', data)
  },
  
  // 解答疑问
  answerQuestion(params) {
    return request.post('/tutor/answer', null, { params })
  },
  
  // 获取智能体信息
  getInfo() {
    return request.get('/tutor/info')
  }
}

/**
 * 答疑智能体 API
 */
export const helperApi = {
  // 解答问题
  answer(data) {
    return request.post('/helper/answer', data)
  },
  
  // 代码调试
  debugCode(params) {
    return request.post('/helper/debug', null, { params })
  },
  
  // 获取智能体信息
  getInfo() {
    return request.get('/helper/info')
  }
}

/**
 * 评估智能体 API
 */
export const evaluatorApi = {
  // 评估作业
  evaluate(data) {
    return request.post('/evaluator/evaluate', data)
  },
  
  // 生成学习报告
  generateReport(params, data) {
    return request.post('/evaluator/report', data, { params })
  },
  
  // 获取智能体信息
  getInfo() {
    return request.get('/evaluator/info')
  }
}
