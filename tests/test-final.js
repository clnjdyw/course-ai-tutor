// 最终测试 - 检查后端是否运行
async function test() {
  console.log('测试后端服务...\n')
  
  try {
    // 健康检查
    const healthRes = await fetch('http://localhost:8081/api/health')
    console.log('健康检查:', healthRes.status, await healthRes.text())
  } catch (error) {
    console.error('后端未运行:', error.message)
    return
  }

  // 注册
  const registerRes = await fetch('http://localhost:8081/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `test_${Date.now()}`,
      email: `test_${Date.now()}@test.com`,
      password: '123456'
    })
  })
  const registerData = await registerRes.json()
  console.log('\n注册:', registerData)
  
  if (!registerData.success) {
    console.error('注册失败')
    return
  }
  
  const token = registerData.data.token
  
  // 更新用户信息
  console.log('\n尝试更新用户信息...')
  const updateRes = await fetch('http://localhost:8081/api/auth/me', {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      learningGoal: '掌握JavaScript',
      subjectPreferences: ['编程', '数学']
    })
  })
  
  console.log('响应状态:', updateRes.status)
  const updateData = await updateRes.json()
  console.log('响应数据:', JSON.stringify(updateData, null, 2))
  
  if (updateData.success) {
    console.log('\n✅ 更新成功!')
    console.log('learning_goal:', updateData.user.learning_goal)
    console.log('subject_preferences:', updateData.user.subject_preferences)
  } else {
    console.log('\n❌ 更新失败:', updateData.message)
  }
}

test()
