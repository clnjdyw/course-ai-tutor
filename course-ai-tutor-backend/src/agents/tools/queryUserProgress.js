import { userProgressModel, learningRecordModel } from '../../models/index.js'

export const queryUserProgress = {
  name: 'query_user_progress',
  definition: {
    description: '查询用户的学习进度和统计数据',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'integer', description: '用户ID' }
      },
      required: ['userId']
    }
  },
  handler: async (params, userId) => {
    const progress = userProgressModel.findByUserId(userId)
    const stats = learningRecordModel.getStatistics(userId)
    return { success: true, progress, stats }
  }
}
