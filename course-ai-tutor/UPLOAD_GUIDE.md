# 📦 网盘上传指南

## 项目已打包

**压缩包位置**: `/tmp/course-ai-tutor.tar.gz`  
**文件大小**: 14KB  
**包含内容**: course-ai-tutor 项目全部源代码

---

## 方案一：手动上传（推荐）

### 百度网盘

1. **访问**: https://pan.baidu.com

2. **登录账号**

3. **创建文件夹**:
   - 点击"新建文件夹"
   - 命名为：`course-ai-tutor`
   - 或者：`AI 项目/课程辅导智能体`

4. **上传文件**:
   - 进入新建的文件夹
   - 点击"上传" → "文件"
   - 选择 `/tmp/course-ai-tutor.tar.gz`
   - 等待上传完成

### 夸克网盘

1. **访问**: https://pan.quark.cn

2. **登录账号**

3. **创建文件夹**:
   - 点击"新建文件夹"
   - 命名为：`course-ai-tutor`
   - 或者：`AI 项目/课程辅导智能体`

4. **上传文件**:
   - 进入文件夹
   - 拖拽 `/tmp/course-ai-tutor.tar.gz` 到浏览器
   - 或点击"上传"按钮选择文件

---

## 方案二：使用命令行工具

### 安装百度网盘 CLI

```bash
# 安装 baidupcs-web（推荐）
git clone https://github.com/liupeng0518/baidupcs-web.git
cd baidupcs-web
npm install
npm start

# 访问 http://localhost:5299 进行上传
```

### 安装夸克网盘 CLI

```bash
# 使用 quark-cli
pip install quark-cli
quark login
quark mkdir /course-ai-tutor
quark upload /tmp/course-ai-tutor.tar.gz /course-ai-tutor/
```

---

## 方案三：使用 rclone（高级）

### 安装 rclone

```bash
curl https://rclone.org/install.sh | sudo bash
```

### 配置百度网盘

```bash
rclone config
# 选择"百度网盘"，按提示完成认证
```

### 配置夸克网盘

```bash
rclone config
# 选择"夸克网盘"，按提示完成认证
```

### 上传文件

```bash
# 创建文件夹
rclone mkdir baidu:/course-ai-tutor
rclone mkdir quark:/course-ai-tutor

# 上传文件
rclone copy /tmp/course-ai-tutor.tar.gz baidu:/course-ai-tutor/
rclone copy /tmp/course-ai-tutor.tar.gz quark:/course-ai-tutor/
```

---

## 方案四：使用 Git 仓库（推荐用于代码管理）

### GitHub

```bash
cd ~/.openclaw/workspace/course-ai-tutor

# 初始化 Git
git init

# 添加文件
git add .

# 提交
git commit -m "Initial commit: Course AI Tutor project"

# 关联远程仓库（需要先创建）
git remote add origin https://github.com/yourusername/course-ai-tutor.git

# 推送
git push -u origin main
```

### Gitee（国内）

```bash
# 类似 GitHub，访问 https://gitee.com 创建仓库后推送
git remote add origin https://gitee.com/yourusername/course-ai-tutor.git
git push -u origin main
```

---

## 📋 建议的文件夹结构

在网盘中建议这样组织：

```
网盘根目录/
├── AI 项目/
│   ├── course-ai-tutor/          ← 上传到这里
│   │   └── course-ai-tutor.tar.gz
│   ├── 其他 AI 项目/
│   └── ...
├── 学习资料/
└── ...
```

---

## 🔐 安全提示

1. **不要上传敏感信息**
   - API Key
   - 数据库密码
   - 个人隐私数据

2. **建议加密**
   ```bash
   # 使用 7z 加密压缩
   7z a -p密码 course-ai-tutor.7z course-ai-tutor/
   ```

3. **定期备份**
   - 建议每周备份一次
   - 使用多个网盘做冗余

---

## ✅ 快速操作

**最简单的方式**：

1. 打开浏览器
2. 访问百度网盘/夸克网盘
3. 新建文件夹 `course-ai-tutor`
4. 上传 `/tmp/course-ai-tutor.tar.gz`

---

**项目位置**: `/home/admin/.openclaw/workspace/course-ai-tutor`  
**压缩包位置**: `/tmp/course-ai-tutor.tar.gz`

需要我帮你安装命令行工具吗？🚀
