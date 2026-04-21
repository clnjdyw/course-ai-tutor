import { defineStore } from 'pinia'
import axios from 'axios'

export const useLearningStore = defineStore('learning', {
  state: () => ({
    // 用户等级和经验
    level: parseInt(localStorage.getItem('userLevel') || '1'),
    experience: parseInt(localStorage.getItem('userExperience') || '0'),
    nextLevelExp: 100,
    
    // 连续学习天数
    streakDays: parseInt(localStorage.getItem('streakDays') || '0'),
    lastStudyDate: localStorage.getItem('lastStudyDate') || null,
    
    // 今日任务
    dailyTasks: {
      completed: parseInt(localStorage.getItem('dailyTasksCompleted') || '0'),
      total: 3
    },
    
    // 成就徽章
    achievements: JSON.parse(localStorage.getItem('achievements') || '[]'),
    
    // 学习计划
    studyPlan: null,
    
    // 学习统计
    statistics: {
      totalStudyTime: 0,    // 总学习时长（分钟）
      exercisesCompleted: 0, // 完成的练习数
      averageScore: 0,       // 平均分
      subjectsLearned: []    // 学习的科目
    }
  }),

  getters: {
    // 经验值进度百分比
    expProgress: (state) => {
      return Math.min((state.experience / state.nextLevelExp) * 100, 100)
    },
    
    // 是否可以升级
    canLevelUp: (state) => state.experience >= state.nextLevelExp,
    
    // 今日任务完成百分比
    dailyTaskProgress: (state) => {
      return Math.min((state.dailyTasks.completed / state.dailyTasks.total) * 100, 100)
    },
    
    // 是否完成今日所有任务
    allDailyTasksCompleted: (state) => {
      return state.dailyTasks.completed >= state.dailyTasks.total
    },
    
    // 成就数量
    achievementCount: (state) => state.achievements.length
  },

  actions: {
    /**
     * 添加经验值
     */
    addExperience(amount) {
      this.experience += amount
      
      // 检查升级
      if (this.canLevelUp) {
        this.levelUp()
      }
      
      this._saveToLocalStorage()
      console.log(`✨ 获得 ${amount} 经验值，当前: ${this.experience}/${this.nextLevelExp}`)
    },

    /**
     * 升级
     */
    levelUp() {
      this.level++
      this.experience = this.experience - this.nextLevelExp
      this.nextLevelExp = Math.floor(this.nextLevelExp * 1.5)
      
      console.log(`🎉 恭喜升级到 Lv.${this.level}！`)
      
      // 触发升级成就
      this.unlockAchievement('level_up', `达到 Lv.${this.level}`)
    },

    /**
     * 更新连续学习天数
     */
    updateStreak() {
      const today = new Date().toDateString()
      const lastDate = this.lastStudyDate ? new Date(this.lastStudyDate).toDateString() : null
      
      if (today !== lastDate) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        
        if (lastDate === yesterday.toDateString()) {
          // 连续学习
          this.streakDays++
        } else if (lastDate !== today) {
          // 中断，重新开始
          this.streakDays = 1
        }
        
        this.lastStudyDate = new Date().toISOString()
        this._saveToLocalStorage()
        
        console.log(`🔥 连续学习 ${this.streakDays} 天`)
      }
    },

    /**
     * 完成每日任务
     */
    completeDailyTask() {
      if (this.dailyTasks.completed < this.dailyTasks.total) {
        this.dailyTasks.completed++
        this.addExperience(20) // 完成任务获得经验
        this._saveToLocalStorage()
        
        console.log(`✅ 完成每日任务 ${this.dailyTasks.completed}/${this.dailyTasks.total}`)
        
        // 检查是否完成所有任务
        if (this.allDailyTasksCompleted) {
          this.unlockAchievement('daily_complete', '完成今日所有任务')
          this.addExperience(50) // 额外奖励
        }
      }
    },

    /**
     * 重置每日任务（每天零点调用）
     */
    resetDailyTasks() {
      const today = new Date().toDateString()
      const lastReset = localStorage.getItem('lastDailyReset')
      
      if (today !== lastReset) {
        this.dailyTasks.completed = 0
        localStorage.setItem('lastDailyReset', today)
        this._saveToLocalStorage()
        console.log('🔄 每日任务已重置')
      }
    },

    /**
     * 解锁成就
     */
    unlockAchievement(id, title, icon = '🏆') {
      const exists = this.achievements.find(a => a.id === id)
      
      if (!exists) {
        this.achievements.push({
          id,
          title,
          icon,
          unlockedAt: new Date().toISOString()
        })
        
        this._saveToLocalStorage()
        console.log(`🏆 解锁成就: ${title}`)
        
        // 成就奖励
        this.addExperience(30)
      }
    },

    /**
     * 更新学习统计
     */
    updateStatistics(stats) {
      this.statistics = { ...this.statistics, ...stats }
      this._saveToLocalStorage()
    },

    /**
     * 记录学习时间
     */
    recordStudyTime(minutes) {
      this.statistics.totalStudyTime += minutes
      this.updateStreak()
      this._saveToLocalStorage()
    },

    /**
     * 设置学习计划
     */
    setStudyPlan(plan) {
      this.studyPlan = plan
      this._saveToLocalStorage()
    },

    /**
     * 清除学习计划
     */
    clearStudyPlan() {
      this.studyPlan = null
      this._saveToLocalStorage()
    },

    /**
     * 从后端加载学习数据
     */
    async loadFromBackend(userId) {
      try {
        const token = localStorage.getItem('token')

        // 模拟模式
        if (!token || token.startsWith('mock-token-')) {
          console.log('模拟模式：跳过从后端加载学习数据')
          return
        }

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'

        // 加载学习统计
        const { data: statsData } = await axios.get(`${API_BASE_URL}/learning/statistics`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (statsData.success) {
          this.updateStatistics(statsData.data)
        }

        // 加载学习计划
        const { data: planData } = await axios.get(`${API_BASE_URL}/learning/plans`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (planData.success && planData.data.length > 0) {
          this.setStudyPlan(planData.data[0])
        }
      } catch (error) {
        console.error('❌ 加载学习数据失败:', error)
      }
    },

    /**
     * 内部方法：保存到 localStorage
     */
    _saveToLocalStorage() {
      try {
        localStorage.setItem('userLevel', String(this.level))
        localStorage.setItem('userExperience', String(this.experience))
        localStorage.setItem('streakDays', String(this.streakDays))
        localStorage.setItem('lastStudyDate', this.lastStudyDate || '')
        localStorage.setItem('dailyTasksCompleted', String(this.dailyTasks.completed))
        localStorage.setItem('achievements', JSON.stringify(this.achievements))
      } catch (error) {
        console.error('❌ 保存学习数据失败:', error)
      }
    },

    /**
     * 重置所有学习数据
     */
    resetAll() {
      this.$reset()
      localStorage.removeItem('userLevel')
      localStorage.removeItem('userExperience')
      localStorage.removeItem('streakDays')
      localStorage.removeItem('lastStudyDate')
      localStorage.removeItem('dailyTasksCompleted')
      localStorage.removeItem('achievements')
      console.log('🔄 学习数据已重置')
    }
  },

  // 持久化配置
  persist: {
    key: 'course-ai-tutor-learning',
    storage: localStorage,
    paths: ['level', 'experience', 'streakDays', 'lastStudyDate', 'dailyTasks', 'achievements', 'statistics']
  }
})
