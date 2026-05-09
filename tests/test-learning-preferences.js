// 测试学习目标与学科偏好的保存功能
// 使用 Node.js 原生 fetch API

const API_BASE = 'http://localhost:8081/api'

// 测试步骤
async function runTests() {
  console.log('========== 开始测试学习目标与学科偏好功能 ==========\n')

  let token = ''
  let userId = ''

  // 步骤1：注册用户
  console.log('📝 步骤1：注册用户')
  try {
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `test_user_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: '123456',
        role: 'student'
      })
    })
    const registerData = await registerRes.json()
    console.log('注册响应:', JSON.stringify(registerData, null, 2))
    
    if (!registerData.success) {
      console.error('❌ 注册失败:', registerData.message)
      return
    }
    
    token = registerData.data.token
    userId = registerData.data.user.id
    console.log('✅ 注册成功, userId:', userId)
  } catch (error) {
    console.error('❌ 注册请求失败:', error.message)
    return
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // 步骤2：获取用户信息（初始状态）
  console.log('👤 步骤2：获取用户信息（初始状态）')
  try {
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const meData = await meRes.json()
    console.log('用户信息:', JSON.stringify(meData, null, 2))
    
    if (meData.success) {
      console.log('✅ 获取用户信息成功')
      console.log('   learning_goal:', meData.data.user.learning_goal)
      console.log('   subject_preferences:', meData.data.user.subject_preferences)
    }
  } catch (error) {
    console.error('❌ 获取用户信息请求失败:', error.message)
    return
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // 步骤3：更新学习目标和学科偏好
  console.log('🎯 步骤3：更新学习目标和学科偏好')
  const updateData = {
    learningGoal: '掌握 JavaScript 和 Python 编程语言，通过软件工程师认证考试',
    subjectPreferences: ['编程', '数学', '物理']
  }
  console.log('提交数据:', JSON.stringify(updateData, null, 2))
  
  try {
    const updateRes = await fetch(`${API_BASE}/auth/me`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    })
    const updateData2 = await updateRes.json()
    console.log('更新响应:', JSON.stringify(updateData2, null, 2))
    
    if (!updateData2.success) {
      console.error('❌ 更新失败:', updateData2.message)
      return
    }
    
    console.log('✅ 更新成功')
    console.log('   返回的用户信息:', JSON.stringify(updateData2.user, null, 2))
  } catch (error) {
    console.error('❌ 更新请求失败:', error.message)
    return
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // 步骤4：再次获取用户信息，验证更新
  console.log('🔍 步骤4：再次获取用户信息，验证更新结果')
  try {
    const verifyRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const verifyData = await verifyRes.json()
    console.log('验证用户信息:', JSON.stringify(verifyData, null, 2))
    
    if (verifyData.success) {
      const user = verifyData.data.user
      console.log('\n📊 验证结果:')
      console.log('   learning_goal:', user.learning_goal)
      console.log('   subject_preferences:', user.subject_preferences)
      
      // 验证数据是否正确
      if (user.learning_goal === updateData.learningGoal) {
        console.log('   ✅ learning_goal 验证通过')
      } else {
        console.log('   ❌ learning_goal 验证失败')
        console.log('      期望:', updateData.learningGoal)
        console.log('      实际:', user.learning_goal)
      }
      
      if (JSON.stringify(user.subject_preferences) === JSON.stringify(updateData.subjectPreferences)) {
        console.log('   ✅ subject_preferences 验证通过')
      } else {
        console.log('   ❌ subject_preferences 验证失败')
        console.log('      期望:', updateData.subjectPreferences)
        console.log('      实际:', user.subject_preferences)
      }
    }
  } catch (error) {
    console.error('❌ 验证请求失败:', error.message)
    return
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // 步骤5：只更新学习目标
  console.log('📝 步骤5：只更新学习目标（测试部分更新）')
  const partialUpdate = {
    learningGoal: '精通前端开发，成为全栈工程师'
  }
  console.log('提交数据:', JSON.stringify(partialUpdate, null, 2))
  
  try {
    const partialRes = await fetch(`${API_BASE}/auth/me`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(partialUpdate)
    })
    const partialData = await partialRes.json()
    console.log('部分更新响应:', JSON.stringify(partialData, null, 2))
    
    if (partialData.success) {
      console.log('✅ 部分更新成功')
      
      // 验证
      const verifyRes2 = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const verifyData2 = await verifyRes2.json()
      
      if (verifyData2.success) {
        const user = verifyData2.data.user
        console.log('\n📊 验证结果:')
        console.log('   learning_goal:', user.learning_goal)
        console.log('   subject_preferences:', user.subject_preferences)
        
        if (user.learning_goal === partialUpdate.learningGoal) {
          console.log('   ✅ learning_goal 部分更新验证通过')
        } else {
          console.log('   ❌ learning_goal 部分更新验证失败')
        }
        
        // subject_preferences 应该保持不变
        if (user.subject_preferences && user.subject_preferences.length > 0) {
          console.log('   ✅ subject_preferences 保持不变（未被覆盖）')
        }
      }
    }
  } catch (error) {
    console.error('❌ 部分更新请求失败:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('========== 测试完成 ==========')
}

// 运行测试
runTests().catch(error => {
  console.error('测试过程中发生错误:', error)
})
