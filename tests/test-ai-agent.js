import fetch from 'node-fetch'

async function testAIAgent() {
  console.log('测试 AI Agent 接口...\n')
  
  const requestData = {
    message: '你好，请用一句话解释什么是人工智能',
    mode: 'question'
  }
  
  console.log('发送请求到: http://localhost:8081/api/agent/request')
  console.log('请求数据:', JSON.stringify(requestData, null, 2))
  console.log()
  
  try {
    const response = await fetch('http://localhost:8081/api/agent/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    
    console.log('HTTP 状态码:', response.status)
    console.log()
    
    const data = await response.json()
    console.log('响应数据:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('\n✅ AI Agent 测试成功！')
    } else {
      console.log('\n❌ AI Agent 测试失败:', data.message || data.error)
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
  }
}

testAIAgent()
