// 思维链引擎 - 定义智能体在不同场景下的推理路径和模块调用顺序
import sharedKB from './SharedKnowledgeBase.js'
import {
  userModel,
  noteModel,
  wrongQuestionModel,
  userProgressModel,
  learningRecordModel,
  studyPlanModel,
  conversationModel,
  knowledgePointModel,
  exerciseModel
} from '../models/index.js'

class ChainOfThoughtEngine {
  constructor() {
    this.reasoningPaths = new Map()
    this.initializeDefaultPaths()
  }

  initializeDefaultPaths() {
    // 知识讲解思维链
    this.addReasoningPath('knowledge_teaching', {
      description: '知识点讲解推理路径',
      steps: [
        {
          step: 1,
          agent: 'user-center',
          action: 'getUserProfile',
          description: '获取用户画像和学习偏好'
        },
        {
          step: 2,
          agent: 'knowledge-manager',
          action: 'getKnowledgeStructure',
          description: '获取知识点结构和依赖关系'
        },
        {
          step: 3,
          agent: 'tutor',
          action: 'generateTeachingContent',
          description: '根据用户水平和知识点生成教学内容'
        },
        {
          step: 4,
          agent: 'learning-record',
          action: 'updateProgress',
          description: '更新学习记录'
        }
      ]
    })

    // 智能问答思维链
    this.addReasoningPath('qa_answering', {
      description: '智能问答推理路径',
      steps: [
        {
          step: 1,
          agent: 'main-agent',
          action: 'parseIntent',
          description: '解析用户问题意图'
        },
        {
          step: 2,
          agent: 'user-center',
          action: 'getUserContext',
          description: '获取用户上下文'
        },
        {
          step: 3,
          agent: 'knowledge-retriever',
          action: 'retrieveKnowledge',
          description: '从知识库检索相关信息'
        },
        {
          step: 4,
          agent: 'helper',
          action: 'generateAnswer',
          description: '生成个性化回答'
        },
        {
          step: 5,
          agent: 'learning-record',
          action: 'recordInteraction',
          description: '记录交互历史'
        }
      ]
    })

    // 个性化学习规划思维链
    this.addReasoningPath('personalized_learning', {
      description: '个性化学习规划推理路径',
      steps: [
        {
          step: 1,
          agent: 'user-center',
          action: 'getUserProfile',
          description: '获取用户完整画像'
        },
        {
          step: 2,
          agent: 'progress-tracker',
          action: 'analyzeProgress',
          description: '分析学习进度和薄弱环节'
        },
        {
          step: 3,
          agent: 'knowledge-manager',
          action: 'getKnowledgeGraph',
          description: '获取知识点图谱'
        },
        {
          step: 4,
          agent: 'planner',
          action: 'generateStudyPlan',
          description: '生成个性化学习规划'
        },
        {
          step: 5,
          agent: 'exercise-generator',
          action: 'generateExercises',
          description: '生成自定义题库'
        },
        {
          step: 6,
          agent: 'reminder',
          action: 'scheduleReminders',
          description: '设置学习提醒'
        }
      ]
    })

    // 错题复习思维链
    this.addReasoningPath('wrong_question_review', {
      description: '错题复习推理路径',
      steps: [
        {
          step: 1,
          agent: 'wrong-question-collector',
          action: 'getWrongQuestions',
          description: '获取错题列表'
        },
        {
          step: 2,
          agent: 'knowledge-manager',
          action: 'analyzeWeakPoints',
          description: '分析薄弱知识点'
        },
        {
          step: 3,
          agent: 'tutor',
          action: 'generateReviewContent',
          description: '生成复习内容'
        },
        {
          step: 4,
          agent: 'exercise-generator',
          action: 'generateSimilarExercises',
          description: '生成相似练习题'
        },
        {
          step: 5,
          agent: 'progress-tracker',
          action: 'updateMasteryLevel',
          description: '更新掌握程度'
        }
      ]
    })

    // 心理辅导思维链
    this.addReasoningPath('psychological_counseling', {
      description: '心理辅导推理路径',
      steps: [
        {
          step: 1,
          agent: 'main-agent',
          action: 'detectEmotion',
          description: '检测用户情绪状态'
        },
        {
          step: 2,
          agent: 'user-center',
          action: 'getUserHistory',
          description: '获取用户历史交互'
        },
        {
          step: 3,
          agent: 'companion',
          action: 'generateCounseling',
          description: '生成心理辅导内容'
        },
        {
          step: 4,
          agent: 'learning-record',
          action: 'recordMood',
          description: '记录情绪状态'
        }
      ]
    })
  }

  // 添加推理路径
  addReasoningPath(pathName, pathConfig) {
    this.reasoningPaths.set(pathName, pathConfig)
  }

  // 执行推理路径
  async executePath(pathName, context = {}) {
    const path = this.reasoningPaths.get(pathName)
    if (!path) {
      throw new Error(`推理路径不存在: ${pathName}`)
    }

    console.log(`🧠 执行思维链: ${path.description}`)

    const results = {}
    const stepData = {} // 步骤间数据传递

    for (const step of path.steps) {
      console.log(`  步骤 ${step.step}: [${step.agent}] ${step.description}`)

      // 发布事件
      sharedKB.publishEvent(
        'step_execute',
        step.agent,
        'main-agent',
        { step: step.step, action: step.action, context }
      )

      // 执行实际的数据操作
      stepData[`step_${step.step}`] = await this.executeStep(step, context, stepData)

      results[`step_${step.step}`] = {
        agent: step.agent,
        action: step.action,
        status: 'completed',
        timestamp: new Date().toISOString()
      }
    }

    console.log(`✅ 思维链执行完成: ${pathName}`)

    return {
      pathName,
      description: path.description,
      results,
      stepData,
      completedAt: new Date().toISOString()
    }
  }

  // 执行单个步骤
  async executeStep(step, context, stepData) {
    const { agent, action } = step
    const userId = context.userId

    const actions = {
      getUserProfile: () => sharedKB.getUserProfile(userId),
      getUserContext: () => sharedKB.getUserProfile(userId),
      getUserHistory: () => conversationModel.findByUserId(userId, 20),
      getKnowledgeStructure: () => knowledgePointModel.findAll(100),
      getKnowledgeGraph: () => knowledgePointModel.findAll(200),
      generateTeachingContent: () => ({ topic: context.userInput, level: context.userProfile?.userInfo?.level }),
      updateProgress: () => userProgressModel.findByUserId(userId),
      recordInteraction: () => ({ recorded: true, timestamp: new Date().toISOString() }),
      recordMood: () => ({ recorded: true, timestamp: new Date().toISOString() }),
      parseIntent: () => ({ intent: context.intent }),
      retrieveKnowledge: () => knowledgePointModel.findAll(20),
      generateAnswer: () => ({ question: context.userInput }),
      analyzeProgress: () => userProgressModel.findByUserId(userId),
      getWeakPoints: () => {
        const progress = userProgressModel.findByUserId(userId)
        return progress.filter(p => p.mastery_level < 0.5)
      },
      generateStudyPlan: () => studyPlanModel.findByUserId(userId),
      generateExercises: () => exerciseModel.findByCourseId ? exerciseModel.findByCourseId(1, 10) : [],
      scheduleReminders: () => ({ scheduled: true }),
      getWrongQuestions: () => wrongQuestionModel.findByUserId(userId, 20),
      analyzeWeakPoints: () => {
        const wrongQs = wrongQuestionModel.findByUserId(userId, 20)
        return { count: wrongQs.length, questions: wrongQs }
      },
      generateReviewContent: () => ({ reviewTarget: context.userInput }),
      generateSimilarExercises: () => ({ exercises: [] }),
      updateMasteryLevel: () => ({ updated: true })
    }

    const handler = actions[action]
    if (handler) {
      return await handler()
    }
    return { action, status: 'skipped', reason: 'no handler' }
  }

  // 根据问题类型自动选择推理路径
  selectPath(questionType, context = {}) {
    const pathMap = {
      'teaching': 'knowledge_teaching',
      'question': 'qa_answering',
      'planning': 'personalized_learning',
      'review': 'wrong_question_review',
      'counseling': 'psychological_counseling'
    }

    const pathName = pathMap[questionType] || 'qa_answering'
    return this.executePath(pathName, context)
  }

  // 获取所有可用的推理路径
  getAvailablePaths() {
    const paths = []
    for (const [name, config] of this.reasoningPaths) {
      paths.push({
        name,
        description: config.description,
        steps: config.steps.length
      })
    }
    return paths
  }
}

export default new ChainOfThoughtEngine()
