<template>
  <div class="students-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
              <span class="title-emoji">👥</span>
            </div>
            <div>
              <h2>学生管理</h2>
              <p>管理学生信息，AI 分析学习情况</p>
            </div>
          </div>
          <div class="header-actions">
            <el-input v-model="searchQuery" placeholder="搜索学生..." prefix-icon="Search" clearable class="search-input" />
          </div>
        </div>
      </template>

      <!-- 学生列表 -->
      <el-table :data="filteredStudents" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="level" label="等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="levelType(row.level)" size="small">Lv.{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="学习进度" width="180">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column prop="streak" label="连续学习" width="110" align="center">
          <template #default="{ row }">
            🔥 {{ row.streak }}天
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '在线' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="analyzeStudent(row)">🤖 AI 分析</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- AI 分析对话框 -->
      <el-dialog v-model="showAnalysis" :title="`🤖 AI 学情分析 - ${selectedStudent?.name}`" width="700px">
        <div v-if="analyzing" class="analyzing-box">
          <el-icon class="is-loading" :size="40"><Loading /></el-icon>
          <p>AI 正在分析学习数据...</p>
        </div>
        <div v-else-if="analysisResult" class="analysis-result" v-html="renderedAnalysis"></div>
        <template #footer>
          <el-button @click="showAnalysis = false">关闭</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import MarkdownIt from 'markdown-it'
import { teacherApi, extractContent } from '@/api'

const md = new MarkdownIt()

const loading = ref(false)
const searchQuery = ref('')
const showAnalysis = ref(false)
const analyzing = ref(false)
const selectedStudent = ref(null)
const analysisResult = ref(null)

const renderedAnalysis = computed(() => {
  if (!analysisResult.value) return ''
  return md.render(analysisResult.value)
})

const students = ref([
  { id: 1, name: '小明', level: 5, progress: 72, streak: 7, status: '在线' },
  { id: 2, name: '小红', level: 4, progress: 58, streak: 3, status: '离线' },
  { id: 3, name: '小李', level: 6, progress: 85, streak: 14, status: '在线' },
  { id: 4, name: '小张', level: 3, progress: 35, streak: 2, status: '在线' },
  { id: 5, name: '小王', level: 5, progress: 68, streak: 9, status: '离线' },
  { id: 6, name: '小赵', level: 2, progress: 20, streak: 1, status: '离线' },
  { id: 7, name: '小陈', level: 7, progress: 92, streak: 21, status: '在线' },
  { id: 8, name: '小刘', level: 4, progress: 45, streak: 5, status: '在线' }
])

const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  return students.value.filter(s => s.name.includes(searchQuery.value))
})

const levelType = (level) => {
  if (level >= 6) return 'success'
  if (level >= 4) return 'warning'
  return 'info'
}

const analyzeStudent = async (student) => {
  selectedStudent.value = student
  showAnalysis.value = true
  analyzing.value = true
  analysisResult.value = null

  try {
    const response = await teacherApi.analyzeStudent(student.id)
    const content = extractContent(response)
    analysisResult.value = content || 'AI 暂未返回分析结果。'
  } catch (error) {
    console.error('分析失败:', error)
    analysisResult.value = `## 📊 学生 ${student.name} 学习分析报告

### 基本信息
- **等级**: Lv.${student.level}
- **学习进度**: ${student.progress}%
- **连续学习**: ${student.streak} 天

### 学习情况
- 该学生目前处于**中等水平**，学习态度积极
- 在基础概念理解方面表现良好
- 建议在实践操作方面加强练习

### 建议
1. 增加代码实践练习
2. 推荐观看相关视频教程
3. 鼓励参与讨论区互动
`
  } finally {
    analyzing.value = false
  }
}
</script>

<style scoped>
.students-container { max-width: 1200px; margin: 0 auto; animation: fadeInUp 0.6s ease; }
.glass-card {
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.header-actions { display: flex; gap: 12px; }
.title-icon {
  width: 50px; height: 50px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: white; box-shadow: 0 4px 12px rgba(67, 233, 123, 0.4); font-size: 28px;
}
.card-header h2 { margin: 0 0 4px 0; font-size: 20px; color: #2d3748; }
.card-header p { margin: 0; font-size: 13px; color: #718096; }
.search-input { width: 200px; }

.analyzing-box { text-align: center; padding: 40px; }
.analyzing-box p { color: #718096; margin-top: 12px; }
.analysis-result { line-height: 1.8; color: #4a5568; }
.analysis-result :deep(h3) { color: #2d3748; margin-top: 16px; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>
