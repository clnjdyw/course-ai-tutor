# 🚀 快速启动指南

## 1. 项目已创建完成

基础架构已搭建完成，包含以下内容：

### ✅ 已完成

- [x] Maven 项目结构
- [x] Spring Boot 3.2.4 + Spring AI 1.0.0-M6
- [x] 4 个智能体（Planner/Tutor/Helper/Evaluator）
- [x] 实体类（User/Course/StudyPlan/Conversation）
- [x] Repository 层
- [x] Controller 层（REST API）
- [x] DTO 数据传输对象
- [x] 数据库初始化脚本
- [x] 配置文件（H2 开发环境 + PostgreSQL 生产环境）

## 2. 启动项目

### 方式一：使用 Maven

```bash
cd ~/.openclaw/workspace/course-ai-tutor

# 编译
mvn clean package

# 运行
mvn spring-boot:run
```

### 方式二：使用 IDE

1. 用 IntelliJ IDEA 或 Eclipse 打开项目
2. 导入为 Maven 项目
3. 运行 `CourseAiTutorApplication.java`

## 3. 访问服务

启动成功后：

- **API 地址**: http://localhost:8080/api
- **H2 控制台**: http://localhost:8080/api/h2-console
- **JDBC URL**: `jdbc:h2:mem:coursedb`

## 4. 测试 API

### 创建学习计划

```bash
curl -X POST http://localhost:8080/api/planner/plan \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "goal": "学习 Spring Boot",
    "currentLevel": "BEGINNER",
    "availableTime": "每天 2 小时"
  }'
```

### 讲解知识点

```bash
curl -X POST http://localhost:8080/api/tutor/teach \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "topic": "什么是依赖注入？",
    "level": "BEGINNER"
  }'
```

### 解答问题

```bash
curl -X POST http://localhost:8080/api/helper/answer \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "question": "IOC 和 DI 有什么区别？"
  }'
```

### 评估作业

```bash
curl -X POST http://localhost:8080/api/evaluator/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "exerciseId": 1,
    "question": "什么是 Spring？",
    "studentAnswer": "Spring 是一个框架",
    "correctAnswer": "Spring 是一个开源的 Java 平台..."
  }'
```

## 5. 配置 AI 模型

编辑 `src/main/resources/application.yml`：

```yaml
spring:
  ai:
    openai:
      api-key: sk-286b643e163489c7eb9038d8967cb69f
      base-url: https://api.siliconflow.cn/v1
      chat:
        options:
          model: Qwen/Qwen2.5-Coder-32B-Instruct
```

## 6. 切换到 PostgreSQL（生产环境）

1. 安装 PostgreSQL 14+

2. 创建数据库：
```sql
CREATE DATABASE course_ai;
CREATE USER admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE course_ai TO admin;
```

3. 修改 `application.yml`，取消注释生产环境配置

4. 运行初始化脚本：
```bash
psql -U admin -d course_ai -f src/main/resources/sql/init.sql
```

## 7. 下一步开发

### 待完成功能

- [ ] RAG 知识库集成（向量数据库）
- [ ] 用户认证系统（Spring Security + JWT）
- [ ] 前端界面（Vue/React）
- [ ] 单元测试
- [ ] API 文档（SpringDoc OpenAPI）
- [ ] 缓存优化（Redis）
- [ ] 消息队列（RabbitMQ/Kafka）

### 扩展建议

1. **添加更多智能体**
   - 陪练智能体（对话练习）
   - 推荐智能体（资源推荐）

2. **集成外部服务**
   - 代码执行沙箱
   - 视频会议（在线授课）
   - 邮件通知

3. **数据分析**
   - 学习行为分析
   - 预测模型
   - 可视化报表

## 8. 常见问题

### Q: 启动失败？
A: 检查 JDK 版本（需要 17+），Maven 版本（3.6+）

### Q: API 返回错误？
A: 检查 API Key 配置，网络连接

### Q: 数据库连接失败？
A: 检查 PostgreSQL 是否运行，用户名密码是否正确

## 9. 项目结构概览

```
course-ai-tutor/
├── pom.xml                          # Maven 配置
├── README.md                        # 项目说明
├── src/main/
│   ├── java/com/example/coursetutor/
│   │   ├── CourseAiTutorApplication.java
│   │   ├── agent/                   # 4 个智能体
│   │   ├── controller/              # 4 个控制器
│   │   ├── entity/                  # 4 个实体类
│   │   ├── repository/              # 4 个 Repository
│   │   ├── dto/                     # 8 个 DTO
│   │   └── service/                 # （待添加）
│   └── resources/
│       ├── application.yml          # 配置文件
│       └── sql/init.sql             # 数据库脚本
└── src/test/                        # （待添加测试）
```

---

**祝开发顺利！** 🎉
