<template>
  <div class="login-page">
    <!-- 动态背景 -->
    <div class="animated-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>

    <div class="login-container">
      <el-card class="login-card" shadow="never">
        <div class="login-header">
          <div class="logo-section">
            <div class="logo-icon">
              <el-icon :size="48"><Reading /></el-icon>
            </div>
            <h1 class="app-title">课程辅导 AI</h1>
            <p class="app-subtitle">智能学习伙伴</p>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="login-tabs" size="large">
          <!-- 登录 -->
          <el-tab-pane label="登录" name="login">
            <!-- 角色选择 -->
            <div class="role-selector">
              <el-radio-group v-model="userRole" size="large">
                <el-radio-button value="student" class="role-btn">
                  <span class="role-icon">🎓</span> 学生
                </el-radio-button>
                <el-radio-button value="teacher" class="role-btn">
                  <span class="role-icon">👨‍🏫</span> 教师
                </el-radio-button>
              </el-radio-group>
            </div>

            <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" size="large">
              <el-form-item prop="username">
                <el-input
                  v-model="loginForm.username"
                  placeholder="请输入用户名"
                  class="gradient-input"
                  clearable
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="请输入密码"
                  show-password
                  class="gradient-input"
                  clearable
                  @keydown.enter="handleLogin"
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item>
                <div class="login-options">
                  <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
                  <el-link type="primary" :underline="false">忘记密码？</el-link>
                </div>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  size="large"
                  :loading="loading"
                  @click="handleLogin"
                  class="gradient-btn full-width"
                >
                  <el-icon v-if="!loading"><CircleCheck /></el-icon>
                  <el-icon v-else class="is-loading"><Loading /></el-icon>
                  {{ loading ? '登录中...' : '登录' }}
                </el-button>
              </el-form-item>

              <!-- 管理员入口 -->
              <div class="admin-entry">
                <el-link 
                  :underline="false" 
                  class="admin-link"
                  @click="showAdminRole"
                >
                  <el-icon :size="12"><Lock /></el-icon>
                  管理员入口
                </el-link>
              </div>
            </el-form>
          </el-tab-pane>

          <!-- 注册 -->
          <el-tab-pane label="注册" name="register">
            <!-- 角色选择 -->
            <div class="role-selector">
              <el-radio-group v-model="userRole" size="large">
                <el-radio-button value="student" class="role-btn">
                  <span class="role-icon">🎓</span> 学生
                </el-radio-button>
                <el-radio-button value="teacher" class="role-btn">
                  <span class="role-icon">👨‍🏫</span> 教师
                </el-radio-button>
              </el-radio-group>
            </div>

            <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" size="large">
              <el-form-item prop="username">
                <el-input
                  v-model="registerForm.username"
                  placeholder="请输入用户名（3-20 位）"
                  class="gradient-input"
                  clearable
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item prop="email">
                <el-input
                  v-model="registerForm.email"
                  placeholder="请输入邮箱"
                  class="gradient-input"
                  clearable
                >
                  <template #prefix>
                    <el-icon><Message /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 教师专用字段 -->
              <template v-if="userRole === 'teacher'">
                <el-form-item prop="teacherId">
                  <el-input
                    v-model="registerForm.teacherId"
                    placeholder="请输入教师编号"
                    class="gradient-input"
                    clearable
                  >
                    <template #prefix>
                      <el-icon><School /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item prop="subject">
                  <el-input
                    v-model="registerForm.subject"
                    placeholder="请输入教学科目，如：计算机科学"
                    class="gradient-input"
                    clearable
                  >
                    <template #prefix>
                      <el-icon><Notebook /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </template>

              <el-form-item prop="password">
                <el-input
                  v-model="registerForm.password"
                  type="password"
                  placeholder="请输入密码（至少 6 位）"
                  show-password
                  class="gradient-input"
                  clearable
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="registerForm.confirmPassword"
                  type="password"
                  placeholder="请确认密码"
                  show-password
                  class="gradient-input"
                  clearable
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  size="large"
                  :loading="loading"
                  @click="handleRegister"
                  class="gradient-btn full-width"
                >
                  <el-icon v-if="!loading"><CircleCheck /></el-icon>
                  <el-icon v-else class="is-loading"><Loading /></el-icon>
                  {{ loading ? '注册中...' : '注册' }}
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>

        <div class="login-footer">
          <p>登录即代表您同意 <el-link type="primary">用户协议</el-link> 和 <el-link type="primary">隐私政策</el-link></p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import { useUserStore } from '@/stores'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('login')
const userRole = ref('student')
const loading = ref(false)

const loginFormRef = ref(null)
const registerFormRef = ref(null)

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

const registerForm = reactive({
  username: '',
  email: '',
  teacherId: '',
  subject: '',
  password: '',
  confirmPassword: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ]
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const getRoleLabel = (role) => {
  const map = { student: '学生', teacher: '教师', admin: '管理员' }
  return map[role] || role
}

// 显示管理员角色选项
const showAdminRole = () => {
  userRole.value = 'admin'
  ElMessage.info('已切换到管理员登录模式')
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      // 调用 user store 的登录方法
      await userStore.login({
        username: loginForm.username,
        password: loginForm.password
      })

      ElNotification({
        title: '✅ 登录成功',
        message: `欢迎回来，${getRoleLabel(userStore.role)} ${loginForm.username}！`,
        type: 'success',
        duration: 2000
      })

      // 根据角色跳转
      setTimeout(() => {
        if (userStore.role === 'teacher') {
          router.push('/teacher/dashboard')
        } else if (userStore.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/planner')
        }
      }, 500)

    } catch (error) {
      console.error('登录错误:', error)
      const errorMsg = error.response?.data?.message || error.message || '登录失败，请稍后重试'
      ElMessage.error(errorMsg)
    } finally {
      loading.value = false
    }
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      // 调用 user store 的注册方法
      await userStore.register({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        role: userRole.value
      })

      ElNotification({
        title: '✅ 注册成功',
        message: `${getRoleLabel(userRole.value)}账号已创建，请登录`,
        type: 'success',
        duration: 2000
      })

      // 切换到登录标签
      activeTab.value = 'login'
      // 清空注册表单
      registerForm.username = ''
      registerForm.email = ''
      registerForm.teacherId = ''
      registerForm.subject = ''
      registerForm.password = ''
      registerForm.confirmPassword = ''

    } catch (error) {
      console.error('注册错误:', error)
      const errorMsg = error.response?.data?.message || error.message || '注册失败，请稍后重试'
      ElMessage.error(errorMsg)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 动态背景 */
.animated-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  animation: float 20s infinite ease-in-out;
  opacity: 0.1;
  background: white;
}

.shape-1 { width: 400px; height: 400px; top: -100px; right: -100px; }
.shape-2 { width: 300px; height: 300px; bottom: -50px; left: -50px; animation-delay: -5s; }
.shape-3 { width: 200px; height: 200px; top: 50%; left: 50%; animation-delay: -10s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* 登录容器 */
.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
  padding: 20px;
  animation: fadeInUp 0.6s ease;
}

/* 登录卡片 */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

/* 登录头部 */
.login-header {
  text-align: center;
  padding: 40px 20px 20px;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.app-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #718096;
}

/* 角色选择 */
.role-selector {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.role-selector :deep(.el-radio-group) {
  display: inline-flex;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.role-btn {
  font-size: 15px;
  padding: 10px 20px;
}

.role-btn :deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none !important;
  border-radius: 0 !important;
  padding: 10px 20px;
}

.role-icon {
  font-size: 18px;
}

/* 标签页 */
.login-tabs {
  padding: 0 20px;
}

.login-tabs :deep(.el-tabs__header) {
  background: rgba(102, 126, 234, 0.05);
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.login-tabs :deep(.el-tabs__item) {
  padding: 12px 24px;
  border-radius: 8px;
  text-align: center;
  font-size: 16px;
}

.login-tabs :deep(.el-tabs__item.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 输入框 */
.gradient-input :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0.8) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(102, 126, 234, 0.2);
  padding: 14px 16px;
  border-radius: 10px;
}

.gradient-input :deep(.el-input__wrapper:hover),
.gradient-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

/* 登录选项 */
.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 按钮 */
.gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  font-size: 16px;
  padding: 14px 24px;
}

.gradient-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.4);
}

.full-width {
  width: 100%;
}

/* 底部 */
.login-footer {
  padding: 20px;
  text-align: center;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.login-footer p {
  margin: 0;
  font-size: 12px;
  color: #718096;
}

/* 管理员入口 */
.admin-entry {
  margin-top: 12px;
  text-align: center;
}

.admin-link {
  font-size: 12px;
  color: #a0aec0;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.admin-link:hover {
  color: #667eea;
  opacity: 1;
}

.admin-link :deep(.el-icon) {
  margin-right: 4px;
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
