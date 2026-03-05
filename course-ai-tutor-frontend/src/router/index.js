import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录/注册' }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    children: [
      {
        path: '',
        redirect: '/planner'
      },
      {
        path: '/planner',
        name: 'Planner',
        component: () => import('@/views/PlannerView.vue'),
        meta: { title: '学习规划' }
      },
      {
        path: '/tutor',
        name: 'Tutor',
        component: () => import('@/views/TutorView.vue'),
        meta: { title: '智能教学' }
      },
      {
        path: '/helper',
        name: 'Helper',
        component: () => import('@/views/HelperView.vue'),
        meta: { title: '实时答疑' }
      },
      {
        path: '/evaluator',
        name: 'Evaluator',
        component: () => import('@/views/EvaluatorView.vue'),
        meta: { title: '学习评估' }
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心' }
      },
      {
        path: '/statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
        meta: { title: '学习统计' }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '系统设置' }
      },
      {
        path: '/admin',
        name: 'Admin',
        component: () => import('@/views/admin/AdminDashboard.vue'),
        meta: { title: '后台管理' }
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
  if (to.meta.title) {
    document.title = `${to.meta.title} - 课程辅导 AI`
  }
  next()
})

export default router
