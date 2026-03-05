# 🔧 dewdrop.cc.cd 域名问题排查与解决

## ❌ 当前问题

**症状**: 访问 `https://dewdrop.cc.cd` 无法打开

**原因**: DNS 解析失败
```bash
curl: (6) Could not resolve host: dewdrop.cc.cd
```

---

## 🔍 问题分析

### 1. DNS 解析问题

域名 `dewdrop.cc.cd` 没有配置 DNS 记录，或 DNS 记录未生效。

**检查**:
```bash
nslookup dewdrop.cc.cd
# 返回：找不到域名
```

### 2. 本地访问正常

本地 HTTPS 可以访问（返回 403），说明 Nginx 运行正常。

```bash
curl -k https://localhost
# 返回：403 Forbidden（前端代理问题）
```

---

## ✅ 解决方案

### 方案 1: 配置 DNS 解析（推荐）

登录你的域名服务商（如阿里云、腾讯云、Cloudflare），添加以下 DNS 记录：

```
类型    名称              值              TTL
A       dewdrop.cc.cd    106.14.186.171  600
A       www.dewdrop.cc.cd 106.14.186.171 600
```

**验证 DNS 生效**:
```bash
nslookup dewdrop.cc.cd
# 应返回：106.14.186.171
```

**DNS 生效时间**: 通常 5-30 分钟，最长 24 小时

---

### 方案 2: 使用 IP 直接访问（临时）

如果暂时没有域名，可以直接使用 IP 访问：

```bash
# 修改 hosts 文件（本地测试）
sudo vim /etc/hosts

# 添加以下行
106.14.186.171 dewdrop.cc.cd
106.14.186.171 www.dewdrop.cc.cd
```

然后访问：
```
https://106.14.186.171
```

---

### 方案 3: 使用免费域名（备选）

如果 `dewdrop.cc.cd` 无法使用，可以申请免费域名：

#### Freenom 免费域名
1. 访问 https://www.freenom.com
2. 注册账号
3. 搜索可用域名（.tk, .ml, .ga, .cf, .gq）
4. 免费使用 12 个月

#### EU.org 免费子域名
1. 访问 https://nic.eu.org
2. 提交申请
3. 等待审核（1-7 天）

---

## 🔧 修复 Nginx 403 错误

本地访问返回 403，需要修复 Nginx 配置：

### 1. 更新 Nginx 配置

```bash
docker exec nginx cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name dewdrop.cc.cd www.dewdrop.cc.cd;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name dewdrop.cc.cd www.dewdrop.cc.cd;
    
    ssl_certificate /etc/ssl/dewdrop/fullchain.pem;
    ssl_certificate_key /etc/ssl/dewdrop/privkey.pem;
    
    location / {
        proxy_pass http://host.docker.internal:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://host.docker.internal:8082/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
```

### 2. 重启 Nginx

```bash
docker restart nginx
```

### 3. 验证访问

```bash
curl -k https://localhost
# 应返回前端页面 HTML
```

---

## 📊 完整部署检查清单

### DNS 配置
- [ ] 添加 A 记录指向 106.14.186.171
- [ ] 等待 DNS 生效
- [ ] 验证：`nslookup dewdrop.cc.cd`

### Nginx 配置
- [ ] Nginx 容器运行正常
- [ ] SSL 证书配置正确
- [ ] 反向代理配置正确
- [ ] 端口 80 和 443 已开放

### 后端服务
- [ ] 前端运行在 3001 端口
- [ ] 后端运行在 8082 端口
- [ ] 服务可以正常访问

### 防火墙
- [ ] 开放 80 端口（HTTP）
- [ ] 开放 443 端口（HTTPS）
- [ ] 验证：`sudo firewall-cmd --list-all`

---

## 🎯 快速修复步骤

### 如果你有域名管理权限

1. **登录域名服务商**
   - 阿里云：https://dns.console.aliyun.com
   - 腾讯云：https://console.cloud.tencent.com/dnspod
   - Cloudflare: https://dash.cloudflare.com

2. **添加 DNS 记录**
   ```
   类型：A
   名称：@ (或 dewdrop)
   值：106.14.186.171
   TTL: 600
   ```

3. **等待生效**（5-30 分钟）

4. **验证**
   ```bash
   nslookup dewdrop.cc.cd
   curl -k https://dewdrop.cc.cd
   ```

### 如果你没有域名管理权限

使用本地 hosts 文件测试：

```bash
# 添加 hosts 记录
echo "106.14.186.171 dewdrop.cc.cd" | sudo tee -a /etc/hosts

# 验证
ping dewdrop.cc.cd
curl -k https://dewdrop.cc.cd
```

---

## 📝 当前服务状态

| 服务 | 状态 | 端口 | 说明 |
|------|------|------|------|
| Nginx | ✅ 运行中 | 80, 443 | Docker 容器 |
| Vue 前端 | ✅ 运行中 | 3001 | Vite 开发服务器 |
| Mock 后端 | ✅ 运行中 | 8081 | Node.js |
| DNS 解析 | ❌ 未配置 | - | 需要添加 A 记录 |

---

## 🔍 故障排查命令

```bash
# 1. 检查 DNS 解析
nslookup dewdrop.cc.cd

# 2. 检查 Nginx 状态
docker ps | grep nginx

# 3. 检查端口监听
netstat -tlnp | grep -E ':80|:443'

# 4. 查看 Nginx 日志
docker logs nginx --tail 50

# 5. 测试本地访问
curl -k https://localhost

# 6. 检查防火墙
sudo firewall-cmd --list-all
```

---

## 🎉 完成标志

当你看到以下结果时，说明配置成功：

```bash
# DNS 解析成功
nslookup dewdrop.cc.cd
# 返回：106.14.186.171

# HTTPS 访问成功
curl -k https://dewdrop.cc.cd
# 返回：前端页面 HTML

# 浏览器访问
打开 https://dewdrop.cc.cd
# 显示：课程辅导 AI 系统界面
```

---

**创建时间**: 2026-03-06 02:06  
**问题**: DNS 未配置  
**解决**: 添加 A 记录到域名服务商
