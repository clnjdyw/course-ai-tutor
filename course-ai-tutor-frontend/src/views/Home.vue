<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container">
      <!-- 动态背景 -->
      <div class="animated-bg">
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>
        <div class="bg-shape shape-3"></div>
      </div>

      <el-container class="main-layout">
        <!-- 侧边栏 -->
        <el-aside width="240px" class="glass-sidebar">
          <div class="logo-section">
            <div class="logo-icon">
              <el-icon :size="32"><Reading /></el-icon>
            </div>
            <div class="logo-text">
              <h1>课程辅导 AI</h1>
              <p>智能学习伙伴</p>
            </div>
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
                  <el-icon><Document /></el-icon>
                </span>
                <span class="menu-text">学习规划</span>
              </div>
            </el-menu-item>
            
            <el-menu-item index="/tutor" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                  <el-icon><VideoCamera /></el-icon>
                </span>
                <span class="menu-text">智能教学</span>
              </div>
            </el-menu-item>
            
            <el-menu-item index="/helper" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                  <el-icon><ChatDotRound /></el-icon>
                </span>
                <span class="menu-text">实时答疑</span>
              </div>
            </el-menu-item>
            
            <el-menu-item index="/evaluator" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
                  <el-icon><DataAnalysis /></el-icon>
                </span>
                <span class="menu-text">学习评估</span>
              </div>
            </el-menu-item>
            
            <el-divider style="margin: 8px 16px; border-color: rgba(102, 126, 234, 0.2);" />
            
            <el-menu-item index="/statistics" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)">
                  <el-icon><TrendCharts /></el-icon>
                </span>
                <span class="menu-text">学习统计</span>
              </div>
            </el-menu-item>
            
            <el-menu-item index="/profile" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)">
                  <el-icon><User /></el-icon>
                </span>
                <span class="menu-text">个人中心</span>
              </div>
            </el-menu-item>
            
            <el-menu-item index="/settings" class="menu-item">
              <div class="menu-content">
                <span class="menu-icon" style="background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)">
                  <el-icon><Setting /></el-icon>
                </span>
                <span class="menu-text">系统设置</span>
              </div>
            </el-menu-item>
          </el-menu>

          <div class="sidebar-footer">
            <div class="user-card">
              <el-avatar :size="40" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
              <div class="user-info">
                <span class="user-name">用户</span>
                <span class="user-level">学习达人</span>
              </div>
            </div>
            
            <!-- 后台管理入口 -->
            <el-button 
              text 
              size="small" 
              @click="$router.push('/admin')"
              style="width: 100%; margin-top: 10px; color: #718096;"
            >
              <el-icon><Monitor /></el-icon>
              后台管理
            </el-button>
          </div>
        </el-aside>
        
        <!-- 主内容区 -->
        <el-container>
          <el-header class="glass-header">
            <div class="header-content">
              <div class="breadcrumb">
                <el-icon><House /></el-icon>
                <span>首页</span>
                <el-icon><ArrowRight /></el-icon>
                <span class="current">{{ currentPage }}</span>
              </div>
              
              <div class="header-actions">
                <el-tooltip content="通知" placement="bottom">
                  <el-badge :value="3" class="action-item">
                    <el-button circle>
                      <el-icon><Bell /></el-icon>
                    </el-button>
                  </el-badge>
                </el-tooltip>
                
                <el-tooltip content="退出登录" placement="bottom">
                  <el-button circle class="action-item" @click="handleLogout">
                    <el-icon><SwitchButton /></el-icon>
                  </el-button>
                </el-tooltip>
                
                <el-tooltip content="设置" placement="bottom">
                  <el-button circle class="action-item" @click="$router.push('/settings')">
                    <el-icon><Setting /></el-icon>
                  </el-button>
                </el-tooltip>
                
                <el-dropdown>
                  <span class="user-dropdown">
                    <el-avatar :size="32">U</el-avatar>
                    <span class="user-name">用户</span>
                    <el-icon><ArrowDown /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item>
                        <el-icon><User /></el-icon>个人中心
                      </el-dropdown-item>
                      <el-dropdown-item>
                        <el-icon><TrendCharts /></el-icon>学习统计
                      </el-dropdown-item>
                      <el-dropdown-item divided>
                        <el-icon><SwitchButton /></el-icon>退出登录
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElConfigProvider, ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const route = useRoute()
const router = useRouter()
const activeMenu = computed(() => route.path)

const currentPage = computed(() => {
  const pageMap = {
    '/planner': '学习规划',
    '/tutor': '智能教学',
    '/helper': '实时答疑',
    '/evaluator': '学习评估',
    '/profile': '个人中心',
    '/statistics': '学习统计',
    '/settings': '系统设置',
    '/admin': '后台管理'
  }
  return pageMap[route.path] || '首页'
})

const handleLogout = () => {
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('isAdmin')
  localStorage.removeItem('username')
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  overflow: hidden;
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
}

/* 玻璃态侧边栏 */
.glass-sidebar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
}

.logo-section {
  padding: 30px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.logo-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.logo-text h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.logo-text p {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #718096;
}

/* 菜单样式 */
.sidebar-menu {
  flex: 1;
  padding: 20px 10px;
  border-right: none;
}

.menu-item {
  margin-bottom: 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.menu-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(5px);
}

.menu-item.is-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-left: 3px solid #667eea;
}

.menu-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.user-level {
  font-size: 12px;
  color: #718096;
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

.breadcrumb .current {
  color: #667eea;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-item {
  position: relative;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(102, 126, 234, 0.05);
  transition: all 0.3s ease;
}

.user-dropdown:hover {
  background: rgba(102, 126, 234, 0.1);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
}

/* 主内容区 */
.main-content {
  background: rgba(255, 255, 255, 0.5);
  padding: 24px;
  overflow-y: auto;
}

/* 滚动条美化 */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}
</style>
