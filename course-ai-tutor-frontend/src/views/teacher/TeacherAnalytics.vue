<template>
  <div class="teacher-analytics">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)">
              <el-icon :size="24"><TrendCharts /></el-icon>
            </div>
            <div>
              <h2>📈 学情分析</h2>
              <p>多维度洞察学生学习数据</p>
            </div>
          </div>
          <el-select v-model="days" @change="fetchAll" style="width: 120px">
            <el-option :value="7" label="近7天" />
            <el-option :value="14" label="近14天" />
            <el-option :value="30" label="近30天" />
          </el-select>
        </div>
      </template>

      <!-- 图表 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="chart-card">
            <h3>📈 学习趋势</h3>
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

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-card class="chart-card">
            <h3>💪 薄弱点趋势</h3>
            <div ref="weakRef" class="chart-box"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <h3>🌱 成长曲线</h3>
            <div ref="growthRef" class="chart-box"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 学生排名 -->
      <el-card class="ranking-card" style="margin-top: 20px">
        <template #header>
          <span>🏆 学生掌握度排名</span>
        </template>
        <el-table :data="studentRanking" stripe>
          <el-table-column type="index" label="排名" width="80">
            <template #default="{ $index }">
              <span v-if="$index < 3" class="rank-badge">{{ ['🥇', '🥈', '🥉'][$index] }}</span>
              <span v-else>{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="学生" />
          <el-table-column prop="masteredCount" label="已掌握" width="100" sortable />
          <el-table-column prop="progressCount" label="总进度" width="100" />
          <el-table-column label="掌握率" width="120" sortable>
            <template #default="{ row }">
              <el-progress :percentage="row.progressCount ? Math.round(row.masteredCount / row.progressCount * 100) : 0" :stroke-width="8" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { analyticsApi, teacherApi } from '@/api'
import { TrendCharts } from '@element-plus/icons-vue'

const days = ref(30)
const trendRef = ref(null)
const masteryRef = ref(null)
const weakRef = ref(null)
const growthRef = ref(null)
const charts = []
const studentRanking = ref([])

async function fetchAll() {
  try {
    const [trend, mastery, weak, growth, students] = await Promise.all([
      analyticsApi.getTrend(days.value).catch(() => null),
      analyticsApi.getMasteryDistribution().catch(() => null),
      analyticsApi.getWeakPointsTrend().catch(() => null),
      analyticsApi.getGrowthCurve().catch(() => null),
      teacherApi.getStudents().catch(() => null)
    ])

    if (students?.success) {
      studentRanking.value = (students.data || [])
        .sort((a, b) => (b.masteredCount || 0) - (a.masteredCount || 0))
        .slice(0, 20)
    }

    await nextTick()
    if (trend?.success) renderTrend(trend.data)
    if (mastery?.success) renderMastery(mastery.data)
    if (weak?.success) renderWeak(weak.data)
    if (growth?.success) renderGrowth(growth.data)
  } catch (err) {
    console.error('获取分析数据失败:', err)
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
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(246,211,101,0.4)' }, { offset: 1, color: 'rgba(246,211,101,0.05)' }]) },
      itemStyle: { color: '#f6d365' }
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

function renderWeak(data) {
  if (!weakRef.value) return
  const chart = echarts.init(weakRef.value)
  charts.push(chart)
  const arr = Array.isArray(data) ? data : (data.trend || data.data || [])
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '8%', right: '5%', bottom: '10%', top: '10%' },
    xAxis: { type: 'category', data: arr.map(d => d.date || d.day || d.label) },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: arr.map(d => d.count || d.value || d.weakPoints || 0),
      itemStyle: { color: '#f5576c', borderRadius: [4, 4, 0, 0] }
    }]
  })
}

function renderGrowth(data) {
  if (!growthRef.value) return
  const chart = echarts.init(growthRef.value)
  charts.push(chart)
  const arr = Array.isArray(data) ? data : (data.curve || data.data || [])
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '8%', right: '5%', bottom: '10%', top: '10%' },
    xAxis: { type: 'category', data: arr.map(d => d.date || d.day || d.label) },
    yAxis: { type: 'value', name: '掌握度' },
    series: [{
      type: 'line', smooth: true,
      data: arr.map(d => d.mastery || d.score || d.value || 0),
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(67,233,123,0.4)' }, { offset: 1, color: 'rgba(67,233,123,0.05)' }]) },
      itemStyle: { color: '#43e97b' }
    }]
  })
}

onMounted(fetchAll)
onUnmounted(() => charts.forEach(c => c.dispose()))
</script>

<style scoped>
.teacher-analytics { animation: fadeInUp 0.6s ease; }
.glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
h2 { margin: 0 0 4px; font-size: 20px; color: #2d3748; }
p { margin: 0; font-size: 13px; color: #718096; }
.chart-card { background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; padding: 20px; }
.chart-card h3 { margin: 0 0 16px; font-size: 16px; color: #2d3748; }
.chart-box { height: 300px; width: 100%; }
.ranking-card { background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; }
.rank-badge { font-size: 20px; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>
