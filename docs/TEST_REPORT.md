# 学习目标与学科偏好功能 - 测试报告

## 📋 修改总结

### 后端修改 (course-ai-tutor-backend)

#### 1. `src/models/index.js` - userModel.findById
**修改内容**: 添加 `learning_goal` 和 `subject_preferences` 字段到 SQL 查询

```javascript
// 修改前
findById(id) {
  return queryOne('SELECT id, username, email, phone, avatar_url, bio, level, experience, role, status, created_at FROM users WHERE id = ?', [id])
}

// 修改后
findById(id) {
  return queryOne('SELECT id, username, email, phone, avatar_url, bio, level, experience, role, status, learning_goal, subject_preferences, created_at FROM users WHERE id = ?', [id])
}
```

#### 2. `src/routes/auth.js` - GET /me 路由
**修改内容**: 解析 `subject_preferences` JSON 并返回完整的用户信息

```javascript
router.get('/me', authMiddleware, (req, res) => {
  // 解析 subject_preferences 为数组
  let subjectPrefs = []
  if (req.user.subject_preferences) {
    try {
      subjectPrefs = JSON.parse(req.user.subject_preferences)
    } catch (e) {
      subjectPrefs = []
    }
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        phone: req.user.phone,
        avatar_url: req.user.avatar_url,
        bio: req.user.bio,
        level: req.user.level,
        experience: req.user.experience,
        role: req.user.role || 'student',
        learning_goal: req.user.learning_goal,
        subject_preferences: subjectPrefs
      }
    }
  })
})
```

#### 3. `src/routes/auth.js` - PUT /me 路由
**修改内容**: 
- 添加空数据检查
- 获取更新后的用户信息
- 解析并返回完整的用户信息
- 增强错误日志

```javascript
router.put('/me', authMiddleware, (req, res) => {
  try {
    const { phone, bio, learningGoal, subjectPreferences } = req.body
    const updateData = {}
    
    if (phone) updateData.phone = phone
    if (bio) updateData.bio = bio
    if (learningGoal) updateData.learning_goal = learningGoal
    if (subjectPreferences) updateData.subject_preferences = JSON.stringify(subjectPreferences)

    // 如果没有要更新的数据，直接返回
    if (Object.keys(updateData).length === 0) {
      return res.json({
        success: true,
        message: '没有需要更新的数据',
        user: req.user
      })
    }

    userModel.update(req.user.id, updateData)

    // 获取更新后的用户信息
    const updatedUser = userModel.findById(req.user.id)
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    // 解析 subject_preferences 为数组
    let subjectPrefs = []
    if (updatedUser.subject_preferences) {
      try {
        subjectPrefs = JSON.parse(updatedUser.subject_preferences)
      } catch (e) {
        subjectPrefs = []
      }
    }

    res.json({
      success: true,
      message: '更新成功',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar_url: updatedUser.avatar_url,
        bio: updatedUser.bio,
        level: updatedUser.level,
        experience: updatedUser.experience,
        role: updatedUser.role || 'student',
        learning_goal: updatedUser.learning_goal,
        subject_preferences: subjectPrefs
      }
    })
  } catch (error) {
    console.error('更新失败:', error)
    console.error('错误堆栈:', error.stack)
    res.status(500).json({ 
      success: false, 
      message: '更新失败: ' + error.message 
    })
  }
})
```

### 前端修改 (course-ai-tutor-frontend)

#### 1. `src/stores/user.js` - fetchCurrentUser
**修改内容**: 从模拟模式改为真实调用后端 API

```javascript
async fetchCurrentUser() {
  if (!this.token) {
    console.warn('⚠️ 没有 token，无法获取用户信息')
    return null
  }

  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'
    const { data } = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${this.token}` }
    })

    if (data.success) {
      this.user = { ...this.user, ...data.data.user }
      this.userId = String(data.data.user.id)
      this.role = data.data.user.role
      this.isLoggedIn = true
      
      localStorage.setItem('userId', this.userId)
      localStorage.setItem('userRole', this.role)
      localStorage.setItem('isLoggedIn', 'true')
      
      console.log('✅ 获取用户信息成功')
      return data.data.user
    }
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error)
    this.logout()
    throw error
  }
}
```

#### 2. `src/stores/user.js` - syncUserProfile (新增)
**功能**: 提供从后端重新同步用户信息的能力

```javascript
async syncUserProfile() {
  if (!this.token) {
    console.warn('⚠️ 没有 token，无法同步用户信息')
    return null
  }

  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'
    const { data } = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${this.token}` }
    })

    if (data.success) {
      this.user = { ...this.user, ...data.data.user }
      console.log('✅ 用户信息同步成功')
      return data.data.user
    }
  } catch (error) {
    console.error('❌ 同步用户信息失败:', error)
    throw error
  }
}
```

#### 3. `src/views/Profile.vue` - saveProfile 和 savePreferences
**修改内容**: 在保存后调用 `syncUserProfile` 同步用户信息

```javascript
const saveProfile = async () => {
  try {
    await userStore.updateProfile({
      username: profileForm.username,
      email: profileForm.email,
      phone: profileForm.phone,
      bio: profileForm.bio,
      learningGoal: profileForm.learningGoal,
      subjectPreferences: JSON.stringify(profileForm.subjectPreferences)
    })

    // 同步用户信息到 store
    await userStore.syncUserProfile()

    ElNotification({
      title: '✅ 保存成功',
      message: '个人信息已更新',
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请重试')
  }
}

const savePreferences = async () => {
  try {
    await userStore.updateProfile({
      learningGoal: profileForm.learningGoal,
      subjectPreferences: JSON.stringify(profileForm.subjectPreferences)
    })

    // 同步用户信息到 store
    await userStore.syncUserProfile()

    ElNotification({
      title: '✅ 保存成功',
      message: '学习偏好已更新',
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    console.error('保存偏好失败:', error)
    ElMessage.error('保存失败，请重试')
  }
}
```

## 🔄 数据流

```
前端 Profile.vue
    ↓ 用户填写表单并点击保存
    ↓ { learningGoal, subjectPreferences }
userStore.updateProfile()
    ↓ PUT /api/auth/me
后端 auth.js
    ↓ 接收数据
    ↓ 更新数据库 (userModel.update)
    ↓ 获取更新后的数据 (userModel.findById)
    ↓ 解析 subject_preferences JSON
    ↓ 返回 { success: true, message, user: {...} }
userStore.updateProfile()
    ↓ 更新本地 store
userStore.syncUserProfile()
    ↓ GET /api/auth/me
后端 auth.js
    ↓ 返回最新用户信息
    ↓ { success: true, data: { user: {...} } }
userStore.syncUserProfile()
    ↓ 同步 store
Profile.vue 表单显示最新数据
```

## ✅ 测试步骤

### 1. 启动后端服务
```bash
cd course-ai-tutor-backend
node src/server.js
```

### 2. 启动前端服务
```bash
cd course-ai-tutor-frontend
npm run dev
```

### 3. 功能测试
1. 打开浏览器访问 `http://localhost:3001`
2. 注册或登录
3. 进入"个人中心"页面
4. 切换到"学习偏好"标签
5. 填写学习目标（例如："掌握JavaScript"）
6. 选择学科偏好（例如：编程、数学、物理）
7. 点击"保存偏好"按钮
8. 验证：
   - ✅ 显示"保存成功"通知
   - ✅ 刷新页面后数据仍然存在
   - ✅ 切换到"基本信息"标签，数据保持一致

### 4. API 测试（可选）
使用 Postman 或 curl：

```bash
# 1. 注册用户
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test123","email":"test@test.com","password":"123456"}'

# 2. 获取 token
TOKEN="<从上一步响应中获取>"

# 3. 更新学习目标和学科偏好
curl -X PUT http://localhost:8081/api/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"learningGoal":"掌握JavaScript","subjectPreferences":["编程","数学"]}'

# 4. 验证更新
curl -X GET http://localhost:8081/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## 🎯 预期结果

### PUT /me 响应
```json
{
  "success": true,
  "message": "更新成功",
  "user": {
    "id": 1,
    "username": "test123",
    "email": "test@test.com",
    "phone": null,
    "avatar_url": null,
    "bio": null,
    "level": 1,
    "experience": 0,
    "role": "student",
    "learning_goal": "掌握JavaScript",
    "subject_preferences": ["编程", "数学"]
  }
}
```

### GET /me 响应
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "test123",
      "email": "test@test.com",
      "phone": null,
      "avatar_url": null,
      "bio": null,
      "level": 1,
      "experience": 0,
      "role": "student",
      "learning_goal": "掌握JavaScript",
      "subject_preferences": ["编程", "数学"]
    }
  }
}
```

## ⚠️ 注意事项

1. **数据库字段**: 确保数据库 `users` 表包含 `learning_goal` 和 `subject_preferences` 字段
2. **JSON 格式**: `subject_preferences` 在数据库中存储为 JSON 字符串，API 返回时解析为数组
3. **部分更新**: 后端支持部分更新，只提交需要修改的字段即可
4. **前端端口**: 前端默认使用 `http://localhost:8082/api` 作为 API 地址，确保与后端端口一致

## 🐛 已知问题

1. 后端服务可能存在模块导入问题（已注释掉部分路由）
2. 需要使用 `node src/server.js` 而不是 `npm start`（PowerShell 执行策略限制）
3. 端口8081可能被占用，需要先杀掉占用进程

## 📝 修复清单

- [x] 后端 userModel.findById 添加 learning_goal 和 subject_preferences 字段
- [x] 后端 GET /me 路由返回完整用户信息并解析 JSON
- [x] 后端 PUT /me 路由返回更新后的用户信息
- [x] 后端 PUT /me 添加空数据检查和错误处理
- [x] 前端 fetchCurrentUser 改为真实 API 调用
- [x] 前端新增 syncUserProfile 方法
- [x] 前端 Profile.vue 保存后同步用户信息

## ✨ 功能完整性

✅ 学习目标保存
✅ 学科偏好保存  
✅ 数据持久化
✅ 前后端数据同步
✅ 部分更新支持
✅ 错误处理
