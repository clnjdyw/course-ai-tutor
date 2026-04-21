<template>
  <div class="helper-container">
    <div class="glass-card">
      <!-- 卡片头部 -->
      <div class="card-header">
        <div class="header-left">
          <div class="title-icon">
            <el-icon :size="24"><ChatDotRound /></el-icon>
          </div>
          <div>
            <h2>💬 实时答疑</h2>
            <p>7×24 小时在线，随时解答你的疑问</p>
          </div>
        </div>
        <div class="header-right">
          <el-tag type="warning" effect="dark" size="large">
            <el-icon><Clock /></el-icon>
            7×24 在线
          </el-tag>
          <el-tag v-if="currentMood" :type="moodTagType" effect="dark" size="small" class="mood-tag">
            {{ currentMood.emoji }} {{ currentMood.description }}
          </el-tag>
        </div>
      </div>

      <el-divider style="margin: 0" />

      <!-- 快捷提问 -->
      <div class="quick-section">
        <div class="section-title">
          <el-icon><Bolt /></el-icon>
          <span>快捷提问</span>
        </div>
        <div class="quick-questions">
          <el-tag
            v-for="(q, index) in quickQuestions"
            :key="index"
            effect="plain"
            size="large"
            class="quick-tag"
            @click="askQuestion(q)"
          >
            {{ q }}
          </el-tag>
        </div>
      </div>

      <el-divider style="margin: 8px 0" />

      <!-- 问答区域 -->
      <div class="qa-container">
        <!-- 问题输入 -->
        <div class="question-input">
          <el-input
            v-model="question"
            type="textarea"
            :rows="4"
            placeholder="请输入你的问题，例如：IOC 和 DI 有什么区别？"
            class="gradient-input blue"
          />

          <div class="input-actions">
            <el-button
              type="primary"
              :loading="loading"
              @click="submitQuestion"
              class="gradient-btn blue"
            >
              <el-icon v-if="!loading"><QuestionFilled /></el-icon>
              <el-icon v-else class="is-loading"><Loading /></el-icon>
              {{ loading ? '思考中...' : '提交问题' }}
            </el-button>
            <el-button @click="clearQuestion">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </div>
        </div>

        <!-- 代码调试 -->
        <el-collapse v-model="activeNames" class="debug-collapse">
          <el-collapse-item name="debug">
            <template #title>
              <div class="collapse-title">
                <el-icon><Bug /></el-icon>
                <span>🔧 代码调试</span>
              </div>
            </template>
            <div class="debug-section">
              <el-input
                v-model="code"
                type="textarea"
                :rows="6"
                placeholder="粘贴你的代码..."
                class="gradient-input code-input"
              />
              <el-input
                v-model="errorMessage"
                placeholder="错误信息（可选）"
                class="gradient-input code-input"
                style="margin-top: 10px"
              />
              <el-button
                type="warning"
                :loading="debugLoading"
                @click="debugCode"
                class="gradient-btn orange"
                style="margin-top: 10px"
              >
                <el-icon v-if="!debugLoading"><Bug /></el-icon>
                <el-icon v-else class="is-loading"><Loading /></el-icon>
                {{ debugLoading ? '调试中...' : '开始调试' }}
              </el-button>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- 回答显示 -->
        <div v-if="answerResult" class="answer-section">
          <div class="answer-header">
            <h3>💡 AI 解答</h3>
            <div class="answer-actions">
              <el-button @click="copyAnswer" size="small">
                <el-icon><DocumentCopy /></el-icon>
                复制
              </el-button>
              <el-button type="success" @click="markHelpful" size="small">
                <el-icon><ThumbUp /></el-icon>
                有帮助
              </el-button>
              <el-button type="info" @click="askFollowup" size="small">
                <el-icon><ChatLineRound /></el-icon>
                追问
              </el-button>
            </div>
          </div>

          <div class="answer-content" v-html="renderedAnswer"></div>
        </div>

        <!-- 历史记录 -->
        <div v-if="history.length > 0" class="history-section">
          <el-divider content-position="left">
            <el-icon><History /></el-icon>
            答疑历史
          </el-divider>
          <el-timeline class="history-timeline">
            <el-timeline-item
              v-for="(item, index) in history"
              :key="index"
              :timestamp="item.time"
              placement="top"
              size="large"
            >
              <el-card class="history-card" shadow="hover">
                <div class="history-question">
                  <el-icon><QuestionFilled /></el-icon>
                  <strong>问：</strong>{{ item.question }}
                </div>
                <div class="history-answer">
                  <el-icon><ChatDotSquare /></el-icon>
                  <strong>答：</strong>{{ item.answer.substring(0, 150) }}...
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="!answerResult && history.length === 0"
          description="输入问题，AI 将为你详细解答"
          :image-size="180"
        >
          <template #image>
            <div class="empty-illustration">
              <el-icon :size="80" color="#4facfe"><ChatDotRound /></el-icon>
            </div>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { helperApi, extractContent, extractMood } from '@/api'

const md = new MarkdownIt()

const quickQuestions = ref([
  '什么是依赖注入？',
  'Spring Boot 自动配置原理',
  '如何理解 MVC 模式？',
  'RESTful API 设计规范',
  '数据库索引的优缺点'
])

const question = ref('')
const code = ref('')
const errorMessage = ref('')
const activeNames = ref([])
const loading = ref(false)
const debugLoading = ref(false)
const answerResult = ref(null)
const history = ref([])
const currentMood = ref(null)

const moodTagType = computed(() => {
  if (!currentMood.value) return 'info'
  const map = { EXCITED: 'danger', HAPPY: 'success', NEUTRAL: '', CONCERNED: 'warning', ENCOURAGING: 'warning' }
  return map[currentMood.value.type] || 'info'
})

const renderedAnswer = computed(() => {
  if (!answerResult.value) return ''
  const text = answerResult.value.answer || answerResult.value.message || answerResult.value.debugGuidance || ''
  const html = md.render(text)
  const cursor = answerResult.value.streaming ? '<span class="streaming-cursor">▊</span>' : ''
  return html + cursor
})

const askQuestion = (q) => {
  question.value = q
}

const clearQuestion = () => {
  question.value = ''
  answerResult.value = null
}

const submitQuestion = async () => {
  if (!question.value.trim()) {
    ElMessage.warning('请输入问题')
    return
  }

  loading.value = true
  answerResult.value = { answer: '', streaming: true }

  try {
    await helperApi.answerStream({
      userId: parseInt(localStorage.getItem('userId') || '1'),
      content: question.value
    }, (content, done) => {
      answerResult.value.answer = content
      answerResult.value.streaming = !done
    })

    history.value.unshift({
      question: question.value,
      answer: answerResult.value.answer,
      time: new Date().toLocaleString()
    })

    ElNotification({
      title: '✅ 解答完成',
      message: 'AI 已详细解答你的问题',
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    console.error('答疑失败:', error)
    ElMessage.error('解答失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const debugCode = async () => {
  if (!code.value.trim()) {
    ElMessage.warning('请输入代码')
    return
  }

  debugLoading.value = true
  try {
    const response = await helperApi.debugCode({
      userId: parseInt(localStorage.getItem('userId') || '1'),
      content: code.value,
      errorMessage: errorMessage.value
    })

    answerResult.value = response
    ElNotification({
      title: '🔧 调试完成',
      message: 'AI 已分析代码问题',
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    console.error('调试失败:', error)
    ElMessage.error('调试失败，请稍后重试')
  } finally {
    debugLoading.value = false
  }
}

const copyAnswer = () => {
  const text = answerResult.value.answer || answerResult.value.message || answerResult.value.debugGuidance || ''
  navigator.clipboard.writeText(text)
  ElMessage.success('已复制')
}

const markHelpful = () => {
  ElNotification({
    title: '👍 感谢反馈',
    message: '你的反馈将帮助我们改进',
    type: 'success',
    duration: 3000
  })
}

const askFollowup = () => {
  question.value = '我还有个问题：'
  answerResult.value = null
  ElMessage.info('请输入追问内容')
}
</script>

<style scoped>
.helper-container {
  width: 100%;
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
  padding: 16px 24px 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
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

/* 情绪标签 */
.mood-tag {
  margin-left: 8px;
  animation: moodPulse 2s ease-in-out infinite;
}

@keyframes moodPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 快捷提问 */
.quick-section {
  padding: 12px 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 20px;
}

.quick-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

/* 问答区域 */
.qa-container {
  padding: 16px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-input {
  margin-bottom: 0;
}

.gradient-input.blue :deep(.el-textarea__wrapper) {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(255, 250, 250, 0.8) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(79, 172, 254, 0.2);
}

.gradient-input.blue :deep(.el-textarea__wrapper:hover),
.gradient-input.blue :deep(.el-textarea__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.15);
  border-color: #4facfe;
}

.code-input :deep(.el-textarea__wrapper) {
  font-family: 'Courier New', Courier, monospace;
}

.input-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  align-items: center;
}

.gradient-btn.blue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.3);
  transition: all 0.3s ease;
}

.gradient-btn.orange {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(246, 211, 101, 0.3);
  transition: all 0.3s ease;
}

.gradient-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(79, 172, 254, 0.4);
}

/* 代码调试 */
.debug-collapse {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(79, 172, 254, 0.1);
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #2d3748;
}

.debug-section {
  padding: 16px;
  background: rgba(79, 172, 254, 0.03);
}

/* 回答区域 */
.answer-section {
  animation: fadeIn 0.5s ease;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(79, 172, 254, 0.1);
}

.answer-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2d3748;
}

.answer-actions {
  display: flex;
  gap: 8px;
}

.answer-content {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid rgba(79, 172, 254, 0.1);
  line-height: 1.8;
  max-height: 500px;
  overflow-y: auto;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.03);
}

.answer-content :deep(h1),
.answer-content :deep(h2),
.answer-content :deep(h3) {
  color: #2d3748;
  margin-top: 16px;
  margin-bottom: 12px;
  font-weight: 600;
}

.answer-content :deep(p) {
  margin: 10px 0;
  color: #4a5568;
}

.answer-content :deep(code) {
  background: rgba(79, 172, 254, 0.12);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  color: #0284c7;
}

.answer-content :deep(pre) {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 历史记录 */
.history-section {
  margin-top: 10px;
}

.history-timeline {
  padding: 10px 0;
}

.history-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(79, 172, 254, 0.15);
  transition: all 0.3s ease;
}

.history-card:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.15);
}

.history-question,
.history-answer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 8px 0;
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
}

.history-question strong,
.history-answer strong {
  color: #2d3748;
}

/* 空状态 */
.empty-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
