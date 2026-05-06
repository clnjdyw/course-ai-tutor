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
        path: 'exercise-templates',
        name: 'ExerciseTemplates',
        component: () => import('@/views/ExerciseTemplates.vue'),
        meta: { title: '自定义题库', requiresAuth: true }
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
        path: 'history',
        name: 'History',
        component: () => import('@/views/HistoryView.vue'),
        meta: { title: '历史记录', requiresAuth: true }
      },
      {
        path: 'feedback',
        name: 'FeedbackHistory',
        component: () => import('@/views/FeedbackHistory.vue'),
        meta: { title: '反馈历史', requiresAuth: true }
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
        path: 'knowledge-graph',
        name: 'KnowledgeGraph',
        component: () => import('@/views/KnowledgeGraph.vue'),
        meta: { title: '知识图谱', requiresAuth: true }
      },
      {
        path: 'knowledge-bases',
        name: 'KnowledgeBases',
        component: () => import('@/views/KnowledgeBases.vue'),
        meta: { title: '知识库管理', requiresAuth: true }
      },
      {
        path: 'knowledge-manage',
        name: 'KnowledgeManage',
        component: () => import('@/views/KnowledgeManage.vue'),
        meta: { title: '知识点管理', requiresAuth: true }
      },
      {
        path: 'knowledge-import',
        name: 'KnowledgeImport',
        component: () => import('@/views/KnowledgeImport.vue'),
        meta: { title: '知识导入', requiresAuth: true }
      },
      {
        path: 'knowledge-recommendation',
        name: 'KnowledgeRecommendation',
        component: () => import('@/views/KnowledgeRecommendation.vue'),
        meta: { title: '智能推荐', requiresAuth: true }
      },
      {
        path: 'learning-paths',
        name: 'LearningPaths',
        component: () => import('@/views/LearningPaths.vue'),
        meta: { title: '学习路径', requiresAuth: true }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics.vue'),
        meta: { title: '数据分析', requiresAuth: true }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue'),
        meta: { title: '通知中心', requiresAuth: true }
      },
      {
        path: 'community',
        name: 'Community',
        component: () => import('@/views/Community.vue'),
        meta: { title: '学习社区', requiresAuth: true }
      },
      {
        path: 'export',
        name: 'Export',
        component: () => import('@/views/Export.vue'),
        meta: { title: '数据导出', requiresAuth: true }
      },
      {
        path: 'study',
        name: 'StudySession',
        component: () => import('@/views/StudySession.vue'),
        meta: { title: '学习会话', requiresAuth: true }
      },
      {
        path: 'reviews',
        name: 'Reviews',
        component: () => import('@/views/Reviews.vue'),
        meta: { title: '复习计划', requiresAuth: true }
      },
      {
        path: 'companion',
        name: 'Companion',
        component: () => import('@/views/CompanionView.vue'),
        meta: { title: '学习伙伴', requiresAuth: true }
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
// token 验证缓存，避免每次导航都请求后端
let lastVerifiedToken = null
let lastVerifiedRole = null

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
      const userId = localStorage.getItem('userId')
      const userRole = localStorage.getItem('userRole') || 'student'
      const isAdmin = userRole === 'admin'

      // 检查管理员权限
      if (to.meta.requiresAdmin && !isAdmin) {
        console.warn('⚠️ 需要管理员权限')
        next('/planner')
        return
      }

      // 检查特定角色权限（admin 拥有 teacher 的访问权）
      if (to.meta.requiresRole) {
        const allowed = to.meta.requiresRole === 'teacher'
          ? ['teacher', 'admin']
          : [to.meta.requiresRole]
        if (!allowed.includes(userRole)) {
          console.warn(`⚠️ 需要 ${to.meta.requiresRole} 角色`)
          next('/planner')
          return
        }
      }

      // 验证通过，允许访问
      next()
      return
    }

    // 检查后端验证缓存：如果 token 没变，直接使用已验证的角色
    const cachedRole = localStorage.getItem('userRole')
    if (token === lastVerifiedToken && lastVerifiedRole) {
      // token 已验证过，直接放行
      const isAdmin = lastVerifiedRole === 'admin'
      if (to.meta.requiresAdmin && !isAdmin) {
        console.warn('⚠️ 需要管理员权限')
        next('/planner')
        return
      }
      if (to.meta.requiresRole) {
        const allowed = to.meta.requiresRole === 'teacher'
          ? ['teacher', 'admin']
          : [to.meta.requiresRole]
        if (!allowed.includes(lastVerifiedRole)) {
          console.warn(`⚠️ 需要 ${to.meta.requiresRole} 角色`)
          next('/planner')
          return
        }
      }
      next()
      return
    }

    try {
      // 从后端验证 token 并获取用户信息
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'
      const { data } = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      })

      // 后端返回格式: { success: true, data: { user: {...} } }
      const userData = data.data?.user || data.user

      if (!userData) {
        throw new Error('无法获取用户信息')
      }

      // 保存用户信息到 localStorage 并缓存 token
      const userRole = userData.role || 'student'
      localStorage.setItem('userId', String(userData.id))
      localStorage.setItem('userRole', userRole)
      localStorage.setItem('isLoggedIn', 'true')
      lastVerifiedToken = token
      lastVerifiedRole = userRole

      const isAdmin = userRole === 'admin'

      // 检查管理员权限
      if (to.meta.requiresAdmin && !isAdmin) {
        console.warn('⚠️ 需要管理员权限')
        next('/planner')
        return
      }

      // 检查特定角色权限（admin 拥有 teacher 的访问权）
      if (to.meta.requiresRole) {
        const allowed = to.meta.requiresRole === 'teacher'
          ? ['teacher', 'admin']
          : [to.meta.requiresRole]
        if (!allowed.includes(userRole)) {
          console.warn(`⚠️ 需要 ${to.meta.requiresRole} 角色`)
          next('/planner')
          return
        }
      }

      // 验证通过，允许访问
      next()
    } catch (error) {
      // 只有 401 才清除登录状态，其他错误（网络超时、500等）保留登录状态
      const status = error.response?.status
      if (status === 401) {
        console.warn('⚠️ Token 无效或已过期，清除登录状态')
        localStorage.removeItem('token')
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('userId')
        localStorage.removeItem('userRole')
        localStorage.removeItem('isAdmin')
        next('/login')
      } else {
        // 网络错误或服务端错误：保留登录状态，允许访问
        console.warn(`⚠️ 验证请求异常 (${error.message})，保留当前登录状态`)
        // 如果有缓存的角色，按缓存放行；否则按 localStorage 中的角色放行
        const fallbackRole = lastVerifiedRole || localStorage.getItem('userRole') || 'student'
        const isAdmin = fallbackRole === 'admin'
        if (to.meta.requiresAdmin && !isAdmin) {
          console.warn('⚠️ 需要管理员权限，降级跳转')
          next('/planner')
          return
        }
        if (to.meta.requiresRole) {
          const allowed = to.meta.requiresRole === 'teacher'
            ? ['teacher', 'admin']
            : [to.meta.requiresRole]
          if (!allowed.includes(fallbackRole)) {
            console.warn(`⚠️ 需要 ${to.meta.requiresRole} 角色，降级跳转`)
            next('/planner')
            return
          }
        }
        next()
      }
      return
    }
  }

  // 默认放行（兼容旧逻辑）
  next()
})

export default router