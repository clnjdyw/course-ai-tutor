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
            <div class="card-value">12</div>
            <div class="card-label">学习计划</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
            <el-icon :size="28"><Clock /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">48h</div>
            <div class="card-label">学习时长</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
            <el-icon :size="28"><Trophy /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">85%</div>
            <div class="card-label">正确率</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)">
            <el-icon :size="28"><Medal /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">5</div>
            <div class="card-label">获得徽章</div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <el-row :gutter="20" style="margin-top: 30px">
        <el-col :span="12">
          <el-card class="chart-card">
            <h3>📈 学习趋势</h3>
            <div class="chart-placeholder">
              <el-empty description="学习时长趋势图" :image-size="150" />
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="chart-card">
            <h3>📊 科目分布</h3>
            <div class="chart-placeholder">
              <el-empty description="学科占比饼图" :image-size="150" />
            </div>
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
import { ref, reactive } from 'vue'

const dateRange = ref([])

const records = ref([
  { date: '2026-03-05', subject: 'Spring Boot', duration: '2h', score: '90', status: 'completed' },
  { date: '2026-03-04', subject: 'Vue 3', duration: '1.5h', score: '85', status: 'completed' },
  { date: '2026-03-03', subject: 'MySQL', duration: '2h', score: '88', status: 'completed' },
  { date: '2026-03-02', subject: 'Java', duration: '1h', score: '92', status: 'completed' }
])
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
