<template>
  <div class="knowledge-recommendation-container">
    <el-card class="header-card">
      <div class="header-content">
        <h2>智能知识点推荐</h2>
        <div class="controls">
          <el-select v-model="selectedCourse" placeholder="选择课程" @change="loadRecommendations">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.title"
              :value="course.id"
            />
          </el-select>
          <el-select v-model="strategy" placeholder="推荐策略" @change="loadRecommendations">
            <el-option label="自适应推荐" value="adaptive" />
            <el-option label="复习推荐" value="review" />
            <el-option label="薄弱点推荐" value="weakness" />
            <el-option label="顺序学习" value="sequential" />
          </el-select>
          <el-button type="primary" @click="loadRecommendations" :loading="loading">
            <el-icon><Refresh /></el-icon>
            获取推荐
          </el-button>
          <el-button type="warning" @click="batchEvaluate" :loading="batchEvaluating">
            <el-icon><DataAnalysis /></el-icon>
            批量评估
          </el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>推荐列表</span>
              <el-tag type="info">共 {{ recommendations.length }} 个</el-tag>
            </div>
          </template>

          <el-empty v-if="!loading && recommendations.length === 0" description="暂无推荐" />

          <div v-else class="recommendation-list">
            <div
              v-for="(item, index) in recommendations"
              :key="item.id"
              class="recommendation-item"
              @click="showDetail(item)"
            >
              <div class="item-rank">{{ index + 1 }}</div>
              <div class="item-content">
                <div class="item-header">
                  <h4>{{ item.title }}</h4>
                  <el-tag :type="getStrategyTagType(item.recommendation_score)" size="small">
                    推荐度: {{ Math.round(item.recommendation_score * 100) }}%
                  </el-tag>
                </div>
                
                <div class="item-meta">
                  <el-tag size="small" type="info">难度 {{ item.difficulty }}</el-tag>
                  <el-progress
                    :percentage="Math.round((item.mastery_level || 0) * 100)"
                    :color="getMasteryColor(item.mastery_level)"
                    :stroke-width="8"
                    style="flex: 1; margin-left: 10px"
                  />
                </div>

                <div class="item-reason">
                  <el-icon><InfoFilled /></el-icon>
                  <span>{{ item.reason }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="stats-card">
          <template #header>
            <div class="card-header">
              <span>学习建议</span>
            </div>
          </template>

          <div v-if="recommendations.length > 0" class="learning-advice">
            <el-alert
              title="今日学习建议"
              type="success"
              :closable="false"
              show-icon
              class="mb-20"
            >
              <template #default>
                <p>建议优先学习以下知识点：</p>
                <ol class="advice-list">
                  <li v-for="item in recommendations.slice(0, 3)" :key="item.id">
                    {{ item.title }}
                  </li>
                </ol>
              </template>
            </el-alert>

            <el-divider />

            <h4>学习统计</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="推荐知识点">
                {{ recommendations.length }} 个
              </el-descriptions-item>
              <el-descriptions-item label="平均掌握度">
                {{ averageMastery }}%
              </el-descriptions-item>
              <el-descriptions-item label="薄弱知识点">
                {{ weakCount }} 个
              </el-descriptions-item>
              <el-descriptions-item label="已掌握">
                {{ masteredCount }} 个
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <el-empty v-else description="获取推荐后显示建议" />
        </el-card>

        <el-card class="order-card" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>推荐学习顺序</span>
              <el-button size="small" @click="loadLearningOrder">
                生成顺序
              </el-button>
            </div>
          </template>

          <el-timeline v-if="learningOrder.length > 0">
            <el-timeline-item
              v-for="(item, index) in learningOrder"
              :key="item.id"
              :timestamp="`第 ${item.order} 步`"
              :color="getMasteryColor(item.mastery_level)"
            >
              <h5>{{ item.title }}</h5>
              <p>难度: {{ item.difficulty }} | 掌握度: {{ Math.round(item.mastery_level * 100) }}%</p>
            </el-timeline-item>
          </el-timeline>

          <el-empty v-else description="点击生成学习顺序" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showDetailDialog" title="知识点详情" width="600px">
      <div v-if="selectedItem" class="detail-content">
        <h3>{{ selectedItem.title }}</h3>
        
        <el-descriptions :column="1" border>
          <el-descriptions-item label="难度">
            <el-rate v-model="selectedItem.difficulty" disabled />
          </el-descriptions-item>
          <el-descriptions-item label="掌握度">
            <el-progress
              :percentage="Math.round((selectedItem.mastery_level || 0) * 100)"
              :color="getMasteryColor(selectedItem.mastery_level)"
            />
          </el-descriptions-item>
          <el-descriptions-item label="推荐理由">
            {{ selectedItem.reason }}
          </el-descriptions-item>
          <el-descriptions-item label="推荐度">
            {{ Math.round(selectedItem.recommendation_score * 100) }}%
          </el-descriptions-item>
        </el-descriptions>

        <div class="actions">
          <el-button type="primary" @click="startLearning">开始学习</el-button>
          <el-button @click="evaluateMastery">重新评估</el-button>
          <el-button type="info" @click="viewLearningPath" :loading="loadingPath">查看学习路径</el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showLearningPathDialog" title="学习路径" width="700px">
      <div v-if="learningPathSteps.length > 0" class="learning-path-content">
        <p class="path-description">
          从当前知识点到目标知识点的学习路径，共 {{ learningPathSteps.length }} 步：
        </p>
        <el-timeline>
          <el-timeline-item
            v-for="(step, index) in learningPathSteps"
            :key="step.id"
            :timestamp="`第 ${index + 1} 步`"
            :color="getMasteryColor(step.mastery_level)"
            :hollow="index < learningPathSteps.length - 1"
          >
            <div class="path-step">
              <h4>{{ step.title }}</h4>
              <div class="step-meta">
                <el-tag size="small" type="info">难度 {{ step.difficulty }}</el-tag>
                <el-progress
                  :percentage="Math.round((step.mastery_level || 0) * 100)"
                  :color="getMasteryColor(step.mastery_level)"
                  :stroke-width="6"
                  style="flex: 1; margin-left: 10px; max-width: 200px"
                />
              </div>
              <p v-if="step.description" class="step-desc">{{ step.description }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
      <el-empty v-else description="暂无学习路径数据" />
    </el-dialog>

    <el-dialog v-model="showBatchResult" title="批量评估结果" width="800px">
      <div v-if="batchResult" class="batch-result">
        <el-alert
          :title="`课程整体掌握度: ${batchResult.overallAverage}%`"
          :type="batchResult.overallAverage >= 70 ? 'success' : batchResult.overallAverage >= 50 ? 'warning' : 'error'"
          :closable="false"
          show-icon
          class="mb-20"
        />

        <h4>各知识点评估详情</h4>
        <el-table :data="batchResult.points" stripe style="width: 100%" class="mb-20">
          <el-table-column prop="title" label="知识点" min-width="150" />
          <el-table-column label="难度" width="80" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.difficulty <= 2 ? 'success' : row.difficulty <= 3 ? 'warning' : 'danger'">
                {{ row.difficulty }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="掌握度" width="200">
            <template #default="{ row }">
              <el-progress
                :percentage="Math.round(row.mastery_level * 100)"
                :color="getMasteryColor(row.mastery_level)"
              />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.mastery_level >= 0.8 ? 'success' : row.mastery_level >= 0.5 ? 'warning' : 'danger'"
                size="small"
              >
                {{ row.mastery_level >= 0.8 ? '已掌握' : row.mastery_level >= 0.5 ? '学习中' : '薄弱' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="batchResult.weakPoints && batchResult.weakPoints.length > 0">
          <h4 class="weak-points-title">薄弱知识点（需要重点复习）</h4>
          <el-tag
            v-for="point in batchResult.weakPoints"
            :key="point.id"
            type="danger"
            size="large"
            class="weak-tag"
          >
            {{ point.title }} ({{ Math.round(point.mastery_level * 100) }}%)
          </el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, InfoFilled, DataAnalysis } from '@element-plus/icons-vue'
import { knowledgeGraphApi, knowledgeApi } from '@/api'

const selectedCourse = ref(null)
const strategy = ref('adaptive')
const loading = ref(false)
const recommendations = ref([])
const learningOrder = ref([])
const showDetailDialog = ref(false)
const selectedItem = ref(null)
const loadingPath = ref(false)
const showLearningPathDialog = ref(false)
const learningPathSteps = ref([])
const batchEvaluating = ref(false)
const showBatchResult = ref(false)
const batchResult = ref(null)

const courses = ref([])

async function loadCourses() {
  try {
    const res = await knowledgeApi.getCourses()
    if (res?.success && res.data?.length > 0) {
      courses.value = res.data
      selectedCourse.value = res.data[0].id
    }
  } catch { /* fallback */ }
}

onMounted(loadCourses)

const averageMastery = computed(() => {
  if (recommendations.value.length === 0) return 0
  const sum = recommendations.value.reduce((acc, item) => {
    return acc + (item.mastery_level || 0)
  }, 0)
  return Math.round((sum / recommendations.value.length) * 100)
})

const weakCount = computed(() => {
  return recommendations.value.filter(item => (item.mastery_level || 0) < 0.5).length
})

const masteredCount = computed(() => {
  return recommendations.value.filter(item => (item.mastery_level || 0) >= 0.8).length
})

async function loadRecommendations() {
  if (!selectedCourse.value) return
  
  loading.value = true
  try {
    const response = await knowledgeGraphApi.recommendKnowledgePoints(
      selectedCourse.value,
      { limit: 20, strategy: strategy.value }
    )
    recommendations.value = response.data.recommendations
  } catch (error) {
    ElMessage.error('获取推荐失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function loadLearningOrder() {
  if (!selectedCourse.value) return
  
  try {
    const response = await knowledgeGraphApi.getLearningOrder(selectedCourse.value)
    learningOrder.value = response.data.order.slice(0, 10)
    ElMessage.success('学习顺序已生成')
  } catch (error) {
    ElMessage.error('生成学习顺序失败: ' + error.message)
  }
}

function showDetail(item) {
  selectedItem.value = item
  showDetailDialog.value = true
}

function startLearning() {
  ElMessage.info('开始学习: ' + selectedItem.value.title)
}

async function evaluateMastery() {
  if (!selectedItem.value) return
  
  try {
    const response = await knowledgeGraphApi.evaluateMastery(selectedItem.value.id)
    ElMessage.success(`掌握度评估完成: ${response.data.mastery_level}`)
    loadRecommendations()
  } catch (error) {
    ElMessage.error('评估失败: ' + error.message)
  }
}

function getMasteryColor(mastery) {
  if (mastery === null || mastery === undefined) return '#909399'
  if (mastery >= 0.8) return '#67C23A'
  if (mastery >= 0.5) return '#E6A23C'
  return '#F56C6C'
}

function getStrategyTagType(score) {
  if (score >= 0.8) return 'success'
  if (score >= 0.6) return 'warning'
  return 'info'
}

async function viewLearningPath() {
  if (!selectedItem.value || !selectedCourse.value) return

  loadingPath.value = true
  try {
    const response = await knowledgeGraphApi.getLearningPath(selectedCourse.value, selectedItem.value.id)
    if (response.data?.path && response.data.path.length > 0) {
      learningPathSteps.value = response.data.path
      showLearningPathDialog.value = true
    } else {
      ElMessage.info('该知识点暂无学习路径')
    }
  } catch (error) {
    ElMessage.error('获取学习路径失败: ' + error.message)
  } finally {
    loadingPath.value = false
  }
}

async function batchEvaluate() {
  if (!selectedCourse.value) {
    ElMessage.warning('请先选择课程')
    return
  }

  batchEvaluating.value = true
  try {
    const response = await knowledgeGraphApi.evaluateCourseMastery(selectedCourse.value)
    const data = response.data

    const points = data.points || data.results || []
    const overallAverage = data.overallAverage || data.average ||
      (points.length > 0
        ? Math.round(points.reduce((acc, p) => acc + (p.mastery_level || 0), 0) / points.length * 100)
        : 0)
    const weakPoints = data.weakPoints || data.weak_points ||
      points.filter(p => (p.mastery_level || 0) < 0.5)

    batchResult.value = {
      points,
      overallAverage,
      weakPoints
    }
    showBatchResult.value = true
    ElMessage.success('批量评估完成')
    loadRecommendations()
  } catch (error) {
    ElMessage.error('批量评估失败: ' + error.message)
  } finally {
    batchEvaluating.value = false
  }
}
</script>

<style scoped>
.knowledge-recommendation-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
}

.controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.recommendation-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.recommendation-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.item-rank {
  width: 40px;
  height: 40px;
  background: #409EFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.item-header h4 {
  margin: 0;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.item-reason {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
  font-size: 14px;
}

.stats-card,
.order-card {
  height: fit-content;
}

.learning-advice {
  padding: 10px;
}

.mb-20 {
  margin-bottom: 20px;
}

.advice-list {
  margin: 10px 0;
  padding-left: 20px;
}

.advice-list li {
  margin: 5px 0;
}

.detail-content h3 {
  margin-top: 0;
}

.actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.learning-path-content {
  padding: 10px;
}

.path-description {
  color: #606266;
  margin-bottom: 20px;
}

.path-step h4 {
  margin: 0 0 8px;
}

.step-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.step-desc {
  color: #909399;
  font-size: 13px;
  margin: 0;
}

.batch-result {
  padding: 10px;
}

.batch-result h4 {
  margin: 0 0 15px;
  font-size: 16px;
}

.weak-points-title {
  margin: 20px 0 10px;
  font-size: 16px;
}

.weak-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>
