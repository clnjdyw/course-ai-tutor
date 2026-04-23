/**
 * 意图识别与思维链引擎测试脚本
 *
 * 测试目标：
 * 1. 验证不同意图（计划、教学、聊天、答疑、评估）的路由准确性
 * 2. 检查 ChainOfThoughtEngine 是否被正确触发
 * 3. 记录响应延迟并评估性能
 *
 * 使用方法：
 * node test/intent-recognition-test.js
 */

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:8081'
const AUTH_TOKEN = 'Bearer mock-token-1-admin'

// 测试用例：涵盖论文中定义的 5 种意图类型
const testCases = [
  {
    name: '规划意图 (Planning)',
    input: '我想制定一个学习计划，每天学习 2 小时，目标是 3 个月内掌握 Python 基础',
    expectedIntent: 'planning',
    expectedThoughtPath: 'personalized_learning'
  },
  {
    name: '教学意图 (Teaching)',
    input: '请讲解一下什么是循环结构，我不太理解 for 和 while 的区别',
    expectedIntent: 'teaching',
    expectedThoughtPath: 'knowledge_teaching'
  },
  {
    name: '聊天意图 (Counseling)',
    input: '最近学习压力好大，感觉有点焦虑，能给我一些鼓励吗',
    expectedIntent: 'counseling',
    expectedThoughtPath: 'psychological_counseling'
  },
  {
    name: '答疑意图 (Question)',
    input: '这道题为什么报错？TypeError: cannot read property of undefined',
    expectedIntent: 'question',
    expectedThoughtPath: 'qa_answering'
  },
  {
    name: '复习意图 (Review)',
    input: '我想复习一下之前的错题，特别是关于变量作用域的题目',
    expectedIntent: 'review',
    expectedThoughtPath: 'wrong_question_review'
  }
]

// 意图到思维链的映射（根据论文架构）
const intentToThoughtPath = {
  'planning': 'personalized_learning',
  'teaching': 'knowledge_teaching',
  'counseling': 'psychological_counseling',
  'question': 'qa_answering',
  'review': 'wrong_question_review'
}

/**
 * 发送单个测试请求
 */
async function sendTestRequest(testCase) {
  const startTime = Date.now()

  try {
    const response = await fetch(`${BASE_URL}/api/agent/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN
      },
      body: JSON.stringify({
        type: testCase.expectedIntent,
        content: testCase.input
      })
    })

    const endTime = Date.now()
    const latency = endTime - startTime

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        latency
      }
    }

    const data = await response.json()

    return {
      success: true,
      latency,
      response: data.data,
      actualIntent: data.data?.intent,
      actualThoughtPath: data.data?.thoughtPath,
      intentMatch: data.data?.intent === testCase.expectedIntent,
      thoughtPathMatch: data.data?.thoughtPath === testCase.expectedThoughtPath
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      latency: Date.now() - startTime
    }
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║     意图识别与思维链引擎测试 - Intent Recognition Test      ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const results = []
  const latencies = []
  let intentMatches = 0
  let thoughtPathMatches = 0

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`测试 ${i + 1}/${testCases.length}: ${testCase.name}`)
    console.log(`${'─'.repeat(60)}`)
    console.log(`输入：${testCase.input.substring(0, 50)}...`)
    console.log(`预期意图：${testCase.expectedIntent}`)
    console.log(`预期思维链：${testCase.expectedThoughtPath}`)

    const result = await sendTestRequest(testCase)
    results.push(result)
    latencies.push(result.latency)

    if (result.success) {
      console.log(`\n✅ 请求成功`)
      console.log(`   实际意图：${result.actualIntent} ${result.intentMatch ? '✓' : '✗'}`)
      console.log(`   实际思维链：${result.actualThoughtPath} ${result.thoughtPathMatch ? '✓' : '✗'}`)
      console.log(`   响应延迟：${result.latency}ms`)

      if (result.intentMatch) intentMatches++
      if (result.thoughtPathMatch) thoughtPathMatches++
    } else {
      console.log(`\n❌ 请求失败：${result.error}`)
      console.log(`   响应延迟：${result.latency}ms`)
    }

    // 请求间隔，避免过载
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // 汇总报告
  console.log(`\n\n${'═'.repeat(60)}`)
  console.log('                      测试结果汇总')
  console.log(`${'═'.repeat(60)}\n`)

  const successCount = results.filter(r => r.success).length
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
  const minLatency = Math.min(...latencies)
  const maxLatency = Math.max(...latencies)
  const intentAccuracy = Math.round((intentMatches / testCases.length) * 100)
  const thoughtPathAccuracy = Math.round((thoughtPathMatches / testCases.length) * 100)

  console.log('📊 性能指标:')
  console.log(`   平均响应延迟：${avgLatency}ms`)
  console.log(`   最小响应延迟：${minLatency}ms`)
  console.log(`   最大响应延迟：${maxLatency}ms`)
  console.log()

  console.log('🎯 意图识别准确率:')
  console.log(`   匹配数：${intentMatches}/${testCases.length} (${intentAccuracy}%)`)
  console.log()

  console.log('🧠 思维链触发准确率:')
  console.log(`   匹配数：${thoughtPathMatches}/${testCases.length} (${thoughtPathAccuracy}%)`)
  console.log()

  console.log('📋 详细结果:')
  console.table(
    results.map((r, i) => ({
      '测试': testCases[i].name.split(' ')[0],
      '状态': r.success ? '✅' : '❌',
      '意图': r.intentMatch ? '✓' : '✗',
      '思维链': r.thoughtPathMatch ? '✓' : '✗',
      '延迟 (ms)': r.latency
    }))
  )

  console.log()

  // 论文性能指标评估
  console.log('📚 论文性能指标评估:')

  // 根据论文，合理的响应延迟应该在 1-3 秒内（考虑 AI 模型推理时间）
  const latencyRating = avgLatency < 1000 ? '优秀' :
                        avgLatency < 3000 ? '良好' :
                        avgLatency < 5000 ? '合格' : '需优化'
  console.log(`   响应延迟：${avgLatency}ms - 评级：${latencyRating}`)

  // 意图识别准确率评估
  const intentRating = intentAccuracy === 100 ? '优秀' :
                       intentAccuracy >= 80 ? '良好' :
                       intentAccuracy >= 60 ? '合格' : '需优化'
  console.log(`   意图识别：${intentAccuracy}% - 评级：${intentRating}`)

  // 思维链触发评估
  const thoughtPathRating = thoughtPathAccuracy === 100 ? '优秀' :
                           thoughtPathAccuracy >= 80 ? '良好' :
                           thoughtPathAccuracy >= 60 ? '合格' : '需优化'
  console.log(`   思维链触发：${thoughtPathAccuracy}% - 评级：${thoughtPathRating}`)

  console.log()
  console.log(`${'═'.repeat(60)}`)

  // 总体评价
  const overallScore = (intentAccuracy + thoughtPathAccuracy) / 2
  const overallRating = overallScore >= 90 ? '优秀' :
                       overallScore >= 75 ? '良好' :
                       overallScore >= 60 ? '合格' : '需优化'

  console.log(`总体评价：${overallRating} (${overallScore.toFixed(1)}分)`)
  console.log(`${'═'.repeat(60)}\n`)

  return {
    success: successCount === testCases.length,
    intentAccuracy,
    thoughtPathAccuracy,
    avgLatency,
    results
  }
}

// 运行测试
runTests().then(summary => {
  process.exit(summary.success ? 0 : 1)
}).catch(error => {
  console.error('测试执行失败:', error)
  process.exit(1)
})
