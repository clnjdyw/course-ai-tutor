<template>
  <div class="learning-paths-container">
    <!-- Header -->
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)">
              <el-icon :size="24"><Guide /></el-icon>
            </div>
            <div>
              <h2>学习路径</h2>
              <p>规划你的学习旅程</p>
            </div>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="fetchRecommend" :loading="loading" class="gradient-btn">
              <el-icon><MagicStick /></el-icon>
              智能推荐
            </el-button>
            <el-button type="success" @click="openCreateDialog" class="gradient-btn-create">
              <el-icon><Plus /></el-icon>
              新建路径
            </el-button>
          </div>
        </div>
      </template>

      <!-- Card grid -->
      <div v-if="paths.length > 0" class="paths-grid">
        <el-card v-for="path in paths" :key="path.id" class="path-card glass-card" shadow="hover">
          <div class="path-card-body">
            <div class="path-name">{{ path.name || '未命名路径' }}</div>
            <div class="path-meta">
              <el-tag v-if="path.status" size="small" :type="statusType(path.status)">
                {{ statusLabel(path.status) }}
              </el-tag>
              <span class="path-date">{{ formatDate(path.createdAt) }}</span>
            </div>
            <div v-if="path.progress !== undefined" class="path-progress-bar">
              <span class="progress-label">进度</span>
              <el-progress :percentage="Math.round(path.progress * 100)" :stroke-width="8" />
            </div>
            <div v-if="path.description" class="path-desc">{{ path.description }}</div>
          </div>
          <div class="path-card-actions">
            <el-button size="small" @click="openEditDialog(path)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(path)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </div>
        </el-card>
      </div>

      <el-empty v-else-if="!loading" description="暂无学习路径，点击「新建路径」或「智能推荐」创建" />
    </el-card>

    <!-- Create / Edit dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑学习路径' : '新建学习路径'"
      width="520px"
      @closed="resetForm"
    >
      <el-form :model="form" label-width="90px">
        <el-form-item label="路径名称">
          <el-input v-model="form.name" placeholder="输入路径名称" />
        </el-form-item>
        <el-form-item label="路径数据">
          <el-input
            v-model="form.pathData"
            type="textarea"
            :rows="8"
            placeholder='JSON 格式，例如: {"steps": [...]}'
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ editingId ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Guide, MagicStick, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { learningPathApi } from '@/api'

const loading = ref(false)
const paths = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const form = ref({ name: '', pathData: '', description: '' })

/* ---- CRUD operations ---- */

async function loadPaths() {
  loading.value = true
  try {
    const res = await learningPathApi.getList()
    if (res?.success) {
      paths.value = res.data?.records || res.data || []
    } else {
      paths.value = []
    }
  } catch (err) {
    console.error('加载学习路径失败:', err)
    ElMessage.error('加载学习路径失败')
    paths.value = []
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  editingId.value = null
  form.value = { name: '', pathData: '', description: '' }
  dialogVisible.value = true
}

function openEditDialog(path) {
  editingId.value = path.id
  form.value = {
    name: path.name || '',
    pathData: typeof path.pathData === 'string' ? path.pathData : JSON.stringify(path.pathData, null, 2),
    description: path.description || ''
  }
  dialogVisible.value = true
}

function resetForm() {
  form.value = { name: '', pathData: '', description: '' }
  editingId.value = null
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入路径名称')
    return
  }

  submitting.value = true
  try {
    const data = { name: form.value.name.trim(), description: form.value.description.trim() }

    // parse pathData JSON if provided
    if (form.value.pathData.trim()) {
      try {
        data.pathData = JSON.parse(form.value.pathData.trim())
      } catch {
        // send as raw string if not valid JSON
        data.pathData = form.value.pathData.trim()
      }
    }

    if (editingId.value) {
      const res = await learningPathApi.update(editingId.value, data)
      if (res?.success) {
        ElMessage.success('路径已更新')
      } else {
        ElMessage.warning(res?.message || '更新失败')
      }
    } else {
      const res = await learningPathApi.create(data)
      if (res?.success) {
        ElMessage.success('路径已创建')
      } else {
        ElMessage.warning(res?.message || '创建失败')
      }
    }
    dialogVisible.value = false
    await loadPaths()
  } catch (err) {
    console.error('保存路径失败:', err)
    ElMessage.error('保存路径失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(path) {
  try {
    await ElMessageBox.confirm(`确定要删除路径「${path.name}」吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return // cancelled
  }

  try {
    const res = await learningPathApi.delete(path.id)
    if (res?.success) {
      ElMessage.success('路径已删除')
      await loadPaths()
    } else {
      ElMessage.warning(res?.message || '删除失败')
    }
  } catch (err) {
    console.error('删除路径失败:', err)
    ElMessage.error('删除路径失败')
  }
}

async function fetchRecommend() {
  loading.value = true
  try {
    const res = await learningPathApi.recommend()
    if (res?.success) {
      ElMessage.success('智能推荐已生成')
      await loadPaths()
    } else {
      ElMessage.warning(res?.message || '获取推荐失败')
    }
  } catch (err) {
    console.error('获取推荐路径失败:', err)
    ElMessage.error('获取推荐路径失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

/* ---- helpers ---- */

function statusType(status) {
  const map = { active: 'success', completed: 'info', draft: '', archived: 'warning' }
  return map[String(status).toLowerCase()] || ''
}

function statusLabel(status) {
  const map = { active: '进行中', completed: '已完成', draft: '草稿', archived: '已归档' }
  return map[String(status).toLowerCase()] || status
}

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date)) return d
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/* ---- lifecycle ---- */
onMounted(loadPaths)
</script>

<style scoped>
.learning-paths-container { max-width: 1200px; margin: 0 auto; animation: fadeInUp 0.6s ease; }
.glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 16px; }

.card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.header-left { display: flex; align-items: center; gap: 16px; }
.header-actions { display: flex; gap: 8px; }
.title-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }

.gradient-btn { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); border: none; }
.gradient-btn-create { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); border: none; }

h2 { margin: 0 0 4px; font-size: 20px; color: #2d3748; }
p { margin: 0; font-size: 13px; color: #718096; }

/* card grid */
.paths-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 8px; }

.path-card { transition: transform 0.25s, box-shadow 0.25s; display: flex; flex-direction: column; }
.path-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }

.path-card-body { flex: 1; }
.path-name { font-weight: 700; font-size: 16px; color: #2d3748; margin-bottom: 8px; }
.path-meta { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.path-date { font-size: 12px; color: #a0aec0; }
.path-progress-bar { margin: 8px 0; }
.progress-label { font-size: 12px; color: #718096; display: block; margin-bottom: 4px; }
.path-desc { font-size: 13px; color: #718096; margin-top: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.path-card-actions { display: flex; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #edf2f7; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>
