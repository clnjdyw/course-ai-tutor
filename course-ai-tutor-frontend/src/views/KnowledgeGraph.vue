<template>
  <div class="knowledge-graph-container">
    <el-card class="header-card">
      <div class="header-content">
        <h2>知识图谱可视化</h2>
        <div class="controls">
          <el-select v-model="selectedCourse" placeholder="选择课程" @change="loadGraph">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.title"
              :value="course.id"
            />
          </el-select>
          <el-radio-group v-model="viewMode" @change="switchView">
            <el-radio-button label="tree">树形图</el-radio-button>
            <el-radio-button label="graph">图谱</el-radio-button>
          </el-radio-group>
          <el-button type="primary" @click="loadGraph" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button type="warning" @click="batchEvaluate" :loading="batchEvaluating">
            <el-icon><DataAnalysis /></el-icon>
            批量评估
          </el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="main-content">
      <el-col :span="viewMode === 'tree' ? 24 : 16">
        <el-card class="visualization-card">
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="viewMode === 'tree' ? 0 : 8" v-show="viewMode === 'graph'">
        <el-card class="statistics-card">
          <template #header>
            <div class="card-header">
              <span>统计信息</span>
            </div>
          </template>

          <div v-if="statistics" class="stats-content">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="知识点总数">
                {{ statistics.totalPoints }}
              </el-descriptions-item>
              <el-descriptions-item label="平均难度">
                {{ statistics.avgDifficulty }}
              </el-descriptions-item>
              <el-descriptions-item label="最大深度">
                {{ statistics.maxDepth }}
              </el-descriptions-item>
              <el-descriptions-item label="根知识点">
                {{ statistics.rootPoints }}
              </el-descriptions-item>
            </el-descriptions>

            <h4 class="section-title">掌握度分布</h4>
            <div v-if="statistics.mastery" class="mastery-stats">
              <el-progress
                :percentage="calculatePercentage(statistics.mastery.mastered, statistics.totalPoints)"
                color="#67C23A"
                :format="() => `已掌握 ${statistics.mastery.mastered}`"
              />
              <el-progress
                :percentage="calculatePercentage(statistics.mastery.learning, statistics.totalPoints)"
                color="#E6A23C"
                :format="() => `学习中 ${statistics.mastery.learning}`"
              />
              <el-progress
                :percentage="calculatePercentage(statistics.mastery.weak, statistics.totalPoints)"
                color="#F56C6C"
                :format="() => `薄弱 ${statistics.mastery.weak}`"
              />
              <el-progress
                :percentage="calculatePercentage(statistics.mastery.notStarted, statistics.totalPoints)"
                color="#909399"
                :format="() => `未学习 ${statistics.mastery.notStarted}`"
              />
            </div>

            <h4 class="section-title">难度分布</h4>
            <div class="difficulty-distribution">
              <el-tag
                v-for="(count, difficulty) in statistics.byDifficulty"
                :key="difficulty"
                :type="getDifficultyType(parseInt(difficulty))"
                size="large"
              >
                难度{{ difficulty }}: {{ count }}个
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showPointDetail" title="知识点详情" width="600px">
      <div v-if="selectedPoint" class="point-detail">
        <h3>{{ selectedPoint.title }}</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="难度">
            <el-rate v-model="selectedPoint.difficulty" disabled />
          </el-descriptions-item>
          <el-descriptions-item label="掌握度">
            <el-progress
              :percentage="Math.round((selectedPoint.mastery_level || 0) * 100)"
              :color="getMasteryColor(selectedPoint.mastery_level)"
            />
          </el-descriptions-item>
          <el-descriptions-item label="标签">
            <el-tag v-for="tag in selectedPoint.tags" :key="tag" size="small" class="tag-item">
              {{ tag }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述">
            {{ selectedPoint.description }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="actions">
          <el-button type="primary" @click="viewLearningPath" :loading="loadingPath">查看学习路径</el-button>
          <el-button @click="evaluateMastery">重新评估</el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showLearningPath" title="学习路径" width="700px">
      <div v-if="learningPathSteps.length > 0" class="learning-path-content">
        <p class="path-description">
          从当前知识点到目标知识点的学习路径，共 {{ learningPathSteps.length }} 步：
        </p>
        <el-timeline>
          <el-timeline-item
            v-for="(step, index) in learningPathSteps"
            :key="step.id"
            :timestamp="`第 ${index + 1} 步`"
            :color="getMasteryColor(step.mastery_level)"
            :hollow="index < learningPathSteps.length - 1"
          >
            <div class="path-step">
              <h4>{{ step.title }}</h4>
              <div class="step-meta">
                <el-tag size="small" type="info">难度 {{ step.difficulty }}</el-tag>
                <el-progress
                  :percentage="Math.round((step.mastery_level || 0) * 100)"
                  :color="getMasteryColor(step.mastery_level)"
                  :stroke-width="6"
                  style="flex: 1; margin-left: 10px; max-width: 200px"
                />
              </div>
              <p v-if="step.description" class="step-desc">{{ step.description }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
      <el-empty v-else description="暂无学习路径数据" />
    </el-dialog>

    <el-dialog v-model="showBatchResult" title="批量评估结果" width="800px">
      <div v-if="batchResult" class="batch-result">
        <el-alert
          :title="`课程整体掌握度: ${batchResult.overallAverage}%`"
          :type="batchResult.overallAverage >= 70 ? 'success' : batchResult.overallAverage >= 50 ? 'warning' : 'error'"
          :closable="false"
          show-icon
          class="mb-20"
        />

        <h4>各知识点评估详情</h4>
        <el-table :data="batchResult.points" stripe style="width: 100%" class="mb-20">
          <el-table-column prop="title" label="知识点" min-width="150" />
          <el-table-column label="难度" width="80" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.difficulty <= 2 ? 'success' : row.difficulty <= 3 ? 'warning' : 'danger'">
                {{ row.difficulty }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="掌握度" width="200">
            <template #default="{ row }">
              <el-progress
                :percentage="Math.round(row.mastery_level * 100)"
                :color="getMasteryColor(row.mastery_level)"
              />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.mastery_level >= 0.8 ? 'success' : row.mastery_level >= 0.5 ? 'warning' : 'danger'"
                size="small"
              >
                {{ row.mastery_level >= 0.8 ? '已掌握' : row.mastery_level >= 0.5 ? '学习中' : '薄弱' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="batchResult.weakPoints && batchResult.weakPoints.length > 0">
          <h4 class="weak-points-title">
            <el-icon><WarningFilled /></el-icon>
            薄弱知识点（需要重点复习）
          </h4>
          <el-tag
            v-for="point in batchResult.weakPoints"
            :key="point.id"
            type="danger"
            size="large"
            class="weak-tag"
          >
            {{ point.title }} ({{ Math.round(point.mastery_level * 100) }}%)
          </el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { Refresh, DataAnalysis, WarningFilled } from '@element-plus/icons-vue'
import { knowledgeGraphApi, knowledgeApi } from '@/api'

const router = useRouter()
const chartRef = ref(null)
const selectedCourse = ref(null)
const viewMode = ref('tree')
const loading = ref(false)
const showPointDetail = ref(false)
const selectedPoint = ref(null)
const courses = ref([{ id: 1, title: '默认课程' }])
const graphData = ref(null)
const statistics = ref(null)
const loadingPath = ref(false)
const showLearningPath = ref(false)
const learningPathSteps = ref([])
const batchEvaluating = ref(false)
const showBatchResult = ref(false)
const batchResult = ref(null)
let chartInstance = null

onMounted(async () => {
  initChart()
  await loadCourses()
  window.addEventListener('resize', handleResize)
})

async function loadCourses() {
  try {
    const res = await knowledgeApi.getCourses()
    if (res?.success && res.data?.length > 0) {
      courses.value = res.data
      selectedCourse.value = res.data[0].id
      loadGraph()
    }
  } catch {
    // fallback to default
    courses.value = [{ id: 1, title: '默认课程' }]
    selectedCourse.value = 1
    loadGraph()
  }
}

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

function initChart() {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.on('click', handleNodeClick)
  }
}

function handleResize() {
  if (chartInstance) {
    chartInstance.resize()
  }
}

async function loadGraph() {
  if (!selectedCourse.value) return
  
  loading.value = true
  try {
    if (viewMode.value === 'tree') {
      const response = await knowledgeGraphApi.getKnowledgeTree(selectedCourse.value)
      graphData.value = response.data
      renderTree(response.data.tree)
    } else {
      const response = await knowledgeGraphApi.getKnowledgeGraph(selectedCourse.value)
      graphData.value = response.data
      statistics.value = response.data.statistics
      renderGraph(response.data)
    }
  } catch (error) {
    ElMessage.error('加载知识图谱失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

function switchView() {
  loadGraph()
}

function renderTree(tree) {
  if (!chartInstance || !tree.length) return

  function convertToTreeData(nodes) {
    return nodes.map(node => ({
      name: node.title,
      value: node.mastery_level || 0,
      children: node.children && node.children.length > 0
        ? convertToTreeData(node.children)
        : undefined,
      itemStyle: {
        color: getMasteryColor(node.mastery_level)
      }
    }))
  }

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: (params) => {
        const mastery = params.data.value
        return `${params.name}<br/>掌握度: ${Math.round(mastery * 100)}%`
      }
    },
    series: [
      {
        type: 'tree',
        data: convertToTreeData(tree),
        top: '10%',
        left: '10%',
        bottom: '10%',
        right: '10%',
        symbolSize: 12,
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 14
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left'
          }
        },
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750
      }
    ]
  }

  chartInstance.setOption(option)
}

function renderGraph(data) {
  if (!chartInstance || !data.nodes.length) return

  const nodes = data.nodes.map(node => ({
    id: node.id.toString(),
    name: node.label,
    symbolSize: 30 + node.difficulty * 5,
    itemStyle: {
      color: node.mastery_level !== null
        ? getMasteryColor(node.mastery_level)
        : '#909399'
    },
    label: {
      show: true
    },
    category: node.category,
    mastery_level: node.mastery_level
  }))

  const edges = data.edges.map(edge => ({
    source: edge.from.toString(),
    target: edge.to.toString(),
    lineStyle: {
      color: edge.type === 'hierarchy' ? '#409EFF' : '#E6A23C',
      width: edge.type === 'hierarchy' ? 2 : 1,
      curveness: 0.3
    }
  }))

  const categories = [...new Set(nodes.map(n => n.category))]

  const option = {
    tooltip: {
      formatter: (params) => {
        if (params.dataType === 'node') {
          const mastery = params.data.mastery_level
          return `${params.name}<br/>掌握度: ${mastery !== null ? Math.round(mastery * 100) + '%' : '未学习'}`
        }
        return params.name
      }
    },
    legend: {
      data: categories,
      top: 10
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: edges,
        categories: categories.map(cat => ({ name: cat })),
        roam: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
          fontSize: 12
        },
        force: {
          repulsion: 300,
          edgeLength: 100,
          gravity: 0.1
        },
        lineStyle: {
          curveness: 0.3
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4
          }
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

function handleNodeClick(params) {
  if (params.dataType === 'node' || params.data.name) {
    const nodeData = params.data
    selectedPoint.value = {
      id: parseInt(nodeData.id),
      title: nodeData.name,
      difficulty: Math.round((nodeData.symbolSize - 30) / 5),
      mastery_level: nodeData.mastery_level,
      tags: [],
      description: '点击查看详情'
    }
    showPointDetail.value = true
  }
}

async function viewLearningPath() {
  if (!selectedPoint.value || !selectedCourse.value) return

  loadingPath.value = true
  try {
    const response = await knowledgeGraphApi.getLearningPath(selectedCourse.value, selectedPoint.value.id)
    if (response.data?.path && response.data.path.length > 0) {
      learningPathSteps.value = response.data.path
      showLearningPath.value = true
    } else {
      ElMessage.info('该知识点暂无学习路径，跳转到学习路径页面查看更多')
      router.push('/learning-paths')
    }
  } catch (error) {
    ElMessage.warning('获取学习路径失败: ' + error.message + '，跳转到学习路径页面')
    router.push('/learning-paths')
  } finally {
    loadingPath.value = false
  }
}

async function evaluateMastery() {
  if (!selectedPoint.value) return

  try {
    const response = await knowledgeGraphApi.evaluateMastery(selectedPoint.value.id)
    ElMessage.success(`掌握度评估完成: ${response.data.mastery_level}`)
    loadGraph()
  } catch (error) {
    ElMessage.error('评估失败: ' + error.message)
  }
}

async function batchEvaluate() {
  if (!selectedCourse.value) {
    ElMessage.warning('请先选择课程')
    return
  }

  batchEvaluating.value = true
  try {
    const response = await knowledgeGraphApi.evaluateCourseMastery(selectedCourse.value)
    const data = response.data

    // Normalize response into a consistent shape
    const points = data.points || data.results || []
    const overallAverage = data.overallAverage || data.average ||
      (points.length > 0
        ? Math.round(points.reduce((acc, p) => acc + (p.mastery_level || 0), 0) / points.length * 100)
        : 0)
    const weakPoints = data.weakPoints || data.weak_points ||
      points.filter(p => (p.mastery_level || 0) < 0.5)

    batchResult.value = {
      points,
      overallAverage,
      weakPoints
    }
    showBatchResult.value = true
    ElMessage.success('批量评估完成')
    loadGraph()
  } catch (error) {
    ElMessage.error('批量评估失败: ' + error.message)
  } finally {
    batchEvaluating.value = false
  }
}

function getMasteryColor(mastery) {
  if (mastery === null || mastery === undefined) return '#909399'
  if (mastery >= 0.8) return '#67C23A'
  if (mastery >= 0.5) return '#E6A23C'
  return '#F56C6C'
}

function getDifficultyType(difficulty) {
  if (difficulty <= 2) return 'success'
  if (difficulty <= 3) return 'warning'
  return 'danger'
}

function calculatePercentage(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}
</script>

<style scoped>
.knowledge-graph-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
}

.controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.visualization-card,
.statistics-card {
  height: 600px;
}

.chart-container {
  width: 100%;
  height: 100%;
}

.stats-content {
  padding: 10px;
}

.section-title {
  margin: 20px 0 10px;
  font-size: 16px;
  font-weight: bold;
}

.mastery-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.difficulty-distribution {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin-right: 5px;
}

.actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.point-detail h3 {
  margin-top: 0;
}

.learning-path-content {
  padding: 10px;
}

.path-description {
  color: #606266;
  margin-bottom: 20px;
}

.path-step h4 {
  margin: 0 0 8px;
}

.step-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.step-desc {
  color: #909399;
  font-size: 13px;
  margin: 0;
}

.batch-result {
  padding: 10px;
}

.mb-20 {
  margin-bottom: 20px;
}

.batch-result h4 {
  margin: 0 0 15px;
  font-size: 16px;
}

.weak-points-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 10px;
  font-size: 16px;
}

.weak-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>
