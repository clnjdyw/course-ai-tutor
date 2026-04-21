import { defineStore } from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    userId: localStorage.getItem('userId') || null,
    role: localStorage.getItem('userRole') || 'student',
    isLoggedIn: false
  }),

  getters: {
    // 是否已登录
    isAuthenticated: (state) => !!state.token && !!state.user,
    
    // 是否是管理员
    isAdmin: (state) => state.role === 'admin',
    
    // 是否是教师
    isTeacher: (state) => state.role === 'teacher',
    
    // 是否是学生
    isStudent: (state) => state.role === 'student',
    
    // 获取用户名
    username: (state) => state.user?.username || '用户',
    
    // 获取用户邮箱
    email: (state) => state.user?.email || ''
  },

  actions: {
    /**
     * 用户登录
     */
    async login(credentials) {
      try {
        // 模拟登录成功响应
        console.log('模拟登录请求:', credentials)
        
        // 模拟数据
        const mockResponse = {
          success: true,
          token: 'mock-token-' + Date.now(),
          user: {
            id: 1,
            username: credentials.username,
            email: credentials.username + '@example.com',
            role: 'student',
            level: 1,
            experience: 0,
            nickname: credentials.username,
            avatarUrl: '',
            bio: ''
          },
          message: '登录成功'
        }
        
        console.log('模拟登录响应:', mockResponse)
        
        // 模拟模式：使用 mock-token-USERID-ROLE 格式，后端可直接解析
        const userId = mockResponse.user.id
        const userRole = mockResponse.user.role
        const mockToken = `mock-token-${userId}-${userRole}`

        this.token = mockToken
        this.user = mockResponse.user
        this.userId = String(mockResponse.user.id)
        this.role = mockResponse.user.role
        this.isLoggedIn = true
        
        // 持久化到 localStorage
        localStorage.setItem('token', mockToken)
        localStorage.setItem('userId', this.userId)
        localStorage.setItem('userRole', this.role)
        localStorage.setItem('isLoggedIn', 'true')
        
        console.log('✅ 登录成功:', this.username)
        return mockResponse
      } catch (error) {
        console.error('❌ 登录失败:', error)
        throw error
      }
    },

    /**
     * 用户注册
     */
    async register(userData) {
      try {
        // 模拟注册成功响应
        console.log('模拟注册请求:', userData)
        
        // 模拟数据
        const mockResponse = {
          success: true,
          message: '注册成功'
        }
        
        console.log('模拟注册响应:', mockResponse)
        
        console.log('✅ 注册成功')
        return mockResponse
      } catch (error) {
        console.error('❌ 注册失败:', error)
        throw error
      }
    },

    /**
     * 从后端获取当前用户信息
     */
    async fetchCurrentUser() {
      if (!this.token) {
        console.warn('⚠️ 没有 token，无法获取用户信息')
        return null
      }

      try {
        // 模拟获取用户信息成功响应
        console.log('模拟获取用户信息')
        
        // 模拟数据
        const mockUser = {
          id: 1,
          username: this.user?.username || 'user',
          email: this.user?.email || 'user@example.com',
          role: this.role || 'student',
          level: 1,
          experience: 0,
          nickname: this.user?.nickname || '用户',
          avatarUrl: '',
          bio: ''
        }
        
        this.user = mockUser
        this.userId = String(mockUser.id)
        this.role = mockUser.role
        this.isLoggedIn = true
        
        localStorage.setItem('userId', this.userId)
        localStorage.setItem('userRole', this.role)
        localStorage.setItem('isLoggedIn', 'true')
        
        console.log('✅ 获取用户信息成功')
        return mockUser
      } catch (error) {
        console.error('❌ 获取用户信息失败:', error)
        this.logout()
        throw error
      }
    },

    /**
     * 更新用户信息
     */
    async updateProfile(profileData) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'
        const { data } = await axios.put(`${API_BASE_URL}/auth/me`, profileData, {
          headers: { Authorization: `Bearer ${this.token}` }
        })

        if (data.success) {
          this.user = { ...this.user, ...data.user }
          console.log('✅ 用户信息更新成功')
          return data
        }
      } catch (error) {
        console.error('❌ 更新用户信息失败:', error)
        throw error
      }
    },

    /**
     * 修改密码
     */
    async changePassword(passwordData) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'
        const { data } = await axios.put(`${API_BASE_URL}/auth/password`, passwordData, {
          headers: { Authorization: `Bearer ${this.token}` }
        })

        if (data.success) {
          console.log('✅ 密码修改成功')
          return data
        }
      } catch (error) {
        console.error('❌ 修改密码失败:', error)
        throw error
      }
    },

    /**
     * 退出登录
     */
    logout() {
      console.log('👋 用户退出登录')
      
      // 清除状态
      this.$reset()
      
      // 清除 localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('userRole')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('isAdmin')
    },

    /**
     * 初始化 store（从 localStorage 恢复）
     */
    init() {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      const role = localStorage.getItem('userRole')
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'

      if (token && isLoggedIn) {
        this.token = token
        this.userId = userId
        this.role = role || 'student'
        this.isLoggedIn = true
        
        // 尝试获取用户信息
        this.fetchCurrentUser().catch(() => {
          console.warn('⚠️ 自动登录失败，token 可能已过期')
        })
      }
    }
  },

  // 持久化配置（需要 pinia-plugin-persistedstate）
  persist: {
    key: 'course-ai-tutor-user',
    storage: localStorage,
    paths: ['token', 'userId', 'role', 'isLoggedIn']
  }
})
