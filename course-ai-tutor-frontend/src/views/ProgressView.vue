<template>
  <div class="progress-view">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <span class="icon-emoji">📊</span>
            </div>
            <div>
              <h2>📊 学习进度</h2>
              <p>全面了解你的学习情况</p>
            </div>
          </div>
        </div>
      </template>

      <!-- 概览卡片 -->
      <div class="overview-grid">
        <div class="overview-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
            <span class="card-icon-emoji">📚</span>
          </div>
          <div class="card-info">
            <div class="card-value">{{ stats.totalKnowledgePoints || 0 }}</div>
            <div class="card-label">总知识点</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
            <span class="card-icon-emoji">✅</span>
          </div>
          <div class="card-info">
            <div class="card-value">{{ stats.masteredCount || 0 }}</div>
            <div class="card-label">已掌握</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)">
            <span class="card-icon-emoji">📖</span>
          </div>
          <div class="card-info">
            <div class="card-value">{{ stats.learningCount || 0 }}</div>
            <div class="card-label">学习中</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
            <span class="card-icon-emoji">⚠️</span>
          </div>
          <div class="card-info">
            <div class="card-value">{{ stats.weakCount || 0 }}</div>
            <div class="card-label">薄弱项</div>
          </div>
        </div>
      </div>

      <!-- 知识点掌握情况 -->
      <div class="section" style="margin-top: 30px">
        <h3 class="section-title">📈 知识点掌握情况</h3>
        <div class="progress-list">
          <div v-for="item in progress" :key="item.id" class="progress-item">
            <div class="progress-info">
              <span class="title">{{ item.knowledge_point_title || '未命名知识点' }}</span>
              <span class="percentage">{{ Math.round(item.mastery_level * 100) }}%</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${item.mastery_level * 100}%` }"
                :class="getProgressClass(item.mastery_level)"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习建议 -->
      <div v-if="recommendations.length > 0" class="section">
        <h3 class="section-title">💡 学习建议</h3>
        <div class="recommendations-list">
          <div v-for="(rec, index) in recommendations" :key="index" class="recommendation-item">
            <div class="rec-icon">💪</div>
            <div class="rec-content">
              <p>{{ rec.suggestion }}</p>
              <span class="rec-mastery">当前掌握: {{ Math.round(rec.masteryLevel * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 薄弱环节 -->
      <div v-if="stats.weakPoints && stats.weakPoints.length > 0" class="section weak-section">
        <h3 class="section-title">⚠️ 薄弱环节</h3>
        <div class="weak-points-list">
          <div v-for="point in stats.weakPoints" :key="point.id" class="weak-point-item">
            <span class="point-title">{{ point.title }}</span>
            <span class="point-mastery">{{ Math.round(point.masteryLevel * 100) }}%</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { progressApi } from '@/api'

const stats = ref({})
const progress = ref([])
const recommendations = ref([])

onMounted(async () => {
  await loadData()
})

async function loadData() {
  try {
    const [statsRes, progressRes, recRes] = await Promise.all([
      progressApi.getStats(),
      progressApi.getList(),
      progressApi.getRecommendations()
    ])

    stats.value = statsRes.data || {}
    progress.value = progressRes.data || []
    recommendations.value = recRes.data || []
  } catch (error) {
    console.error('加载学习进度失败:', error)
  }
}

function getProgressClass(level) {
  if (level >= 0.8) return 'mastered'
  if (level >= 0.5) return 'learning'
  return 'weak'
}
</script>

<style scoped>
.progress-view {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease;
}

/* 玻璃态卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.glass-card:hover {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  font-size: 28px;
}

.icon-emoji {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.card-header h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #2d3748;
}

.card-header p {
  margin: 0;
  font-size: 13px;
  color: #718096;
}

/* 概览网格 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease both;
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  font-size: 32px;
}

.card-icon-emoji {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-label {
  font-size: 14px;
  color: #718096;
  margin-top: 4px;
}

/* 通用区块 */
.section {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%);
  border-radius: 12px;
  padding: 24px;
  margin-top: 30px;
  border: 2px solid rgba(102, 126, 234, 0.1);
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #2d3748;
  padding-bottom: 12px;
  border-bottom: 3px solid rgba(102, 126, 234, 0.2);
}

/* 进度条 */
.progress-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.progress-item {
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.progress-item:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.progress-info .title {
  font-weight: 500;
  color: #2d3748;
}

.progress-info .percentage {
  font-weight: bold;
  color: #667eea;
}

.progress-bar {
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 5px;
}

.progress-fill.mastered {
  background: linear-gradient(90deg, #43e97b, #38f9d7);
}

.progress-fill.learning {
  background: linear-gradient(90deg, #f6d365, #fda085);
}

.progress-fill.weak {
  background: linear-gradient(90deg, #f093fb, #f5576c);
}

/* 学习建议 */
.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.recommendation-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.recommendation-item:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.rec-icon {
  font-size: 24px;
}

.rec-content p {
  margin: 0 0 5px 0;
  color: #4a5568;
}

.rec-mastery {
  font-size: 12px;
  color: #6b7280;
}

/* 薄弱环节 */
.weak-section {
  border-color: rgba(245, 87, 108, 0.2);
}

.weak-points-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.weak-point-item {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background: linear-gradient(135deg, rgba(254, 226, 226, 0.6) 0%, rgba(255, 255, 255, 0.8) 100%);
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  transition: all 0.3s ease;
}

.weak-point-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
}

.point-title {
  font-weight: 500;
  color: #2d3748;
}

.point-mastery {
  color: #dc2626;
  font-weight: bold;
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
