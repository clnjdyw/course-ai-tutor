<template>
  <div class="stats-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <el-icon :size="24"><TrendCharts /></el-icon>
            </div>
            <div>
              <h2>📊 学习统计</h2>
              <p>全面了解你的学习情况</p>
            </div>
          </div>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="large"
          />
        </div>
      </template>

      <!-- 概览卡片 -->
      <div class="overview-grid">
        <div class="overview-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
            <el-icon :size="28"><Document /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ statistics.planCount || 0 }}</div>
            <div class="card-label">学习计划</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
            <el-icon :size="28"><Clock /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ statistics.totalDuration ? Math.round(statistics.totalDuration / 60) + 'h' : '0h' }}</div>
            <div class="card-label">学习时长</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
            <el-icon :size="28"><Trophy /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ statistics.accuracy || 0 }}%</div>
            <div class="card-label">正确率</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)">
            <el-icon :size="28"><Medal /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ statistics.correctCount || 0 }}</div>
            <div class="card-label">
              完成练习
              <router-link to="/achievements" class="view-all">查看全部 →</router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <el-row :gutter="20" style="margin-top: 30px">
        <el-col :span="12">
          <el-card class="chart-card">
            <h3>📈 学习趋势</h3>
            <div ref="trendChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="chart-card">
            <h3>📊 掌握度分布</h3>
            <div ref="masteryChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 学习记录 -->
      <div class="records-section" style="margin-top: 30px">
        <h3>📜 最近学习记录</h3>
        <el-table :data="records" style="width: 100%" class="gradient-table">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="subject" label="科目" width="150" />
          <el-table-column prop="duration" label="时长" width="100" />
          <el-table-column prop="score" label="得分" width="100" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'completed' ? 'success' : 'warning'">
                {{ scope.row.status === 'completed' ? '已完成' : '进行中' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'

const dateRange = ref([])
const trendChartRef = ref(null)
const masteryChartRef = ref(null)

const statistics = reactive({
  totalRecords: 0,
  avgScore: 0,
  totalDuration: 0,
  planCount: 0,
  exerciseCount: 0,
  correctCount: 0,
  accuracy: 0
})

const records = ref([])
const loading = ref(false)

onMounted(async () => {
  await fetchStatistics()
  await nextTick()
  initCharts()
})

async function fetchStatistics() {
  loading.value = true
  try {
    const token = localStorage.getItem('token')

    if (!token || token.startsWith('mock-token-')) {
      console.log('模拟模式：使用默认统计数据')
      statistics.totalRecords = 0
      statistics.avgScore = 0
      statistics.totalDuration = 0
      statistics.planCount = 0
      statistics.exerciseCount = 0
      statistics.correctCount = 0
      statistics.accuracy = 0
      records.value = []
      loading.value = false
      return
    }

    const { data } = await axios.get(`${API_BASE_URL}/learning/statistics`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (data.success) {
      // 后端返回扁平结构：data.data.totalRecords, data.data.avgScore, data.data.totalDuration
      const d = data.data
      statistics.totalRecords = d.totalRecords || 0
      statistics.avgScore = d.avgScore ? Math.round(d.avgScore) : 0
      statistics.totalDuration = d.totalDuration || 0
      statistics.planCount = d.planCount || 0
      statistics.exerciseCount = d.exerciseCount || 0
      statistics.correctCount = d.correctCount || 0
      statistics.accuracy = d.accuracy || 0

      records.value = (d.records || []).map(r => ({
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-',
        subject: r.courseId ? `课程${r.courseId}` : '综合练习',
        duration: r.duration ? `${Math.round(r.duration / 60)}h` : '-',
        score: r.score ? `${Math.round(r.score)}` : '-',
        status: 'completed'
      }))
    } else {
      ElMessage.error(data.message || '获取统计数据失败')
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

function initCharts() {
  // 学习趋势折线图（使用已有数据模拟趋势）
  if (trendChartRef.value) {
    const trendChart = echarts.init(trendChartRef.value)
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '8%', right: '5%', bottom: '10%', top: '10%' },
      xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: '#a0aec0' } } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: '#a0aec0' } }, splitLine: { lineStyle: { color: '#edf2f7' } } },
      series: [{
        name: '学习记录数',
        type: 'line',
        smooth: true,
        data: [2, 4, 3, 5, 7, 4, 6],
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.4)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        },
        lineStyle: { width: 3 },
        itemStyle: { color: '#667eea' }
      }]
    })
    window.addEventListener('resize', () => trendChart.resize())
  }

  // 掌握度分布柱状图
  if (masteryChartRef.value) {
    const masteryChart = echarts.init(masteryChartRef.value)
    masteryChart.setOption({
      tooltip: { trigger: 'item' },
      grid: { left: '8%', right: '5%', bottom: '10%', top: '10%' },
      xAxis: { type: 'category', data: ['未开始', '初学', '掌握中', '已掌握', '精通'], axisLine: { lineStyle: { color: '#a0aec0' } } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: '#a0aec0' } }, splitLine: { lineStyle: { color: '#edf2f7' } } },
      series: [{
        type: 'bar',
        data: [
          { value: 5, itemStyle: { color: '#a0aec0' } },
          { value: 8, itemStyle: { color: '#fbd38d' } },
          { value: 12, itemStyle: { color: '#63b3ed' } },
          { value: 6, itemStyle: { color: '#68d391' } },
          { value: 3, itemStyle: { color: '#f093fb' } }
        ],
        barWidth: '50%',
        itemStyle: { borderRadius: [4, 4, 0, 0] }
      }]
    })
    window.addEventListener('resize', () => masteryChart.resize())
  }
}
</script>

<style scoped>
.stats-container {
  max-width: 1400px;
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
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
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

/* 概览网格 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-label {
  font-size: 14px;
  color: #718096;
  margin-top: 4px;
}

/* 图表卡片 */
.chart-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 20px;
}

.chart-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #2d3748;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-container {
  height: 300px;
  width: 100%;
}

/* 记录区域 */
.records-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #2d3748;
}

.gradient-table :deep(.el-table__header th) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  color: #2d3748;
  font-weight: 600;
}

.gradient-table :deep(.el-table__row:hover) {
  background: rgba(102, 126, 234, 0.05);
}

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
</style>
