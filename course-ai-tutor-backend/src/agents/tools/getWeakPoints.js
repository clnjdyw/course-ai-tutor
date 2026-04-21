import { userProgressModel, wrongQuestionModel, knowledgePointModel } from '../../models/index.js'

export const getWeakPoints = {
  name: 'get_weak_points',
  definition: {
    description: '分析用户薄弱知识点，返回掌握度低和错题多的知识点',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'integer', description: '用户ID' },
        threshold: { type: 'number', description: '薄弱阈值（掌握度低于此值）', default: 0.6 }
      },
      required: ['userId']
    }
  },
  handler: async (params, userId) => {
    const threshold = params.threshold ?? 0.6
    // 获取所有进度，筛选低掌握度
    const progress = userProgressModel.findByUserId(userId)
    const weakProgress = progress.filter(p => p.mastery_level < threshold)

    // 获取错题，统计每个知识点的错误次数
    const wrongQuestions = wrongQuestionModel.findByUserId(userId, 200)
    const kpErrorCount = {}
    for (const q of wrongQuestions) {
      const kpId = q.knowledge_point_id
      if (kpId) {
        kpErrorCount[kpId] = (kpErrorCount[kpId] || 0) + 1
      }
    }

    // 合并薄弱知识点详情
    const weakIds = new Set(weakProgress.map(p => p.knowledge_point_id))
    const errorKpIds = Object.keys(kpErrorCount).map(Number)
    const allWeakKpIds = [...new Set([...weakIds, ...errorKpIds])]

    // 批量查询知识点详情（替代 N+1 循环）
    const kps = knowledgePointModel.findByIds(allWeakKpIds)
    const kpMap = {}
    for (const kp of kps) {
      kpMap[kp.id] = kp
    }

    const weakPoints = []
    for (const kpId of allWeakKpIds) {
      const kp = kpMap[kpId]
      if (!kp) continue
      const prog = weakProgress.find(p => p.knowledge_point_id === kpId)
      weakPoints.push({
        id: kpId,
        title: kp.title,
        difficulty: kp.difficulty,
        masteryLevel: prog ? prog.mastery_level : null,
        errorCount: kpErrorCount[kpId] || 0,
        description: kp.description
      })
    }

    // 按薄弱程度排序
    weakPoints.sort((a, b) => (a.masteryLevel || 1) - (b.masteryLevel || 1))

    return { success: true, weakPoints, count: weakPoints.length }
  }
}
