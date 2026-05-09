# 404 错误排查与解决指南

## 🔍 问题诊断

当你看到 "Request failed with status code 404" 错误时,通常有以下几个原因:

### 1. 后端服务器未启动
最常见的原因是后端服务器没有运行。

### 2. API 端口不匹配
前端和后端使用的端口不一致。

### 3. 路由路径错误
请求的API路径在后端不存在。

---

## ✅ 解决方案

### 方案一:启动后端服务器(推荐)

#### Windows 系统:

**方法1: 使用启动脚本**
```bash
# 双击运行
course-ai-tutor-backend\start.bat
```

**方法2: 使用命令提示符(CMD)**
```cmd
cd e:\download\course-ai-tutor-main\course-ai-tutor-backend
node src\server.js
```

**方法3: 使用 PowerShell**
```powershell
cd e:\download\course-ai-tutor-main\course-ai-tutor-backend
node .\src\server.js
```

#### 验证服务器是否启动成功:

看到以下输出表示成功:
```
========================================
   🚀 Course AI Tutor - Backend Server
========================================
   环境：development
   服务地址：http://0.0.0.0:8081
   本地访问：http://localhost:8081
   API 前缀：/api
========================================
✅ 后端服务已启动
✅ 数据库已连接
✅ JWT 认证已启用
========================================
```

---

### 方案二:检查端口配置

#### 后端端口配置
文件: `course-ai-tutor-backend\.env`
```env
PORT=8081
```

#### 前端端口配置
文件: `course-ai-tutor-frontend\.env`
```env
VITE_API_BASE_URL=http://localhost:8081/api
```

**注意**: 两个端口必须一致!

我已经修复了 `request.js` 中的默认端口配置:
- ✅ 从 `8082` 改为 `8081`

---

### 方案三:测试API接口

服务器启动后,在浏览器中访问以下URL测试:

#### 1. 健康检查接口(不需要登录)
```
http://localhost:8081/api/health
```

应该返回:
```json
{
  "status": "ok",
  "timestamp": "2026-04-19T...",
  "uptime": 123.456
}
```

#### 2. 新增API接口列表

所有新增的API接口:

| 功能 | 接口路径 | 需要登录 |
|------|----------|----------|
| 知识点列表 | `GET /api/knowledge` | ✅ |
| 笔记列表 | `GET /api/notes` | ✅ |
| 错题列表 | `GET /api/wrong-questions` | ✅ |
| 学习提醒 | `GET /api/reminders` | ✅ |
| 学习进度 | `GET /api/progress` | ✅ |
| 学习统计 | `GET /api/progress/stats` | ✅ |
| 学习建议 | `GET /api/progress/recommendations` | ✅ |

---

### 方案四:检查前端配置

#### 1. 确认环境变量生效

前端使用 Vite,修改 `.env` 文件后需要重启开发服务器:

```bash
# 停止当前运行的前端服务(Ctrl+C)
# 然后重新启动
cd course-ai-tutor-frontend
npm run dev
```

#### 2. 检查浏览器控制台

打开浏览器开发者工具(F12),查看:
- **Console** 标签: 查看API请求日志
- **Network** 标签: 查看具体的请求URL和响应

你应该能看到类似这样的日志:
```
📡 API 请求: GET /api/notes
✅ API 响应: /api/notes {...}
```

---

## 🛠️ 快速启动指南

### 完整启动步骤:

#### 1. 启动后端(终端1)
```cmd
cd e:\download\course-ai-tutor-main\course-ai-tutor-backend
node src\server.js
```

#### 2. 启动前端(终端2)
```cmd
cd e:\download\course-ai-tutor-main\course-ai-tutor-frontend
npm run dev
```

#### 3. 访问应用
打开浏览器访问: `http://localhost:5173`

---

## 📋 常见问题

### Q1: 提示 "模块未找到" 或 "Cannot find module"
**解决方案**: 安装依赖
```cmd
cd course-ai-tutor-backend
npm install
```

### Q2: 端口被占用
**解决方案**: 修改端口
- 后端: 编辑 `course-ai-tutor-backend\.env`,修改 `PORT=8081` 为其他端口
- 前端: 编辑 `course-ai-tutor-frontend\.env`,修改对应的API URL

### Q3: 数据库初始化失败
**解决方案**: 删除旧数据库文件
```cmd
cd course-ai-tutor-backend
del data\course-ai-tutor.db
# 重启服务器会自动创建新数据库
```

### Q4: CORS 跨域错误
**解决方案**: 检查 `.env` 中的允许源
```env
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173
```

### Q5: JWT Token 错误
**解决方案**: 
- 确保已登录获取token
- 检查token是否过期
- 清除localStorage重新登录

---

## 🔧 已修复的问题

### 1. API端口不一致
- ❌ 之前: 前端默认 `8082`,后端运行 `8081`
- ✅ 现在: 统一使用 `8081`

### 2. 文件修改
已修改的文件:
- `course-ai-tutor-frontend/src/api/request.js` - 修正默认端口

---

## 📞 仍然有问题?

如果按照以上步骤仍然无法解决,请提供:

1. **后端控制台输出**
2. **浏览器控制台错误信息**
3. **Network标签中的请求详情**
4. **访问的具体URL**

这样可以帮助更准确地定位问题!

---

## 🎯 测试清单

启动后,按顺序检查:

- [ ] 后端服务器启动成功(看到启动日志)
- [ ] 前端开发服务器运行正常
- [ ] 可以访问登录页面
- [ ] 可以成功登录
- [ ] 可以访问新增的页面(笔记、错题本、学习进度、学习提醒)
- [ ] API请求返回正常数据(无404错误)

---

**更新日期**: 2026-04-19
**适用版本**: v2.0+
