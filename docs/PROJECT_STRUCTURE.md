# 项目结构说明

## 目录结构

```
course-ai-tutor-main/
├── docs/                              # 项目文档目录
│   ├── AI_MODEL_SETUP.md             # AI模型配置说明
│   ├── DEVELOPMENT_SUMMARY.md        # 开发总结
│   ├── FEATURES_GUIDE.md             # 功能指南
│   ├── FEATURES_IMPLEMENTED.md       # 已实现功能
│   ├── MEMORY.md                     # 内存管理说明
│   ├── NEW-FEATURES.md               # 新功能说明
│   ├── PHASE2_DEPLOYMENT.md          # 第二阶段部署指南
│   ├── PHASE3_DEPLOYMENT.md          # 第三阶段部署指南
│   ├── QUICK_START.md                # 快速开始指南
│   ├── SECURITY.md                   # 安全指南
│   ├── TEST_REPORT.md                # 测试报告
│   └── TROUBLESHOOTING.md            # 故障排除指南
│
├── course-ai-tutor-backend/          # 后端项目
│   ├── src/                          # 源代码
│   │   ├── agents/                   # AI智能体系统
│   │   │   ├── prompts/             # 提示词模板
│   │   │   ├── sub-agents/          # 子智能体实现
│   │   │   └── tools/               # 智能体工具
│   │   ├── middleware/               # 中间件
│   │   ├── models/                   # 数据模型
│   │   ├── routes/                   # API路由
│   │   ├── services/                 # 业务服务
│   │   └── server.js                 # 服务器入口
│   ├── docs/                         # 后端文档
│   ├── scripts/                      # 工具脚本
│   ├── test/                         # 测试文件
│   ├── .env.example                  # 环境变量示例
│   ├── package.json                  # 依赖配置
│   └── *.bat                         # 启动脚本
│
├── course-ai-tutor-frontend/         # 前端项目
│   ├── src/                          # 源代码
│   │   ├── api/                      # API接口
│   │   ├── components/               # Vue组件
│   │   ├── router/                   # 路由配置
│   │   ├── stores/                   # Pinia状态管理
│   │   ├── views/                    # 页面视图
│   │   │   ├── admin/               # 管理员页面
│   │   │   └── teacher/             # 教师端页面
│   │   ├── App.vue                   # 根组件
│   │   └── main.js                   # 入口文件
│   ├── .env.example                  # 环境变量示例
│   ├── package.json                  # 依赖配置
│   ├── playwright.config.cjs         # Playwright测试配置
│   └── *.bat/*.ps1                   # 启动和测试脚本
│
├── .env.example                      # 根环境变量示例
├── .gitignore                        # Git忽略配置
├── README.md                         # 项目主文档
└── PROJECT_STRUCTURE.md              # 项目结构说明(本文件)
```

## 整理说明

### 已完成的整理工作

1. **文档整理**
   - 将根目录的所有.md文档移动到 `docs/` 目录
   - 保留 README.md 和 PROJECT_STRUCTURE.md 在根目录

2. **清理临时文件**
   - 删除前端 playwright-report/ 目录(测试报告)
   - 删除前端 test-results/ 目录(测试结果)
   - 删除前端的临时文档文件(COMPLETE.md, CONNECTED.md等)
   - 删除后端的测试报告文件

3. **保留的重要文件**
   - 所有源代码文件
   - 配置文件(package.json, .env.example等)
   - 启动脚本(.bat, .ps1文件)
   - 测试配置文件

## 快速启动

### 后端启动
```bash
cd course-ai-tutor-backend
npm install
node src\server.js
```

### 前端启动
```bash
cd course-ai-tutor-frontend
npm install
npm run dev
```

详细启动说明请查看 [docs/QUICK_START.md](docs/QUICK_START.md)
