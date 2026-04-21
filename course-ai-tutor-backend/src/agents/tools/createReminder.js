import { learningReminderModel } from '../../models/index.js'

export const createReminder = {
  name: 'create_reminder',
  definition: {
    description: '创建学习提醒',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'integer', description: '用户ID' },
        title: { type: 'string', description: '提醒标题' },
        content: { type: 'string', description: '提醒内容' },
        reminderTime: { type: 'string', description: '提醒时间（ISO格式）' },
        reminderType: { type: 'string', description: '提醒类型', default: 'study', enum: ['study', 'review', 'exercise', 'exam'] }
      },
      required: ['userId', 'title', 'reminderTime']
    }
  },
  handler: async (params, userId) => {
    const result = learningReminderModel.create(
      params.userId,
      params.title,
      params.content || '',
      params.reminderTime,
      params.reminderType || 'study'
    )
    return { success: true, reminderId: result.lastInsertRowid }
  }
}
