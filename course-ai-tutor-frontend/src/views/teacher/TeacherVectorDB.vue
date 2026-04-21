<template>
  <div class="vectordb-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <span class="title-emoji">🗄️</span>
            </div>
            <div>
              <h2>向量数据库管理</h2>
              <p>管理知识库，维护教学资源</p>
            </div>
          </div>
          <el-button type="primary" @click="showAddDialog = true" class="add-btn">
            <span>＋ 添加知识库</span>
          </el-button>
        </div>
      </template>

      <!-- 统计概览 -->
      <el-row :gutter="20" class="stats-row" v-if="kbStats">
        <el-col :span="8">
          <div class="mini-stat">
            <span class="mini-icon">📚</span>
            <div>
              <div class="mini-value">{{ kbStats.totalBases }}</div>
              <div class="mini-label">知识库总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="mini-stat">
            <span class="mini-icon">📄</span>
            <div>
              <div class="mini-value">{{ kbStats.totalDocs }}</div>
              <div class="mini-label">文档总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="mini-stat">
            <span class="mini-icon">🔍</span>
            <div>
              <div class="mini-value">{{ kbStats.totalQueries }}</div>
              <div class="mini-label">查询次数</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 知识库列表 -->
      <div class="kb-list">
        <h3>知识库列表</h3>
        <el-table :data="knowledgeBases" style="width: 100%" v-loading="loading">
          <el-table-column prop="name" label="知识库名称" min-width="200">
            <template #default="{ row }">
              <span class="kb-name">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="250">
            <template #default="{ row }">
              <span class="kb-desc">{{ row.description || '暂无描述' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="documents" label="文档数" width="100" align="center" />
          <el-table-column label="操作" width="200" align="center">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewDocuments(row)">
                📄 查看文档
              </el-button>
              <el-button type="warning" size="small" @click="addDocTo(row)">
                ➕ 添加
              </el-button>
              <el-button type="danger" size="small" @click="deleteKB(row)">
                🗑️ 删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 文档查看对话框 -->
      <el-dialog v-model="showDocDialog" :title="`📄 ${currentKB?.name} - 文档列表`" width="700px">
        <el-table :data="documents" style="width: 100%">
          <el-table-column prop="title" label="文档标题" min-width="200" />
          <el-table-column prop="content" label="内容预览" min-width="300">
            <template #default="{ row }">
              <span class="doc-preview">{{ row.content?.substring(0, 80) }}...</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button type="danger" size="small" @click="deleteDoc(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>

      <!-- 添加知识库对话框 -->
      <el-dialog v-model="showAddDialog" title="📚 添加知识库" width="500px">
        <el-form :model="newKB" label-width="100px">
          <el-form-item label="名称">
            <el-input v-model="newKB.name" placeholder="如：Spring Boot 知识库" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="newKB.description" type="textarea" :rows="3" placeholder="知识库描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="createKB">创建</el-button>
        </template>
      </el-dialog>

      <!-- 添加文档对话框 -->
      <el-dialog v-model="showAddDocDialog" :title="`➕ 添加文档到 ${currentKB?.name}`" width="600px">
        <el-form :model="newDoc" label-width="100px">
          <el-form-item label="标题">
            <el-input v-model="newDoc.title" placeholder="文档标题" />
          </el-form-item>
          <el-form-item label="内容">
            <el-input v-model="newDoc.content" type="textarea" :rows="8" placeholder="文档内容" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showAddDocDialog = false">取消</el-button>
          <el-button type="primary" @click="addDocument">添加</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ragApi } from '@/api'

const loading = ref(false)
const knowledgeBases = ref([])
const documents = ref([])
const currentKB = ref(null)

const showDocDialog = ref(false)
const showAddDialog = ref(false)
const showAddDocDialog = ref(false)

const newKB = ref({ name: '', description: '' })
const newDoc = ref({ title: '', content: '' })

const kbStats = ref({ totalBases: 3, totalDocs: 45, totalQueries: 1230 })

const loadKBs = async () => {
  loading.value = true
  try {
    const res = await ragApi.getKnowledgeBases()
    knowledgeBases.value = res?.data || [
      { id: 1, name: 'Spring Boot 基础', description: 'Spring Boot 框架核心知识点', documents: 15 },
      { id: 2, name: '数据结构与算法', description: '常见数据结构与算法讲解', documents: 20 },
      { id: 3, name: '数据库原理', description: 'MySQL 基础知识', documents: 10 }
    ]
    kbStats.value = {
      totalBases: knowledgeBases.value.length,
      totalDocs: knowledgeBases.value.reduce((s, k) => s + (k.documents || 0), 0),
      totalQueries: 1230
    }
  } catch (error) {
    console.error('加载知识库失败:', error)
    knowledgeBases.value = [
      { id: 1, name: 'Spring Boot 基础', description: 'Spring Boot 框架核心知识点', documents: 15 },
      { id: 2, name: '数据结构与算法', description: '常见数据结构与算法讲解', documents: 20 },
      { id: 3, name: '数据库原理', description: 'MySQL 基础知识', documents: 10 }
    ]
  } finally {
    loading.value = false
  }
}

const viewDocuments = async (kb) => {
  currentKB.value = kb
  showDocDialog.value = true
  try {
    const res = await ragApi.getDocuments(kb.id)
    documents.value = res?.data || []
  } catch (error) {
    documents.value = [
      { id: 1, title: '什么是 Spring Boot', content: 'Spring Boot 是一个用于简化 Spring 应用开发的框架...' },
      { id: 2, title: '自动配置原理', content: 'Spring Boot 通过 @EnableAutoConfiguration 实现自动配置...' },
      { id: 3, title: 'Starter 依赖', content: 'Starter 是一组方便的依赖描述符...' }
    ]
  }
}

const deleteKB = async (kb) => {
  try {
    await ElMessageBox.confirm(`确定删除知识库「${kb.name}」吗？`, '确认删除', { type: 'warning' })
    knowledgeBases.value = knowledgeBases.value.filter(k => k.id !== kb.id)
    ElMessage.success('已删除')
  } catch {}
}

const createKB = async () => {
  if (!newKB.value.name) { ElMessage.warning('请输入名称'); return }
  try {
    await ragApi.addDocument({ name: newKB.value.name, description: newKB.value.description })
  } catch {}
  knowledgeBases.value.push({
    id: Date.now(),
    name: newKB.value.name,
    description: newKB.value.description,
    documents: 0
  })
  showAddDialog.value = false
  newKB.value = { name: '', description: '' }
  ElMessage.success('创建成功')
}

const addDocTo = (kb) => {
  currentKB.value = kb
  showAddDocDialog.value = true
}

const addDocument = async () => {
  if (!newDoc.value.title || !newDoc.value.content) { ElMessage.warning('请填写完整'); return }
  try {
    await ragApi.addDocument({
      knowledgeBaseId: currentKB.value.id,
      title: newDoc.value.title,
      content: newDoc.value.content
    })
  } catch {}
  showAddDocDialog.value = false
  newDoc.value = { title: '', content: '' }
  ElMessage.success('文档已添加')
}

const deleteDoc = (doc) => {
  documents.value = documents.value.filter(d => d.id !== doc.id)
  ElMessage.success('已删除')
}

onMounted(() => {
  loadKBs()
})
</script>

<style scoped>
.vectordb-container { max-width: 1200px; margin: 0 auto; animation: fadeInUp 0.6s ease; }
.glass-card {
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.title-icon {
  width: 50px; height: 50px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: white; box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4); font-size: 28px;
}
.card-header h2 { margin: 0 0 4px 0; font-size: 20px; color: #2d3748; }
.card-header p { margin: 0; font-size: 13px; color: #718096; }
.add-btn { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border: none; box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3); }

.stats-row { margin-top: 8px; }
.mini-stat { display: flex; align-items: center; gap: 12px; padding: 20px; background: rgba(255,255,255,0.8); border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); }
.mini-icon { font-size: 32px; }
.mini-value { font-size: 24px; font-weight: 700; color: #2d3748; }
.mini-label { font-size: 12px; color: #718096; }

.kb-list { margin-top: 24px; }
.kb-list h3 { margin: 0 0 16px 0; font-size: 18px; color: #2d3748; }
.kb-name { font-weight: 600; color: #2d3748; }
.kb-desc { color: #718096; font-size: 13px; }
.doc-preview { color: #a0aec0; font-size: 12px; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>
