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
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'

        // 调用真实后端登录
        const { data } = await axios.post(`${API_BASE_URL}/auth/login`, credentials)

        if (!data?.success) {
          throw new Error(data?.message || '登录失败')
        }

        const { token, user } = data
        this.token = token
        this.user = user
        this.userId = String(user.id)
        this.role = user.role || 'student'
        this.isLoggedIn = true

        localStorage.setItem('token', token)
        localStorage.setItem('userId', this.userId)
        localStorage.setItem('userRole', this.role)
        localStorage.setItem('isLoggedIn', 'true')

        // 登录后立即获取完整用户信息
        const isMockToken = token.startsWith('mock-token-')
        if (!isMockToken) {
          this.fetchCurrentUser().catch(() => {
            console.warn('⚠️ 获取用户信息失败，但登录仍然有效')
          })
        }

        console.log('✅ 登录成功:', this.username)
        return data
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
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'

        // 只传后端需要的字段，去掉 confirmPassword 等前端字段
        const { data } = await axios.post(`${API_BASE_URL}/auth/register`, {
          username: userData.username,
          email: userData.email,
          password: userData.password
        })

        if (!data?.success) {
          throw new Error(data?.message || '注册失败')
        }

        console.log('✅ 注册成功')
        return data
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
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'
        const { data } = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })

        if (data.success) {
          this.user = { ...this.user, ...data.user }
          this.userId = String(data.user.id)
          this.role = data.user.role
          this.isLoggedIn = true

          localStorage.setItem('userId', this.userId)
          localStorage.setItem('userRole', this.role)
          localStorage.setItem('isLoggedIn', 'true')

          console.log('✅ 获取用户信息成功')
          return data.user
        }
      } catch (error) {
        console.error('❌ 获取用户信息失败:', error.message)
        // 不要调用 logout()，这会在网络错误时清除所有登录状态
        // 只记录错误，登录状态仍然有效
        return null
      }
    },

    /**
     * 更新用户信息
     */
    async updateProfile(profileData) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'
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
     * 同步用户信息（从后端重新获取）
     */
    async syncUserProfile() {
      if (!this.token) {
        console.warn('⚠️ 没有 token，无法同步用户信息')
        return null
      }

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'
        const { data } = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })

        if (data.success) {
          this.user = { ...this.user, ...data.user }
          console.log('✅ 用户信息同步成功')
          return data.user
        }
      } catch (error) {
        console.error('❌ 同步用户信息失败:', error)
        throw error
      }
    },

    /**
     * 修改密码
     */
    async changePassword(passwordData) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'
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

        // 尝试获取用户信息（跳过 mock token）
        if (!token.startsWith('mock-token-')) {
          this.fetchCurrentUser().catch(() => {
            console.warn('⚠️ 自动登录失败，token 可能已过期')
          })
        }
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
