import { exerciseModel } from '../../models/index.js'

export const generateExercises = {
  name: 'generate_exercises',
  definition: {
    description: '生成练习题并保存到数据库',
    input_schema: {
      type: 'object',
      properties: {
        courseId: { type: 'integer', description: '课程ID' },
        knowledgePointId: { type: 'integer', description: '知识点ID' },
        question: { type: 'string', description: '题目内容' },
        answer: { type: 'string', description: '正确答案' },
        explanation: { type: 'string', description: '解析' },
        difficulty: { type: 'integer', description: '难度（1-5）', default: 1 },
        questionType: { type: 'string', description: '题型', default: 'choice' },
        options: { type: 'string', description: '选项（JSON字符串）' }
      },
      required: ['question', 'answer']
    }
  },
  handler: async (params) => {
    const result = exerciseModel.create(
      params.courseId || null,
      params.knowledgePointId || null,
      params.question,
      params.answer,
      params.explanation || '',
      params.difficulty || 1,
      params.questionType || 'choice',
      params.options ? JSON.stringify(params.options) : null
    )
    return { success: true, exerciseId: result.lastInsertRowid }
  }
}
