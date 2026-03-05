import { createRouter, createWebHistory } from 'vue-router'

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
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '系统设置', requiresAuth: true }
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/admin/AdminDashboard.vue'),
        meta: { title: '后台管理', requiresAuth: true, requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 课程辅导 AI`
  }
  
  // 检查登录状态
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const isAdmin = localStorage.getItem('isAdmin') === 'true'
  
  // 不需要登录的页面
  if (to.meta.requiresAuth === false) {
    next()
    return
  }
  
  // 需要登录的页面
  if (to.meta.requiresAuth) {
    if (!isLoggedIn) {
      next('/login')
      return
    }
    
    // 需要管理员权限
    if (to.meta.requiresAdmin && !isAdmin) {
      alert('需要管理员权限才能访问此页面')
      next('/')
      return
    }
  }
  
  next()
})

export default router
