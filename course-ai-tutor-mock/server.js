import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 8081

app.use(cors())
app.use(express.json())

// 模拟 AI 响应
const mockResponses = {
  planner: {
    success: true,
    planContent: `# 📚 个性化学习计划

## 学习目标
学习 Spring Boot 框架

## 第一阶段：Java 基础（2 周）
- 变量与数据类型
- 控制流程（if/for/while）
- 面向对象编程
- 集合框架

## 第二阶段：Spring 核心（3 周）
- IOC 容器
- 依赖注入（DI）
- AOP 面向切面
- Spring MVC

## 第三阶段：Spring Boot（3 周）
- 自动配置原理
- Starter 依赖
- RESTful API 开发
- 数据库集成

## 推荐资源
1. 《Spring Boot 实战》
2. B 站视频教程
3. 官方文档

## 检查点
- 每周完成一个小项目
- 每月进行一次综合测试
`,
    agentType: 'planner'
  },
  
  tutor: {
    success: true,
    content: `# 什么是依赖注入？

## 定义
**依赖注入（Dependency Injection, DI）** 是一种设计模式，用于实现控制反转（IOC）。

## 核心思想
不自己创建对象，而是由外部容器将依赖对象注入进来。

## 示例代码

### ❌ 传统方式
\`\`\`java
public class UserService {
    private UserRepository repository = new UserRepository();
}
\`\`\`

### ✅ 依赖注入方式
\`\`\`java
public class UserService {
    private final UserRepository repository;
    
    // 通过构造函数注入
    public UserService(UserRepository repository) {
        this.repository = repository;
    }
}
\`\`\`

## 优点
1. **解耦**：类与依赖之间松耦合
2. **可测试**：便于单元测试
3. **可维护**：易于修改和扩展

## Spring 中的 DI
\`\`\`java
@Service
public class UserService {
    @Autowired
    private UserRepository repository;
}
\`\`\`

## 练习题
1. 什么是控制反转？
2. DI 有几种注入方式？
3. @Autowired 的作用是什么？
`,
    topic: '依赖注入',
    agentType: 'tutor'
  },
  
  helper: {
    success: true,
    answer: `# IOC 和 DI 的区别

## IOC（控制反转）
- **是一种设计思想**
- 将对象的创建权交给外部容器
- 核心是"解耦"

## DI（依赖注入）
- **是 IOC 的具体实现方式**
- 容器将依赖对象注入到类中
- 常见方式：构造器注入、Setter 注入

## 关系
\`\`\`
IOC 是思想，DI 是实现
就像：
- "节能环保"是思想（IOC）
- "使用太阳能"是实现方式（DI）
\`\`\`

## 示例
\`\`\`java
// IOC 容器创建对象
ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);

// DI 注入依赖
UserService service = context.getBean(UserService.class);
\`\`\`

简单来说：**IOC 是目标，DI 是手段**`,
    question: 'IOC 和 DI 的区别',
    agentType: 'helper'
  },
  
  evaluator: {
    success: true,
    feedback: `# 作业批改结果

## 评分：**85 分** ⭐⭐⭐⭐

## 优点 ✅
1. 理解了依赖注入的基本概念
2. 能区分 IOC 和 DI 的关系
3. 答案结构清晰，逻辑连贯

## 需要改进 ⚠️
1. 可以补充更多实际应用场景
2. 注意术语的准确性
3. 建议增加代码示例

## 详细点评

### 第一题（10 分）- 什么是 IOC？
**得分：8 分**
回答基本正确，但可以更详细地说明 IOC 容器的作用。

### 第二题（10 分）- DI 的实现方式
**得分：9 分**
三种注入方式都提到了，很好！

### 第三题（10 分）- @Autowired 的作用
**得分：8 分**
理解了自动装配的概念，但可以说明 required 属性。

## 建议
继续加油！建议多写代码实践，加深理解。`,
    score: 85,
    agentType: 'evaluator'
  }
}

// API 路由

// 规划智能体
app.post('/api/planner/plan', (req, res) => {
  console.log('📚 收到学习计划请求:', req.body)
  setTimeout(() => {
    res.json(mockResponses.planner)
  }, 1000)
})

app.get('/api/planner/info', (req, res) => {
  res.json({ name: 'Planner', description: '学习规划智能体' })
})

// 教学智能体
app.post('/api/tutor/teach', (req, res) => {
  console.log('👨‍🏫 收到教学请求:', req.body)
  setTimeout(() => {
    res.json(mockResponses.tutor)
  }, 1000)
})

app.get('/api/tutor/info', (req, res) => {
  res.json({ name: 'Tutor', description: '智能教学智能体' })
})

// 答疑智能体
app.post('/api/helper/answer', (req, res) => {
  console.log('💬 收到答疑请求:', req.body)
  setTimeout(() => {
    res.json(mockResponses.helper)
  }, 1000)
})

app.get('/api/helper/info', (req, res) => {
  res.json({ name: 'Helper', description: '实时答疑智能体' })
})

// 评估智能体
app.post('/api/evaluator/evaluate', (req, res) => {
  console.log('📊 收到评估请求:', req.body)
  setTimeout(() => {
    res.json(mockResponses.evaluator)
  }, 1000)
})

app.get('/api/evaluator/info', (req, res) => {
  res.json({ name: 'Evaluator', description: '学习评估智能体' })
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================')
  console.log('   🚀 Course AI Tutor - Mock Backend')
  console.log('========================================')
  console.log(`   服务地址：http://0.0.0.0:${PORT}`)
  console.log(`   本地访问：http://localhost:${PORT}`)
  console.log(`   公网访问：http://106.14.186.171:${PORT}`)
  console.log(`   前端代理：http://localhost:3001/api -> http://localhost:${PORT}/api`)
  console.log('========================================')
  console.log('✅ 后端服务已启动')
  console.log('✅ 前后端已连接')
  console.log('========================================')
})
