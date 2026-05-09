<template>
  <div class="analytics-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon :size="24"><DataAnalysis /></el-icon>
            </div>
            <div>
              <h2>📈 数据分析</h2>
              <p>深入洞察你的学习数据</p>
            </div>
          </div>
          <el-select v-model="days" @change="fetchAll" style="width: 120px">
            <el-option :value="7" label="近7天" />
            <el-option :value="14" label="近14天" />
            <el-option :value="30" label="近30天" />
          </el-select>
        </div>
      </template>

      <!-- 概览卡片 -->
      <div class="overview-grid">
        <div class="overview-card" v-for="item in overviewCards" :key="item.label">
          <div class="card-icon" :style="{ background: item.color }">
            <el-icon :size="28"><component :is="item.icon" /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ item.value }}</div>
            <div class="card-label">{{ item.label }}</div>
          </div>
        </div>
      </div>

      <!-- 图表 -->
      <el-row :gutter="20" style="margin-top: 30px">
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { analyticsApi } from '@/api'

const days = ref(30)
const trendRef = ref(null)
const masteryRef = ref(null)
const weakRef = ref(null)
const growthRef = ref(null)
const charts = []

const overviewCards = reactive([
  { label: '总记录', value: 0, icon: 'Document', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { label: '平均分', value: 0, icon: 'TrendCharts', color: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { label: '练习数', value: 0, icon: 'Edit', color: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { label: '薄弱点', value: 0, icon: 'Warning', color: 'linear-gradient(135deg, #f6d365, #fda085)' }
])

async function fetchAll() {
  try {
    const [overview, trend, mastery, weak, growth] = await Promise.all([
      analyticsApi.getOverview().catch(() => null),
      analyticsApi.getTrend(days.value).catch(() => null),
      analyticsApi.getMasteryDistribution().catch(() => null),
      analyticsApi.getWeakPointsTrend().catch(() => null),
      analyticsApi.getGrowthCurve().catch(() => null)
    ])

    if (overview?.success) {
      const d = overview.data
      overviewCards[0].value = d.totalRecords || d.total || 0
      overviewCards[1].value = d.avgScore ? Math.round(d.avgScore) : 0
      overviewCards[2].value = d.exerciseCount || d.exercises || 0
      overviewCards[3].value = d.weakCount || d.weakPoints || 0
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
  if (!trendRef.value || !data) return
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
  if (!masteryRef.value || !data) return
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
  if (!weakRef.value || !data) return
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
  if (!growthRef.value || !data) return
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

onMounted(() => fetchAll())
onUnmounted(() => charts.forEach(c => c.dispose()))
</script>

<style scoped>
.analytics-container { max-width: 1400px; margin: 0 auto; animation: fadeInUp 0.6s ease; }
.glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
h2 { margin: 0 0 4px; font-size: 20px; color: #2d3748; }
p { margin: 0; font-size: 13px; color: #718096; }
.overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px; }
.overview-card { display: flex; align-items: center; gap: 16px; padding: 24px; background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(248,250,252,0.8)); border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); transition: all 0.3s; }
.overview-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.card-icon { width: 64px; height: 64px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
.card-value { font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.card-label { font-size: 14px; color: #718096; margin-top: 4px; }
.chart-card { background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; padding: 20px; }
.chart-card h3 { margin: 0 0 16px; font-size: 16px; color: #2d3748; }
.chart-box { height: 300px; width: 100%; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>
