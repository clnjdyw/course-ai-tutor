<template>
  <div class="analytics-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)">
              <span class="title-emoji">📈</span>
            </div>
            <div>
              <h2>学情分析</h2>
              <p>AI 驱动的深度学情分析报告</p>
            </div>
          </div>
        </div>
      </template>

      <!-- 分析配置 -->
      <div class="config-section">
        <el-form :model="form" label-width="120px" size="large">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="📋 分析维度">
                <el-select v-model="form.analysisType" class="full-width">
                  <el-option label="📊 综合分析" value="comprehensive" />
                  <el-option label="📉 进度分析" value="progress" />
                  <el-option label="🔍 薄弱知识点" value="weakness" />
                  <el-option label="💡 教学建议" value="suggestions" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="👤 目标范围">
                <el-select v-model="form.scope" class="full-width">
                  <el-option label="👥 全体学生" value="all" />
                  <el-option label="📊 按等级筛选" value="byLevel" />
                  <el-option label="🟢 活跃学生" value="active" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="📝 补充说明">
            <el-input
              v-model="form.note"
              type="textarea"
              :rows="3"
              placeholder="可选：输入需要特别关注的方面，如「重点关注不及格学生」"
              class="gradient-input"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="analyzing"
              @click="runAnalysis"
              class="analyze-btn"
              size="large"
            >
              🤖 {{ analyzing ? 'AI 分析中...' : '生成分析报告' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 分析结果 -->
      <div v-if="analysisResult" class="result-section">
        <div class="result-header">
          <h3>📈 分析报告</h3>
          <div class="result-actions">
            <el-button size="small" @click="copyReport">📋 复制</el-button>
            <el-button type="success" size="small" @click="exportReport">💾 导出</el-button>
          </div>
        </div>
        <div class="analysis-content" v-html="renderedAnalysis"></div>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!analyzing && !analysisResult"
        description="配置分析参数后点击「生成分析报告」"
        :image-size="160"
      >
        <template #image>
          <div class="empty-illustration">
            <span class="empty-emoji">📊</span>
          </div>
        </template>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { teacherApi, extractContent } from '@/api'

const md = new MarkdownIt()

const form = ref({
  analysisType: 'comprehensive',
  scope: 'all',
  note: ''
})

const analyzing = ref(false)
const analysisResult = ref(null)

const renderedAnalysis = computed(() => {
  if (!analysisResult.value) return ''
  return md.render(analysisResult.value)
})

const runAnalysis = async () => {
  analyzing.value = true
  try {
    const response = await teacherApi.systemOverview()
    const content = extractContent(response)
    if (content) {
      analysisResult.value = content
    } else {
      throw new Error('empty response')
    }
    ElMessage.success('分析报告已生成')
  } catch (error) {
    console.error('分析失败:', error)
    ElMessage.error('AI 分析失败，请检查后端服务是否正常运行')
    analysisResult.value = '## 分析失败\n\n无法连接到 AI 服务，请联系管理员检查系统状态。'
  } finally {
    analyzing.value = false
  }
}

const getAnalysisLabel = (type) => {
  const map = { comprehensive: '综合分析', progress: '进度分析', weakness: '薄弱知识点', suggestions: '教学建议' }
  return map[type] || type
}

const copyReport = () => {
  navigator.clipboard.writeText(analysisResult.value)
  ElMessage.success('已复制')
}

const exportReport = () => {
  ElMessage.success('报告已导出')
}
</script>

<style scoped>
.analytics-container { max-width: 1200px; margin: 0 auto; animation: fadeInUp 0.6s ease; }
.glass-card {
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.card-header { display: flex; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.title-icon {
  width: 50px; height: 50px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: white; box-shadow: 0 4px 12px rgba(246, 211, 101, 0.4); font-size: 28px;
}
.card-header h2 { margin: 0 0 4px 0; font-size: 20px; color: #2d3748; }
.card-header p { margin: 0; font-size: 13px; color: #718096; }

.config-section { padding: 8px 0; }
.full-width { width: 100%; }
.gradient-input :deep(.el-textarea__wrapper) {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0.8) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(246, 211, 101, 0.2);
}
.analyze-btn {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  border: none; box-shadow: 0 4px 16px rgba(246, 211, 101, 0.3);
}

.result-section { margin-top: 24px; }
.result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.result-header h3 { margin: 0; font-size: 18px; color: #2d3748; }
.result-actions { display: flex; gap: 8px; }
.analysis-content {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%);
  padding: 24px; border-radius: 12px; line-height: 1.8; color: #4a5568;
  border: 1px solid rgba(246, 211, 101, 0.15);
}
.analysis-content :deep(h3) { color: #2d3748; margin-top: 16px; }

.empty-illustration { display: flex; align-items: center; justify-content: center; }
.empty-emoji { font-size: 60px; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>
