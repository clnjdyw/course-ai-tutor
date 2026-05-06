<template>
  <div class="teacher-vectordb">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <el-icon :size="24"><Coin /></el-icon>
            </div>
            <div>
              <h2>🗄️ 向量数据库管理</h2>
              <p>管理 RAG 知识库和文档</p>
            </div>
          </div>
          <div class="header-actions">
            <el-tag :type="ragOnline ? 'success' : 'danger'" effect="dark">
              {{ ragOnline ? 'RAG 服务在线' : 'RAG 服务离线' }}
            </el-tag>
            <el-button type="primary" @click="refreshAll" :loading="loading" class="gradient-btn">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalKnowledgeBases || 0 }}</div>
          <div class="stat-label">知识库</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalDocuments || 0 }}</div>
          <div class="stat-label">文档数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalChunks || 0 }}</div>
          <div class="stat-label">向量块</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.cacheHitRate || '0%' }}</div>
          <div class="stat-label">缓存命中率</div>
        </div>
      </div>

      <!-- 操作区 -->
      <el-tabs v-model="activeTab" style="margin-top: 20px">
        <!-- 知识库列表 -->
        <el-tab-pane label="知识库管理" name="kb">
          <div class="section-actions">
            <el-button type="primary" @click="showCreateKB = true" class="gradient-btn">
              <el-icon><Plus /></el-icon>
              创建知识库
            </el-button>
          </div>

          <el-table :data="knowledgeBases" stripe v-loading="loading" style="width: 100%; margin-top: 12px">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="名称" width="200" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="document_count" label="文档数" width="100" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="viewDocuments(row)">文档</el-button>
                <el-button size="small" type="danger" @click="deleteKB(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 文档管理 -->
        <el-tab-pane label="文档管理" name="docs">
          <div class="section-actions">
            <el-select v-model="selectedKB" placeholder="选择知识库" style="width: 200px" @change="fetchDocuments">
              <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
            </el-select>
            <el-button type="primary" @click="showAddDoc = true" :disabled="!selectedKB" class="gradient-btn">
              <el-icon><Plus /></el-icon>
              添加文档
            </el-button>
          </div>

          <el-table :data="documents" stripe v-loading="loadingDocs" style="width: 100%; margin-top: 12px">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" width="250" />
            <el-table-column prop="content" label="内容预览">
              <template #default="{ row }">
                {{ (row.content || '').substring(0, 100) }}{{ (row.content || '').length > 100 ? '...' : '' }}
              </template>
            </el-table-column>
            <el-table-column prop="chunk_count" label="分块数" width="100" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" type="danger" @click="deleteDocument(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 检索测试 -->
        <el-tab-pane label="检索测试" name="search">
          <div class="search-section">
            <el-input v-model="searchQuery" placeholder="输入检索内容..." @keyup.enter="doSearch" clearable>
              <template #append>
                <el-button @click="doSearch" :loading="searching">检索</el-button>
              </template>
            </el-input>

            <div v-if="searchResults.length > 0" class="search-results">
              <div v-for="(result, i) in searchResults" :key="i" class="result-item">
                <div class="result-header">
                  <span class="result-rank">#{{ i + 1 }}</span>
                  <el-tag size="small">相似度: {{ (result.score * 100).toFixed(1) }}%</el-tag>
                  <span class="result-source" v-if="result.source">来源: {{ result.source }}</span>
                </div>
                <div class="result-title">{{ result.title || '无标题' }}</div>
                <div class="result-content">{{ result.content || '' }}</div>
              </div>
            </div>
            <el-empty v-else-if="searched" description="未找到相关内容" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 创建知识库弹窗 -->
    <el-dialog v-model="showCreateKB" title="创建知识库" width="500px">
      <el-form :model="newKB" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="newKB.name" placeholder="知识库名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newKB.description" type="textarea" :rows="3" placeholder="描述知识库内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateKB = false">取消</el-button>
        <el-button type="primary" @click="createKB" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <!-- 添加文档弹窗 -->
    <el-dialog v-model="showAddDoc" title="添加文档" width="600px">
      <el-form :model="newDoc" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="newDoc.title" placeholder="文档标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="newDoc.content" type="textarea" :rows="8" placeholder="粘贴文档内容..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDoc = false">取消</el-button>
        <el-button type="primary" @click="addDocument" :loading="addingDoc">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ragApi } from '@/api'
import { Refresh, Plus, Coin } from '@element-plus/icons-vue'

const loading = ref(false)
const loadingDocs = ref(false)
const activeTab = ref('kb')
const ragOnline = ref(false)
const knowledgeBases = ref([])
const documents = ref([])
const selectedKB = ref(null)
const stats = reactive({ totalKnowledgeBases: 0, totalDocuments: 0, totalChunks: 0, cacheHitRate: '0%' })

const showCreateKB = ref(false)
const creating = ref(false)
const newKB = reactive({ name: '', description: '' })

const showAddDoc = ref(false)
const addingDoc = ref(false)
const newDoc = reactive({ title: '', content: '' })

const searchQuery = ref('')
const searchResults = ref([])
const searched = ref(false)
const searching = ref(false)

async function refreshAll() {
  loading.value = true
  try {
    const [kbRes, statsRes] = await Promise.all([
      ragApi.getKnowledgeBases().catch(() => null),
      ragApi.getStats().catch(() => null)
    ])

    ragOnline.value = !!kbRes || !!statsRes

    if (kbRes?.data?.success) {
      knowledgeBases.value = kbRes.data.data || []
      stats.totalKnowledgeBases = knowledgeBases.value.length
    }

    if (statsRes?.data?.success) {
      const d = statsRes.data.data || {}
      stats.totalDocuments = d.totalDocuments || d.documents || 0
      stats.totalChunks = d.totalChunks || d.chunks || 0
      stats.cacheHitRate = d.cacheHitRate || '0%'
    }
  } catch {
    ragOnline.value = false
  } finally {
    loading.value = false
  }
}

async function fetchDocuments() {
  if (!selectedKB.value) return
  loadingDocs.value = true
  try {
    const { data } = await ragApi.getDocuments(selectedKB.value)
    if (data?.success) {
      documents.value = data.data || []
    }
  } catch {
    documents.value = []
  } finally {
    loadingDocs.value = false
  }
}

function viewDocuments(kb) {
  selectedKB.value = kb.id
  activeTab.value = 'docs'
  fetchDocuments()
}

async function createKB() {
  if (!newKB.name) { ElMessage.warning('请输入名称'); return }
  creating.value = true
  try {
    const { data } = await ragApi.createKnowledgeBase(newKB)
    if (data?.success) {
      ElMessage.success('创建成功')
      showCreateKB.value = false
      newKB.name = ''; newKB.description = ''
      refreshAll()
    }
  } catch {
    ElMessage.error('创建失败')
  } finally {
    creating.value = false
  }
}

async function deleteKB(kb) {
  await ElMessageBox.confirm(`确定删除知识库「${kb.name}」？`, '确认')
  try {
    await ragApi.deleteKnowledgeBase(kb.id)
    ElMessage.success('已删除')
    refreshAll()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function addDocument() {
  if (!newDoc.title || !newDoc.content) { ElMessage.warning('请填写标题和内容'); return }
  addingDoc.value = true
  try {
    const { data } = await ragApi.addDocument({ ...newDoc, knowledgeBaseId: selectedKB.value })
    if (data?.success) {
      ElMessage.success('添加成功')
      showAddDoc.value = false
      newDoc.title = ''; newDoc.content = ''
      fetchDocuments()
    }
  } catch {
    ElMessage.error('添加失败')
  } finally {
    addingDoc.value = false
  }
}

async function deleteDocument(doc) {
  await ElMessageBox.confirm(`确定删除文档「${doc.title}」？`, '确认')
  try {
    await ragApi.deleteDocument(doc.id)
    ElMessage.success('已删除')
    fetchDocuments()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function doSearch() {
  if (!searchQuery.value.trim()) return
  searching.value = true
  searched.value = false
  try {
    const { data } = await ragApi.retrieve(searchQuery.value, selectedKB.value, 10)
    if (data?.success) {
      searchResults.value = data.data?.results || []
    }
    searched.value = true
  } catch {
    searchResults.value = []
    searched.value = true
  } finally {
    searching.value = false
  }
}

onMounted(refreshAll)
</script>

<style scoped>
.teacher-vectordb { animation: fadeInUp 0.6s ease; }
.glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.header-actions { display: flex; gap: 12px; align-items: center; }
.title-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
.gradient-btn { background: linear-gradient(135deg, #4facfe, #00f2fe); border: none; }
h2 { margin: 0 0 4px; font-size: 20px; color: #2d3748; }
p { margin: 0; font-size: 13px; color: #718096; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { padding: 20px; background: linear-gradient(135deg, rgba(79,172,254,0.1), rgba(0,242,254,0.1)); border-radius: 12px; text-align: center; border: 1px solid rgba(79,172,254,0.2); }
.stat-value { font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #4facfe, #00f2fe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stat-label { font-size: 13px; color: #718096; margin-top: 4px; }
.section-actions { display: flex; gap: 12px; align-items: center; }
.search-section { margin-top: 12px; }
.search-results { margin-top: 20px; display: flex; flex-direction: column; gap: 12px; }
.result-item { padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
.result-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.result-rank { font-weight: 700; color: #4facfe; font-size: 16px; }
.result-source { font-size: 12px; color: #a0aec0; }
.result-title { font-weight: 600; color: #2d3748; margin-bottom: 4px; }
.result-content { font-size: 13px; color: #718096; line-height: 1.6; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>
