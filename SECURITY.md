# 安全配置指南

## ⚠️ 重要安全提示

本项目曾包含硬编码的 API 密钥和敏感信息。如果您从代码仓库克隆了此项目，**请立即执行以下操作**：

### 1. 撤销已泄露的 API 密钥

以下密钥已被提交到代码历史中，**必须立即撤销**：

- **SiliconFlow API Key**: `sk-sp-02a6a23e5ad44ac6beff6e9a13f6d544`
- **OpenAI API Key**: `sk-286b643e163489c7eb9038d8967cb69f`

请登录相应的服务平台撤销这些密钥并生成新的密钥。

### 2. 从 Git 历史中清除敏感信息

使用 BFG Repo-Cleaner 清理 Git 历史：

```bash
# 下载 BFG
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# 创建 secrets.txt 文件，包含要替换的密钥
echo 'sk-sp-02a6a23e5ad44ac6beff6e9a13f6d544==>REMOVED_SECRET' > secrets.txt
echo 'sk-286b643e163489c7eb9038d8967cb69f==>REMOVED_SECRET' >> secrets.txt

# 运行 BFG
java -jar bfg-1.14.0.jar --replace-text secrets.txt course-ai-tutor-main.git

# 强制推送
cd course-ai-tutor-main
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并填入实际值：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置以下必需的环境变量：

```env
# AI API 密钥（从 SiliconFlow 获取）
OPENAI_API_KEY=your-new-api-key-here
SILICONFLOW_API_KEY=your-new-api-key-here

# JWT 密钥（生产环境使用强随机字符串，至少32位）
JWT_SECRET=$(openssl rand -base64 32)
NODE_JWT_SECRET=$(openssl rand -base64 32)
```

### 4. 验证配置

启动服务前验证环境变量是否正确设置：

```bash
# 检查环境变量是否设置
echo $OPENAI_API_KEY
echo $JWT_SECRET

# 启动服务并检查日志
cd course-ai-tutor-spring
mvn spring-boot:run
```

如果看到 "Missing required environment variable" 错误，说明配置正确（服务会拒绝启动直到配置完成）。

## 🔒 安全最佳实践

### API 密钥管理

1. **永远不要**将 API 密钥提交到版本控制系统
2. 使用环境变量或密钥管理服务（如 HashiCorp Vault、AWS Secrets Manager）
3. 定期轮换 API 密钥
4. 限制 API 密钥的使用范围和配额

### JWT 密钥

1. 生产环境使用至少 32 位的随机字符串
2. 使用 `openssl rand -base64 32` 生成强密钥
3. 不同环境使用不同的密钥
4. 定期轮换密钥

### 数据库安全

1. 生产环境使用 PostgreSQL/MySQL 替代 sql.js
2. 启用数据库加密（TDE）
3. 实施定期备份
4. 限制数据库访问权限

### 网络安全

1. 生产环境启用 HTTPS
2. 配置 CORS 限制特定域名
3. 实施速率限制
4. 使用 WAF（Web Application Firewall）

## 📋 安全检查清单

部署前请确认：

- [ ] 所有硬编码密钥已移除
- [ ] `.env` 文件已添加到 `.gitignore`
- [ ] JWT 密钥使用强随机字符串
- [ ] API 密钥通过环境变量配置
- [ ] CORS 配置限制为可信域名
- [ ] 启用了速率限制
- [ ] 数据库使用强密码
- [ ] 生产环境启用 HTTPS
- [ ] 错误消息不泄露内部实现细节
- [ ] 实施了输入验证和 sanitization

## 🆘 报告安全问题

如果您发现任何安全漏洞，请通过以下方式报告：

- Email: security@example.com
- GitHub Security Advisories: [创建安全公告](https://github.com/your-repo/security/advisories/new)

**请不要在公开 issue 中报告安全漏洞。**
