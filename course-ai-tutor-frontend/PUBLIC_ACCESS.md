# 🌐 公网访问指南

## ✅ 当前状态

**前端服务**: ✅ 运行中  
**访问地址**: http://localhost:3001  
**服务状态**: 正常

---

## 🏠 访问方式

### 方式一：本地访问（推荐）

直接在本机浏览器访问：
```
http://localhost:3001
```

---

### 方式二：局域网访问

如果你想在同一局域网的其他设备访问：

#### 1. 重启前端并开放局域网

```bash
cd ~/.openclaw/workspace/course-ai-tutor-frontend

# 停止当前服务（Ctrl+C）

# 重启并开放局域网
npm run dev -- --host
```

#### 2. 查看本机 IP

```bash
ip addr show | grep "inet " | grep -v "127.0.0.1"
```

假设你的 IP 是 `192.168.1.100`

#### 3. 在其他设备访问

```
http://192.168.1.100:3001
```

**支持设备**：
- 手机
- 平板
- 同一 WiFi 的电脑

---

### 方式三：公网访问（需要内网穿透）

由于内网穿透工具需要认证或下载较慢，以下是几种方案：

#### 方案 A: Ngrok（需要注册）

1. 访问 https://ngrok.com 注册账号
2. 获取 Authtoken
3. 运行：
```bash
cd /tmp
./ngrok config add-authtoken YOUR_TOKEN
./ngrok http 3001
```

4. 获得公网地址（如：https://xxx.ngrok.io）

#### 方案 B: Cloudflare Tunnel（免费）

```bash
# 下载 cloudflared
cd /tmp
curl -Lo cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared

# 运行隧道
./cloudflared tunnel --url http://localhost:3001
```

#### 方案 C: Localtunnel（无需注册）

```bash
# 安装
npm install -g localtunnel

# 运行
lt --port 3001
```

#### 方案 D: 使用云服务器

如果你有云服务器（阿里云/腾讯云等）：

```bash
# 在服务器上安装 frp 或 ngrok
# 配置反向代理到本地
```

---

### 方式四：Vercel/Netlify 部署（推荐用于生产）

#### 部署到 Vercel

```bash
cd ~/.openclaw/workspace/course-ai-tutor-frontend

# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel

# 按提示操作，获得公网地址
```

#### 部署到 Netlify

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 构建
npm run build

# 部署
netlify deploy --prod --dir=dist
```

---

## 📊 当前服务信息

| 项目 | 值 |
|------|-----|
| **本地地址** | http://localhost:3001 |
| **Vite 版本** | 5.4.21 |
| **运行状态** | ✅ 正常 |
| **进程 PID** | 40790 |

---

## 🔧 快速测试

### 检查服务是否正常

```bash
curl -I http://localhost:3001
```

应该返回：
```
HTTP/1.1 200 OK
Content-Type: text/html
```

### 查看服务日志

```bash
# 前端日志在运行中的终端窗口
# 或者查看进程
ps aux | grep "vite"
```

---

## 📱 界面预览

访问 http://localhost:3001 后你会看到：

### 主界面
- 左侧：深色侧边栏菜单
- 顶部：白色顶栏 + 用户菜单
- 中间：主内容区

### 四个功能模块
1. **📚 学习规划** - 表单输入，AI 生成计划
2. **👨‍🏫 智能教学** - 聊天界面，知识点讲解
3. **💬 实时答疑** - 快捷问题，代码调试
4. **📊 学习评估** - 作业批改，学习报告

---

## ⚠️ 注意事项

### 防火墙

如果局域网无法访问，检查防火墙：

```bash
# 查看防火墙状态
sudo firewall-cmd --state

# 开放 3001 端口
sudo firewall-cmd --add-port=3001/tcp --permanent
sudo firewall-cmd --reload
```

### 路由器设置

公网访问可能需要在路由器设置端口转发：
- 外部端口：3001
- 内部 IP: 你的电脑 IP
- 内部端口：3001

---

## 🎯 推荐方案

**临时测试**：本地访问或局域网访问

**长期部署**：
1. Vercel/Netlify（免费，简单）
2. 云服务器（稳定，可控）
3. 内网穿透（临时，方便）

---

## 📞 需要帮助？

如果你需要我帮你：
1. 配置内网穿透
2. 部署到云平台
3. 设置反向代理

请告诉我具体需求！

---

**当前可访问地址**: http://localhost:3001

**局域网访问**: 运行 `npm run dev -- --host` 后使用 `http://你的 IP:3001`
