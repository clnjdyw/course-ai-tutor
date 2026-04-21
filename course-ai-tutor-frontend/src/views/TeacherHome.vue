<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container">
      <!-- 动态背景 -->
      <div class="animated-bg">
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>
        <div class="bg-shape shape-3"></div>
        <div class="star star-1">⭐</div>
        <div class="star star-2">🌟</div>
        <div class="star star-3">✨</div>
      </div>

      <el-container class="main-layout">
        <!-- 侧边栏 -->
        <el-aside width="290px" class="glass-sidebar">
          <div class="logo-section">
            <div class="logo-icon teacher-logo">
              <span class="mascot-avatar">👨‍🏫</span>
            </div>
            <div class="logo-text">
              <h1>教师工作台</h1>
              <p>管理教学，分析学情</p>
            </div>
          </div>

          <!-- 教师信息卡片 -->
          <div class="teacher-info-card">
            <div class="teacher-avatar">
              <span>🧑‍💼</span>
            </div>
            <div class="teacher-details">
              <span class="teacher-name">{{ teacherName }}</span>
              <span class="teacher-subject">{{ teacherSubject || '未设置科目' }}</span>
            </div>
          </div>

          <el-menu
            :default-active="activeMenu"
            router
            class="sidebar-menu"
            background-color="transparent"
          >
            <el-menu-item index="/teacher/dashboard" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                  <span class="icon-emoji">📊</span>
                </span>
                <span class="menu-text">数据总览</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/teacher/vectordb" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                  <span class="icon-emoji">🗄️</span>
                </span>
                <span class="menu-text">向量数据库</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/teacher/students" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
                  <span class="icon-emoji">👥</span>
                </span>
                <span class="menu-text">学生管理</span>
              </div>
            </el-menu-item>

            <el-menu-item index="/teacher/analytics" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)">
                  <span class="icon-emoji">📈</span>
                </span>
                <span class="menu-text">学情分析</span>
              </div>
            </el-menu-item>

            <el-divider style="margin: 8px 16px; border-color: rgba(102, 126, 234, 0.2);" />

            <el-menu-item index="/teacher/settings" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)">
                  <span class="icon-emoji">⚙️</span>
                </span>
                <span class="menu-text">系统设置</span>
              </div>
            </el-menu-item>
          </el-menu>

          <div class="sidebar-footer">
            <div class="user-card">
              <el-avatar :size="50" class="user-avatar">
                <span class="avatar-emoji">🧑‍💼</span>
              </el-avatar>
              <div class="user-info">
                <span class="user-name">{{ teacherName }}</span>
                <div class="streak-info">
                  <span class="streak-icon">📚</span>
                  <span class="streak-days">管理学生 {{ studentCount }} 人</span>
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
                <span>教师端</span>
                <span class="breadcrumb-arrow">→</span>
                <span class="current">{{ currentPage }}</span>
              </div>

              <div class="header-actions">
                <el-tooltip content="通知" placement="bottom">
                  <el-badge :value="5" class="action-item">
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
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElConfigProvider, ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const route = useRoute()
const router = useRouter()

const teacherName = ref(localStorage.getItem('username') || '教师')
const teacherSubject = ref('计算机科学')
const studentCount = ref(128)

const activeMenu = computed(() => route.path)

const currentPage = computed(() => {
  const pageMap = {
    '/teacher/dashboard': '数据总览',
    '/teacher/vectordb': '向量数据库',
    '/teacher/students': '学生管理',
    '/teacher/analytics': '学情分析',
    '/teacher/settings': '系统设置'
  }
  return pageMap[route.path] || '首页'
})

const handleLogout = () => {
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('userRole')
  localStorage.removeItem('username')
  localStorage.removeItem('isAdmin')
  ElMessage.success('下次见啦～')
  router.push('/login')
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  overflow: hidden;
  overflow-x: hidden;
  position: relative;
}

.animated-bg {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #4facfe 0%, #667eea 50%, #764ba2 100%);
}

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
.shape-1 { width: 400px; height: 400px; background: white; top: -100px; right: -100px; }
.shape-2 { width: 300px; height: 300px; background: white; bottom: -50px; left: -50px; animation-delay: -5s; }
.shape-3 { width: 200px; height: 200px; background: white; top: 50%; left: 50%; animation-delay: -10s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

.main-layout {
  position: relative;
  z-index: 1;
  height: 100vh;
  overflow-x: hidden;
}

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

.logo-icon.teacher-logo {
  width: 60px; height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
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
  margin: 0; font-size: 20px; font-weight: 700; color: #2d3748;
}
.logo-text p {
  margin: 4px 0 0 0; font-size: 12px; color: #718096;
}

/* 教师信息卡片 */
.teacher-info-card {
  margin: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%);
  border-radius: 16px;
  border: 2px solid rgba(79, 172, 254, 0.2);
}

.teacher-avatar {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; color: white;
  box-shadow: 0 2px 8px rgba(79, 172, 254, 0.3);
}

.teacher-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.teacher-name {
  font-size: 15px; font-weight: 700; color: #2d3748;
}

.teacher-subject {
  font-size: 12px; color: #718096;
}

/* 菜单 */
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
  background: rgba(79, 172, 254, 0.1);
  transform: translateX(5px);
}

.menu-item.is-active {
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%);
  border-left: 4px solid #4facfe;
  box-shadow: 0 2px 12px rgba(79, 172, 254, 0.2);
}

.menu-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.icon-emoji {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.menu-text {
  font-size: 15px; font-weight: 600; color: #2d3748; flex: 1;
}

/* 底部 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%);
  border-radius: 16px;
  border: 2px solid rgba(79, 172, 254, 0.2);
}

.user-avatar {
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-emoji { font-size: 28px; }

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 15px; font-weight: 700; color: #2d3748;
}

.streak-info {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #718096;
}

.streak-icon { font-size: 14px; animation: flicker 1s infinite alternate; }

@keyframes flicker {
  0% { opacity: 0.7; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.1); }
}

/* 顶栏 */
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

.breadcrumb-icon { font-size: 18px; }
.breadcrumb-arrow { color: #a0aec0; }
.breadcrumb .current { color: #4facfe; font-weight: 700; font-size: 15px; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-btn { font-size: 20px; width: 48px; height: 48px; }
.btn-emoji { font-size: 22px; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1)); }
.action-item { position: relative; }

/* 主内容区 */
.main-content {
  background: rgba(255, 255, 255, 0.6);
  padding: 24px;
  overflow-x: hidden;
  overflow-y: auto;
  border-radius: 20px 0 0 0;
  min-height: calc(100vh - 64px);
}

.main-content::-webkit-scrollbar { width: 10px; }
.main-content::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.3); border-radius: 8px; }
.main-content::-webkit-scrollbar-thumb { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 8px; }
.main-content::-webkit-scrollbar-thumb:hover { background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); }
</style>
