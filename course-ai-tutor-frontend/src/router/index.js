import { createRouter, createWebHistory } from 'vue-router'
import axios from 'axios'
import request from '@/api/request'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { title: '登录/注册', requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    redirect: '/planner',
    children: [
      {
        path: 'planner',
        name: 'Planner',
        component: () => import('@/views/PlannerView.vue'),
        meta: { title: '学习规划', requiresAuth: true }
      },
      {
        path: 'tutor',
        name: 'Tutor',
        component: () => import('@/views/TutorView.vue'),
        meta: { title: '智能教学', requiresAuth: true }
      },
      {
        path: 'helper',
        name: 'Helper',
        component: () => import('@/views/HelperView.vue'),
        meta: { title: '实时答疑', requiresAuth: true }
      },
      {
        path: 'evaluator',
        name: 'Evaluator',
        component: () => import('@/views/EvaluatorView.vue'),
        meta: { title: '学习评估', requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心', requiresAuth: true }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
        meta: { title: '学习统计', requiresAuth: true }
      },
      {
        path: 'achievements',
        name: 'Achievements',
        component: () => import('@/views/AchievementsView.vue'),
        meta: { title: '成就中心', requiresAuth: true }
      },
      {
        path: 'battle',
        name: 'Battle',
        component: () => import('@/views/BattleView.vue'),
        meta: { title: 'PK 对战', requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '系统设置', requiresAuth: true }
      },
      {
        path: 'notes',
        name: 'Notes',
        component: () => import('@/views/NotesView.vue'),
        meta: { title: '我的笔记', requiresAuth: true }
      },
      {
        path: 'wrong-questions',
        name: 'WrongQuestions',
        component: () => import('@/views/WrongQuestionsView.vue'),
        meta: { title: '错题本', requiresAuth: true }
      },
      {
        path: 'progress',
        name: 'Progress',
        component: () => import('@/views/ProgressView.vue'),
        meta: { title: '学习进度', requiresAuth: true }
      },
      {
        path: 'reminders',
        name: 'Reminders',
        component: () => import('@/views/RemindersView.vue'),
        meta: { title: '学习提醒', requiresAuth: true }
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/admin/AdminDashboard.vue'),
        meta: { title: '后台管理', requiresAuth: true, requiresAdmin: true }
      }
    ]
  },
  {
    path: '/teacher',
    name: 'TeacherHome',
    component: () => import('@/views/TeacherHome.vue'),
    redirect: '/teacher/dashboard',
    meta: { requiresAuth: true, requiresRole: 'teacher' },
    children: [
      {
        path: 'dashboard',
        name: 'TeacherDashboard',
        component: () => import('@/views/teacher/TeacherDashboard.vue'),
        meta: { title: '数据总览', requiresAuth: true, requiresRole: 'teacher' }
      },
      {
        path: 'vectordb',
        name: 'TeacherVectorDB',
        component: () => import('@/views/teacher/TeacherVectorDB.vue'),
        meta: { title: '向量数据库', requiresAuth: true, requiresRole: 'teacher' }
      },
      {
        path: 'students',
        name: 'TeacherStudents',
        component: () => import('@/views/teacher/TeacherStudents.vue'),
        meta: { title: '学生管理', requiresAuth: true, requiresRole: 'teacher' }
      },
      {
        path: 'analytics',
        name: 'TeacherAnalytics',
        component: () => import('@/views/teacher/TeacherAnalytics.vue'),
        meta: { title: '学情分析', requiresAuth: true, requiresRole: 'teacher' }
      },
      {
        path: 'settings',
        name: 'TeacherSettings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '系统设置', requiresAuth: true, requiresRole: 'teacher' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 后端验证增强版
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 课程辅导 AI`
  }

  // 不需要登录的页面直接放行
  if (to.meta.requiresAuth === false) {
    next()
    return
  }

  const token = localStorage.getItem('token')

  // 需要登录的页面
  if (to.meta.requiresAuth) {
    if (!token) {
      next('/login')
      return
    }

    // 如果是模拟token（后端未运行时），直接放行
    if (token.startsWith('mock-token-')) {
      console.log('✅ 模拟模式：使用本地存储的用户信息')
      
      const userId = localStorage.getItem('userId')
      const userRole = localStorage.getItem('userRole') || 'student'
      const isAdmin = userRole === 'admin'

      // 检查管理员权限
      if (to.meta.requiresAdmin && !isAdmin) {
        console.warn('⚠️ 需要管理员权限')
        next('/planner')
        return
      }

      // 检查特定角色权限
      if (to.meta.requiresRole && userRole !== to.meta.requiresRole) {
        console.warn(`⚠️ 需要 ${to.meta.requiresRole} 角色`)
        next('/planner')
        return
      }

      // 验证通过，允许访问
      next()
      return
    }

    try {
      // 从后端验证 token 并获取用户信息
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'
      const { data } = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      })

      // 后端返回格式: { success: true, data: { user: {...} } }
      const userData = data.data?.user || data.user

      if (!userData) {
        throw new Error('无法获取用户信息')
      }

      // 保存用户信息到 localStorage（供其他组件使用）
      localStorage.setItem('userId', String(userData.id))
      localStorage.setItem('userRole', userData.role || 'student')
      localStorage.setItem('isLoggedIn', 'true')

      const userRole = userData.role || 'student'
      const isAdmin = userRole === 'admin'

      // 检查管理员权限
      if (to.meta.requiresAdmin && !isAdmin) {
        console.warn('⚠️ 需要管理员权限')
        next('/planner')
        return
      }

      // 检查特定角色权限
      if (to.meta.requiresRole && userRole !== to.meta.requiresRole) {
        console.warn(`⚠️ 需要 ${to.meta.requiresRole} 角色`)
        next('/planner')
        return
      }

      // 验证通过，允许访问
      next()
    } catch (error) {
      // Token 无效或过期，清除并跳转到登录页
      console.error('❌ Token 验证失败:', error.message)
      localStorage.removeItem('token')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userId')
      localStorage.removeItem('userRole')
      localStorage.removeItem('isAdmin')
      next('/login')
      return
    }
  }

  // 默认放行（兼容旧逻辑）
  next()
})

export default router