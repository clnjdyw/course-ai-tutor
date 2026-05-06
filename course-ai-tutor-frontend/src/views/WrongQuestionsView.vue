<template>
  <div class="wrong-questions-view">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <span class="icon-emoji">❌</span>
            </div>
            <div>
              <h2>❌ 错题本</h2>
              <p>温故而知新，消灭每一道错题</p>
            </div>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="batchAnalyze" :loading="analyzing" class="gradient-btn" size="large">
              <el-icon><MagicStick /></el-icon>
              AI 批量分析
            </el-button>
            <el-radio-group v-model="filter" size="large">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="unmastered">未掌握</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <!-- 统计卡片区域 -->
      <div v-if="statistics" class="stats-section">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">📊</div>
          <div class="stat-info">
            <span class="stat-value">{{ statistics.totalCount }}</span>
            <span class="stat-label">错题总数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">📚</div>
          <div class="stat-info">
            <span class="stat-value">{{ Object.keys(statistics.bySubject || {}).length }}</span>
            <span class="stat-label">涉及科目</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">✅</div>
          <div class="stat-info">
            <span class="stat-value">{{ statistics.masteredCount || 0 }}</span>
            <span class="stat-label">已掌握</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">📈</div>
          <div class="stat-info">
            <span class="stat-value">{{ statistics.masteryRate || '0%' }}</span>
            <span class="stat-label">掌握率</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)">🤖</div>
          <div class="stat-info">
            <span class="stat-value">{{ statistics.analyzedCount || 0 }}</span>
            <span class="stat-label">已AI分析</span>
          </div>
        </div>
      </div>

      <!-- 按科目分布 -->
      <div v-if="statistics && Object.keys(statistics.bySubject || {}).length > 0" class="subject-distribution">
        <h3 class="distribution-title">📚 科目分布</h3>
        <div class="subject-bars">
          <div v-for="(count, subject) in statistics.bySubject" :key="subject" class="subject-bar-item">
            <span class="subject-name">{{ subject }}</span>
            <div class="subject-bar-track">
              <div
                class="subject-bar-fill"
                :style="{ width: `${statistics.totalCount ? (count / statistics.totalCount * 100) : 0}%` }"
              ></div>
            </div>
            <span class="subject-count">{{ count }}</span>
          </div>
        </div>
      </div>

      <div class="questions-list">
        <div v-for="(question, index) in questions" :key="question.id" class="question-card" :style="{ animationDelay: `${index * 0.1}s` }">
          <div class="question-header">
            <h3>{{ question.question }}</h3>
            <el-tag :type="question.mastered ? 'success' : 'danger'" effect="dark" size="small">
              {{ question.mastered ? '已掌握' : '未掌握' }}
            </el-tag>
          </div>

          <div class="question-body">
            <div class="answer-row">
              <span class="label">你的答案:</span>
              <el-tag type="danger" effect="plain">{{ question.user_answer }}</el-tag>
            </div>
            <div class="answer-row">
              <span class="label">正确答案:</span>
              <el-tag type="success" effect="plain">{{ question.correct_answer }}</el-tag>
            </div>
            <div v-if="question.error_analysis" class="analysis">
              <strong>错误分析:</strong>
              <p>{{ question.error_analysis }}</p>
            </div>
          </div>

          <div class="question-footer">
            <span class="review-count">复习次数: {{ question.review_count }}</span>
            <div class="actions">
              <el-button
                :type="question.mastered ? 'info' : 'success'"
                @click="markAsMastered(question)"
                class="gradient-btn"
                size="small"
              >
                {{ question.mastered ? '取消掌握' : '标记为已掌握' }}
              </el-button>
              <el-button
                type="warning"
                @click="analyzeQuestion(question)"
                :loading="analyzingId === question.id"
                size="small"
                class="analyze-btn"
              >
                <el-icon><MagicStick /></el-icon>
                AI 分析
              </el-button>
              <el-button type="danger" @click="deleteQuestion(question.id)" size="small" class="reset-btn">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-empty
        v-if="questions.length === 0"
        description="太棒了！还没有错题，继续保持！"
        :image-size="200"
      >
        <template #image>
          <div class="empty-illustration">
            <span class="empty-emoji">🎉</span>
          </div>
        </template>
      </el-empty>
    </el-card>

    <!-- AI 分析结果对话框 -->
    <el-dialog
      v-model="analysisDialogVisible"
      :title="`AI 分析 - ${currentAnalyzingQuestion?.question || ''}`"
      width="700px"
      class="analysis-dialog"
    >
      <div v-if="currentAnalysisResult" class="analysis-content">
        <div class="analysis-section">
          <h4>错误原因分析</h4>
          <p>{{ currentAnalysisResult.error_reason || '暂无' }}</p>
        </div>
        <div class="analysis-section">
          <h4>知识点讲解</h4>
          <p>{{ currentAnalysisResult.knowledge_explanation || '暂无' }}</p>
        </div>
        <div class="analysis-section">
          <h4>解题思路</h4>
          <p>{{ currentAnalysisResult.solution_approach || '暂无' }}</p>
        </div>
        <div v-if="currentAnalysisResult.suggestion" class="analysis-section">
          <h4>学习建议</h4>
          <p>{{ currentAnalysisResult.suggestion }}</p>
        </div>
      </div>
      <div v-else class="analysis-loading-placeholder">
        <el-icon class="is-loading" :size="40"><Loading /></el-icon>
        <p>正在加载分析结果...</p>
      </div>
      <template #footer>
        <el-button @click="analysisDialogVisible = false" class="gradient-btn">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { wrongQuestionsApi, wrongQuestionsApiExt } from '@/api'
import { MagicStick, Loading } from '@element-plus/icons-vue'

const questions = ref([])
const filter = ref('all')
const analyzing = ref(false)
const statistics = ref(null)
const analyzingId = ref(null)
const analysisDialogVisible = ref(false)
const currentAnalyzingQuestion = ref(null)
const currentAnalysisResult = ref(null)

onMounted(async () => {
  await Promise.all([loadQuestions(), loadStatistics()])
})

watch(filter, async () => {
  await loadQuestions()
})

async function loadQuestions() {
  try {
    const params = filter.value === 'unmastered' ? { unmastered: true } : {}
    const response = await wrongQuestionsApi.getList(params)
    questions.value = response.data || []
  } catch (error) {
    console.error('加载错题失败:', error)
  }
}

async function markAsMastered(question) {
  try {
    await wrongQuestionsApi.update(question.id, {
      mastered: !question.mastered
    })
    await loadQuestions()
    ElMessage.success(question.mastered ? '已取消掌握' : '已标记为掌握')
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
  }
}

async function deleteQuestion(id) {
  try {
    await wrongQuestionsApi.delete(id)
    await loadQuestions()
    ElMessage.success('错题已删除')
  } catch (error) {
    console.error('删除错题失败:', error)
    ElMessage.error('删除失败')
  }
}

async function batchAnalyze() {
  const unmastered = questions.value.filter(q => !q.mastered)
  if (unmastered.length === 0) {
    ElMessage.info('没有未掌握的错题需要分析')
    return
  }

  analyzing.value = true
  try {
    const ids = unmastered.map(q => q.id)
    const res = await wrongQuestionsApiExt.batchAnalyze(ids)
    if (res?.success) {
      ElMessage.success(`AI 分析完成，共分析 ${unmastered.length} 道错题`)
      await Promise.all([loadQuestions(), loadStatistics()])
    } else {
      ElMessage.warning(res?.message || '分析完成，但无新内容')
    }
  } catch (err) {
    console.error('批量分析失败:', err)
    ElMessage.error('AI 分析失败，请稍后重试')
  } finally {
    analyzing.value = false
  }
}

async function loadStatistics() {
  try {
    const res = await wrongQuestionsApiExt.getStatistics()
    statistics.value = res?.data || res || {}
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

async function analyzeQuestion(question) {
  analyzingId.value = question.id
  try {
    const res = await wrongQuestionsApiExt.analyze(question.id)
    currentAnalyzingQuestion.value = question
    currentAnalysisResult.value = res?.data || res || {}
    analysisDialogVisible.value = true
    await loadQuestions()
    ElMessage.success('AI 分析完成')
  } catch (error) {
    console.error('单题分析失败:', error)
    ElMessage.error('AI 分析失败，请稍后重试')
  } finally {
    analyzingId.value = null
  }
}
</script>

<style scoped>
.wrong-questions-view {
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

.header-actions {
  display: flex;
  gap: 12px;
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

/* 按钮样式 */
.gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  border-radius: 12px;
  font-weight: 600;
}

.gradient-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
}

.reset-btn {
  background: rgba(102, 126, 234, 0.1);
  border: 2px solid rgba(102, 126, 234, 0.3);
  color: #667eea;
  border-radius: 12px;
}

.reset-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}

/* 错题列表 */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease both;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2d3748;
}

.question-body {
  margin-bottom: 15px;
}

.answer-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.label {
  font-weight: 500;
  min-width: 100px;
  color: #4a5568;
}

.analysis {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%);
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
  border: 2px solid rgba(102, 126, 234, 0.1);
}

.analysis p {
  margin: 8px 0 0 0;
  color: #4a5568;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
}

.review-count {
  color: #6b7280;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 10px;
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

/* 统计卡片区域 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease both;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #2d3748;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #a0aec0;
  margin-top: 2px;
}

/* 科目分布 */
.subject-distribution {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.distribution-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #2d3748;
}

.subject-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subject-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.subject-name {
  min-width: 80px;
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
}

.subject-bar-track {
  flex: 1;
  height: 10px;
  background: #edf2f7;
  border-radius: 5px;
  overflow: hidden;
}

.subject-bar-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 5px;
  transition: width 0.6s ease;
}

.subject-count {
  min-width: 30px;
  font-size: 14px;
  color: #718096;
  text-align: right;
}

/* AI 分析按钮 */
.analyze-btn {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 16px rgba(250, 112, 154, 0.4);
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.analyze-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(250, 112, 154, 0.5);
}

/* 分析对话框 */
.analysis-content {
  max-height: 60vh;
  overflow-y: auto;
}

.analysis-section {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%);
  border-radius: 10px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.analysis-section:last-child {
  margin-bottom: 0;
}

.analysis-section h4 {
  margin: 0 0 10px 0;
  font-size: 15px;
  color: #667eea;
  font-weight: 600;
}

.analysis-section p {
  margin: 0;
  font-size: 14px;
  color: #4a5568;
  line-height: 1.7;
}

.analysis-loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #a0aec0;
}
</style>
