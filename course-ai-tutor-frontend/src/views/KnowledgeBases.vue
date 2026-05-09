<template>
  <div class="knowledge-bases-view">
    <!-- Main KB list view -->
    <template v-if="!currentKb">
      <el-card class="glass-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <div class="title-icon">
                <span class="icon-emoji">📚</span>
              </div>
              <div>
                <h2>📚 本地知识库</h2>
                <p>管理你的本地知识库与条目</p>
              </div>
            </div>
            <el-button type="primary" size="large" @click="showCreateDialog = true" class="gradient-btn">
              <span class="btn-emoji">✨</span>
              新建知识库
            </el-button>
          </div>
        </template>

        <div class="kb-grid">
          <el-card
            v-for="(kb, index) in knowledgeBases"
            :key="kb.id"
            class="kb-card"
            shadow="hover"
            :style="{ animationDelay: `${index * 0.1}s` }"
            @click="openKb(kb)"
          >
            <div class="kb-card-header">
              <h3>{{ kb.name }}</h3>
              <div class="kb-actions">
                <el-button type="primary" link size="large" @click.stop="editKb(kb)">✏️</el-button>
                <el-button type="danger" link size="large" @click.stop="deleteKb(kb.id)">🗑️</el-button>
              </div>
            </div>
            <p class="kb-description">{{ kb.description || '暂无描述' }}</p>
            <div class="kb-footer">
              <span class="kb-meta">📄 {{ kb.entry_count ?? kb.entryCount ?? 0 }} 条</span>
              <span class="kb-time">{{ formatDate(kb.created_at || kb.createdAt) }}</span>
            </div>
          </el-card>
        </div>

        <el-empty
          v-if="knowledgeBases.length === 0 && !loading"
          description="还没有知识库，点击上方按钮创建第一个吧！"
          :image-size="200"
        >
          <template #image>
            <div class="empty-illustration">
              <span class="empty-emoji">📚</span>
            </div>
          </template>
        </el-empty>

        <div v-if="loading" class="loading-text">加载中...</div>
      </el-card>
    </template>

    <!-- KB detail view -->
    <template v-else>
      <el-card class="glass-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <el-button class="back-btn gradient-btn" @click="closeKb" size="small">
                🔙 返回
              </el-button>
              <div>
                <h2>📖 {{ currentKb.name }}</h2>
                <p>{{ currentKb.description || '暂无描述' }}</p>
              </div>
            </div>
            <el-button type="primary" size="large" @click="showAddEntryDialog = true" class="gradient-btn">
              <span class="btn-emoji">➕</span>
              添加条目
            </el-button>
          </div>
        </template>

        <!-- Search bar -->
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索知识库中的条目..."
            clearable
            class="gradient-input search-input"
            @keyup.enter="searchEntries"
            @clear="loadEntries"
          >
            <template #append>
              <el-button @click="searchEntries" class="gradient-btn">🔍 搜索</el-button>
            </template>
          </el-input>
        </div>

        <!-- Entries list -->
        <div class="entries-list">
          <div
            v-for="(entry, index) in filteredEntries"
            :key="entry.id"
            class="entry-item"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <div class="entry-header">
              <h4>{{ entry.title }}</h4>
              <el-button type="danger" link size="small" @click="deleteEntry(entry.id)">🗑️</el-button>
            </div>
            <div class="entry-content">{{ truncateContent(entry.content, 150) }}</div>
            <div class="entry-footer">
              <el-tag v-if="entry.category" size="small" class="tag-item">{{ entry.category }}</el-tag>
              <template v-if="entry.tags">
                <el-tag
                  v-for="tag in parseTags(entry.tags)"
                  :key="tag"
                  size="small"
                  type="info"
                  class="tag-item"
                >{{ tag }}</el-tag>
              </template>
              <span class="entry-time">{{ formatDate(entry.created_at || entry.createdAt) }}</span>
            </div>
          </div>

          <el-empty
            v-if="filteredEntries.length === 0 && !entriesLoading"
            description="暂无条目，点击上方按钮添加"
            :image-size="120"
          />
          <div v-if="entriesLoading" class="loading-text">加载中...</div>
        </div>
      </el-card>
    </template>

    <!-- Create/Edit KB dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingKb ? '编辑知识库' : '新建知识库'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="kbForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="kbForm.name" placeholder="请输入知识库名称" class="gradient-input" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="kbForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述（可选）"
            class="gradient-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeKbDialog" class="reset-btn">取消</el-button>
        <el-button type="primary" @click="saveKb" class="gradient-btn">保存</el-button>
      </template>
    </el-dialog>

    <!-- Add entry dialog -->
    <el-dialog
      v-model="showAddEntryDialog"
      title="添加条目"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="entryForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="entryForm.title" placeholder="请输入条目标题" class="gradient-input" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="entryForm.content"
            type="textarea"
            :rows="8"
            placeholder="请输入条目内容"
            class="gradient-input"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="entryForm.category" placeholder="例如：基础知识、进阶" class="gradient-input" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="entryForm.tagsInput" placeholder="例如：Java, 集合, 泛型" class="gradient-input" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeEntryDialog" class="reset-btn">取消</el-button>
        <el-button type="primary" @click="saveEntry" class="gradient-btn">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { knowledgeBasesApi } from '@/api'

const knowledgeBases = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const editingKb = ref(null)
const kbForm = ref({
  name: '',
  description: ''
})

// Detail view state
const currentKb = ref(null)
const entries = ref([])
const entriesLoading = ref(false)
const searchQuery = ref('')
const showAddEntryDialog = ref(false)
const entryForm = ref({
  title: '',
  content: '',
  category: '',
  tagsInput: ''
})

const filteredEntries = computed(() => {
  return entries.value
})

onMounted(async () => {
  await loadKnowledgeBases()
})

async function loadKnowledgeBases() {
  loading.value = true
  try {
    const response = await knowledgeBasesApi.getList()
    knowledgeBases.value = response.data || []
  } catch (error) {
    console.error('加载知识库失败:', error)
  } finally {
    loading.value = false
  }
}

function openKb(kb) {
  currentKb.value = kb
  searchQuery.value = ''
  loadEntries()
}

function closeKb() {
  currentKb.value = null
  entries.value = []
  searchQuery.value = ''
}

async function loadEntries() {
  if (!currentKb.value) return
  entriesLoading.value = true
  try {
    const response = await knowledgeBasesApi.getEntries(currentKb.value.id)
    entries.value = response.data || []
  } catch (error) {
    console.error('加载条目失败:', error)
  } finally {
    entriesLoading.value = false
  }
}

async function searchEntries() {
  if (!currentKb.value || !searchQuery.value.trim()) {
    loadEntries()
    return
  }
  entriesLoading.value = true
  try {
    const response = await knowledgeBasesApi.search(currentKb.value.id, searchQuery.value)
    entries.value = response.data || []
  } catch (error) {
    console.error('搜索条目失败:', error)
    ElMessage.error('搜索失败')
  } finally {
    entriesLoading.value = false
  }
}

function editKb(kb) {
  editingKb.value = kb
  kbForm.value = {
    name: kb.name,
    description: kb.description || ''
  }
  showCreateDialog.value = true
}

async function saveKb() {
  if (!kbForm.value.name.trim()) {
    ElMessage.warning('请输入知识库名称')
    return
  }
  try {
    if (editingKb.value) {
      await knowledgeBasesApi.update(editingKb.value.id, kbForm.value)
      ElMessage.success('知识库已更新')
    } else {
      await knowledgeBasesApi.create(kbForm.value)
      ElMessage.success('知识库创建成功')
    }
    closeKbDialog()
    await loadKnowledgeBases()
  } catch (error) {
    console.error('保存知识库失败:', error)
    ElMessage.error('保存失败')
  }
}

async function deleteKb(id) {
  try {
    await ElMessageBox.confirm('确定要删除这个知识库吗？此操作不可撤销。', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await knowledgeBasesApi.delete(id)
    if (currentKb.value && currentKb.value.id === id) {
      closeKb()
    }
    await loadKnowledgeBases()
    ElMessage.success('知识库已删除')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除知识库失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

function closeKbDialog() {
  showCreateDialog.value = false
  editingKb.value = null
  kbForm.value = { name: '', description: '' }
}

async function saveEntry() {
  if (!entryForm.value.title.trim()) {
    ElMessage.warning('请输入条目标题')
    return
  }
  if (!entryForm.value.content.trim()) {
    ElMessage.warning('请输入条目内容')
    return
  }
  const tags = entryForm.value.tagsInput
    ? entryForm.value.tagsInput.split(',').map(t => t.trim()).filter(t => t)
    : []
  try {
    await knowledgeBasesApi.addEntry(currentKb.value.id, {
      title: entryForm.value.title,
      content: entryForm.value.content,
      category: entryForm.value.category,
      tags
    })
    closeEntryDialog()
    await loadEntries()
    ElMessage.success('条目添加成功')
  } catch (error) {
    console.error('添加条目失败:', error)
    ElMessage.error('添加失败')
  }
}

async function deleteEntry(entryId) {
  try {
    await ElMessageBox.confirm('确定要删除这个条目吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await knowledgeBasesApi.deleteEntry(currentKb.value.id, entryId)
    await loadEntries()
    ElMessage.success('条目已删除')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除条目失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

function closeEntryDialog() {
  showAddEntryDialog.value = false
  entryForm.value = { title: '', content: '', category: '', tagsInput: '' }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

function parseTags(tagsStr) {
  if (!tagsStr) return []
  if (Array.isArray(tagsStr)) return tagsStr
  try {
    return JSON.parse(tagsStr)
  } catch {
    return tagsStr.split(',').map(t => t.trim()).filter(t => t)
  }
}

function truncateContent(content, maxLen) {
  if (!content) return ''
  const text = content.replace(/<[^>]*>/g, '')
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}
</script>

<style scoped>
.knowledge-bases-view {
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

.back-btn {
  padding: 8px 16px;
}

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

.search-bar {
  margin-bottom: 24px;
}

.search-input :deep(.el-input-group__append) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0 12px 12px 0;
}

.search-input :deep(.el-input-group__append .el-button) {
  background: transparent;
  border: none;
  color: white;
  box-shadow: none;
}

/* KB cards grid */
.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.kb-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease both;
  cursor: pointer;
}

.kb-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.kb-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.kb-card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2d3748;
}

.kb-actions {
  display: flex;
  gap: 4px;
}

.kb-description {
  color: #374151;
  line-height: 1.5;
  margin: 0 0 15px 0;
  max-height: 80px;
  overflow: hidden;
  font-size: 14px;
}

.kb-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.kb-meta {
  font-weight: 500;
}

.kb-time {
  color: #9ca3af;
}

/* Entries list */
.entries-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-item {
  padding: 16px;
  background: rgba(102, 126, 234, 0.04);
  border-radius: 12px;
  border-left: 3px solid #667eea;
  animation: fadeInUp 0.4s ease both;
  transition: all 0.3s ease;
}

.entry-item:hover {
  background: rgba(102, 126, 234, 0.08);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.entry-header h4 {
  margin: 0;
  font-size: 16px;
  color: #2d3748;
}

.entry-content {
  color: #374151;
  line-height: 1.6;
  margin-bottom: 10px;
  font-size: 14px;
}

.entry-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.entry-time {
  margin-left: auto;
  font-size: 12px;
  color: #9ca3af;
}

.tag-item {
  border-radius: 6px;
}

.empty-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}

.empty-emoji {
  font-size: 80px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.loading-text {
  text-align: center;
  padding: 24px;
  color: #718096;
  font-size: 14px;
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
