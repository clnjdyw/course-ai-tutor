<template>
  <div class="dashboard-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <span class="title-emoji">📊</span>
            </div>
            <div>
              <h2>数据总览</h2>
              <p>教学数据一览无余</p>
            </div>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <span>👥</span>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalStudents }}</div>
              <div class="stat-label">学生总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
              <span>🟢</span>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeToday }}</div>
              <div class="stat-label">今日活跃</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)">
              <span>📚</span>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalCourses }}</div>
              <div class="stat-label">课程数量</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <span>🗄️</span>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.kbDocuments }}</div>
              <div class="stat-label">知识库文档</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- AI 学情概览 -->
      <div class="ai-section">
        <div class="section-header">
          <h3>🤖 AI 学情分析</h3>
          <el-button
            type="primary"
            :loading="analyzing"
            @click="runAnalysis"
            class="analyze-btn"
          >
            <span>{{ analyzing ? '分析中...' : '开始分析' }}</span>
          </el-button>
        </div>

        <div v-if="analysisResult" class="analysis-content" v-html="renderedAnalysis"></div>
        <el-empty
          v-else-if="!analyzing"
          description="点击「开始分析」获取 AI 学情报告"
          :image-size="120"
        />
      </div>

      <!-- 最近学习动态 -->
      <div class="activity-section">
        <h3>📋 最近学习动态</h3>
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in activities"
            :key="index"
            :timestamp="item.time"
            placement="top"
          >
            <el-card>
              <strong>{{ item.student }}</strong> {{ item.action }}
              <el-tag size="small" :type="item.type" style="margin-left: 8px">{{ item.tag }}</el-tag>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { teacherApi, extractContent } from '@/api'

const md = new MarkdownIt()

const stats = ref({
  totalStudents: 128,
  activeToday: 56,
  totalCourses: 24,
  kbDocuments: 342
})

const analyzing = ref(false)
const analysisResult = ref(null)

const renderedAnalysis = computed(() => {
  if (!analysisResult.value) return ''
  return md.render(analysisResult.value)
})

const activities = ref([
  { student: '小明', action: '完成了「Spring Boot 入门」章节', time: '2026-04-18 14:30', type: 'success', tag: '完成' },
  { student: '小红', action: '在「依赖注入」处遇到困难', time: '2026-04-18 13:45', type: 'warning', tag: '困难' },
  { student: '小李', action: '提交了作业「MVC 模式理解」', time: '2026-04-18 12:20', type: 'info', tag: '作业' },
  { student: '小张', action: '向 AI 提问 3 次', time: '2026-04-18 11:10', type: '', tag: '活跃' },
  { student: '小王', action: '连续学习 7 天', time: '2026-04-18 10:00', type: 'success', tag: '坚持' }
])

const runAnalysis = async () => {
  analyzing.value = true
  try {
    const response = await teacherApi.systemOverview()
    const content = extractContent(response)
    analysisResult.value = content || 'AI 暂未返回分析结果。'
    ElMessage.success('学情分析完成')
  } catch (error) {
    console.error('分析失败:', error)
    ElMessage.error('AI 分析失败，请检查后端服务是否正常运行')
    analysisResult.value = '## 分析失败\n\n无法连接到 AI 服务，请联系管理员检查系统状态。'
  } finally {
    analyzing.value = false
  }
}
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header { display: flex; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.title-icon {
  width: 50px; height: 50px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: white; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  font-size: 28px;
}
.title-emoji { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
.card-header h2 { margin: 0 0 4px 0; font-size: 20px; color: #2d3748; }
.card-header p { margin: 0; font-size: 13px; color: #718096; }

/* 统计卡片 */
.stats-row { margin-top: 8px; }
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); }
.stat-icon {
  width: 56px; height: 56px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.stat-value { font-size: 28px; font-weight: 700; color: #2d3748; }
.stat-label { font-size: 13px; color: #718096; margin-top: 2px; }

/* AI 分析 */
.ai-section {
  margin-top: 30px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.15);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-header h3 { margin: 0; font-size: 18px; color: #2d3748; }
.analyze-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.analysis-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  line-height: 1.8;
  color: #4a5568;
}
.analysis-content :deep(h3) { color: #2d3748; margin-top: 16px; }

/* 动态 */
.activity-section {
  margin-top: 30px;
}
.activity-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #2d3748;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
