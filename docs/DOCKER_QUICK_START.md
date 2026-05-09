# Docker 快速部署指南

## 一键部署

```bash
# 进入项目目录
cd course-ai-tutor-main

# 配置环境变量
cp course-ai-tutor-backend/.env.example course-ai-tutor-backend/.env
cp course-ai-tutor-rag/.env.example course-ai-tutor-rag/.env

# 编辑 .env 文件，填入你的 API Key
# course-ai-tutor-backend/.env - 必须设置 DASHSCOPE_API_KEY 和 JWT_SECRET
# course-ai-tutor-rag/.env - 必须设置 DASHSCOPE_API_KEY

# 一键部署
./deploy.sh
```

## 手动部署

```bash
# 1. 配置环境变量（必需）
# 编辑 course-ai-tutor-backend/.env 和 course-ai-tutor-rag/.env

# 2. 构建并启动
docker-compose up -d --build

# 3. 查看状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f
```

## 访问服务

- **前端**: http://localhost
- **后端 API**: http://localhost:8081
- **RAG 服务**: http://localhost:8083
- **健康检查**: http://localhost:8081/api/health

## 常用命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f [backend|frontend|rag]

# 重新构建
docker-compose up -d --build

# 清理所有资源（⚠️ 会删除数据）
docker-compose down -v
```

## 故障排除

### 权限问题

```bash
# 添加用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker
```

### 端口被占用

编辑 `docker-compose.yml` 修改端口映射:

```yaml
ports:
  - "8080:80"  # 将前端改为 8080 端口
```

### 服务启动失败

```bash
# 查看详细日志
docker-compose logs backend

# 检查环境变量
cat course-ai-tutor-backend/.env
```

## 生产部署

详细的生产部署指南请参阅: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
