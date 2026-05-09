<template>
  <div class="knowledge-import-container">
    <el-card class="header-card">
      <h2>知识点导入</h2>
      <p class="description">从文件、文本或 AI 自动提取知识点</p>
    </el-card>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="文件导入" name="file">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>上传文件</span>
            </div>
          </template>

          <el-form :model="fileForm" label-width="120px">
            <el-form-item label="选择课程">
              <el-select v-model="fileForm.courseId" placeholder="选择课程">
                <el-option
                  v-for="course in courses"
                  :key="course.id"
                  :label="course.title"
                  :value="course.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="上传文件">
              <el-upload
                drag
                :auto-upload="false"
                :limit="1"
                :on-change="handleFileChange"
                :before-upload="beforeUpload"
                accept=".md,.markdown,.txt,.text,.csv,.pdf,.docx"
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持格式：Markdown、TXT、CSV、PDF、Word (DOCX)，最大 50MB
                  </div>
                </template>
              </el-upload>
            </el-form-item>

            <el-form-item label="最大深度">
              <el-slider v-model="fileForm.maxDepth" :min="1" :max="5" show-stops />
            </el-form-item>

            <el-form-item label="默认难度">
              <el-rate v-model="fileForm.difficulty" />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                @click="handleFileImport"
                :loading="importing"
                :disabled="!fileForm.file"
              >
                开始导入
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="文本导入" name="text">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>粘贴文本</span>
            </div>
          </template>

          <el-form :model="textForm" label-width="120px">
            <el-form-item label="选择课程">
              <el-select v-model="textForm.courseId" placeholder="选择课程">
                <el-option
                  v-for="course in courses"
                  :key="course.id"
                  :label="course.title"
                  :value="course.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="文本内容">
              <el-input
                v-model="textForm.text"
                type="textarea"
                :rows="15"
                placeholder="粘贴教材、笔记或其他文本内容..."
              />
            </el-form-item>

            <el-form-item label="最大深度">
              <el-slider v-model="textForm.maxDepth" :min="1" :max="5" show-stops />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                @click="handleTextImport"
                :loading="importing"
                :disabled="!textForm.text"
              >
                AI 智能提取
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="AI 提取" name="ai">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>AI 知识点提取</span>
            </div>
          </template>

          <el-alert
            title="AI 将自动分析文本内容，识别知识点、建立层级关系、评估难度"
            type="info"
            :closable="false"
            show-icon
            class="mb-20"
          />

          <el-form :model="aiForm" label-width="120px">
            <el-form-item label="选择课程">
              <el-select v-model="aiForm.courseId" placeholder="选择课程">
                <el-option
                  v-for="course in courses"
                  :key="course.id"
                  :label="course.title"
                  :value="course.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="文本内容">
              <el-input
                v-model="aiForm.text"
                type="textarea"
                :rows="12"
                placeholder="输入教材内容，AI 将自动拆分知识点..."
              />
            </el-form-item>

            <el-form-item label="提取深度">
              <el-slider v-model="aiForm.maxDepth" :min="1" :max="5" show-stops />
            </el-form-item>

            <el-form-item label="基础难度">
              <el-rate v-model="aiForm.difficulty" />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                @click="handleAIExtract"
                :loading="extracting"
                :disabled="!aiForm.text"
              >
                开始提取
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="从对话提取" name="extract">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>从学习对话中提取知识点</span>
            </div>
          </template>

          <el-alert
            title="AI 将分析你的学习对话记录，自动提取知识点并加入知识库"
            type="info"
            :closable="false"
            show-icon
            class="mb-20"
          />

          <!-- 提取方式切换 -->
          <el-radio-group v-model="extractMode" class="extract-mode-switch mb-20">
            <el-radio-button value="paste">粘贴对话</el-radio-button>
            <el-radio-button value="history">从历史自动提取</el-radio-button>
          </el-radio-group>

          <!-- 粘贴对话模式 -->
          <el-form v-if="extractMode === 'paste'" :model="extractForm" label-width="120px">
            <el-form-item label="对话内容">
              <el-input
                v-model="extractForm.conversation"
                type="textarea"
                :rows="8"
                placeholder="粘贴对话内容..."
              />
            </el-form-item>

            <el-form-item label="置信度阈值">
              <el-slider v-model="extractForm.confidenceThreshold" :min="0.3" :max="1" :step="0.05" show-input :format-tooltip="v => (v * 100).toFixed(0) + '%'" />
            </el-form-item>

            <el-form-item label="自动加入知识库">
              <el-switch v-model="extractForm.autoAdd" />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                @click="handleConversationExtract"
                :loading="conversationExtracting"
                :disabled="!extractForm.conversation"
              >
                开始提取
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 从历史自动提取模式 -->
          <el-form v-else :model="historyForm" label-width="120px">
            <el-form-item label="Agent 类型">
              <el-select v-model="historyForm.agentType" placeholder="选择 Agent 类型">
                <el-option label="学习助手 (helper)" value="helper" />
                <el-option label="辅导教师 (tutor)" value="tutor" />
                <el-option label="评估器 (evaluator)" value="evaluator" />
              </el-select>
            </el-form-item>

            <el-form-item label="日期范围">
              <el-date-picker
                v-model="historyForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>

            <el-form-item label="置信度阈值">
              <el-slider v-model="historyForm.minConfidence" :min="0.5" :max="1" :step="0.05" show-input :format-tooltip="v => (v * 100).toFixed(0) + '%'" />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                @click="handleHistoryExtract"
                :loading="historyExtracting"
                :disabled="!historyForm.agentType"
              >
                自动提取
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 提取统计 -->
          <div v-if="extractStats" class="extract-stats">
            <el-descriptions title="知识提取统计" :column="2" border>
              <el-descriptions-item label="总提取次数">{{ extractStats.totalExtractions || 0 }}</el-descriptions-item>
              <el-descriptions-item label="成功次数">{{ extractStats.successfulExtractions || 0 }}</el-descriptions-item>
              <el-descriptions-item label="提取知识点总数">{{ extractStats.totalKnowledgePoints || 0 }}</el-descriptions-item>
              <el-descriptions-item label="平均置信度">{{ ((extractStats.averageConfidence || 0) * 100).toFixed(1) }}%</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="批量提取" name="batch">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>批量知识提取</span>
              <el-button type="primary" size="small" @click="showScheduleDialog = true">
                <el-icon><clock /></el-icon>
                定时提取
              </el-button>
            </div>
          </template>

          <el-alert
            title="从多个数据源批量提取知识点，支持自动加入知识库"
            type="info"
            :closable="false"
            show-icon
            class="mb-20"
          />

          <el-form :model="batchForm" label-width="120px">
            <el-form-item label="数据源">
              <el-checkbox-group v-model="batchForm.sources">
                <el-checkbox label="conversations">学习对话</el-checkbox>
                <el-checkbox label="notes">学习笔记</el-checkbox>
                <el-checkbox label="wrongQuestions">错题记录</el-checkbox>
                <el-checkbox label="exercises">练习记录</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="置信度阈值">
              <el-slider v-model="batchForm.minConfidence" :min="0.5" :max="1" :step="0.05" show-input :format-tooltip="v => (v * 100).toFixed(0) + '%'" />
            </el-form-item>

            <el-form-item label="自动加入知识库">
              <el-switch v-model="batchForm.autoAdd" />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                @click="handleBatchExtract"
                :loading="batchExtracting"
                :disabled="batchForm.sources.length === 0"
              >
                开始批量提取
              </el-button>
              <el-button
                @click="handleExtractStats"
                :loading="statsLoading"
              >
                查看统计
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 批量结果 -->
          <div v-if="batchResults.length > 0" class="batch-results">
            <h4>提取结果</h4>
            <el-table :data="batchResults" style="width: 100%" max-height="300">
              <el-table-column prop="source" label="数据源" />
              <el-table-column prop="count" label="知识点数" width="120" />
              <el-table-column prop="confidence" label="平均置信度" width="140">
                <template #default="scope">
                  {{ (scope.row.confidence * 100).toFixed(1) }}%
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.success ? 'success' : 'danger'">
                    {{ scope.row.success ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 队列状态指示器 -->
    <div v-if="showQueueStatus" class="queue-status-card">
      <el-card shadow="hover">
        <div class="queue-status">
          <div class="queue-status-header">
            <el-icon class="queue-spinner" :class="{ 'is-spinning': queueStatus.processing }"><loading /></el-icon>
            <span class="queue-status-text">
              {{ queueStatus.processing ? '正在处理提取任务' : '排队中' }}
            </span>
          </div>
          <div v-if="queueStatus.currentItem" class="queue-status-detail">
            当前处理: {{ queueStatus.currentItem }}
          </div>
          <div v-if="queueStatus.queuePosition > 0" class="queue-status-detail">
            队列位置: 第 {{ queueStatus.queuePosition }} 位
          </div>
          <div v-if="queueStatus.estimatedWait" class="queue-status-detail">
            预计等待: {{ queueStatus.estimatedWait }}
          </div>
          <div v-if="queueStatus.processingCount" class="queue-status-detail">
            正在处理: {{ queueStatus.processingCount }} 项
          </div>
        </div>
      </el-card>
    </div>

    <!-- 定时提取对话框 -->
    <el-dialog v-model="showScheduleDialog" title="创建定时提取任务" width="600px">
      <el-form :model="scheduleForm" label-width="120px">
        <el-form-item label="数据源">
          <el-checkbox-group v-model="scheduleForm.sources">
            <el-checkbox label="conversations">学习对话</el-checkbox>
            <el-checkbox label="notes">学习笔记</el-checkbox>
            <el-checkbox label="wrongQuestions">错题记录</el-checkbox>
            <el-checkbox label="exercises">练习记录</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="置信度阈值">
          <el-slider v-model="scheduleForm.minConfidence" :min="0.5" :max="1" :step="0.05" show-input :format-tooltip="v => (v * 100).toFixed(0) + '%'" />
        </el-form-item>

        <el-form-item label="自动加入知识库">
          <el-switch v-model="scheduleForm.autoAdd" />
        </el-form-item>

        <el-form-item label="执行时间">
          <el-time-picker
            v-model="scheduleForm.scheduleTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择时间"
          />
        </el-form-item>

        <el-form-item label="执行频率">
          <el-radio-group v-model="scheduleForm.frequency">
            <el-radio value="once">仅一次</el-radio>
            <el-radio value="daily">每天</el-radio>
            <el-radio value="weekly">每周</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showScheduleDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleSchedule"
          :loading="scheduleSubmitting"
          :disabled="scheduleForm.sources.length === 0"
        >
          创建定时任务
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showResults" title="导入结果" width="800px">
      <div v-if="importResults" class="import-results">
        <el-alert
          :title="`成功导入 ${successCount} 个知识点`"
          :type="successCount > 0 ? 'success' : 'error'"
          :closable="false"
          show-icon
          class="mb-20"
        />

        <el-table :data="resultsTable" style="width: 100%" max-height="400">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.success ? 'success' : 'danger'">
                {{ scope.row.success ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="count" label="知识点数" width="120" />
          <el-table-column prop="error" label="错误信息" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Clock, Loading } from '@element-plus/icons-vue'
import { knowledgeGraphApi, knowledgeApi, knowledgeExtractApi } from '@/api'

const activeTab = ref('file')
const importing = ref(false)
const extracting = ref(false)
const showResults = ref(false)
const importResults = ref(null)

const courses = ref([])

async function loadCourses() {
  try {
    const res = await knowledgeApi.getCourses()
    if (res?.success && res.data?.length > 0) {
      courses.value = res.data
    }
  } catch { /* fallback */ }
}

onMounted(loadCourses)

const fileForm = ref({
  courseId: null,
  file: null,
  maxDepth: 3,
  difficulty: 1
})

const textForm = ref({
  courseId: null,
  text: '',
  maxDepth: 3,
  difficulty: 1
})

const aiForm = ref({
  courseId: null,
  text: '',
  maxDepth: 3,
  difficulty: 1
})

// --- 从对话提取 ---
const extractMode = ref('paste')

const extractForm = ref({
  conversation: '',
  confidenceThreshold: 0.7,
  autoAdd: true
})
const conversationExtracting = ref(false)

// --- 从历史自动提取 ---
const historyForm = ref({
  agentType: '',
  dateRange: null,
  minConfidence: 0.7
})
const historyExtracting = ref(false)

const statsLoading = ref(false)
const extractStats = ref(null)

// --- 批量提取 ---
const batchForm = ref({
  sources: [],
  minConfidence: 0.7,
  autoAdd: true
})
const batchExtracting = ref(false)
const batchResults = ref([])

// --- 定时提取 ---
const showScheduleDialog = ref(false)
const scheduleForm = ref({
  sources: [],
  minConfidence: 0.7,
  autoAdd: true,
  scheduleTime: '',
  frequency: 'once'
})
const scheduleSubmitting = ref(false)

// --- 队列状态 ---
const queueStatus = ref({
  processing: false,
  currentItem: '',
  queuePosition: 0,
  estimatedWait: '',
  processingCount: 0
})
const showQueueStatus = ref(false)
let queuePollingTimer = null

function startQueuePolling() {
  showQueueStatus.value = true
  pollQueueStatus()
  queuePollingTimer = setInterval(() => {
    if (queueStatus.value.processing) {
      pollQueueStatus()
    } else {
      stopQueuePolling()
    }
  }, 5000)
}

function stopQueuePolling() {
  if (queuePollingTimer) {
    clearInterval(queuePollingTimer)
    queuePollingTimer = null
  }
  // Delay hiding to let the user see completion
  setTimeout(() => {
    if (!queuePollingTimer) {
      showQueueStatus.value = false
    }
  }, 3000)
}

async function pollQueueStatus() {
  try {
    const res = await knowledgeExtractApi.getQueueStatus()
    if (res?.success && res.data) {
      queueStatus.value = {
        processing: res.data.processing || false,
        currentItem: res.data.currentItem || '',
        queuePosition: res.data.queuePosition || 0,
        estimatedWait: res.data.estimatedWait || '',
        processingCount: res.data.processingCount || 0
      }
    }
  } catch {
    // Silently ignore polling errors
  }
}

onUnmounted(() => {
  stopQueuePolling()
})

const successCount = computed(() => {
  if (!importResults.value) return 0
  return Array.isArray(importResults.value)
    ? importResults.value.filter(r => r.success).length
    : 0
})

const resultsTable = computed(() => {
  if (!importResults.value || !Array.isArray(importResults.value)) return []

  return importResults.value.map(result => ({
    name: result.section || result.chunk || result.title || result.source || '未知',
    success: result.success,
    count: result.count || (result.success ? '已导入' : '-'),
    error: result.error || ''
  }))
})

function handleFileChange(uploadFile) {
  fileForm.value.file = uploadFile.raw
}

function beforeUpload(file) {
  const allowedTypes = [
    'text/markdown',
    'text/plain',
    'text/csv',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  const allowedExts = ['.md', '.markdown', '.txt', '.text', '.csv', '.pdf', '.docx']
  const ext = '.' + file.name.split('.').pop().toLowerCase()

  if (!allowedExts.includes(ext)) {
    ElMessage.error('不支持的文件格式')
    return false
  }

  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB')
    return false
  }

  return true
}

async function handleFileImport() {
  if (!fileForm.value.file) {
    ElMessage.warning('请先选择文件')
    return
  }

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', fileForm.value.file)
    formData.append('maxDepth', fileForm.value.maxDepth)
    formData.append('difficulty', fileForm.value.difficulty)

    const response = await knowledgeGraphApi.importFile(fileForm.value.courseId, formData)
    importResults.value = response.data
    showResults.value = true
    ElMessage.success(`成功导入 ${response.data.filter(r => r.success).length} 个知识点`)
  } catch (error) {
    ElMessage.error('文件导入失败: ' + error.message)
  } finally {
    importing.value = false
  }
}

async function handleTextImport() {
  if (!textForm.value.text.trim()) {
    ElMessage.warning('请输入文本内容')
    return
  }

  importing.value = true
  try {
    const response = await knowledgeGraphApi.importText(textForm.value.courseId, {
      text: textForm.value.text,
      maxDepth: textForm.value.maxDepth,
      difficulty: textForm.value.difficulty
    })
    importResults.value = response.data
    showResults.value = true
    ElMessage.success('文本导入完成')
  } catch (error) {
    ElMessage.error('文本导入失败: ' + error.message)
  } finally {
    importing.value = false
  }
}

async function handleAIExtract() {
  if (!aiForm.value.text.trim()) {
    ElMessage.warning('请输入文本内容')
    return
  }

  extracting.value = true
  try {
    const response = await knowledgeGraphApi.extractKnowledgePoints({
      text: aiForm.value.text,
      courseId: aiForm.value.courseId,
      maxDepth: aiForm.value.maxDepth,
      difficulty: aiForm.value.difficulty
    })
    importResults.value = [response.data]
    showResults.value = true
    ElMessage.success(`AI 提取完成，共 ${response.data.count} 个知识点`)
  } catch (error) {
    ElMessage.error('AI 提取失败: ' + error.message)
  } finally {
    extracting.value = false
  }
}

async function handleConversationExtract() {
  if (!extractForm.value.conversation.trim()) {
    ElMessage.warning('请输入对话内容')
    return
  }

  conversationExtracting.value = true
  startQueuePolling()
  try {
    const res = await knowledgeExtractApi.extract({
      conversation: extractForm.value.conversation,
      autoAdd: extractForm.value.autoAdd,
      confidenceThreshold: extractForm.value.confidenceThreshold
    })
    if (res?.success) {
      const count = res.data?.knowledgePoints?.length || res.data?.count || 0
      importResults.value = [{
        section: '对话知识提取',
        success: true,
        count: count
      }]
      showResults.value = true
      ElMessage.success(`提取完成，共 ${count} 个知识点`)
    }
  } catch (error) {
    ElMessage.error('对话知识提取失败: ' + error.message)
  } finally {
    conversationExtracting.value = false
    stopQueuePolling()
  }
}

async function handleHistoryExtract() {
  if (!historyForm.value.agentType) {
    ElMessage.warning('请选择 Agent 类型')
    return
  }

  historyExtracting.value = true
  startQueuePolling()
  try {
    const data = {
      agentType: historyForm.value.agentType,
      minConfidence: historyForm.value.minConfidence
    }
    if (historyForm.value.dateRange && historyForm.value.dateRange.length === 2) {
      data.startDate = historyForm.value.dateRange[0]
      data.endDate = historyForm.value.dateRange[1]
    }

    const res = await knowledgeExtractApi.extractFromHistory(data)
    if (res?.success) {
      const count = res.data?.knowledgePoints?.length || res.data?.count || 0
      importResults.value = [{
        section: `历史知识提取 (${historyForm.value.agentType})`,
        success: true,
        count: count
      }]
      showResults.value = true
      ElMessage.success(`从历史提取完成，共 ${count} 个知识点`)
    }
  } catch (error) {
    ElMessage.error('历史知识提取失败: ' + error.message)
  } finally {
    historyExtracting.value = false
    stopQueuePolling()
  }
}

async function handleBatchExtract() {
  if (batchForm.value.sources.length === 0) {
    ElMessage.warning('请至少选择一个数据源')
    return
  }

  batchExtracting.value = true
  batchResults.value = []
  startQueuePolling()
  try {
    const res = await knowledgeExtractApi.extractBatch({
      sources: batchForm.value.sources,
      minConfidence: batchForm.value.minConfidence,
      autoAdd: batchForm.value.autoAdd
    })
    if (res?.success) {
      const results = res.data?.results || []
      batchResults.value = results.map(r => ({
        source: r.source || '未知',
        count: r.count || 0,
        confidence: r.averageConfidence || 0,
        success: r.success
      }))
      const total = results.reduce((sum, r) => sum + (r.count || 0), 0)
      ElMessage.success(`批量提取完成，共 ${total} 个知识点`)
    }
  } catch (error) {
    ElMessage.error('批量提取失败: ' + error.message)
  } finally {
    batchExtracting.value = false
    stopQueuePolling()
  }
}

async function handleSchedule() {
  if (scheduleForm.value.sources.length === 0) {
    ElMessage.warning('请至少选择一个数据源')
    return
  }
  if (!scheduleForm.value.scheduleTime) {
    ElMessage.warning('请选择执行时间')
    return
  }

  scheduleSubmitting.value = true
  try {
    const res = await knowledgeExtractApi.schedule({
      sources: scheduleForm.value.sources,
      minConfidence: scheduleForm.value.minConfidence,
      autoAdd: scheduleForm.value.autoAdd,
      scheduleTime: scheduleForm.value.scheduleTime,
      frequency: scheduleForm.value.frequency
    })
    if (res?.success) {
      ElMessage.success('定时任务创建成功')
      showScheduleDialog.value = false
    }
  } catch (error) {
    ElMessage.error('创建定时任务失败: ' + error.message)
  } finally {
    scheduleSubmitting.value = false
  }
}

async function handleExtractStats() {
  statsLoading.value = true
  try {
    const res = await knowledgeExtractApi.getStats()
    if (res?.success) {
      extractStats.value = res.data
    }
  } catch (error) {
    ElMessage.error('获取统计失败: ' + error.message)
  } finally {
    statsLoading.value = false
  }
}
</script>

<style scoped>
.knowledge-import-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-card h2 {
  margin: 0 0 10px;
}

.description {
  color: #606266;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb-20 {
  margin-bottom: 20px;
}

.el-icon--upload {
  font-size: 67px;
  color: #8c939d;
  margin: 40px 0 16px;
  line-height: 50px;
}

.import-results {
  padding: 10px;
}

.extract-stats {
  margin-top: 20px;
  padding: 16px;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 8px;
}

.extract-mode-switch {
  display: block;
  margin-bottom: 20px;
}

.batch-results {
  margin-top: 20px;
}

.batch-results h4 {
  margin: 0 0 12px;
  color: #303133;
}

.queue-status-card {
  margin-top: 20px;
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  z-index: 2000;
}

.queue-status {
  padding: 4px 0;
}

.queue-status-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.queue-spinner {
  font-size: 18px;
  color: #409eff;
}

.queue-spinner.is-spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.queue-status-text {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.queue-status-detail {
  color: #606266;
  font-size: 13px;
  margin-top: 4px;
}
</style>
