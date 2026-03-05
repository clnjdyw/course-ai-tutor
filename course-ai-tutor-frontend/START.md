# 🚀 前端快速启动指南

## 1. 环境准备

### 安装 Node.js

```bash
# 检查 Node.js 版本（需要 18+）
node -v

# 如果未安装，访问 https://nodejs.org/ 下载安装
```

### 安装 npm

```bash
# 检查 npm 版本
npm -v

# 推荐升级到最新版本
npm install -g npm@latest
```

## 2. 安装依赖

```bash
cd ~/.openclaw/workspace/course-ai-tutor-frontend

# 安装所有依赖
npm install

# 或使用淘宝镜像加速
npm install --registry=https://registry.npmmirror.com
```

## 3. 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 启动成功后访问：
# http://localhost:3000
```

## 4. 启动后端服务

在另一个终端窗口：

```bash
cd ~/.openclaw/workspace/course-ai-tutor

# 启动后端
mvn spring-boot:run

# 后端服务地址：
# http://localhost:8080/api
```

## 5. 访问系统

打开浏览器访问：

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8080/api
- **H2 控制台**: http://localhost:8080/api/h2-console

## 6. 测试功能

### 6.1 学习规划

1. 点击左侧菜单"学习规划"
2. 输入学习目标：`学习 Spring Boot`
3. 选择当前水平：`零基础`
4. 输入可用时间：`每天 2 小时`
5. 点击"生成学习计划"
6. 查看 AI 生成的计划

### 6.2 智能教学

1. 点击"智能教学"
2. 在聊天框输入：`什么是依赖注入？`
3. 选择水平：`零基础`
4. 点击"发送"
5. 查看 AI 讲解

### 6.3 实时答疑

1. 点击"实时答疑"
2. 点击快捷问题或输入自定义问题
3. 查看 AI 解答
4. 可以展开"代码调试"进行代码问题排查

### 6.4 学习评估

1. 点击"学习评估"
2. 切换到"作业批改"标签
3. 填写题目、学生答案、参考答案
4. 点击"开始批改"
5. 查看评分和反馈

## 7. 构建生产版本

```bash
# 构建
npm run build

# 构建产物在 dist/ 目录
# 可以部署到 Nginx 或其他 Web 服务器
```

## 8. 项目结构说明

```
course-ai-tutor-frontend/
├── src/
│   ├── api/              # API 接口定义
│   │   ├── index.js      # 统一导出
│   │   └── request.js    # Axios 配置
│   ├── views/            # 页面组件
│   │   ├── Home.vue      # 主布局
│   │   ├── PlannerView.vue
│   │   ├── TutorView.vue
│   │   ├── HelperView.vue
│   │   └── EvaluatorView.vue
│   ├── router/           # 路由配置
│   └── main.js           # 入口文件
└── package.json          # 依赖配置
```

## 9. 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器

# 构建
npm run build            # 生产构建
npm run preview          # 预览构建结果

# 代码质量
npm run lint             # ESLint 检查
```

## 10. 故障排查

### 端口被占用

```bash
# 查看占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 依赖安装失败

```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 跨域问题

确保后端启动在 `http://localhost:8080`，Vite 会自动代理 `/api` 请求。

## 11. 前后端联调

### API 调用示例

```javascript
// 导入 API
import { plannerApi } from '@/api'

// 调用接口
const response = await plannerApi.createPlan({
  userId: 1,
  goal: '学习 Vue 3',
  currentLevel: 'BEGINNER'
})

console.log(response)
```

### 查看网络请求

1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 查看 `/api/` 开头的请求
4. 检查请求参数和响应数据

## 12. 下一步开发

### 待添加功能

- [ ] 用户登录/注册
- [ ] 学习计划管理（列表、编辑、删除）
- [ ] 对话历史记录
- [ ] 学习进度追踪
- [ ] 个人中心
- [ ] 设置页面

### 优化建议

- [ ] 添加 Loading 状态
- [ ] 错误处理优化
- [ ] 响应式布局（移动端适配）
- [ ] 主题切换
- [ ] 国际化支持

---

**祝开发顺利！** 🎉

如有问题，请查看：
- [Vue 3 文档](https://vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [项目 README](./README.md)
