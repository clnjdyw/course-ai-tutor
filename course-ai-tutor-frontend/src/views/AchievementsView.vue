<template>
  <div class="achievements-container">
    <!-- 成就概览 -->
    <div class="achievements-header">
      <h1 class="page-title">🏆 成就中心</h1>
      <p class="page-subtitle">收集徽章，记录你的成长之旅</p>
    </div>

    <!-- 成就进度概览 -->
    <div class="progress-section">
      <div class="progress-card">
        <div class="progress-info">
          <div class="progress-left">
            <span class="progress-label">总进度</span>
            <span class="progress-detail">{{ unlockedCount }}/{{ totalCount }} 已解锁</span>
          </div>
          <div class="progress-right">
            <span class="progress-percentage">{{ totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0 }}%</span>
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: (unlockedCount / totalAchievements) * 100 + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="['tab-btn', { active: activeCategory === cat.id }]"
        @click="activeCategory = cat.id"
      >
        <span class="tab-icon">{{ cat.icon }}</span>
        {{ cat.name }}
      </button>
    </div>

    <!-- 成就列表 -->
    <div class="achievements-grid">
      <div
        v-for="achievement in filteredAchievements"
        :key="achievement.id"
        :class="['achievement-card', { unlocked: achievement.unlocked, locked: !achievement.unlocked }]"
      >
        <div class="achievement-badge">
          <span class="badge-emoji">{{ achievement.unlocked ? achievement.emoji : '🔒' }}</span>
          <div v-if="achievement.unlocked" class="unlock-badge">已解锁</div>
        </div>
        <div class="achievement-info">
          <h3 class="achievement-name">{{ achievement.name }}</h3>
          <p class="achievement-desc">{{ achievement.description }}</p>
          <div class="achievement-meta">
            <span class="achievement-category">{{ getCategoryName(achievement.category) }}</span>
            <span class="achievement-points">+{{ achievement.points }} 经验值</span>
          </div>
        </div>
        <div v-if="achievement.unlocked" class="achievement-date">
          {{ achievement.unlockedAt }}
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredAchievements.length === 0" class="empty-state">
      <span class="empty-emoji">🎯</span>
      <p class="empty-text">这个分类下还没有成就哦</p>
    </div>

    <!-- 最近解锁 -->
    <div class="recent-section">
      <h3 class="section-title">🔓 最近解锁</h3>
      <div class="recent-list">
        <div
          v-for="record in recentUnlocks"
          :key="record.id"
          class="recent-item"
        >
          <span class="recent-emoji">{{ record.emoji }}</span>
          <div class="recent-info">
            <span class="recent-name">{{ record.name }}</span>
            <span class="recent-time">{{ record.time }}</span>
          </div>
          <span class="recent-points">+{{ record.points }} XP</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'

const activeCategory = ref('all')

const categories = [
  { id: 'all', name: '全部', icon: '📚' },
  { id: 'learning', name: '学习', icon: '📖' },
  { id: 'battle', name: '对战', icon: '⚔️' },
  { id: 'social', name: '社交', icon: '👥' },
  { id: 'special', name: '特殊', icon: '🌟' }
]

// 成就数据
const achievements = ref([])
const recentUnlocks = ref([])
const totalPoints = ref(0)
const unlockedCount = ref(0)
const totalCount = ref(0)
const loading = ref(false)

onMounted(async () => {
  await fetchAchievements()
})

async function fetchAchievements() {
  loading.value = true
  try {
    const token = localStorage.getItem('token')

    // 模拟数据
    if (!token || token.startsWith('mock-token-')) {
      console.log('模拟模式：使用默认成就数据')
      const mockAchievements = [
        { id: 1, name: '第一步', description: '完成第一次学习', category: 'beginner', emoji: '🎯', points: 10, unlocked: false, unlockedAt: null },
        { id: 2, name: '求知者', description: '累计学习10小时', category: 'learning', emoji: '📚', points: 50, unlocked: false, unlockedAt: null },
        { id: 3, name: '连续达人', description: '连续学习7天', category: 'streak', emoji: '🔥', points: 100, unlocked: false, unlockedAt: null },
        { id: 4, name: '初出茅庐', description: '第一次回答问题', category: 'practice', emoji: '💡', points: 20, unlocked: false, unlockedAt: null },
        { id: 5, name: '满分达人', description: '获得一次满分', category: 'practice', emoji: '💯', points: 80, unlocked: false, unlockedAt: null }
      ]
      achievements.value = mockAchievements
      recentUnlocks.value = []
      totalPoints.value = 0
      unlockedCount.value = 0
      totalCount.value = mockAchievements.length
      loading.value = false
      return
    }

    const { data } = await axios.get(`${API_BASE_URL}/achievements`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (data.success) {
      achievements.value = (data.data.achievements || []).map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        category: a.category,
        emoji: a.icon,
        points: a.points,
        unlocked: a.unlocked,
        unlockedAt: a.unlockedAt ? new Date(a.unlockedAt).toLocaleDateString() : null
      }))

      recentUnlocks.value = (data.data.recentUnlocks || []).map(r => ({
        id: r.id,
        name: r.name,
        emoji: r.icon,
        time: r.time ? new Date(r.time).toLocaleDateString() : '-',
        points: r.points
      }))

      totalPoints.value = data.data.totalPoints || 0
      unlockedCount.value = data.data.unlockedCount || 0
      totalCount.value = data.data.totalCount || 0
    } else {
      ElMessage.error(data.message || '获取成就失败')
    }
  } catch (error) {
    console.error('获取成就失败:', error)
    ElMessage.error('获取成就失败')
  } finally {
    loading.value = false
  }
}

const getCategoryName = (categoryId) => {
  const cat = categories.find(c => c.id === categoryId)
  return cat ? cat.name : categoryId
}

const filteredAchievements = computed(() => {
  if (activeCategory.value === 'all') {
    return achievements.value
  }
  return achievements.value.filter(a => a.category === activeCategory.value)
})
</script>

<style scoped>
.achievements-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  animation: fadeInUp 0.6s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 头部 */
.achievements-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #FFD700, #FFA500, #FF6B6B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: #718096;
}

/* 进度卡片 */
.progress-section {
  margin-bottom: 32px;
}

.progress-card {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 20px;
  padding: 24px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-label {
  font-size: 14px;
  color: #718096;
}

.progress-detail {
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
}

.progress-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.progress-percentage {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.progress-bar-container {
  height: 12px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FFA500, #FF6B6B);
  border-radius: 6px;
  transition: width 0.5s ease;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.tab-icon {
  font-size: 18px;
}

/* 成就网格 */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.achievement-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.achievement-card.locked {
  opacity: 0.7;
  filter: grayscale(0.5);
}

.achievement-card.unlocked {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 250, 0.9) 100%);
  border-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.15);
}

.achievement-card.unlocked:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.25);
}

.achievement-badge {
  position: relative;
  flex-shrink: 0;
}

.badge-emoji {
  font-size: 48px;
  display: block;
}

.unlock-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(72, 187, 120, 0.4);
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-name {
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 6px 0;
}

.achievement-desc {
  font-size: 13px;
  color: #718096;
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.achievement-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.achievement-category {
  font-size: 11px;
  color: #718096;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 6px;
}

.achievement-points {
  font-size: 12px;
  font-weight: 700;
  color: #48bb78;
}

.achievement-date {
  font-size: 11px;
  color: #a0aec0;
  white-space: nowrap;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #a0aec0;
}

.empty-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
}

/* 最近解锁 */
.recent-section {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 20px 0;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.recent-item:hover {
  background: rgba(102, 126, 234, 0.05);
  transform: translateX(4px);
}

.recent-emoji {
  font-size: 32px;
}

.recent-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-name {
  font-weight: 700;
  color: #2d3748;
}

.recent-time {
  font-size: 12px;
  color: #718096;
}

.recent-points {
  font-size: 14px;
  font-weight: 700;
  color: #48bb78;
}

/* 响应式 */
@media (max-width: 768px) {
  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .category-tabs {
    justify-content: center;
  }

  .tab-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>
