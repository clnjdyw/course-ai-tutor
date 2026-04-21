import { userProgressModel } from '../../models/index.js'

export const updateProgress = {
  name: 'update_progress',
  definition: {
    description: '更新用户对某个知识点的掌握度',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'integer', description: '用户ID' },
        knowledgePointId: { type: 'integer', description: '知识点ID' },
        masteryLevel: { type: 'number', description: '掌握度（0-1）', minimum: 0, maximum: 1 }
      },
      required: ['userId', 'knowledgePointId', 'masteryLevel']
    }
  },
  handler: async (params, userId) => {
    userProgressModel.upsert(userId, params.knowledgePointId, params.masteryLevel)
    return { success: true, message: '掌握度已更新' }
  }
}
