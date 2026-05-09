<template>
  <div class="feedback-history-view">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon">
              <span class="icon-emoji">💬</span>
            </div>
            <div>
              <h2>反馈历史</h2>
              <p>查看过往评价与反馈记录</p>
            </div>
          </div>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载中...</p>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-else-if="feedbackList.length === 0"
        description="还没有反馈记录，完成一次对战或评估后进行评价吧！"
        :image-size="200"
      >
        <template #image>
          <div class="empty-illustration">
            <span class="empty-emoji">📋</span>
          </div>
        </template>
      </el-empty>

      <!-- 反馈列表 -->
      <div v-else class="feedback-timeline">
        <div
          v-for="(item, index) in feedbackList"
          :key="item.id || index"
          class="feedback-card"
          :style="{ animationDelay: `${index * 0.08}s` }"
        >
          <div class="feedback-header">
            <div class="feedback-type">
              <span class="type-icon">{{ getTypeIcon(item.type || item.battleId) }}</span>
              <span class="type-text">{{ getTypeText(item.type || item.battleId) }}</span>
            </div>
            <div class="feedback-time">{{ formatDate(item.createdAt || item.created_at) }}</div>
          </div>

          <div class="feedback-body">
            <!-- 评分 -->
            <div class="rating-display">
              <span
                v-for="star in 5"
                :key="star"
                class="display-star"
                :class="{ active: star <= (item.rating || 0) }"
              >
                ★
              </span>
              <span class="rating-number">{{ item.rating || 0 }} / 5</span>
            </div>

            <!-- 反馈文本 -->
            <p v-if="item.feedback" class="feedback-text">{{ item.feedback }}</p>
            <p v-else class="feedback-text empty-text">未填写文字评价</p>

            <!-- 对战详情 -->
            <div v-if="item.result || item.totalQuestions" class="feedback-meta">
              <div v-if="item.result" class="meta-item">
                <span class="meta-label">结果</span>
                <span class="meta-value" :class="item.result">
                  {{ getResultText(item.result) }}
                </span>
              </div>
              <div v-if="item.totalQuestions" class="meta-item">
                <span class="meta-label">答题</span>
                <span class="meta-value">
                  {{ item.correctCount || 0 }} / {{ item.totalQuestions }}
                </span>
              </div>
              <div v-if="item.duration" class="meta-item">
                <span class="meta-label">用时</span>
                <span class="meta-value">{{ item.duration }}秒</span>
              </div>
              <div v-if="item.mode" class="meta-item">
                <span class="meta-label">模式</span>
                <span class="meta-value">{{ getModeText(item.mode) }}</span>
              </div>
            </div>
          </div>

          <!-- 调整学习计划按钮 -->
          <div class="feedback-actions">
            <button
              class="adjust-plan-btn"
              :disabled="adjustingPlanId === item.id"
              @click="handleAdjustPlan(item)"
            >
              <span v-if="adjustingPlanId !== item.id">调整学习计划</span>
              <span v-else>调整中...</span>
            </button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { feedbackApi } from '@/api'

const feedbackList = ref([])
const loading = ref(false)
const adjustingPlanId = ref(null)

onMounted(async () => {
  await loadFeedbacks()
})

async function loadFeedbacks() {
  loading.value = true
  try {
    const res = await feedbackApi.getList()
    if (res?.success && Array.isArray(res.data)) {
      feedbackList.value = res.data
    }
  } catch (error) {
    console.error('加载反馈历史失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleAdjustPlan(item) {
  adjustingPlanId.value = item.id
  try {
    const planId = item.planId || item.battleId || ''
    await feedbackApi.adjustPlan(planId)
    ElMessage.success('已触发学习计划调整，请等待AI生成新计划')
  } catch (error) {
    console.error('调整学习计划失败:', error)
    ElMessage.error('调整失败，请稍后重试')
  } finally {
    adjustingPlanId.value = null
  }
}

function getTypeIcon(type) {
  if (type === 'battle' || type) return '⚔️'
  return '📝'
}

function getTypeText(type) {
  if (type === 'battle' || type) return '对战评价'
  return '其他评价'
}

function getResultText(result) {
  const map = { win: '胜利', lose: '惜败', tie: '平局' }
  return map[result] || result
}

function getModeText(mode) {
  const map = { quick: '快速对战', practice: '练习模式', challenge: '挑战模式' }
  return map[mode] || mode
}

function formatDate(dateStr) {
  if (!dateStr) return '未知时间'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.feedback-history-view {
  max-width: 800px;
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

/* 加载状态 */
.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #718096;
  font-size: 14px;
}

/* 空状态 */
.empty-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}

.empty-emoji {
  font-size: 80px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 反馈时间线 */
.feedback-timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 反馈卡片 */
.feedback-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 250, 255, 0.9) 100%);
  border: 2px solid rgba(102, 126, 234, 0.15);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease both;
}

.feedback-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
}

/* 卡片头部 */
.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.feedback-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon {
  font-size: 20px;
}

.type-text {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.feedback-time {
  font-size: 12px;
  color: #a0aec0;
}

/* 评分显示 */
.rating-display {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.display-star {
  font-size: 24px;
  color: #e2e8f0;
  transition: all 0.2s ease;
}

.display-star.active {
  color: #f6ad55;
}

.rating-number {
  font-size: 16px;
  font-weight: 700;
  color: #f6ad55;
  margin-left: 4px;
}

/* 反馈文本 */
.feedback-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0 0 16px 0;
  padding: 12px;
  background: rgba(102, 126, 234, 0.04);
  border-radius: 10px;
  border-left: 3px solid rgba(102, 126, 234, 0.3);
}

.feedback-text.empty-text {
  color: #a0aec0;
  font-style: italic;
}

/* 元数据 */
.feedback-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(102, 126, 234, 0.06);
  border-radius: 8px;
  font-size: 13px;
}

.meta-label {
  color: #718096;
  font-weight: 500;
}

.meta-value {
  color: #2d3748;
  font-weight: 600;
}

.meta-value.win {
  color: #48bb78;
}

.meta-value.lose {
  color: #f56565;
}

.meta-value.tie {
  color: #f6ad55;
}

/* 操作按钮 */
.feedback-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid rgba(102, 126, 234, 0.08);
}

.adjust-plan-btn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.adjust-plan-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.adjust-plan-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 空状态 */
.empty-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}

.empty-emoji {
  font-size: 80px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
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

@media (max-width: 768px) {
  .feedback-history-view {
    padding: 0 8px;
  }

  .feedback-card {
    padding: 16px;
  }

  .feedback-meta {
    flex-direction: column;
  }

  .feedback-actions {
    justify-content: center;
  }
}
</style>
