import express from 'express'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// 模拟 AI 响应
const mockResponses = {
  planner: {
    success: true,
    planContent: `# 📚 个性化学习计划

## 学习目标
学习 Spring Boot 框架

## 第一阶段：Java 基础（2 周）
- 变量与数据类型
- 控制流程
- 面向对象编程
- 集合框架

## 第二阶段：Spring 核心（3 周）
- IOC 容器
- 依赖注入
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
    
    public UserService(UserRepository repository) {
        this.repository = repository;
    }
}
\`\`\`

## 优点
1. **解耦**：类与依赖之间松耦合
2. **可测试**：便于单元测试
3. **可维护**：易于修改和扩展
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

## DI（依赖注入）
- **是 IOC 的具体实现方式**
- 容器将依赖对象注入到类中

## 关系
IOC 是目标，DI 是手段
`,
    question: 'IOC 和 DI 的区别',
    agentType: 'helper'
  },
  
  evaluator: {
    success: true,
    feedback: `# 作业批改结果

## 评分：**85 分** ⭐⭐⭐⭐

## 优点 ✅
1. 理解了基本概念
2. 答案结构清晰
3. 逻辑连贯

## 需要改进 ⚠️
1. 可以补充更多实际应用场景
2. 注意术语的准确性
3. 建议增加代码示例
`,
    score: 85,
    agentType: 'evaluator'
  }
}

// AI 规划接口
router.post('/planner/plan', authMiddleware, (req, res) => {
  console.log('📚 收到学习计划请求:', req.body)
  setTimeout(() => {
    res.json(mockResponses.planner)
  }, 1000)
})

// AI 教学接口
router.post('/tutor/teach', authMiddleware, (req, res) => {
  console.log('👨‍🏫 收到教学请求:', req.body)
  setTimeout(() => {
    res.json(mockResponses.tutor)
  }, 1000)
})

// AI 答疑接口
router.post('/helper/answer', authMiddleware, (req, res) => {
  console.log('💬 收到答疑请求:', req.body)
  setTimeout(() => {
    res.json(mockResponses.helper)
  }, 1000)
})

// AI 评估接口
router.post('/evaluator/evaluate', authMiddleware, (req, res) => {
  console.log('📊 收到评估请求:', req.body)
  setTimeout(() => {
    res.json(mockResponses.evaluator)
  }, 1000)
})

export default router
