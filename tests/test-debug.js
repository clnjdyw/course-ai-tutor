// 详细调试测试
const API_BASE = 'http://localhost:8081/api'

async function test() {
  console.log('=== 详细调试测试 ===\n')

  // 先注册
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
  console.log('1. 注册:', registerData.success ? '成功' : '失败')
  
  const token = registerData.data.token
  
  // 获取用户信息
  console.log('\n2. 获取用户信息...')
  const getRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  console.log('   状态:', getRes.status)
  const getData = await getRes.json()
  console.log('   数据:', JSON.stringify(getData, null, 2))
  
  // 尝试更新
  console.log('\n3. 尝试更新...')
  try {
    const updateRes = await fetch(`${API_BASE}/auth/me`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bio: '测试个人简介'
      })
    })
    
    console.log('   响应状态:', updateRes.status)
    const updateData = await updateRes.json()
    console.log('   响应数据:', JSON.stringify(updateData, null, 2))
  } catch (error) {
    console.error('   错误:', error.message)
  }
}

test().catch(e => console.error('测试异常:', e))
