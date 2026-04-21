# Course AI Tutor - Frontend

课程辅导 AI 智能体系统 - 前端界面

## 🚀 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Element Plus** - Vue 3 组件库
- **Pinia** - Vue 状态管理
- **Vue Router** - 路由管理
- **Axios** - HTTP 客户端
- **Markdown-it** - Markdown 渲染

## 📦 安装

```bash
cd course-ai-tutor-frontend

# 安装依赖
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

## 🎯 开发

```bash
# 启动开发服务器（热重载）
npm run dev

# 访问 http://localhost:3000
```

## 🏗️ 构建

```bash
# 生产环境构建
npm run build

# 预览构建结果
npm run preview
```

## 📁 项目结构

```
course-ai-tutor-frontend/
├── public/                  # 静态资源
├── src/
│   ├── api/                # API 接口
│   │   ├── index.js        # API 导出
│   │   └── request.js      # Axios 配置
│   ├── assets/             # 资源文件
│   ├── components/         # 公共组件
│   ├── router/             # 路由配置
│   │   └── index.js
│   ├── store/              # Pinia 状态管理
│   ├── utils/              # 工具函数
│   ├── views/              # 页面视图
│   │   ├── Home.vue        # 主布局
│   │   ├── PlannerView.vue # 学习规划
│   │   ├── TutorView.vue   # 智能教学
│   │   ├── HelperView.vue  # 实时答疑
│   │   └── EvaluatorView.vue # 学习评估
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── index.html
├── package.json
└── vite.config.js
```

## 🎨 功能模块

### 1. 学习规划 (Planner)

- 📝 输入学习目标
- 🎯 选择当前水平
- ⏰ 设置可用时间
- 🤖 AI 生成个性化学习计划
- 📋 查看、复制、保存计划

### 2. 智能教学 (Tutor)

- 💬 聊天式交互界面
- 📚 知识点详细讲解
- 🎓 支持不同难度级别
- 💻 代码示例展示
- 📝 练习题生成

### 3. 实时答疑 (Helper)

- ⚡ 快速问答
- 🔧 代码调试
- 📜 答疑历史记录
- 👍 反馈评价
- 🔗 快捷问题

### 4. 学习评估 (Evaluator)

- ✅ 作业智能批改
- 📊 评分和反馈
- 📈 学习报告生成
- 💾 导出报告

## 🔌 API 集成

前端通过 Axios 与后端通信，默认代理配置：

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

### API 接口

```javascript
import { plannerApi, tutorApi, helperApi, evaluatorApi } from '@/api'

// 创建学习计划
await plannerApi.createPlan({
  userId: 1,
  goal: '学习 Spring Boot',
  currentLevel: 'BEGINNER',
  availableTime: '每天 2 小时'
})

// 讲解知识点
await tutorApi.teach({
  userId: 1,
  topic: '什么是依赖注入？',
  level: 'BEGINNER'
})

// 解答问题
await helperApi.answer({
  userId: 1,
  question: 'IOC 和 DI 有什么区别？'
})

// 评估作业
await evaluatorApi.evaluate({
  userId: 1,
  exerciseId: 1,
  question: '...',
  studentAnswer: '...',
  correctAnswer: '...'
})
```

## 🎨 UI 设计

### 配色方案

- **主色**: `#409EFF` (Element Plus Primary)
- **成功**: `#67C23A`
- **警告**: `#E6A23C`
- **危险**: `#F56C6C`
- **背景**: `#f0f2f5`

### 布局

```
┌─────────────────────────────────────┐
│  Sidebar  │  Header                 │
│           ├─────────────────────────┤
│  - 规划   │  Main Content           │
│  - 教学   │                         │
│  - 答疑   │                         │
│  - 评估   │                         │
│           │                         │
└───────────┴─────────────────────────┘
```

## 📝 开发规范

### 组件命名

- 使用 PascalCase: `PlannerView.vue`
- 文件名与组件名一致

### 代码风格

- 使用 Composition API (`<script setup>`)
- 使用 ES6+ 语法
- 遵循 Vue 3 最佳实践

### Git 提交

```bash
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构代码
test: 测试相关
chore: 构建/工具链相关
```

## 🔧 环境变量

创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=课程辅导 AI 智能体
```

## 🚀 部署

### Docker 部署

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🐛 常见问题

### Q: 跨域问题？
A: 开发环境使用 Vite 代理，生产环境使用 Nginx 反向代理

### Q: 样式不生效？
A: 检查 scoped 样式，或使用 `:deep()` 选择器

### Q: 打包后路径错误？
A: 在 `vite.config.js` 中配置 `base: './'`

## 📚 相关资源

- [Vue 3 文档](https://vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [Vite 文档](https://vitejs.dev/)
- [Pinia 文档](https://pinia.vuejs.org/)

## 📄 许可证

MIT License

---

**版本**: 1.0.0  
**作者**: Course AI Team  
**创建时间**: 2026-03-05
