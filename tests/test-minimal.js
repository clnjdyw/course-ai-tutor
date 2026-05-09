// 最简单的测试 - 直接看错误
async function test() {
  try {
    // 注册
    const r = await fetch('http://localhost:8081/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser123',
        email: 'test123@test.com',
        password: '123456'
      })
    })
    const rd = await r.json()
    console.log('注册:', rd)
    
    const token = rd.data.token
    
    // GET /me
    const g = await fetch('http://localhost:8081/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const gd = await g.json()
    console.log('\nGET /me:', gd)
    
    // PUT /me - 只更新 bio
    const p = await fetch('http://localhost:8081/api/auth/me', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bio: 'test' })
    })
    console.log('\nPUT /me 状态:', p.status)
    const pd = await p.json()
    console.log('PUT /me 响应:', pd)
    
  } catch (error) {
    console.error('错误:', error)
  }
}

test()
