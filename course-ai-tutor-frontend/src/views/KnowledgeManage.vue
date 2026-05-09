<template>
  <div class="knowledge-manage-view">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon">
              <span class="icon-emoji">&#x1f4da;</span>
            </div>
            <div>
              <h2>&#x1f4da; 知识点管理</h2>
              <p>管理和维护课程知识点体系</p>
            </div>
          </div>
          <el-button type="primary" size="large" @click="openCreateDialog" class="gradient-btn">
            <span class="btn-emoji">&#x2728;</span>
            新建知识点
          </el-button>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-select
          v-model="filters.courseId"
          placeholder="选择课程"
          clearable
          class="filter-item gradient-input"
          @change="handleFilterChange"
        >
          <el-option
            v-for="course in courses"
            :key="course.id"
            :label="course.name"
            :value="course.id"
          />
        </el-select>

        <el-select
          v-model="filters.difficulty"
          placeholder="难度"
          clearable
          class="filter-item gradient-input"
          @change="handleFilterChange"
        >
          <el-option label="&#x2b50; 简单" :value="1" />
          <el-option label="&#x2b50;&#x2b50; 中等" :value="2" />
          <el-option label="&#x2b50;&#x2b50;&#x2b50; 困难" :value="3" />
        </el-select>

        <el-input
          v-model="filters.keyword"
          placeholder="搜索知识点..."
          clearable
          class="filter-item search-input gradient-input"
          @keyup.enter="handleFilterChange"
          @clear="handleFilterChange"
        >
          <template #prefix>
            <span>&#x1f50d;</span>
          </template>
        </el-input>

        <el-button type="primary" @click="handleFilterChange" class="gradient-btn">
          搜索
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table
        :data="knowledgePoints"
        v-loading="loading"
        stripe
        style="width: 100%; margin-top: 16px;"
        row-key="id"
        class="gradient-table"
      >
        <el-table-column prop="title" label="标题" min-width="180">
          <template #default="{ row }">
            <span class="point-title">{{ row.title }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="course_name" label="所属课程" width="140">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ row.course_name || '-' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="difficulty" label="难度" width="100" align="center">
          <template #default="{ row }">
            <span class="difficulty-stars">
              <span v-for="i in 3" :key="i" :class="['star', { active: i <= (row.difficulty || 0) }]">&#x2b50;</span>
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <span class="truncated-text">{{ truncate(row.description, 60) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="tags" label="标签" width="160">
          <template #default="{ row }">
            <el-tag
              v-for="tag in parseTags(row.tags)"
              :key="tag"
              size="small"
              class="tag-item"
              effect="plain"
            >{{ tag }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)" size="small">&#x270f;&#xfe0f; 编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)" size="small">&#x1f5d1;&#xfe0f; 删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="loadData"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="editingPoint ? '编辑知识点' : '新建知识点'"
      width="650px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入知识点标题" class="gradient-input" />
        </el-form-item>

        <el-form-item label="所属课程">
          <el-select v-model="form.course_id" placeholder="选择课程" class="gradient-input" style="width: 100%;">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="难度">
          <el-select v-model="form.difficulty" placeholder="选择难度" class="gradient-input" style="width: 100%;">
            <el-option label="&#x2b50; 简单" :value="1" />
            <el-option label="&#x2b50;&#x2b50; 中等" :value="2" />
            <el-option label="&#x2b50;&#x2b50;&#x2b50; 困难" :value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="简要描述" class="gradient-input" />
        </el-form-item>

        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="详细内容" class="gradient-input" />
        </el-form-item>

        <el-form-item label="标签">
          <el-input v-model="form.tagsInput" placeholder="多个标签用逗号分隔" class="gradient-input" />
        </el-form-item>

        <el-form-item label="父知识点">
          <el-select v-model="form.parent_id" placeholder="可选，用于构建层级关系" clearable class="gradient-input" style="width: 100%;">
            <el-option
              v-for="point in parentOptions"
              :key="point.id"
              :label="point.title"
              :value="point.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog" class="reset-btn">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving" class="gradient-btn">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { knowledgeApi } from '@/api'

const knowledgePoints = ref([])
const courses = ref([])
const parentOptions = ref([])
const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const editingPoint = ref(null)

const filters = reactive({
  courseId: '',
  difficulty: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const form = reactive({
  title: '',
  course_id: '',
  difficulty: 1,
  description: '',
  content: '',
  tagsInput: '',
  parent_id: ''
})

onMounted(async () => {
  await loadCourses()
  await loadData()
})

async function loadCourses() {
  try {
    const res = await knowledgeApi.getCourses()
    courses.value = res.data || []
  } catch (error) {
    console.error('加载课程列表失败:', error)
  }
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize
    }
    if (filters.courseId) params.courseId = filters.courseId
    if (filters.difficulty) params.difficulty = filters.difficulty
    if (filters.keyword) params.keyword = filters.keyword

    const res = await knowledgeApi.getList(params)
    const data = res.data || {}
    knowledgePoints.value = data.list || data.records || data || []
    pagination.total = data.total || data.count || knowledgePoints.value.length
  } catch (error) {
    console.error('加载知识点失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function loadParentOptions() {
  try {
    const params = {}
    if (filters.courseId) params.courseId = filters.courseId
    const res = await knowledgeApi.getList(params)
    const data = res.data || {}
    const list = data.list || data.records || data || []
    parentOptions.value = list.map(item => ({ id: item.id, title: item.title }))
  } catch (error) {
    console.error('加载父知识点选项失败:', error)
  }
}

function handleFilterChange() {
  pagination.page = 1
  loadData()
}

function handleSizeChange() {
  pagination.page = 1
  loadData()
}

function openCreateDialog() {
  editingPoint.value = null
  resetForm()
  loadParentOptions()
  showDialog.value = true
}

function openEditDialog(row) {
  editingPoint.value = row
  loadParentOptions()
  showDialog.value = true

  const tags = parseTags(row.tags)
  form.title = row.title || ''
  form.course_id = row.course_id || ''
  form.difficulty = row.difficulty || 1
  form.description = row.description || ''
  form.content = row.content || ''
  form.tagsInput = tags.join(', ')
  form.parent_id = row.parent_id || ''
}

function resetForm() {
  form.title = ''
  form.course_id = ''
  form.difficulty = 1
  form.description = ''
  form.content = ''
  form.tagsInput = ''
  form.parent_id = ''
}

function closeDialog() {
  showDialog.value = false
  editingPoint.value = null
  resetForm()
}

async function handleSave() {
  if (!form.title.trim()) {
    ElMessage.warning('请输入知识点标题')
    return
  }

  const tags = form.tagsInput
    ? form.tagsInput.split(',').map(t => t.trim()).filter(t => t)
    : []

  const data = {
    title: form.title,
    description: form.description,
    content: form.content,
    tags,
    difficulty: form.difficulty
  }

  if (form.course_id) data.course_id = form.course_id
  if (form.parent_id) data.parent_id = form.parent_id

  saving.value = true
  try {
    if (editingPoint.value) {
      await knowledgeApi.update(editingPoint.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await knowledgeApi.create(data)
      ElMessage.success('创建成功')
    }
    closeDialog()
    await loadData()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除知识点「${row.title}」吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await knowledgeApi.delete(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

function parseTags(tagsStr) {
  if (!tagsStr) return []
  try {
    const parsed = JSON.parse(tagsStr)
    return Array.isArray(parsed) ? parsed : [String(tagsStr)]
  } catch {
    if (typeof tagsStr === 'string') {
      return tagsStr.split(',').map(t => t.trim()).filter(t => t)
    }
    return []
  }
}

function truncate(str, maxLen) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str
}
</script>

<style scoped>
.knowledge-manage-view {
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
  transition: all 0.3s ease;
}

.glass-card:hover {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  font-size: 28px;
}

.icon-emoji {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
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

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 16px 0;
}

.filter-item {
  min-width: 160px;
}

.search-input {
  min-width: 220px;
}

/* 渐变输入框 */
.gradient-input :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
}

.gradient-input :deep(.el-input__wrapper:hover),
.gradient-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.gradient-input :deep(textarea.el-textarea__inner) {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  border: none;
  box-shadow: none;
}

/* 渐变按钮 */
.gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  border-radius: 12px;
  font-weight: 600;
}

.gradient-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
}

.reset-btn {
  background: rgba(102, 126, 234, 0.1);
  border: 2px solid rgba(102, 126, 234, 0.3);
  color: #667eea;
  border-radius: 12px;
}

.reset-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}

.btn-emoji {
  font-size: 20px;
  margin-right: 4px;
}

/* 表格样式 */
.gradient-table {
  border-radius: 12px;
  overflow: hidden;
}

.gradient-table :deep(.el-table__header-wrapper th) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  color: #2d3748;
  font-weight: 600;
}

.gradient-table :deep(.el-table__row:hover) {
  background: rgba(102, 126, 234, 0.04);
}

.point-title {
  color: #2d3748;
  font-weight: 500;
}

.truncated-text {
  color: #6b7280;
  font-size: 13px;
}

.difficulty-stars {
  font-size: 12px;
}

.star {
  opacity: 0.2;
}

.star.active {
  opacity: 1;
}

.tag-item {
  border-radius: 6px;
  margin-right: 4px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 16px;
}

.pagination-wrapper :deep(.el-pagination.is-background .btn-next),
.pagination-wrapper :deep(.el-pagination.is-background .btn-prev),
.pagination-wrapper :deep(.el-pagination.is-background .el-pager li) {
  border-radius: 8px;
}

.pagination-wrapper :deep(.el-pagination.is-background .el-pager li.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 动画 */
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
