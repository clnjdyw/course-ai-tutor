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
          <el-radio-group v-model="filter" size="large">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="unmastered">未掌握</el-radio-button>
          </el-radio-group>
        </div>
      </template>

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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { wrongQuestionsApi } from '@/api'

const questions = ref([])
const filter = ref('all')

onMounted(async () => {
  await loadQuestions()
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
</style>
