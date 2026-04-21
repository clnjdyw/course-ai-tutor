<template>
  <div class="profile-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon :size="24"><User /></el-icon>
            </div>
            <div>
              <h2>👤 个人中心</h2>
              <p>管理您的个人信息和学习数据</p>
            </div>
          </div>
        </div>
      </template>

      <div class="profile-content">
        <el-row :gutter="30">
          <!-- 左侧信息 -->
          <el-col :span="10">
            <div class="profile-sidebar">
              <div class="avatar-section">
                <el-avatar :size="120" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                <el-button type="primary" circle class="upload-btn">
                  <el-icon><Camera /></el-icon>
                </el-button>
              </div>

              <div class="user-info">
                <h3 class="username">{{ currentUser.username || '用户' }}</h3>
                <el-tag :type="roleType" effect="dark">{{ roleLabel }}</el-tag>
              </div>

              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ profileStats.planCount }}</div>
                  <div class="stat-label">学习计划</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ profileStats.totalDuration }}h</div>
                  <div class="stat-label">学习时长</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ profileStats.exerciseCount }}</div>
                  <div class="stat-label">答题数</div>
                </div>
              </div>

              <div class="level-progress">
                <div class="level-header">
                  <span>当前等级</span>
                  <el-tag size="small">LV.{{ userLevel }}</el-tag>
                </div>
                <el-progress :percentage="levelProgressPercent" :show-text="false" />
                <p class="level-tip">再学习 {{ remainingProgress }}% 即可升级</p>
              </div>
            </div>
          </el-col>

          <!-- 右侧表单 -->
          <el-col :span="14">
            <el-tabs v-model="activeTab" class="profile-tabs">
              <el-tab-pane label="基本信息" name="basic">
                <el-form :model="profileForm" label-width="100px" size="large">
                  <el-form-item label="用户名">
                    <el-input v-model="profileForm.username" class="gradient-input" placeholder="请输入用户名" />
                  </el-form-item>

                  <el-form-item label="邮箱">
                    <el-input v-model="profileForm.email" class="gradient-input" placeholder="请输入邮箱地址">
                      <template #prefix>
                        <el-icon><Message /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="手机">
                    <el-input v-model="profileForm.phone" class="gradient-input" placeholder="请输入手机号码">
                      <template #prefix>
                        <el-icon><Phone /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="个性签名">
                    <el-input
                      v-model="profileForm.bio"
                      type="textarea"
                      :rows="3"
                      placeholder="介绍一下自己"
                      class="gradient-input"
                    />
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" @click="saveProfile" class="gradient-btn">
                      <el-icon><Check /></el-icon>
                      保存修改
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <el-tab-pane label="账号安全" name="security">
                <el-form label-width="100px" size="large">
                  <el-form-item label="当前密码">
                    <el-input type="password" class="gradient-input" />
                  </el-form-item>

                  <el-form-item label="新密码">
                    <el-input type="password" class="gradient-input" />
                  </el-form-item>

                  <el-form-item label="确认密码">
                    <el-input type="password" class="gradient-input" />
                  </el-form-item>

                  <el-form-item>
                    <el-button type="warning" class="gradient-btn orange">
                      <el-icon><Lock /></el-icon>
                      修改密码
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <el-tab-pane label="学习数据" name="learning">
                <div class="learning-stats">
                  <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                      <el-icon :size="24"><Document /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">{{ profileStats.planCount }}</div>
                      <div class="stat-label">进行中计划</div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                      <el-icon :size="24"><Clock /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">{{ profileStats.totalDuration }}h</div>
                      <div class="stat-label">总学习时长</div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                      <el-icon :size="24"><Trophy /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">{{ profileStats.avgScore }}%</div>
                      <div class="stat-label">平均正确率</div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
                      <el-icon :size="24"><Medal /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">{{ profileStats.achievementCount }}</div>
                      <div class="stat-label">获得徽章</div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="学习偏好" name="preferences">
                <el-form :model="profileForm" label-width="100px" size="large">
                  <el-form-item label="学习目标">
                    <el-input
                      v-model="profileForm.learningGoal"
                      type="textarea"
                      :rows="4"
                      placeholder="例如：掌握 JavaScript 基础语法，通过英语四级考试..."
                      class="gradient-input"
                    />
                  </el-form-item>

                  <el-form-item label="学科偏好">
                    <el-select
                      v-model="profileForm.subjectPreferences"
                      multiple
                      filterable
                      placeholder="选择你感兴趣的学科"
                      class="gradient-input"
                      style="width: 100%"
                    >
                      <el-option label="🔢 数学" value="数学" />
                      <el-option label="📖 英语" value="英语" />
                      <el-option label="💻 编程" value="编程" />
                      <el-option label="⚡ 物理" value="物理" />
                      <el-option label="🧪 化学" value="化学" />
                      <el-option label="📜 历史" value="历史" />
                      <el-option label="🌍 地理" value="地理" />
                      <el-option label="🎨 艺术" value="艺术" />
                    </el-select>
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" @click="savePreferences" class="gradient-btn">
                      <el-icon><Check /></el-icon>
                      保存偏好
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>
            </el-tabs>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'

const userStore = useUserStore()
const activeTab = ref('basic')
const loading = ref(false)

// 统计数据状态
const profileStats = reactive({
  planCount: 0,
  totalDuration: 0,
  exerciseCount: 0,
  avgScore: 0,
  achievementCount: 0
})

// 计算属性：等级进度
const userLevel = computed(() => userStore.user?.level || 1)
const userExperience = computed(() => userStore.user?.experience || 0)
const nextLevelExp = computed(() => userLevel.value * 400)
const levelProgressPercent = computed(() => {
  if (nextLevelExp.value === 0) return 0
  return Math.min(100, Math.round((userExperience.value / nextLevelExp.value) * 100))
})
const remainingProgress = computed(() => 100 - levelProgressPercent.value)

// 从 store 或 localStorage 获取用户信息
const currentUser = computed(() => {
  return userStore.user || {
    username: localStorage.getItem('username') || '用户',
    email: '',
    phone: '',
    role: localStorage.getItem('userRole') || 'student'
  }
})

const profileForm = reactive({
  username: currentUser.value.username || '',
  email: currentUser.value.email || '',
  phone: currentUser.value.phone || '',
  bio: currentUser.value.bio || '热爱学习，追求进步',
  learningGoal: currentUser.value.learning_goal || '',
  subjectPreferences: currentUser.value.subject_preferences ? JSON.parse(currentUser.value.subject_preferences) : []
})

// 角色标签映射
const roleLabel = computed(() => {
  const roleMap = {
    admin: '管理员',
    teacher: '教师',
    student: '学生'
  }
  return roleMap[currentUser.value.role] || '用户'
})

const roleType = computed(() => {
  const typeMap = {
    admin: 'danger',
    teacher: 'warning',
    student: 'success'
  }
  return typeMap[currentUser.value.role] || ''
})

// 获取用户统计数据
async function fetchProfileData() {
  loading.value = true
  try {
    const token = localStorage.getItem('token')

    // 模拟数据
    if (!token || token.startsWith('mock-token-')) {
      console.log('模拟模式：使用默认个人数据')
      profileStats.planCount = 0
      profileStats.totalDuration = 0
      profileStats.exerciseCount = 0
      profileStats.avgScore = 0
      profileStats.achievementCount = 0
      loading.value = false
      return
    }

    // 获取学习统计
    const [statsRes, achievementsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/learning/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`${API_BASE_URL}/achievements`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ])

    if (statsRes.data.success) {
      const { statistics } = statsRes.data.data
      profileStats.planCount = statistics.planCount || 0
      profileStats.totalDuration = statistics.totalDuration ? Math.round(statistics.totalDuration / 3600) : 0
      profileStats.exerciseCount = statistics.exerciseCount || 0
      profileStats.avgScore = statistics.avgScore ? Math.round(statistics.avgScore) : 0
    }

    if (achievementsRes.data.success) {
      const { unlockedCount } = achievementsRes.data.data
      profileStats.achievementCount = unlockedCount || 0
    }
  } catch (error) {
    console.error('获取个人数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 初始化表单数据
onMounted(async () => {
  if (currentUser.value) {
    profileForm.username = currentUser.value.username || ''
    profileForm.email = currentUser.value.email || ''
    profileForm.phone = currentUser.value.phone || ''
    profileForm.bio = currentUser.value.bio || '热爱学习，追求进步'
    profileForm.learningGoal = currentUser.value.learning_goal || ''
    try {
      profileForm.subjectPreferences = currentUser.value.subject_preferences
        ? JSON.parse(currentUser.value.subject_preferences)
        : []
    } catch (e) {
      profileForm.subjectPreferences = []
    }
  }
  await fetchProfileData()
})

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
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.card-header h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #2d3748;
}

.card-header p {
  margin: 0;
  font-size: 13px;
  color: #718096;
}

/* 侧边栏 */
.profile-sidebar {
  padding: 20px;
  text-align: center;
}

.avatar-section {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.user-info {
  margin-bottom: 30px;
}

.username {
  margin: 12px 0;
  font-size: 24px;
  color: #2d3748;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 30px;
}

.stat-item {
  padding: 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
}

/* 等级进度 */
.level-progress {
  padding: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.level-tip {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #718096;
  text-align: center;
}

/* 标签页 */
.profile-tabs {
  padding: 20px;
}

.profile-tabs :deep(.el-tabs__header) {
  background: rgba(102, 126, 234, 0.05);
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.profile-tabs :deep(.el-tabs__item.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 输入框 */
.gradient-input :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0.8) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(102, 126, 234, 0.2);
}

.gradient-input :deep(.el-input__wrapper:hover),
.gradient-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

/* 按钮 */
.gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.gradient-btn.orange {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
}

/* 学习统计 */
.learning-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-info {
  flex: 1;
}

.stat-info .stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
}

.stat-info .stat-label {
  font-size: 13px;
  color: #718096;
  margin-top: 4px;
}

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
