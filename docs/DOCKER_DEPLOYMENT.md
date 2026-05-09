# Docker 部署指南

本文档介绍如何使用 Docker 部署 Course AI Tutor 系统。

## 系统架构

```
┌─────────────────────────────────────────────────┐
│                  Nginx (Port 80)                 │
│              Frontend Static Files               │
│         API Proxy → Backend:8081                 │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│           Backend Service (Port 8081)            │
│  - Node.js + Express                             │
│  - Multi-Agent AI System                         │
│  - JWT Authentication                            │
│  - SQLite Database (persistent volume)           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│            RAG Service (Port 8083)               │
│  - Node.js + Express                             │
│  - Vector Database                               │
│  - Document Management                           │
└─────────────────────────────────────────────────┘
```

## 前置条件

- Docker >= 20.10
- Docker Compose >= 2.0
- 阿里云 DashScope API Key ([获取](https://dashscope.aliyuncs.com))

## 快速部署

### 1. 克隆项目

```bash
cd course-ai-tutor-main
```

### 2. 配置环境变量

复制环境变量配置示例文件:

```bash
cp .env.production.example .env.production
```

编辑 `.env.production` 文件,填入必要的配置:

```bash
# 必须配置的项:
DASHSCOPE_API_KEY=your_api_key_here
JWT_SECRET=your_strong_secret_here_at_least_32_characters
ALLOWED_ORIGINS=http://your-domain.com
```

生成强 JWT 密钥:

```bash
openssl rand -base64 64
```

### 3. 创建 Backend 和 RAG 的 .env 文件

**Backend 配置** (`course-ai-tutor-backend/.env`):

```bash
DASHSCOPE_API_KEY=your_dashscope_api_key_here
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen3.6-plus
STT_MODEL=paraformer-realtime-v2
OCR_MODEL=qwen-vl-max-latest
JWT_SECRET=your_strong_jwt_secret_at_least_32_characters_random
NODE_ENV=production
PORT=8081
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost,http://localhost:80,http://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**RAG 配置** (`course-ai-tutor-rag/.env`):

```bash
DASHSCOPE_API_KEY=your_dashscope_api_key_here
EMBEDDING_MODEL=text-embedding-v3
PORT=8083
```

### 4. 构建并启动服务

```bash
docker-compose up -d --build
```

### 5. 验证部署

检查服务状态:

```bash
docker-compose ps
```

查看服务日志:

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f rag
```

访问应用:

- 前端: http://localhost 或 http://localhost:80
- 后端 API: http://localhost:8081
- RAG 服务: http://localhost:8083
- 健康检查: http://localhost:8081/api/health

## 常用命令

### 停止服务

```bash
docker-compose down
```

### 停止并删除数据卷 (⚠️ 会删除所有数据)

```bash
docker-compose down -v
```

### 重启服务

```bash
docker-compose restart
```

### 重新构建并启动

```bash
docker-compose up -d --build
```

### 查看资源使用

```bash
docker stats
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend sh

# 进入前端容器
docker-compose exec frontend sh

# 进入 RAG 容器
docker-compose exec rag sh
```

## 数据持久化

系统使用 Docker 卷来持久化重要数据:

- `backend-data`: 后端数据 (SQLite 数据库、上传文件)
- `rag-data`: RAG 服务数据 (向量数据库)

查看卷:

```bash
docker volume ls | grep course-ai-tutor
```

备份数据:

```bash
docker run --rm -v course-ai-tutor_main_backend-data:/data -v $(pwd):/backup alpine tar czf /backup/backend-data-backup.tar.gz -C /data .
```

恢复数据:

```bash
docker run --rm -v course-ai-tutor_main_backend-data:/data -v $(pwd):/backup alpine tar xzf /backup/backend-data-backup.tar.gz -C /data
```

## 生产环境部署

### 使用自定义域名

1. 修改 `course-ai-tutor-frontend/nginx.conf` 中的 `server_name`:

```nginx
server_name your-domain.com www.your-domain.com;
```

2. 配置 SSL (推荐使用 Let's Encrypt):

```bash
# 安装 certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 性能优化

1. 调整 Docker Compose 资源限制:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

2. 配置日志轮转 (在 `docker-compose.yml` 中):

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 安全加固

1. 使用非 root 用户运行容器 (已在 Dockerfile 中配置)
2. 定期更新基础镜像
3. 使用 `.dockerignore` 排除敏感文件
4. 启用 Docker Content Trust
5. 配置防火墙规则

## 故障排除

### 服务无法启动

```bash
# 查看详细日志
docker-compose logs

# 检查端口占用
sudo lsof -i :80
sudo lsof -i :8081
sudo lsof -i :8083
```

### 数据库连接问题

```bash
# 检查数据卷权限
docker-compose exec backend ls -la /app/data
```

### API 请求失败

1. 检查后端服务是否正常运行
2. 查看后端日志: `docker-compose logs backend`
3. 验证环境变量配置

### 前端无法连接后端

1. 检查 Nginx 配置: `docker-compose exec frontend cat /etc/nginx/conf.d/default.conf`
2. 测试后端连通性: `docker-compose exec frontend wget -qO- http://backend:8081/api/health`

## 更新升级

### 更新应用代码

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 清理未使用的镜像
docker image prune -f
```

### 更新依赖

```bash
# 进入后端容器
docker-compose exec backend sh

# 更新依赖
npm update

# 退出并重新构建
exit
docker-compose up -d --build
```

## 监控

### 健康检查

服务配置了自动健康检查:

```bash
docker inspect --format='{{.State.Health.Status}}' course-ai-tutor-backend
```

### 日志管理

```bash
# 查看最近 100 行日志
docker-compose logs --tail=100 backend

# 实时跟踪日志
docker-compose logs -f backend
```

## 卸载

完全移除 Docker 部署:

```bash
# 停止并删除所有服务
docker-compose down -v

# 删除所有相关镜像
docker rmi course-ai-tutor-main_backend
docker rmi course-ai-tutor-main_frontend
docker rmi course-ai-tutor-main_rag

# 删除所有未使用的镜像
docker image prune -a
```

## 技术支持

如遇问题,请查看:

- [故障排除文档](TROUBLESHOOTING.md)
- [系统架构文档](docs/ARCHITECTURE.md)
- [安全指南](SECURITY.md)
