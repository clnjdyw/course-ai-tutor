// 中枢智能体 - 协调各子智能体，提供完整对话能力
import sharedKB from './SharedKnowledgeBase.js'
import thoughtEngine from './ChainOfThoughtEngine.js'
import { registerAll, getToolNames } from './ToolRegistry.js'
import * as tools from './tools/index.js'
import * as tutorAgent from './sub-agents/tutor.js'
import * as helperAgent from './sub-agents/helper.js'
import * as plannerAgent from './sub-agents/planner.js'
import * as evaluatorAgent from './sub-agents/evaluator.js'
import * as companionAgent from './sub-agents/companion.js'
import studyCoordinator from './StudyCoordinator.js'

class MainAgent {
  constructor() {
    this.name = 'main-agent'
    this.type = 'coordinator'
    this.subAgents = new Map()
    this.initialize()
  }

  initialize() {
    // 注册所有工具
    const toolList = Object.values(tools)
    registerAll(toolList)
    console.log(`🔧 工具已注册: ${getToolNames().join(', ')}`)

    // 注册子智能体
    this.registerSubAgent('tutor', tutorAgent)
    this.registerSubAgent('helper', helperAgent)
    this.registerSubAgent('planner', plannerAgent)
    this.registerSubAgent('evaluator', evaluatorAgent)
    this.registerSubAgent('companion', companionAgent)

    // 注册到共享知识库
    sharedKB.registerAgent(this.name, this.type, {
      description: '中枢智能体，负责意图解析和任务调度',
      capabilities: ['intent_parsing', 'task_dispatching', 'coordination', 'tool_use']
    })

    console.log('🧠 中枢智能体初始化完成')
  }

  // 注册子智能体
  registerSubAgent(name, agent) {
    this.subAgents.set(name, agent)
    console.log(`✅ 子智能体注册: ${name}`)
  }

  // 解析用户意图
  parseIntent(userInput) {
    const input = userInput.toLowerCase()
    const intentPatterns = {
      'teaching': ['讲解', '教学', '学习', '知识点', '概念', '原理'],
      'question': ['问题', '疑问', '为什么', '怎么', '如何', '是什么'],
      'planning': ['规划', '计划', '安排', '进度', '目标'],
      'review': ['复习', '错题', '薄弱', '掌握', '练习'],
      'counseling': ['压力', '焦虑', '困难', '帮助', '鼓励', '心情'],
      'exercise': ['题目', '习题', '测试', '考试', '练习'],
      'note': ['笔记', '记录', '总结']
    }

    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return { type: intent, confidence: 0.9, originalInput: userInput }
      }
    }

    return { type: 'question', confidence: 0.5, originalInput: userInput }
  }

  // 处理用户请求
  async handleRequest(userId, userInput, context = {}) {
    console.log(`📨 中枢智能体收到请求: 用户${userId}`)

    // 0. 检查活跃学习会话，注入会话上下文
    const activeSession = studyCoordinator.getActiveSession(userId)
    if (activeSession) {
      console.log(`📋 检测到活跃会话: ${activeSession.id} (模式: ${activeSession.mode})`)
      context.sessionMode = activeSession.mode
      context.sessionHistory = activeSession.history?.slice(-3) || []
    }

    // 1. 解析意图
    const intent = this.parseIntent(userInput)
    console.log(`🎯 识别意图: ${intent.type} (置信度: ${intent.confidence})`)

    // 2. 选择思维链
    const thoughtPath = await thoughtEngine.selectPath(intent.type, {
      userId, userInput, intent, ...context
    })

    // 3. 调度到子智能体
    const result = await this.dispatchTask(intent.type, {
      userId, userInput, intent, thoughtPath, ...context
    })

    // 4. 更新学习记录
    sharedKB.updateLearningRecord(userId, {
      type: intent.type,
      input: userInput,
      result,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      intent: intent.type,
      thoughtPath: thoughtPath.pathName,
      result,
      sessionId: activeSession?.id || null,
      timestamp: new Date().toISOString()
    }
  }

  // 调度任务到子智能体
  async dispatchTask(taskType, context) {
    const taskMap = {
      'teaching': 'tutor',
      'question': 'helper',
      'planning': 'planner',
      'review': 'evaluator',
      'counseling': 'companion',
      'exercise': 'evaluator',
      'note': 'helper'
    }

    const targetAgent = taskMap[taskType] || 'helper'
    console.log(`🔄 调度任务到子智能体: ${targetAgent}`)

    sharedKB.publishEvent('task_dispatch', this.name, targetAgent, { taskType, context })

    const agent = this.subAgents.get(targetAgent)
    if (agent && agent.execute) {
      const history = context.history || []
      const options = {
        kbContent: context.kbContent || '',
        sessionMode: context.sessionMode || null,
        sessionHistory: context.sessionHistory || [],
        extraContext: context.extraContext || ''
      }
      return await agent.execute(context.userId, context.userInput, history, options)
    }

    return {
      agent: targetAgent,
      status: 'error',
      message: `子智能体 ${targetAgent} 未注册或未实现 execute 方法`
    }
  }

  // 获取智能体状态
  getStatus() {
    return {
      name: this.name,
      type: this.type,
      subAgentsCount: this.subAgents.size,
      subAgents: Array.from(this.subAgents.keys()),
      tools: getToolNames(),
      toolsCount: getToolNames().length,
      availablePaths: thoughtEngine.getAvailablePaths(),
      timestamp: new Date().toISOString()
    }
  }

  // 获取所有注册的智能体
  getRegisteredAgents() {
    return sharedKB.getRegisteredAgents()
  }
}

export default new MainAgent()
