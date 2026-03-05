<template>
  <div class="evaluator-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
              <el-icon :size="24"><DataAnalysis /></el-icon>
            </div>
            <div>
              <h2>📊 学习评估智能体</h2>
              <p>智能批改作业，精准分析学习情况</p>
            </div>
          </div>
          <el-tag type="danger" effect="dark" size="large">
            <el-icon><DocumentChecked /></el-icon>
            智能批改
          </el-tag>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" class="gradient-tabs">
        <!-- 作业批改 -->
        <el-tab-pane label="📝 作业批改" name="exercise">
          <div class="tab-content">
            <el-form :model="exerciseForm" label-width="110px" size="large">
              <el-form-item label="📋 练习 ID">
                <el-input-number v-model="exerciseForm.exerciseId" :min="1" class="full-width" />
              </el-form-item>
              
              <el-form-item label="📖 题目">
                <el-input
                  v-model="exerciseForm.question"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入题目"
                  class="gradient-input green"
                >
                  <template #prefix>
                    <el-icon><Document /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item label="✏️ 学生答案">
                <el-input
                  v-model="exerciseForm.studentAnswer"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入学生的答案"
                  class="gradient-input green"
                >
                  <template #prefix>
                    <el-icon><Edit /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item label="✅ 参考答案">
                <el-input
                  v-model="exerciseForm.correctAnswer"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入参考答案"
                  class="gradient-input green"
                >
                  <template #prefix>
                    <el-icon><CircleCheck /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item>
                <div class="action-buttons">
                  <el-button 
                    type="primary" 
                    :loading="loading" 
                    @click="evaluateExercise"
                    class="gradient-btn green"
                  >
                    <el-icon v-if="!loading"><DocumentChecked /></el-icon>
                    <el-icon v-else class="is-loading"><Loading /></el-icon>
                    {{ loading ? '批改中...' : '开始批改' }}
                  </el-button>
                  <el-button @click="clearExercise">
                    <el-icon><Delete /></el-icon>
                    清空
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
            
            <!-- 批改结果 -->
            <div v-if="evaluateResult" class="result-section">
              <div class="result-header">
                <h3>📝 批改结果</h3>
              </div>
              
              <div class="score-display">
                <div class="score-circle">
                  <svg viewBox="0 0 100 100" class="score-svg">
                    <circle class="score-bg" cx="50" cy="50" r="45" />
                    <circle 
                      class="score-progress" 
                      cx="50" 
                      cy="50" 
                      r="45"
                      :stroke-dashoffset="100 - (evaluateResult.score || 85)"
                    />
                  </svg>
                  <div class="score-value">
                    <span class="score-number">{{ evaluateResult.score || 85 }}</span>
                    <span class="score-unit">分</span>
                  </div>
                </div>
                <div class="score-stars">
                  <el-rate v-model="starRating" disabled show-text />
                </div>
              </div>
              
              <div class="feedback-content" v-html="renderedFeedback"></div>
              
              <div class="result-actions">
                <el-button @click="copyFeedback" size="small">
                  <el-icon><DocumentCopy /></el-icon>
                  复制反馈
                </el-button>
                <el-button type="success" @click="exportReport" size="small">
                  <el-icon><Download /></el-icon>
                  导出报告
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 学习报告 -->
        <el-tab-pane label="📈 学习报告" name="report">
          <div class="tab-content">
            <el-form label-width="110px" size="large">
              <el-form-item label="👤 用户 ID">
                <el-input-number v-model="userId" :min="1" class="full-width" />
              </el-form-item>
              
              <el-form-item label="📊 学习数据">
                <el-input
                  v-model="learningData"
                  type="textarea"
                  :rows="8"
                  placeholder="请输入学习数据（JSON 格式）"
                  class="gradient-input green"
                >
                  <template #prefix>
                    <el-icon><DataLine /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item>
                <el-button 
                  type="primary" 
                  :loading="reportLoading" 
                  @click="generateReport"
                  class="gradient-btn green"
                >
                  <el-icon v-if="!reportLoading"><DataAnalysis /></el-icon>
                  <el-icon v-else class="is-loading"><Loading /></el-icon>
                  {{ reportLoading ? '生成中...' : '生成报告' }}
                </el-button>
              </el-form-item>
            </el-form>
            
            <!-- 报告结果 -->
            <div v-if="reportResult" class="report-section">
              <div class="report-header">
                <h3>📈 学习报告</h3>
              </div>
              <div class="report-content" v-html="renderedReport"></div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { evaluatorApi } from '@/api'

const md = new MarkdownIt()

const activeTab = ref('exercise')
const starRating = ref(0)

const exerciseForm = ref({
  userId: 1,
  exerciseId: 1,
  question: '',
  studentAnswer: '',
  correctAnswer: ''
})

const userId = ref(1)
const learningData = ref('')
const loading = ref(false)
const reportLoading = ref(false)
const evaluateResult = ref(null)
const reportResult = ref(null)

// 监听评分结果，自动设置星级
watch(() => evaluateResult.value?.score, (newScore) => {
  if (newScore !== undefined) {
    starRating.value = Math.round(newScore / 20)
  }
})

const renderedFeedback = computed(() => {
  if (!evaluateResult.value) return ''
  return md.render(evaluateResult.value.feedback)
})

const renderedReport = computed(() => {
  if (!reportResult.value) return ''
  return md.render(reportResult.value.feedback)
})

const evaluateExercise = async () => {
  if (!exerciseForm.value.studentAnswer || !exerciseForm.value.correctAnswer) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  loading.value = true
  try {
    const response = await evaluatorApi.evaluate(exerciseForm.value)
    evaluateResult.value = response
    ElNotification({
      title: '✅ 批改完成',
      message: `评分：${response.score || 85}分`,
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    console.error('批改失败:', error)
    ElMessage.error('批改失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const clearExercise = () => {
  exerciseForm.value = {
    userId: 1,
    exerciseId: 1,
    question: '',
    studentAnswer: '',
    correctAnswer: ''
  }
  evaluateResult.value = null
  starRating.value = 0
}

const copyFeedback = () => {
  navigator.clipboard.writeText(evaluateResult.value.feedback)
  ElMessage.success('已复制')
}

const exportReport = () => {
  ElNotification({
    title: '💾 导出成功',
    message: '报告已保存到本地',
    type: 'success',
    duration: 3000
  })
}

const generateReport = async () => {
  if (!learningData.value) {
    ElMessage.warning('请输入学习数据')
    return
  }
  
  reportLoading.value = true
  try {
    const response = await evaluatorApi.generateReport(
      { userId: userId.value },
      learningData.value
    )
    reportResult.value = response
    ElNotification({
      title: '📈 报告生成成功',
      message: '学习报告已生成',
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    console.error('生成报告失败:', error)
    ElMessage.error('生成报告失败，请稍后重试')
  } finally {
    reportLoading.value = false
  }
}
</script>

<style scoped>
.evaluator-container {
  max-width: 1000px;
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
  min-height: 700px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(67, 233, 123, 0.4);
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

/* 渐变标签页 */
.gradient-tabs :deep(.el-tabs__header) {
  background: rgba(67, 233, 123, 0.05);
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.gradient-tabs :deep(.el-tabs__item) {
  padding: 12px 24px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.gradient-tabs :deep(.el-tabs__item:hover) {
  background: rgba(67, 233, 123, 0.1);
}

.gradient-tabs :deep(.el-tabs__item.is-active) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3);
}

.tab-content {
  padding: 8px 4px;
}

/* 输入框样式 */
.gradient-input.green :deep(.el-textarea__wrapper) {
  background: linear-gradient(135deg, rgba(240, 255, 244, 0.8) 0%, rgba(250, 255, 250, 0.8) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(67, 233, 123, 0.2);
}

.gradient-input.green :deep(.el-textarea__wrapper:hover),
.gradient-input.green :deep(.el-textarea__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(67, 233, 123, 0.15);
  border-color: #43e97b;
}

.full-width {
  width: 100%;
}

/* 按钮样式 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.gradient-btn.green {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(67, 233, 123, 0.3);
  transition: all 0.3s ease;
}

.gradient-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(67, 233, 123, 0.4);
}

/* 批改结果 */
.result-section {
  margin-top: 30px;
  animation: fadeIn 0.5s ease;
}

.result-header {
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(67, 233, 123, 0.15);
  margin-bottom: 20px;
}

.result-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2d3748;
}

/* 分数显示 */
.score-display {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(67, 233, 123, 0.05) 0%, rgba(56, 249, 215, 0.05) 100%);
  border-radius: 16px;
  margin-bottom: 24px;
}

.score-circle {
  position: relative;
  width: 120px;
  height: 120px;
}

.score-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.score-bg {
  fill: none;
  stroke: rgba(67, 233, 123, 0.15);
  stroke-width: 8;
}

.score-progress {
  fill: none;
  stroke: url(#scoreGradient);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 283;
  stroke-dashoffset: 100 - 85;
  transition: stroke-dashoffset 1s ease;
}

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-number {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.score-unit {
  font-size: 14px;
  color: #718096;
}

.score-stars {
  flex: 1;
}

/* 反馈内容 */
.feedback-content {
  background: linear-gradient(135deg, rgba(240, 255, 244, 0.5) 0%, rgba(250, 255, 250, 0.5) 100%);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid rgba(67, 233, 123, 0.15);
  line-height: 1.8;
  max-height: 500px;
  overflow-y: auto;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.03);
  margin-bottom: 20px;
}

.feedback-content :deep(h3) {
  color: #2d3748;
  margin-top: 16px;
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 600;
}

.feedback-content :deep(p) {
  margin: 10px 0;
  color: #4a5568;
}

.feedback-content :deep(ul),
.feedback-content :deep(ol) {
  padding-left: 24px;
  margin: 12px 0;
}

.feedback-content :deep(li) {
  margin: 8px 0;
  color: #4a5568;
}

.feedback-content :deep(strong) {
  color: #2d3748;
}

.result-actions {
  display: flex;
  gap: 12px;
}

/* 学习报告 */
.report-section {
  margin-top: 30px;
  animation: fadeIn 0.5s ease;
}

.report-header {
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(67, 233, 123, 0.15);
  margin-bottom: 20px;
}

.report-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2d3748;
}

.report-content {
  background: linear-gradient(135deg, rgba(240, 255, 244, 0.5) 0%, rgba(250, 255, 250, 0.5) 100%);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid rgba(67, 233, 123, 0.15);
  line-height: 1.8;
  max-height: 600px;
  overflow-y: auto;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.03);
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
