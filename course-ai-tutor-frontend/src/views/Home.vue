<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container">
      <!-- 动态背景 -->
      <div class="animated-bg">
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>
        <div class="bg-shape shape-3"></div>
        <!-- 漂浮的小星星 -->
        <div class="star star-1">⭐</div>
        <div class="star star-2">🌟</div>
        <div class="star star-3">✨</div>
      </div>

      <el-container class="main-layout">
        <!-- 侧边栏 -->
        <el-aside width="290px" class="glass-sidebar">
          <div class="logo-section">
            <div class="logo-icon">
              <span class="mascot-avatar">🦊</span>
            </div>
            <div class="logo-text">
              <h1>AI 学习伙伴</h1>
              <p>和小伙伴一起学习吧！</p>
            </div>
          </div>

          <!-- 等级进度条 -->
          <div class="level-card">
            <div class="level-info">
              <span class="level-badge">Lv.{{ userLevel }}</span>
              <span class="level-name">{{ levelName }}</span>
            </div>
            <el-progress
              :percentage="expProgress"
              :stroke-width="8"
              :show-text="false"
              color="linear-gradient(90deg, #FFD700, #FFA500)"
            />
            <div class="exp-text">{{ exp }}/{{ nextLevelExp }} 经验值</div>
          </div>

          <el-menu
            :default-active="activeMenu"
            router
            class="sidebar-menu"
            background-color="transparent"
          >
            <el-menu-item index="/planner" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                  <span class="icon-emoji">🗺️</span>
                </span>
                <span class="menu-text">学习规划</span>
                <span class="menu-badge">开始冒险</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/tutor" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                  <span class="icon-emoji">👨‍🏫</span>
                </span>
                <span class="menu-text">智能教学</span>
                <span class="menu-badge">解锁知识</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/helper" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                  <span class="icon-emoji">💬</span>
                </span>
                <span class="menu-text">实时答疑</span>
                <span class="menu-badge">随时提问</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/evaluator" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
                  <span class="icon-emoji">📝</span>
                </span>
                <span class="menu-text">学习评估</span>
                <span class="menu-badge">挑战测试</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/battle" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                  <span class="icon-emoji">⚔️</span>
                </span>
                <span class="menu-text">PK 对战</span>
                <span class="menu-badge">实时竞技</span>
              </div>
            </el-menu-item>

            <el-divider style="margin: 8px 16px; border-color: rgba(102, 126, 234, 0.2);" />

            <el-menu-item index="/statistics" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)">
                  <span class="icon-emoji">📊</span>
                </span>
                <span class="menu-text">成长记录</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/achievements" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%)">
                  <span class="icon-emoji">🏆</span>
                </span>
                <span class="menu-text">成就中心</span>
                <span class="menu-badge">收集徽章</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/profile" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)">
                  <span class="icon-emoji">👤</span>
                </span>
                <span class="menu-text">个人中心</span>
              </div>
            </el-menu-item>

            <el-divider style="margin: 8px 16px; border-color: rgba(102, 126, 234, 0.2);" />

            <el-menu-item index="/notes" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)">
                  <span class="icon-emoji">📝</span>
                </span>
                <span class="menu-text">我的笔记</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/wrong-questions" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)">
                  <span class="icon-emoji">❌</span>
                </span>
                <span class="menu-text">错题本</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/progress" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)">
                  <span class="icon-emoji">📊</span>
                </span>
                <span class="menu-text">学习进度</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/reminders" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)">
                  <span class="icon-emoji">⏰</span>
                </span>
                <span class="menu-text">学习提醒</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/settings" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)">
                  <span class="icon-emoji">⚙️</span>
                </span>
                <span class="menu-text">系统设置</span>
              </div>
            </el-menu-item>

            <!-- 管理员专属区域 -->
            <div v-if="isAdmin" class="admin-section">
              <el-divider style="margin: 8px 16px; border-color: rgba(102, 126, 234, 0.3);" />
              <div class="admin-label">🔧 管理工具</div>
              
              <el-menu-item index="/admin" class="menu-item admin-menu-item">
                <div class="menu-content">
                  <span class="menu-icon admin-icon">
                    <span class="icon-emoji">🛡️</span>
                  </span>
                  <span class="menu-text">后台管理</span>
                  <span class="admin-badge">ADMIN</span>
                </div>
              </el-menu-item>
            </div>
          </el-menu>

          <div class="sidebar-footer">
            <div class="user-card">
              <el-avatar :size="50" class="user-avatar">
                <span class="avatar-emoji">🧑‍🎓</span>
              </el-avatar>
              <div class="user-info">
                <span class="user-name">{{ userName }}</span>
                <div class="streak-info">
                  <span class="streak-icon">🔥</span>
                  <span class="streak-days">连续学习 {{ streakDays }} 天</span>
                </div>
              </div>
            </div>
          </div>
        </el-aside>

        <!-- 主内容区 -->
        <el-container>
          <el-header class="glass-header">
            <div class="header-content">
              <div class="breadcrumb">
                <span class="breadcrumb-icon">🏠</span>
                <span>首页</span>
                <span class="breadcrumb-arrow">→</span>
                <span class="current">{{ currentPage }}</span>
              </div>

              <div class="header-actions">
                <!-- 今日任务 -->
                <div class="daily-quest">
                  <span class="quest-icon">📋</span>
                  <span class="quest-text">今日任务：{{ dailyTasks }}/3</span>
                  <el-badge :value="3 - dailyTasks" :hidden="dailyTasks >= 3" type="warning" />
                </div>

                <el-tooltip content="通知" placement="bottom">
                  <el-badge :value="3" class="action-item">
                    <el-button circle size="large" class="icon-btn">
                      <span class="btn-emoji">🔔</span>
                    </el-button>
                  </el-badge>
                </el-tooltip>

                <el-tooltip content="退出登录" placement="bottom">
                  <el-button circle class="action-item icon-btn" @click="handleLogout" size="large">
                    <span class="btn-emoji">🚪</span>
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </el-header>

          <el-main class="main-content">
            <router-view />
          </el-main>
        </el-container>
      </el-container>
    </div>
  </el-config-provider>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElConfigProvider, ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 用户游戏化数据 - 从 userStore 获取真实数据
const userLevel = computed(() => userStore.user?.level || 1)
const exp = computed(() => userStore.user?.experience || 0)
const nextLevelExp = computed(() => userLevel.value * 400)
const userName = computed(() => userStore.user?.nickname || userStore.user?.username || '同学')
const streakDays = ref(0)
const dailyTasks = ref(0)

// 管理员权限判断
const isAdmin = computed(() => {
  const role = userStore.user?.role || localStorage.getItem('userRole')
  return role === 'admin'
})

const activeMenu = computed(() => route.path)

const expProgress = computed(() => {
  return Math.round((exp.value / nextLevelExp.value) * 100)
})

const levelName = computed(() => {
  const names = ['初学者', '小学徒', '探索者', '冒险家', '挑战者', '勇士', '英雄', '传奇']
  return names[userLevel.value - 1] || '传奇'
})

const currentPage = computed(() => {
  const pageMap = {
    '/planner': '学习规划',
    '/tutor': '智能教学',
    '/helper': '实时答疑',
    '/evaluator': '学习评估',
    '/profile': '个人中心',
    '/statistics': '成长记录',
    '/achievements': '成就中心',
    '/battle': 'PK 对战',
    '/notes': '我的笔记',
    '/wrong-questions': '错题本',
    '/progress': '学习进度',
    '/reminders': '学习提醒',
    '/settings': '系统设置',
    '/admin': '后台管理'
  }
  return pageMap[route.path] || '首页'
})

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userId')
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('isAdmin')
  localStorage.removeItem('username')
  localStorage.removeItem('userRole')
  userStore.logout()
  ElMessage.success('下次见啦～')
  router.push('/login')
}

// 获取侧边栏真实数据
onMounted(async () => {
  try {
    const token = localStorage.getItem('token')

    // 如果是模拟token，使用默认数据
    if (!token || token.startsWith('mock-token-')) {
      console.log('模拟模式：使用默认学习数据')
      streakDays.value = 0
      dailyTasks.value = 0
      return
    }

    const { data } = await axios.get(`${API_BASE_URL}/learning/statistics`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    })
    if (data.success) {
      const stats = data.data.statistics
      // 根据学习记录数推算连续天数
      streakDays.value = Math.min(7, Math.ceil(stats.totalDuration / 3600))
      dailyTasks.value = Math.min(3, stats.exerciseCount)
    }
  } catch (e) {
    console.warn('获取学习数据失败:', e.message)
    streakDays.value = 0
    dailyTasks.value = 0
  }
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  overflow: hidden;
  overflow-x: hidden;
  position: relative;
}

/* 动态背景 */
.animated-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

/* 漂浮星星 */
.star {
  position: absolute;
  font-size: 24px;
  animation: twinkle 3s infinite ease-in-out;
  opacity: 0.6;
}

.star-1 { top: 10%; left: 10%; animation-delay: 0s; }
.star-2 { top: 60%; left: 80%; animation-delay: 1s; }
.star-3 { top: 80%; left: 20%; animation-delay: 2s; }

@keyframes twinkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  animation: float 20s infinite ease-in-out;
  opacity: 0.1;
}

.shape-1 {
  width: 400px;
  height: 400px;
  background: white;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.shape-2 {
  width: 300px;
  height: 300px;
  background: white;
  bottom: -50px;
  left: -50px;
  animation-delay: -5s;
}

.shape-3 {
  width: 200px;
  height: 200px;
  background: white;
  top: 50%;
  left: 50%;
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* 主布局 */
.main-layout {
  position: relative;
  z-index: 1;
  height: 100vh;
  overflow-x: hidden;
}

/* 玻璃态侧边栏 */
.glass-sidebar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

/* 隐藏侧边栏滚动条 */
.glass-sidebar::-webkit-scrollbar {
  display: none;
}

.glass-sidebar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.logo-section {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.logo-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  font-size: 32px;
}

.mascot-avatar {
  animation: bounce 2s infinite ease-in-out;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.logo-text h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
}

.logo-text p {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #718096;
}

/* 等级卡片 */
.level-card {
  margin: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.15) 100%);
  border-radius: 16px;
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.level-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.level-badge {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(255, 165, 0, 0.4);
}

.level-name {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.exp-text {
  font-size: 11px;
  color: #718096;
  margin-top: 6px;
  text-align: center;
}

/* 菜单样式 */
.sidebar-menu {
  flex: 1;
  padding: 12px;
  border-right: none;
}

.menu-item {
  margin-bottom: 10px;
  border-radius: 16px;
  transition: all 0.3s ease;
  height: 56px;
}

.menu-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(5px);
}

.menu-item.is-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border-left: 4px solid #667eea;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.2);
}

.menu-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.icon-emoji {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.menu-text {
  font-size: 15px;
  font-weight: 600;
  color: #2d3748;
  flex: 1;
}

.menu-badge {
  font-size: 10px;
  color: #718096;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

/* 管理员区域 */
.admin-section {
  margin-top: 8px;
}

.admin-label {
  padding: 8px 20px;
  font-size: 11px;
  font-weight: 700;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.8;
}

.admin-menu-item {
  position: relative;
  overflow: hidden;
}

.admin-menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.admin-menu-item:hover::before {
  left: 100%;
}

.admin-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
  animation: adminPulse 2s infinite ease-in-out;
}

@keyframes adminPulse {
  0%, 100% { 
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    transform: scale(1.05);
  }
}

.admin-menu-item.is-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%) !important;
  border-left: 4px solid #764ba2 !important;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3) !important;
}

.admin-badge {
  font-size: 9px;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 3px 8px;
  border-radius: 8px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 16px;
  border: 2px solid rgba(102, 126, 234, 0.2);
}

.user-avatar {
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-emoji {
  font-size: 28px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 15px;
  font-weight: 700;
  color: #2d3748;
}

.streak-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #718096;
}

.streak-icon {
  font-size: 14px;
  animation: flicker 1s infinite alternate;
}

@keyframes flicker {
  0% { opacity: 0.7; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.1); }
}

/* 玻璃态顶栏 */
.glass-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #718096;
}

.breadcrumb-icon {
  font-size: 18px;
}

.breadcrumb-arrow {
  color: #a0aec0;
}

.breadcrumb .current {
  color: #667eea;
  font-weight: 700;
  font-size: 15px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 今日任务 */
.daily-quest {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.15) 100%);
  border-radius: 20px;
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.quest-icon {
  font-size: 18px;
}

.quest-text {
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
}

.icon-btn {
  font-size: 20px;
  width: 48px;
  height: 48px;
}

.btn-emoji {
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.action-item {
  position: relative;
}

/* 主内容区 */
.main-content {
  background: rgba(255, 255, 255, 0.6);
  padding: 24px;
  overflow-x: hidden;
  overflow-y: auto;
  border-radius: 20px 0 0 0;
  min-height: calc(100vh - 64px);
}

/* 滚动条美化 */
.main-content::-webkit-scrollbar {
  width: 10px;
}

.main-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.main-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}
</style>
