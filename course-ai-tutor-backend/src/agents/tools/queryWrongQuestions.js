import { wrongQuestionModel } from '../../models/index.js'

export const queryWrongQuestions = {
  name: 'query_wrong_questions',
  definition: {
    description: '查询用户的错题列表，包含错误答案和正确答案',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'integer', description: '用户ID' },
        limit: { type: 'integer', description: '返回数量', default: 20 },
        unmastered: { type: 'boolean', description: '是否只返回未掌握的', default: false }
      },
      required: ['userId']
    }
  },
  handler: async (params, userId) => {
    const limit = params.limit || 20
    let questions
    if (params.unmastered) {
      questions = wrongQuestionModel.getUnmastered(userId)
    } else {
      questions = wrongQuestionModel.findByUserId(userId, limit)
    }
    return { success: true, questions, count: questions.length }
  }
}
