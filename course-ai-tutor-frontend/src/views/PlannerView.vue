<template>
  <div class="planner-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div>
              <h2>📚 学习规划智能体</h2>
              <p>AI 为你定制个性化学习路径</p>
            </div>
          </div>
          <el-tag type="success" effect="dark" size="large">
            <el-icon><MagicStick /></el-icon>
            AI Powered
          </el-tag>
        </div>
      </template>
      
      <!-- 输入表单 -->
      <div class="form-section">
        <el-form :model="form" label-width="110px" size="large">
          <el-form-item label="🎯 学习目标">
            <el-input
              v-model="form.goal"
              type="textarea"
              :rows="3"
              placeholder="请输入你的学习目标，例如：学习 Spring Boot 框架"
              class="gradient-input"
            >
              <template #prefix>
                <el-icon><Flag /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="📊 当前水平">
                <el-select v-model="form.currentLevel" placeholder="请选择" class="full-width">
                  <el-option label="🌱 零基础" value="BEGINNER" />
                  <el-option label="🌿 入门" value="ELEMENTARY" />
                  <el-option label="🌳 中级" value="INTERMEDIATE" />
                  <el-option label="🌲 高级" value="ADVANCED" />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="⏰ 可用时间">
                <el-input v-model="form.availableTime" placeholder="例如：每天 2 小时" class="gradient-input">
                  <template #prefix>
                    <el-icon><Clock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="💡 学习偏好">
            <el-input v-model="form.preference" placeholder="例如：喜欢实践、喜欢看视频等" class="gradient-input">
              <template #prefix>
                <el-icon><Lightbulb /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item>
            <div class="action-buttons">
              <el-button 
                type="primary" 
                size="large" 
                :loading="loading" 
                @click="createPlan"
                class="gradient-btn"
              >
                <el-icon v-if="!loading"><MagicStick /></el-icon>
                <el-icon v-else class="is-loading"><Loading /></el-icon>
                {{ loading ? 'AI 生成中...' : '生成学习计划' }}
              </el-button>
              
              <el-button size="large" @click="clearForm">
                <el-icon><Delete /></el-icon>
                清空
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-section">
        <div class="loading-animation">
          <div class="loading-circle"></div>
          <div class="loading-circle"></div>
          <div class="loading-circle"></div>
        </div>
        <p class="loading-text">
          <el-icon class="is-loading"><Loading /></el-icon>
          AI 正在分析你的需求，制定个性化学习计划...
        </p>
      </div>
      
      <!-- 结果显示 -->
      <div v-if="planResult && !loading" class="result-section">
        <div class="result-header">
          <h3>📋 生成的学习计划</h3>
          <div class="result-actions">
            <el-button @click="copyPlan" size="small">
              <el-icon><DocumentCopy /></el-icon>
              复制
            </el-button>
            <el-button type="success" @click="savePlan" size="small">
              <el-icon><Download /></el-icon>
              保存
            </el-button>
            <el-button type="warning" @click="adjustPlan" size="small">
              <el-icon><Edit /></el-icon>
              调整
            </el-button>
          </div>
        </div>
        
        <div class="plan-content" v-html="renderedContent"></div>
        
        <div class="result-footer">
          <el-alert
            title="💡 温馨提示"
            type="info"
            :closable="false"
            show-icon
          >
            <p>学习计划已生成，建议保存并根据实际情况调整。坚持执行计划，你一定能达成目标！</p>
          </el-alert>
        </div>
      </div>
      
      <!-- 空状态 -->
      <el-empty 
        v-if="!loading && !planResult" 
        description="请输入学习目标，AI 将为你制定个性化学习计划"
        :image-size="200"
      >
        <template #image>
          <div class="empty-illustration">
            <el-icon :size="80" color="#667eea"><Document /></el-icon>
          </div>
        </template>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { plannerApi } from '@/api'

const md = new MarkdownIt()

const form = ref({
  userId: 1,
  goal: '',
  currentLevel: '',
  availableTime: '',
  preference: ''
})

const loading = ref(false)
const planResult = ref(null)

const renderedContent = computed(() => {
  if (!planResult.value) return ''
  return md.render(planResult.value.planContent)
})

// 创建学习计划
const createPlan = async () => {
  if (!form.value.goal) {
    ElMessage.warning('请输入学习目标')
    return
  }
  
  loading.value = true
  try {
    const response = await plannerApi.createPlan(form.value)
    planResult.value = response
    
    ElNotification({
      title: '✅ 计划生成成功',
      message: 'AI 已为你制定个性化学习计划',
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    console.error('生成计划失败:', error)
    ElMessage.error('生成失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 清空表单
const clearForm = () => {
  form.value = {
    userId: 1,
    goal: '',
    currentLevel: '',
    availableTime: '',
    preference: ''
  }
  planResult.value = null
}

// 复制计划
const copyPlan = () => {
  navigator.clipboard.writeText(planResult.value.planContent)
  ElMessage.success('已复制到剪贴板')
}

// 保存计划
const savePlan = () => {
  ElNotification({
    title: '💾 保存成功',
    message: '学习计划已保存到本地',
    type: 'success',
    duration: 3000
  })
}

// 调整计划
const adjustPlan = () => {
  ElMessage.info('调整功能开发中...')
}
</script>

<style scoped>
.planner-container {
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

/* 表单区域 */
.form-section {
  padding: 20px 0;
}

.gradient-input :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.gradient-input :deep(.el-input__wrapper:hover),
.gradient-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
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

.gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.gradient-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
}

/* 加载动画 */
.loading-section {
  text-align: center;
  padding: 60px 20px;
}

.loading-animation {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.loading-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-circle:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-circle:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #718096;
  font-size: 14px;
}

/* 结果区域 */
.result-section {
  margin-top: 30px;
  animation: fadeIn 0.5s ease;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.result-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2d3748;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.plan-content {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%);
  padding: 30px;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  line-height: 1.8;
  max-height: 600px;
  overflow-y: auto;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.03);
}

.plan-content :deep(h1),
.plan-content :deep(h2),
.plan-content :deep(h3) {
  color: #2d3748;
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
}

.plan-content :deep(h1) {
  font-size: 24px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
  padding-bottom: 8px;
}

.plan-content :deep(h2) {
  font-size: 20px;
}

.plan-content :deep(h3) {
  font-size: 16px;
}

.plan-content :deep(p) {
  margin: 12px 0;
  color: #4a5568;
}

.plan-content :deep(ul),
.plan-content :deep(ol) {
  padding-left: 24px;
  margin: 12px 0;
}

.plan-content :deep(li) {
  margin: 8px 0;
  color: #4a5568;
}

.plan-content :deep(code) {
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  color: #667eea;
}

.plan-content :deep(pre) {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  color: #e2e8f0;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.plan-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

.result-footer {
  margin-top: 20px;
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

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
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
