<template>
  <div class="teacher-dashboard">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon :size="24"><DataAnalysis /></el-icon>
            </div>
            <div>
              <h2>📊 数据总览</h2>
              <p>实时掌握教学全局</p>
            </div>
          </div>
          <el-button type="primary" @click="refreshData" :loading="loading" class="gradient-btn">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 概览卡片 -->
      <div class="overview-grid">
        <div class="overview-card" v-for="item in overviewCards" :key="item.label">
          <div class="card-icon" :style="{ background: item.color }">
            <span class="icon-emoji">{{ item.emoji }}</span>
          </div>
          <div class="card-info">
            <div class="card-value">{{ item.value }}</div>
            <div class="card-label">{{ item.label }}</div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <el-row :gutter="20" style="margin-top: 30px">
        <el-col :span="12">
          <el-card class="chart-card">
            <h3>📈 学生学习趋势</h3>
            <div ref="trendRef" class="chart-box"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <h3>📊 掌握度分布</h3>
            <div ref="masteryRef" class="chart-box"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 最近活跃学生 -->
      <el-card class="recent-card" style="margin-top: 20px">
        <template #header>
          <span>🔥 最近活跃学生</span>
        </template>
        <el-table :data="recentStudents" stripe style="width: 100%">
          <el-table-column prop="username" label="学生" width="150" />
          <el-table-column prop="progressCount" label="知识点进度" width="120" />
          <el-table-column prop="masteredCount" label="已掌握" width="100" />
          <el-table-column prop="avgScore" label="平均分" width="100">
            <template #default="{ row }">
              <el-tag :type="row.avgScore >= 80 ? 'success' : row.avgScore >= 60 ? 'warning' : 'danger'">
                {{ Math.round(row.avgScore || 0) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalRecords" label="学习记录数" />
        </el-table>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { teacherApi, analyticsApi } from '@/api'
import { Refresh, DataAnalysis } from '@element-plus/icons-vue'

const loading = ref(false)
const trendRef = ref(null)
const masteryRef = ref(null)
const charts = []
const recentStudents = ref([])

const overviewCards = reactive([
  { label: '学生总数', value: 0, emoji: '👥', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { label: '平均掌握度', value: '0%', emoji: '📈', color: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { label: '活跃学生', value: 0, emoji: '🔥', color: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { label: '薄弱知识点', value: 0, emoji: '⚠️', color: 'linear-gradient(135deg, #f6d365, #fda085)' }
])

async function refreshData() {
  loading.value = true
  try {
    const [studentsRes, overviewRes, trendRes, masteryRes] = await Promise.all([
      teacherApi.getStudents().catch(() => null),
      analyticsApi.getOverview().catch(() => null),
      analyticsApi.getTrend(30).catch(() => null),
      analyticsApi.getMasteryDistribution().catch(() => null)
    ])

    // axios interceptor 返回 response.data，所以 API 结果直接是 { success, data }
    if (studentsRes?.success) {
      const students = studentsRes.data || []
      recentStudents.value = students.slice(0, 10)
      overviewCards[0].value = studentsRes.count || students.length
      const activeCount = students.filter(s => (s.totalRecords || s.recordCount || 0) > 0).length
      overviewCards[2].value = activeCount
    }

    if (overviewRes?.success) {
      const d = overviewRes.data
      overviewCards[1].value = d.avgMastery != null ? `${Math.round(d.avgMastery * 100)}%` : (d.avgScore ? `${Math.round(d.avgScore)}%` : '0%')
      overviewCards[3].value = d.weakCount || d.weakPoints || 0
    }

    await nextTick()
    if (trendRes?.success) renderTrend(trendRes.data)
    if (masteryRes?.success) renderMastery(masteryRes.data)
  } catch (err) {
    console.error('获取教师数据失败:', err)
  } finally {
    loading.value = false
  }
}

function renderTrend(data) {
  if (!trendRef.value) return
  const chart = echarts.init(trendRef.value)
  charts.push(chart)
  const arr = Array.isArray(data) ? data : (data.trend || data.data || [])
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '8%', right: '5%', bottom: '10%', top: '10%' },
    xAxis: { type: 'category', data: arr.map(d => d.date || d.day || d.label) },
    yAxis: { type: 'value' },
    series: [{
      type: 'line', smooth: true,
      data: arr.map(d => d.count || d.value || d.records || 0),
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(102,126,234,0.4)' }, { offset: 1, color: 'rgba(102,126,234,0.05)' }]) },
      itemStyle: { color: '#667eea' }
    }]
  })
}

function renderMastery(data) {
  if (!masteryRef.value) return
  const chart = echarts.init(masteryRef.value)
  charts.push(chart)
  const arr = Array.isArray(data) ? data : (data.distribution || data.data || [])
  const colors = ['#a0aec0', '#fbd38d', '#63b3ed', '#68d391', '#f093fb']
  const labels = ['未开始', '初学', '掌握中', '已掌握', '精通']
  chart.setOption({
    tooltip: { trigger: 'item' },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value' },
    grid: { left: '8%', right: '5%', bottom: '10%', top: '10%' },
    series: [{
      type: 'bar',
      data: arr.map((v, i) => ({
        value: typeof v === 'number' ? v : (v.count || v.value || 0),
        itemStyle: { color: colors[i] || '#a0aec0' }
      })),
      barWidth: '50%',
      itemStyle: { borderRadius: [4, 4, 0, 0] }
    }]
  })
}

onMounted(refreshData)
onUnmounted(() => charts.forEach(c => c.dispose()))
</script>

<style scoped>
.teacher-dashboard { animation: fadeInUp 0.6s ease; }
.glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
.gradient-btn { background: linear-gradient(135deg, #667eea, #764ba2); border: none; }
h2 { margin: 0 0 4px; font-size: 20px; color: #2d3748; }
p { margin: 0; font-size: 13px; color: #718096; }
.overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.overview-card { display: flex; align-items: center; gap: 16px; padding: 24px; background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(248,250,252,0.8)); border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); transition: all 0.3s; }
.overview-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.card-icon { width: 64px; height: 64px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.icon-emoji { font-size: 28px; }
.card-value { font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.card-label { font-size: 14px; color: #718096; margin-top: 4px; }
.chart-card { background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; padding: 20px; }
.chart-card h3 { margin: 0 0 16px; font-size: 16px; color: #2d3748; }
.chart-box { height: 300px; width: 100%; }
.recent-card { background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>
