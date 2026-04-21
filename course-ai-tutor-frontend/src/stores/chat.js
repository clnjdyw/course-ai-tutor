import { defineStore } from 'pinia'
import axios from 'axios'

export const useChatStore = defineStore('chat', {
  state: () => ({
    // 按智能体类型存储对话历史
    conversations: {
      tutor: [],      // 教学对话
      helper: [],     // 答疑对话
      companion: [],  // 陪伴聊天
      planner: [],    // 规划对话
      evaluator: []   // 评估对话
    },
    // 当前活跃的对话类型
    activeConversation: 'tutor',
    // 是否正在流式输出
    isStreaming: false,
    // 最大消息数（每个对话）
    maxMessages: 100,
    // 用户情绪历史（从后端获取）
    moodHistory: [],
    // 当前情绪状态
    currentMood: null
  }),

  getters: {
    // 获取当前对话的消息
    currentMessages: (state) => state.conversations[state.activeConversation] || [],
    
    // 获取指定类型的对话消息
    getMessagesByType: (state) => (type) => state.conversations[type] || [],
    
    // 是否有消息
    hasMessages: (state) => (type) => (state.conversations[type] || []).length > 0,
    
    // 消息总数
    totalMessages: (state) => {
      return Object.values(state.conversations).reduce((sum, msgs) => sum + msgs.length, 0)
    }
  },

  actions: {
    /**
     * 添加用户消息
     */
    addUserMessage(content, type = null) {
      const conversationType = type || this.activeConversation
      
      const message = {
        id: Date.now(),
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      }
      
      this.conversations[conversationType].push(message)
      this._trimMessages(conversationType)
      this._saveToLocalStorage()
    },

    /**
     * 添加 AI 消息
     */
    addAIMessage(content, type = null, metadata = {}) {
      const conversationType = type || this.activeConversation
      
      const message = {
        id: Date.now(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        agentType: type || this.activeConversation,
        mood: metadata.mood || null,
        ragResults: metadata.ragResults || null
      }
      
      this.conversations[conversationType].push(message)
      this._trimMessages(conversationType)
      this._saveToLocalStorage()
    },

    /**
     * 更新最后一条 AI 消息（用于流式输出）
     */
    updateLastAIMessage(content, type = null) {
      const conversationType = type || this.activeConversation
      const messages = this.conversations[conversationType]
      
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage.role === 'assistant') {
          lastMessage.content = content
          this._saveToLocalStorage()
        }
      }
    },

    /**
     * 开始流式输出
     */
    startStreaming() {
      this.isStreaming = true
    },

    /**
     * 结束流式输出
     */
    endStreaming() {
      this.isStreaming = false
    },

    /**
     * 设置活跃对话类型
     */
    setActiveConversation(type) {
      if (this.conversations[type] !== undefined) {
        this.activeConversation = type
      }
    },

    /**
     * 清空指定类型的对话
     */
    clearConversation(type = null) {
      const conversationType = type || this.activeConversation
      this.conversations[conversationType] = []
      this._saveToLocalStorage()
      console.log(`🗑️ 已清空 ${conversationType} 对话`)
    },

    /**
     * 清空所有对话
     */
    clearAllConversations() {
      Object.keys(this.conversations).forEach(key => {
        this.conversations[key] = []
      })
      this._saveToLocalStorage()
      console.log('🗑️ 已清空所有对话')
    },

    /**
     * 删除指定消息
     */
    deleteMessage(messageId, type = null) {
      const conversationType = type || this.activeConversation
      const index = this.conversations[conversationType].findIndex(m => m.id === messageId)
      
      if (index !== -1) {
        this.conversations[conversationType].splice(index, 1)
        this._saveToLocalStorage()
      }
    },

    /**
     * 从 localStorage 加载对话历史
     */
    loadFromLocalStorage() {
      try {
        const saved = localStorage.getItem('chat-conversations')
        if (saved) {
          this.conversations = JSON.parse(saved)
          console.log('💾 已从本地存储加载对话历史')
        }
      } catch (error) {
        console.error('❌ 加载对话历史失败:', error)
      }
    },

    /**
     * 导出对话历史
     */
    exportConversations(type = null) {
      const data = type ? this.conversations[type] : this.conversations
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-history-${type || 'all'}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    },

    /**
     * 内部方法：裁剪消息数量
     */
    _trimMessages(type) {
      const messages = this.conversations[type]
      if (messages.length > this.maxMessages) {
        this.conversations[type] = messages.slice(-this.maxMessages)
        console.log(`✂️ 裁剪 ${type} 对话至 ${this.maxMessages} 条`)
      }
    },

    /**
     * 内部方法：保存到 localStorage
     */
    _saveToLocalStorage() {
      try {
        localStorage.setItem('chat-conversations', JSON.stringify(this.conversations))
      } catch (error) {
        console.error('❌ 保存对话历史失败:', error)
      }
    },

    /**
     * 从后端获取用户情绪历史
     */
    async fetchMoodHistory(userId, days = 7) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'
        const token = localStorage.getItem('token')
        
        const { data } = await axios.get(`${API_BASE_URL}/agent/mood/history/${userId}`, {
          params: { days },
          headers: { Authorization: `Bearer ${token}` }
        })

        if (data.success) {
          this.moodHistory = data.history
          this.currentMood = data.currentMood
          console.log('✅ 已加载情绪历史:', this.moodHistory.length, '条记录')
          return data
        }
      } catch (error) {
        console.error('❌ 获取情绪历史失败:', error)
        throw error
      }
    },

    /**
     * 从后端获取当前情绪状态
     */
    async fetchCurrentMood(userId) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'
        const token = localStorage.getItem('token')
        
        const { data } = await axios.get(`${API_BASE_URL}/agent/mood/current/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (data.success) {
          this.currentMood = data.mood
          return data.mood
        }
      } catch (error) {
        console.error('❌ 获取当前情绪失败:', error)
        throw error
      }
    },

    /**
     * 清空情绪历史
     */
    clearMoodHistory() {
      this.moodHistory = []
      this.currentMood = null
    }
  },

  // 持久化配置
  persist: {
    key: 'course-ai-tutor-chat',
    storage: localStorage,
    paths: ['conversations']
  }
})
