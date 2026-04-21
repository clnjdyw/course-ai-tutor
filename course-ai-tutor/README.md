# Course AI Tutor - 课程辅导 AI 智能体系统

基于 Spring AI 构建的智能课程辅导系统，提供个性化学习规划、一对一教学、实时答疑和学习评估功能。

## 🎯 项目定位

打造一个类似 Manus 的 AI 智能体系统，专注于课程辅导场景：
- 🤖 多智能体协作（规划、教学、评估、答疑）
- 📖 个性化学习路径
- 💬 自然语言交互
- 📊 学习进度追踪

## 🏗️ 技术架构

```
┌─────────────────────────────────────────┐
│          用户界面层                      │
│  Web / 小程序 / APP / API               │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│          Spring AI 智能体层              │
│  Planner | Tutor | Helper | Evaluator  │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│          服务层 & 数据层                 │
│  Spring Boot + JPA + PostgreSQL        │
└─────────────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- JDK 17+
- Maven 3.6+
- PostgreSQL 14+ (可选，开发环境使用 H2)

### 配置

编辑 `src/main/resources/application.yml`：

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      base-url: https://api.siliconflow.cn/v1
      chat:
        options:
          model: Qwen/Qwen2.5-Coder-32B-Instruct
```

### 运行

```bash
# 克隆项目
cd course-ai-tutor

# 编译
mvn clean package

# 运行
mvn spring-boot:run

# 访问
# API: http://localhost:8080/api
# H2 控制台：http://localhost:8080/api/h2-console
```

## 🤖 智能体说明

### 1. 规划智能体 (Planner)

**职责**：分析学习目标，制定学习计划

**API**：
```bash
POST /api/planner/plan
{
  "userId": 1,
  "goal": "学习 Spring Boot",
  "currentLevel": "BEGINNER",
  "availableTime": "每天 2 小时"
}
```

### 2. 教学智能体 (Tutor)

**职责**：一对一授课，知识点讲解

**API**：
```bash
POST /api/tutor/teach
{
  "userId": 1,
  "topic": "Spring Boot 自动配置原理",
  "level": "INTERMEDIATE"
}
```

### 3. 答疑智能体 (Helper)

**职责**：实时解答问题，错误分析

**API**：
```bash
POST /api/helper/answer
{
  "userId": 1,
  "question": "什么是依赖注入？"
}
```

### 4. 评估智能体 (Evaluator)

**职责**：学习效果评估，反馈建议

**API**：
```bash
POST /api/evaluator/evaluate
{
  "userId": 1,
  "exerciseId": 100,
  "question": "什么是 IOC?",
  "studentAnswer": "...",
  "correctAnswer": "..."
}
```

## 📁 项目结构

```
course-ai-tutor/
├── src/main/java/com/example/coursetutor/
│   ├── CourseAiTutorApplication.java  # 主启动类
│   ├── agent/                         # 智能体层
│   │   ├── BaseAgent.java
│   │   ├── PlannerAgent.java
│   │   ├── TutorAgent.java
│   │   ├── HelperAgent.java
│   │   └── EvaluatorAgent.java
│   ├── controller/                    # 控制器层
│   │   ├── PlannerController.java
│   │   ├── TutorController.java
│   │   ├── HelperController.java
│   │   └── EvaluatorController.java
│   ├── service/                       # 服务层
│   ├── repository/                    # 数据访问层
│   ├── entity/                        # 实体类
│   └── dto/                           # 数据传输对象
├── src/main/resources/
│   ├── application.yml                # 配置文件
│   └── sql/
│       └── init.sql                   # 数据库初始化脚本
└── pom.xml                            # Maven 配置
```

## 📊 API 文档

启动后访问 Swagger UI（待添加）：
```
http://localhost:8080/api/swagger-ui.html
```

## 🛠️ 开发计划

- [x] 基础架构搭建
- [x] 智能体核心实现
- [ ] RAG 知识库集成
- [ ] 用户认证系统
- [ ] 前端界面
- [ ] 单元测试
- [ ] 性能优化

## ⚙️ 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | AI API 密钥 | - |
| `DB_PASSWORD` | 数据库密码 | - |

### 应用配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `app.agent.planner.enabled` | 启用规划智能体 | true |
| `app.agent.tutor.enabled` | 启用教学智能体 | true |
| `app.agent.helper.enabled` | 启用答疑智能体 | true |
| `app.agent.evaluator.enabled` | 启用评估智能体 | true |

## 📝 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

**版本**: 1.0.0-SNAPSHOT  
**作者**: Course AI Team  
**创建时间**: 2026-03-05
