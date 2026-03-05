# 课程辅导 AI 系统

一个基于 Spring AI + Vue 3 的智能课程辅导系统，包含 6 个 AI 智能体。

## 🎯 项目组成

### 1. 前端项目 (course-ai-tutor-frontend)
- **技术栈**: Vue 3 + Vite + Element Plus
- **端口**: 3001
- **功能**: 学习规划、智能教学、实时答疑、学习评估、个人中心

### 2. Spring AI 后端 (course-ai-tutor-spring)
- **技术栈**: Spring Boot 3.2.4 + Spring AI 1.0.0-M6
- **端口**: 8082
- **智能体**:
  - PlannerAgent - 学习规划
  - TutorAgent - 智能教学
  - HelperAgent - 实时答疑
  - EvaluatorAgent - 学习评估
  - CompanionAgent - 陪伴聊天（带情绪反馈）
  - AgentManager - 智能体管理器

### 3. Mock 后端 (course-ai-tutor-mock)
- **技术栈**: Node.js + Express
- **端口**: 8081
- **用途**: 快速测试和演示

## 🚀 快速开始

### 前端
```bash
cd course-ai-tutor-frontend
npm install
npm run dev
```

### Spring AI 后端
```bash
cd course-ai-tutor-spring
mvn spring-boot:run
```

### Mock 后端
```bash
cd course-ai-tutor-mock
npm install
npm start
```

## 🌐 部署

### 域名部署
```bash
./deploy.sh
```

访问：https://dewdrop.cc.cd

## 📁 项目结构

```
workspace/
├── course-ai-tutor-frontend/    # Vue 3 前端
├── course-ai-tutor-spring/      # Spring AI 后端
├── course-ai-tutor-mock/        # Node.js Mock 后端
├── course-ai-tutor-backend/     # Node.js 后端（旧版）
├── docker/                      # Docker 配置
├── deploy.sh                    # 部署脚本
├── DEPLOYMENT.md                # 部署文档
└── README.md                    # 本文档
```

## 🤖 智能体系统

### 规划智能体 (PlannerAgent)
- 分析学习目标
- 制定个性化学习计划
- 推荐学习资源

### 教学智能体 (TutorAgent)
- 一对一知识点讲解
- 提供代码示例
- 生成练习题

### 答疑智能体 (HelperAgent)
- 实时解答问题
- 代码调试
- 引导思考

### 评估智能体 (EvaluatorAgent)
- 作业批改
- 学习报告生成
- 薄弱点分析

### 陪伴智能体 (CompanionAgent) ⭐
- 聊天交流
- **情绪反馈**（根据答题情况）
- 学习追踪

### 智能体管理器 (AgentManager) ⭐
- 请求智能分发
- 智能体协调
- 状态监控

## 📊 技术架构

```
┌─────────────────┐
│   Vue 3 前端    │ Port: 3001
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│ Spring AI 后端  │ Port: 8082
│  (6 个智能体)    │
└────────┬────────┘
         │ JPA
         ▼
┌─────────────────┐
│   H2 Database   │
└─────────────────┘
```

## 🔧 配置

### API Key 配置
编辑 `course-ai-tutor-spring/src/main/resources/application.yml`:
```yaml
spring:
  ai:
    openai:
      api-key: your-api-key
      base-url: https://api.siliconflow.cn/v1
```

### 数据库配置
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:coursedb
    username: sa
    password: 
```

## 📝 API 文档

### 智能体接口
```bash
# 统一请求入口
POST /api/agent/request
{
  "userId": 1,
  "type": "plan|teach|help|evaluate|chat",
  "content": "请求内容"
}

# 聊天接口（带情绪反馈）
POST /api/agent/chat
{
  "userId": 1,
  "message": "你好"
}

# 获取智能体状态
GET /api/agent/status

# 获取智能体列表
GET /api/agent/list
```

## 🎨 功能特性

### 情绪反馈系统
CompanionAgent 根据用户答题情况提供不同情绪反馈：
- 正确率 > 80% → 😊 开心、表扬
- 正确率 50-80% → 🙂 肯定进步
- 正确率 < 50% → 😔 安慰、鼓励

### 智能请求分发
AgentManager 自动识别用户意图并分发给合适的智能体。

### 统一后端接口
所有智能体通过统一接口访问，简化前端调用。

## 📈 开发计划

- [x] 基础架构搭建
- [x] 6 个智能体实现
- [x] 情绪反馈系统
- [x] 前端界面
- [x] 域名部署
- [ ] 用户认证系统
- [ ] 数据库持久化
- [ ] 性能优化
- [ ] 单元测试

## 🌐 访问地址

- **本地开发**: http://localhost:3001
- **生产环境**: https://dewdrop.cc.cd
- **API 文档**: https://dewdrop.cc.cd/api/agent/list

## 📄 许可证

MIT License

## 👥 团队

Course AI Team

## 📅 创建时间

2026-03-05
