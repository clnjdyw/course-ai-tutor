<template>
  <div class="teacher-students">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
              <el-icon :size="24"><User /></el-icon>
            </div>
            <div>
              <h2>👥 学生管理</h2>
              <p>查看和管理所有学生</p>
            </div>
          </div>
          <div class="header-actions">
            <el-input v-model="search" placeholder="搜索学生..." clearable style="width: 200px" />
            <el-button type="primary" @click="fetchStudents" :loading="loading" class="gradient-btn">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredStudents" stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="progressCount" label="知识点进度" width="120" sortable />
        <el-table-column prop="masteredCount" label="已掌握" width="100" sortable />
        <el-table-column prop="avgScore" label="平均分" width="100" sortable>
          <template #default="{ row }">
            <el-tag :type="row.avgScore >= 80 ? 'success' : row.avgScore >= 60 ? 'warning' : 'danger'" effect="dark">
              {{ Math.round(row.avgScore || 0) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalRecords" label="学习记录" width="100" sortable />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" type="warning" @click="analyzeStudent(row)">AI 分析</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="students.length === 0 && !loading" description="暂无学生数据" />
    </el-card>

    <!-- 学生详情弹窗 -->
    <el-dialog v-model="showDetail" :title="`学生详情 — ${currentStudent?.username || ''}`" width="700px">
      <div v-if="studentDetail" class="student-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">{{ studentDetail.student?.username }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ studentDetail.student?.email || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="等级">LV.{{ studentDetail.student?.level || 1 }}</el-descriptions-item>
          <el-descriptions-item label="经验值">{{ studentDetail.student?.experience || 0 }}</el-descriptions-item>
          <el-descriptions-item label="知识点进度">{{ studentDetail.progress?.length || 0 }} 个</el-descriptions-item>
          <el-descriptions-item label="学习记录">{{ studentDetail.records?.length || 0 }} 条</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px">最近学习记录</h4>
        <el-table :data="(studentDetail.records || []).slice(0, 10)" stripe size="small">
          <el-table-column prop="topic" label="主题" />
          <el-table-column prop="score" label="分数" width="80">
            <template #default="{ row }">
              <el-tag :type="row.score >= 80 ? 'success' : row.score >= 60 ? 'warning' : 'danger'" size="small">
                {{ row.score || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="时间" width="160">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
        </el-table>
      </div>
      <el-skeleton v-else :rows="5" animated />
    </el-dialog>

    <!-- AI 分析弹窗 -->
    <el-dialog v-model="showAnalysis" :title="`AI 学情分析 — ${currentStudent?.username || ''}`" width="700px">
      <div v-loading="analyzing" class="analysis-content">
        <div v-if="analysisResult" class="analysis-text" v-html="analysisResult"></div>
        <el-empty v-else-if="!analyzing" description="暂无分析结果" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { teacherApi } from '@/api'
import { Refresh, User } from '@element-plus/icons-vue'

const loading = ref(false)
const students = ref([])
const search = ref('')
const showDetail = ref(false)
const showAnalysis = ref(false)
const currentStudent = ref(null)
const studentDetail = ref(null)
const analyzing = ref(false)
const analysisResult = ref('')

const filteredStudents = computed(() => {
  if (!search.value) return students.value
  const q = search.value.toLowerCase()
  return students.value.filter(s => (s.username || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q))
})

async function fetchStudents() {
  loading.value = true
  try {
    const res = await teacherApi.getStudents()
    if (res?.success) {
      students.value = res.data || []
    }
  } catch (err) {
    console.error('获取学生列表失败:', err)
  } finally {
    loading.value = false
  }
}

async function viewDetail(student) {
  currentStudent.value = student
  showDetail.value = true
  studentDetail.value = null
  try {
    const res = await teacherApi.getStudent(student.id)
    if (res?.success) {
      studentDetail.value = res.data
    }
  } catch {
    ElMessage.error('获取学生详情失败')
  }
}

async function analyzeStudent(student) {
  currentStudent.value = student
  showAnalysis.value = true
  analyzing.value = true
  analysisResult.value = ''
  try {
    const res = await teacherApi.analyzeStudent(student.id, 'comprehensive')
    if (res?.success) {
      const d = res.data
      const content = d?.evaluation || d?.content || d?.message || (typeof d === 'string' ? d : JSON.stringify(d))
      analysisResult.value = content.replace(/\n/g, '<br/>')
    }
  } catch {
    analysisResult.value = '分析失败，请稍后重试'
  } finally {
    analyzing.value = false
  }
}

function formatDate(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}

onMounted(fetchStudents)
</script>

<style scoped>
.teacher-students { animation: fadeInUp 0.6s ease; }
.glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.header-actions { display: flex; gap: 12px; align-items: center; }
.title-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
.gradient-btn { background: linear-gradient(135deg, #43e97b, #38f9d7); border: none; }
h2 { margin: 0 0 4px; font-size: 20px; color: #2d3748; }
p { margin: 0; font-size: 13px; color: #718096; }
.student-detail h4 { color: #2d3748; }
.analysis-content { min-height: 200px; }
.analysis-text { line-height: 1.8; color: #2d3748; font-size: 14px; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>
