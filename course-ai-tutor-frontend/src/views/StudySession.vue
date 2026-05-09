<template>
  <div class="study-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <span class="icon-emoji">📖</span>
            </div>
            <div>
              <h2>📖 学习协调器</h2>
              <p>AI 驱动的智能学习会话，支持学习、练习、复习三种模式</p>
            </div>
          </div>
          <div class="header-right">
            <el-tag v-if="phase === 'active'" type="primary" effect="dark" size="large">
              {{ modeEmoji(currentMode) }} {{ modeLabel(currentMode) }}
            </el-tag>
            <el-tag v-if="phase === 'active'" type="info" effect="plain" size="default">
              🕐 {{ sessionDuration }}
            </el-tag>
          </div>
        </div>
      </template>

      <!-- ==================== 开始屏幕 ==================== -->
      <div v-if="phase === 'start'" class="start-screen">
        <div class="start-hero">
          <div class="hero-emoji">🚀</div>
          <h3>开始新的学习旅程</h3>
          <p>选择你想要学习的主题和模式，AI 将为你定制专属学习方案</p>
        </div>

        <el-form :model="startForm" label-width="100px" size="large" class="start-form">
          <el-form-item label="📚 学习主题">
            <el-input
              v-model="startForm.topic"
              type="textarea"
              :rows="3"
              placeholder="请输入你想学习的知识点，例如：Vue 3 Composition API、数据结构与算法、Spring Boot 核心概念"
              class="gradient-input"
            />
          </el-form-item>

          <el-form-item label="🎯 学习模式">
            <el-radio-group v-model="startForm.mode" class="mode-radio-group">
              <el-radio-button value="learn">
                <div class="mode-option">
                  <span class="mode-icon">📚</span>
                  <span class="mode-name">学习模式</span>
                  <span class="mode-desc">系统讲解知识点</span>
                </div>
              </el-radio-button>
              <el-radio-button value="practice">
                <div class="mode-option">
                  <span class="mode-icon">✏️</span>
                  <span class="mode-name">练习模式</span>
                  <span class="mode-desc">做题巩固知识</span>
                </div>
              </el-radio-button>
              <el-radio-button value="review">
                <div class="mode-option">
                  <span class="mode-icon">🔄</span>
                  <span class="mode-name">复习模式</span>
                  <span class="mode-desc">回顾已学内容</span>
                </div>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="startLoading"
              :disabled="!startForm.topic.trim()"
              @click="handleStartSession"
              class="gradient-btn start-btn"
            >
              <span>{{ startLoading ? '正在准备...' : '开始学习' }}</span>
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 最近会话 -->
        <div v-if="recentSession" class="recent-session">
          <el-divider>
            <span class="divider-text">💡 提示</span>
          </el-divider>
          <el-alert
            title="检测到未结束的学习会话"
            :description="'主题：' + (recentSession.topic || '未知') + ' | 模式：' + modeLabel(recentSession.mode)"
            type="info"
            show-icon
            :closable="false"
          >
            <template #default>
              <div class="recent-actions">
                <span>检测到未结束的学习会话，主题：<strong>{{ recentSession.topic || '未知' }}</strong></span>
                <el-button size="small" type="primary" @click="resumeSession">恢复会话</el-button>
              </div>
            </template>
          </el-alert>
        </div>
      </div>

      <!-- ==================== 活跃会话屏幕 ==================== -->
      <div v-if="phase === 'active'" class="active-screen">
        <!-- 顶部信息栏 -->
        <div class="session-toolbar">
          <div class="toolbar-left">
            <el-tag effect="dark" :type="modeTagType">{{ modeEmoji(currentMode) }} {{ modeLabel(currentMode) }}</el-tag>
            <el-tag effect="plain">📚 {{ currentTopic }}</el-tag>
            <el-tag v-if="progressPercent > 0" effect="plain" type="success">
              进度 {{ progressPercent }}%
            </el-tag>
          </div>
          <div class="toolbar-right">
            <el-radio-group v-model="currentMode" size="small" @change="handleSwitchMode" :disabled="switchingMode">
              <el-radio-button value="learn">📚 学习</el-radio-button>
              <el-radio-button value="practice">✏️ 练习</el-radio-button>
              <el-radio-button value="review">🔄 复习</el-radio-button>
            </el-radio-group>
            <el-button type="danger" size="small" plain @click="handleEndSession" :loading="endLoading">
              结束学习
            </el-button>
          </div>
        </div>

        <!-- 进度条 -->
        <el-progress
          v-if="progressPercent > 0"
          :percentage="progressPercent"
          :stroke-width="8"
          :color="progressColors"
          class="session-progress"
        />

        <!-- 消息列表 -->
        <div class="message-list" ref="messageListRef">
          <el-empty
            v-if="messages.length === 0"
            description="正在加载学习内容..."
            :image-size="120"
          >
            <template #image>
              <div class="empty-illustration">
                <span class="empty-emoji">📖</span>
              </div>
            </template>
          </el-empty>

          <transition-group name="message-fade">
            <div
              v-for="(msg, index) in messages"
              :key="msg.id || index"
              :class="['message', msg.role]"
            >
              <!-- AI 消息 -->
              <template v-if="msg.role === 'ai'">
                <div class="message-avatar">
                  <div class="avatar-icon ai">🤖</div>
                </div>
                <div class="message-content">
                  <div class="message-bubble ai">
                    <!-- 练习卡片 -->
                    <div v-if="msg.exercise" class="exercise-card">
                      <div class="exercise-header">
                        <el-tag type="warning" effect="dark" size="small">练习题</el-tag>
                        <span v-if="msg.exercise.difficulty" class="exercise-difficulty">
                          难度：{{ msg.exercise.difficulty }}
                        </span>
                      </div>
                      <div class="exercise-question" v-html="renderMarkdown(msg.exercise.question || msg.content)"></div>
                      <div v-if="msg.exercise.options" class="exercise-options">
                        <div
                          v-for="(opt, oi) in msg.exercise.options"
                          :key="oi"
                          class="exercise-option"
                        >
                          {{ opt }}
                        </div>
                      </div>
                      <div v-if="!msg.exerciseAnswered" class="exercise-input">
                        <el-input
                          v-model="exerciseAnswers[msg.exercise.id || index]"
                          type="textarea"
                          :rows="2"
                          placeholder="请输入你的答案..."
                          class="gradient-input"
                        />
                        <el-button
                          type="primary"
                          size="small"
                          :loading="exerciseSubmitting[msg.exercise.id || index]"
                          @click="submitExerciseAnswer(msg, index)"
                          class="submit-exercise-btn"
                        >
                          提交答案
                        </el-button>
                      </div>
                      <div v-else class="exercise-result">
                        <el-tag :type="msg.exerciseCorrect ? 'success' : 'danger'" effect="dark" size="default">
                          {{ msg.exerciseCorrect ? '✅ 回答正确' : '❌ 回答错误' }}
                        </el-tag>
                        <div v-if="msg.exerciseExplanation" class="exercise-explanation" v-html="renderMarkdown(msg.exerciseExplanation)"></div>
                      </div>
                    </div>
                    <!-- 普通消息 -->
                    <div v-else class="message-text" v-html="renderMarkdown(msg.content)"></div>
                  </div>
                  <div class="message-time">{{ msg.time }}</div>
                </div>
              </template>

              <!-- 用户消息 -->
              <template v-if="msg.role === 'user'">
                <div class="message-content user">
                  <div class="message-bubble user">
                    <div class="message-text">{{ msg.content }}</div>
                  </div>
                  <div class="message-time">{{ msg.time }}</div>
                </div>
                <div class="message-avatar">
                  <div class="avatar-icon user">👤</div>
                </div>
              </template>
            </div>
          </transition-group>

          <!-- 加载指示器 -->
          <div v-if="sendingMessage" class="message ai">
            <div class="message-avatar">
              <div class="avatar-icon ai">🤖</div>
            </div>
            <div class="message-content">
              <div class="message-bubble ai loading">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="loading-text">AI 正在思考...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-section">
          <div class="input-wrapper">
            <el-input
              v-model="userInput"
              type="textarea"
              :rows="2"
              placeholder="输入你的问题或回答，按 Enter 发送..."
              class="gradient-input"
              :disabled="sendingMessage"
              @keydown.enter.exact.prevent="handleSendMessage"
            />
            <div class="input-toolbar">
              <div class="toolbar-hint">
                <span>💡 按 Enter 发送，Shift + Enter 换行</span>
              </div>
              <el-button
                type="primary"
                :loading="sendingMessage"
                :disabled="!userInput.trim()"
                @click="handleSendMessage"
                class="send-btn"
              >
                {{ sendingMessage ? '发送中...' : '发送' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 会话总结屏幕 ==================== -->
      <div v-if="phase === 'summary'" class="summary-screen">
        <div class="summary-hero">
          <div class="hero-emoji">🎉</div>
          <h3>学习会话结束</h3>
          <p>本次学习已完成，以下是你的学习总结</p>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">📚</div>
            <div class="stat-info">
              <span class="stat-value">{{ summaryData.topic || currentTopic || '--' }}</span>
              <span class="stat-label">学习主题</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">🕐</div>
            <div class="stat-info">
              <span class="stat-value">{{ summaryData.duration || sessionDuration }}</span>
              <span class="stat-label">学习时长</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">💬</div>
            <div class="stat-info">
              <span class="stat-value">{{ summaryData.messageCount || messages.length }}</span>
              <span class="stat-label">消息数量</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">✏️</div>
            <div class="stat-info">
              <span class="stat-value">{{ summaryData.exerciseCount || exerciseCount }}</span>
              <span class="stat-label">完成练习</span>
            </div>
          </div>
        </div>

        <!-- 正确率 -->
        <div v-if="exerciseCount > 0" class="accuracy-section">
          <h4>练习正确率</h4>
          <el-progress
            :percentage="accuracyPercent"
            :stroke-width="20"
            :text-inside="true"
            :color="accuracyPercent >= 80 ? '#43e97b' : accuracyPercent >= 60 ? '#e6a23c' : '#f56c6c'"
            class="accuracy-progress"
          />
          <p class="accuracy-detail">
            共 {{ exerciseCount }} 道练习题，答对 {{ correctCount }} 道
          </p>
        </div>

        <!-- 会话内容总结 -->
        <div v-if="summaryData.summary" class="summary-content">
          <h4>学习总结</h4>
          <div class="summary-text" v-html="renderMarkdown(summaryData.summary)"></div>
        </div>

        <!-- 操作按钮 -->
        <div class="summary-actions">
          <el-button type="primary" size="large" @click="resetSession" class="gradient-btn">
            🔄 开始新学习
          </el-button>
          <el-button size="large" @click="$router.push('/history')">
            📋 查看历史
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { studyApi } from '@/api'

const md = new MarkdownIt()

// ==================== 状态 ====================
const phase = ref('start') // 'start' | 'active' | 'summary'

// 开始表单
const startForm = reactive({
  topic: '',
  mode: 'learn'
})
const startLoading = ref(false)

// 会话状态
const currentMode = ref('learn')
const currentTopic = ref('')
const messages = ref([])
const userInput = ref('')
const sendingMessage = ref(false)
const switchingMode = ref(false)
const endLoading = ref(false)
const messageListRef = ref(null)
const progressPercent = ref(0)

// 练习相关
const exerciseAnswers = reactive({})
const exerciseSubmitting = reactive({})
const exerciseCount = ref(0)
const correctCount = ref(0)

// 会话时间
const sessionStartTime = ref(null)
const sessionDuration = ref('00:00')
let durationTimer = null

// 最近会话
const recentSession = ref(null)

// 总结数据
const summaryData = reactive({
  topic: '',
  duration: '',
  messageCount: 0,
  exerciseCount: 0,
  accuracy: 0,
  summary: ''
})

let messageIdCounter = 0

// ==================== 计算属性 ====================
const modeTagType = computed(() => {
  const map = { learn: 'primary', practice: 'warning', review: 'success' }
  return map[currentMode.value] || 'info'
})

const progressColors = [
  { color: '#667eea', percentage: 30 },
  { color: '#f093fb', percentage: 60 },
  { color: '#43e97b', percentage: 100 }
]

const accuracyPercent = computed(() => {
  if (exerciseCount.value === 0) return 0
  return Math.round((correctCount.value / exerciseCount.value) * 100)
})

// ==================== 工具函数 ====================
const modeLabel = (mode) => {
  const map = { learn: '学习模式', practice: '练习模式', review: '复习模式' }
  return map[mode] || '未知模式'
}

const modeEmoji = (mode) => {
  const map = { learn: '📚', practice: '✏️', review: '🔄' }
  return map[mode] || '📖'
}

const getCurrentTime = () => {
  const now = new Date()
  return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const renderMarkdown = (content) => {
  if (!content) return ''
  return md.render(content)
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

const addMessage = (role, content, extra = {}) => {
  messages.value.push({
    id: ++messageIdCounter,
    role,
    content,
    time: getCurrentTime(),
    ...extra
  })
  scrollToBottom()
}

const updateDuration = () => {
  if (!sessionStartTime.value) return
  const elapsed = Math.floor((Date.now() - sessionStartTime.value) / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  sessionDuration.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// ==================== 操作方法 ====================

// 开始会话
const handleStartSession = async () => {
  if (!startForm.topic.trim()) {
    ElMessage.warning('请输入学习主题')
    return
  }

  startLoading.value = true
  try {
    const res = await studyApi.start({
      topic: startForm.topic.trim(),
      mode: startForm.mode
    })

    if (res?.success) {
      const data = res.data || {}
      currentTopic.value = startForm.topic.trim()
      currentMode.value = startForm.mode
      phase.value = 'active'
      sessionStartTime.value = Date.now()
      messages.value = []
      exerciseCount.value = 0
      correctCount.value = 0
      progressPercent.value = 0

      // 开始计时
      durationTimer = setInterval(updateDuration, 1000)

      // 显示欢迎消息
      const welcomeContent = data.welcomeMessage || data.message || data.content ||
        `你好！我是你的学习助手。让我们开始学习 **${currentTopic.value}** 吧！\n\n当前模式：${modeLabel(currentMode.value)}\n\n请随时输入你的问题或想法，我会为你提供详细的解答。`
      addMessage('ai', welcomeContent)

      // 如果后端返回了初始内容
      if (data.initialContent || data.exercise) {
        addMessage('ai', data.initialContent || '', {
          exercise: data.exercise || null
        })
      }

      ElMessage.success('学习会话已开始')
    } else {
      ElMessage.error(res?.message || '开始学习失败')
    }
  } catch (error) {
    console.error('开始学习失败:', error)
    ElMessage.error('开始学习失败，请稍后重试')
    // 降级：本地模式
    currentTopic.value = startForm.topic.trim()
    currentMode.value = startForm.mode
    phase.value = 'active'
    sessionStartTime.value = Date.now()
    messages.value = []
    durationTimer = setInterval(updateDuration, 1000)
    addMessage('ai', `你好！让我们开始学习 **${currentTopic.value}**（本地模式）。\n\n请随时输入你的问题。`)
  } finally {
    startLoading.value = false
  }
}

// 恢复会话
const resumeSession = async () => {
  if (!recentSession.value) return
  startLoading.value = true
  try {
    const res = await studyApi.getSession()
    if (res?.success && res.data) {
      const data = res.data
      currentTopic.value = data.topic || recentSession.value.topic
      currentMode.value = data.mode || recentSession.value.mode
      phase.value = 'active'
      sessionStartTime.value = Date.now()
      messages.value = []
      exerciseCount.value = 0
      correctCount.value = 0
      progressPercent.value = data.progress || 0
      durationTimer = setInterval(updateDuration, 1000)

      // 恢复历史消息
      if (data.messages && Array.isArray(data.messages)) {
        data.messages.forEach(msg => {
          addMessage(msg.role || 'ai', msg.content || '', {
            exercise: msg.exercise || null,
            exerciseAnswered: msg.exerciseAnswered || false,
            exerciseCorrect: msg.exerciseCorrect || false,
            exerciseExplanation: msg.exerciseExplanation || ''
          })
        })
      }

      addMessage('ai', '已恢复上次学习会话，我们可以继续了！')
      recentSession.value = null
      ElMessage.success('会话已恢复')
    }
  } catch (error) {
    console.error('恢复会话失败:', error)
    ElMessage.error('恢复会话失败')
  } finally {
    startLoading.value = false
  }
}

// 发送消息
const handleSendMessage = async () => {
  const input = userInput.value.trim()
  if (!input || sendingMessage.value) return

  addMessage('user', input)
  userInput.value = ''
  sendingMessage.value = true

  try {
    const res = await studyApi.submitInput({ input })

    if (res?.success && res.data) {
      const data = res.data
      const content = data.message || data.content || data.reply || ''

      if (content) {
        addMessage('ai', content)
      }

      // 如果返回了练习题
      if (data.exercise) {
        addMessage('ai', data.exercise.question || data.exercise.content || '', {
          exercise: data.exercise
        })
        exerciseCount.value++
      }

      // 更新进度
      if (data.progress !== undefined) {
        progressPercent.value = data.progress
      }
    } else {
      addMessage('ai', res?.message || '抱歉，处理失败，请稍后重试。')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    addMessage('ai', '抱歉，网络异常，请稍后重试。')
  } finally {
    sendingMessage.value = false
    scrollToBottom()
  }
}

// 提交练习答案
const submitExerciseAnswer = async (msg, msgIndex) => {
  const exerciseId = msg.exercise?.id || msgIndex
  const answer = exerciseAnswers[exerciseId]
  if (!answer || !answer.trim()) {
    ElMessage.warning('请输入答案')
    return
  }

  exerciseSubmitting[exerciseId] = true

  try {
    const res = await studyApi.evalCorrect({
      exerciseId: msg.exercise?.id || msgIndex,
      userAnswer: answer.trim()
    })

    if (res?.success && res.data) {
      const data = res.data
      const isCorrect = data.isCorrect ?? data.correct ?? false

      // 更新消息状态
      msg.exerciseAnswered = true
      msg.exerciseCorrect = isCorrect
      msg.exerciseExplanation = data.explanation || data.feedback || data.message || ''

      if (isCorrect) {
        correctCount.value++
      }

      // 同时提交反馈
      try {
        await studyApi.submitExerciseFeedback({
          exerciseId: msg.exercise?.id || msgIndex,
          isCorrect,
          answer: answer.trim()
        })
      } catch (e) {
        console.warn('提交练习反馈失败:', e)
      }
    } else {
      // 降级：本地判断
      msg.exerciseAnswered = true
      msg.exerciseCorrect = false
      msg.exerciseExplanation = res?.message || '已提交答案，请等待评判。'
    }
  } catch (error) {
    console.error('提交答案失败:', error)
    // 降级处理
    msg.exerciseAnswered = true
    msg.exerciseCorrect = false
    msg.exerciseExplanation = '答案已提交（网络异常，无法评判）'
  } finally {
    exerciseSubmitting[exerciseId] = false
    scrollToBottom()
  }
}

// 切换模式
const handleSwitchMode = async (mode) => {
  if (switchingMode.value) return
  switchingMode.value = true

  try {
    const res = await studyApi.switchMode({ mode })

    if (res?.success) {
      currentMode.value = mode
      const data = res.data || {}
      const switchMsg = data.message || data.content || `已切换到${modeLabel(mode)}，让我们继续学习吧！`
      addMessage('ai', switchMsg)
      ElMessage.success(`已切换到${modeLabel(mode)}`)
    } else {
      // 降级：本地切换
      currentMode.value = mode
      addMessage('ai', `已切换到${modeLabel(mode)}（本地模式）`)
    }
  } catch (error) {
    console.error('切换模式失败:', error)
    currentMode.value = mode
    addMessage('ai', `已切换到${modeLabel(mode)}（本地模式）`)
  } finally {
    switchingMode.value = false
    scrollToBottom()
  }
}

// 结束会话
const handleEndSession = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要结束本次学习会话吗？结束后将显示学习总结。',
      '结束学习',
      { confirmButtonText: '确定结束', cancelButtonText: '继续学习', type: 'warning' }
    )
  } catch {
    return // 用户取消
  }

  endLoading.value = true
  try {
    const res = await studyApi.endSession()

    if (res?.success && res.data) {
      const data = res.data
      summaryData.topic = data.topic || currentTopic.value
      summaryData.duration = sessionDuration.value
      summaryData.messageCount = data.messageCount || messages.value.length
      summaryData.exerciseCount = data.exerciseCount || exerciseCount.value
      summaryData.summary = data.summary || data.content || ''
    } else {
      // 降级：使用本地数据
      summaryData.topic = currentTopic.value
      summaryData.duration = sessionDuration.value
      summaryData.messageCount = messages.value.length
      summaryData.exerciseCount = exerciseCount.value
      summaryData.summary = ''
    }
  } catch (error) {
    console.error('结束会话失败:', error)
    summaryData.topic = currentTopic.value
    summaryData.duration = sessionDuration.value
    summaryData.messageCount = messages.value.length
    summaryData.exerciseCount = exerciseCount.value
    summaryData.summary = ''
  } finally {
    endLoading.value = false
    clearInterval(durationTimer)
    durationTimer = null
    phase.value = 'summary'
  }
}

// 重置会话
const resetSession = () => {
  phase.value = 'start'
  messages.value = []
  userInput.value = ''
  startForm.topic = ''
  startForm.mode = 'learn'
  currentMode.value = 'learn'
  currentTopic.value = ''
  progressPercent.value = 0
  exerciseCount.value = 0
  correctCount.value = 0
  sessionStartTime.value = null
  sessionDuration.value = '00:00'
  Object.keys(exerciseAnswers).forEach(k => delete exerciseAnswers[k])
  Object.keys(exerciseSubmitting).forEach(k => delete exerciseSubmitting[k])
}

// 检查是否有未结束的会话
const checkExistingSession = async () => {
  try {
    const res = await studyApi.getSession()
    if (res?.success && res.data && res.data.active) {
      recentSession.value = {
        topic: res.data.topic,
        mode: res.data.mode
      }
    }
  } catch {
    // 无活跃会话，忽略
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  checkExistingSession()
})

onBeforeUnmount(() => {
  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }
})
</script>

<style scoped>
.study-container {
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
  overflow: hidden;
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
  flex-wrap: wrap;
  gap: 12px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.icon-emoji {
  font-size: 24px;
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

/* ==================== 开始屏幕 ==================== */
.start-screen {
  padding: 20px 0;
}

.start-hero {
  text-align: center;
  padding: 40px 20px 30px;
}

.hero-emoji {
  font-size: 64px;
  margin-bottom: 16px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.start-hero h3 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #2d3748;
}

.start-hero p {
  margin: 0;
  color: #718096;
  font-size: 15px;
}

.start-form {
  max-width: 700px;
  margin: 0 auto;
}

/* 模式选择组 */
.mode-radio-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.mode-radio-group :deep(.el-radio-button) {
  flex: 1;
  min-width: 140px;
}

.mode-radio-group :deep(.el-radio-button__inner) {
  width: 100%;
  height: auto;
  padding: 16px 12px;
  border-radius: 12px !important;
  border: 2px solid #e4e7ed;
  background: white;
  box-shadow: none;
  transition: all 0.3s ease;
}

.mode-radio-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.mode-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.mode-icon {
  font-size: 28px;
}

.mode-name {
  font-size: 14px;
  font-weight: 600;
}

.mode-desc {
  font-size: 11px;
  color: #a0aec0;
}

/* 渐变输入框 */
.gradient-input :deep(.el-textarea__wrapper),
.gradient-input :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.04) 0%, rgba(118, 75, 162, 0.04) 100%);
  border: 2px solid rgba(102, 126, 234, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.gradient-input :deep(.el-textarea__wrapper:hover),
.gradient-input :deep(.el-textarea__wrapper.is-focus),
.gradient-input :deep(.el-input__wrapper:hover),
.gradient-input :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

/* 开始按钮 */
.gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.gradient-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.4);
}

.start-btn {
  width: 200px;
  height: 48px;
  font-size: 16px;
  border-radius: 12px;
}

/* 最近会话 */
.recent-session {
  max-width: 700px;
  margin: 20px auto 0;
}

.divider-text {
  font-size: 13px;
  color: #a0aec0;
}

.recent-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* ==================== 活跃会话屏幕 ==================== */
.active-screen {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 工具栏 */
.session-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  margin-bottom: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.session-progress {
  margin-bottom: 12px;
}

/* 消息列表 */
.message-list {
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
  padding: 16px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%);
  border-radius: 12px;
  margin-bottom: 16px;
}

.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

/* 空状态 */
.empty-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.empty-emoji {
  font-size: 48px;
}

/* 消息样式 */
.message {
  display: flex;
  margin-bottom: 20px;
  animation: messageSlide 0.3s ease;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

@keyframes messageSlide {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}

.message-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.message-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 头像 */
.message-avatar {
  flex-shrink: 0;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.avatar-icon.ai {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar-icon.user {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

/* 消息内容 */
.message-content {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.message-content.user {
  align-items: flex-end;
}

.message-bubble {
  padding: 14px 18px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  line-height: 1.6;
}

.message-bubble.ai {
  background: white;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(102, 126, 234, 0.15);
}

.message-bubble.user {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-bubble.user :deep(*) {
  color: white;
}

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3) {
  margin-top: 12px;
  margin-bottom: 8px;
  font-size: 16px;
  color: #2d3748;
}

.message-text :deep(p) {
  margin: 8px 0;
  color: #4a5568;
}

.message-text :deep(code) {
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  color: #667eea;
}

.message-text :deep(pre) {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.message-text :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.message-text :deep(li) {
  margin: 4px 0;
}

.message-time {
  font-size: 12px;
  color: #a0aec0;
  margin-top: 6px;
}

/* 练习卡片 */
.exercise-card {
  padding: 4px 0;
}

.exercise-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.exercise-difficulty {
  font-size: 12px;
  color: #718096;
}

.exercise-question {
  margin-bottom: 12px;
  line-height: 1.7;
}

.exercise-question :deep(p) {
  margin: 6px 0;
  color: #4a5568;
}

.exercise-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.exercise-option {
  padding: 10px 16px;
  background: rgba(102, 126, 234, 0.05);
  border: 1px solid rgba(102, 126, 234, 0.15);
  border-radius: 8px;
  font-size: 14px;
  color: #4a5568;
  transition: all 0.2s ease;
  cursor: pointer;
}

.exercise-option:hover {
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
}

.exercise-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.submit-exercise-btn {
  align-self: flex-end;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.exercise-result {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exercise-explanation {
  padding: 12px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
  border-left: 3px solid #667eea;
  margin-top: 8px;
  line-height: 1.6;
}

.exercise-explanation :deep(p) {
  margin: 6px 0;
  color: #4a5568;
  font-size: 13px;
}

/* 加载指示器 */
.message-bubble.loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.typing-indicator {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
.typing-indicator span:nth-child(3) { animation-delay: 0s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.loading-text {
  color: #718096;
  font-size: 14px;
}

/* 输入区域 */
.input-section {
  padding: 0 4px;
}

.input-wrapper {
  background: white;
  border-radius: 16px;
  border: 2px solid rgba(102, 126, 234, 0.15);
  overflow: hidden;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: rgba(102, 126, 234, 0.03);
  border-top: 1px solid rgba(102, 126, 234, 0.08);
}

.toolbar-hint {
  font-size: 12px;
  color: #a0aec0;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* ==================== 总结屏幕 ==================== */
.summary-screen {
  padding: 20px 0;
}

.summary-hero {
  text-align: center;
  padding: 30px 20px 20px;
}

.summary-hero h3 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #2d3748;
}

.summary-hero p {
  margin: 0;
  color: #718096;
  font-size: 15px;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: white;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-label {
  font-size: 13px;
  color: #a0aec0;
}

/* 正确率 */
.accuracy-section {
  margin: 24px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.accuracy-section h4 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #2d3748;
}

.accuracy-progress {
  margin-bottom: 12px;
}

.accuracy-detail {
  margin: 0;
  font-size: 13px;
  color: #718096;
  text-align: center;
}

/* 总结内容 */
.summary-content {
  margin: 24px 0;
  padding: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.04) 0%, rgba(118, 75, 162, 0.04) 100%);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.summary-content h4 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #2d3748;
}

.summary-text {
  line-height: 1.8;
  color: #4a5568;
}

.summary-text :deep(h1),
.summary-text :deep(h2),
.summary-text :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #2d3748;
}

.summary-text :deep(p) {
  margin: 8px 0;
}

.summary-text :deep(ul),
.summary-text :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

/* 操作按钮 */
.summary-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
}

/* ==================== 动画 ==================== */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .session-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .mode-radio-group {
    flex-direction: column;
  }

  .message-content {
    max-width: 85%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .summary-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .recent-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
