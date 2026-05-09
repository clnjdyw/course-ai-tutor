// 简单测试 - 调试更新失败问题
const API_BASE = 'http://localhost:8081/api'

async function test() {
  console.log('测试更新用户信息...\n')

  // 先注册一个用户
  const registerRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `test_${Date.now()}`,
      email: `test_${Date.now()}@test.com`,
      password: '123456'
    })
  })
  const registerData = await registerRes.json()
  console.log('注册:', registerData)
  
  const token = registerData.data.token
  
  // 尝试更新
  console.log('\n尝试更新...')
  try {
    const updateRes = await fetch(`${API_BASE}/auth/me`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        learningGoal: '测试目标',
        subjectPreferences: ['编程', '数学']
      })
    })
    
    console.log('响应状态:', updateRes.status)
    const updateData = await updateRes.json()
    console.log('响应数据:', JSON.stringify(updateData, null, 2))
  } catch (error) {
    console.error('错误:', error)
  }
}

test()
