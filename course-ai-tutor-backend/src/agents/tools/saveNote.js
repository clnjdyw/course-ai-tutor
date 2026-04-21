import { noteModel } from '../../models/index.js'

export const saveNote = {
  name: 'save_note',
  definition: {
    description: '保存或更新学习笔记',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'integer', description: '用户ID' },
        courseId: { type: 'integer', description: '课程ID（可选）' },
        knowledgePointId: { type: 'integer', description: '知识点ID（可选）' },
        title: { type: 'string', description: '笔记标题' },
        content: { type: 'string', description: '笔记内容' },
        tags: { type: 'string', description: '标签（逗号分隔）' },
        isPublic: { type: 'boolean', description: '是否公开', default: false }
      },
      required: ['userId', 'title', 'content']
    }
  },
  handler: async (params, userId) => {
    const result = noteModel.create(
      params.userId,
      params.courseId || null,
      params.knowledgePointId || null,
      params.title,
      params.content,
      params.tags || '',
      params.isPublic || false
    )
    return { success: true, noteId: result.lastInsertRowid }
  }
}
