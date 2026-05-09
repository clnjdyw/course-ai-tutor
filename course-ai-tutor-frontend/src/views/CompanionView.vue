<template>
  <div class="companion-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon">
              <span class="icon-emoji">{{ selectedAgent?.icon || '🤖' }}</span>
            </div>
            <div>
              <div class="title-row">
                <h2>{{ selectedAgent?.icon || '🤖' }} {{ selectedAgent?.name || 'AI 学习伙伴' }}</h2>
                <!-- 状态指示器 -->
                <span v-if="agentStatus" :class="['status-dot', getAgentStatusClass()]" :title="getAgentStatusText()"></span>
                <span class="status-text" :class="getAgentStatusClass()">{{ getAgentStatusText() }}</span>
              </div>
              <p>{{ selectedAgent?.description || '你的专属学习陪伴，随时聊天，陪你一起成长' }}</p>
            </div>
          </div>
          <div class="header-right">
            <!-- 智能体选择器 -->
            <el-dropdown trigger="click" class="agent-dropdown" v-if="availableAgents.length > 0" @command="handleAgentCommand">
              <span class="agent-selector">
                <span class="selector-icon">{{ selectedAgent?.icon || '🤖' }}</span>
                <span class="selector-name">{{ selectedAgent?.name || '选择智能体' }}</span>
                <el-icon class="selector-arrow"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu class="agent-menu">
                  <el-dropdown-item
                    v-for="agent in availableAgents"
                    :key="agent.id"
                    :command="agent"
                    :class="{ 'is-selected': selectedAgent?.id === agent.id }"
                  >
                    <span class="agent-menu-icon">{{ agent.icon || '🤖' }}</span>
                    <div class="agent-menu-info">
                      <span class="agent-menu-name">{{ agent.name }}</span>
                      <span class="agent-menu-specialty">{{ agent.specialty || agent.description || '' }}</span>
                    </div>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <!-- 智能体信息弹窗 -->
            <el-popover
              placement="bottom-end"
              :width="320"
              trigger="click"
              class="agent-info-popover"
            >
              <template #reference>
                <el-button size="small" text class="info-btn" title="查看智能体信息">
                  <el-icon><InfoFilled /></el-icon>
                </el-button>
              </template>
              <div class="agent-info-card">
                <div class="info-header">
                  <span class="info-icon">{{ selectedAgent?.icon || '🤖' }}</span>
                  <div class="info-title">
                    <h4>{{ selectedAgent?.name || 'AI 学习伙伴' }}</h4>
                    <span :class="['status-dot', getAgentStatusClass()]"></span>
                    <span class="info-status">{{ getAgentStatusText() }}</span>
                  </div>
                </div>
                <div class="info-body">
                  <p class="info-desc">{{ selectedAgent?.description || '你的专属学习陪伴' }}</p>
                  <div v-if="selectedAgent?.specialty" class="info-specialty">
                    <span class="label">擅长领域：</span>
                    <span>{{ selectedAgent.specialty }}</span>
                  </div>
                  <div v-if="agentStatus" class="info-meta">
                    <div class="meta-item">
                      <span class="meta-label">运行状态</span>
                      <span :class="['meta-value', getAgentStatusClass()]">{{ getAgentStatusText() }}</span>
                    </div>
                    <div v-if="agentStatus?.activeAgents !== undefined" class="meta-item">
                      <span class="meta-label">可用数量</span>
                      <span class="meta-value">{{ agentStatus.activeAgents }} / {{ agentStatus.totalAgents }}</span>
                    </div>
                    <div v-if="agentStatus?.responseTime !== undefined" class="meta-item">
                      <span class="meta-label">平均响应</span>
                      <span class="meta-value">{{ agentStatus.responseTime }}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-popover>

            <el-button size="small" type="danger" text @click="clearChat" :disabled="messages.length <= 1">
              🗑️ 清空对话
            </el-button>
          </div>
        </div>
      </template>

      <!-- 聊天界面 -->
      <div class="chat-content">
        <!-- 消息列表 -->
        <div class="message-list" ref="messageListRef">
          <!-- 空状态 -->
          <el-empty
            v-if="messages.length === 0"
            description="和你的 AI 学习伙伴打个招呼吧！"
            :image-size="180"
          >
            <template #image>
              <div class="empty-illustration">
                <span class="empty-emoji">🤗</span>
              </div>
            </template>
          </el-empty>

          <transition-group name="message-fade">
            <div
              v-for="(message, index) in messages"
              :key="index"
              :class="['message', message.type]"
            >
              <div class="message-avatar">
                <div class="avatar-icon" :class="message.type">
                  <span v-if="message.type === 'ai'">🤖</span>
                  <span v-else>👤</span>
                </div>
              </div>
              <div class="message-content">
                <div class="message-bubble" :class="message.type">
                  <div class="message-text" v-html="renderMessage(message.content, message.streaming)"></div>
                </div>
                <div class="message-time">
                  {{ message.time }}
                </div>
              </div>
            </div>
          </transition-group>

          <!-- 加载状态 -->
          <div v-if="loading" class="message ai">
            <div class="message-avatar">
              <div class="avatar-icon ai">
                <span>🤖</span>
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble ai loading">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="loading-text">思考中...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 快捷话题 -->
        <div class="quick-section" v-if="!loading && messages.length <= 2">
          <div class="section-title">
            <span>💡</span>
            <span>试试聊这些</span>
          </div>
          <div class="quick-questions">
            <el-tag
              v-for="(q, index) in quickTopics"
              :key="index"
              effect="plain"
              size="large"
              class="quick-tag"
              @click="sendQuickTopic(q)"
            >
              {{ q }}
            </el-tag>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-section">
          <div class="input-wrapper">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="2"
              placeholder="随便聊聊吧，学习上的困惑、生活中的心情都可以告诉我..."
              class="gradient-input"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <div class="input-toolbar">
              <div class="toolbar-hint">
                <span class="hint-text">Enter 发送，Shift+Enter 换行</span>
              </div>
              <div class="toolbar-right">
                <el-button
                  type="success"
                  :loading="loading"
                  @click="sendMessage"
                  class="send-btn"
                  :disabled="!inputMessage.trim()"
                >
                  <el-icon v-if="!loading"><Promotion /></el-icon>
                  {{ loading ? '发送中...' : '发送' }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Promotion, ArrowDown, InfoFilled } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import { companionApi, agentApi } from '@/api'
import { useChatStore } from '@/stores/chat'

const md = new MarkdownIt()
const chatStore = useChatStore()

const getCurrentTime = () => {
  const now = new Date()
  return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const quickTopics = ref([
  '最近学习好累，怎么调整状态？',
  '帮我制定一个学习计划吧',
  '今天学了很多但记不住怎么办？',
  '聊聊你的学习方法',
  '如何保持学习动力？',
  '给我一些鼓励吧'
])

const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const messageListRef = ref(null)

// 智能体相关状态
const availableAgents = ref([])
const selectedAgent = ref(null)
const agentStatus = ref(null)
const loadingAgents = ref(true)

const renderMessage = (content, streaming = false) => {
  if (!content) return ''
  return md.render(content) + (streaming ? '<span class="streaming-cursor">▊</span>' : '')
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// 从聊天 store 加载陪伴对话历史
const loadHistory = () => {
  const storeMessages = chatStore.getMessagesByType('companion')
  if (storeMessages && storeMessages.length > 0) {
    messages.value = storeMessages.map(msg => ({
      type: msg.role === 'user' ? 'user' : 'ai',
      content: msg.content,
      time: new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }))
    scrollToBottom()
    return
  }

  // 无历史时添加欢迎消息
  messages.value.push({
    type: 'ai',
    content: '你好呀！我是你的 **AI 学习伙伴** 🌟\n\n不管是学习上的疑问、遇到的困难，还是想要找人聊聊，我都在这里陪着你！\n\n有什么想和我说的吗？',
    time: getCurrentTime()
  })
}

// 清空对话
const clearChat = () => {
  chatStore.clearConversation('companion')
  messages.value = [{
    type: 'ai',
    content: '你好呀！我是你的 **AI 学习伙伴** 🌟\n\n不管是学习上的疑问、遇到的困难，还是想要找人聊聊，我都在这里陪着你！\n\n有什么想和我说的吗？',
    time: getCurrentTime()
  }]
  ElMessage.success('对话已清空')
}

const sendQuickTopic = (topic) => {
  inputMessage.value = topic
  sendMessage()
}

// 加载智能体列表
const loadAgents = async () => {
  try {
    loadingAgents.value = true
    const res = await agentApi.getList()
    if (res?.success && res.data) {
      availableAgents.value = res.data
      selectedAgent.value = res.data[0] || null
    }
  } catch (error) {
    console.error('加载智能体列表失败:', error)
    // 使用默认智能体
    availableAgents.value = [{
      id: 'default',
      name: 'AI 学习伙伴',
      icon: '🤖',
      specialty: '学习陪伴与交流',
      description: '你的专属学习陪伴，随时聊天，陪你一起成长'
    }]
    selectedAgent.value = availableAgents.value[0]
  } finally {
    loadingAgents.value = false
  }
}

// 加载智能体状态
const loadAgentStatus = async () => {
  try {
    const res = await agentApi.getStatus()
    if (res?.success && res.data) {
      agentStatus.value = res.data
      // 如果是降级状态，提示用户
      const status = res.data.status || res.data.overall || ''
      if (status === 'degraded' || status === 'partial') {
        ElMessage.warning({
          message: '当前部分智能体不可用，服务可能略有延迟',
          duration: 3000
        })
      }
    }
  } catch (error) {
    console.error('加载智能体状态失败:', error)
  }
}

// 切换智能体
const selectAgent = (agent) => {
  selectedAgent.value = agent
  ElMessage.success({
    message: `已切换到 ${agent.icon} ${agent.name}`,
    duration: 2000
  })
}

// 下拉菜单命令处理
const handleAgentCommand = (agent) => {
  selectAgent(agent)
}

// 获取状态样式类
const getAgentStatusClass = () => {
  if (!agentStatus.value) return 'status-online'
  const status = agentStatus.value.status || agentStatus.value.overall || ''
  if (status === 'busy' || status === 'overloaded') return 'status-busy'
  if (status === 'degraded' || status === 'partial') return 'status-degraded'
  return 'status-online'
}

// 获取状态文本
const getAgentStatusText = () => {
  if (!agentStatus.value) return '在线'
  const status = agentStatus.value.status || agentStatus.value.overall || ''
  if (status === 'busy' || status === 'overloaded') return '忙碌'
  if (status === 'degraded' || status === 'partial') return '部分可用'
  return '在线'
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }

  const userContent = inputMessage.value.trim()

  // 添加用户消息
  messages.value.push({
    type: 'user',
    content: userContent,
    time: getCurrentTime()
  })
  chatStore.addUserMessage(userContent, 'companion')

  inputMessage.value = ''
  await scrollToBottom()

  loading.value = true

  try {
    const userId = parseInt(localStorage.getItem('userId') || '1')
    const res = await companionApi.chat(userId, userContent)

    let aiContent = ''
    if (res?.success) {
      // 提取回复内容：兼容多种响应格式
      aiContent = res.data?.content || res.data?.message || res.data?.answer || res.data?.reply || ''
    } else {
      aiContent = '抱歉，我现在有点忙，稍后再和我聊聊吧 😊'
    }

    // 添加 AI 回复
    messages.value.push({
      type: 'ai',
      content: aiContent,
      time: getCurrentTime()
    })
    chatStore.addAIMessage(aiContent, 'companion')

    await scrollToBottom()
  } catch (error) {
    console.error('对话失败:', error)
    messages.value.push({
      type: 'ai',
      content: '哎呀，出了点小问题，不过别担心，我们待会儿再聊吧！',
      time: getCurrentTime()
    })
    ElMessage.error('发送失败，请稍后重试')
    await scrollToBottom()
  } finally {
    loading.value = false
  }
}

// 监听消息变化，自动滚动
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(() => {
  loadHistory()
  loadAgents()
  loadAgentStatus()
})
</script>

<style scoped>
.companion-container {
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
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
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

/* 标题行（含状态点） */
.title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.title-row h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #2d3748;
}

/* 状态指示点 */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.status-dot.status-online {
  background: #43e97b;
  box-shadow: 0 0 6px rgba(67, 233, 123, 0.6);
  animation: dotPulse 2s infinite;
}

.status-dot.status-busy {
  background: #f56c6c;
  box-shadow: 0 0 6px rgba(245, 108, 108, 0.6);
  animation: dotPulse 1s infinite;
}

.status-dot.status-degraded {
  background: #e6a23c;
  box-shadow: 0 0 6px rgba(230, 162, 60, 0.6);
  animation: dotPulse 1.5s infinite;
}

.status-text {
  font-size: 12px;
  font-weight: 500;
}

.status-text.status-online { color: #43e97b; }
.status-text.status-busy { color: #f56c6c; }
.status-text.status-degraded { color: #e6a23c; }

@keyframes dotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
}

/* 智能体选择器 */
.agent-dropdown {
  margin-left: 8px;
}

.agent-selector {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(67, 233, 123, 0.08) 0%, rgba(56, 249, 215, 0.08) 100%);
  border: 1px solid rgba(67, 233, 123, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.agent-selector:hover {
  background: linear-gradient(135deg, rgba(67, 233, 123, 0.15) 0%, rgba(56, 249, 215, 0.15) 100%);
  border-color: rgba(67, 233, 123, 0.4);
  box-shadow: 0 2px 8px rgba(67, 233, 123, 0.2);
}

.selector-icon {
  font-size: 16px;
}

.selector-name {
  font-size: 13px;
  color: #2d3748;
  font-weight: 500;
}

.selector-arrow {
  font-size: 12px;
  color: #a0aec0;
  transition: transform 0.3s ease;
}

/* 智能体下拉菜单 */
.agent-menu {
  padding: 8px;
}

.agent-menu .el-dropdown-menu__item {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.agent-menu .el-dropdown-menu__item:hover {
  background: rgba(67, 233, 123, 0.1);
}

.agent-menu .el-dropdown-menu__item.is-selected {
  background: linear-gradient(135deg, rgba(67, 233, 123, 0.15) 0%, rgba(56, 249, 215, 0.15) 100%);
  color: #2d3748;
}

.agent-menu-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.agent-menu-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.agent-menu-name {
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
}

.agent-menu-specialty {
  font-size: 12px;
  color: #a0aec0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 信息按钮 */
.info-btn {
  color: #a0aec0;
  transition: color 0.3s ease;
}

.info-btn:hover {
  color: #43e97b;
}

/* 智能体信息卡片 */
.agent-info-card {
  padding: 4px 0;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(67, 233, 123, 0.15);
}

.info-icon {
  font-size: 36px;
}

.info-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-title h4 {
  margin: 0;
  font-size: 16px;
  color: #2d3748;
}

.info-status {
  font-size: 12px;
  color: #718096;
}

.info-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-desc {
  margin: 0;
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
}

.info-specialty {
  font-size: 13px;
  color: #718096;
}

.info-specialty .label {
  font-weight: 600;
  color: #2d3748;
}

.info-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(67, 233, 123, 0.2);
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.meta-label {
  color: #718096;
}

.meta-value {
  font-weight: 500;
  color: #2d3748;
}

.meta-value.status-online { color: #43e97b; }
.meta-value.status-busy { color: #f56c6c; }
.meta-value.status-degraded { color: #e6a23c; }

/* 聊天内容区 */
.chat-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 消息列表 */
.message-list {
  min-height: 300px;
  max-height: 520px;
  overflow-y: auto;
  padding: 16px;
  background: linear-gradient(135deg, rgba(240, 253, 244, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%);
  border-radius: 12px;
  margin-bottom: 16px;
  margin-top: 8px;
}

.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  border-radius: 3px;
}

/* 空状态 */
.empty-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}

.empty-emoji {
  font-size: 72px;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
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
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.avatar-icon.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 消息内容 */
.message-content {
  display: flex;
  flex-direction: column;
  max-width: 65%;
}

.message.user .message-content {
  align-items: flex-end;
}

.message-bubble {
  padding: 16px 20px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  line-height: 1.6;
}

.message-bubble.ai {
  background: white;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(67, 233, 123, 0.2);
}

.message-bubble.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: rgba(67, 233, 123, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  color: #0d9488;
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
  color: #4a5568;
}

/* 消息时间 */
.message-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #a0aec0;
  margin-top: 6px;
}

/* 快捷话题 */
.quick-section {
  margin-bottom: 16px;
  animation: fadeIn 0.5s ease;
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
  box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3);
}

/* 输入区域 */
.input-section {
  padding: 0 4px;
}

.input-wrapper {
  background: white;
  border-radius: 16px;
  border: 2px solid rgba(67, 233, 123, 0.2);
  overflow: hidden;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #43e97b;
  box-shadow: 0 4px 16px rgba(67, 233, 123, 0.2);
}

.gradient-input :deep(.el-textarea__inner) {
  border: none !important;
  box-shadow: none !important;
  padding: 16px;
  font-size: 14px;
}

.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(67, 233, 123, 0.05);
  border-top: 1px solid rgba(67, 233, 123, 0.1);
}

.hint-text {
  font-size: 12px;
  color: #a0aec0;
}

.send-btn {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3);
  transition: all 0.3s ease;
  color: white;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(67, 233, 123, 0.4);
}

.send-btn:disabled {
  opacity: 0.6;
}

/* 加载指示器 */
.typing-indicator {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  margin-right: 8px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
.typing-indicator span:nth-child(3) { animation-delay: 0s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.message-bubble.loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-text {
  color: #718096;
  font-size: 14px;
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

/* 流式输出光标动画 */
.streaming-cursor {
  display: inline-block;
  color: #43e97b;
  animation: cursorBlink 0.8s infinite ease-in-out;
  font-weight: bold;
  margin-left: 2px;
}

@keyframes cursorBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
