import { knowledgePointModel } from '../../models/index.js'

export const queryKnowledgePoints = {
  name: 'query_knowledge_points',
  definition: {
    description: '查询知识点信息，可获取知识点详情、列表或关联关系',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: '知识点ID（可选，指定则返回详情）' },
        courseId: { type: 'integer', description: '课程ID（可选）' },
        difficulty: { type: 'integer', description: '难度筛选（1-5）', minimum: 1, maximum: 5 },
        limit: { type: 'integer', description: '返回数量', default: 50 }
      }
    }
  },
  handler: async (params) => {
    if (params.id) {
      const kp = knowledgePointModel.findById(params.id)
      return { success: true, knowledgePoint: kp, found: !!kp }
    }
    if (params.courseId) {
      const list = knowledgePointModel.findByCourseId(params.courseId)
      return { success: true, knowledgePoints: list, count: list.length }
    }
    const list = knowledgePointModel.findAll(params.limit || 50)
    const filtered = params.difficulty ? list.filter(k => k.difficulty === params.difficulty) : list
    return { success: true, knowledgePoints: filtered, count: filtered.length }
  }
}
