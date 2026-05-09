<template>
  <div class="reviews-container">
    <!-- 今日待复习 -->
    <el-card class="glass-card" shadow="hover" style="margin-bottom: 24px">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <el-icon :size="24"><Clock /></el-icon>
            </div>
            <div>
              <h2>今日待复习</h2>
              <p>根据遗忘曲线安排的今日复习任务</p>
            </div>
          </div>
          <div class="header-actions">
            <el-button
              type="primary"
              class="gradient-btn"
              :loading="generating"
              @click="handleGenerate"
            >
              <el-icon><MagicStick /></el-icon>
              智能生成
            </el-button>
          </div>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="dueLoading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>

      <!-- 空状态 -->
      <div v-else-if="dueReviews.length === 0" class="empty-state">
        <el-empty description="今日暂无复习任务">
          <el-button type="primary" class="gradient-btn" @click="handleGenerate">
            <el-icon><MagicStick /></el-icon>
            智能生成复习计划
          </el-button>
        </el-empty>
      </div>

      <!-- 复习卡片列表 -->
      <div v-else class="review-cards">
        <div
          v-for="review in dueReviews"
          :key="review.id"
          class="review-card"
          :class="{ 'review-completed': review.status === 'completed' }"
        >
          <div class="review-card-header">
            <div class="review-title-row">
              <h4 class="review-title">{{ review.title || '未命名复习' }}</h4>
              <el-tag
                :type="getStatusType(review.status)"
                size="small"
                effect="dark"
              >
                {{ getStatusLabel(review.status) }}
              </el-tag>
            </div>
            <el-tag
              v-if="review.knowledgePoint || review.knowledgePointName"
              type="info"
              size="small"
              effect="plain"
              class="knowledge-tag"
            >
              <el-icon><Collection /></el-icon>
              {{ review.knowledgePoint || review.knowledgePointName }}
            </el-tag>
          </div>

          <p class="review-content">
            {{ truncateText(review.content || review.description || '', 120) }}
          </p>

          <div class="review-meta">
            <span class="review-date">
              <el-icon><Calendar /></el-icon>
              到期：{{ formatDate(review.dueDate || review.nextReviewDate) }}
            </span>
            <span v-if="review.reviewCount !== undefined" class="review-count">
              已复习 {{ review.reviewCount }} 次
            </span>
          </div>

          <div class="review-actions">
            <el-button
              v-if="review.status !== 'completed'"
              type="success"
              size="small"
              class="action-btn success-btn"
              :loading="completingId === review.id"
              @click="handleComplete(review.id)"
            >
              <el-icon><Check /></el-icon>
              完成复习
            </el-button>
            <el-button
              type="danger"
              size="small"
              plain
              class="action-btn"
              :loading="deletingId === review.id"
              @click="handleDelete(review.id)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 全部复习计划 -->
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div>
              <h2>全部复习计划</h2>
              <p>管理您的所有复习任务</p>
            </div>
          </div>
          <div class="header-actions">
            <el-select
              v-model="statusFilter"
              placeholder="筛选状态"
              clearable
              size="large"
              class="status-filter"
              @change="fetchAllReviews"
            >
              <el-option label="全部" value="" />
              <el-option label="待复习" value="pending" />
              <el-option label="已完成" value="completed" />
              <el-option label="已过期" value="overdue" />
            </el-select>
            <el-button
              class="gradient-btn"
              type="primary"
              :loading="allLoading"
              @click="fetchAllReviews"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="allLoading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 空状态 -->
      <div v-else-if="allReviews.length === 0" class="empty-state">
        <el-empty description="暂无复习计划">
          <el-button type="primary" class="gradient-btn" @click="handleGenerate">
            <el-icon><MagicStick /></el-icon>
            智能生成复习计划
          </el-button>
        </el-empty>
      </div>

      <!-- 复习计划表格 -->
      <el-table
        v-else
        :data="allReviews"
        class="gradient-table"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="title" label="标题" min-width="160">
          <template #default="{ row }">
            <span class="table-title">{{ row.title || '未命名复习' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="内容预览" min-width="220">
          <template #default="{ row }">
            <span class="table-content">
              {{ truncateText(row.content || row.description || '', 60) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="知识点" width="150">
          <template #default="{ row }">
            <el-tag
              v-if="row.knowledgePoint || row.knowledgePointName"
              type="info"
              size="small"
              effect="plain"
            >
              {{ row.knowledgePoint || row.knowledgePointName }}
            </el-tag>
            <span v-else class="text-muted">--</span>
          </template>
        </el-table-column>

        <el-table-column label="到期日期" width="140">
          <template #default="{ row }">
            <span class="table-date">
              {{ formatDate(row.dueDate || row.nextReviewDate) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
              effect="dark"
            >
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'completed'"
              type="success"
              size="small"
              link
              :loading="completingId === row.id"
              @click="handleComplete(row.id)"
            >
              <el-icon><Check /></el-icon>
              完成
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              :loading="deletingId === row.id"
              @click="handleDelete(row.id)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 完成复习质量评分对话框 -->
    <el-dialog
      v-model="showQualityDialog"
      title="复习完成评分"
      width="420px"
      :close-on-click-modal="false"
      class="quality-dialog"
    >
      <div class="quality-content">
        <p class="quality-hint">请为本次复习效果评分，系统将据此调整下次复习间隔：</p>
        <div class="quality-options">
          <div
            v-for="q in qualityOptions"
            :key="q.value"
            class="quality-option"
            :class="{ active: selectedQuality === q.value }"
            @click="selectedQuality = q.value"
          >
            <div class="quality-score">{{ q.value }}</div>
            <div class="quality-label">{{ q.label }}</div>
            <div class="quality-desc">{{ q.description }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showQualityDialog = false">取消</el-button>
        <el-button
          type="primary"
          class="gradient-btn"
          :loading="completingId !== null"
          @click="confirmComplete"
        >
          确认完成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reviewApi } from '@/api'

// 状态
const dueLoading = ref(false)
const allLoading = ref(false)
const generating = ref(false)
const completingId = ref(null)
const deletingId = ref(null)
const statusFilter = ref('')
const dueReviews = ref([])
const allReviews = ref([])

// 完成复习评分
const showQualityDialog = ref(false)
const pendingCompleteId = ref(null)
const selectedQuality = ref(4)

const qualityOptions = [
  { value: 1, label: '完全忘记', description: '完全没有印象' },
  { value: 2, label: '勉强记得', description: '看到答案后才想起来' },
  { value: 3, label: '有些困难', description: '费了一番功夫才回忆起' },
  { value: 4, label: '比较顺利', description: '稍作思考即可回答' },
  { value: 5, label: '非常熟练', description: '立刻就能回忆起来' }
]

// 获取今日待复习
async function fetchDueReviews() {
  dueLoading.value = true
  try {
    const res = await reviewApi.getDueReviews()
    if (res?.success) {
      dueReviews.value = res.data || []
    } else if (Array.isArray(res)) {
      dueReviews.value = res
    } else {
      dueReviews.value = res?.data || []
    }
  } catch (error) {
    console.error('获取今日复习任务失败:', error)
    dueReviews.value = []
  } finally {
    dueLoading.value = false
  }
}

// 获取全部复习计划
async function fetchAllReviews() {
  allLoading.value = true
  try {
    const res = await reviewApi.getList(statusFilter.value || undefined)
    if (res?.success) {
      allReviews.value = res.data || []
    } else if (Array.isArray(res)) {
      allReviews.value = res
    } else {
      allReviews.value = res?.data || []
    }
  } catch (error) {
    console.error('获取复习计划列表失败:', error)
    allReviews.value = []
  } finally {
    allLoading.value = false
  }
}

// 智能生成复习计划
async function handleGenerate() {
  generating.value = true
  try {
    const res = await reviewApi.generateFromProgress()
    if (res?.success) {
      ElMessage.success('复习计划生成成功')
    } else if (res?.message) {
      ElMessage.success(res.message)
    } else {
      ElMessage.success('复习计划生成成功')
    }
    // 刷新列表
    await fetchDueReviews()
    await fetchAllReviews()
  } catch (error) {
    console.error('生成复习计划失败:', error)
    ElMessage.error('生成复习计划失败，请稍后重试')
  } finally {
    generating.value = false
  }
}

// 打开完成复习评分对话框
function handleComplete(id) {
  pendingCompleteId.value = id
  selectedQuality.value = 4
  showQualityDialog.value = true
}

// 确认完成复习
async function confirmComplete() {
  if (!pendingCompleteId.value) return
  completingId.value = pendingCompleteId.value
  try {
    const res = await reviewApi.completeReview(pendingCompleteId.value, selectedQuality.value)
    if (res?.success || res === undefined) {
      ElMessage.success('复习完成')
      showQualityDialog.value = false
      pendingCompleteId.value = null
      // 刷新列表
      await fetchDueReviews()
      await fetchAllReviews()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (error) {
    console.error('完成复习失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    completingId.value = null
  }
}

// 删除复习
async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定要删除这条复习计划吗？此操作不可恢复。', '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return // 用户取消
  }

  deletingId.value = id
  try {
    const res = await reviewApi.delete(id)
    if (res?.success || res === undefined) {
      ElMessage.success('删除成功')
      // 刷新列表
      await fetchDueReviews()
      await fetchAllReviews()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (error) {
    console.error('删除复习失败:', error)
    ElMessage.error('删除失败，请稍后重试')
  } finally {
    deletingId.value = null
  }
}

// 工具函数：格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '--'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return dateStr
  }
}

// 工具函数：截断文本
function truncateText(text, maxLen) {
  if (!text) return '暂无内容'
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

// 工具函数：状态标签类型
function getStatusType(status) {
  const map = {
    pending: 'warning',
    completed: 'success',
    overdue: 'danger'
  }
  return map[status] || 'info'
}

// 工具函数：状态标签文本
function getStatusLabel(status) {
  const map = {
    pending: '待复习',
    completed: '已完成',
    overdue: '已过期'
  }
  return map[status] || status || '未知'
}

// 初始化
onMounted(async () => {
  await Promise.all([fetchDueReviews(), fetchAllReviews()])
})
</script>

<style scoped>
.reviews-container {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.status-filter {
  width: 140px;
}

/* 加载与空状态 */
.loading-state {
  padding: 20px 0;
}

.empty-state {
  padding: 40px 0;
}

/* 复习卡片 */
.review-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  border: 1px solid rgba(102, 126, 234, 0.15);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.review-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
  border-color: rgba(102, 126, 234, 0.3);
}

.review-card.review-completed {
  opacity: 0.7;
  border-color: rgba(103, 211, 145, 0.3);
}

.review-card-header {
  margin-bottom: 12px;
}

.review-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.review-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.knowledge-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.review-content {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #718096;
  line-height: 1.6;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #a0aec0;
}

.review-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.review-count {
  color: #667eea;
}

.review-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  border-radius: 8px;
}

.success-btn {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(67, 233, 123, 0.3);
}

/* 表格 */
.gradient-table {
  border-radius: 12px;
  overflow: hidden;
}

.gradient-table :deep(.el-table__header th) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  color: #2d3748;
  font-weight: 600;
}

.gradient-table :deep(.el-table__row:hover) {
  background: rgba(102, 126, 234, 0.05);
}

.table-title {
  font-weight: 600;
  color: #2d3748;
}

.table-content {
  font-size: 13px;
  color: #718096;
}

.table-date {
  font-size: 13px;
  color: #a0aec0;
}

.text-muted {
  color: #cbd5e0;
  font-size: 13px;
}

/* 评分对话框 */
.quality-dialog :deep(.el-dialog) {
  border-radius: 16px;
}

.quality-content {
  padding: 8px 0;
}

.quality-hint {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #718096;
  line-height: 1.6;
}

.quality-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quality-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border: 2px solid #edf2f7;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quality-option:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.03);
}

.quality-option.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.08);
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.15);
}

.quality-score {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.quality-option.active .quality-score {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.quality-label {
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
  min-width: 72px;
}

.quality-desc {
  font-size: 13px;
  color: #a0aec0;
}

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

/* 响应式 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .status-filter {
    width: 100%;
  }

  .review-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .quality-option {
    flex-wrap: wrap;
  }
}
</style>
