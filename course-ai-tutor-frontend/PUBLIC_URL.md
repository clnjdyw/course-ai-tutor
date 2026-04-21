# 🌐 公网访问已开启！

## ✅ 配置完成

| 项目 | 状态 |
|------|------|
| **公网 IP** | ✅ 106.14.186.171 |
| **端口** | ✅ 3001 |
| **防火墙** | ✅ 已开放 |
| **服务监听** | ✅ 所有接口 |

---

## 🎯 公网访问地址

### 主地址
```
http://106.14.186.171:3001
```

### 备用地址
```
http://localhost:3001
http://172.24.51.55:3001
```

---

## 📱 访问方式

### 方式一：公网直接访问

在任何有网络的设备上访问：
```
http://106.14.186.171:3001
```

**支持设备**：
- ✅ 手机（4G/5G/WiFi）
- ✅ 平板
- ✅ 其他电脑
- ✅ 任何能上网的设备

### 方式二：局域网访问

在同一局域网内：
```
http://172.24.51.55:3001
```

### 方式三：本地访问

在本机：
```
http://localhost:3001
```

---

## 🔧 技术配置

### 1. 前端服务配置

```bash
# 监听所有网络接口
npm run dev -- --host

# Vite 输出：
# ➜  Local:   http://localhost:3001/
# ➜  Network: http://172.24.51.55:3001/
```

### 2. 防火墙配置

```bash
# 开放 3001 端口
sudo iptables -I INPUT -p tcp --dport 3001 -j ACCEPT
```

### 3. 服务状态

```bash
# 查看监听端口
netstat -tlnp | grep 3001

# 输出：
# tcp6  0  0 :::3001  :::*  LISTEN  42067/node
# (::: 表示监听所有接口)
```

---

## 📊 网络拓扑

```
┌─────────────────────────────────────────┐
│           互联网                         │
│                                         │
│  📱手机  💻电脑  📱平板                  │
│     │       │       │                   │
│     └───────┴───────┘                   │
│             │                           │
│             ▼                           │
│     ┌───────────────┐                   │
│     │  公网 IP       │                   │
│     │ 106.14.186.171│                   │
│     │    :3001      │                   │
│     └───────┬───────┘                   │
│             │                           │
│             ▼                           │
│     ┌───────────────┐                   │
│     │  你的服务器    │                   │
│     │  Vite Dev Server│                  │
│     │  Port: 3001    │                   │
│     └───────────────┘                   │
└─────────────────────────────────────────┘
```

---

## ✅ 访问测试

### 测试 1：本地访问
```bash
curl -I http://localhost:3001
```

### 测试 2：公网访问
```bash
curl -I http://106.14.186.171:3001
```

### 测试 3：在线测试

访问以下在线工具测试：
- https://tool.chinaz.com/port/
- 输入 IP: `106.14.186.171`
- 输入端口：`3001`
- 点击查询

---

## 🎨 界面预览

访问后你会看到：

```
┌─────────────────────────────────────┐
│ 📚 课程辅导 AI         👤 用户 ▼    │
├──────────┬──────────────────────────┤
│          │                          │
│ 📚 规划  │   主内容区               │
│ 👨‍🏫 教学  │                          │
│ 💬 答疑  │   欢迎使用课程辅导 AI     │
│ 📊 评估  │   请选择左侧功能模块     │
│          │                          │
└──────────┴──────────────────────────┘
```

**功能模块**：
1. **学习规划** - AI 生成个性化学习计划
2. **智能教学** - 一对一知识点讲解
3. **实时答疑** - 7×24 在线答疑
4. **学习评估** - 智能批改作业

---

## ⚠️ 安全提示

### 当前风险
- ⚠️ 开发服务器直接暴露到公网
- ⚠️ 没有 HTTPS 加密
- ⚠️ 没有访问控制

### 建议措施

#### 1. 临时使用（推荐）
仅用于测试，用完即关闭：
```bash
# 停止前端服务
# 在运行 npm run dev 的终端按 Ctrl+C
```

#### 2. 添加访问密码

创建简单的认证中间件：
```javascript
// vite.config.js
export default {
  server: {
    host: '0.0.0.0',
    port: 3001,
    // 添加基础认证
    proxy: {
      // 配置认证代理
    }
  }
}
```

#### 3. 使用 Nginx 反向代理（生产环境）

```nginx
server {
    listen 80;
    server_name 106.14.186.171;
    
    # 添加访问控制
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 4. 配置 HTTPS

使用 Let's Encrypt 免费证书：
```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 关闭公网访问

如果不需要公网访问了：

### 1. 关闭端口
```bash
sudo iptables -D INPUT -p tcp --dport 3001 -j ACCEPT
```

### 2. 停止服务
```bash
# 在前端运行终端按 Ctrl+C
```

### 3. 仅监听本地
```bash
# 修改 vite.config.js
export default {
  server: {
    host: 'localhost',  // 仅监听本地
    port: 3001
  }
}
```

---

## 📝 持久化配置

### 1. 保存 iptables 规则

```bash
# Ubuntu/Debian
sudo iptables-save > /etc/iptables/rules.v4

# CentOS/RHEL
sudo service iptables save
```

### 2. 配置开机启动

```bash
# 创建 systemd 服务
sudo nano /etc/systemd/system/course-ai-frontend.service

# 内容：
[Unit]
Description=Course AI Frontend
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/home/admin/.openclaw/workspace/course-ai-tutor-frontend
ExecStart=/usr/bin/npm run dev -- --host
Restart=always

[Install]
WantedBy=multi-user.target

# 启用服务
sudo systemctl enable course-ai-frontend
sudo systemctl start course-ai-frontend
```

---

## 🎯 分享链接

现在你可以将以下链接分享给任何人：

### 公网地址
```
http://106.14.186.171:3001
```

**二维码**（可以使用在线工具生成）：
```
https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://106.14.186.171:3001
```

---

## 📊 访问统计

### 查看访问日志

```bash
# Vite 会在终端显示访问日志
# 例如：
# 10:30:00 [vite] 192.168.1.100 GET / 200
# 10:30:01 [vite] 192.168.1.100 GET /src/main.js 200
```

### 查看连接数

```bash
# 查看当前连接
netstat -an | grep 3001 | wc -l
```

---

## 🆘 故障排查

### 问题 1：无法访问

**检查**：
```bash
# 1. 服务是否运行
ps aux | grep vite

# 2. 端口是否监听
netstat -tlnp | grep 3001

# 3. 防火墙是否开放
sudo iptables -L INPUT -n | grep 3001
```

**解决**：
```bash
# 重启服务
cd ~/.openclaw/workspace/course-ai-tutor-frontend
npm run dev -- --host
```

### 问题 2：访问慢

**可能原因**：
- 网络延迟
- 服务器带宽不足
- 跨运营商访问

**解决**：
- 使用 CDN 加速
- 升级到更高带宽
- 使用云服务商的 BGP 线路

### 问题 3：连接被拒绝

**可能原因**：
- 防火墙拦截
- 路由器未端口映射
- 云服务商安全组限制

**解决**：
```bash
# 检查 iptables
sudo iptables -L INPUT -n

# 检查云服务器安全组（阿里云/腾讯云控制台）
# 添加入站规则：TCP 3001
```

---

## 🎉 成功！

**公网访问地址**: http://106.14.186.171:3001

现在任何人都可以通过这个地址访问你的课程辅导 AI 系统了！

---

**创建时间**: 2026-03-06 00:07  
**公网 IP**: 106.14.186.171  
**端口**: 3001  
**状态**: ✅ 运行中
