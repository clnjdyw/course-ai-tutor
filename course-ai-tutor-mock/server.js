import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 8081

app.use(cors())
app.use(express.json())

// 模拟 AI 响应生成器
function generateAIResponse(type, content, context = '') {
  const responses = {
    plan: {
      success: true,
      message: `# 📚 个性化学习计划

## 学习目标
${content || '学习新知识'}

## 第一阶段：基础入门（1-2 周）
- 了解基本概念
- 安装开发环境
- 完成 Hello World

## 第二阶段：核心知识（3-4 周）
- 深入学习核心概念
- 完成实践项目
- 解决常见问题

## 第三阶段：进阶提升（5-6 周）
- 学习高级特性
- 参与开源项目
- 总结最佳实践

## 推荐资源
1. 官方文档
2. 在线教程
3. 技术书籍

## 检查点
- 每周完成一个小项目
- 每月进行一次总结
- 持续学习和实践`,
      agentType: 'planner'
    },
    
    teach: {
      success: true,
      message: `# 📖 ${content || '知识点讲解'}

## 什么是${content || '它'}？

**${content || '知识点'}** 是一个重要的概念，让我详细为你讲解。

## 核心概念

### 1. 基本定义
这是一个基础概念，理解它很重要。

### 2. 工作原理
它的工作流程如下：
1. 第一步
2. 第二步
3. 第三步

### 3. 使用场景
- 场景一：常见用途
- 场景二：实际应用
- 场景三：高级用法

## 代码示例

\`\`\`java
// 示例代码
public class Example {
    public static void main(String[] args) {
        System.out.println("Hello, ${content || 'World'}!");
    }
}
\`\`\`

## 练习题

1. 什么是${content || '它'}？
2. ${content || '它'}的工作原理是什么？
3. 如何在实际项目中使用？

## 总结

掌握${content || '这个知识点'}需要：
- ✅ 理解基本概念
- ✅ 完成实践练习
- ✅ 不断重复和复习`,
      agentType: 'tutor'
    },
    
    help: {
      success: true,
      message: `# 💡 问题解答

## 你的问题
${content || '请详细描述你的问题'}

## 解答

${context ? `**上下文**: ${context}\n\n` : ''}

让我来帮你解决这个问题：

### 分析
根据你的描述，这个问题可能是因为：
1. 原因一
2. 原因二
3. 原因三

### 解决方案

**方法一：推荐方案**
\`\`\`
// 代码示例
solution();
\`\`\`

**方法二：备选方案**
\`\`\`
// 替代方案
alternative();
\`\`\`

### 建议
- ✅ 先尝试方法一
- ✅ 如果不行再试方法二
- ✅ 还有问题随时问我

### 相关资源
- [官方文档](https://example.com)
- [教程链接](https://example.com/tutorial)
- [社区讨论](https://example.com/discuss)`,
      agentType: 'helper'
    },
    
    evaluate: {
      success: true,
      score: 85,
      message: `# 📝 作业批改结果

## 评分：**85 分** ⭐⭐⭐⭐

## 优点 ✅

1. **理解准确**
   - 对基本概念理解正确
   - 能够运用所学知识

2. **代码规范**
   - 代码结构清晰
   - 命名规范

3. **逻辑清晰**
   - 思路清晰
   - 步骤完整

## 需要改进 ⚠️

1. **细节处理**
   - 注意边界条件
   - 增加错误处理

2. **性能优化**
   - 可以考虑更优的算法
   - 减少不必要的计算

3. **代码注释**
   - 增加关键步骤注释
   - 说明复杂逻辑

## 具体建议

### 改进点 1
\`\`\`java
// 原代码
if (condition) {
    doSomething();
}

// 建议改进
if (condition != null && condition) {
    doSomething();
}
\`\`\`

### 改进点 2
- 添加单元测试
- 增加输入验证
- 优化数据结构

## 鼓励的话

做得很好！继续保持学习的热情，相信你会越来越优秀！💪`,
      agentType: 'evaluator'
    },
    
    chat: {
      success: true,
      message: `你好！😊 

${content ? `我看到你说"${content}"，让我和你聊聊~` : '今天过得怎么样？有什么想和我分享的吗？'}

作为你的学习伙伴，我可以：
- 📚 帮你制定学习计划
- 👨‍🏫 为你讲解知识点
- 💬 解答你的疑问
- 📊 评估你的学习成果

${context || '随时都可以找我聊天哦！'}

加油！我相信你一定可以的！💪✨`,
      mood: {
        moodType: 'HAPPY',
        description: '😊 开心',
        yesterdayAccuracy: 80.0,
        todayCount: 5,
        streakDays: 7
      },
      agentType: 'companion'
    }
  }
  
  return responses[type] || responses.chat
}

// 统一智能体请求入口
app.post('/api/agent/request', (req, res) => {
  const { type, content, context, userId } = req.body
  console.log(`🤖 收到${type}请求 from user ${userId}:`, content)
  
  setTimeout(() => {
    const response = generateAIResponse(type, content, context)
    res.json(response)
  }, 1000)
})

// 聊天接口
app.post('/api/agent/chat', (req, res) => {
  const { userId, message } = req.body
  console.log(`💬 收到聊天请求 from user ${userId}:`, message)
  
  setTimeout(() => {
    const response = generateAIResponse('chat', message)
    res.json(response)
  }, 800)
})

// 获取智能体状态
app.get('/api/agent/status', (req, res) => {
  res.json({
    status: 'ok',
    agents: [
      { name: 'Planner', status: 'online', description: '学习规划智能体' },
      { name: 'Tutor', status: 'online', description: '智能教学智能体' },
      { name: 'Helper', status: 'online', description: '实时答疑智能体' },
      { name: 'Evaluator', status: 'online', description: '学习评估智能体' },
      { name: 'Companion', status: 'online', description: '陪伴聊天智能体' },
      { name: 'Manager', status: 'online', description: '智能体管理器' }
    ]
  })
})

// 获取智能体列表
app.get('/api/agent/list', (req, res) => {
  res.json([
    { name: 'Planner', description: '学习规划智能体', type: 'PLANNER' },
    { name: 'Tutor', description: '智能教学智能体', type: 'TUTOR' },
    { name: 'Helper', description: '实时答疑智能体', type: 'HELPER' },
    { name: 'Evaluator', description: '学习评估智能体', type: 'EVALUATOR' },
    { name: 'Companion', description: '陪伴聊天智能体', type: 'COMPANION' },
    { name: 'Manager', description: '智能体管理器', type: 'MANAGER' }
  ])
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================')
  console.log('   🚀 Course AI Tutor - Mock Backend')
  console.log('========================================')
  console.log(`   服务地址：http://0.0.0.0:${PORT}`)
  console.log(`   本地访问：http://localhost:${PORT}`)
  console.log(`   API 前缀：/api`)
  console.log('========================================')
  console.log('✅ Mock 后端服务已启动')
  console.log('✅ 智能体 API 已就绪')
  console.log('========================================')
})
