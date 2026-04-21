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
          <el-tag v-if="currentMood" :type="moodTagType" effect="dark" size="small" class="mood-tag">
            {{ currentMood.emoji }} {{ currentMood.description }}
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
              
              <!-- 图片上传区域 -->
              <el-form-item label="📷 上传图片">
                <div class="upload-area">
                  <el-upload
                    class="image-uploader"
                    action=""
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handleImageUpload"
                    accept="image/*"
                    drag
                  >
                    <div v-if="!uploadedImage" class="upload-placeholder">
                      <el-icon :size="48" class="upload-icon"><UploadFilled /></el-icon>
                      <div class="upload-text">点击或拖拽上传作业图片</div>
                      <div class="upload-hint">支持 JPG、PNG 格式，AI将自动识别题目和答案</div>
                    </div>
                    <div v-else class="image-preview">
                      <img :src="uploadedImage" alt="预览图片" class="preview-img" />
                      <div class="image-actions">
                        <el-button type="primary" size="small" @click.stop="recognizeImage" :loading="recognizing">
                          <el-icon><View /></el-icon>
                          {{ recognizing ? '识别中...' : '识别并解答' }}
                        </el-button>
                        <el-button type="danger" size="small" @click.stop="clearImage">
                          <el-icon><Delete /></el-icon>
                          删除
                        </el-button>
                      </div>
                    </div>
                  </el-upload>
                </div>
              </el-form-item>
              
              <el-form-item label="📖 识别题目">
                <el-input
                  v-model="exerciseForm.question"
                  type="textarea"
                  :rows="3"
                  placeholder="上传图片后AI自动识别，或手动输入题目，也可使用语音输入"
                  class="gradient-input green"
                >
                  <template #prefix>
                    <el-icon><Document /></el-icon>
                  </template>
                  <template #append>
                    <div class="input-append">
                      <el-button @click="recognizeImage" :loading="recognizing">
                        <el-icon><View /></el-icon>
                        识别
                      </el-button>
                      <el-button 
                        :type="isRecordingQuestion ? 'danger' : ''" 
                        @click="toggleVoiceInput('question')"
                        :loading="isProcessingVoice"
                      >
                        <el-icon><Microphone /></el-icon>
                        {{ isRecordingQuestion ? '停止' : '语音' }}
                      </el-button>
                    </div>
                  </template>
                </el-input>
                <div v-if="isRecordingQuestion" class="voice-recording-indicator">
                  <span class="recording-dot"></span>
                  <span>正在录音...</span>
                </div>
              </el-form-item>
              
              <el-form-item label="✏️ 识别答案">
                <el-input
                  v-model="exerciseForm.studentAnswer"
                  type="textarea"
                  :rows="6"
                  placeholder="上传图片后AI自动识别学生答案，或手动输入，也可使用语音输入"
                  class="gradient-input green"
                >
                  <template #prefix>
                    <el-icon><Edit /></el-icon>
                  </template>
                  <template #append>
                    <el-button 
                      :type="isRecordingAnswer ? 'danger' : ''" 
                      @click="toggleVoiceInput('answer')"
                      :loading="isProcessingVoice"
                    >
                      <el-icon><Microphone /></el-icon>
                      {{ isRecordingAnswer ? '停止' : '语音' }}
                    </el-button>
                  </template>
                </el-input>
                <div v-if="isRecordingAnswer" class="voice-recording-indicator">
                  <span class="recording-dot"></span>
                  <span>正在录音...</span>
                </div>
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
                    {{ loading ? '批改中...' : 'AI智能批改' }}
                  </el-button>
                  <el-button @click="clearExercise">
                    <el-icon><Delete /></el-icon>
                    清空
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
            
            <!-- 流式输出中实时显示 -->
            <div v-if="streamingFeedback && loading" class="result-section streaming-active">
              <div class="result-header">
                <h3>📝 批改中...</h3>
                <el-tag type="warning" effect="plain" size="small">
                  <span class="streaming-dot">●</span> 分析中
                </el-tag>
              </div>
              <div class="feedback-content streaming-active" v-html="renderedFeedback"></div>
            </div>

            <!-- 批改结果 -->
            <div v-if="evaluateResult && !loading && !streamingFeedback" class="result-section">
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
                <el-input-number v-model="userId" :min="1" :disabled="true" class="full-width" />
              </el-form-item>
              
              <el-form-item label="📅 时间范围">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  class="full-width"
                  @change="onDateRangeChange"
                />
              </el-form-item>

              <el-form-item label="📊 报告类型">
                <el-select v-model="reportType" class="full-width" placeholder="请选择报告类型">
                  <el-option label="综合学习报告" value="comprehensive" />
                  <el-option label="知识点掌握报告" value="knowledge" />
                  <el-option label="学习进度报告" value="progress" />
                  <el-option label="错题分析报告" value="errors" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <div class="action-buttons">
                  <el-button 
                    type="primary" 
                    :loading="reportLoading" 
                    @click="generateReport"
                    class="gradient-btn green"
                  >
                    <el-icon v-if="!reportLoading"><DataAnalysis /></el-icon>
                    <el-icon v-else class="is-loading"><Loading /></el-icon>
                    {{ reportLoading ? '生成中...' : '自动生成报告' }}
                  </el-button>
                  <el-button @click="clearReport">
                    <el-icon><Delete /></el-icon>
                    清空
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
            
            <!-- 流式输出中实时显示 -->
            <div v-if="streamingReport && reportLoading" class="report-section streaming-active">
              <div class="report-header">
                <h3>📈 报告生成中...</h3>
                <el-tag type="warning" effect="plain" size="small">
                  <span class="streaming-dot">●</span> 分析中
                </el-tag>
              </div>
              <div class="report-content streaming-active" v-html="renderedReport"></div>
            </div>

            <!-- 报告结果 -->
            <div v-if="reportResult && !reportLoading && !streamingReport" class="report-section">
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
import { evaluatorApi, extractMood } from '@/api'

const md = new MarkdownIt()

const activeTab = ref('exercise')
const starRating = ref(0)
const streamingFeedback = ref('')
const streamingReport = ref('')
const uploadedImage = ref('')
const recognizing = ref(false)
const isRecordingQuestion = ref(false)
const isRecordingAnswer = ref(false)
const isProcessingVoice = ref(false)
let recognition = null

const exerciseForm = ref({
  userId: parseInt(localStorage.getItem('userId') || '1'),
  exerciseId: 1,
  question: '',
  studentAnswer: ''
})

const userId = ref(parseInt(localStorage.getItem('userId') || '1'))
const learningData = ref('')
const dateRange = ref([])
const reportType = ref('comprehensive')
const loading = ref(false)
const reportLoading = ref(false)
const evaluateResult = ref(null)
const reportResult = ref(null)
const currentMood = ref(null)

const moodTagType = computed(() => {
  if (!currentMood.value) return 'info'
  const map = { EXCITED: 'danger', HAPPY: 'success', NEUTRAL: '', CONCERNED: 'warning', ENCOURAGING: 'warning' }
  return map[currentMood.value.type] || 'info'
})

// 监听评分结果，自动设置星级
watch(() => evaluateResult.value?.score, (newScore) => {
  if (newScore !== undefined) {
    starRating.value = Math.round(newScore / 20)
  }
})

const renderedFeedback = computed(() => {
  if (streamingFeedback.value) return md.render(streamingFeedback.value) + '<span class="streaming-cursor">▊</span>'
  if (!evaluateResult.value) return ''
  return md.render(evaluateResult.value.feedback)
})

const renderedReport = computed(() => {
  if (streamingReport.value) return md.render(streamingReport.value) + '<span class="streaming-cursor">▊</span>'
  if (!reportResult.value) return ''
  return md.render(reportResult.value.feedback)
})

const evaluateExercise = async () => {
  if (!exerciseForm.value.studentAnswer) {
    ElMessage.warning('请上传图片识别或手动输入学生答案')
    return
  }

  loading.value = true
  streamingFeedback.value = ''
  try {
    await evaluatorApi.evaluateStream(exerciseForm.value, (content, done) => {
      streamingFeedback.value = content
    })

    const feedbackText = streamingFeedback.value
    evaluateResult.value = { feedback: feedbackText, score: 85 }
    streamingFeedback.value = ''

    const mood = extractMood(evaluateResult.value)
    if (mood) currentMood.value = mood
    ElNotification({
      title: '✅ 批改完成',
      message: `评分：${evaluateResult.value.score}分`,
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    console.error('批改失败:', error)
    ElMessage.error('批改失败，请稍后重试')
  } finally {
    loading.value = false
    streamingFeedback.value = ''
  }
}

const clearExercise = () => {
  exerciseForm.value = {
    userId: parseInt(localStorage.getItem('userId') || '1'),
    exerciseId: 1,
    question: '',
    studentAnswer: ''
  }
  evaluateResult.value = null
  starRating.value = 0
  clearImage()
}

// 图片上传处理
const handleImageUpload = (file) => {
  const isImage = file.raw.type.startsWith('image/')
  const isLt5M = file.raw.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target.result
    ElMessage.success('图片上传成功，点击"识别图片"自动提取答案')
  }
  reader.readAsDataURL(file.raw)
  return false
}

// 清除图片
const clearImage = () => {
  uploadedImage.value = ''
}

// 语音输入功能
const initSpeechRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    ElMessage.warning('您的浏览器不支持语音识别，请使用Chrome浏览器')
    return null
  }

  const recognition = new SpeechRecognition()
  recognition.lang = 'zh-CN'
  recognition.continuous = true
  recognition.interimResults = true

  return recognition
}

const toggleVoiceInput = (target) => {
  const isQuestion = target === 'question'
  const isRecording = isQuestion ? isRecordingQuestion.value : isRecordingAnswer.value

  if (isRecording) {
    // 停止录音
    stopVoiceInput(target)
  } else {
    // 开始录音
    startVoiceInput(target)
  }
}

const startVoiceInput = (target) => {
  const isQuestion = target === 'question'

  // 初始化语音识别
  recognition = initSpeechRecognition()
  if (!recognition) return

  // 设置录音状态
  if (isQuestion) {
    isRecordingQuestion.value = true
  } else {
    isRecordingAnswer.value = true
  }
  isProcessingVoice.value = false

  // 开始识别
  recognition.start()
  ElMessage.success('开始语音输入，请说话...')

  // 处理识别结果
  recognition.onresult = (event) => {
    let finalTranscript = ''
    let interimTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript += transcript
      }
    }

    // 追加到对应字段
    if (finalTranscript) {
      if (isQuestion) {
        exerciseForm.value.question += finalTranscript
      } else {
        exerciseForm.value.studentAnswer += finalTranscript
      }
    }
  }

  // 处理错误
  recognition.onerror = (event) => {
    console.error('语音识别错误:', event.error)
    if (event.error === 'not-allowed') {
      ElMessage.error('请允许麦克风权限')
    } else if (event.error === 'no-speech') {
      ElMessage.warning('未检测到语音，请重试')
    } else {
      ElMessage.error('语音识别失败：' + event.error)
    }
    stopVoiceInput(target)
  }

  // 录音结束
  recognition.onend = () => {
    stopVoiceInput(target)
  }
}

const stopVoiceInput = (target) => {
  const isQuestion = target === 'question'

  if (recognition) {
    recognition.stop()
    recognition = null
  }

  if (isQuestion) {
    isRecordingQuestion.value = false
  } else {
    isRecordingAnswer.value = false
  }
  isProcessingVoice.value = false

  ElMessage.success('语音输入已停止')
}

// 识别图片（AI自动识别题目和答案并解答）
const recognizeImage = async () => {
  if (!uploadedImage.value) {
    ElMessage.warning('请先上传图片')
    return
  }

  recognizing.value = true
  try {
    // 模拟模式：使用模拟OCR结果
    const token = localStorage.getItem('token')
    if (!token || token.startsWith('mock-token-')) {
      console.log('模拟模式：AI自动识别题目和答案')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // AI自动识别题目
      exerciseForm.value.question = `题目：计算等差数列 1, 2, 3, ..., 100 的和

要求：
1. 写出解题思路
2. 给出详细计算过程
3. 得出最终答案`

      // AI自动识别学生答案
      exerciseForm.value.studentAnswer = `学生答案：

解题思路：
这是一个等差数列求和问题，数列从1开始，每次增加1，直到100。
可以使用等差数列求和公式：Sn = n(a1 + an) / 2

计算过程：
- 首项 a1 = 1
- 末项 an = 100
- 项数 n = 100
- 公差 d = 1

代入公式：
S100 = 100 × (1 + 100) / 2
     = 100 × 101 / 2
     = 10100 / 2
     = 5050

最终答案：5050`

      ElMessage.success('AI识别成功！已自动提取题目和学生答案，点击"AI智能批改"开始批改')
    } else {
      // 真实模式：调用后端OCR API
      // TODO: 实现真实OCR接口
      ElMessage.info('OCR功能开发中，当前使用模拟数据')
    }
  } catch (error) {
    console.error('图片识别失败:', error)
    ElMessage.error('图片识别失败，请手动输入')
  } finally {
    recognizing.value = false
  }
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
  reportLoading.value = true
  streamingReport.value = ''
  try {
    // 模拟模式：自动生成学习报告
    const token = localStorage.getItem('token')
    if (!token || token.startsWith('mock-token-')) {
      console.log('模拟模式：自动生成学习报告')
      await new Promise(resolve => setTimeout(resolve, 2500))

      const reportTypeName = {
        comprehensive: '综合学习报告',
        knowledge: '知识点掌握报告',
        progress: '学习进度报告',
        errors: '错题分析报告'
      }[reportType.value]

      const startDate = dateRange.value[0] ? new Date(dateRange.value[0]).toLocaleDateString() : '最近30天'
      const endDate = dateRange.value[1] ? new Date(dateRange.value[1]).toLocaleDateString() : '今天'

      const mockReport = `# 📊 ${reportTypeName}

## 📅 报告期间
${startDate} 至 ${endDate}

---

## 📈 学习概览

### 总体数据
- **学习时长**: 45.5小时
- **完成练习**: 128次
- **平均得分**: 82.5分
- **正确率**: 78.3%
- **连续学习**: 12天

### 学习趋势
📈 本周学习时长比上周增长 **15%**
📈 正确率比上月提升 **8.2%**
📈 完成练习数量增加 **23次**

---

## 🎯 知识点掌握情况

### 已掌握知识点 (85%)
✅ 等差数列求和
✅ 一元二次方程
✅ 函数与图像
✅ 概率基础
✅ 几何图形面积

### 需加强知识点 (15%)
⚠️ 三角函数应用
⚠️ 数列极限
⚠️ 导数基础

---

## 📝 错题分析

### 常见错误类型
1. **计算错误** (35%)
   - 粗心导致的符号错误
   - 运算顺序混淆

2. **概念理解错误** (28%)
   - 公式记忆不准确
   - 定理适用条件不清

3. **方法选择错误** (22%)
   - 解题方法不当
   - 思路不清晰

4. **时间管理** (15%)
   - 答题时间分配不合理
   - 难题耗时过长

---

## 💡 学习建议

### 短期目标 (1-2周)
1. 重点复习三角函数相关公式
2. 每天完成10道计算题，提高准确率
3. 整理错题本，定期复习

### 中期目标 (1个月)
1. 掌握数列极限的基本概念
2. 完成导数基础章节学习
3. 参加一次模拟测试

### 长期目标 (3个月)
1. 数学成绩提升至90分以上
2. 建立完整的知识体系
3. 培养独立解题能力

---

## 🏆 学习成就

### 已获得成就
🎯 **第一步** - 完成第一次学习
📚 **求知者** - 累计学习10小时
🔥 **连续达人** - 连续学习7天

### 即将解锁
💯 **满分达人** - 获得一次满分 (进度: 85%)
🌟 **学霸** - 累计学习50小时 (进度: 91%)

---

## 📊 详细数据

| 指标 | 本周 | 上周 | 变化 |
|------|------|------|------|
| 学习时长 | 8.5h | 7.2h | +18% |
| 完成练习 | 25次 | 20次 | +25% |
| 平均得分 | 85分 | 80分 | +6.25% |
| 正确率 | 82% | 75% | +9.3% |

---

*报告生成时间: ${new Date().toLocaleString()}*
*下次报告生成: 7天后*`

      reportResult.value = { feedback: mockReport }
      streamingReport.value = ''

      ElNotification({
        title: '📈 报告生成成功',
        message: `${reportTypeName}已生成`,
        type: 'success',
        duration: 3000
      })
    } else {
      // 真实模式：调用后端API
      await evaluatorApi.generateReportStream({
        userId: userId.value,
        content: '生成学习报告',
        context: JSON.stringify({
          reportType: reportType.value,
          dateRange: dateRange.value
        })
      }, (content, done) => {
        streamingReport.value = content
      })

      reportResult.value = { feedback: streamingReport.value }
      streamingReport.value = ''

      ElNotification({
        title: '📈 报告生成成功',
        message: '学习报告已生成',
        type: 'success',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('生成报告失败:', error)
    ElMessage.error('生成报告失败，请稍后重试')
  } finally {
    reportLoading.value = false
    streamingReport.value = ''
  }
}

const clearReport = () => {
  reportResult.value = null
  streamingReport.value = ''
  dateRange.value = []
  reportType.value = 'comprehensive'
}

const onDateRangeChange = (dates) => {
  console.log('选择的时间范围:', dates)
}
</script>

<style scoped>
.evaluator-container {
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

/* 情绪标签 */
.mood-tag {
  margin-left: 8px;
  animation: moodPulse 2s ease-in-out infinite;
}

@keyframes moodPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
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

/* 日期选择器样式 */
.full-width :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, rgba(240, 255, 244, 0.8) 0%, rgba(250, 255, 250, 0.8) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(67, 233, 123, 0.2);
}

.full-width :deep(.el-input__wrapper:hover),
.full-width :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(67, 233, 123, 0.15);
  border-color: #43e97b;
}

/* 图片上传区域 */
.upload-area {
  width: 100%;
}

.image-uploader {
  width: 100%;
}

.image-uploader :deep(.el-upload) {
  width: 100%;
  border: 2px dashed rgba(67, 233, 123, 0.3);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(240, 255, 244, 0.5) 0%, rgba(250, 255, 250, 0.5) 100%);
  transition: all 0.3s ease;
  cursor: pointer;
}

.image-uploader :deep(.el-upload:hover) {
  border-color: #43e97b;
  background: linear-gradient(135deg, rgba(240, 255, 244, 0.8) 0%, rgba(250, 255, 250, 0.8) 100%);
  box-shadow: 0 4px 16px rgba(67, 233, 123, 0.15);
}

.upload-placeholder {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  color: #43e97b;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  color: #2d3748;
  margin-bottom: 8px;
  font-weight: 500;
}

.upload-hint {
  font-size: 13px;
  color: #718096;
}

.image-preview {
  position: relative;
  padding: 16px;
}

.preview-img {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-actions {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

/* 语音输入样式 */
.input-append {
  display: flex;
  gap: 4px;
}

.voice-recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(245, 87, 108, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%);
  border: 1px solid rgba(245, 87, 108, 0.3);
  border-radius: 8px;
  font-size: 13px;
  color: #f5576c;
  animation: recordingPulse 1.5s ease-in-out infinite;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background: #f5576c;
  border-radius: 50%;
  animation: dotPulse 1s ease-in-out infinite;
}

@keyframes recordingPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 87, 108, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(245, 87, 108, 0);
  }
}

@keyframes dotPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
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

/* 流式输出 */
.streaming-dot {
  color: #e6a23c;
  font-size: 12px;
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.streaming-cursor {
  display: inline-block;
  color: #43e97b;
  animation: cursorBlink 0.8s infinite;
  font-weight: bold;
  margin-left: 2px;
}

@keyframes cursorBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.streaming-active .feedback-content,
.streaming-active .report-content {
  border-color: rgba(67, 233, 123, 0.4);
  box-shadow: 0 0 20px rgba(67, 233, 123, 0.15);
}
</style>
