// 单元测试 - 验证逻辑是否正确
import { userModel } from './course-ai-tutor-backend/src/models/index.js'

console.log('=== 单元测试：用户模型 ===\n')

// 测试1：findById 是否返回 learning_goal 和 subject_preferences
console.log('测试1: findById 查询字段')
const testUser = { id: 1 }
try {
  const user = userModel.findById(1)
  if (user) {
    console.log('✅ findById 成功')
    console.log('   返回字段:', Object.keys(user))
    console.log('   包含 learning_goal:', 'learning_goal' in user)
    console.log('   包含 subject_preferences:', 'subject_preferences' in user)
  } else {
    console.log('⚠️  用户不存在')
  }
} catch (error) {
  console.error('❌ findById 失败:', error.message)
}

console.log('\n=== 测试完成 ===')
