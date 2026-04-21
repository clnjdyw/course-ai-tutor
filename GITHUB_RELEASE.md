# 🎉 课程辅导 AI 系统 - GitHub 发布说明

## 📦 项目信息

**仓库地址**: https://github.com/clnjdyw/course-ai-tutor  
**分支**: main  
**提交**: 5d2ed20  
**文件数**: 114 个  
**代码量**: 20,492 行  

---

## ✨ 核心功能

### 🤖 6 个 AI 智能体

1. **PlannerAgent** - 学习规划智能体
   - 分析学习目标
   - 制定个性化计划
   - 推荐学习资源

2. **TutorAgent** - 智能教学智能体
   - 一对一知识点讲解
   - 代码示例生成
   - 练习题生成

3. **HelperAgent** - 实时答疑智能体
   - 问题解答
   - 代码调试
   - 引导思考

4. **EvaluatorAgent** - 学习评估智能体
   - 作业批改
   - 学习报告
   - 薄弱点分析

5. **CompanionAgent** - 陪伴聊天智能体 ⭐
   - 智能对话
   - **情绪反馈系统**
   - 学习追踪

6. **AgentManager** - 智能体管理器 ⭐
   - 请求智能分发
   - 智能体协调
   - 状态监控

### 🎨 前端界面 (Vue 3)

- **10 个页面**: 登录、规划、教学、答疑、评估、个人中心、统计、设置、后台
- **Element Plus**: 现代化 UI 组件
- **玻璃态设计**: 渐变 + 毛玻璃效果
- **响应式布局**: 支持移动端

### 🌐 部署方案

- **域名**: dewdrop.cc.cd
- **Nginx**: Docker 反向代理
- **SSL**: HTTPS 加密
- **一键部署**: `./deploy.sh`

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/clnjdyw/course-ai-tutor.git
cd course-ai-tutor
```

### 2. 启动前端

```bash
cd course-ai-tutor-frontend
npm install
npm run dev
# 访问 http://localhost:3001
```

### 3. 启动后端

```bash
cd course-ai-tutor-spring
mvn spring-boot:run
# 访问 http://localhost:8082
```

### 4. 域名部署

```bash
./deploy.sh
# 访问 https://dewdrop.cc.cd
```

---

## 📁 项目结构

```
course-ai-tutor/
├── course-ai-tutor-frontend/     # Vue 3 前端
│   ├── src/
│   │   ├── views/               # 10 个页面组件
│   │   ├── components/          # 公共组件
│   │   ├── api/                 # API 接口
│   │   └── router/              # 路由配置
│   └── package.json
│
├── course-ai-tutor-spring/       # Spring AI 后端
│   ├── src/main/java/
│   │   └── agent/               # 6 个智能体
│   │   ├── controller/          # REST API
│   │   ├── service/             # 业务逻辑
│   │   └── repository/          # 数据访问
│   └── pom.xml
│
├── course-ai-tutor-mock/         # Node.js Mock 后端
│   ├── server.js
│   └── package.json
│
├── deploy.sh                     # 部署脚本
├── DEPLOYMENT.md                 # 部署文档
└── README.md                     # 项目说明
```

---

## 🔧 技术栈

### 前端
- Vue 3 (Composition API)
- Vite (构建工具)
- Element Plus (UI 组件)
- Axios (HTTP 客户端)
- Vue Router (路由)
- Pinia (状态管理)

### 后端
- Spring Boot 3.2.4
- Spring AI 1.0.0-M6
- Spring Data JPA
- H2 Database
- JWT (认证)

### 部署
- Docker (容器化)
- Nginx (反向代理)
- Let's Encrypt (SSL 证书)
- GitHub Actions (CI/CD - 待配置)

---

## 🎯 特色功能

### 1. 情绪反馈系统

CompanionAgent 根据用户答题情况提供不同情绪反馈：

```
答题正确率 > 80%  → 😊 开心、表扬
答题正确率 50-80% → 🙂 肯定进步
答题正确率 < 50%  → 😔 安慰、鼓励
```

### 2. 智能请求分发

AgentManager 自动识别用户意图：

```javascript
"计划"、"规划" → PlannerAgent
"教"、"讲解" → TutorAgent
"问题"、"疑问" → HelperAgent
"批改"、"评估" → EvaluatorAgent
其他 → CompanionAgent
```

### 3. 统一 API 接口

所有智能体通过统一接口访问：

```bash
POST /api/agent/request
{
  "userId": 1,
  "type": "plan|teach|help|evaluate|chat",
  "content": "请求内容"
}
```

---

## 📊 API 文档

### 智能体接口

```bash
# 统一请求入口
POST /api/agent/request

# 聊天接口（带情绪反馈）
POST /api/agent/chat

# 获取智能体状态
GET /api/agent/status

# 获取智能体列表
GET /api/agent/list
```

### 请求示例

```bash
curl -X POST https://dewdrop.cc.cd/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "message": "今天学习好累啊"
  }'
```

### 响应示例

```json
{
  "success": true,
  "message": "辛苦啦！学习确实需要劳逸结合哦~ 😊",
  "mood": {
    "moodType": "TIRED",
    "description": "😴 需要休息",
    "yesterdayAccuracy": 75.0,
    "todayCount": 15,
    "streakDays": 7
  }
}
```

---

## 🌐 访问地址

| 环境 | 地址 |
|------|------|
| **本地开发** | http://localhost:3001 |
| **生产环境** | https://dewdrop.cc.cd |
| **API 文档** | https://dewdrop.cc.cd/api/agent/list |
| **GitHub** | https://github.com/clnjdyw/course-ai-tutor |

---

## 📝 开发计划

### 已完成 ✅
- [x] 基础架构搭建
- [x] 6 个智能体实现
- [x] 情绪反馈系统
- [x] 前端界面（10 个页面）
- [x] 域名部署
- [x] GitHub 仓库创建

### 待完成 🚧
- [ ] 用户认证系统
- [ ] 数据库持久化（PostgreSQL）
- [ ] 单元测试
- [ ] 性能优化
- [ ] Docker Compose 编排
- [ ] GitHub Actions CI/CD
- [ ] 移动端适配优化
- [ ] 多语言支持（i18n）

---

## 🤝 贡献指南

### 1. Fork 项目

```bash
# 在 GitHub 上点击 Fork 按钮
```

### 2. 克隆到本地

```bash
git clone https://github.com/YOUR_USERNAME/course-ai-tutor.git
cd course-ai-tutor
```

### 3. 创建分支

```bash
git checkout -b feature/your-feature-name
```

### 4. 提交代码

```bash
git add .
git commit -m "feat: 添加新功能"
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

在 GitHub 上创建 PR

---

## 📄 许可证

MIT License

## 👥 团队

Course AI Team

## 📅 创建时间

2026-03-06

## 🌟 Star 支持

如果觉得这个项目对你有帮助，请给个 Star ⭐ 支持一下！

---

**GitHub**: https://github.com/clnjdyw/course-ai-tutor  
**演示**: https://dewdrop.cc.cd  
**文档**: 查看各子项目 README
